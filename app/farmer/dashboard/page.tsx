"use client";

import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { BrandLogo } from "@/components/BrandLogo";


import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  Filter,
  History,
  IndianRupee,
  Info,
  LogOut,
  MapPin,
  Mic,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  Sprout,
  Ticket,
  TrendingUp,
  Truck,
  Users,
  Wheat,
  X,
  XCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getFarmerSession,
  clearFarmerSession,
  FarmerUser,
} from "@/lib/farmer-auth";
import { subscribeProcurementUpdates } from "@/lib/cross-tab-sync";

import {
  CROP_MSP_RATES,
  CropGrade,
  CropCategory,
  formatINR,
  getCropDisplayName,
  getCropMspData,
  getCategoryDisplayName,
  getGradeLabel,
  getGradeSpecs,
} from "@/lib/msp-rates";
import { FarmerCancellationModal } from "@/components/FarmerCancellationModal";
import { MandiJSlipModal } from "@/components/MandiJSlipModal";
import { openVoiceAssistant } from "@/components/MandimitraChatWidget";

type Booking = {
  bookingId?: string;

  farmerId?: string;
  farmerName?: string;
  farmerMobile?: string;

  tokenNumber?: number;
  token?: string;

  crop?: string;
  quantity?: number;
  crops?: Array<{
    crop: string;
    quantity: number;
    actualQuantity?: number;
    cropGrade?: string;
    mspRate?: number;
    totalPayout?: number;
    estimatedPayoutRange?: string;
  }>;

  cropGrade?: "Grade A" | "Grade B" | "Grade C" | "Grade D";
  mspRate?: number;
  totalPayout?: number;
  minTotalPayout?: number;
  maxTotalPayout?: number;
  estimatedPayoutRange?: string;
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

  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;

  arrivalTime?: string;

  createdAt?: string;
  updatedAt?: string;
};

