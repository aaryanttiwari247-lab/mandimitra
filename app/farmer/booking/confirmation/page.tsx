"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Ticket,
  Sprout,
  Wheat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function BookingConfirmationPage() {
  const router = useRouter();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  // ============================================================
  // LOAD BOOKING
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedBooking =
          localStorage.getItem(
            "smartProcurementBooking"
          );

        if (!storedBooking) {
          setBooking(null);
          setLoading(false);
          return;
        }

        const parsedBooking =
          JSON.parse(storedBooking);

        if (
          parsedBooking &&
          typeof parsedBooking === "object"
        ) {
          setBooking(parsedBooking);
        } else {
          setBooking(null);
        }
      } catch (error) {
        console.error(
          "Unable to load booking:",
          error
        );

        setBooking(null);
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return "—";
    }

    try {
      const date =
        new Date(
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
            Loading booking...
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

        {/* HEADER */}

        <header className="border-b border-gray-200 bg-white">

          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">

            <button
              onClick={() =>
                router.push(
                  "/farmer/dashboard"
                )
              }
              className="flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-[#2E7D32]"
            >
              <ArrowLeft className="h-4 w-4" />

              Back
            </button>

            <div className="flex items-center gap-2 font-semibold text-[#2E7D32]">

              <Sprout className="h-5 w-5" />

              Smart Procurement

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <section className="px-5 py-16 sm:px-8">

          <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">

              <Ticket className="h-8 w-8 text-gray-400" />

            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              No Booking Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              We could not find an active procurement
              booking. Please book a procurement slot
              first.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/farmer/book-slot"
                )
              }
              className="mt-6 rounded-xl bg-[#2E7D32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#256428]"
            >
              Book Procurement Slot
            </button>

          </div>

        </section>

      </main>
    );
  }

  // ============================================================
  // TOKEN
  // ============================================================

  const token =
    booking.token ??
    (booking.tokenNumber
      ? `A${booking.tokenNumber}`
      : "—");

  // ============================================================
  // STATUS
  // ============================================================

  const status =
    booking.procurementStatus ??
    booking.queueStatus ??
    booking.status ??
    "WAITING";

  // ============================================================
  // MAIN UI
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
                "/farmer/dashboard"
              )
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-[#2E7D32]"
          >

            <ArrowLeft className="h-4 w-4" />

            Dashboard

          </button>

          <div className="flex items-center gap-2 font-semibold text-[#2E7D32]">

            <Sprout className="h-5 w-5" />

            Smart Procurement

          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <section className="px-5 py-10 sm:px-8">

        <div className="mx-auto max-w-4xl">

          {/* ====================================================
              SUCCESS HEADER
          ==================================================== */}

          <div className="text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5E9]">

              <CheckCircle2 className="h-9 w-9 text-[#2E7D32]" />

            </div>

            <p className="mt-5 text-sm font-semibold text-[#2E7D32]">
              Booking Confirmed
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Your Procurement Slot is Booked
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
              Keep your Smart Token safe. You can use
              it to track your position at the
              procurement centre.
            </p>

          </div>

          {/* ====================================================
              TOKEN CARD
          ==================================================== */}

          <div className="mt-8 overflow-hidden rounded-3xl bg-[#2E7D32] text-white shadow-sm">

            <div className="p-7 text-center sm:p-10">

              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white/80">

                <Ticket className="h-5 w-5" />

                SMART TOKEN

              </div>

              <p className="mt-4 text-6xl font-bold tracking-tight sm:text-7xl">
                {token}
              </p>

              <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">

                <CheckCircle2 className="h-4 w-4" />

                {status}

              </div>

            </div>

            <div className="border-t border-white/10 bg-black/5 px-6 py-4 text-center">

              <p className="text-sm text-white/80">
                Please arrive at the centre around
              </p>

              <p className="mt-1 text-lg font-bold">
                {booking.arrivalTime ??
                  "10 minutes before your slot"}
              </p>

            </div>

          </div>

          {/* ====================================================
              BOOKING DETAILS
          ==================================================== */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">

            {/* ==================================================
                PROCUREMENT DETAILS
            ================================================== */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9]">

                  <Wheat className="h-5 w-5 text-[#2E7D32]" />

                </div>

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Procurement Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Your submitted crop information
                  </p>

                </div>

              </div>

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                  <span className="text-sm text-gray-500">
                    Crop
                  </span>

                  <span className="font-semibold text-gray-900">
                    {booking.crop ??
                      "—"}
                  </span>

                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                  <span className="text-sm text-gray-500">
                    Quantity
                  </span>

                  <span className="font-semibold text-gray-900">
                    {booking.quantity ??
                      0}{" "}
                    Quintals
                  </span>

                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                  <span className="text-sm text-gray-500">
                    Procurement Date
                  </span>

                  <span className="text-right font-semibold text-gray-900">
                    {formatDate(
                      booking.date
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Booking ID
                  </span>

                  <span className="max-w-[180px] truncate text-right text-sm font-semibold text-gray-900">
                    {booking.bookingId ??
                      "—"}
                  </span>

                </div>

              </div>

            </div>

            {/* ==================================================
                CENTRE DETAILS
            ================================================== */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9]">

                  <MapPin className="h-5 w-5 text-[#2E7D32]" />

                </div>

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Procurement Centre
                  </h2>

                  <p className="text-sm text-gray-500">
                    Where your produce will be procured
                  </p>

                </div>

              </div>

              <div className="mt-6">

                <h3 className="text-lg font-bold text-gray-900">
                  {booking.centre ??
                    "—"}
                </h3>

                {booking.distance && (

                  <p className="mt-1 text-sm text-gray-500">
                    {booking.distance}
                  </p>

                )}

              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4">

                <div className="flex items-start gap-3">

                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#2E7D32]" />

                  <div>

                    <p className="text-xs font-medium text-gray-500">
                      APPOINTMENT SLOT
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {booking.fullTime ??
                        booking.time ??
                        "—"}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ====================================================
              QUEUE INFORMATION
          ==================================================== */}

          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-semibold text-gray-500">
                  QUEUE POSITION
                </p>

                <p className="mt-1 text-3xl font-bold text-[#2E7D32]">
                  {booking.queuePosition
                    ? `#${booking.queuePosition}`
                    : "—"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Estimated wait:{" "}
                  {booking.waitTime
                    ? `${booking.waitTime} minutes`
                    : "—"}
                </p>

              </div>

              <button
                onClick={() =>
                  router.push(
                    `/farmer/track-token?token=${encodeURIComponent(booking.token || token || "")}`
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#256428]"
              >

                Track My Token

                <ArrowRight className="h-4 w-4" />

              </button>

            </div>

          </div>

          {/* ====================================================
              IMPORTANT INFORMATION
          ==================================================== */}

          <div className="mt-6 rounded-2xl border border-[#FDE7C2] bg-[#FFF9EF] p-5">

            <h3 className="font-bold text-[#92400E]">
              Important
            </h3>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#A16207]">

              <li>
                • Keep your Smart Token{" "}
                <strong>
                  {token}
                </strong>{" "}
                with you.
              </li>

              <li>
                • Reach the procurement centre
                around{" "}
                <strong>
                  {booking.arrivalTime ??
                    "10 minutes before your slot"}
                </strong>
                .
              </li>

              <li>
                • Carry the required documents
                and your produce.
              </li>

              <li>
                • You can track your queue position
                from the Farmer Dashboard.
              </li>

            </ul>

          </div>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <button
              onClick={() =>
                router.push(
                  "/farmer/dashboard"
                )
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#2E7D32] hover:text-[#2E7D32]"
            >

              <ArrowLeft className="h-4 w-4" />

              Back to Dashboard

            </button>

            <button
              onClick={() => {
                const cleanToken = String(booking.token || token || "").replace(/^#/, "").trim();
                router.push(
                  cleanToken
                    ? `/farmer/track-token?token=${encodeURIComponent(cleanToken)}`
                    : "/farmer/track-token"
                );
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#256428]"
            >

              Track Token

              <ArrowRight className="h-4 w-4" />

            </button>

          </div>

        </div>

      </section>

    </main>
  );
}