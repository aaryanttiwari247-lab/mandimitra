"use client";

import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { broadcastProcurementUpdate } from "@/lib/cross-tab-sync";
import { matchesBookingIdentifier } from "@/lib/procurement-store";

type FarmerCancellationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onCancelled?: (updatedBooking: any) => void;
};

export function FarmerCancellationModal({
  isOpen,
  onClose,
  booking,
  onCancelled,
}: FarmerCancellationModalProps) {
  const { t } = useLanguage();

  const standardReasons = [
    { id: "transport", label: t("farmerCancel.reasonTransport") },
    { id: "harvest", label: t("farmerCancel.reasonHarvest") },
    { id: "mistake", label: t("farmerCancel.reasonMistake") },
    { id: "sold_elsewhere", label: t("farmerCancel.reasonSoldElsewhere") },
    { id: "emergency", label: t("farmerCancel.reasonEmergency") },
  ];

  const [selectedReasonId, setSelectedReasonId] = useState<string>("transport");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    setError("");
    const matchedReason =
      standardReasons.find((r) => r.id === selectedReasonId)?.label ||
      t("farmerCancel.reasonEmergency");

    const fullReason = remarks.trim()
      ? `${matchedReason} — ${remarks.trim()}`
      : matchedReason;

    setSubmitting(true);

    try {
      const now = new Date().toISOString();
      const updatedBooking = {
        ...booking,
        status: "CANCELLED",
        queueStatus: "CANCELLED",
        procurementStatus: "CANCELLED",
        cancellationReason: fullReason,
        cancelledBy: `Farmer (${booking.farmerName || "Self-Cancelled"})`,
        cancelledAt: now,
        updatedAt: now,
      };

      // 1. Update localStorage smartProcurementBooking
      try {
        localStorage.setItem(
          "smartProcurementBooking",
          JSON.stringify(updatedBooking)
        );
      } catch {}

      // 2. Update smartProcurementQueue
      try {
        const queueRaw = localStorage.getItem("smartProcurementQueue");
        if (queueRaw) {
          const queue = JSON.parse(queueRaw);
          if (Array.isArray(queue)) {
            const idx = queue.findIndex((item) =>
              matchesBookingIdentifier(
                item,
                booking.token || booking.bookingId
              )
            );
            if (idx !== -1) {
              queue[idx] = { ...queue[idx], ...updatedBooking };
              localStorage.setItem(
                "smartProcurementQueue",
                JSON.stringify(queue)
              );
            }
          }
        }
      } catch {}

      // 3. Update smartProcurementHistory
      try {
        const historyRaw = localStorage.getItem("smartProcurementHistory");
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        if (Array.isArray(history)) {
          const idx = history.findIndex((item) =>
            matchesBookingIdentifier(
              item,
              booking.token || booking.bookingId
            )
          );
          if (idx !== -1) {
            history[idx] = { ...history[idx], ...updatedBooking };
          } else {
            history.unshift(updatedBooking);
          }
          localStorage.setItem(
            "smartProcurementHistory",
            JSON.stringify(history)
          );
        }
      } catch {}

      // 4. Send cancellation to API
      const bookingIdParam = booking.bookingId || booking.token || "";
      try {
        await fetch("/api/bookings/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: bookingIdParam,
            token: booking.token,
            cancellationReason: fullReason,
            cancelledBy: `Farmer (${booking.farmerName || "Self-Cancelled"})`,
          }),
        });
      } catch (apiErr) {
        console.warn("Server cancel API sync error (local succeeded):", apiErr);
      }

      // 5. Broadcast real-time update across all tabs
      broadcastProcurementUpdate({
        type: "STATUS_UPDATED",
        bookingId: booking.bookingId,
        token: booking.token,
        status: "CANCELLED",
        booking: updatedBooking,
      });

      // 6. Fire custom window events
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("smartProcurementBookingUpdated"));
        window.dispatchEvent(new Event("smartProcurementQueueUpdated"));
      }

      onCancelled?.(updatedBooking);
      onClose();
    } catch (err: any) {
      console.error("Farmer cancellation failed:", err);
      setError(err?.message || "Failed to cancel booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const tokenDisplay = String(
    booking.token || booking.tokenNumber || "---"
  ).replace(/^#/, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {t("farmerCancel.modalTitle")}
                </h3>
                <p className="text-xs text-white/80">
                  Token #{tokenDisplay} • {booking.crop || "Produce"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* WARNING BANNER */}
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 leading-relaxed font-medium">
                {t("farmerCancel.warningNotice", { token: tokenDisplay })}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            {t("farmerCancel.modalSubtitle")}
          </p>

          {/* REASON RADIO SELECTOR */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              {t("farmerCancel.selectReason")}
            </label>
            <div className="space-y-2">
              {standardReasons.map((r) => {
                const isSelected = selectedReasonId === r.id;
                return (
                  <label
                    key={r.id}
                    onClick={() => setSelectedReasonId(r.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                      isSelected
                        ? "border-red-500 bg-red-50/60 shadow-xs ring-1 ring-red-400"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="farmerCancelReason"
                      value={r.id}
                      checked={isSelected}
                      onChange={() => setSelectedReasonId(r.id)}
                      className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-semibold text-gray-900 leading-snug">
                      {r.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* REMARKS (OPTIONAL) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              {t("farmerCancel.remarksLabel")}
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t("farmerCancel.remarksPlaceholder")}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {t("farmerCancel.keepBtn")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full sm:w-auto rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              t("farmerCancel.cancelling")
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                {t("farmerCancel.confirmBtn")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
