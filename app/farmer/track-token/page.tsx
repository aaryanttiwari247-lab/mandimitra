"use client";

import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";


import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Sprout,
  Ticket,
  Truck,
  Volume2,
  Wheat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Booking = {
  bookingId?: string;
  tokenNumber?: number;
  token?: string;

  farmerId?: string;
  farmerName?: string;
  farmerMobile?: string;

  crop?: string;
  quantity?: number;

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

type FarmerSession = {
  farmerId?: string;
  id?: string;
  userId?: string;
  farmerName?: string;
  name?: string;
};

type DisplayStatus =
  | "WAITING"
  | "CALLED"
  | "VERIFIED"
  | "PROCESSING"
  | "COMPLETED";

export default function FarmerTrackToken() {
  const router = useRouter();
  const { t } = useLanguage();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  // ============================================================
  // GET CURRENT FARMER ID
  // ============================================================

  const getCurrentFarmerId = (): string | null => {
    try {
      const possibleKeys = [
        "farmerSession",
        "smartProcurementFarmer",
        "farmer",
        "currentFarmer",
        "smartProcurementUser",
      ];

      for (const key of possibleKeys) {
        const raw = localStorage.getItem(key);

        if (!raw) continue;

        try {
          const parsed: FarmerSession = JSON.parse(raw);

          const id =
            parsed.farmerId ??
            parsed.id ??
            parsed.userId;

          if (id) {
            return String(id);
          }
        } catch {
          // Ignore invalid JSON and continue.
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  // ============================================================
  // LOAD CURRENT FARMER BOOKING
  // ============================================================

  const loadBooking = useCallback(() => {
    try {
      const queueData = localStorage.getItem(
        "smartProcurementQueue"
      );

      const currentBookingData =
        localStorage.getItem(
          "smartProcurementBooking"
        );

      let queue: Booking[] = [];

      if (queueData) {
        try {
          const parsed = JSON.parse(queueData);

          if (Array.isArray(parsed)) {
            queue = parsed;
          }
        } catch {
          queue = [];
        }
      }

      let currentBooking: Booking | null = null;

      if (currentBookingData) {
        try {
          currentBooking =
            JSON.parse(currentBookingData);
        } catch {
          currentBooking = null;
        }
      }

      const farmerId = getCurrentFarmerId();

      let foundBooking: Booking | null = null;

      // ========================================================
      // 1. BEST MATCH — BOOKING ID
      // ========================================================

      if (currentBooking?.bookingId) {
        foundBooking =
          queue.find(
            (item) =>
              item.bookingId ===
              currentBooking?.bookingId
          ) ?? null;
      }

      // ========================================================
      // 2. MATCH CURRENT TOKEN
      // ========================================================

      if (!foundBooking && currentBooking?.token) {
        foundBooking =
          queue.find(
            (item) =>
              item.token ===
              currentBooking?.token
          ) ?? null;
      }

      // ========================================================
      // 3. MATCH CURRENT FARMER ID
      // ========================================================

      if (!foundBooking && farmerId) {
        const farmerBookings = queue.filter(
          (item) =>
            item.farmerId &&
            String(item.farmerId) ===
              String(farmerId)
        );

        if (farmerBookings.length > 0) {
          foundBooking =
            [...farmerBookings].sort(
              (a, b) =>
                new Date(
                  b.createdAt ?? 0
                ).getTime() -
                new Date(
                  a.createdAt ?? 0
                ).getTime()
            )[0] ?? null;
        }
      }

      // ========================================================
      // 4. USE CURRENT BOOKING ONLY IF IT BELONGS TO USER
      // ========================================================

      if (!foundBooking && currentBooking) {
        if (
          !currentBooking.farmerId ||
          !farmerId ||
          String(currentBooking.farmerId) ===
            String(farmerId)
        ) {
          foundBooking = currentBooking;
        }
      }

      // ========================================================
      // IMPORTANT:
      // DO NOT FALL BACK TO RANDOM / NEWEST QUEUE ITEM.
      //
      // This prevents A103/A104/A105/etc. from being shown
      // for another farmer.
      // ========================================================

      setBooking(foundBooking);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Unable to load procurement booking:",
        error
      );

      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "smartProcurementQueueUpdated",
      handleQueueUpdate
    );

    const interval = window.setInterval(
      loadBooking,
      3000
    );

    return () => {
      clearTimeout(timer);

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "smartProcurementQueueUpdated",
        handleQueueUpdate
      );

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
  // VOICE
  // ============================================================

  const handleVoiceHelp = () => {
    alert(
      "Voice assistance will be connected soon."
    );
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
                      #{booking.token ?? "A---"}
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

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
                  booking.quantity !==
                  undefined
                    ? `${booking.quantity} Quintals`
                    : "Not available"
                }
              />

            </div>

          </div>

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

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">

            <button
              onClick={() =>
                router.push(
                  "/farmer/dashboard"
                )
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-[#2E7D32] hover:text-[#2E7D32]"
            >

              <ArrowLeft className="h-4 w-4" />

              Back to Dashboard

            </button>

            <button
              onClick={handleVoiceHelp}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-[#2E7D32] hover:text-[#2E7D32]"
            >

              <Volume2 className="h-4 w-4" />

              Listen / Voice Assistance

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