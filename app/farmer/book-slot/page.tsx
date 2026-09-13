"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coins,
  MapPin,
  Plus,
  Sparkles,
  Sprout,
  Trash2,
  Wheat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { BrandLogo } from "@/components/BrandLogo";

import { getFarmerSession } from "@/lib/farmer-auth";
import { Booking, BookingCropItem } from "@/lib/types";
import { CROP_MSP_RATES, getCropMspData, formatINR } from "@/lib/msp-rates";
import {
  LOCATIONS_DATA,
  PROCUREMENT_CENTRES,
  getCentresByLocation,
  ProcurementCentre,
} from "@/lib/locations-centres";
import { generateUniqueToken } from "@/lib/token-service";
import {
  getStoredQueue,
  saveStoredQueue,
  saveStoredCurrentBooking,
  saveStoredHistory,
} from "@/lib/procurement-store";

type SmartRecommendation = {
  bestCentre: {
    centreId: string;
    name: string;
    distanceKm: number;
    activeQueueCount: number;
    estimatedWaitMinutes: number;
    baysAvailable: number;
    score: number;
  };
  recommendedSlot: {
    slotId: string;
    timeWindow: string;
    shortTime: string;
    utilizationRate: number;
    availableSeats: number;
  };
  timeSavedMinutes: number;
  reasoning: string;
};


const slots = [
  {
    time: "10:00 AM – 10:30 AM",
    shortTime: "10:00 AM",
    available: 0,
  },
  {
    time: "10:30 AM – 11:00 AM",
    shortTime: "10:30 AM",
    available: 14,
  },
  {
    time: "11:00 AM – 11:30 AM",
    shortTime: "11:00 AM",
    available: 8,
  },
  {
    time: "11:30 AM – 12:00 PM",
    shortTime: "11:30 AM",
    available: 3,
  },
  {
    time: "12:00 PM – 12:30 PM",
    shortTime: "12:00 PM",
    available: 0,
  },
];