export default function FarmerDashboard() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [farmer, setFarmer] = useState<FarmerUser | null>(null);

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [pastRecords, setPastRecords] = useState<Booking[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"ALL" | "COMPLETED" | "CANCELLED">("ALL");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [mspCategory, setMspCategory] = useState<string>("All");
  const [mspSearch, setMspSearch] = useState<string>("");
  const [selectedGradeTab, setSelectedGradeTab] = useState<"ALL" | CropGrade>("ALL");

  const filteredMspRates = useMemo(() => {
    return CROP_MSP_RATES.filter((item) => {
      const matchCat =
        mspCategory === "All" || item.category === mspCategory;
      const matchSearch =
        !mspSearch.trim() ||
        item.name.toLowerCase().includes(mspSearch.toLowerCase()) ||
        item.nameHi.toLowerCase().includes(mspSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [mspCategory, mspSearch]);

  const openReceiptModal = (b: Booking) => {
    setSelectedReceiptBooking(b);
    setIsReceiptModalOpen(true);
  };

  const isCompletedBooking = useCallback((b: Booking | null) => {
    if (!b) return false;
    const s = String(b.queueStatus || b.status || b.procurementStatus || "").toUpperCase();
    return s.includes("COMPLETED");
  }, []);

  const isCancelledBooking = useCallback((b: Booking | null) => {
    if (!b) return false;
    const s = String(b.queueStatus || b.status || b.procurementStatus || "").toUpperCase();
    return s.includes("CANCEL");
  }, []);

  const isPastBooking = useCallback((b: Booking | null) => {
    return isCompletedBooking(b) || isCancelledBooking(b);
  }, [isCompletedBooking, isCancelledBooking]);

  const completedCount = useMemo(() => {
    return pastRecords.filter(isCompletedBooking).length;
  }, [pastRecords, isCompletedBooking]);

  const cancelledCount = useMemo(() => {
    return pastRecords.filter(isCancelledBooking).length;
  }, [pastRecords, isCancelledBooking]);

  const filteredPastRecords = useMemo(() => {
    return pastRecords.filter((b) => {
      const isComp = isCompletedBooking(b);
      const isCanc = isCancelledBooking(b);

      if (historyTab === "COMPLETED" && !isComp) return false;
      if (historyTab === "CANCELLED" && !isCanc) return false;

      if (!historySearchQuery.trim()) return true;

      const q = historySearchQuery.toLowerCase().trim();
      const token = String(b.token || b.tokenNumber || b.bookingId || "").toLowerCase();
      const crop = (b.crop || "").toLowerCase();
      const cropsStr = (b.crops || []).map((c) => c.crop).join(" ").toLowerCase();
      const centre = (b.centre || "").toLowerCase();
      const reason = (b.cancellationReason || "").toLowerCase();

      return (
        token.includes(q) ||
        crop.includes(q) ||
        cropsStr.includes(q) ||
        centre.includes(q) ||
        reason.includes(q)
      );
    });
  }, [pastRecords, historyTab, historySearchQuery, isCompletedBooking, isCancelledBooking]);

  const formatCompletedDateTime = (b: Booking) => {
    const ts = b.completedAt || b.updatedAt;
    if (ts) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const locale = language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN";
        const datePart = d.toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const timePart = d.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return `${datePart} • ${timePart}`;
      }
    }
    return `${formatDate(b.date)} • ${b.fullTime || b.time || "Completed"}`;
  };

  const formatCancelledDateTime = (b: Booking) => {
    const ts = b.cancelledAt || b.updatedAt;
    if (ts) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const locale = language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN";
        const datePart = d.toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const timePart = d.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return `${datePart} • ${timePart}`;
      }
    }
    return `${b.date ? formatDate(b.date) : "Recent"} • ${b.fullTime || b.time || "Cancelled"}`;
  };

  // ============================================================
  // LOAD BOOKING & COMPLETED PROCUREMENTS
  // ============================================================

  const loadBooking = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentFarmer = getFarmerSession();

    if (!currentFarmer) {
      router.replace("/farmer/login");
      return;
    }

    setFarmer(currentFarmer);

    // Strictly match bookings to the logged-in farmer by mobile or farmerId/code
    const belongsToFarmer = (b: Booking | null) => {
      if (!b) return false;
      if (b.farmerMobile && currentFarmer.mobile && String(b.farmerMobile) === String(currentFarmer.mobile)) {
        return true;
      }
      if (
        b.farmerId &&
        (b.farmerId === currentFarmer.farmerId ||
          b.farmerId === currentFarmer.farmerCode ||
          b.farmerId === `FMR${currentFarmer.mobile.slice(-4)}`)
      ) {
        return true;
      }
      return false;
    };

    // 1. Check current booking
    const currentBookingRaw = localStorage.getItem("smartProcurementBooking");
    let currentBooking: Booking | null = null;

    if (currentBookingRaw) {
      try {
        const parsed = JSON.parse(currentBookingRaw);
        if (parsed && belongsToFarmer(parsed)) {
          currentBooking = parsed;
        } else if (parsed && !belongsToFarmer(parsed)) {
          localStorage.removeItem("smartProcurementBooking");
        }
      } catch {
        currentBooking = null;
      }
    }

    // 2. If no current booking, search queue for this farmer
    if (!currentBooking) {
      const queueRaw = localStorage.getItem("smartProcurementQueue");
      if (queueRaw) {
        try {
          const queue = JSON.parse(queueRaw);
          if (Array.isArray(queue)) {
            const farmerBooking = queue.find((item: Booking) => belongsToFarmer(item));
            if (farmerBooking) {
              currentBooking = farmerBooking;
            }
          }
        } catch {}
      }
    }

    setBooking(currentBooking);

    // 3. Collect ALL completed and cancelled procurements for this farmer
    const pastMap = new Map<string, Booking>();

    if (currentBooking && isPastBooking(currentBooking)) {
      const key = (currentBooking.bookingId || currentBooking.token || `TK-${currentBooking.tokenNumber}` || "").toUpperCase();
      if (key) pastMap.set(key, currentBooking);
    }

    try {
      const qRaw = localStorage.getItem("smartProcurementQueue");
      if (qRaw) {
        const q = JSON.parse(qRaw);
        if (Array.isArray(q)) {
          q.forEach((item: Booking) => {
            if (belongsToFarmer(item) && isPastBooking(item)) {
              const key = (item.bookingId || item.token || `TK-${item.tokenNumber}` || "").toUpperCase();
              if (key) pastMap.set(key, item);
            }
          });
        }
      }
    } catch {}

    try {
      const hRaw = localStorage.getItem("smartProcurementHistory");
      if (hRaw) {
        const h = JSON.parse(hRaw);
        if (Array.isArray(h)) {
          h.forEach((item: Booking) => {
            if (belongsToFarmer(item) && isPastBooking(item)) {
              const key = (item.bookingId || item.token || `TK-${item.tokenNumber}` || "").toUpperCase();
              if (key && !pastMap.has(key)) pastMap.set(key, item);
            }
          });
        }
      }
    } catch {}

    const sortedPast = Array.from(pastMap.values()).sort((a, b) => {
      const timeA = new Date(a.completedAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    setPastRecords(sortedPast);

    // 4. Fetch live server queue to sync verification/procurement status across devices
    if (currentFarmer) {
      fetch("/api/official/queue")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.queue)) {
            const liveMatch = data.queue.find((item: Booking) => belongsToFarmer(item));
            if (liveMatch) {
              setBooking(liveMatch);
              try {
                localStorage.setItem("smartProcurementBooking", JSON.stringify(liveMatch));
              } catch {}
            }

            data.queue.forEach((item: Booking) => {
              if (belongsToFarmer(item) && isPastBooking(item)) {
                const key = (item.bookingId || item.token || `TK-${item.tokenNumber}` || "").toUpperCase();
                if (key) pastMap.set(key, item);
              }
            });

            setPastRecords(
              Array.from(pastMap.values()).sort((a, b) => {
                const timeA = new Date(a.completedAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime();
                const timeB = new Date(b.completedAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime();
                return timeB - timeA;
              })
            );
          }
        })
        .catch(() => {});
    }
  }, [router, isPastBooking]);

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  useEffect(() => {
    const farmer = getFarmerSession();

    if (!farmer) {
      router.replace("/farmer/login");
      return;
    }

    const timer = setTimeout(() => {
      setFarmer(farmer);
      loadBooking();
      setCheckingAuth(false);
    }, 0);

    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadBooking();
      }
    }, 10000);

    // ----------------------------------------------------------
    // Listen for booking changes.
    // ----------------------------------------------------------

    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key ===
          "smartProcurementBooking" ||
        event.key ===
          "smartProcurementQueue"
      ) {
        loadBooking();
      }
    };

    const handleBookingUpdate = () => {
      loadBooking();
    };

    const handleQueueUpdate = () => {
      loadBooking();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "smartProcurementBookingUpdated",
      handleBookingUpdate
    );

    window.addEventListener(
      "smartProcurementQueueUpdated",
      handleQueueUpdate
    );

    const unsubscribe = subscribeProcurementUpdates((msg) => {
      if (msg.type === "STATUS_UPDATED" || msg.type === "QUEUE_UPDATED") {
        loadBooking();
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "smartProcurementBookingUpdated",
        handleBookingUpdate
      );

      window.removeEventListener(
        "smartProcurementQueueUpdated",
        handleQueueUpdate
      );

      clearInterval(pollInterval);
    };
  }, [router, loadBooking]);

  // ============================================================
  // EXIT / LOGOUT
  // ============================================================

  const handleExit = () => {
    clearFarmerSession();
    router.replace("/farmer/login");
  };

  const handleLogout = handleExit;

  // ============================================================
  // BOOK PROCUREMENT SLOT
  // ============================================================

  const handleBookSlot = () => {
    router.push("/farmer/book-slot");
  };

  // ============================================================
  // TRACK MY TOKEN
  // ============================================================

  const handleTrackToken = () => {
    const rawToken =
      booking?.token ||
      (booking?.tokenNumber ? String(booking.tokenNumber) : "") ||
      booking?.bookingId;
    const token = rawToken ? String(rawToken).replace(/^#/, "").trim() : "";
    if (token) {
      router.push(`/farmer/track-token?token=${encodeURIComponent(token)}`);
    } else {
      router.push("/farmer/track-token");
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return "Not selected";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // GET STATUS
  // ============================================================

  const getDisplayStatus = () => {
    if (!booking) {
      return "No Active Booking";
    }

    const status = String(
      booking.queueStatus ||
      booking.status ||
      booking.procurementStatus ||
      "WAITING"
    ).toUpperCase();

    if (status.includes("CANCEL")) {
      return "CANCELLED";
    }
    if (status.includes("COMPLETED")) {
      return "COMPLETED";
    }
    if (status.includes("PROCESSING")) {
      return "PROCESSING";
    }
    if (status.includes("VERIFIED")) {
      return "VERIFIED";
    }
    if (status.includes("CALLED")) {
      return "CALLED";
    }

    return "WAITING";
  };

  const isCancelled = booking ? getDisplayStatus() === "CANCELLED" : false;
  const isCompleted = booking ? getDisplayStatus() === "COMPLETED" : false;
  const canFarmerCancel = Boolean(booking && !isCancelled && !isCompleted && getDisplayStatus() !== "PROCESSING");

  // ============================================================
  // AUTH CHECK SCREEN
  // ============================================================

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
            <Sprout className="h-7 w-7 animate-pulse text-[#2E7D32]" />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-600">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#EFF5F0] via-[#F8FAF7] to-[#F3F7F4] text-[#111827]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#0F3817] bg-gradient-to-r from-[#13491E] via-[#1B5E2B] to-[#13491E] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          {/* LEFT: EXIT BUTTON & LOGO */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm font-bold text-red-700 transition hover:bg-red-100 hover:border-red-300 active:scale-95 shadow-2xs cursor-pointer"
              title="Exit and Logout"
            >
              <LogOut className="h-4 w-4 text-red-600" />
              <span>{t("common.exit")}</span>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/farmer/dashboard"
                )
              }
              className="flex items-center gap-3"
            >
              <BrandLogo size="md" className="ring-1 ring-white/30" />

              <div className="text-left">
                <p className="text-lg font-bold text-white">
                  {t("common.appName")}
                </p>

                <p className="text-xs text-emerald-200">
                  {t("common.tagline")}
                </p>
              </div>
            </button>
          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2 sm:gap-3">
            {/* PROCUREMENT RECORDS ICON BUTTON */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-emerald-400/40 bg-emerald-800/80 hover:bg-emerald-700 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold text-white transition shadow-2xs cursor-pointer active:scale-95"
              title={t("dashboard.historyIconTitle")}
            >
              <History className="h-4 w-4 text-emerald-200" />
              <span className="hidden sm:inline">{t("dashboard.historyIconBtn")}</span>
              {pastRecords.length > 0 && (
                <span className="rounded-full bg-emerald-400/30 px-1.5 py-0.5 text-[10px] font-black text-emerald-100">
                  {pastRecords.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => openVoiceAssistant()}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-800/80 px-3 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
              title="MandiHelp"
            >
              <Mic className="h-4 w-4 text-emerald-200" />
              <span className="hidden md:inline">MandiHelp</span>
            </button>

            <LanguageSelector />

            <div className="hidden h-9 w-px bg-emerald-700/60 sm:block" />

            {/* FARMER PROFILE */}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white border border-emerald-400/40 shadow-xs">
                {(farmer?.name || "F").charAt(0).toUpperCase()}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-white">
                  {farmer?.name || "Farmer"}
                </p>

                <p className="text-xs text-emerald-200">
                  +91 {farmer?.mobile}
                </p>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              onClick={handleLogout}
              className="text-sm font-medium text-emerald-100 transition hover:text-white cursor-pointer"
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* WELCOME */}

        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#2E7D32]">
                {t("dashboard.portalTitle")}
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {t("dashboard.welcomeBack")}, {farmer?.name || t("common.farmer")}
              </h1>

              <p className="mt-2 text-gray-600">
                {t("dashboard.subtitle")}
              </p>
            </div>

            {farmer && (
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-right shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("dashboard.farmerAccount")}</span>
                  {pastRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D32] hover:text-[#1B5E2B] hover:underline cursor-pointer"
                    >
                      <History className="h-3 w-3" />
                      <span>{t("dashboard.historyIconBtn")} ({pastRecords.length})</span>
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-base font-bold text-[#2E7D32]">{farmer.farmerCode || farmer.farmerId || `FMR${farmer.mobile?.slice(-4)}`}</p>
                <p className="text-xs text-gray-600 font-medium">+91 {farmer.mobile}</p>
                {farmer.district && (
                  <p className="mt-1 text-xs text-gray-500">
                    📍 {farmer.village ? `${farmer.village}, ` : ""}{farmer.district}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            ACTIVE TOKEN
        ==================================================== */}

        {isCancelled && booking ? (
          <div className="overflow-hidden rounded-3xl border-2 border-red-300 bg-red-50 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xs">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                      {t("tracker.cancelledHeader")}
                    </span>
                    <span className="rounded-full bg-red-200 px-3 py-0.5 text-xs font-bold text-red-900">
                      Token #{booking.token || booking.tokenNumber}
                    </span>
                  </div>

                  <h2 className="mt-2 text-2xl font-black text-red-950">
                    {t("tracker.cancelledBanner", { token: String(booking.token || booking.tokenNumber || "") })}
                  </h2>

                  <div className="mt-3.5 rounded-2xl border border-red-200 bg-white p-4 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                      {t("tracker.cancellationReasonLabel")}
                    </p>
                    <p className="mt-1 text-base font-extrabold text-gray-900">
                      {booking.cancellationReason || "Procurement cancelled by official"}
                    </p>
                    {booking.cancelledBy && (
                      <p className="mt-1 text-xs text-gray-500">
                        {t("tracker.cancelledByLabel")}: <strong className="text-gray-800">{booking.cancelledBy}</strong>
                      </p>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-red-900 leading-relaxed">
                    {t("tracker.farmerCancelledGuidance")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  onClick={handleBookSlot}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#256428] transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("tracker.bookNewSlot")}
                </button>
                <button
                  onClick={handleTrackToken}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-[#2E7D32] hover:text-[#2E7D32] transition shadow-xs"
                >
                  {t("dashboard.trackNow")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : isCompleted && booking ? (
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#13491E] via-[#1B5E2B] to-[#0F3817] p-6 sm:p-8 text-white shadow-lg border border-emerald-400/30">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 shadow-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-500/30 border border-emerald-400/40 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-200">
                      {t("dashboard.celebrateCompletedBadge")}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-mono font-bold text-white">
                      Token #{booking.token || booking.tokenNumber}
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {t("dashboard.completedProcurementTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
                    {t("dashboard.completedProcurementSubtitle")}
                  </p>

                  {/* Summary Metric Pills */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-white/10 p-3 border border-white/10">
                      <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                        {t("booking.cropLabel")}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-white truncate">
                        {booking.crops && booking.crops.length > 1
                          ? `${booking.crops.length} Crops`
                          : booking.crop || "Produce"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3 border border-white/10">
                      <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                        {t("official.weighedQuantity")}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-white">
                        {booking.actualQuantity ?? booking.quantity ?? 0} {t("common.quintals")}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3 border border-white/10">
                      <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                        {t("official.assignedGrade")}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-emerald-300">
                        {booking.cropGrade || "Grade A"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-500/20 p-3 border border-emerald-400/30">
                      <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                        {t("dashboard.finalSettledPayout")}
                      </p>
                      <p className="mt-0.5 text-lg font-black text-white">
                        {formatINR(booking.totalPayout ?? 0)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{booking.centre || "APMC Mandi Yard"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{t("dashboard.completedOn")}: {formatCompletedDateTime(booking)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Aadhaar-DBT Authorized</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 lg:min-w-[200px]">
                <button
                  type="button"
                  onClick={() => openReceiptModal(booking)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#13491E] shadow-md hover:bg-emerald-50 transition active:scale-95 cursor-pointer"
                  title="View and Print Official J-Slip"
                >
                  <ReceiptText className="h-4 w-4 text-[#13491E]" />
                  <span>{t("dashboard.viewJSlip")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBookSlot}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 px-5 py-3 text-sm font-bold text-white border border-emerald-400/30 transition shadow-xs cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t("dashboard.bookNextSlot")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTrackToken}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-5 py-2.5 text-xs font-semibold text-emerald-100 transition border border-white/20 cursor-pointer"
                >
                  <span>{t("dashboard.trackNow")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : booking ? (
          <div className="overflow-hidden rounded-3xl bg-[#2E7D32] shadow-sm">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                {/* TOKEN INFORMATION */}

                <div className="text-white">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <Ticket className="h-5 w-5" />

                    {t("dashboard.activeTokenTitle")}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-5xl font-bold tracking-tight">
                      #{booking.token ||
                        (booking.tokenNumber ? String(booking.tokenNumber) : "---")}
                    </span>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                      {getDisplayStatus()}
                    </span>
                  </div>

                  {booking.crops && booking.crops.length > 1 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {booking.crops.map((c, idx) => (
                        <span key={idx} className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                          🌾 {c.crop}: {c.quantity} qtl
                        </span>
                      ))}
                    </div>
                  ) : booking.crop ? (
                    <p className="mt-2 text-xs font-bold text-white/90">
                      🌾 {booking.crop} • {booking.quantity || 0} Quintals
                    </p>
                  ) : null}

                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
                    {t("dashboard.tokenActiveDesc")}
                  </p>
                </div>

                {/* QUEUE */}

                <div className="rounded-2xl bg-white/10 p-5 lg:min-w-[280px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                      <Users className="h-5 w-5 text-white" />
                    </div>

                    <div>
                      <p className="text-xs text-white/70">
                        {t("dashboard.farmersAhead")}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-white">
                        {Math.max(
                          (booking.queuePosition ||
                            1) - 1,
                          0
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-white/80">
                    <Clock3 className="h-4 w-4" />

                    {t("dashboard.estimatedWait")}: ~
                    {booking.waitTime || 0} {t("common.minutes")}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleTrackToken}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-4 text-sm font-bold text-[#2E7D32] transition hover:bg-gray-50 sm:w-fit shadow-xs"
                >
                  {t("dashboard.trackTokenBtn")}

                  <ArrowRight className="h-5 w-5" />
                </button>

                {canFarmerCancel && (
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-4 text-sm font-bold text-white transition hover:bg-white/20 sm:w-fit"
                  >
                    <XCircle className="h-4 w-4 text-white/80" />
                    {t("farmerCancel.cancelSlotBtn")}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <Ticket className="h-5 w-5 text-[#2E7D32]" />
                  {t("dashboard.noActiveToken")}
                </div>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {t("dashboard.noTokenTitle")} {farmer?.mobile}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {t("dashboard.noTokenDesc")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {pastRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white hover:border-[#2E7D32] hover:text-[#2E7D32] px-5 py-3.5 text-sm font-bold text-gray-700 transition shadow-xs cursor-pointer"
                  >
                    <History className="h-4 w-4 text-[#2E7D32]" />
                    <span>{t("dashboard.historyIconBtn")} ({pastRecords.length})</span>
                  </button>
                )}

                <button
                  onClick={handleBookSlot}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#256428] shadow-sm shrink-0"
                >
                  {t("dashboard.bookSlotBtn")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t("dashboard.quickActions")}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {t("dashboard.quickActionsDesc")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* BOOK PROCUREMENT SLOT */}

            <button
              onClick={handleBookSlot}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2E7D32] hover:shadow-md cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <CalendarDays className="h-6 w-6 text-[#2E7D32]" />
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                {t("dashboard.bookSlotActionTitle")}
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                {t("dashboard.bookSlotActionDesc")}
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#2E7D32]">
                {t("dashboard.bookNow")}

                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>

            {/* TRACK MY TOKEN */}

            <button
              onClick={handleTrackToken}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2E7D32] hover:shadow-md cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <Ticket className="h-6 w-6 text-[#2E7D32]" />
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                {t("dashboard.trackActionTitle")}
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                {t("dashboard.trackActionDesc")}
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#2E7D32]">
                {t("dashboard.trackNow")}

                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>

            {/* PROCUREMENT RECORDS / HISTORY CARD */}

            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2E7D32] hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5E9]">
                  <History className="h-6 w-6 text-[#2E7D32]" />
                </div>
                {pastRecords.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    {pastRecords.length} {t("dashboard.historyIconBtn")}
                  </span>
                )}
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                {t("dashboard.historyActionTitle")}
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                {t("dashboard.historyActionDesc")}
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#2E7D32]">
                <span>{t("dashboard.historyIconBtn")}</span>

                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>

        {/* ====================================================
            CURRENT BOOKING
        ==================================================== */}

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900">
            {t("dashboard.currentBooking")}
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            {t("dashboard.currentBookingDesc")}
          </p>

          {booking ? (
            <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* CENTRE */}

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 text-[#2E7D32]" />

                    {t("tracker.centreDetails")}
                  </div>

                  <p className="mt-2 font-bold text-gray-900">
                    {booking.centre ||
                      "Not available"}
                  </p>
                </div>

                {/* DATE */}

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays className="h-4 w-4 text-[#2E7D32]" />

                    {t("common.date")}
                  </div>

                  <p className="mt-2 font-bold text-gray-900">
                    {formatDate(booking.date)}
                  </p>
                </div>

                {/* CROP */}

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Wheat className="h-4 w-4 text-[#2E7D32]" />

                    {t("booking.cropLabel")}
                  </div>

                  {booking.crops && booking.crops.length > 1 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {booking.crops.map((c, idx) => (
                        <span key={idx} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800">
                          {c.crop}: {c.quantity} qtl
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 font-bold text-gray-900">
                      {booking.crop || "Not available"}
                    </p>
                  )}
                </div>

                {/* QUANTITY */}

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Truck className="h-4 w-4 text-[#2E7D32]" />

                    {booking.crops && booking.crops.length > 1 ? (t("booking.totalCombinedQuantity") || "Total Quantity") : t("booking.quantityLabel")}
                  </div>

                  <p className="mt-2 font-bold text-gray-900">
                    {booking.actualQuantity ?? booking.quantity ?? 0} {t("common.quintals")}
                    {booking.actualQuantity ? " (Weighed)" : ""}
                  </p>
                </div>
              </div>

              {/* ASSIGNED GRADE & CALCULATED PAYOUT (IF GRADED BY OFFICIAL) */}
              {(booking.cropGrade || booking.totalPayout || booking.mspRate) && (
                <div className="mt-6 rounded-2xl border border-[#CDE8D0] bg-[#F1F8F2] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E7D32] text-white">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                            {t("dashboard.cropQualityGradeAssigned")}
                          </span>
                          <span className="rounded-md bg-[#2E7D32] px-2 py-0.5 text-xs font-bold text-white">
                            {booking.cropGrade || "Grade A"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {t("dashboard.appliedMspRate")}{" "}
                          <strong>
                            ₹{(booking.mspRate ?? 0).toLocaleString(language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN")} / {t("common.quintals")}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {booking.status === "COMPLETED" ? t("dashboard.finalSettledPayout") : t("dashboard.estimatedDirectPayout")}
                      </p>
                      <p className="mt-1 text-2xl font-black text-[#2E7D32]">
                        {booking.status === "COMPLETED"
                          ? formatINR(booking.totalPayout ?? 0)
                          : (booking.estimatedPayoutRange || formatINR(booking.totalPayout ?? 0))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BOOKING STATUS */}

              <div className="mt-7 border-t border-gray-100 pt-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCancelled ? "bg-red-100 text-red-600" : "bg-[#E8F5E9] text-[#2E7D32]"}`}>
                      {isCancelled ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-gray-900">
                        {isCancelled ? t("dashboard.procurementCancelledNotice") : `${t("dashboard.bookingPrefix")} ${getDisplayStatus().toLowerCase().replace(/^./, (letter) => letter.toUpperCase())}`}
                      </p>

                      <p className="text-sm text-gray-500">
                        {isCancelled
                          ? t("dashboard.cancelledReasonPrefix", { reason: booking.cancellationReason || t("dashboard.cancelledByOfficial") })
                          : t("dashboard.tokenIsActive", { token: String(booking.token || (booking.tokenNumber ? String(booking.tokenNumber) : "---")) })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canFarmerCancel && (
                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 hover:border-red-300"
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                        {t("farmerCancel.cancelSlotBtn")}
                      </button>
                    )}
                    {isCancelled && (
                      <button
                        onClick={handleBookSlot}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256428]"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t("tracker.bookNewSlot")}
                      </button>
                    )}
                    <button
                      onClick={handleTrackToken}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#2E7D32] hover:text-[#2E7D32]"
                    >
                      {t("dashboard.trackTokenBtn")}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-gray-400" />

              <h3 className="mt-3 font-bold text-gray-900">
                {t("dashboard.noActiveToken")}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {t("dashboard.noTokenDesc")}
              </p>

              <button
                onClick={handleBookSlot}
                className="mt-5 rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#256428]"
              >
                {t("dashboard.bookSlotBtn")}
              </button>
            </div>
          )}
        </div>

        {/* ====================================================
            OFFICIAL MSP RATES (GRADED PRICING IN ₹/QUINTAL)
        ==================================================== */}

        <div className="mt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#2E7D32]">
                <Award className="h-3.5 w-3.5" />
                {t("dashboard.mspBoardBadge")}
              </div>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {t("dashboard.mspBoardTitle")}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t("dashboard.mspBoardDesc")}
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {["All", "Cereal", "Pulse", "Oilseed", "Commercial"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMspCategory(cat)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    mspCategory === cat
                      ? "bg-[#2E7D32] text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {getCategoryDisplayName(cat, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Search input & Grade view tab */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={mspSearch}
                onChange={(e) => setMspSearch(e.target.value)}
                placeholder={t("dashboard.searchCropPlaceholder")}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1 shrink-0">
                {t("dashboard.gradeFilterLabel")}
              </span>
              {(["ALL", "Grade A", "Grade B", "Grade C", "Grade D"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedGradeTab(tab)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shrink-0 ${
                    selectedGradeTab === tab
                      ? "bg-[#2E7D32] text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tab === "ALL" ? t("dashboard.allGradesTab") : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Crops Cards Grid */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {filteredMspRates.map((crop) => {
              const gradesToDisplay: CropGrade[] =
                selectedGradeTab === "ALL"
                  ? ["Grade A", "Grade B", "Grade C", "Grade D"]
                  : [selectedGradeTab];

              return (
                <div
                  key={crop.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F5E9] text-[#2E7D32]">
                        <Wheat className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{getCropDisplayName(crop, language)}</h3>
                          <span className="text-xs font-semibold text-gray-500">({language === "en" ? crop.nameHi : crop.name})</span>
                        </div>
                        <span className="inline-block text-[11px] font-semibold text-[#2E7D32]">
                          {getCategoryDisplayName(crop.category, language)} • {t("dashboard.baseStandardMsp")}: ₹{crop.standardMsp.toLocaleString(language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN")} / {t("common.quintals")}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600 shrink-0">
                      {t("common.perQuintal")}
                    </span>
                  </div>

                  {/* Graded Rates Matrix */}
                  <div className={`mt-4 grid gap-2.5 ${gradesToDisplay.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {gradesToDisplay.map((gradeKey) => {
                      const detail = crop.grades[gradeKey];
                      const isGradeA = gradeKey === "Grade A";
                      return (
                        <div
                          key={gradeKey}
                          className={`rounded-2xl border p-3.5 transition ${
                            isGradeA
                              ? "border-[#CDE8D0] bg-[#F1F8F2]"
                              : "border-gray-100 bg-[#F9FAF8]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                isGradeA
                                  ? "bg-[#2E7D32] text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {gradeKey}
                            </span>
                            <span className="text-sm font-extrabold text-[#2E7D32]">
                              ₹{detail.price.toLocaleString(language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN")}
                              <span className="text-[10px] font-normal text-gray-500"> / qtl</span>
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-bold text-gray-800 leading-tight">
                            {getGradeLabel(detail, language)}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
                            {getGradeSpecs(detail, language)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MSP Info Footer Banner */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50/90 border border-amber-200 p-4 text-xs leading-relaxed text-amber-900">
            <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>{t("dashboard.mspAssuranceTitle")}</strong> {t("dashboard.mspAssuranceDesc")}
            </p>
          </div>
        </div>

        {/* ====================================================
            SMART NOTIFICATION
        ==================================================== */}

        {booking && (
          <div className="mt-8 rounded-3xl border border-[#CDE8D0] bg-[#F1F8F2] p-6 sm:p-7">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">
                <Bell className="h-5 w-5 text-[#2E7D32]" />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Smart Arrival Recommendation
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  Based on your current queue, you
                  can arrive around{" "}
                  <strong>
                    {booking.arrivalTime ||
                      booking.time ||
                      "your scheduled time"}
                  </strong>{" "}
                  instead of waiting at the
                  procurement centre for a long time.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ====================================================
          MODAL: PREVIOUS COMPLETED & CANCELLED PROCUREMENTS
      ==================================================== */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop Dismiss */}
          <div
            className="fixed inset-0"
            onClick={() => setIsHistoryModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#0F3817] bg-gradient-to-r from-[#13491E] via-[#1B5E2B] to-[#13491E] px-5 sm:px-7 py-4 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                  <History className="h-5 w-5 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {t("dashboard.historyModalTitle")}
                    </h3>
                    <span className="rounded-full bg-emerald-400/30 border border-emerald-300/40 px-2.5 py-0.5 text-xs font-black text-emerald-100">
                      {pastRecords.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-emerald-200 max-w-xl">
                    {t("dashboard.historyModalSubtitle")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
                title={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="border-b border-gray-200 bg-[#F9FBF9] px-5 sm:px-7 py-3.5 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setHistoryTab("ALL")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      historyTab === "ALL"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t("dashboard.allRecordsTab")} ({pastRecords.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTab("COMPLETED")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      historyTab === "COMPLETED"
                        ? "bg-[#2E7D32] text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t("dashboard.completedRecordsTab")} ({completedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTab("CANCELLED")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      historyTab === "CANCELLED"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t("dashboard.cancelledRecordsTab")} ({cancelledCount})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder={t("dashboard.searchHistoryPlaceholder")}
                    className="w-full rounded-xl border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>
                  {t("dashboard.totalRecordsCount", { count: String(filteredPastRecords.length) })}
                </span>
                <span className="text-[11px] text-gray-400">
                  {farmer?.name} • +91 {farmer?.mobile}
                </span>
              </div>
            </div>

            {/* Modal Body / Records List */}
            <div className="overflow-y-auto p-5 sm:p-7 space-y-4">
              {filteredPastRecords.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <RotateCcw className="h-6 w-6" />
                  </div>
                  <h4 className="mt-4 text-base font-bold text-gray-900">
                    {t("dashboard.noHistoryFound")}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
                    {historySearchQuery
                      ? "No records matched your search query. Try searching with a different term."
                      : t("dashboard.noHistoryDesc")}
                  </p>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHistoryModalOpen(false);
                        handleBookSlot();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] px-4 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>{t("dashboard.bookSlotBtn")}</span>
                    </button>
                  </div>
                </div>
              ) : (
                filteredPastRecords.map((item, idx) => {
                  const itemToken = String(item.token || item.tokenNumber || item.bookingId || "---").replace(/^#/, "");
                  const isItemCompleted = isCompletedBooking(item);
                  const isItemCancelled = isCancelledBooking(item);
                  const itemQty = item.actualQuantity ?? item.quantity ?? 0;
                  const itemGrade = item.cropGrade || "Grade A";
                  const itemRate = item.mspRate || (item.crop ? getCropMspData(item.crop).standardMsp : 2425);
                  const itemPayout = item.totalPayout || Math.round(itemQty * itemRate);

                  return (
                    <div
                      key={item.bookingId || item.token || idx}
                      className={`relative overflow-hidden rounded-2xl border p-5 transition shadow-xs ${
                        isItemCompleted
                          ? "border-gray-200 bg-white hover:border-emerald-500 hover:shadow-md"
                          : "border-red-200 bg-red-50/40 hover:border-red-400 hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left Details */}
                        <div className="space-y-2.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-black text-white ${
                                isItemCompleted ? "bg-emerald-800" : "bg-red-800"
                              }`}
                            >
                              Token #{itemToken}
                            </span>

                            {isItemCompleted ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Completed & Cleared
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                                <XCircle className="h-3.5 w-3.5 text-red-600" />
                                Cancelled
                              </span>
                            )}

                            <span className="text-xs text-gray-300">•</span>

                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600">
                              <CalendarDays className="h-3.5 w-3.5 text-[#2E7D32]" />
                              <Clock3 className="h-3.5 w-3.5 text-[#2E7D32]" />
                              <span>{isItemCompleted ? t("dashboard.completedOn") : t("dashboard.cancelledOn")}:</span>
                              <strong className="text-gray-900 ml-0.5">
                                {isItemCompleted ? formatCompletedDateTime(item) : formatCancelledDateTime(item)}
                              </strong>
                            </span>
                          </div>

                          {/* Crop & Quantity */}
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-extrabold text-gray-900">
                              🌾 {item.crops && item.crops.length > 1
                                ? item.crops.map((c) => `${c.crop} (${c.actualQuantity ?? c.quantity}q)`).join(", ")
                                : `${item.crop || "Produce"} • ${itemQty} Quintals`}
                            </span>
                            {isItemCompleted && (
                              <>
                                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                  {itemGrade}
                                </span>
                                <span className="text-xs text-gray-600">
                                  MSP: <strong>₹{itemRate}/qtl</strong>
                                </span>
                              </>
                            )}
                          </div>

                          {/* Location / Centre */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                            <span>📍 Centre: <strong className="text-gray-800">{item.centre || "Mandi Yard"}</strong></span>
                            {item.bookingId && (
                              <span className="font-mono text-gray-400">ID: {item.bookingId}</span>
                            )}
                          </div>

                          {/* Cancellation Details if Cancelled */}
                          {isItemCancelled && (
                            <div className="mt-2 rounded-xl border border-red-200 bg-white p-3 text-xs space-y-1">
                              <p className="font-bold text-red-700">
                                {t("dashboard.cancellationReason")}: <span className="font-semibold text-gray-800">{item.cancellationReason || "Slot cancelled"}</span>
                              </p>
                              {item.cancelledBy && (
                                <p className="text-gray-500 text-[11px]">
                                  {t("dashboard.cancelledBy")}: <strong className="text-gray-700">{item.cancelledBy}</strong>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Payout / Actions */}
                        <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                          {isItemCompleted ? (
                            <>
                              <div className="text-left lg:text-right">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                  Settled Payout (DBT)
                                </p>
                                <p className="text-xl font-black text-[#2E7D32]">
                                  {formatINR(itemPayout)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => openReceiptModal(item)}
                                className="flex items-center gap-1.5 rounded-xl border border-[#2E7D32] bg-emerald-50 hover:bg-[#2E7D32] hover:text-white px-3.5 py-2 text-xs font-bold text-[#2E7D32] transition active:scale-95 cursor-pointer shadow-2xs"
                              >
                                <ReceiptText className="h-3.5 w-3.5" />
                                <span>{t("dashboard.viewJSlip")}</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-2 w-full sm:w-auto">
                              <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                Cancelled Slot
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsHistoryModalOpen(false);
                                  handleBookSlot();
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer shadow-2xs"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>{t("dashboard.bookNewSlotBtn")}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <FarmerCancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        booking={booking}
        onCancelled={(updated) => {
          setBooking(updated);
          setIsCancelModalOpen(false);
        }}
      />

      <MandiJSlipModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        booking={selectedReceiptBooking}
      />
    </main>
  );
}