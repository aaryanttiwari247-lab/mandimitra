"use client";

import React, { useEffect } from "react";
import {
  Download,
  ExternalLink,
  Printer,
  ReceiptText,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { formatINR, getCropMspData } from "@/lib/msp-rates";

export type JSlipBooking = {
  bookingId?: string;
  token?: string;
  tokenNumber?: number;
  farmerId?: string;
  farmerName?: string;
  farmerMobile?: string;
  crop?: string;
  crops?: Array<{
    crop: string;
    quantity: number;
    actualQuantity?: number;
    mspRate?: number;
    totalPayout?: number;
    cropGrade?: string;
  }>;
  quantity?: number;
  actualQuantity?: number;
  cropGrade?: string;
  mspRate?: number;
  totalPayout?: number;
  paymentStatus?: string;
  date?: string;
  time?: string;
  fullTime?: string;
  centre?: string;
  completedAt?: string | null;
  updatedAt?: string;
  verifiedBy?: string | null;
};

interface MandiJSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: JSlipBooking | null;
}

function numberToIndianWords(num: number): string {
  const n = Math.round(num);
  if (!n || isNaN(n) || n <= 0) return "Zero Rupees Only";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function helper(val: number): string {
    if (val === 0) return "";
    if (val < 20) return units[val] + " ";
    if (val < 100)
      return tens[Math.floor(val / 10)] + " " + units[val % 10] + " ";
    if (val < 1000)
      return units[Math.floor(val / 100)] + " Hundred " + helper(val % 100);
    if (val < 100000)
      return helper(Math.floor(val / 1000)) + "Thousand " + helper(val % 1000);
    if (val < 10000000)
      return helper(Math.floor(val / 100000)) + "Lakh " + helper(val % 100000);
    return (
      helper(Math.floor(val / 10000000)) + "Crore " + helper(val % 10000000)
    );
  }

  return ("Rupees " + helper(n).trim() + " Only").replace(/\s+/g, " ");
}

