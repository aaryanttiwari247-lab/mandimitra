"use client";

import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Printer,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Ticket,
  Truck,
  Users,
  Wheat,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getFarmerSession, FarmerUser } from "@/lib/farmer-auth";
import { formatINR, getCropMspData } from "@/lib/msp-rates";
import { subscribeProcurementUpdates, ProcurementSyncMessage } from "@/lib/cross-tab-sync";
import { matchesBookingIdentifier, normalizeTokenClean } from "@/lib/procurement-store";
import { Booking, BookingStatus } from "@/lib/types";

type DisplayStatus =
  | "WAITING"
  | "CALLED"
  | "VERIFIED"
  | "PROCESSING"
  | "COMPLETED";

const belongsToFarmer = (b: Booking | null, farmer: FarmerUser | null): boolean => {
  if (!b || !farmer) return false;
  if (b.farmerMobile && farmer.mobile && String(b.farmerMobile) === String(farmer.mobile)) return true;
  if (
    b.farmerId &&
    (b.farmerId === farmer.farmerId ||
      b.farmerId === farmer.farmerCode ||
      b.farmerId === `FMR${farmer.mobile.slice(-4)}`)
  ) {
    return true;
  }
  return false;
};

function TrackTokenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
  const { t } = useLanguage();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [quickTokens, setQuickTokens] = useState<Array<{ token: string; name: string; crop: string }>>([]);

  // ============================================================
  // LOAD QUICK SUGGESTIONS FOR EASY SWITCHING
  // ============================================================
  useEffect(() => {
    try {
      const qRaw = localStorage.getItem("smartProcurementQueue");
      if (qRaw) {
        const parsed = JSON.parse(qRaw);
        if (Array.isArray(parsed)) {
          const suggestions = parsed.slice(0, 6).map((b) => ({
            token: String(b.token || `A${b.tokenNumber || "101"}`).replace(/^#/, ""),
            name: b.farmerName || "Farmer",
            crop: b.crop || "Produce",
          }));
          setQuickTokens(suggestions);
          return;
        }
      }
    } catch {}
    setQuickTokens([
      { token: "A101", name: "Rameshwar Singh", crop: "Wheat" },
      { token: "A102", name: "Harish Patel", crop: "Paddy" },
      { token: "A105", name: "Gurpreet Singh", crop: "Mustard" },
    ]);
  }, []);

  // ============================================================
  // LOAD BOOKING (STRICT TOKEN MATCHING — NO STRANGER FALLBACKS)
  // ============================================================
  const loadBooking = useCallback(async () => {
    setLoading(true);
    setSearchError("");

    try {
      const farmer = getFarmerSession();
      const cleanTokenParam = normalizeTokenClean(tokenParam);

      const queueData = localStorage.getItem("smartProcurementQueue");
      const currentBookingData = localStorage.getItem("smartProcurementBooking");

      let queue: Booking[] = [];
      if (queueData) {
        try {
          const parsed = JSON.parse(queueData);
          if (Array.isArray(parsed)) queue = parsed;
        } catch {
          queue = [];
        }
      }

      let currentBooking: Booking | null = null;
      if (currentBookingData) {
        try {
          currentBooking = JSON.parse(currentBookingData);
        } catch {
          currentBooking = null;
        }
      }

      let foundBooking: Booking | null = null;

      // 1. If explicit token requested in URL (?token=...)
      if (cleanTokenParam) {
        // Check currentBooking first if matched
        if (matchesBookingIdentifier(currentBooking, cleanTokenParam)) {
          foundBooking = currentBooking;
        } else {
          // Search local queue
          foundBooking = queue.find((item) => matchesBookingIdentifier(item, cleanTokenParam)) ?? null;
        }

        // Live server query for requested token
        try {
          const res = await fetch(`/api/bookings/track/${encodeURIComponent(cleanTokenParam)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.booking) {
              foundBooking = data.booking;
            }
          }
        } catch (fetchErr) {
          console.warn("Live token tracking fetch error:", fetchErr);
        }

        if (!foundBooking) {
          setSearchError(`Token "#${cleanTokenParam}" was not found. Please verify the token number.`);
          setBooking(null);
          setLoading(false);
          return;
        }
      }

      // 2. If NO token specified in URL, strictly look up the LOGGED-IN FARMER'S booking
      if (!cleanTokenParam && farmer) {
        if (currentBooking && belongsToFarmer(currentBooking, farmer)) {
          foundBooking = currentBooking;
        } else {
          const farmerBookings = queue.filter((item) => belongsToFarmer(item, farmer));
          if (farmerBookings.length > 0) {
            foundBooking =
              [...farmerBookings].sort(
                (a, b) =>
                  new Date(b.createdAt ?? 0).getTime() -
                  new Date(a.createdAt ?? 0).getTime()
              )[0] ?? null;
          }
        }

        // Also query server queue for this farmer's phone
        if (!foundBooking && farmer.mobile) {
          try {
            const res = await fetch(`/api/bookings/track/${encodeURIComponent(farmer.mobile)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.booking) {
                foundBooking = data.booking;
              }
            }
          } catch {}
        }
      }

      // 3. Fallback to currentBooking ONLY if no farmer session or belongs to farmer
      if (!foundBooking && !cleanTokenParam && currentBooking) {
        if (!farmer || belongsToFarmer(currentBooking, farmer)) {
          foundBooking = currentBooking;
        }
      }

      // If still nothing found, do NOT assign a random booking from queue!
      if (foundBooking) {
        setBooking(foundBooking);
        setLastUpdated(new Date());

        // Cache for this session
        try {
          localStorage.setItem("smartProcurementBooking", JSON.stringify(foundBooking));
        } catch {}
      } else {
        setBooking(null);
      }
    } catch (error) {
      console.error("Unable to load procurement booking:", error);
    } finally {
      setLoading(false);
    }
  }, [tokenParam]);

  // ============================================================
  // REAL-TIME BROADCAST CHANNEL & STORAGE SYNC
  // ============================================================
  useEffect(() => {
    loadBooking();

    // 1. Instant zero-latency cross-tab sync via BroadcastChannel
    const unsubscribe = subscribeProcurementUpdates((msg: ProcurementSyncMessage) => {
      if (msg.type === "STATUS_UPDATED" && msg.booking) {
        const bPayload = msg.booking;
        const msgToken = normalizeTokenClean(msg.token || bPayload.token || msg.bookingId || bPayload.bookingId);
        setBooking((prev) => {
          if (!prev) return prev;
          const currentTracked = normalizeTokenClean(prev.token || prev.bookingId || tokenParam);
          if (matchesBookingIdentifier(prev, msgToken) || currentTracked === msgToken) {
            const updated: Booking = {
              ...prev,
              ...bPayload,
              status: (msg.status || bPayload.status || prev.status) as any,
              queueStatus: (msg.status || bPayload.queueStatus || prev.queueStatus) as any,
              procurementStatus: (msg.status || bPayload.procurementStatus || prev.procurementStatus) as any,
              updatedAt: msg.timestamp || new Date().toISOString(),
            };
            try {
              localStorage.setItem("smartProcurementBooking", JSON.stringify(updated));
            } catch {}
            setLastUpdated(new Date());
            return updated;
          }
          return prev;
        });
      }
    });

    // 2. Storage event listener (when other tabs write to localStorage)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "smartProcurementQueue" || event.key === "smartProcurementBooking") {
        loadBooking();
      }
    };

    window.addEventListener("storage", handleStorage);

    // 3. Polite background polling every 10s (only when visible)
    const interval = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadBooking();
      }
    }, 10000);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(interval);
    };
  }, [loadBooking, tokenParam]);

  // ============================================================
  // SEARCH / SWITCH TOKEN HANDLER
  // ============================================================
  const handleSearchToken = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeTokenClean(searchInput);
    if (!clean) return;

    setSearching(true);
    setSearchError("");
    router.push(`/farmer/track-token?token=${encodeURIComponent(clean)}`);
    setSearching(false);
  };

  const handleQuickSwitch = (token: string) => {
    setSearchInput(token);
    router.push(`/farmer/track-token?token=${encodeURIComponent(token)}`);
  };

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // ============================================================
  // NORMALIZE STATUS
  // ============================================================
  const currentStatus: DisplayStatus = useMemo(() => {
    if (!booking) return "WAITING";

    const values = [
      booking.queueStatus,
      booking.procurementStatus,
      booking.status,
    ]
      .filter(Boolean)
      .map((value) => String(value).toUpperCase());

    if (values.some((v) => v.includes("COMPLETED") || v.includes("COMPLETE"))) {
      return "COMPLETED";
    }
    if (values.some((v) => v.includes("PROCESSING") || v.includes("PROCESS"))) {
      return "PROCESSING";
    }
    if (values.some((v) => v.includes("VERIFIED") || v.includes("VERIFY"))) {
      return "VERIFIED";
    }
    if (values.some((v) => v.includes("CALLED") || v.includes("CALL"))) {
      return "CALLED";
    }
    return "WAITING";
  }, [booking]);

  const queuePosition = booking?.queuePosition ?? 1;
  const farmersAhead = Math.max(queuePosition - 1, 0);
  const estimatedWait = currentStatus === "WAITING" ? booking?.waitTime ?? farmersAhead * 5 : 0;

  const cropMspInfo = useMemo(() => {
    return getCropMspData(booking?.crop);
  }, [booking?.crop]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(`${dateString}T00:00:00`);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const statusDescription = () => {
    switch (currentStatus) {
      case "CALLED":
        return "Your token has been called by the Procurement Officer. Please proceed to the Mandi Gate & Unload Bay immediately.";
      case "VERIFIED":
        return "Farmer identity and crop registration have been officially verified. Proceed to quality assessment and weighbridge.";
      case "PROCESSING":
        return "Produce is being inspected, quality graded, and weighed on the weighbridge. Live payout is calculated.";
      case "COMPLETED":
        return "Procurement successfully completed. Direct Bank Transfer (DBT) has been authorized to your Aadhaar-linked bank account.";
      default:
        return "Your token is active in the queue. Please arrive around your recommended time.";
    }
  };

  const statusRank = (status: DisplayStatus) => {
    switch (status) {
      case "WAITING":
        return 1;
      case "CALLED":
        return 2;
      case "VERIFIED":
        return 3;
      case "PROCESSING":
        return 4;
      case "COMPLETED":
        return 5;
      default:
        return 1;
    }
  };

  const isStepComplete = (step: DisplayStatus) => {
    return statusRank(currentStatus) >= statusRank(step);
  };

  const isCurrentStep = (step: DisplayStatus) => {
    return currentStatus === step;
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
            <Sprout className="h-7 w-7 animate-pulse text-[#2E7D32]" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading live token data...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // NO BOOKING / SEARCH SCREEN
  // ============================================================
  if (!booking) {
    return (
      <main className="min-h-screen bg-[#F7F9F5] text-[#111827]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
            <button
              onClick={() => router.push("/farmer/dashboard")}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#2E7D32]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <div className="flex items-center gap-2 font-semibold text-[#2E7D32]">
                <Sprout className="h-5 w-5" />
                {t("common.appName")}
              </div>
            </div>
          </div>
        </header>

        <section className="px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-xl">
            {searchError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {searchError}
              </div>
            )}

            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">
                <Ticket className="h-8 w-8 text-[#2E7D32]" />
              </div>

              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                Track Procurement Token
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Enter your Smart Token number (e.g. <strong>A101</strong>, <strong>A102</strong>) or registered Mobile Number to track live queue status and official procurement progress.
              </p>

              {/* SEARCH INPUT */}
              <form onSubmit={handleSearchToken} className="mt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="e.g. A101, A102 or 9876543210"
                      className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm font-semibold uppercase tracking-wider text-gray-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || !searchInput.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#256428] disabled:opacity-50"
                  >
                    Track Now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* QUICK TOKENS */}
              {quickTokens.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-5 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Quick Track Active Tokens:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickTokens.map((item) => (
                      <button
                        key={item.token}
                        type="button"
                        onClick={() => handleQuickSwitch(item.token)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition"
                      >
                        <Ticket className="h-3 w-3 text-[#2E7D32]" />
                        #{item.token} ({item.name})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 border-t border-gray-100 pt-6">
                <p className="text-xs text-gray-500">
                  Don&apos;t have a token yet?
                </p>
                <button
                  onClick={() => router.push("/farmer/book-slot")}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:border-[#2E7D32] hover:text-[#2E7D32]"
                >
                  Book Procurement Slot
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ============================================================
  // MAIN TOKEN TRACKING VIEW
  // ============================================================
  return (
    <main className="min-h-screen bg-[#F7F9F5] text-[#111827]">
      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => router.push("/farmer/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#2E7D32]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <div className="flex items-center gap-2 font-semibold text-[#2E7D32]">
              <Sprout className="h-5 w-5" />
              {t("common.appName")}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {/* SEARCH / SWITCH TOKEN BAR */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <form onSubmit={handleSearchToken} className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={`Currently tracking #${booking.token || booking.tokenNumber}. Search another...`}
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-gray-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2E7D32] px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-[#256428]"
                >
                  Switch
                </button>
              </form>

              {/* QUICK TOKEN PILLS */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-gray-400 font-medium shrink-0">Quick Switch:</span>
                {quickTokens.map((item) => {
                  const isActive =
                    matchesBookingIdentifier(booking, item.token) ||
                    normalizeTokenClean(tokenParam) === normalizeTokenClean(item.token);
                  return (
                    <button
                      key={item.token}
                      type="button"
                      onClick={() => handleQuickSwitch(item.token)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shrink-0 ${
                        isActive
                          ? "bg-[#2E7D32] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                      }`}
                    >
                      #{item.token}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ====================================================
              URGENT NOTICE BANNERS (CALLED / VERIFIED / COMPLETED)
          ==================================================== */}

          {/* 1. CALLED ALERT */}
          {currentStatus === "CALLED" && (
            <div className="mb-6 animate-pulse rounded-3xl border-2 border-orange-500 bg-orange-50 p-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                  <Bell className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                      Action Required
                    </span>
                    <span className="text-xs font-bold text-orange-800">
                      Called at {booking.calledAt ? new Date(booking.calledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "Just now"}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-orange-950">
                    🔔 Token #{booking.token} Called — Proceed to Mandi Gate!
                  </h2>
                  <p className="mt-1 text-sm text-orange-900">
                    The Procurement Officer is ready at <strong>{booking.centre}</strong>. Please drive your loaded vehicle to the inspection bay and present your token card.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. VERIFIED ALERT */}
          {currentStatus === "VERIFIED" && (
            <div className="mb-6 rounded-3xl border-2 border-blue-500 bg-blue-50 p-6 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                      Clearance Granted
                    </span>
                    <span className="text-xs font-bold text-blue-800">
                      {booking.verifiedBy || "Procurement Officer Verified"}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-blue-950">
                    ✅ Documents & Produce Registration Verified
                  </h2>
                  <p className="mt-1 text-sm text-blue-900">
                    Your Aadhaar, land records, and produce declaration have been verified. Weighbridge and quality assessment are being prepared.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. COMPLETED CELEBRATION */}
          {currentStatus === "COMPLETED" && (
            <div className="mb-6 rounded-3xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-6 shadow-sm print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E7D32] text-white shadow-sm">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="rounded-md bg-[#2E7D32] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                      Procurement Finalized
                    </span>
                    <h2 className="mt-1 text-xl sm:text-2xl font-black text-gray-900">
                      🎉 Procurement Complete & DBT Disbursal Authorized!
                    </h2>
                    <p className="mt-1 text-sm text-gray-700">
                      Total payment of <strong className="text-[#2E7D32] font-black">{formatINR(booking.totalPayout || 0)}</strong> has been approved for Direct Bank Transfer.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white hover:bg-[#256428] shadow-sm shrink-0"
                >
                  <Printer className="h-4 w-4" />
                  Print J-Form Receipt
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              LIVE TOKEN HERO CARD
          ==================================================== */}
          <div className="overflow-hidden rounded-3xl bg-[#2E7D32] shadow-sm text-white">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <Ticket className="h-5 w-5" />
                    SMART PROCUREMENT TOKEN
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-5xl font-black tracking-tight">
                      #{String(booking.token || (booking.tokenNumber ? `A${booking.tokenNumber}` : "---")).replace(/^#/, "")}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        currentStatus === "COMPLETED"
                          ? "bg-emerald-300 text-emerald-950"
                          : currentStatus === "PROCESSING"
                          ? "bg-purple-200 text-purple-950"
                          : currentStatus === "VERIFIED"
                          ? "bg-blue-200 text-blue-950"
                          : currentStatus === "CALLED"
                          ? "bg-orange-300 text-orange-950"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  <p className="mt-2 text-base font-bold text-white/90">
                    {booking.farmerName} • {booking.farmerMobile}
                  </p>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-white/80">
                    {statusDescription()}
                  </p>
                </div>

                {/* QUEUE POSITION METRICS */}
                <div className="rounded-2xl bg-white/10 p-5 lg:min-w-[290px]">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-white/70">Queue Position</p>
                      <p className="mt-1 text-3xl font-black text-white">
                        {currentStatus === "WAITING" ? `#${queuePosition}` : "Serving"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/70">Farmers Ahead</p>
                      <p className="mt-1 text-3xl font-black text-white">
                        {currentStatus === "WAITING" ? farmersAhead : 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-white/80">
                    <Clock3 className="h-4 w-4" />
                    {currentStatus === "WAITING"
                      ? `Estimated wait: ~${estimatedWait} min`
                      : currentStatus === "COMPLETED"
                      ? "Completed successfully"
                      : "Counter active"}
                  </div>
                </div>
              </div>

              {/* ARRIVAL NOTICE */}
              <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-white">
                  <Clock3 className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/70">Scheduled Window / Arrival</p>
                    <p className="mt-0.5 font-bold">
                      {booking.arrivalTime ?? booking.time ?? "Slot time"} ({booking.fullTime || booking.time})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/80">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.centre}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              LIVE WEIGHMENT & QUALITY GRADING (PROCESSING & COMPLETED)
          ==================================================== */}
          {(booking.cropGrade || booking.actualQuantity || booking.totalPayout || currentStatus === "PROCESSING" || currentStatus === "COMPLETED") && (
            <div className="mt-7 rounded-3xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E7D32] text-white shadow-xs">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#2E7D32]">
                        Weighbridge & Quality Grade Certification
                      </span>
                      <span className="rounded-md bg-[#2E7D32] px-2 py-0.5 text-xs font-black text-white">
                        {booking.cropGrade || "Grade A"}
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-black text-gray-900">
                      {booking.crop} • {booking.actualQuantity || booking.quantity || 0} Quintals @ ₹{(booking.mspRate || cropMspInfo.standardMsp).toLocaleString("en-IN")}/quintal
                    </p>
                    <p className="text-xs text-gray-600">
                      Payment Status:{" "}
                      <strong className="text-[#2E7D32] uppercase">
                        {currentStatus === "COMPLETED" ? "APPROVED FOR DIRECT BANK TRANSFER (DBT)" : "CALCULATED & PENDING COMPLETION"}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#CDE8D0]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                    Total Farmer Payout
                  </p>
                  <p className="mt-0.5 text-3xl font-black text-[#2E7D32]">
                    {formatINR(booking.totalPayout || (booking.mspRate || cropMspInfo.standardMsp) * (booking.actualQuantity || booking.quantity || 0))}
                  </p>
                  <p className="text-[11px] text-gray-500">Credited to Aadhaar-linked Bank A/C</p>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              DIGITAL MANDI PROCUREMENT RECEIPT (J-FORM)
          ==================================================== */}
          {currentStatus === "COMPLETED" && (
            <div className="mt-7 rounded-3xl border border-gray-300 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-5 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2E7D32]">
                    <ShieldCheck className="h-4 w-4" />
                    Government of India • Ministry of Agriculture
                  </div>
                  <h3 className="mt-1 text-2xl font-black text-gray-900">
                    Official Mandi Procurement Receipt (J-Form)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Receipt Ref: MandiMitra-REC-{String(booking.token || "101").replace(/^#/, "")}-{booking.date?.replace(/-/g, "") || "2026"}
                  </p>
                </div>
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 print:hidden"
                >
                  <Printer className="h-4 w-4 text-[#2E7D32]" />
                  Print Receipt
                </button>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Farmer Name</p>
                  <p className="mt-1 font-extrabold text-gray-900">{booking.farmerName}</p>
                  <p className="text-xs text-gray-500">Mobile: {booking.farmerMobile}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Procurement Centre</p>
                  <p className="mt-1 font-extrabold text-gray-900">{booking.centre}</p>
                  <p className="text-xs text-gray-500">Date: {formatDate(booking.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Crop & Grade</p>
                  <p className="mt-1 font-extrabold text-gray-900">{booking.crop} ({booking.cropGrade || "Grade A"})</p>
                  <p className="text-xs text-gray-500">Weighed: {booking.actualQuantity || booking.quantity} Quintals</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Total DBT Payout</p>
                  <p className="mt-1 text-lg font-black text-[#2E7D32]">{formatINR(booking.totalPayout || 0)}</p>
                  <p className="text-xs font-semibold text-emerald-700">Status: Disbursed via DBT</p>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              5-STAGE PROGRESSIVE STATUS TIMELINE
          ==================================================== */}
          <div className="mt-7 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">
              Procurement Journey Progress
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Real-time progression through the procurement pipeline at the mandi terminal.
            </p>

            <div className="mt-8">
              <StatusTimelineItem
                title="1. Slot Booked & Waiting in Queue"
                description="Token is active in the queue. Arrive near your recommended time."
                active={isCurrentStep("WAITING")}
                completed={isStepComplete("WAITING")}
                last={false}
              />

              <StatusTimelineItem
                title="2. Token Called & Gate Entry Permitted"
                description={
                  booking.calledAt
                    ? `Token called at ${new Date(booking.calledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}. Vehicle admitted to Mandi terminal.`
                    : "Official calls your token to enter the unload bay."
                }
                active={isCurrentStep("CALLED")}
                completed={isStepComplete("CALLED")}
                last={false}
              />

              <StatusTimelineItem
                title="3. Documents & Produce Verified"
                description={
                  booking.verifiedBy
                    ? `Verified by ${booking.verifiedBy}. Identity and land records approved.`
                    : "Officer verifies farmer registration, Aadhaar, and physical arrival."
                }
                active={isCurrentStep("VERIFIED")}
                completed={isStepComplete("VERIFIED")}
                last={false}
              />

              <StatusTimelineItem
                title="4. Quality Grading & Weighbridge Weighment (Processing)"
                description={
                  booking.cropGrade
                    ? `Graded as ${booking.cropGrade} (${booking.actualQuantity || booking.quantity} quintals @ ₹${booking.mspRate || cropMspInfo.standardMsp}/q). Payout calculated.`
                    : "Crop quality graded, weighbridge weight recorded, and MSP rate calculated."
                }
                active={isCurrentStep("PROCESSING")}
                completed={isStepComplete("PROCESSING")}
                last={false}
              />

              <StatusTimelineItem
                title="5. Procurement Completed & DBT Disbursed"
                description={
                  currentStatus === "COMPLETED"
                    ? "Procurement finalized. J-Form issued and payment authorized for direct credit."
                    : "Final settlement slip issued and bank disbursal initiated."
                }
                active={isCurrentStep("COMPLETED")}
                completed={isStepComplete("COMPLETED")}
                last={true}
              />
            </div>
          </div>

          {/* ====================================================
              BOOKING DETAILS CARDS
          ==================================================== */}
          <div className="mt-7">
            <h2 className="text-xl font-bold text-gray-900">
              Booking Details
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Details associated with procurement token #{booking.token}.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailCard
                icon={<MapPin className="h-5 w-5 text-[#2E7D32]" />}
                label="Procurement Centre"
                value={booking.centre ?? "Not available"}
              />

              <DetailCard
                icon={<CalendarDays className="h-5 w-5 text-[#2E7D32]" />}
                label="Procurement Date"
                value={formatDate(booking.date)}
              />

              <DetailCard
                icon={<Wheat className="h-5 w-5 text-[#2E7D32]" />}
                label="Crop"
                value={booking.crop ?? "Not available"}
              />

              <DetailCard
                icon={<Truck className="h-5 w-5 text-[#2E7D32]" />}
                label="Quantity"
                value={
                  booking.actualQuantity !== undefined
                    ? `${booking.actualQuantity} Quintals (Weighed)`
                    : booking.quantity !== undefined
                    ? `${booking.quantity} Quintals`
                    : "Not available"
                }
              />

              <DetailCard
                icon={<Award className="h-5 w-5 text-[#2E7D32]" />}
                label="Quality Grade"
                value={
                  booking.cropGrade
                    ? `${booking.cropGrade}`
                    : currentStatus === "VERIFIED"
                    ? "Pending Grading at Counter"
                    : "Pending Official Grading"
                }
              />

              <DetailCard
                icon={<IndianRupee className="h-5 w-5 text-[#2E7D32]" />}
                label="Applied MSP Rate"
                value={
                  booking.mspRate
                    ? `₹${booking.mspRate.toLocaleString("en-IN")} / quintal`
                    : `₹${cropMspInfo.standardMsp.toLocaleString("en-IN")} / quintal (Base)`
                }
              />
            </div>
          </div>

          {/* ====================================================
              FOOTER ACTIONS & LAST UPDATED
          ==================================================== */}
          <div className="mt-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <button
              onClick={() => router.push("/farmer/dashboard")}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#2E7D32] hover:text-[#2E7D32]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Clock3 className="h-4 w-4 text-[#2E7D32]" />
              Last Synced:{" "}
              {lastUpdated
                ? lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Live"}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function FarmerTrackToken() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5]">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
              <Sprout className="h-7 w-7 animate-pulse text-[#2E7D32]" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              Loading token tracker...
            </p>
          </div>
        </main>
      }
    >
      <TrackTokenContent />
    </Suspense>
  );
}

function StatusTimelineItem({
  title,
  description,
  active,
  completed,
  last,
}: {
  title: string;
  description: string;
  active: boolean;
  completed: boolean;
  last: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
            completed
              ? "border-[#2E7D32] bg-[#2E7D32] text-white"
              : active
              ? "border-[#2E7D32] bg-white text-[#2E7D32] ring-4 ring-[#2E7D32]/20"
              : "border-gray-300 bg-white text-gray-400"
          }`}
        >
          {completed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Clock3 className="h-4 w-4" />
          )}
        </div>

        {!last && (
          <div
            className={`mt-1 min-h-[55px] w-0.5 transition ${
              completed ? "bg-[#2E7D32]" : "bg-gray-200"
            }`}
          />
        )}
      </div>

      <div className="pb-7">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`font-bold ${
              active
                ? "text-[#2E7D32] text-base"
                : completed
                ? "text-gray-900"
                : "text-gray-500"
            }`}
          >
            {title}
          </h3>

          {active && (
            <span className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-black text-[#2E7D32]">
              Current Stage
            </span>
          )}
        </div>

        <p className="mt-1 text-sm leading-5 text-gray-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-extrabold leading-5 text-gray-900">
        {value}
      </p>
    </div>
  );
}