"use client";

import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Scale,
  Sprout,
  Ticket,
  Truck,
  User,
  Wheat,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  CropGrade,
  getCropMspData,
  calculatePayout,
  formatINR,
} from "@/lib/msp-rates";
import { broadcastProcurementUpdate } from "@/lib/cross-tab-sync";

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
  paymentStatus?: "PENDING" | "CALCULATED" | "APPROVED" | "PAID";

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

  const [selectedGrade, setSelectedGrade] =
    useState<CropGrade>("Grade A");

  const [verifiedWeight, setVerifiedWeight] =
    useState<string>("");

  useEffect(() => {
    if (booking) {
      if (booking.cropGrade) {
        setSelectedGrade(booking.cropGrade);
      }
      const initialQty =
        booking.actualQuantity ?? booking.quantity ?? 0;
      setVerifiedWeight(String(initialQty));
    }
  }, [
    booking?.bookingId,
    booking?.token,
    booking?.cropGrade,
    booking?.quantity,
    booking?.actualQuantity,
  ]);

  const cropMspInfo = useMemo(() => {
    return getCropMspData(booking?.crop);
  }, [booking?.crop]);

  const livePayoutCalc = useMemo(() => {
    const qty = parseFloat(verifiedWeight) || 0;
    return calculatePayout(booking?.crop, selectedGrade, qty);
  }, [booking?.crop, selectedGrade, verifiedWeight]);

  // ============================================================
  // LOAD BOOKING
  // ============================================================

  const loadBooking = useCallback(() => {
    setLoading(true);
    setError("");

    if (!tokenFromUrl) {
      setError("No token was provided.");
      setBooking(null);
      setLoading(false);
      return;
    }

    let foundFromLocal: Booking | null = null;
    try {
      const queueData = localStorage.getItem("smartProcurementQueue");
      if (queueData) {
        const queue: Booking[] = JSON.parse(queueData);
        if (Array.isArray(queue)) {
          foundFromLocal =
            queue.find(
              (item) =>
                String(item.token ?? "").toUpperCase() === String(tokenFromUrl).toUpperCase() ||
                String(item.bookingId ?? "").toUpperCase() === String(tokenFromUrl).toUpperCase()
            ) ?? null;
        }
      }
    } catch {}

    if (foundFromLocal) {
      setBooking(foundFromLocal);
      setLoading(false);
    }

    // Also fetch live from server
    fetch(`/api/bookings/track/${encodeURIComponent(tokenFromUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.booking) {
          setBooking(data.booking);
          setError("");
          try {
            const queueData = localStorage.getItem("smartProcurementQueue");
            const queue: Booking[] = queueData ? JSON.parse(queueData) : [];
            const idx = queue.findIndex(
              (b) =>
                (b.token && b.token.toUpperCase() === String(tokenFromUrl).toUpperCase()) ||
                (b.bookingId && b.bookingId === data.booking.bookingId)
            );
            if (idx !== -1) {
              queue[idx] = { ...queue[idx], ...data.booking };
            } else {
              queue.push(data.booking);
            }
            localStorage.setItem("smartProcurementQueue", JSON.stringify(queue));
          } catch {}
        } else if (!foundFromLocal) {
          setError(`No booking found for token ${tokenFromUrl}.`);
        }
      })
      .catch((err) => {
        console.warn("Unable to fetch live procurement booking:", err);
        if (!foundFromLocal) {
          setError(`No booking found for token ${tokenFromUrl}.`);
        }
      })
      .finally(() => {
        setLoading(false);
      });
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
    newStatus: ProcurementStatus,
    extraUpdates?: Partial<Booking>
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
            ...extraUpdates,

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
        ...extraUpdates,

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

      // Also update current booking in localStorage if matched
      try {
        const currentBookingData = localStorage.getItem("smartProcurementBooking");
        if (currentBookingData) {
          const currentBooking: Booking = JSON.parse(currentBookingData);
          const sameBooking = booking.bookingId && currentBooking.bookingId === booking.bookingId;
          const sameToken = booking.token && currentBooking.token && booking.token.toUpperCase().replace(/^#/, "") === currentBooking.token.toUpperCase().replace(/^#/, "");
          if (sameBooking || sameToken) {
            localStorage.setItem("smartProcurementBooking", JSON.stringify(updatedBooking));
          }
        }
      } catch {}

      setBooking(updatedBooking);

      window.dispatchEvent(
        new Event(
          "smartProcurementQueueUpdated"
        )
      );
      window.dispatchEvent(
        new Event(
          "smartProcurementBookingUpdated"
        )
      );

      // Real-time broadcast to farmer tabs
      broadcastProcurementUpdate({
        type: "STATUS_UPDATED",
        token: booking.token,
        bookingId: booking.bookingId,
        status: newStatus,
        booking: updatedBooking as any,
      });

      // Sync with server API (cross-tab & cross-device)
      const identifier = booking.bookingId || booking.token || "";
      if (identifier) {
        fetch(`/api/official/queue/${encodeURIComponent(identifier)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            ...extraUpdates,
          }),
        }).catch((err) => console.warn("Procurement status API sync error:", err));
      }

      fetch("/api/official/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBooking),
      }).catch((err) => console.warn("Procurement queue API sync error:", err));

      if (
        newStatus === "PROCESSING"
      ) {
        alert(
          `Token #${booking.token} is now processing.\nGrade: ${extraUpdates?.cropGrade || selectedGrade}\nMSP Rate: ₹${extraUpdates?.mspRate || livePayoutCalc.ratePerQuintal}/quintal\nTotal Payout: ${formatINR(extraUpdates?.totalPayout || livePayoutCalc.totalPayout)}`
        );
      }

      if (
        newStatus === "COMPLETED"
      ) {
        alert(
          `Procurement for token #${booking.token} has been successfully completed! Direct Bank Transfer (DBT) has been authorized.`
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

    const weightNum = parseFloat(verifiedWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert("Please enter a valid weighed quantity in quintals (must be greater than 0).");
      return;
    }

    const mspCalc = calculatePayout(booking.crop, selectedGrade, weightNum);

    const confirmed =
      window.confirm(
        `Start Procurement Confirmation:\n• Crop: ${booking.crop}\n• Quality Grade: ${selectedGrade} (${mspCalc.gradeLabel})\n• Weighed Quantity: ${weightNum} Quintals\n• Applied MSP Rate: ₹${mspCalc.ratePerQuintal.toLocaleString("en-IN")} / quintal\n• Calculated Farmer Payout: ${formatINR(mspCalc.totalPayout)}\n\nProceed to start procurement?`
      );

    if (!confirmed) {
      return;
    }

    updateProcurementStatus(
      "PROCESSING",
      {
        cropGrade: selectedGrade,
        actualQuantity: weightNum,
        mspRate: mspCalc.ratePerQuintal,
        totalPayout: mspCalc.totalPayout,
        paymentStatus: "CALCULATED",
      }
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

    const finalPayout = booking.totalPayout || livePayoutCalc.totalPayout;
    const confirmed =
      window.confirm(
        `Complete Procurement for Token #${booking.token}?\nFarmer: ${booking.farmerName}\nGrade: ${booking.cropGrade || selectedGrade}\nTotal Payout: ${formatINR(finalPayout)}\n\nThis will authorize the final settlement slip and direct bank transfer.`
      );

    if (!confirmed) {
      return;
    }

    updateProcurementStatus(
      "COMPLETED",
      {
        paymentStatus: "APPROVED",
      }
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

  const handleQuickVerify = () => {
    if (!booking) return;
    const confirmed = window.confirm(
      `Quick Verification for Farmer ${booking.farmerName ?? ""} (Token #${booking.token}):\n• Produce: ${booking.crop}\n• Quantity: ${booking.quantity} quintals\n• Centre: ${booking.centre}\n\nVerify this farmer now and proceed immediately to MSP Quality Grading?`
    );
    if (!confirmed) return;
    updateProcurementStatus("VERIFIED", {
      verifiedBy: "Procurement Officer",
    });
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

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

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
                  booking.actualQuantity
                    ? `${booking.actualQuantity} Quintals (Weighed)`
                    : booking.quantity
                    ? `${booking.quantity} Quintals`
                    : "Not available"
                }
              />

              <InfoCard
                icon={
                  <Award className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Assigned Quality Grade"
                value={
                  booking.cropGrade
                    ? `${booking.cropGrade}`
                    : (currentStatus === "VERIFIED" ? `${selectedGrade} (Pending Start)` : "Pending Grading")
                }
              />

              <InfoCard
                icon={
                  <IndianRupee className="h-5 w-5 text-[#2E7D32]" />
                }
                label="MSP Rate Applied"
                value={
                  booking.mspRate
                    ? `₹${booking.mspRate.toLocaleString("en-IN")} / quintal`
                    : `₹${livePayoutCalc.ratePerQuintal.toLocaleString("en-IN")} / quintal`
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
                title="Procurement Processing & Grading"
                description="Crop quality assessed, MSP rate applied, and procurement recorded."
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
                title="Procurement Completed & Payout Settled"
                description="Procurement finalized and DBT payment authorized."
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

            {/* WAITING OR CALLED */}
            {currentStatus === "WAITING" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Farmer Verification Required
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  This farmer must be verified before procurement grading and weighbridge entry can begin.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleQuickVerify}
                    disabled={!booking.token || actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Quick Verify at Counter & Proceed to Grading
                  </button>

                  <button
                    onClick={handleVerifyFarmer}
                    disabled={!booking.token || actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-[#2E7D32] hover:text-[#2E7D32] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
                    Open Full Document Verification (Aadhaar/Land)
                  </button>
                </div>
              </div>
            )}


            {/* VERIFIED: GRADE SELECTION & PAYOUT CALCULATION */}

            {currentStatus ===
              "VERIFIED" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32]/15 px-3 py-1 text-xs font-bold text-[#2E7D32]">
                      <Award className="h-3.5 w-3.5" />
                      Official MSP Grade Assessment
                    </span>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      Crop Quality Grading & Payout Calculation
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Select the crop quality grade (Grade A to D) and verify the weighbridge quantity to determine the farmer&apos;s direct benefit payout.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Procured Crop</p>
                    <p className="text-base font-extrabold text-[#2E7D32]">{cropMspInfo.name} ({cropMspInfo.nameHi})</p>
                  </div>
                </div>

                {/* GRADE SELECTION CARDS */}
                <div className="mt-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5">
                    Select Crop Quality Grade (Government MSP in ₹ / Quintal):
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(["Grade A", "Grade B", "Grade C", "Grade D"] as CropGrade[]).map((gradeKey) => {
                      const detail = cropMspInfo.grades[gradeKey];
                      const isSelected = selectedGrade === gradeKey;
                      return (
                        <button
                          key={gradeKey}
                          type="button"
                          onClick={() => setSelectedGrade(gradeKey)}
                          className={`flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition ${
                            isSelected
                              ? "border-[#2E7D32] bg-white shadow-sm ring-2 ring-[#2E7D32]/30"
                              : "border-gray-200 bg-white/70 hover:border-gray-300 hover:bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                  isSelected
                                    ? "bg-[#2E7D32] text-white"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {gradeKey}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
                              )}
                            </div>
                            <p className="mt-2.5 text-sm font-bold text-gray-900 leading-tight">
                              {detail.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                              {detail.specs}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">MSP Rate</p>
                            <p className="text-lg font-black text-[#2E7D32]">
                              ₹{detail.price.toLocaleString("en-IN")}{" "}
                              <span className="text-xs font-medium text-gray-500">/ quintal</span>
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* WEIGHBRIDGE & LIVE PAYOUT CALCULATION */}
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Weighbridge Weight (Quintals)
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <Scale className="h-5 w-5 text-gray-400 shrink-0" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={verifiedWeight}
                        onChange={(e) => setVerifiedWeight(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base font-bold text-gray-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                        placeholder="Quintals"
                      />
                      <span className="text-sm font-bold text-gray-500">qtl</span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Original booked quantity: {booking.quantity || 0} quintals
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Applicable MSP Rate
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#2E7D32]">
                        ₹{livePayoutCalc.ratePerQuintal.toLocaleString("en-IN")}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">/ quintal</span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 font-medium">
                      {selectedGrade} ({livePayoutCalc.gradeLabel})
                    </p>
                  </div>

                  <div className="rounded-2xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-4 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                      Direct Farmer Payout
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#2E7D32]">
                        {formatINR(livePayoutCalc.totalPayout)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#2E7D32]/90 font-medium">
                      Formula: {livePayoutCalc.quantityQuintals} q × ₹{livePayoutCalc.ratePerQuintal.toLocaleString("en-IN")}/q
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStartProcurement}
                  disabled={actionLoading || livePayoutCalc.totalPayout <= 0}
                  className="mt-6 flex w-full sm:w-fit items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-7 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Clock3 className="h-5 w-5" />
                  {actionLoading
                    ? "Starting..."
                    : `Confirm & Start Procurement (${selectedGrade} — ${formatINR(livePayoutCalc.totalPayout)})`}
                </button>
              </div>
            )}


            {/* PROCESSING: PROCUREMENT ACTIVE */}

            {currentStatus ===
              "PROCESSING" && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                  <Clock3 className="h-4 w-4" />
                  Crop Procurement In Progress
                </div>
                <h2 className="mt-1.5 text-2xl font-bold text-gray-900">
                  Weighment & Quality Assessment Confirmed
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  The crop is currently being unloaded and processed. Once physical intake is finalized, click below to complete the procurement and issue the settlement slip.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white p-5 border border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Quality Grade</p>
                    <p className="mt-1 text-base font-bold text-gray-900">
                      {booking.cropGrade || selectedGrade}
                    </p>
                    <p className="text-xs text-gray-500">{livePayoutCalc.gradeLabel}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">MSP Rate Applied</p>
                    <p className="mt-1 text-base font-extrabold text-[#2E7D32]">
                      ₹{(booking.mspRate || livePayoutCalc.ratePerQuintal).toLocaleString("en-IN")} <span className="text-xs font-normal text-gray-500">/ quintal</span>
                    </p>
                    <p className="text-xs text-gray-500">Official Government Rate</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Weighed Quantity</p>
                    <p className="mt-1 text-base font-bold text-gray-900">
                      {booking.actualQuantity || booking.quantity || 0} Quintals
                    </p>
                    <p className="text-xs text-gray-500">Weighbridge Certified</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Calculated Farmer Payout</p>
                    <p className="mt-1 text-xl font-black text-[#2E7D32]">
                      {formatINR(booking.totalPayout || livePayoutCalc.totalPayout)}
                    </p>
                    <p className="text-xs text-[#2E7D32] font-semibold">Direct Bank Transfer (DBT)</p>
                  </div>
                </div>

                <button
                  onClick={
                    handleCompleteProcurement
                  }
                  disabled={actionLoading}
                  className="mt-6 flex w-full sm:w-fit items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-7 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {actionLoading
                    ? "Completing..."
                    : "Complete Procurement & Generate Settlement Slip"}
                </button>
              </div>
            )}


            {/* COMPLETED: OFFICIAL PROCUREMENT SETTLEMENT SLIP */}

            {currentStatus ===
              "COMPLETED" && (
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E7D32] text-white shadow-xs">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#2E7D32]">
                        PROCUREMENT COMPLETED
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        DBT PAYMENT AUTHORIZED
                      </span>
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      Official Procurement Settlement Slip
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Procurement for token <strong>#{booking.token}</strong> has been successfully completed and recorded.
                    </p>
                  </div>
                </div>

                {/* Settlement Slip Card */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Farmer Details</p>
                      <p className="mt-1 text-base font-bold text-gray-900">{booking.farmerName || "Farmer"}</p>
                      <p className="text-xs text-gray-600">ID: {booking.farmerId || "N/A"} • +91 {booking.farmerMobile}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Centre & Date</p>
                      <p className="mt-1 text-base font-bold text-gray-900">{booking.centre || "Procurement Centre"}</p>
                      <p className="text-xs text-gray-600">{formatDate(booking.date)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Verified By</p>
                      <p className="mt-1 text-base font-bold text-gray-900">{booking.verifiedBy || "Procurement Officer"}</p>
                      <p className="text-xs text-green-700 font-semibold">Quality & Moisture Certified</p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-[#F7F9F5] p-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Crop & Quality Grade</p>
                        <p className="mt-1 font-bold text-gray-900">{booking.crop}</p>
                        <span className="inline-block mt-1 rounded-md bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-bold text-[#2E7D32]">
                          {booking.cropGrade || selectedGrade}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500">Certified Weight</p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {booking.actualQuantity || booking.quantity || 0}{" "}
                          <span className="text-xs font-normal text-gray-500">Quintals</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500">Applied MSP Rate</p>
                        <p className="mt-1 text-xl font-extrabold text-[#2E7D32]">
                          ₹{(booking.mspRate || livePayoutCalc.ratePerQuintal).toLocaleString("en-IN")}{" "}
                          <span className="text-xs font-normal text-gray-500">/ quintal</span>
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#E8F5E9] p-3.5 border border-[#CDE8D0]">
                        <p className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">Total Farmer Payout</p>
                        <p className="mt-1 text-2xl font-black text-[#2E7D32]">
                          {formatINR(booking.totalPayout || livePayoutCalc.totalPayout)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#2E7D32]/80">Transferred via PFMS / DBT</p>
                      </div>
                    </div>
                  </div>
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