function formatEnglishDate(dateString?: string): string {
  if (!dateString) return "Today";
  const d = new Date(dateString.includes("T") ? dateString : `${dateString}T00:00:00`);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCompletedDateTime(booking: JSlipBooking): string {
  const ts = booking.completedAt || booking.updatedAt;
  if (ts) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${datePart} • ${timePart}`;
    }
  }
  return `${formatEnglishDate(booking.date)} • ${booking.fullTime || booking.time || "11:30 AM"}`;
}

export function MandiJSlipModal({
  isOpen,
  onClose,
  booking,
}: MandiJSlipModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const rawToken =
    booking.token ||
    (booking.tokenNumber ? String(booking.tokenNumber) : "") ||
    booking.bookingId ||
    "101";
  const cleanToken = String(rawToken).replace(/^#/, "").trim();

  // Effective quantities & rates
  const effectiveQty =
    booking.actualQuantity ??
    (booking.crops && booking.crops.length > 0
      ? booking.crops.reduce(
          (acc, c) => acc + (c.actualQuantity ?? c.quantity ?? 0),
          0
        )
      : booking.quantity ?? 0);

  const fallbackMsp = booking.crop
    ? getCropMspData(booking.crop).standardMsp
    : 2425;
  const effectiveRate = booking.mspRate || fallbackMsp;

  const effectiveTotalPayout =
    booking.totalPayout ??
    (booking.crops && booking.crops.length > 0
      ? booking.crops.reduce(
          (acc, c) =>
            acc +
            (c.totalPayout ??
              Math.round(
                (c.actualQuantity ?? c.quantity ?? 0) *
                  (c.mspRate || fallbackMsp)
              )),
          0
        )
      : Math.round(effectiveQty * effectiveRate));

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="receipt-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-transparent print:static">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #mandi-j-slip-container,
          #mandi-j-slip-container * {
            visibility: visible !important;
          }
          #mandi-j-slip-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-hidden-element {
            display: none !important;
          }
        }
      `}</style>

      {/* BACKDROP CLICK DISMISS */}
      <div
        className="fixed inset-0 print-hidden-element"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 my-6 w-full max-w-[490px] rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden print-hidden-element:border-none">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#13491E] via-[#1B5E2B] to-[#13491E] px-5 py-3.5 text-white print-hidden-element">
          <div className="flex items-center gap-2.5">
            <ReceiptText className="h-5 w-5 text-emerald-200" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {t("tracker.jSlipVoucher")}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {t("tracker.formJRule")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
              title={t("tracker.downloadPdf")}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{t("tracker.printReceipt") || "Print"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
              title={t("common.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-5 flex flex-col items-center bg-gray-50/50">
          <div
            id="mandi-j-slip-container"
            className="w-full max-w-[430px] rounded-2xl border-2 border-gray-900 bg-white p-5 shadow-md print:border-black print:p-4"
          >
            {/* APMC OFFICIAL HEADER */}
            <div className="text-center border-b-2 border-gray-900 pb-3">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#2E7D32] print:text-black">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{t("tracker.apmcMandiCommittee")}</span>
              </div>
              <h3 className="mt-0.5 text-base sm:text-lg font-black tracking-tight text-gray-950 uppercase">
                {t("tracker.formJTitle")}
              </h3>
              <p className="text-[10px] font-bold text-gray-600 print:text-gray-800">
                {t("tracker.formJRule")}
              </p>
              <p className="mt-1 text-xs font-black text-gray-900">
                {booking.centre || "APMC Procurement Centre"}
              </p>
            </div>

            {/* VOUCHER META & TOKEN */}
            <div className="my-2.5 flex items-center justify-between border-b border-dashed border-gray-400 pb-2 text-[11px]">
              <div>
                <span className="text-gray-500 font-medium">
                  {t("tracker.jSlipNo")}
                </span>
                <strong className="ml-1 text-gray-950 font-mono">
                  J-{cleanToken}-
                  {booking.date?.replace(/-/g, "") || "2026"}
                </strong>
              </div>
              <div className="rounded bg-gray-100 px-2.5 py-0.5 font-mono font-black text-gray-900 print:border print:border-black">
                {t("tracker.token")} #{cleanToken}
              </div>
            </div>

            {/* COMPLETION TIMESTAMP */}
            <div className="mb-2.5 flex items-center justify-between text-[11px] border-b border-dashed border-gray-400 pb-2">
              <span className="text-gray-500 font-medium">
                {t("tracker.dateTimeLabel")}
              </span>
              <span className="font-bold text-gray-900">
                {formatCompletedDateTime(booking)}
              </span>
            </div>

            {/* SECTION 1: FARMER PARTICULARS */}
            <div className="space-y-1 text-xs border-b border-dashed border-gray-400 pb-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                {t("tracker.farmerParticulars")}
              </p>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("tracker.farmerName")}</span>
                <strong className="text-gray-950">
                  {booking.farmerName || "Farmer"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("tracker.farmerMobile")}</span>
                <span className="font-semibold text-gray-800">
                  +91 {booking.farmerMobile || "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("tracker.farmerRegId")}</span>
                <span className="font-mono font-bold text-gray-800">
                  {booking.farmerId ||
                    `FMR-${booking.farmerMobile?.slice(-4) || "8924"}`}
                </span>
              </div>
            </div>

            {/* SECTION 2: CROP QUALITY & WEIGHMENT DETAILS */}
            <div className="my-2.5 text-xs border-b border-dashed border-gray-400 pb-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">
                {t("tracker.cropQualityDetails")}
              </p>
              {booking.crops && booking.crops.length > 1 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-gray-300 text-[10px] uppercase text-gray-600">
                        <th className="py-1">{t("booking.cropLabel")}</th>
                        <th className="py-1 text-center">
                          {t("common.grade")}
                        </th>
                        <th className="py-1 text-right">
                          {t("booking.quantityLabel")}
                        </th>
                        <th className="py-1 text-right">{t("common.rate")}</th>
                        <th className="py-1 text-right">
                          {t("common.amount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {booking.crops.map((c, idx) => {
                        const cRate =
                          c.mspRate || getCropMspData(c.crop).standardMsp;
                        const cQty = c.actualQuantity ?? c.quantity ?? 0;
                        const cPayout =
                          c.totalPayout ?? Math.round(cQty * cRate);
                        return (
                          <tr key={idx} className="font-medium text-gray-900">
                            <td className="py-1 font-bold">{c.crop}</td>
                            <td className="py-1 text-center text-[10px]">
                              {c.cropGrade || "Grade A"}
                            </td>
                            <td className="py-1 text-right">{cQty} Q</td>
                            <td className="py-1 text-right">₹{cRate}</td>
                            <td className="py-1 text-right font-black">
                              ₹{cPayout.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("tracker.produceCrop")}
                    </span>
                    <strong className="text-gray-950 text-sm">
                      {booking.crop || "Produce"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("tracker.gradeLabel")}:
                    </span>
                    <span className="font-bold text-gray-900">
                      {booking.cropGrade || "Grade A (FAQ Standard)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("tracker.statutoryMspRate")}
                    </span>
                    <strong className="text-gray-950">
                      ₹{effectiveRate.toLocaleString("en-IN")} /{" "}
                      {t("common.quintals")}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: WEIGHMENT CERTIFICATION */}
            <div className="my-2.5 space-y-1 text-xs border-b border-dashed border-gray-400 pb-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                {t("tracker.weighmentDetails")}
              </p>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("tracker.bookedQty")}</span>
                <span className="font-semibold text-gray-800">
                  {booking.quantity || 0} {t("common.quintals")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">
                  {t("tracker.netWeighedQty")}
                </span>
                <span className="font-black text-gray-950 text-sm">
                  {effectiveQty} {t("common.quintals")}{" "}
                  <span className="text-[11px] font-semibold text-gray-600">
                    ({(effectiveQty * 100).toLocaleString("en-IN")} kg)
                  </span>
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>{t("tracker.electronicDharmkanta")}</span>
                <span className="text-emerald-700 font-bold print:text-black">
                  {t("tracker.certifiedWeighed")}
                </span>
              </div>
            </div>

            {/* SECTION 4: DBT PAYOUT HIGHLIGHT BOX */}
            <div className="my-3 rounded-xl border-2 border-[#2E7D32] bg-[#F1F8F2] p-3 text-center print:border-black print:bg-gray-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2E7D32] print:text-black">
                {t("tracker.totalDbtSent")}
              </p>
              <p className="mt-1 text-2xl font-black text-[#2E7D32] tracking-tight print:text-black">
                {formatINR(effectiveTotalPayout)}
              </p>
              <p className="mt-1 text-[11px] font-bold text-gray-800 leading-tight italic">
                {numberToIndianWords(effectiveTotalPayout)}
              </p>

              <div className="mt-2.5 border-t border-[#CDE8D0] pt-2 flex flex-col gap-1 text-[10px] text-left print:border-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tracker.paymentChannel")}
                  </span>
                  <strong className="text-gray-900">
                    {t("tracker.dbtChannel")}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tracker.paymentStatus")}:
                  </span>
                  <span className="font-black text-[#2E7D32] uppercase print:text-black">
                    {t("tracker.paymentStatusPaid")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tracker.dbtUtrRef")}
                  </span>
                  <strong className="font-mono text-gray-900">
                    UTR-DBT-{cleanToken}-
                    {booking.date?.replace(/-/g, "") || "2026"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tracker.beneficiaryAccount")}
                  </span>
                  <span className="text-gray-800 font-medium">
                    {t("tracker.aadhaarLinkedNotice", {
                      lastDigits: booking.farmerMobile?.slice(-4) || "8924",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 5: OFFICIAL SEAL & SIGNATURE */}
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-500 border-t border-dashed border-gray-400 pt-2">
              <div>
                <p className="font-bold text-gray-800">
                  {t("tracker.mandiOfficer")}
                </p>
                <p>{booking.verifiedBy || "APMC Procurement Officer"}</p>
                <p className="text-[9px] text-emerald-800 font-semibold mt-0.5 print:text-black">
                  {t("tracker.digitallyDisbursed")}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block rounded border border-gray-400 bg-white px-2 py-1 text-center">
                  <p className="text-[9px] font-black text-[#2E7D32] print:text-black uppercase">
                    {t("home.apmcOfficialBadge")}
                  </p>
                  <p className="text-[8px] text-gray-500">J-FORM SEAL</p>
                </div>
              </div>
            </div>

            {/* BARCODE */}
            <div className="mt-2.5 flex flex-col items-center justify-center border-t border-gray-200 pt-2">
              <div className="flex h-6 items-center gap-[1.5px]">
                {[
                  3, 1, 4, 2, 5, 1, 3, 4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 2, 3, 5,
                  1, 4, 2, 5, 3, 1, 4, 2,
                ].map((h, i) => (
                  <div
                    key={i}
                    className="w-[1.5px] bg-black"
                    style={{ height: `${h * 3.5 + 8}px` }}
                  />
                ))}
              </div>
              <p className="mt-1 font-mono text-[9px] text-gray-500 tracking-wider">
                *J-SLIP-{cleanToken}-
                {booking.date?.replace(/-/g, "") || "2026"}*
              </p>
              <p className="mt-1 text-center text-[8px] text-gray-400 leading-tight">
                Computer-generated official Mandi sale voucher under APMC Act.
                Certified proof of MSP procurement & electronic DBT credit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
