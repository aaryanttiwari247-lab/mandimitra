"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Sprout,
  Ticket,
  Truck,
  User,
  Wheat,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

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

  time?: string;
  fullTime?: string;

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

type ProcurementStatus =
  | "WAITING"
  | "VERIFIED"
  | "PROCESSING"
  | "COMPLETED";

function ProcurementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenFromUrl = searchParams.get("token");

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD BOOKING
  // ============================================================

  const loadBooking = useCallback(() => {
    setLoading(true);
    setError("");

    try {
      if (!tokenFromUrl) {
        setError("No token was provided.");
        setBooking(null);
        setLoading(false);
        return;
      }

      const queueData =
        localStorage.getItem(
          "smartProcurementQueue"
        );

      if (!queueData) {
        setError(
          "No procurement queue was found."
        );
        setBooking(null);
        setLoading(false);
        return;
      }

      const queue: Booking[] =
        JSON.parse(queueData);

      if (!Array.isArray(queue)) {
        setError(
          "Invalid procurement queue."
        );
        setBooking(null);
        setLoading(false);
        return;
      }

      const found = queue.find(
        (item) =>
          String(item.token ?? "").toUpperCase() ===
          String(tokenFromUrl).toUpperCase()
      );

      if (!found) {
        setError(
          `No booking found for token ${tokenFromUrl}.`
        );
        setBooking(null);
        setLoading(false);
        return;
      }

      setBooking(found);
    } catch (err) {
      console.error(
        "Unable to load procurement booking:",
        err
      );

      setError(
        "Unable to load procurement details."
      );

      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBooking();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadBooking]);

  // ============================================================
  // NORMALIZE STATUS
  // ============================================================

  const getStatus = (
    item: Booking
  ): ProcurementStatus => {
    const status = String(
      item.status ??
        item.queueStatus ??
        item.procurementStatus ??
        "WAITING"
    ).toUpperCase();

    if (status.includes("COMPLETED")) {
      return "COMPLETED";
    }

    if (status.includes("PROCESSING")) {
      return "PROCESSING";
    }

    if (status.includes("VERIFIED")) {
      return "VERIFIED";
    }

    return "WAITING";
  };

  const currentStatus = booking
    ? getStatus(booking)
    : "WAITING";

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return "Not available";
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
  // UPDATE STATUS
  // ============================================================

  const updateProcurementStatus = (
    newStatus: ProcurementStatus
  ) => {
    if (!booking) {
      return;
    }

    setActionLoading(true);

    try {
      const queueData =
        localStorage.getItem(
          "smartProcurementQueue"
        );

      if (!queueData) {
        alert(
          "Procurement queue not found."
        );

        setActionLoading(false);
        return;
      }

      const queue: Booking[] =
        JSON.parse(queueData);

      const now =
        new Date().toISOString();

      const updatedQueue =
        queue.map((item) => {
          const sameBooking =
            booking.bookingId &&
            item.bookingId ===
              booking.bookingId;

          const sameToken =
            item.token &&
            booking.token &&
            item.token.toUpperCase() ===
              booking.token.toUpperCase();

          if (
            !sameBooking &&
            !sameToken
          ) {
            return item;
          }

          const updatedItem: Booking = {
            ...item,

            status: newStatus,

            queueStatus: newStatus,

            procurementStatus:
              newStatus,

            updatedAt: now,
          };

          if (
            newStatus === "PROCESSING"
          ) {
            updatedItem.processingStartedAt =
              now;
          }

          if (
            newStatus === "COMPLETED"
          ) {
            updatedItem.completedAt =
              now;
          }

          return updatedItem;
        });

      localStorage.setItem(
        "smartProcurementQueue",
        JSON.stringify(updatedQueue)
      );

      const updatedBooking: Booking = {
        ...booking,

        status: newStatus,

        queueStatus: newStatus,

        procurementStatus:
          newStatus,

        updatedAt: now,
      };

      if (
        newStatus === "PROCESSING"
      ) {
        updatedBooking.processingStartedAt =
          now;
      }

      if (
        newStatus === "COMPLETED"
      ) {
        updatedBooking.completedAt =
          now;
      }

      setBooking(updatedBooking);

      window.dispatchEvent(
        new Event(
          "smartProcurementQueueUpdated"
        )
      );

      if (
        newStatus === "PROCESSING"
      ) {
        alert(
          `Token ${booking.token} is now being processed.`
        );
      }

      if (
        newStatus === "COMPLETED"
      ) {
        alert(
          `Procurement for token ${booking.token} has been completed.`
        );
      }
    } catch (err) {
      console.error(
        "Unable to update procurement status:",
        err
      );

      alert(
        "Unable to update procurement status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // START PROCUREMENT
  // ============================================================

  const handleStartProcurement = () => {
    if (!booking) {
      return;
    }

    if (currentStatus !== "VERIFIED") {
      alert(
        "Farmer must be verified before procurement can start."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Start procurement for token ${booking.token}?`
      );

    if (!confirmed) {
      return;
    }

    updateProcurementStatus(
      "PROCESSING"
    );
  };

  // ============================================================
  // COMPLETE PROCUREMENT
  // ============================================================

  const handleCompleteProcurement = () => {
    if (!booking) {
      return;
    }

    if (
      currentStatus !== "PROCESSING"
    ) {
      alert(
        "Procurement must be in processing state before completing it."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Complete procurement for token ${booking.token}?`
      );

    if (!confirmed) {
      return;
    }

    updateProcurementStatus(
      "COMPLETED"
    );
  };

  // ============================================================
  // VERIFY FARMER NAVIGATION
  // ============================================================

  const handleVerifyFarmer = () => {
    const token = booking?.token;

    console.log(
      "VERIFY BUTTON CLICKED"
    );

    console.log(
      "TOKEN:",
      token
    );

    if (!token) {
      alert(
        "Token is missing. Unable to open verification page."
      );
      return;
    }

    const url =
      `/official/verify?token=${encodeURIComponent(
        token
      )}`;

    console.log(
      "Navigating to:",
      url
    );

    router.push(url);
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
            Loading procurement details...
          </p>

        </div>

      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#F7F9F5]">

        <header className="border-b border-gray-200 bg-white">

          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">

            <button
              onClick={() =>
                router.push(
                  "/official/dashboard"
                )
              }
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#2E7D32]"
            >

              <ArrowLeft className="h-4 w-4" />

              Back to Dashboard

            </button>

            <div className="flex items-center gap-2 font-semibold text-[#2E7D32]">

              <Sprout className="h-5 w-5" />

              Smart Procurement

            </div>

          </div>

        </header>

        <section className="px-5 py-16 sm:px-8">

          <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">

              <Ticket className="h-8 w-8 text-red-500" />

            </div>

            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Booking Not Found
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/official/dashboard"
                )
              }
              className="mt-6 w-full rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#256428]"
            >
              Return to Dashboard
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

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">

          <button
            onClick={() =>
              router.push(
                "/official/dashboard"
              )
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#2E7D32]"
          >

            <ArrowLeft className="h-4 w-4" />

            Back to Dashboard

          </button>

          <div className="flex items-center gap-2 font-semibold text-[#2E7D32]">

            <Sprout className="h-5 w-5" />

            Smart Procurement

          </div>

        </div>

      </header>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <section className="px-5 py-8 sm:px-8">

        <div className="mx-auto max-w-5xl">

          {/* TITLE */}

          <div className="mb-7">

            <p className="text-sm font-medium text-[#2E7D32]">
              Procurement Officer
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Procurement Processing
            </h1>

            <p className="mt-2 text-gray-600">
              Manage the procurement process for the farmer.
            </p>

          </div>


          {/* ====================================================
              STATUS HEADER
          ==================================================== */}

          <div className="overflow-hidden rounded-3xl bg-[#2E7D32]">

            <div className="p-6 sm:p-8">

              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

                <div className="text-white">

                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">

                    <Ticket className="h-5 w-5" />

                    PROCUREMENT TOKEN

                  </div>

                  <div className="mt-3 text-5xl font-bold">
                    #{booking.token}
                  </div>

                  <p className="mt-3 text-sm text-white/80">

                    {booking.farmerName ??
                      "Farmer"}{" "}

                    •{" "}

                    {booking.crop ??
                      "Crop not specified"}

                  </p>

                </div>


                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-xs text-white/70">
                    Current Status
                  </p>

                  <p className="mt-1 text-xl font-bold text-white">
                    {currentStatus}
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ====================================================
              FARMER DETAILS
          ==================================================== */}

          <div className="mt-7">

            <h2 className="text-xl font-bold text-gray-900">
              Farmer Details
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <InfoCard
                icon={
                  <User className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Farmer"
                value={
                  booking.farmerName ??
                  "Farmer"
                }
              />

              <InfoCard
                icon={
                  <Ticket className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Farmer ID"
                value={
                  booking.farmerId ??
                  "Not available"
                }
              />

              <InfoCard
                icon={
                  <MapPin className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Centre"
                value={
                  booking.centre ??
                  "Not available"
                }
              />

            </div>

          </div>


          {/* ====================================================
              PROCUREMENT DETAILS
          ==================================================== */}

          <div className="mt-7">

            <h2 className="text-xl font-bold text-gray-900">
              Procurement Details
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <InfoCard
                icon={
                  <Wheat className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Crop"
                value={
                  booking.crop ??
                  "Not available"
                }
              />

              <InfoCard
                icon={
                  <Truck className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Quantity"
                value={
                  booking.quantity
                    ? `${booking.quantity} Quintals`
                    : "Not available"
                }
              />

              <InfoCard
                icon={
                  <Clock3 className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Time Slot"
                value={
                  booking.fullTime ??
                  booking.time ??
                  "Not available"
                }
              />

              <InfoCard
                icon={
                  <Clock3 className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Date"
                value={formatDate(
                  booking.date
                )}
              />

            </div>

          </div>


          {/* ====================================================
              PROCESS TIMELINE
          ==================================================== */}

          <div className="mt-7 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold text-gray-900">
              Procurement Progress
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Current stage of this farmer&apos;s procurement.
            </p>

            <div className="mt-7">

              <ProgressStep
                title="Farmer Verified"
                description="Farmer identity and booking details verified."
                completed={
                  currentStatus ===
                    "VERIFIED" ||
                  currentStatus ===
                    "PROCESSING" ||
                  currentStatus ===
                    "COMPLETED"
                }
                current={
                  currentStatus ===
                  "VERIFIED"
                }
              />

              <ProgressStep
                title="Procurement Processing"
                description="Crop is currently being procured."
                completed={
                  currentStatus ===
                    "PROCESSING" ||
                  currentStatus ===
                    "COMPLETED"
                }
                current={
                  currentStatus ===
                  "PROCESSING"
                }
              />

              <ProgressStep
                title="Procurement Completed"
                description="Crop procurement has been successfully completed."
                completed={
                  currentStatus ===
                  "COMPLETED"
                }
                current={
                  currentStatus ===
                  "COMPLETED"
                }
                last
              />

            </div>

          </div>


          {/* ====================================================
              ACTION AREA
          ==================================================== */}

          <div className="mt-7 rounded-3xl border border-[#CDE8D0] bg-[#F1F8F2] p-6 sm:p-8">

            {/* WAITING */}

            {currentStatus ===
              "WAITING" && (
              <div>

                <h2 className="font-bold text-gray-900">
                  Farmer Verification Required
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  This farmer must be verified before procurement can begin.
                </p>

                <button
                  onClick={
                    handleVerifyFarmer
                  }
                  disabled={!booking.token}
                  className="mt-5 rounded-xl bg-[#2E7D32] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Verify Farmer
                </button>

              </div>
            )}


            {/* VERIFIED */}

            {currentStatus ===
              "VERIFIED" && (
              <div>

                <h2 className="font-bold text-gray-900">
                  Farmer Verified
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  The farmer has been verified. Procurement can now begin.
                </p>

                <button
                  onClick={
                    handleStartProcurement
                  }
                  disabled={actionLoading}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <Clock3 className="h-5 w-5" />

                  {actionLoading
                    ? "Starting..."
                    : "Start Procurement"}

                </button>

              </div>
            )}


            {/* PROCESSING */}

            {currentStatus ===
              "PROCESSING" && (
              <div>

                <h2 className="font-bold text-gray-900">
                  Procurement In Progress
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Record the procurement as completed once the crop has been received and processed.
                </p>

                <button
                  onClick={
                    handleCompleteProcurement
                  }
                  disabled={actionLoading}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <CheckCircle2 className="h-5 w-5" />

                  {actionLoading
                    ? "Completing..."
                    : "Complete Procurement"}

                </button>

              </div>
            )}


            {/* COMPLETED */}

            {currentStatus ===
              "COMPLETED" && (
              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">

                  <CheckCircle2 className="h-6 w-6 text-[#2E7D32]" />

                </div>

                <div>

                  <h2 className="font-bold text-gray-900">
                    Procurement Completed
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-600">

                    Token{" "}

                    <strong>
                      {booking.token}
                    </strong>{" "}

                    has completed the procurement process successfully.

                  </p>

                </div>

              </div>
            )}

          </div>


          {/* ====================================================
              BACK BUTTON
          ==================================================== */}

          <button
            onClick={() =>
              router.push(
                "/official/dashboard"
              )
            }
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-[#2E7D32] hover:text-[#2E7D32]"
          >

            <ArrowLeft className="h-4 w-4" />

            Back to Official Dashboard

          </button>


          <p className="mt-5 text-center text-xs text-gray-400">
            Procurement status is synchronized with the farmer queue.
          </p>

        </div>

      </section>

    </main>
  );
}


// ================================================================
// INFO CARD
// ================================================================

function InfoCard({
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


// ================================================================
// PROGRESS STEP
// ================================================================

function ProgressStep({
  title,
  description,
  completed,
  current,
  last = false,
}: {
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  last?: boolean;
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
              current
                ? "text-[#2E7D32]"
                : completed
                ? "text-gray-900"
                : "text-gray-500"
            }`}
          >
            {title}
          </h3>

          {current && (
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

export default function OfficialProcurementPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5]">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
              <Sprout className="h-7 w-7 animate-pulse text-[#2E7D32]" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              Loading procurement details...
            </p>
          </div>
        </main>
      }
    >
      <ProcurementContent />
    </Suspense>
  );
}