export default function BookProcurementSlot() {
  const router = useRouter();
  const { t } = useLanguage();

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [cropsList, setCropsList] = useState<Array<{ id: string; crop: string; quantity: string }>>([
    { id: "1", crop: "Wheat", quantity: "" },
  ]);
  const [date, setDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Bhopal");

  const totalQuantity = useMemo(() => {
    return cropsList.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cropsList]);

  const combinedCropNames = useMemo(() => {
    return cropsList.map((item) => item.crop).filter(Boolean).join(" + ");
  }, [cropsList]);

  const totalEstimatedPayout = useMemo(() => {
    return cropsList.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const mspData = getCropMspData(item.crop);
      return sum + q * mspData.standardMsp;
    }, 0);
  }, [cropsList]);

  const handleAddCrop = () => {
    if (cropsList.length >= 3) return;
    const existing = new Set(cropsList.map((c) => c.crop));
    const nextAvailable = CROP_MSP_RATES.find((c) => !existing.has(c.name))?.name || "Mustard";
    setCropsList((prev) => [
      ...prev,
      { id: String(Date.now()), crop: nextAvailable, quantity: "" },
    ]);
  };

  const handleRemoveCrop = (id: string) => {
    if (cropsList.length <= 1) return;
    setCropsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateCrop = (id: string, field: "crop" | "quantity", value: string) => {
    setCropsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const availableCentres = useMemo(() => {
    return getCentresByLocation(selectedLocation);
  }, [selectedLocation]);

  const [selectedCentre, setSelectedCentre] = useState(
    "Lakshmipur Procurement Centre"
  );

  // When location changes, auto-select recommended or first centre in that location
  useEffect(() => {
    const allotted = getCentresByLocation(selectedLocation);
    if (allotted.length > 0) {
      const match = allotted.some((c) => c.name === selectedCentre);
      if (!match) {
        const rec = allotted.find((c) => c.recommended) || allotted[0];
        setSelectedCentre(rec.name);
      }
    }
  }, [selectedLocation, selectedCentre]);

  const [selectedSlot, setSelectedSlot] = useState("10:30 AM");

  const [loading, setLoading] = useState(false);
  const [smartRec, setSmartRec] = useState<SmartRecommendation | null>(null);

  // Live recommendation engine query
  useEffect(() => {
    let isMounted = true;
    const fetchRec = async () => {
      try {
        const res = await fetch("/api/recommendations/smart-centre", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop: cropsList[0]?.crop || "Wheat",
            quantity: totalQuantity || 30,
            preferredSlot: selectedSlot,
            location: selectedLocation,
          }),
        });
        const data = await res.json();
        if (data.success && isMounted) {
          setSmartRec(data);
        }
      } catch (err) {
        console.warn("Could not fetch recommendation:", err);
      }
    };

    const timer = setTimeout(fetchRec, 600);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cropsList, totalQuantity, selectedSlot, selectedLocation]);

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  useEffect(() => {
    const farmer = getFarmerSession();

    if (!farmer) {
      router.replace("/farmer/login");
      return;
    }

    if (farmer.district) {
      const matchedLoc = LOCATIONS_DATA.find(
        (l) => l.name.toLowerCase() === farmer.district?.toLowerCase()
      );
      if (matchedLoc) {
        setSelectedLocation(matchedLoc.name);
      }
    }

    const timer = setTimeout(() => {
      setCheckingAuth(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const selectedCentreData = useMemo(() => {
    return (
      availableCentres.find((centre) => centre.name === selectedCentre) ||
      PROCUREMENT_CENTRES.find((centre) => centre.name === selectedCentre) ||
      availableCentres[0]
    );
  }, [availableCentres, selectedCentre]);

  // ============================================================
  // TOMORROW DATE
  // ============================================================

  const getTomorrowDate = () => {
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    return tomorrow.toISOString().split("T")[0];
  };

  // ============================================================
  // CONFIRM BOOKING
  // ============================================================

  const handleConfirm = () => {
    // ----------------------------------------------------------
    // GET CURRENT FARMER
    // ----------------------------------------------------------

    const farmer = getFarmerSession();

    if (!farmer) {
      alert("Your farmer session has expired. Please login again.");
      router.replace("/farmer/login");
      return;
    }

    // ----------------------------------------------------------
    // IMPORTANT
    //
    // Our FarmerUser type uses farmerId.
    //
    // Do NOT use:
    // farmer?.id
    // farmer?.userId
    //
    // ----------------------------------------------------------

    const farmerId = farmer.farmerId;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    const validCrops = cropsList.filter(
      (c) => c.crop && Number(c.quantity) > 0
    );

    if (validCrops.length === 0) {
      alert("Please enter a valid quantity for at least one crop.");
      return;
    }

    if (!date) {
      alert("Please select a procurement date.");
      return;
    }

    if (!selectedCentre) {
      alert("Please select a procurement centre.");
      return;
    }

    if (!selectedSlot) {
      alert("Please select a time slot.");
      return;
    }

    setLoading(true);

    // ==========================================================
    // MULTI-CROP PAYLOAD CONSTRUCTION
    // ==========================================================

    const cropsPayload: BookingCropItem[] = validCrops.map((c) => {
      const mspData = getCropMspData(c.crop);
      const qty = Number(c.quantity);
      return {
        crop: c.crop,
        quantity: qty,
        mspRate: mspData.standardMsp,
        totalPayout: qty * mspData.standardMsp,
      };
    });

    const combinedCrop = validCrops.map((c) => c.crop).join(" + ");
    const totalQty = validCrops.reduce((sum, c) => sum + Number(c.quantity), 0);

    // ==========================================================
    // GENERATE GUARANTEED UNIQUE TOKEN
    // ==========================================================

    const existingQueue = getStoredQueue();
    const { tokenNumber, token } = generateUniqueToken({
      location: selectedLocation,
      centre: selectedCentre,
      existingBookings: existingQueue,
    });

    // ==========================================================
    // SELECTED SLOT DATA
    // ==========================================================

    const selectedSlotData = slots.find(
      (slot) => slot.shortTime === selectedSlot
    );

    // ==========================================================
    // CREATE BOOKING
    // ==========================================================

    const booking = {
      bookingId: `BOOK-${Date.now()}`,

      // --------------------------------------------------------
      // FARMER INFORMATION
      // --------------------------------------------------------

      farmerId: farmerId,

      farmerName: farmer.name,

      farmerMobile: farmer.mobile,

      // --------------------------------------------------------
      // TOKEN
      // --------------------------------------------------------

      tokenNumber,

      token,

      // --------------------------------------------------------
      // PROCUREMENT DETAILS
      // --------------------------------------------------------

      crop: combinedCrop,

      quantity: totalQty,

      crops: cropsPayload,

      date,

      location: selectedLocation,

      centre: selectedCentre,

      centreId: selectedCentreData?.id,

      distance: selectedCentreData?.distance ?? "",

      time: selectedSlot,

      fullTime:
        selectedSlotData?.time ??
        `${selectedSlot} – ${selectedSlot}`,

      availableSlots: selectedSlotData?.available ?? 0,

      // --------------------------------------------------------
      // QUEUE INFORMATION
      // --------------------------------------------------------

      queuePosition: existingQueue.length + 1,

      waitTime: selectedCentreData?.baseWaitMinutes ?? 20,

      // --------------------------------------------------------
      // STATUS
      // --------------------------------------------------------

      status: "WAITING" as const,

      queueStatus: "WAITING",

      procurementStatus: "WAITING",

      calledAt: null,

      processingStartedAt: null,

      completedAt: null,

      verifiedBy: null,

      // --------------------------------------------------------
      // ARRIVAL
      // --------------------------------------------------------

      arrivalTime: calculateArrivalTime(selectedSlot),

      // --------------------------------------------------------
      // TIMESTAMPS
      // --------------------------------------------------------

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    // ==========================================================
    // 1. SAVE CURRENT FARMER BOOKING
    // ==========================================================

    localStorage.setItem(
      "smartProcurementBooking",
      JSON.stringify(booking)
    );

    // ==========================================================
    // 2. SAVE BOOKING HISTORY
    // ==========================================================

    const existingHistoryRaw = localStorage.getItem(
      "smartProcurementHistory"
    );

    let history: Booking[] = [];

    if (existingHistoryRaw) {
      try {
        const parsedHistory = JSON.parse(existingHistoryRaw);

        if (Array.isArray(parsedHistory)) {
          history = parsedHistory;
        }
      } catch {
        history = [];
      }
    }

    history = history.filter(
      (item) => item?.bookingId !== booking.bookingId
    );

    history.unshift(booking as Booking);

    localStorage.setItem(
      "smartProcurementHistory",
      JSON.stringify(history.slice(0, 10))
    );

    // ==========================================================
    // 3. ADD TO OFFICIAL QUEUE
    // ==========================================================

    let queue = getStoredQueue().filter(
      (item) => item?.bookingId !== booking.bookingId
    );

    queue.push(booking);

    queue = queue.map((item, index) => ({
      ...item,
      queuePosition: index + 1,
      updatedAt: new Date().toISOString(),
    }));

    saveStoredQueue(queue);

    // ==========================================================
    // 4. UPDATE CURRENT BOOKING WITH QUEUE POSITION
    // ==========================================================

    const finalBooking = {
      ...booking,
      queuePosition:
        queue.findIndex(
          (item) => item?.bookingId === booking.bookingId
        ) + 1,
      updatedAt: new Date().toISOString(),
    };

    saveStoredCurrentBooking(finalBooking);

    // ==========================================================
    // 5. UPDATE HISTORY COPY
    // ==========================================================

    const updatedHistory = history.map((item) =>
      item?.bookingId === booking.bookingId
        ? finalBooking
        : item
    );

    localStorage.setItem(
      "smartProcurementHistory",
      JSON.stringify(updatedHistory.slice(0, 10))
    );

    // Sync booking with server so official dashboard sees it across all devices & tabs
    try {
      fetch("/api/official/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBooking),
      }).catch(() => {});
    } catch {}

    // ==========================================================
    // 6. NOTIFY OTHER TABS / COMPONENTS
    // ==========================================================

    window.dispatchEvent(
      new Event("smartProcurementQueueUpdated")
    );

    window.dispatchEvent(
      new Event("smartProcurementBookingUpdated")
    );

    // ==========================================================
    // 7. GO TO CONFIRMATION
    // ==========================================================

    setTimeout(() => {
      router.push("/farmer/booking/confirmation");
    }, 500);
  };

  // ============================================================
  // AUTH CHECK SCREEN
  // ============================================================

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9F5]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
            <Sprout className="h-7 w-7 animate-pulse text-[#2E7D32]" />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-600">
            {t("common.loading")}
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-[#F7F9F5] text-[#111827]">
      {/* HEADER */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => router.push("/farmer/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-[#2E7D32]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </button>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <div className="flex items-center gap-2 font-semibold text-[#2E7D32]">
              <BrandLogo size="xs" />
              {t("common.appName")}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {/* TITLE */}

          <div>
            <p className="text-sm font-medium text-[#2E7D32]">
              {t("auth.farmerPortal")}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">
              {t("booking.title")}
            </h1>

            <p className="mt-2 text-base text-gray-600">
              {t("booking.subtitle")}
            </p>
          </div>

          {/* DETAILS + CENTRES */}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* SMART RECOMMENDATION BANNER */}
            {smartRec && (
              <div className="lg:col-span-2 rounded-3xl border-2 border-[#2E7D32]/30 bg-gradient-to-br from-[#E8F5E9]/80 via-white to-[#F1F8F2] p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E7D32] text-white">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                        {t("booking.aiRecommendation")}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">
                        {t("booking.recommendedTitle", { centre: smartRec.bestCentre.name })}
                      </h3>
                    </div>
                  </div>

                  {smartRec.timeSavedMinutes > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                      ⚡ {t("booking.timeSaved", { mins: smartRec.timeSavedMinutes })}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-4 rounded-2xl border border-gray-200/80 bg-white/80 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("booking.optimalCentre")}</p>
                    <p className="mt-1 font-bold text-gray-900">{smartRec.bestCentre.name}</p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      {smartRec.bestCentre.distanceKm} {t("booking.kmAway")} • {smartRec.bestCentre.baysAvailable} {t("booking.baysActive")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("booking.suggestedSlot")}</p>
                    <p className="mt-1 font-bold text-gray-900">{smartRec.recommendedSlot.timeWindow}</p>
                    <p className="mt-0.5 text-xs text-[#2E7D32] font-semibold">
                      {t("booking.slotsAvailable", { count: smartRec.recommendedSlot.availableSeats })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("booking.estimatedWaitTime")}</p>
                    <p className="mt-1 text-xl font-bold text-[#2E7D32]">~{smartRec.bestCentre.estimatedWaitMinutes} {t("common.minutes")}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{t("booking.liveQueueCount", { count: smartRec.bestCentre.activeQueueCount })}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-gray-600 italic">
                    💡 {smartRec.reasoning}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCentre(smartRec.bestCentre.name);
                      setSelectedSlot(smartRec.recommendedSlot.shortTime);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#256428]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("booking.applyRecommendation")}
                  </button>
                </div>
              </div>
            )}

            {/* PROCUREMENT DETAILS */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-[#111827]">
                  {t("booking.step1Title")}
                </h2>
                <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#2E7D32]">
                  {t("booking.cropsList") || "Crops to Sell"} ({cropsList.length}/3)
                </span>
              </div>

              {/* SINGLE TOKEN INFO NOTICE */}
              <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-900">
                <Coins className="h-4 w-4 shrink-0 text-[#2E7D32]" />
                <span>{t("booking.singleTokenNotice") || "All crops will be processed under the same Smart Token number."}</span>
              </div>

              {/* CROPS LIST */}
              <div className="mt-5 space-y-5">
                {cropsList.map((item, index) => {
                  const mspInfo = getCropMspData(item.crop);
                  const itemQty = Number(item.quantity) || 0;
                  const itemPayout = itemQty * mspInfo.standardMsp;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5 transition hover:border-gray-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2E7D32] text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {t("booking.cropItemTitle", { index: String(index + 1) }) || `Crop #${index + 1}`}
                          </span>
                        </div>

                        {cropsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCrop(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("booking.removeCropBtn") || "Remove"}
                          </button>
                        )}
                      </div>

                      {/* CROP SELECTOR */}
                      <div className="mt-3.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-700">
                            {t("booking.cropLabel")}
                          </label>
                          <span className="text-xs font-bold text-[#2E7D32]">
                            {t("booking.baseMspLabel", { msp: mspInfo.standardMsp.toLocaleString("en-IN") })}
                          </span>
                        </div>

                        <div className="relative mt-1.5">
                          <Wheat className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2E7D32]" />
                          <select
                            value={item.crop}
                            onChange={(e) => handleUpdateCrop(item.id, "crop", e.target.value)}
                            className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 py-3 pl-10 text-sm font-bold text-gray-900 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                          >
                            {CROP_MSP_RATES.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name} ({c.nameHi}) — ₹{c.standardMsp.toLocaleString("en-IN")} / quintal
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* QUANTITY INPUT */}
                      <div className="mt-3">
                        <label className="text-xs font-semibold text-gray-700">
                          {t("booking.quantityLabel")} ({item.crop})
                        </label>
                        <div className="mt-1.5 flex overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-[#2E7D32] focus-within:ring-2 focus-within:ring-[#2E7D32]/10">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateCrop(item.id, "quantity", e.target.value)}
                            placeholder={t("booking.quantityPlaceholder")}
                            className="w-full bg-transparent px-3.5 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
                          />
                          <div className="flex items-center border-l border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-600">
                            {t("common.quintals")}
                          </div>
                        </div>
                      </div>

                      {/* INDIVIDUAL CROP PAYOUT PREVIEW */}
                      {itemQty > 0 && (
                        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs border border-gray-200/80">
                          <span className="text-gray-600">{item.crop} Payout:</span>
                          <span className="font-extrabold text-[#2E7D32]">
                            {itemQty} qtl × ₹{mspInfo.standardMsp.toLocaleString("en-IN")} = {formatINR(itemPayout)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ADD ANOTHER CROP BUTTON */}
              {cropsList.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddCrop}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#2E7D32]/50 bg-[#E8F5E9]/50 py-3 text-xs sm:text-sm font-bold text-[#2E7D32] hover:bg-[#E8F5E9] transition"
                >
                  <Plus className="h-4 w-4" />
                  {t("booking.addCropBtn") || "Add Another Crop"} ({cropsList.length}/3)
                </button>
              )}

              {/* COMBINED TOTAL SUMMARY CARD */}
              <div className="mt-5 rounded-2xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between border-b border-[#CDE8D0] pb-2 font-bold text-gray-800">
                  <span>{t("booking.totalCombinedQuantity") || "Total Combined Quantity"}:</span>
                  <span className="text-base font-black text-[#2E7D32]">{totalQuantity} {t("common.quintals")}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-bold text-gray-800">{t("booking.totalEstimatedPayout") || "Total Combined Payout"}:</span>
                  <span className="text-lg font-black text-[#2E7D32]">{formatINR(totalEstimatedPayout)}</span>
                </div>
                <p className="mt-2 text-[11px] text-gray-600">
                  {cropsList.map((c) => `${c.crop} (${c.quantity || 0} qtl)`).join(" + ")}
                </p>
              </div>

              {/* DATE */}
              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-800">
                  {t("booking.procurementDate")}
                </label>

                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                  <input
                    type="date"
                    min={getTomorrowDate()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 pl-12 text-base font-medium text-black outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  />
                </div>
              </div>
            </div>

            {/* LOCATION & CENTRES */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">
                    {t("booking.step2Title")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("booking.step2Subtitle")}
                  </p>
                </div>
                <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#2E7D32]">
                  {t("booking.locationsAvailable", { count: LOCATIONS_DATA.length })}
                </span>
              </div>

              {/* LOCATION SELECTOR */}
              <div className="mt-5">
                <label className="text-sm font-semibold text-gray-800">
                  {t("booking.selectLocation")}
                </label>
                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 pl-12 pr-10 text-base font-semibold text-gray-900 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  >
                    {LOCATIONS_DATA.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.state}) — {t("booking.centresAllotted", { count: loc.centresCount })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ALLOTTED CENTRES */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {t("booking.allottedCentresFor", { location: selectedLocation, count: availableCentres.length })}
                  </label>
                  <span className="text-xs text-gray-500">
                    {t("booking.showingTerminals")}
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  {availableCentres.map((centre) => {
                    const selected = selectedCentre === centre.name;

                    return (
                      <button
                        key={centre.id}
                        type="button"
                        onClick={() => setSelectedCentre(centre.name)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-[#2E7D32] bg-[#F1F8F2] shadow-sm ring-1 ring-[#2E7D32]"
                            : "border-gray-200 bg-white hover:border-[#9CCC9F]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            selected ? "bg-[#2E7D32] text-white" : "bg-[#E8F5E9] text-[#2E7D32]"
                          }`}>
                            <MapPin className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-bold text-gray-900">
                                {centre.name}
                              </p>

                              {centre.recommended && (
                                <span className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-bold text-[#2E7D32]">
                                  {t("booking.recommendedBadge")}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              {centre.distance} • {centre.location}, {centre.state}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                              <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-700">
                                {t("booking.bays")}: <strong className="text-gray-900">{centre.bays}</strong>
                              </span>

                              <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800">
                                {t("booking.estWait")}: <strong className="text-emerald-900">~{centre.baseWaitMinutes} {t("common.minutes")}</strong>
                              </span>

                              {centre.contactNumber && (
                                <span className="text-gray-500">
                                  📞 {centre.contactNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* TIME SLOTS */}

          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-[#2E7D32]" />

              <div>
                <h2 className="text-xl font-bold">
                  {t("booking.step3Title")}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {t("booking.step3Subtitle")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {slots.map((slot) => {
                const full = slot.available === 0;

                const selected =
                  selectedSlot === slot.shortTime;

                return (
                  <button
                    key={slot.time}
                    disabled={full}
                    onClick={() =>
                      setSelectedSlot(slot.shortTime)
                    }
                    className={`min-h-[105px] rounded-2xl border p-4 text-left transition ${
                      full
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        : selected
                        ? "border-[#2E7D32] bg-[#E8F5E9]"
                        : "border-gray-200 bg-white hover:border-[#9CCC9F]"
                    }`}
                  >
                    <p
                      className={`text-sm font-bold ${
                        full
                          ? "text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {slot.time}
                    </p>

                    <p
                      className={`mt-4 text-sm ${
                        full
                          ? "text-gray-400"
                          : "text-[#2E7D32]"
                      }`}
                    >
                      {full
                        ? t("booking.noSlots")
                        : t("booking.slotsAvailable", { count: slot.available })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SMART RECOMMENDATION */}

          <div className="mt-6 rounded-2xl border border-[#FDE7C2] bg-[#FFF9EF] p-5">
            <p className="font-semibold text-[#92400E]">
              {t("booking.aiRecommendation")}
            </p>

            <p className="mt-1 text-sm leading-6 text-[#A16207]">
              {t("booking.recDescription", { centre: selectedCentreData?.name || "" })}
            </p>
          </div>

          {/* CONFIRM BUTTON */}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E7D32] px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? t("booking.bookingInProgress")
              : t("booking.confirmBooking")}

            {!loading && (
              <ArrowRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </section>
    </main>
  );
}

/* ==============================================================
   CALCULATE ARRIVAL TIME
   ============================================================== */

function calculateArrivalTime(slot: string) {
  const match = slot.match(
    /(\d{1,2}):?(\d{0,2})?\s?(AM|PM)/i
  );

  if (!match) {
    return slot;
  }

  let hour = Number(match[1]);

  const minute = Number(match[2] || 0);

  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  let totalMinutes =
    hour * 60 + minute - 10;

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  let finalHour = Math.floor(totalMinutes / 60);

  const finalMinute = totalMinutes % 60;

  const finalPeriod =
    finalHour >= 12 ? "PM" : "AM";

  if (finalHour === 0) {
    finalHour = 12;
  } else if (finalHour > 12) {
    finalHour -= 12;
  }

  return `${finalHour}:${String(finalMinute).padStart(
    2,
    "0"
  )} ${finalPeriod}`;
}