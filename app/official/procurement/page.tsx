"use client";

import {
  AlertTriangle,
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
import { matchesBookingIdentifier } from "@/lib/procurement-store";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/context/language-context";
import { CancellationModal } from "@/components/CancellationModal";
import { BookingCropItem } from "@/lib/types";

type Booking = {
  bookingId?: string;
  tokenNumber?: number;
  token?: string;

  farmerId?: string;
  farmerName?: string;
  farmerMobile?: string;

  crop?: string;
  quantity?: number;
  crops?: BookingCropItem[];

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

  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;

  arrivalTime?: string;

  createdAt?: string;
  updatedAt?: string;
};

type ProcurementStatus =
  | "WAITING"
  | "VERIFIED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

function ProcurementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const tokenFromUrl = searchParams.get("token");

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedGrade, setSelectedGrade] =
    useState<CropGrade>("Grade A");

  const [verifiedWeight, setVerifiedWeight] =
    useState<string>("");

  interface CropProcurementItemState {
    crop: string;
    grade: CropGrade;
    weight: string;
  }
  const [cropsState, setCropsState] = useState<CropProcurementItemState[]>([]);

  useEffect(() => {
    if (booking) {
      if (booking.cropGrade) {
        setSelectedGrade(booking.cropGrade);
      }
      const initialQty =
        booking.actualQuantity ?? booking.quantity ?? 0;
      setVerifiedWeight(String(initialQty));

      if (booking.crops && booking.crops.length > 0) {
        setCropsState(
          booking.crops.map((c) => ({
            crop: c.crop,
            grade: (c.cropGrade as CropGrade) || (booking.cropGrade as CropGrade) || "Grade A",
            weight: String(c.actualQuantity ?? c.quantity ?? 0),
          }))
        );
      } else if (booking.crop) {
        setCropsState([
          {
            crop: booking.crop,
            grade: (booking.cropGrade as CropGrade) || "Grade A",
            weight: String(initialQty),
          },
        ]);
      }
    }
  }, [
    booking?.bookingId,
    booking?.token,
    booking?.cropGrade,
    booking?.quantity,
    booking?.actualQuantity,
  ]);

  const updateCropGrade = (index: number, grade: CropGrade) => {
    setCropsState((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, grade } : item))
    );
  };

  const updateCropWeight = (index: number, weight: string) => {
    setCropsState((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, weight } : item))
    );
  };

  const cropMspInfo = useMemo(() => {
    return getCropMspData(booking?.crop);
  }, [booking?.crop]);

  const livePayoutCalc = useMemo(() => {
    const qty = parseFloat(verifiedWeight) || 0;
    return calculatePayout(booking?.crop, selectedGrade, qty);
  }, [booking?.crop, selectedGrade, verifiedWeight]);

  const multiCropPayouts = useMemo(() => {
    return cropsState.map((c) => {
      const qty = parseFloat(c.weight) || 0;
      const calc = calculatePayout(c.crop, c.grade, qty);
      const mspInfo = getCropMspData(c.crop);
      return {
        ...c,
        qty,
        calc,
        mspInfo,
      };
    });
  }, [cropsState]);

  const multiCropTotalWeight = useMemo(() => {
    return multiCropPayouts.reduce((acc, c) => acc + c.qty, 0);
  }, [multiCropPayouts]);

  const multiCropTotalPayout = useMemo(() => {
    return multiCropPayouts.reduce((acc, c) => acc + c.calc.totalPayout, 0);
  }, [multiCropPayouts]);

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

    if (status.includes("CANCELLED") || status.includes("CANCEL")) {
      return "CANCELLED";
    }

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
        if (updatedBooking.crops && updatedBooking.crops.length > 1) {
          alert(
            `Token #${booking.token} is now processing for ${updatedBooking.crops.length} crops.\nTotal Weighed: ${updatedBooking.actualQuantity} Quintals\nTotal Payout: ${formatINR(updatedBooking.totalPayout || 0)}`
          );
        } else {
          alert(
            `Token #${booking.token} is now processing.\nGrade: ${extraUpdates?.cropGrade || selectedGrade}\nMSP Rate: ₹${extraUpdates?.mspRate || livePayoutCalc.ratePerQuintal}/quintal\nTotal Payout: ${formatINR(extraUpdates?.totalPayout || livePayoutCalc.totalPayout)}`
          );
        }
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

    if (booking.crops && booking.crops.length > 1) {
      for (const c of cropsState) {
        const w = parseFloat(c.weight);
        if (isNaN(w) || w <= 0) {
          alert(`Please enter a valid weighed quantity for ${c.crop} (must be greater than 0).`);
          return;
        }
      }

      const summaryText = multiCropPayouts
        .map(
          (c) =>
            `• ${c.crop}: ${c.weight} qtl @ ${c.grade} (₹${c.calc.ratePerQuintal.toLocaleString("en-IN")}/q) = ${formatINR(c.calc.totalPayout)}`
        )
        .join("\n");

      const confirmed = window.confirm(
        `Start Multi-Crop Procurement Confirmation:\n${summaryText}\n\nTotal Weighed: ${multiCropTotalWeight} Quintals\nTotal Combined Payout: ${formatINR(multiCropTotalPayout)}\n\nProceed to start procurement?`
      );

      if (!confirmed) {
        return;
      }

      const cropsUpdated: BookingCropItem[] = multiCropPayouts.map((c) => ({
        crop: c.crop,
        quantity: booking.crops?.find((x) => x.crop === c.crop)?.quantity || c.qty,
        actualQuantity: c.qty,
        cropGrade: c.grade,
        mspRate: c.calc.ratePerQuintal,
        totalPayout: c.calc.totalPayout,
      }));

      updateProcurementStatus("PROCESSING", {
        crops: cropsUpdated,
        actualQuantity: multiCropTotalWeight,
        totalPayout: multiCropTotalPayout,
        paymentStatus: "CALCULATED",
      });
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

    const isMulti = Boolean(booking.crops && booking.crops.length > 1);
    const finalPayout = booking.totalPayout || (isMulti ? multiCropTotalPayout : livePayoutCalc.totalPayout);
    const confirmed =
      window.confirm(
        `Complete Procurement for Token #${booking.token}?\nFarmer: ${booking.farmerName}\n${
          isMulti
            ? `Crops (${booking.crops?.length}): ` + booking.crops?.map((c) => `${c.crop} (${c.actualQuantity ?? c.quantity}q)`).join(", ")
            : `Grade: ${booking.cropGrade || selectedGrade}`
        }\nTotal Payout: ${formatINR(finalPayout)}\n\nThis will authorize the final settlement slip and direct bank transfer.`
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
            {t("official.loadingFarmerDetails")}
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

              {t("official.backToDashboard")}

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

          <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">

              <Ticket className="h-8 w-8 text-red-500" />

            </div>

            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              {t("official.bookingNotFound")}
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
              {t("official.returnToDashboard")}
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

            {t("official.backToDashboard")}

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
          CONTENT
      ====================================================== */}

      <section className="px-5 py-8 sm:px-8">

        <div className="mx-auto max-w-5xl">

          {/* TITLE */}

          <div className="mb-7">

            <p className="text-sm font-medium text-[#2E7D32]">
              {t("official.procurementOfficer")}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("official.procurementProcessing")}
            </h1>

            <p className="mt-2 text-gray-600">
              {t("official.procurementProcessingSubtitle")}
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

                    {t("official.smartTokenHeader")}

                  </div>

                  <div className="mt-3 text-5xl font-bold">
                    #{booking.token}
                  </div>

                  <p className="mt-3 text-sm text-white/80">
                    {booking.farmerName ?? t("common.farmer")} •{" "}
                    {booking.crops && booking.crops.length > 1
                      ? booking.crops.map((c) => `${c.crop} (${c.quantity}q)`).join(" + ")
                      : (booking.crop ?? "")}
                  </p>

                </div>


                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-xs text-white/70">
                    {t("official.currentStatusLabel")}
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
              {t("official.farmerInfoTitle")}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <InfoCard
                icon={
                  <User className="h-5 w-5 text-[#2E7D32]" />
                }
                label={t("common.farmer")}
                value={
                  booking.farmerName ??
                  t("common.farmer")
                }
              />

              <InfoCard
                icon={
                  <Ticket className="h-5 w-5 text-[#2E7D32]" />
                }
                label={t("official.farmerId")}
                value={
                  booking.farmerId ??
                  "Not available"
                }
              />

              <InfoCard
                icon={
                  <MapPin className="h-5 w-5 text-[#2E7D32]" />
                }
                label={t("official.procurementCentre")}
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
              {t("official.procurementDetailsTitle")}
            </h2>

            {booking.crops && booking.crops.length > 1 ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {booking.crops.map((c, idx) => (
                    <div key={idx} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">Crop #{idx + 1}</span>
                        {c.cropGrade && (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            {c.cropGrade}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-base font-extrabold text-gray-900">🌾 {c.crop}</p>
                      <p className="text-xs font-semibold text-gray-600 mt-1">
                        Quantity: {c.actualQuantity ?? c.quantity} {t("common.quintals")}
                      </p>
                      {c.mspRate ? (
                        <p className="text-xs text-gray-500 mt-0.5">
                          MSP: ₹{c.mspRate.toLocaleString("en-IN")} / q
                        </p>
                      ) : null}
                      {c.totalPayout ? (
                        <p className="text-xs font-bold text-[#2E7D32] mt-1 pt-1 border-t border-emerald-200">
                          Payout: {formatINR(c.totalPayout)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoCard
                    icon={<Truck className="h-5 w-5 text-[#2E7D32]" />}
                    label="Total Combined Quantity"
                    value={`${booking.actualQuantity || booking.quantity || 0} ${t("common.quintals")}`}
                  />
                  <InfoCard
                    icon={<Clock3 className="h-5 w-5 text-[#2E7D32]" />}
                    label={t("official.timeSlot")}
                    value={booking.fullTime ?? booking.time ?? "Not available"}
                  />
                  <InfoCard
                    icon={<Clock3 className="h-5 w-5 text-[#2E7D32]" />}
                    label="Date"
                    value={formatDate(booking.date)}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                  icon={
                    <Wheat className="h-5 w-5 text-[#2E7D32]" />
                  }
                  label={t("official.crop")}
                  value={
                    booking.crop ??
                    "Not available"
                  }
                />

                <InfoCard
                  icon={
                    <Truck className="h-5 w-5 text-[#2E7D32]" />
                  }
                  label={t("official.quantity")}
                  value={
                    booking.actualQuantity
                      ? `${booking.actualQuantity} ${t("common.quintals")}`
                      : booking.quantity
                      ? `${booking.quantity} ${t("common.quintals")}`
                      : "Not available"
                  }
                />

                <InfoCard
                  icon={
                    <Award className="h-5 w-5 text-[#2E7D32]" />
                  }
                  label={t("official.assignedGrade")}
                  value={
                    booking.cropGrade
                      ? `${booking.cropGrade}`
                      : (currentStatus === "VERIFIED" ? `${selectedGrade}` : t("official.pendingGrading"))
                  }
                />

                <InfoCard
                  icon={
                    <IndianRupee className="h-5 w-5 text-[#2E7D32]" />
                  }
                  label={t("official.mspRateApplied")}
                  value={
                    booking.mspRate
                      ? `₹${booking.mspRate.toLocaleString("en-IN")} / ${t("common.quintals")}`
                      : `₹${livePayoutCalc.ratePerQuintal.toLocaleString("en-IN")} / ${t("common.quintals")}`
                  }
                />

                <InfoCard
                  icon={
                    <Clock3 className="h-5 w-5 text-[#2E7D32]" />
                  }
                  label={t("official.timeSlot")}
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
            )}

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

                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-bold text-red-700 hover:bg-red-100 hover:border-red-300 disabled:opacity-60"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    {t("official.cancelProcurement")}
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
                      {booking.crops && booking.crops.length > 1
                        ? `Assess quality grade (Grade A to D) and enter weighbridge weight for each of the ${booking.crops.length} declared crops.`
                        : `Select the crop quality grade (Grade A to D) and verify the weighbridge quantity to determine the farmer's direct benefit payout.`}
                    </p>
                  </div>
                  {(!booking.crops || booking.crops.length <= 1) && (
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Procured Crop</p>
                      <p className="text-base font-extrabold text-[#2E7D32]">{cropMspInfo.name} ({cropMspInfo.nameHi})</p>
                    </div>
                  )}
                </div>

                {booking.crops && booking.crops.length > 1 ? (
                  <div className="mt-6 space-y-6">
                    {multiCropPayouts.map((cropItem, idx) => (
                      <div key={idx} className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-800 text-sm">
                              {idx + 1}
                            </span>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                🌾 {cropItem.crop} ({cropItem.mspInfo.nameHi})
                              </h3>
                              <p className="text-xs text-gray-500">
                                Declared Booking Quantity: {booking.crops?.[idx]?.quantity || 0} Quintals
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold uppercase text-gray-400">Crop Subtotal</p>
                            <p className="text-xl font-black text-[#2E7D32]">{formatINR(cropItem.calc.totalPayout)}</p>
                          </div>
                        </div>

                        {/* Grade selection buttons for this crop */}
                        <div className="mt-4">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                            Select Quality Grade for {cropItem.crop}:
                          </label>
                          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                            {(["Grade A", "Grade B", "Grade C", "Grade D"] as CropGrade[]).map((gradeKey) => {
                              const detail = cropItem.mspInfo.grades[gradeKey];
                              const isSelected = cropItem.grade === gradeKey;
                              return (
                                <button
                                  key={gradeKey}
                                  type="button"
                                  onClick={() => updateCropGrade(idx, gradeKey)}
                                  className={`flex flex-col justify-between rounded-2xl border-2 p-3 text-left transition ${
                                    isSelected
                                      ? "border-[#2E7D32] bg-[#E8F5E9]/40 shadow-sm ring-2 ring-[#2E7D32]/30"
                                      : "border-gray-200 bg-gray-50/70 hover:border-gray-300 hover:bg-white"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
                                          isSelected
                                            ? "bg-[#2E7D32] text-white"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                      >
                                        {gradeKey}
                                      </span>
                                      {isSelected && (
                                        <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />
                                      )}
                                    </div>
                                    <p className="mt-2 text-xs font-bold text-gray-900 leading-tight">
                                      {detail.label}
                                    </p>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-sm font-black text-[#2E7D32]">
                                      ₹{detail.price.toLocaleString("en-IN")}{" "}
                                      <span className="text-[10px] font-medium text-gray-500">/ qtl</span>
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Weight input for this crop */}
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                              Weighbridge Weight ({cropItem.crop})
                            </label>
                            <div className="mt-2 flex items-center gap-2">
                              <Scale className="h-4 w-4 text-gray-400 shrink-0" />
                              <input
                                type="number"
                                step="0.01"
                                min="0.1"
                                value={cropItem.weight}
                                onChange={(e) => updateCropWeight(idx, e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                                placeholder="Quintals"
                              />
                              <span className="text-xs font-bold text-gray-500">qtl</span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Applied MSP Rate</p>
                            <p className="mt-2 text-lg font-black text-[#2E7D32]">
                              ₹{cropItem.calc.ratePerQuintal.toLocaleString("en-IN")}{" "}
                              <span className="text-xs font-normal text-gray-500">/ quintal</span>
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">{cropItem.grade} ({cropItem.calc.gradeLabel})</p>
                          </div>

                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 sm:col-span-2 lg:col-span-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">Subtotal Payout</p>
                            <p className="mt-2 text-xl font-black text-[#2E7D32]">
                              {formatINR(cropItem.calc.totalPayout)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#2E7D32]/80">
                              {cropItem.qty} q × ₹{cropItem.calc.ratePerQuintal.toLocaleString("en-IN")}/q
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Grand Combined Summary Box */}
                    <div className="rounded-3xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <span className="inline-block rounded-full bg-[#2E7D32] px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                            Multi-Crop Aggregated Payout
                          </span>
                          <h4 className="mt-2 text-xl font-bold text-gray-900">
                            Combined Settlement ({multiCropPayouts.length} Crops)
                          </h4>
                          <p className="mt-1 text-xs text-gray-700">
                            Total Weighed Quantity: <strong>{multiCropTotalWeight} Quintals</strong> across all {multiCropPayouts.length} crops.
                          </p>
                        </div>
                        <div className="text-right sm:border-l sm:border-[#2E7D32]/20 sm:pl-6">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                            Total Direct Benefit Transfer (DBT)
                          </p>
                          <p className="mt-1 text-3xl font-black text-[#2E7D32]">
                            {formatINR(multiCropTotalPayout)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleStartProcurement}
                    disabled={
                      actionLoading ||
                      (booking.crops && booking.crops.length > 1
                        ? multiCropTotalPayout <= 0
                        : livePayoutCalc.totalPayout <= 0)
                    }
                    className="flex w-full sm:w-fit items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-7 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Clock3 className="h-5 w-5" />
                    {actionLoading
                      ? "Starting..."
                      : booking.crops && booking.crops.length > 1
                      ? `Confirm & Start Procurement (${booking.crops.length} Crops — ${formatINR(multiCropTotalPayout)})`
                      : `Confirm & Start Procurement (${selectedGrade} — ${formatINR(livePayoutCalc.totalPayout)})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 hover:bg-red-100 hover:border-red-300 disabled:opacity-60"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    {t("official.cancelProcurement")}
                  </button>
                </div>
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

                {booking.crops && booking.crops.length > 1 ? (
                  <div className="mt-5 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {booking.crops.map((c, i) => (
                        <div key={i} className="rounded-2xl bg-white p-4 border border-gray-200">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Crop #{i + 1}</p>
                          <p className="mt-1 text-base font-extrabold text-gray-900">🌾 {c.crop}</p>
                          <div className="mt-2 space-y-1 text-xs text-gray-600">
                            <p>Grade: <strong className="text-emerald-800">{c.cropGrade || "Grade A"}</strong></p>
                            <p>Weighed: <strong>{c.actualQuantity ?? c.quantity} Quintals</strong></p>
                            <p>MSP: <strong>₹{(c.mspRate || 0).toLocaleString("en-IN")}/q</strong></p>
                            <p className="text-[#2E7D32] font-black text-sm pt-1.5 border-t border-gray-100">
                              Payout: {formatINR(c.totalPayout || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Weighed Produce</p>
                        <p className="text-xl font-bold text-gray-900">{booking.actualQuantity || booking.quantity || 0} Quintals</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">Combined DBT Payout</p>
                        <p className="text-2xl font-black text-[#2E7D32]">{formatINR(booking.totalPayout || multiCropTotalPayout)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={
                      handleCompleteProcurement
                    }
                    disabled={actionLoading}
                    className="flex w-full sm:w-fit items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-7 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {actionLoading
                      ? "Completing..."
                      : "Complete Procurement & Generate Settlement Slip"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 hover:bg-red-100 hover:border-red-300 disabled:opacity-60"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    {t("official.cancelProcurement")}
                  </button>
                </div>
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
                    {booking.crops && booking.crops.length > 1 ? (
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {booking.crops.map((c, i) => (
                            <div key={i} className="rounded-xl bg-[#F7F9F5] p-4 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase text-gray-500">Crop #{i + 1}</p>
                                <span className="rounded-md bg-[#E8F5E9] px-2 py-0.5 text-xs font-bold text-[#2E7D32]">
                                  {c.cropGrade || "Grade A"}
                                </span>
                              </div>
                              <p className="mt-1 text-base font-extrabold text-gray-900">🌾 {c.crop}</p>
                              <div className="mt-2 space-y-1 text-xs text-gray-600">
                                <p>Certified Weight: <strong>{c.actualQuantity ?? c.quantity} Quintals</strong></p>
                                <p>MSP Applied: <strong>₹{(c.mspRate || 0).toLocaleString("en-IN")} / q</strong></p>
                                <p className="text-[#2E7D32] font-black text-sm pt-1 border-t border-gray-200">
                                  Payout: {formatINR(c.totalPayout || 0)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-5 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                              Total Combined Weight ({booking.crops.length} Crops)
                            </p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">
                              {booking.actualQuantity || booking.quantity || 0} Quintals
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                              {t("tracker.totalPayout")} (Direct Bank Transfer)
                            </p>
                            <p className="text-3xl font-black text-[#2E7D32] mt-0.5">
                              {formatINR(booking.totalPayout || multiCropTotalPayout)}
                            </p>
                            <p className="text-xs text-emerald-800 font-medium mt-0.5">
                              {t("tracker.creditedAadhaar")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                            <span className="text-xs font-normal text-gray-500">{t("common.quintals")}</span>
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500">{t("official.mspRateApplied")}</p>
                          <p className="mt-1 text-xl font-extrabold text-[#2E7D32]">
                            ₹{(booking.mspRate || livePayoutCalc.ratePerQuintal).toLocaleString("en-IN")}{" "}
                            <span className="text-xs font-normal text-gray-500">/ {t("common.quintals")}</span>
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#E8F5E9] p-3.5 border border-[#CDE8D0]">
                          <p className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">{t("tracker.totalPayout")}</p>
                          <p className="mt-1 text-2xl font-black text-[#2E7D32]">
                            {formatINR(booking.totalPayout || livePayoutCalc.totalPayout)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#2E7D32]/80">{t("tracker.creditedAadhaar")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* CANCELLED: PROCUREMENT REJECTED / ENDED */}

            {currentStatus === "CANCELLED" && (
              <div className="rounded-2xl border-2 border-red-300 bg-red-50/90 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xs">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-800 uppercase tracking-wide">
                      Procurement Cancelled & Slot Terminated
                    </span>
                    <h2 className="mt-2 text-2xl font-bold text-red-950">
                      Procurement Cancelled by Official
                    </h2>
                    <p className="mt-1 text-sm text-red-800">
                      This procurement slot has ended and no further weighbridge or payout processing will occur for this token.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 rounded-xl bg-white p-5 border border-red-200 shadow-xs">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Official Cancellation Reason
                        </p>
                        <p className="mt-1 text-base font-bold text-red-700">
                          {booking.cancellationReason || "Cancelled by official"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Cancelled By
                        </p>
                        <p className="mt-1 text-base font-semibold text-gray-900">
                          {booking.cancelledBy || "Procurement Officer"}
                        </p>
                        {booking.cancelledAt && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(booking.cancelledAt).toLocaleString("en-IN")}
                          </p>
                        )}
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

            {t("official.backToDashboard")}

          </button>


          <p className="mt-5 text-center text-xs text-gray-400">
            Procurement status is synchronized with the farmer queue.
          </p>

        </div>

      </section>

      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        booking={booking}
        onCancelled={(updated) => {
          setBooking(updated);
          setIsCancelModalOpen(false);
        }}
      />

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