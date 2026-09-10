"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Sprout,
  Ticket,
  Truck,
  Wheat,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  getFarmerSession,
  clearFarmerSession,
} from "@/lib/farmer-auth";

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

export default function FarmerHistoryPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [history, setHistory] = useState<Booking[]>([]);

  // ============================================================
  // LOAD HISTORY
  // ============================================================

  const loadHistory = useCallback(() => {
    const savedHistory = localStorage.getItem(
      "smartProcurementHistory"
    );

    let historyData: Booking[] = [];

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);

        if (Array.isArray(parsed)) {
          historyData = parsed;
        }
      } catch {
        historyData = [];
      }
    }

    // ----------------------------------------------------------
    // Also check current booking.
    //
    // This makes the page more reliable if a booking exists but
    // history has not yet been updated.
    // ----------------------------------------------------------

    const currentBooking = localStorage.getItem(
      "smartProcurementBooking"
    );

    if (currentBooking) {
      try {
        const parsedCurrent = JSON.parse(
          currentBooking
        );

        if (parsedCurrent?.bookingId) {
          const alreadyExists = historyData.some(
            (item) =>
              item?.bookingId ===
              parsedCurrent.bookingId
          );

          if (!alreadyExists) {
            historyData.unshift(parsedCurrent);
          }
        }
      } catch {
        // Ignore invalid booking data
      }
    }

    // ----------------------------------------------------------
    // Also synchronize statuses from official queue.
    //
    // This is important because the official dashboard may have
    // changed A106 from WAITING -> VERIFIED -> PROCESSING ->
    // COMPLETED.
    // ----------------------------------------------------------

    const savedQueue = localStorage.getItem(
      "smartProcurementQueue"
    );

    if (savedQueue) {
      try {
        const queue: Booking[] =
          JSON.parse(savedQueue);

        if (Array.isArray(queue)) {
          historyData = historyData.map(
            (booking) => {
              const updatedBooking =
                queue.find(
                  (queueItem) =>
                    queueItem?.bookingId ===
                    booking?.bookingId
                );

              if (updatedBooking) {
                return {
                  ...booking,
                  ...updatedBooking,
                };
              }

              return booking;
            }
          );
        }
      } catch {
        // Ignore invalid queue data
      }
    }

    // Newest first
    historyData.sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });

    setHistory(historyData);
  }, []);

  // ============================================================
  // LOAD FARMER + HISTORY
  // ============================================================

  useEffect(() => {
    const farmer = getFarmerSession();

    if (!farmer) {
      router.replace("/farmer/login");
      return;
    }

    const timer = setTimeout(() => {
      loadHistory();
      setCheckingAuth(false);
    }, 0);

    // Listen for updates from other tabs/pages
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "smartProcurementHistory" ||
        event.key === "smartProcurementQueue" ||
        event.key === "smartProcurementBooking"
      ) {
        loadHistory();
      }
    };

    const handleCustomUpdate = () => {
      loadHistory();
    };

    window.addEventListener("storage", handleStorage);

    window.addEventListener(
      "smartProcurementQueueUpdated",
      handleCustomUpdate
    );

    return () => {
      clearTimeout(timer);

      window.removeEventListener("storage", handleStorage);

      window.removeEventListener(
        "smartProcurementQueueUpdated",
        handleCustomUpdate
      );
    };
  }, [router, loadHistory]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    clearFarmerSession();
    router.replace("/");
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return "Date not available";
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
  // STATUS
  // ============================================================

  const getStatus = (
    booking: Booking
  ) => {
    const rawStatus =
      booking.procurementStatus ||
      booking.queueStatus ||
      booking.status ||
      "WAITING";

    return rawStatus.toUpperCase();
  };

  // ============================================================
  // STATUS COLOR
  // ============================================================

  const getStatusClasses = (
    status: string
  ) => {
    switch (status) {
      case "COMPLETED":
        return "bg-[#E8F5E9] text-[#2E7D32]";

      case "PROCESSING":
        return "bg-blue-50 text-blue-700";

      case "VERIFIED":
        return "bg-[#E8F5E9] text-[#2E7D32]";

      case "CALLED":
        return "bg-purple-50 text-purple-700";

      case "BOOKED":
        return "bg-blue-50 text-blue-700";

      case "WAITING":
      case "TOKEN GENERATED":
        return "bg-[#FFF8E1] text-[#A16207]";

      case "CANCELLED":
        return "bg-red-50 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ============================================================
  // STATUS ICON
  // ============================================================

  const StatusIcon = ({
    status,
  }: {
    status: string;
  }) => {
    if (status === "COMPLETED") {
      return (
        <CheckCircle2 className="h-4 w-4" />
      );
    }

    if (status === "PROCESSING") {
      return (
        <PackageCheck className="h-4 w-4" />
      );
    }

    if (status === "CANCELLED") {
      return (
        <XCircle className="h-4 w-4" />
      );
    }

    return (
      <Clock3 className="h-4 w-4" />
    );
  };

  // ============================================================
  // TRACK TOKEN
  // ============================================================

  const handleTrackToken = (
    booking: Booking
  ) => {
    if (
      booking.bookingId &&
      booking.bookingId ===
        getCurrentBookingId()
    ) {
      router.push("/farmer/track-token");
      return;
    }

    router.push("/farmer/track-token");
  };

  // ============================================================
  // CURRENT BOOKING ID
  // ============================================================

  const getCurrentBookingId = () => {
    const current =
      localStorage.getItem(
        "smartProcurementBooking"
      );

    if (!current) {
      return null;
    }

    try {
      const parsed = JSON.parse(current);

      return parsed?.bookingId ?? null;
    } catch {
      return null;
    }
  };

  // ============================================================
  // AUTH LOADING
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
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#F7F9F5] text-[#111827]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* BACK */}

          <button
            onClick={() =>
              router.push(
                "/farmer/dashboard"
              )
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-[#2E7D32]"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Dashboard
          </button>


          {/* LOGO */}

          <button
            onClick={() =>
              router.push(
                "/farmer/dashboard"
              )
            }
            className="flex items-center gap-2 font-bold text-[#2E7D32]"
          >

            <Sprout className="h-5 w-5" />

            Smart Procurement

          </button>


          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            className="hidden text-sm font-medium text-gray-600 transition hover:text-red-600 sm:block"
          >
            Logout
          </button>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">

        {/* TITLE */}

        <div>

          <p className="text-sm font-medium text-[#2E7D32]">
            Farmer Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Booking History
          </h1>

          <p className="mt-2 text-base text-gray-600">
            View your previous and current procurement bookings.
          </p>

        </div>


        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {history.length === 0 ? (

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">

              <Ticket className="h-8 w-8 text-[#2E7D32]" />

            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No bookings yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              You have not made any procurement bookings yet.
              Book a procurement slot to receive your smart token.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/farmer/book-slot"
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#256428]"
            >

              Book Procurement Slot

              <ArrowRight className="h-4 w-4" />

            </button>

          </div>

        ) : (

          /* ==================================================
             HISTORY LIST
             ================================================== */

          <div className="mt-8 space-y-5">

            {history.map(
              (booking, index) => {

                const status =
                  getStatus(booking);

                return (

                  <div
                    key={
                      booking.bookingId ??
                      `${booking.token}-${index}`
                    }
                    className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                  >

                    {/* ========================================
                        TOP
                        ======================================== */}

                    <div className="flex flex-col gap-5 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">

                      <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E8F5E9]">

                          <Ticket className="h-7 w-7 text-[#2E7D32]" />

                        </div>

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Smart Token
                          </p>

                          <div className="mt-1 flex items-center gap-3">

                            <h2 className="text-2xl font-bold text-gray-900">
                              #{booking.token ??
                                (booking.tokenNumber ? String(booking.tokenNumber) : "N/A")}
                            </h2>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                                status
                              )}`}
                            >

                              <StatusIcon
                                status={status}
                              />

                              {status}

                            </span>

                          </div>

                        </div>

                      </div>


                      {/* DATE */}

                      <div className="flex items-center gap-2 text-sm text-gray-600">

                        <CalendarDays className="h-4 w-4 text-[#2E7D32]" />

                        <span>
                          {formatDate(
                            booking.date
                          )}
                        </span>

                      </div>

                    </div>


                    {/* ========================================
                        DETAILS
                        ======================================== */}

                    <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-7">

                      {/* CENTRE */}

                      <div>

                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">

                          <MapPin className="h-4 w-4 text-[#2E7D32]" />

                          Procurement Centre

                        </div>

                        <p className="mt-2 font-semibold text-gray-900">
                          {booking.centre ??
                            "Centre not available"}
                        </p>

                      </div>


                      {/* CROP */}

                      <div>

                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">

                          <Wheat className="h-4 w-4 text-[#2E7D32]" />

                          Crop

                        </div>

                        <p className="mt-2 font-semibold text-gray-900">
                          {booking.crop ??
                            "Not available"}
                        </p>

                      </div>


                      {/* QUANTITY */}

                      <div>

                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">

                          <Truck className="h-4 w-4 text-[#2E7D32]" />

                          Quantity

                        </div>

                        <p className="mt-2 font-semibold text-gray-900">

                          {booking.quantity ??
                            0}{" "}

                          Quintals

                        </p>

                      </div>


                      {/* TIME */}

                      <div>

                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">

                          <Clock3 className="h-4 w-4 text-[#2E7D32]" />

                          Time Slot

                        </div>

                        <p className="mt-2 font-semibold text-gray-900">

                          {booking.fullTime ??
                            booking.time ??
                            "Not available"}

                        </p>

                      </div>

                    </div>


                    {/* ========================================
                        EXTRA INFORMATION
                        ======================================== */}

                    <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-5 sm:px-7">

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm">

                          {booking.arrivalTime && (

                            <div>

                              <span className="text-gray-500">
                                Recommended arrival:
                              </span>{" "}

                              <span className="font-semibold text-gray-900">
                                {booking.arrivalTime}
                              </span>

                            </div>

                          )}

                          {booking.queuePosition && (

                            <div>

                              <span className="text-gray-500">
                                Queue position:
                              </span>{" "}

                              <span className="font-semibold text-gray-900">
                                #{booking.queuePosition}
                              </span>

                            </div>

                          )}

                          {booking.waitTime && (

                            <div>

                              <span className="text-gray-500">
                                Estimated wait:
                              </span>{" "}

                              <span className="font-semibold text-gray-900">
                                ~{booking.waitTime} min
                              </span>

                            </div>

                          )}

                        </div>


                        {/* TRACK */}

                        <button
                          onClick={() =>
                            handleTrackToken(
                              booking
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-[#2E7D32] bg-white px-5 py-3 text-sm font-bold text-[#2E7D32] transition hover:bg-[#E8F5E9]"
                        >

                          Track Token

                          <ArrowRight className="h-4 w-4" />

                        </button>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}