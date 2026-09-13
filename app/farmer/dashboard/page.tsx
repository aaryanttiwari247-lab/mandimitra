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
  IndianRupee,
  Info,
  MapPin,
  Mic,
  RotateCcw,
  Search,
  Sprout,
  Ticket,
  TrendingUp,
  Truck,
  Users,
  Wheat,
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
} from "@/lib/msp-rates";
import { FarmerCancellationModal } from "@/components/FarmerCancellationModal";
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
    mspRate?: number;
    totalPayout?: number;
  }>;

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

  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;

  arrivalTime?: string;

  createdAt?: string;
  updatedAt?: string;
};

export default function FarmerDashboard() {
  const router = useRouter();
  const { t } = useLanguage();

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [farmer, setFarmer] = useState<FarmerUser | null>(null);

  const [booking, setBooking] =
    useState<Booking | null>(null);

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

  // ============================================================
  // LOAD BOOKING
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
          // If stored booking belongs to another farmer, clean it up
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
        } catch {
          // Ignore invalid queue data
        }
      }
    }

    setBooking(currentBooking);

    // 3. Fetch live server queue to sync verification/procurement status across devices
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
          }
        })
        .catch(() => {});
    }
  }, [router]);

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
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    clearFarmerSession();

    router.replace("/");
  };

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
  const canFarmerCancel = Boolean(booking && !isCancelled && getDisplayStatus() !== "PROCESSING" && getDisplayStatus() !== "COMPLETED");

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
    <main className="min-h-screen bg-[#F7F9F5] text-[#111827]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          {/* LOGO */}

          <button
            onClick={() =>
              router.push(
                "/farmer/dashboard"
              )
            }
            className="flex items-center gap-3"
          >
            <BrandLogo size="md" />

            <div className="text-left">
              <p className="text-lg font-bold text-[#2E7D32]">
                {t("common.appName")}
              </p>

              <p className="text-xs text-gray-500">
                {t("common.tagline")}
              </p>
            </div>
          </button>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openVoiceAssistant()}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs sm:text-sm font-bold text-[#2E7D32] hover:bg-emerald-100 hover:border-emerald-300 transition shadow-2xs"
              title="MandiHelp"
            >
              <Mic className="h-4 w-4 text-[#2E7D32]" />
              <span className="hidden md:inline">MandiHelp</span>
            </button>

            <LanguageSelector />

            <div className="hidden h-9 w-px bg-gray-200 sm:block" />

            {/* FARMER PROFILE */}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2E7D32] text-sm font-bold text-white shadow-xs">
                {(farmer?.name || "F").charAt(0).toUpperCase()}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {farmer?.name || "Farmer"}
                </p>

                <p className="text-xs text-gray-500">
                  +91 {farmer?.mobile}
                </p>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 transition hover:text-red-600"
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
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("dashboard.farmerAccount")}</p>
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

              <button
                onClick={handleBookSlot}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#256428] shadow-sm shrink-0"
              >
                {t("dashboard.bookSlotBtn")}
                <ArrowRight className="h-4 w-4" />
              </button>
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

          <div className="grid gap-4 sm:grid-cols-2">
            {/* BOOK PROCUREMENT SLOT */}

            <button
              onClick={handleBookSlot}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2E7D32] hover:shadow-md"
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
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2E7D32] hover:shadow-md"
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
                            Crop Quality Grade Assigned
                          </span>
                          <span className="rounded-md bg-[#2E7D32] px-2 py-0.5 text-xs font-bold text-white">
                            {booking.cropGrade || "Grade A"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          Applied MSP Rate:{" "}
                          <strong>
                            ₹{(booking.mspRate ?? 0).toLocaleString("en-IN")} / quintal
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {booking.status === "COMPLETED" ? "Final Settled Payout (DBT)" : "Estimated Direct Payout"}
                      </p>
                      <p className="mt-1 text-2xl font-black text-[#2E7D32]">
                        {formatINR(booking.totalPayout ?? 0)}
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
                        {isCancelled ? "Procurement Cancelled" : `Booking ${getDisplayStatus().toLowerCase().replace(/^./, (letter) => letter.toUpperCase())}`}
                      </p>

                      <p className="text-sm text-gray-500">
                        {isCancelled
                          ? `Reason: ${booking.cancellationReason || "Cancelled by official"}`
                          : `Token #${booking.token || (booking.tokenNumber ? String(booking.tokenNumber) : "---")} is active.`}
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
                Government Support Prices (2025–26)
              </div>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Official MSP Rate Board (₹ / Quintal)
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Government Minimum Support Prices categorized by quality grades (<strong>Grade A, Grade B, Grade C, Grade D</strong>). When you arrive at the mandi, the procurement official selects the crop grade after moisture checks to calculate your total payout.
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
                  {cat === "All" ? "All Crops" : `${cat}s`}
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
                placeholder="Search crop (e.g. Wheat, Mustard)..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1 shrink-0">
                Grade Filter:
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
                  {tab === "ALL" ? "All Grades (A, B, C, D)" : tab}
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
                          <h3 className="text-lg font-bold text-gray-900">{crop.name}</h3>
                          <span className="text-xs font-semibold text-gray-500">({crop.nameHi})</span>
                        </div>
                        <span className="inline-block text-[11px] font-semibold text-[#2E7D32]">
                          {crop.category} • Base Standard MSP: ₹{crop.standardMsp.toLocaleString("en-IN")} / quintal
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600 shrink-0">
                      ₹ / quintal
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
                              ₹{detail.price.toLocaleString("en-IN")}
                              <span className="text-[10px] font-normal text-gray-500"> / qtl</span>
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-bold text-gray-800 leading-tight">
                            {detail.label}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
                            {detail.specs}
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
              <strong>Official MSP Quality Assurance:</strong> Rates are notified under the Commission for Agricultural Costs and Prices (CACP) benchmarks for 2025–26 in <strong>₹ per quintal</strong>. During weighment, digital moisture sensors and cleaning sieves assess the lot to assign the fair grade (Grade A, B, C, or D). The full amount is transferred directly to your bank account via PFMS/DBT.
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

      <FarmerCancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        booking={booking}
        onCancelled={(updated) => {
          setBooking(updated);
          setIsCancelModalOpen(false);
        }}
      />
    </main>
  );
}