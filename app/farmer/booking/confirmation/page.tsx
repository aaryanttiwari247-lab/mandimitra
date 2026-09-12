"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  RotateCcw,
  Ticket,
  Sprout,
  Wheat,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/context/language-context";
import { FarmerCancellationModal } from "@/components/FarmerCancellationModal";

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

  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export default function BookingConfirmationPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [isCancelModalOpen, setIsCancelModalOpen] =
    useState(false);

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

              {t("common.back")}
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

        <section className="px-5 py-16 sm:px-8">

          <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">

              <Ticket className="h-8 w-8 text-gray-400" />

            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              {t("confirmation.noBookingFound")}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {t("confirmation.noBookingDesc")}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/farmer/book-slot"
                )
              }
              className="mt-6 rounded-xl bg-[#2E7D32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#256428]"
            >
              {t("confirmation.bookSlotBtn")}
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
      ? String(booking.tokenNumber)
      : "—");

  // ============================================================
  // STATUS
  // ============================================================

  const status =
    booking.procurementStatus ??
    booking.queueStatus ??
    booking.status ??
    "WAITING";

  const isCancelled =
    status === "CANCELLED" ||
    booking.status === "CANCELLED" ||
    booking.queueStatus === "CANCELLED" ||
    booking.procurementStatus === "CANCELLED";

  const canFarmerCancel = Boolean(
    booking &&
    !isCancelled &&
    status !== "PROCESSING" &&
    status !== "COMPLETED"
  );

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

            {t("confirmation.backToDashboard")}

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

      {/* ======================================================
          MAIN
      ====================================================== */}

      <section className="px-5 py-10 sm:px-8">

        <div className="mx-auto max-w-4xl">

          {/* ====================================================
              HEADER (CONFIRMED VS CANCELLED)
          ==================================================== */}

          {isCancelled ? (
            <div className="rounded-3xl border-2 border-red-500 bg-red-50 p-6 sm:p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-9 w-9 text-red-600" />
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-wider text-red-600">
                {t("tracker.cancelledHeader")}
              </p>

              <h1 className="mt-1 text-2xl font-black text-red-950 sm:text-3xl">
                {booking.cancelledBy?.toLowerCase().includes("farmer")
                  ? t("tracker.selfCancelledBanner", { token })
                  : t("tracker.cancelledBanner", { token })}
              </h1>

              <div className="mx-auto mt-4 max-w-md rounded-2xl border border-red-200 bg-white p-4 text-left shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                  {t("tracker.cancellationReasonLabel")}
                </p>
                <p className="mt-1 font-extrabold text-gray-900">
                  {booking.cancellationReason || "Cancelled by farmer"}
                </p>
                {booking.cancelledAt && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t("tracker.cancelledAtLabel")}: {new Date(booking.cancelledAt).toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-red-900">
                {booking.cancelledBy?.toLowerCase().includes("farmer")
                  ? t("tracker.farmerSelfCancelledGuidance")
                  : t("tracker.farmerCancelledGuidance")}
              </p>

              <button
                onClick={() => router.push("/farmer/book-slot")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition"
              >
                <RotateCcw className="h-4 w-4" />
                {t("tracker.bookNewSlot")}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5E9]">
                <CheckCircle2 className="h-9 w-9 text-[#2E7D32]" />
              </div>

              <p className="mt-5 text-sm font-semibold text-[#2E7D32]">
                {t("confirmation.title")}
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {t("confirmation.subtitle")}
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
                {t("confirmation.arrivalInstruction")}
              </p>
            </div>
          )}

          {/* ====================================================
              TOKEN CARD
          ==================================================== */}

          <div className={`mt-8 overflow-hidden rounded-3xl text-white shadow-sm ${isCancelled ? "bg-[#374151]" : "bg-[#2E7D32]"}`}>

            <div className="p-7 text-center sm:p-10">

              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white/80">

                <Ticket className="h-5 w-5" />

                {t("confirmation.tokenLabel")}

              </div>

              <p className="mt-4 text-6xl font-bold tracking-tight sm:text-7xl">
                {token}
              </p>

              <div className={`mx-auto mt-5 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${isCancelled ? "bg-red-500 text-white" : "bg-white/10 text-white/90"}`}>

                <CheckCircle2 className="h-4 w-4" />

                {isCancelled ? "CANCELLED" : status}

              </div>

            </div>

            <div className="border-t border-white/10 bg-black/5 px-6 py-4 text-center">

              <p className="text-sm text-white/80">
                {t("confirmation.arrivalNotice")}
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
                    {t("confirmation.centreDetails")}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {t("confirmation.cropInfoDesc")}
                  </p>

                </div>

              </div>

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                  <span className="text-sm text-gray-500">
                    {t("booking.cropLabel")}
                  </span>

                  <span className="font-semibold text-gray-900">
                    {booking.crop ??
                      "—"}
                  </span>

                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                  <span className="text-sm text-gray-500">
                    {t("booking.quantityLabel")}
                  </span>

                  <span className="font-semibold text-gray-900">
                    {booking.quantity ??
                      0}{" "}
                    {t("common.quintals")}
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
                    {t("tracker.centreDetails")}
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
                  {t("tracker.queuePosition")}
                </p>

                <p className="mt-1 text-3xl font-bold text-[#2E7D32]">
                  {booking.queuePosition
                    ? `#${booking.queuePosition}`
                    : "—"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {t("tracker.estimatedWait")}:{" "}
                  {booking.waitTime
                    ? `${booking.waitTime} ${t("common.minutes")}`
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

                {t("confirmation.trackTokenBtn")}

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

              {t("confirmation.backToDashboard") || "Back to Dashboard"}

            </button>

            {canFarmerCancel && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-100 hover:border-red-300"
              >
                <XCircle className="h-4 w-4 text-red-600" />
                {t("farmerCancel.cancelSlotBtn") || "Cancel Slot"}
              </button>
            )}

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

      {/* FARMER CANCELLATION MODAL */}
      <FarmerCancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        booking={booking}
        onCancelled={(updated) => {
          setBooking(updated);
        }}
      />
    </main>
  );
}