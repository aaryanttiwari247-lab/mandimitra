"use client";

import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Booking } from "@/lib/types";
import { broadcastProcurementUpdate } from "@/lib/cross-tab-sync";
import { matchesBookingIdentifier } from "@/lib/procurement-store";

type CancellationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  officialName?: string;
  onCancelled?: (updatedBooking: any) => void;
};

export function CancellationModal({
  isOpen,
  onClose,
  booking,
  officialName = "Procurement Officer",
  onCancelled,
}: CancellationModalProps) {
  const { t } = useLanguage();

  const standardReasons = [
    { id: "bad_quality", label: t("official.reasonBadQuality") },
    { id: "invalid_info", label: t("official.reasonInvalidInfo") },
    { id: "not_on_time", label: t("official.reasonNotOnTime") },
    { id: "other", label: t("official.reasonOther") },
  ];

  const [selectedReasonId, setSelectedReasonId] = useState<string>("bad_quality");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    setError("");
    const matchedReason =
      standardReasons.find((r) => r.id === selectedReasonId)?.label ||
      t("official.reasonOther");

    const fullReason = remarks.trim()
      ? `${matchedReason} (${remarks.trim()})`
      : matchedReason;

    setSubmitting(true);
    const now = new Date().toISOString();

    const updatedBooking: Booking = {
      ...booking,
      status: "CANCELLED",
      queueStatus: "CANCELLED",
      procurementStatus: "CANCELLED",
      cancellationReason: fullReason,
      cancelledAt: now,
      cancelledBy: officialName,
      updatedAt: now,
    };

    try {
      // 1. Update localStorage Queue
      const queueData = localStorage.getItem("smartProcurementQueue");
      if (queueData) {
        try {
          const queue: Booking[] = JSON.parse(queueData);
          if (Array.isArray(queue)) {
            const norm = (booking.token || booking.bookingId || "").toUpperCase();
            const updatedQueue = queue.map((item) => {
              if (matchesBookingIdentifier(item, norm)) {
                return updatedBooking;
              }
              return item;
            });
            localStorage.setItem("smartProcurementQueue", JSON.stringify(updatedQueue));
          }
        } catch {}
      }

      // 2. Update current farmer booking in localStorage if matched
      const currentBookingData = localStorage.getItem("smartProcurementBooking");
      if (currentBookingData) {
        try {
          const current: Booking = JSON.parse(currentBookingData);
          const norm = (booking.token || booking.bookingId || "").toUpperCase();
          if (matchesBookingIdentifier(current, norm)) {
            localStorage.setItem("smartProcurementBooking", JSON.stringify(updatedBooking));
          }
        } catch {}
      }

      // 3. Update history in localStorage
      const historyData = localStorage.getItem("smartProcurementHistory");
      if (historyData) {
        try {
          const history: Booking[] = JSON.parse(historyData);
          if (Array.isArray(history)) {
            const norm = (booking.token || booking.bookingId || "").toUpperCase();
            const idx = history.findIndex((b) => matchesBookingIdentifier(b, norm));
            if (idx !== -1) {
              history[idx] = updatedBooking;
            } else {
              history.unshift(updatedBooking);
            }
            localStorage.setItem("smartProcurementHistory", JSON.stringify(history));
          }
        } catch {}
      }

      // 4. Trigger events & Broadcast
      window.dispatchEvent(new Event("smartProcurementQueueUpdated"));
      window.dispatchEvent(new Event("smartProcurementBookingUpdated"));

      broadcastProcurementUpdate({
        type: "STATUS_UPDATED",
        token: booking.token,
        bookingId: booking.bookingId,
        status: "CANCELLED",
        booking: updatedBooking,
      });

      // 5. Sync with backend API
      const identifier = booking.bookingId || booking.token || "";
      if (identifier) {
        fetch(`/api/official/queue/${encodeURIComponent(identifier)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            cancellationReason: fullReason,
            cancelledBy: officialName,
          }),
        }).catch((err) => console.warn("Failed to sync cancel status:", err));

        fetch("/api/official/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedBooking),
        }).catch((err) => console.warn("Failed to sync cancel queue:", err));
      }

      if (onCancelled) {
        onCancelled(updatedBooking);
      }

      onClose();
    } catch (err: any) {
      console.error("Cancellation error:", err);
      setError(err?.message || "Failed to cancel procurement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t("official.cancelModalTitle")}
            </h3>
            <p className="text-xs font-semibold text-rose-600">
              #{booking.token} • {booking.farmerName || "Farmer"} ({booking.crop || "Crop"})
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          {t("official.cancelModalSubtitle")}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Reason Options */}
        <div className="mt-5 space-y-2.5">
          <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase">
            {t("official.selectReason")}
          </label>
          <div className="space-y-2">
            {standardReasons.map((reason) => {
              const isSelected = selectedReasonId === reason.id;
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReasonId(reason.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition-all duration-150 ${
                    isSelected
                      ? "border-rose-300 bg-rose-50/70 font-bold text-rose-900 shadow-xs ring-1 ring-rose-300"
                      : "border-gray-200 bg-white font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50/60"
                  }`}
                >
                  <span>{reason.label}</span>
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Remarks */}
        <div className="mt-4">
          <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase">
            {t("official.additionalRemarks")}
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={t("official.remarksPlaceholder")}
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 placeholder:text-gray-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
          >
            {t("official.keepActive")}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-70 sm:w-auto"
          >
            <AlertTriangle className="h-4 w-4" />
            {submitting
              ? t("official.cancelling")
              : t("official.confirmCancellation")}
          </button>
        </div>
      </div>
    </div>
  );
}
