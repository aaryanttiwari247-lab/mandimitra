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
  Sprout,
  Ticket,
  Truck,
  Users,
  Wheat,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getFarmerSession, FarmerUser } from "@/lib/farmer-auth";
import { formatINR } from "@/lib/msp-rates";

type Booking = {
  bookingId?: string;
  tokenNumber?: number;
  token?: string;

  farmerId?: string;
  farmerName?: string;
  farmerMobile?: string;

  crop?: string;
  quantity?: number;

  cropGrade?: "Grade A" | "Grade B" | "Grade C" | "Grade D";
  mspRate?: number;
  totalPayout?: number;
  actualQuantity?: number;
  paymentStatus?: string;

  date?: string;
  centre?: string;
  distance?: string;

  time?: string;
  fullTime?: string;

  availableSlots?: number;

  queuePosition?: number;
  waitTime?: number;

  status?: string;
  queueStatus?: string;
  procurementStatus?: string;

  calledAt?: string | null;
  processingStartedAt?: string | null;
  completedAt?: string | null;
  verifiedBy?: string | null;

  arrivalTime?: string;

  createdAt?: string;
  updatedAt?: string;
};

type DisplayStatus =
  | "WAITING"
  | "CALLED"
  | "VERIFIED"
  | "PROCESSING"
  | "COMPLETED";

