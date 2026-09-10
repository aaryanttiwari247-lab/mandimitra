"use client";

import {
  ArrowLeft,
  CalendarDays,
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
import { broadcastProcurementUpdate } from "@/lib/cross-tab-sync";
import { matchesBookingIdentifier } from "@/lib/procurement-store";

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

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenFromUrl = searchParams.get("token");

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [verifying, setVerifying] =
    useState(false);

  const [error, setError] =
    useState("");

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
            queue.find((item) => matchesBookingIdentifier(item, tokenFromUrl)) ?? null;
        }
      }
    } catch {}

    if (foundFromLocal) {
      setBooking(foundFromLocal);
      setLoading(false);
    }

    // Also fetch live from server to ensure freshest data
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
        console.warn("Unable to fetch live booking from server:", err);
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
  // FORMAT DATE
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
    } catch {
      return dateString;
    }
  };

  // ============================================================
  // CURRENT STATUS
  // ============================================================

  const getStatus = (
    item: Booking
  ) => {
    return String(
      item.status ??
        item.queueStatus ??
        item.procurementStatus ??
        "WAITING"
    ).toUpperCase();
  };

  const currentStatus = booking
    ? getStatus(booking)
    : "WAITING";

  // ============================================================
  // VERIFY FARMER
  // ============================================================

  const handleVerify = () => {
    if (!booking) {
      return;
    }

    if (currentStatus === "VERIFIED") {
      alert(
        `Token ${booking.token} is already verified.`
      );

      router.push(
        `/official/procurement?token=${encodeURIComponent(
          booking.token ?? ""
        )}`
      );

      return;
    }

    if (
      currentStatus === "PROCESSING" ||
      currentStatus === "COMPLETED"
    ) {
      alert(
        `Token ${booking.token} has already moved beyond verification.`
      );

      router.push(
        `/official/procurement?token=${encodeURIComponent(
          booking.token ?? ""
        )}`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Verify farmer for token ${booking.token}?`
      );

    if (!confirmed) {
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const queueData =
        localStorage.getItem(
          "smartProcurementQueue"
        );

      if (!queueData) {
        throw new Error(
          "Procurement queue not found."
        );
      }

      const queue: Booking[] =
        JSON.parse(queueData);

      if (!Array.isArray(queue)) {
        throw new Error(
          "Invalid procurement queue."
        );
      }

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

          return {
            ...item,

            status: "VERIFIED",

            queueStatus: "VERIFIED",

            procurementStatus:
              "VERIFIED",

            verifiedBy:
              "Procurement Officer",

            updatedAt: now,
          };
        });

      // ----------------------------------------------------------
      // SAVE UPDATED QUEUE
      // ----------------------------------------------------------

      localStorage.setItem(
        "smartProcurementQueue",
        JSON.stringify(updatedQueue)
      );

      // ----------------------------------------------------------
      // UPDATE CURRENT BOOKING
      // ----------------------------------------------------------

      const updatedBooking: Booking = {
        ...booking,

        status: "VERIFIED",

        queueStatus: "VERIFIED",

        procurementStatus:
          "VERIFIED",

        verifiedBy:
          "Procurement Officer",

        updatedAt: now,
      };

      setBooking(updatedBooking);

      // ----------------------------------------------------------
      // ALSO UPDATE CURRENT FARMER BOOKING
      // ----------------------------------------------------------

      const currentBookingData =
        localStorage.getItem(
          "smartProcurementBooking"
        );

      if (currentBookingData) {
        try {
          const currentBooking: Booking =
            JSON.parse(
              currentBookingData
            );

          const sameBooking =
            booking.bookingId &&
            currentBooking.bookingId ===
              booking.bookingId;

          const sameToken =
            booking.token &&
            currentBooking.token &&
            booking.token.toUpperCase().replace(/^#/, "") ===
              currentBooking.token.toUpperCase().replace(/^#/, "");

          if (
            sameBooking ||
            sameToken
          ) {
            localStorage.setItem(
              "smartProcurementBooking",
              JSON.stringify(
                updatedBooking
              )
            );
          }
        } catch {
          // Ignore invalid current booking
        }
      }

      // ----------------------------------------------------------
      // NOTIFY OTHER TABS / PAGES
      // ----------------------------------------------------------

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
        status: "VERIFIED",
        booking: updatedBooking as any,
      });

      // ----------------------------------------------------------
      // SYNC WITH BACKEND SERVER (CROSS-DEVICE & REAL-TIME SYNC)
      // ----------------------------------------------------------
      const identifier = booking.bookingId || booking.token || "";
      if (identifier) {
        fetch(`/api/official/queue/${encodeURIComponent(identifier)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "VERIFIED",
            verifiedBy: "Procurement Officer",
          }),
        }).catch((err) => console.warn("Failed to sync verify status:", err));
      }

      fetch("/api/official/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBooking),
      }).catch((err) => console.warn("Failed to sync verify queue:", err));

      // ----------------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------------

      alert(
        `Farmer ${booking.farmerName ?? ""} has been verified successfully.`
      );

      // Go to procurement processing page
      router.push(
        `/official/procurement?token=${encodeURIComponent(
          booking.token ?? ""
        )}`
      );
    } catch (err) {
      console.error(
        "Unable to verify farmer:",
        err
      );

      setError(
        "Unable to verify farmer. Please try again."
      );
    } finally {
      setVerifying(false);
    }
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
            Loading farmer details...
          </p>

        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR SCREEN
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
              className="flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-[#2E7D32]"
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

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {error}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/official/dashboard"
                )
              }
              className="mt-6 w-full rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#256428]"
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
            className="flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-[#2E7D32]"
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

          {/* ==================================================
              PAGE TITLE
              ================================================== */}

          <div className="mb-7">

            <p className="text-sm font-medium text-[#2E7D32]">
              Procurement Officer
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Farmer Verification
            </h1>

            <p className="mt-2 text-gray-600">
              Verify the farmer and booking details before procurement begins.
            </p>

          </div>

          {/* ==================================================
              TOKEN HEADER
              ================================================== */}

          <div className="overflow-hidden rounded-3xl bg-[#2E7D32] shadow-sm">

            <div className="p-6 sm:p-8">

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-white">

                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">

                    <Ticket className="h-5 w-5" />

                    SMART PROCUREMENT TOKEN

                  </div>

                  <div className="mt-3 text-5xl font-bold">
                    #{booking.token ?? "N/A"}
                  </div>

                  <p className="mt-3 text-sm text-white/80">
                    Verification required before procurement
                  </p>

                </div>

                <div className="rounded-2xl bg-white/10 px-6 py-5">

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

          {/* ==================================================
              FARMER INFORMATION
              ================================================== */}

          <div className="mt-7">

            <h2 className="text-xl font-bold text-gray-900">
              Farmer Information
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <InfoCard
                icon={
                  <User className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Farmer Name"
                value={
                  booking.farmerName ??
                  "Not available"
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
                  <User className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Mobile Number"
                value={
                  booking.farmerMobile ??
                  "Not available"
                }
              />

              <InfoCard
                icon={
                  <MapPin className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Procurement Centre"
                value={
                  booking.centre ??
                  "Not available"
                }
              />

              <InfoCard
                icon={
                  <CalendarDays className="h-5 w-5 text-[#2E7D32]" />
                }
                label="Booking Date"
                value={formatDate(
                  booking.date
                )}
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

            </div>

          </div>

          {/* ==================================================
              PROCUREMENT DETAILS
              ================================================== */}

          <div className="mt-7">

            <h2 className="text-xl font-bold text-gray-900">
              Procurement Details
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">

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

            </div>

          </div>

          {/* ==================================================
              VERIFICATION CHECKLIST
              ================================================== */}

          <div className="mt-7 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold text-gray-900">
              Verification Checklist
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Confirm that the booking information matches the farmer&apos;s details.
            </p>

            <div className="mt-6 space-y-3">

              <CheckItem
                text="Farmer identity matches the booking"
              />

              <CheckItem
                text="Farmer ID is valid"
              />

              <CheckItem
                text="Crop and quantity match the booking"
              />

              <CheckItem
                text="Procurement centre and time slot are correct"
              />

            </div>

          </div>

          {/* ==================================================
              ACTION AREA
              ================================================== */}

          <div className="mt-7 rounded-3xl border border-[#CDE8D0] bg-[#F1F8F2] p-6 sm:p-8">

            {currentStatus === "WAITING" && (
              <div>

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">

                    <CheckCircle2 className="h-6 w-6 text-[#2E7D32]" />

                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-gray-900">
                      Ready for Verification
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Review the farmer and procurement details above.
                      Once everything is correct, verify the farmer to allow procurement to begin.
                    </p>

                  </div>

                </div>

                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >

                  <CheckCircle2 className="h-5 w-5" />

                  {verifying
                    ? "Verifying Farmer..."
                    : "Verify Farmer"}

                </button>

                {error && (
                  <p className="mt-4 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

              </div>
            )}

            {currentStatus === "VERIFIED" && (
              <div>

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">

                    <CheckCircle2 className="h-6 w-6 text-[#2E7D32]" />

                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-gray-900">
                      Farmer Already Verified
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Token{" "}
                      <strong>
                        {booking.token}
                      </strong>{" "}
                      has already been verified.
                      You can proceed to procurement.
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/official/procurement?token=${encodeURIComponent(
                        booking.token ?? ""
                      )}`
                    )
                  }
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#256428]"
                >

                  Continue to Procurement

                  <ArrowLeft className="h-5 w-5 rotate-180" />

                </button>

              </div>
            )}

            {(currentStatus === "PROCESSING" ||
              currentStatus === "COMPLETED") && (
              <div>

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">

                    <CheckCircle2 className="h-6 w-6 text-[#2E7D32]" />

                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-gray-900">
                      Verification Completed
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      This booking has already moved beyond the verification stage.
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/official/procurement?token=${encodeURIComponent(
                        booking.token ?? ""
                      )}`
                    )
                  }
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#256428]"
                >

                  Open Procurement

                  <ArrowLeft className="h-5 w-5 rotate-180" />

                </button>

              </div>
            )}

          </div>

          {/* ==================================================
              BACK BUTTON
              ================================================== */}

          <button
            onClick={() =>
              router.push(
                "/official/dashboard"
              )
            }
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#2E7D32] hover:text-[#2E7D32]"
          >

            <ArrowLeft className="h-4 w-4" />

            Back to Official Dashboard

          </button>

          <p className="mt-5 text-center text-xs text-gray-400">
            Verification updates are synchronized with the procurement queue.
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
// CHECK ITEM
// ================================================================

function CheckItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">

      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">

        <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />

      </div>

      <p className="text-sm font-medium text-gray-700">
        {text}
      </p>

    </div>
  );
}

export default function OfficialVerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5]">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
              <Sprout className="h-7 w-7 animate-pulse text-[#2E7D32]" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              Loading verification details...
            </p>
          </div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}