const normalizeToken = (t?: string | number | null): string => {
  if (!t) return "";
  return String(t).trim().replace(/^#/, "").toUpperCase();
};

const isTokenMatch = (b: Booking | null, target: string): boolean => {
  if (!b || !target) return false;
  const normTarget = normalizeToken(target);
  if (!normTarget) return false;
  const bToken = normalizeToken(b.token);
  const bId = normalizeToken(b.bookingId);
  const bNum = b.tokenNumber != null ? `A${b.tokenNumber}`.toUpperCase() : "";
  const bNumRaw = b.tokenNumber != null ? String(b.tokenNumber) : "";
  return (
    bToken === normTarget ||
    bId === normTarget ||
    bNum === normTarget ||
    bNumRaw === normTarget
  );
};

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ============================================================
  // LOAD BOOKING (LOCAL + LIVE SERVER SYNC)
  // ============================================================

  const loadBooking = useCallback(async () => {
    try {
      const farmer = getFarmerSession();
      const cleanTokenParam = normalizeToken(tokenParam);

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

      // 1. URL search param match
      if (cleanTokenParam) {
        if (isTokenMatch(currentBooking, cleanTokenParam)) {
          foundBooking = currentBooking;
        } else {
          foundBooking = queue.find((item) => isTokenMatch(item, cleanTokenParam)) ?? null;
        }
      }

      // 2. Booking ID match from currentBooking
      if (!foundBooking && currentBooking?.bookingId) {
        foundBooking =
          queue.find((item) => item.bookingId === currentBooking?.bookingId) ?? currentBooking;
      }

      // 3. Current token match from currentBooking
      if (!foundBooking && currentBooking?.token) {
        foundBooking =
          queue.find((item) => isTokenMatch(item, currentBooking?.token || "")) ?? currentBooking;
      }

      // 4. Current Farmer match in queue
      if (!foundBooking && farmer) {
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

      // 5. Current booking fallback if belongs to farmer (or no farmer session)
      if (!foundBooking && currentBooking) {
        if (!farmer || belongsToFarmer(currentBooking, farmer)) {
          foundBooking = currentBooking;
        }
      }

      // 6. Last resort: latest booking from queue
      if (!foundBooking && queue.length > 0) {
        foundBooking =
          [...queue].sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime()
          )[0] ?? null;
      }

      if (foundBooking) {
        setBooking((prev) => {
          if (prev && prev.updatedAt && foundBooking?.updatedAt) {
            if (new Date(prev.updatedAt).getTime() > new Date(foundBooking.updatedAt).getTime()) {
              return prev;
            }
          }
          return foundBooking;
        });
        setLastUpdated(new Date());
        setLoading(false);
      }

      // 7. LIVE SERVER SYNC (CRITICAL FOR CROSS-DEVICE & VERIFICATION UPDATES)
      const tokenToQuery =
        cleanTokenParam ||
        normalizeToken(foundBooking?.token) ||
        normalizeToken(foundBooking?.bookingId) ||
        normalizeToken(currentBooking?.token) ||
        normalizeToken(currentBooking?.bookingId) ||
        (farmer?.mobile ? farmer.mobile : "") ||
        (farmer?.farmerId ? farmer.farmerId : "");

      if (tokenToQuery) {
        try {
          const res = await fetch(`/api/bookings/track/${encodeURIComponent(tokenToQuery)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.booking) {
              const liveBooking: Booking = data.booking;
              setBooking(liveBooking);
              setLastUpdated(new Date());

              try {
                localStorage.setItem("smartProcurementBooking", JSON.stringify(liveBooking));
                const freshQueue = [...queue];
                const qIdx = freshQueue.findIndex(
                  (b) =>
                    (liveBooking.bookingId && b.bookingId === liveBooking.bookingId) ||
                    isTokenMatch(b, liveBooking.token || "")
                );
                if (qIdx !== -1) {
                  freshQueue[qIdx] = { ...freshQueue[qIdx], ...liveBooking };
                } else {
                  freshQueue.push(liveBooking);
                }
                localStorage.setItem("smartProcurementQueue", JSON.stringify(freshQueue));
              } catch {}
            }
          }
        } catch (fetchErr) {
          console.warn("Live token tracking fetch error:", fetchErr);
        }
      }

      // Also query /api/official/queue if no booking found locally
      if (!foundBooking && (farmer || cleanTokenParam)) {
        try {
          const qRes = await fetch("/api/official/queue");
          if (qRes.ok) {
            const qData = await qRes.json();
            if (qData.success && Array.isArray(qData.queue)) {
              let match: Booking | undefined;
              if (cleanTokenParam) {
                match = qData.queue.find((b: Booking) => isTokenMatch(b, cleanTokenParam));
              }
              if (!match && farmer) {
                match = qData.queue.find((b: Booking) => belongsToFarmer(b, farmer));
              }
              if (match) {
                setBooking(match);
                setLastUpdated(new Date());
                localStorage.setItem("smartProcurementBooking", JSON.stringify(match));
              }
            }
          }
        } catch {}
      }
    } catch (error) {
      console.error("Unable to load procurement booking:", error);
    } finally {
      setLoading(false);
    }
  }, [tokenParam]);

  // ============================================================
  // INITIAL LOAD + LIVE UPDATES
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBooking();
    }, 0);

    const handleStorage = () => {
      loadBooking();
    };

    const handleQueueUpdate = () => {
      loadBooking();
    };

    const handleBookingUpdate = () => {
      loadBooking();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("smartProcurementQueueUpdated", handleQueueUpdate);
    window.addEventListener("smartProcurementBookingUpdated", handleBookingUpdate);

    const interval = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadBooking();
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("smartProcurementQueueUpdated", handleQueueUpdate);
      window.removeEventListener("smartProcurementBookingUpdated", handleBookingUpdate);
      window.clearInterval(interval);
    };
  }, [loadBooking]);

  // ============================================================
  // NORMALIZE STATUS
  // ============================================================

  const currentStatus: DisplayStatus =
    useMemo(() => {
      if (!booking) {
        return "WAITING";
      }

      const values = [
        booking.queueStatus,
        booking.procurementStatus,
        booking.status,
      ]
        .filter(Boolean)
        .map((value) =>
          String(value).toUpperCase()
        );

      if (
        values.some(
          (value) =>
            value.includes("COMPLETED") ||
            value.includes("COMPLETE")
        )
      ) {
        return "COMPLETED";
      }

      if (
        values.some(
          (value) =>
            value.includes("PROCESSING") ||
            value.includes("PROCESS")
        )
      ) {
        return "PROCESSING";
      }

      if (
        values.some(
          (value) =>
            value.includes("VERIFIED") ||
            value.includes("VERIFY")
        )
      ) {
        return "VERIFIED";
      }

      if (
        values.some(
          (value) =>
            value.includes("CALLED") ||
            value.includes("CALL")
        )
      ) {
        return "CALLED";
      }

      return "WAITING";
    }, [booking]);

  // ============================================================
  // QUEUE
  // ============================================================

  const queuePosition =
    booking?.queuePosition ?? 1;

  const farmersAhead = Math.max(
    queuePosition - 1,
    0
  );

  const estimatedWait =
    currentStatus === "WAITING"
      ? booking?.waitTime ??
        farmersAhead * 5
      : 0;

  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return "Not available";
    }

    try {
      const date = new Date(
        `${dateString}T00:00:00`
      );

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return dateString;
    }
  };

  // ============================================================
  // STATUS DESCRIPTION
  // ============================================================

  const statusDescription = () => {
    switch (currentStatus) {
      case "CALLED":
        return "Your token has been called. Please proceed to the procurement counter.";

      case "VERIFIED":
        return "Your token has been verified by the procurement officer.";

      case "PROCESSING":
        return "Your crop procurement is currently being processed.";

      case "COMPLETED":
        return "Your procurement has been completed successfully.";

      default:
        return "Your token is active in the queue. Please arrive around your recommended arrival time.";
    }
  };

  // ============================================================
  // STATUS RANK
  // ============================================================

  const statusRank = (
    status: DisplayStatus
  ) => {
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

  const isStepComplete = (
    step: DisplayStatus
  ) => {
    return (
      statusRank(currentStatus) >=
      statusRank(step)
    );
  };

  const isCurrentStep = (
    step: DisplayStatus
  ) => {
    return currentStatus === step;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
            <Sprout className="h-7 w-7 animate-pulse text-[#2E7D32]" />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading your live token...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // NO BOOKING
  // ============================================================

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#F7F9F5] text-[#111827]">

        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">

            <button
              onClick={() =>
                router.push(
                  "/farmer/dashboard"
                )
              }
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#2E7D32]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
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

        <section className="px-5 py-16 sm:px-8">

          <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">
              <Ticket className="h-8 w-8 text-[#2E7D32]" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              {t("dashboard.activeTokenTitle")}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              You do not currently have an active procurement
              booking. Book a procurement slot to generate a
              smart token.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/farmer/book-slot"
                )
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#256428]"
            >
              Book Procurement Slot
              <ArrowRight className="h-4 w-4" />
            </button>

          </div>

        </section>
      </main>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#F7F9F5] text-[#111827]">

      {/* HEADER */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">

          <button
            onClick={() =>
              router.push(
                "/farmer/dashboard"
              )
            }
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

          {/* TITLE */}

          <div className="mb-7">

            <p className="text-sm font-medium text-[#2E7D32]">
              Farmer Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("tracker.title")}
            </h1>

            <p className="mt-2 text-gray-600">
              Monitor your procurement queue and current
              token status in real time.
            </p>

          </div>

          {/* ====================================================
              LIVE TOKEN
          ==================================================== */}

          <div className="overflow-hidden rounded-3xl bg-[#2E7D32] shadow-sm">

            <div className="p-6 sm:p-8">

              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                <div className="text-white">

                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <Ticket className="h-5 w-5" />
                    SMART TOKEN
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">

                    <span className="text-5xl font-bold tracking-tight">
                      #{String(booking.token || (booking.tokenNumber ? `A${booking.tokenNumber}` : "---")).replace(/^#/, "")}
                    </span>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                      {currentStatus}
                    </span>

                  </div>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
                    {statusDescription()}
                  </p>

                </div>

                {/* QUEUE */}

                <div className="rounded-2xl bg-white/10 p-5 lg:min-w-[290px]">

                  <div className="grid grid-cols-2 gap-5">

                    <div>

                      <p className="text-xs text-white/70">
                        Queue Position
                      </p>

                      <p className="mt-1 text-3xl font-bold text-white">
                        #{queuePosition}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-white/70">
                        Farmers Ahead
                      </p>

                      <p className="mt-1 text-3xl font-bold text-white">
                        {farmersAhead}
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-white/80">

                    <Clock3 className="h-4 w-4" />

                    {currentStatus === "WAITING"
                      ? `Estimated wait: ~${estimatedWait} min`
                      : "You are being served"}

                  </div>

                </div>

              </div>

              {/* ARRIVAL */}

              <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3 text-white">

                  <Clock3 className="h-5 w-5" />

                  <div>

                    <p className="text-xs text-white/70">
                      Recommended Arrival
                    </p>

                    <p className="mt-0.5 font-bold">
                      {booking.arrivalTime ??
                        booking.time ??
                        "Please check your slot"}
                    </p>

                  </div>

                </div>

                <p className="text-xs text-white/70">
                  Please keep your token ready.
                </p>

              </div>

            </div>

          </div>

          {/* ====================================================
              STATUS TIMELINE
          ==================================================== */}

          <div className="mt-7 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold text-gray-900">
              Procurement Status
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Follow your procurement journey from booking
              to completion.
            </p>

            <div className="mt-8">

              <StatusTimelineItem
                title="Waiting in Queue"
                description="Your token is active and waiting for its turn."
                active={isCurrentStep("WAITING")}
                completed={isStepComplete("WAITING")}
                last={false}
              />

              <StatusTimelineItem
                title="Token Called"
                description="The procurement officer has called your token."
                active={isCurrentStep("CALLED")}
                completed={isStepComplete("CALLED")}
                last={false}
              />

              <StatusTimelineItem
                title="Verified"
                description="Your farmer and booking details have been verified."
                active={isCurrentStep("VERIFIED")}
                completed={isStepComplete("VERIFIED")}
                last={false}
              />

              <StatusTimelineItem
                title="Processing"
                description="Your crop is being processed at the centre."
                active={isCurrentStep("PROCESSING")}
                completed={isStepComplete("PROCESSING")}
                last={false}
              />

              <StatusTimelineItem
                title="Completed"
                description="Procurement has been successfully completed."
                active={isCurrentStep("COMPLETED")}
                completed={isStepComplete("COMPLETED")}
                last={true}
              />

            </div>

          </div>

          {/* ====================================================
              BOOKING DETAILS
          ==================================================== */}

          <div className="mt-7">

            <h2 className="text-xl font-bold text-gray-900">
              Booking Details
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Details associated with your active procurement token.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <DetailCard
                icon={
                  <MapPin className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Procurement Centre"
                value={
                  booking.centre ??
                  "Not available"
                }
              />

              <DetailCard
                icon={
                  <CalendarDays className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Procurement Date"
                value={formatDate(booking.date)}
              />

              <DetailCard
                icon={
                  <Wheat className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Crop"
                value={
                  booking.crop ??
                  "Not available"
                }
              />

              <DetailCard
                icon={
                  <Truck className="h-5 w-5 text-[#2E7D32]" />
                }
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
                icon={
                  <Award className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Quality Grade"
                value={
                  booking.cropGrade
                    ? `${booking.cropGrade}`
                    : "Pending Official Grading"
                }
              />

              <DetailCard
                icon={
                  <IndianRupee className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Applied MSP Rate"
                value={
                  booking.mspRate
                    ? `₹${booking.mspRate.toLocaleString("en-IN")} / quintal`
                    : "Assessed at Mandi"
                }
              />

            </div>

          </div>

          {/* ====================================================
              DBT SETTLEMENT & PAYOUT ADVICE (WHEN GRADED)
          ==================================================== */}

          {(booking.cropGrade || booking.totalPayout) && (
            <div className="mt-5 rounded-3xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E7D32] text-white shadow-xs">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                        Direct Bank Transfer (DBT) Payout Advice
                      </span>
                      <span className="rounded-md bg-[#2E7D32] px-2 py-0.5 text-xs font-bold text-white">
                        {booking.cropGrade || "Grade A"}
                      </span>
                    </div>
                    <p className="mt-1 text-base font-bold text-gray-900">
                      {booking.crop} • {booking.actualQuantity || booking.quantity || 0} Quintals @ ₹{(booking.mspRate || 0).toLocaleString("en-IN")}/quintal
                    </p>
                    <p className="text-xs text-gray-600">
                      Payment Status: <strong className="text-[#2E7D32]">{currentStatus === "COMPLETED" ? "APPROVED FOR DIRECT DISBURSAL" : "CALCULATED & PENDING COMPLETION"}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#CDE8D0]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                    Total Farmer Payout
                  </p>
                  <p className="mt-0.5 text-3xl font-black text-[#2E7D32]">
                    {formatINR(booking.totalPayout || 0)}
                  </p>
                  <p className="text-[11px] text-gray-500">Credited to Aadhaar-linked Bank A/C</p>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              SLOT INFORMATION
          ==================================================== */}

          <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="grid gap-5 md:grid-cols-3">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Time Slot
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {booking.fullTime ??
                    booking.time ??
                    "Not available"}
                </p>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Estimated Wait
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {currentStatus === "WAITING"
                    ? `~${estimatedWait} minutes`
                    : "Being processed"}
                </p>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Last Updated
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      )
                    : "Updating..."}
                </p>

              </div>

            </div>

          </div>

          {/* ====================================================
              SMART ARRIVAL
          ==================================================== */}

          <div className="mt-7 rounded-3xl border border-[#CDE8D0] bg-[#F1F8F2] p-6 sm:p-7">

            <div className="flex gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">

                <Bell className="h-5 w-5 text-[#2E7D32]" />

              </div>

              <div>

                <h3 className="font-bold text-gray-900">
                  Smart Arrival Recommendation
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-700">

                  {currentStatus === "WAITING" ? (
                    <>
                      Based on your current queue position,
                      plan to arrive around{" "}
                      <strong>
                        {booking.arrivalTime ??
                          booking.time ??
                          "your scheduled time"}
                      </strong>
                      . This helps reduce unnecessary waiting
                      at the procurement centre.
                    </>
                  ) : currentStatus === "CALLED" ? (
                    <>
                      Your token has been called.{" "}
                      <strong>
                        Please proceed to the procurement
                        counter now.
                      </strong>
                    </>
                  ) : currentStatus === "COMPLETED" ? (
                    <>
                      Your procurement is complete. You no
                      longer need to wait in the queue.
                    </>
                  ) : (
                    <>
                      Your booking is currently being handled
                      by the procurement centre.
                    </>
                  )}

                </p>

              </div>

            </div>

          </div>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="mt-7">
            <button
              onClick={() =>
                router.push(
                  "/farmer/dashboard"
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#2E7D32] hover:text-[#2E7D32] sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            Queue status updates automatically.
          </p>

        </div>

      </section>

    </main>
  );
}

// ================================================================
// EXPORT DEFAULT WITH SUSPENSE FOR USE_SEARCH_PARAMS
// ================================================================

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

// ================================================================
// STATUS TIMELINE
// ================================================================

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
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
            completed
              ? "border-[#2E7D32] bg-[#2E7D32] text-white"
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
            className={`mt-1 min-h-[55px] w-px ${
              completed
                ? "bg-[#9CCC9F]"
                : "bg-gray-200"
            }`}
          />
        )}

      </div>

      <div className="pb-7">

        <div className="flex flex-wrap items-center gap-2">

          <h3
            className={`font-bold ${
              active
                ? "text-[#2E7D32]"
                : completed
                ? "text-gray-900"
                : "text-gray-500"
            }`}
          >
            {title}
          </h3>

          {active && (
            <span className="rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-semibold text-[#2E7D32]">
              Current
            </span>
          )}

        </div>

        <p className="mt-1 text-sm leading-5 text-gray-500">
          {description}
        </p>

      </div>

    </div>
  );
}

// ================================================================
// DETAIL CARD
// ================================================================

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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
        {icon}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-bold leading-5 text-gray-900">
        {value}
      </p>

    </div>
  );
}