"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  Sprout,
  Volume2,
  Wheat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";

import { getFarmerSession } from "@/lib/farmer-auth";
import { Booking } from "@/lib/types";


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

type Centre = {
  name: string;
  distance: string;
  farmers: number;
  wait: number;
  recommended?: boolean;
};

const centres: Centre[] = [
  {
    name: "Rampur Procurement Centre",
    distance: "2.0 km away",
    farmers: 87,
    wait: 95,
  },
  {
    name: "Lakshmipur Procurement Centre",
    distance: "4.7 km away",
    farmers: 19,
    wait: 24,
    recommended: true,
  },
  {
    name: "Shivpur Procurement Centre",
    distance: "6.2 km away",
    farmers: 41,
    wait: 48,
  },
];

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

  const [crop, setCrop] = useState("Cotton");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState("");

  const [selectedCentre, setSelectedCentre] = useState(
    "Lakshmipur Procurement Centre"
  );

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
            crop,
            quantity: Number(quantity) || 30,
            preferredSlot: selectedSlot,
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

    const timer = setTimeout(fetchRec, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [crop, quantity, selectedSlot]);

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  useEffect(() => {
    const farmer = getFarmerSession();

    if (!farmer) {
      router.replace("/farmer/login");
      return;
    }

    const timer = setTimeout(() => {
      setCheckingAuth(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const selectedCentreData = centres.find(
    (centre) => centre.name === selectedCentre
  );

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

    if (!crop) {
      alert("Please select a crop.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      alert("Please enter a valid quantity.");
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
    // GENERATE TOKEN
    // ==========================================================

    const previousBooking = localStorage.getItem(
      "smartProcurementBooking"
    );

    let tokenNumber = 103;

    if (previousBooking) {
      try {
        const previous = JSON.parse(previousBooking);

        if (previous.tokenNumber) {
          tokenNumber = Number(previous.tokenNumber) + 1;
        }
      } catch {
        tokenNumber = 103;
      }
    }

    // ----------------------------------------------------------
    // Also check queue so token numbers do not duplicate.
    // ----------------------------------------------------------

    const existingQueueRaw = localStorage.getItem(
      "smartProcurementQueue"
    );

    let existingQueue: Booking[] = [];

    if (existingQueueRaw) {
      try {
        const parsedQueue = JSON.parse(existingQueueRaw);

        if (Array.isArray(parsedQueue)) {
          existingQueue = parsedQueue;
        }
      } catch {
        existingQueue = [];
      }
    }

    const queueTokenNumbers = existingQueue
      .map((item) => Number(item?.tokenNumber))
      .filter((number) => !Number.isNaN(number));

    if (queueTokenNumbers.length > 0) {
      const highestToken = Math.max(...queueTokenNumbers);

      if (highestToken >= tokenNumber) {
        tokenNumber = highestToken + 1;
      }
    }

    if (tokenNumber > 999) {
      tokenNumber = 103;
    }

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

      token: `A${tokenNumber}`,

      // --------------------------------------------------------
      // PROCUREMENT DETAILS
      // --------------------------------------------------------

      crop,

      quantity: Number(quantity),

      date,

      centre: selectedCentre,

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

      waitTime: selectedCentreData?.wait ?? 24,

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

    const queueRaw = localStorage.getItem(
      "smartProcurementQueue"
    );

    let queue: Booking[] = [];

    if (queueRaw) {
      try {
        const parsedQueue = JSON.parse(queueRaw);

        if (Array.isArray(parsedQueue)) {
          queue = parsedQueue;
        }
      } catch {
        queue = [];
      }
    }

    // ----------------------------------------------------------
    // Prevent duplicate booking
    // ----------------------------------------------------------

    queue = queue.filter(
      (item) => item?.bookingId !== booking.bookingId
    );

    // ----------------------------------------------------------
    // Add new booking
    // ----------------------------------------------------------

    queue.push(booking);

    // ----------------------------------------------------------
    // Recalculate queue positions
    //
    // Keep existing official statuses.
    // ----------------------------------------------------------

    queue = queue.map((item, index) => ({
      ...item,

      queuePosition: index + 1,

      updatedAt: new Date().toISOString(),
    }));

    // ----------------------------------------------------------
    // Save queue
    // ----------------------------------------------------------

    localStorage.setItem(
      "smartProcurementQueue",
      JSON.stringify(queue)
    );

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

    localStorage.setItem(
      "smartProcurementBooking",
      JSON.stringify(finalBooking)
    );

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
            Checking your account...
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
            Back
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

      {/* MAIN */}

      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {/* TITLE */}

          <div>
            <p className="text-sm font-medium text-[#2E7D32]">
              Farmer Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">
              Book Procurement Slot
            </h1>

            <p className="mt-2 text-base text-gray-600">
              Choose your crop, quantity, procurement centre and preferred
              time slot.
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
                        Recommended: {smartRec.bestCentre.name}
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Optimal Centre</p>
                    <p className="mt-1 font-bold text-gray-900">{smartRec.bestCentre.name}</p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      {smartRec.bestCentre.distanceKm} km away • {smartRec.bestCentre.baysAvailable} bays active
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Timing Slot</p>
                    <p className="mt-1 font-bold text-gray-900">{smartRec.recommendedSlot.timeWindow}</p>
                    <p className="mt-0.5 text-xs text-[#2E7D32] font-semibold">
                      {smartRec.recommendedSlot.availableSeats} slots available
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dynamic Estimated Wait</p>
                    <p className="mt-1 text-xl font-bold text-[#2E7D32]">~{smartRec.bestCentre.estimatedWaitMinutes} mins</p>
                    <p className="mt-0.5 text-xs text-gray-500">Live queue: {smartRec.bestCentre.activeQueueCount} farmers</p>
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
              <h2 className="text-xl font-bold text-[#111827]">
                1. Procurement Details
              </h2>

              {/* CROP */}

              <div className="mt-7">
                <label className="text-sm font-semibold text-gray-800">
                  Crop
                </label>

                <div className="relative mt-2">
                  <Wheat className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]" />

                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 pl-12 text-base font-medium text-black outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  >
                    <option value="Cotton">Cotton</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Bajra">Bajra</option>
                    <option value="Barley">Barley</option>
                  </select>
                </div>
              </div>

              {/* QUANTITY */}

              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-800">
                  Expected Quantity
                </label>

                <div className="mt-2 flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-[#2E7D32] focus-within:ring-2 focus-within:ring-[#2E7D32]/10">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full bg-transparent px-4 py-3.5 text-base font-medium text-black placeholder:text-gray-500 outline-none"
                  />

                  <div className="flex items-center border-l border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700">
                    Quintals
                  </div>
                </div>
              </div>

              {/* DATE */}

              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-800">
                  Procurement Date
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

            {/* CENTRES */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-xl font-bold text-[#111827]">
                2. Choose Procurement Centre
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                We recommend centres with lower waiting time.
              </p>

              <div className="mt-5 space-y-3">
                {centres.map((centre) => {
                  const selected =
                    selectedCentre === centre.name;

                  return (
                    <button
                      key={centre.name}
                      onClick={() =>
                        setSelectedCentre(centre.name)
                      }
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[#2E7D32] bg-[#F1F8F2] shadow-sm"
                          : "border-gray-200 bg-white hover:border-[#9CCC9F]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">
                          <MapPin className="h-5 w-5 text-[#2E7D32]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-semibold text-gray-900">
                              {centre.name}
                            </p>

                            {centre.recommended && (
                              <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">
                                Recommended
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-gray-500">
                            {centre.distance}
                          </p>

                          <div className="mt-4 flex gap-5 text-sm">
                            <span>
                              <strong className="text-gray-900">
                                {centre.farmers}
                              </strong>{" "}
                              <span className="text-gray-500">
                                farmers
                              </span>
                            </span>

                            <span>
                              Wait{" "}
                              <strong className="text-gray-900">
                                ~{centre.wait} min
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TIME SLOTS */}

          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-[#2E7D32]" />

              <div>
                <h2 className="text-xl font-bold">
                  3. Select Time Slot
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Available slots for your selected centre.
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
                        ? "FULL"
                        : `${slot.available} slots available`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SMART RECOMMENDATION */}

          <div className="mt-6 rounded-2xl border border-[#FDE7C2] bg-[#FFF9EF] p-5">
            <p className="font-semibold text-[#92400E]">
              Smart Recommendation
            </p>

            <p className="mt-1 text-sm leading-6 text-[#A16207]">
              {selectedCentreData?.name} currently has the lowest estimated
              waiting time. We recommend the 10:30 AM – 11:00 AM slot.
            </p>
          </div>

          {/* CONFIRM BUTTON */}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E7D32] px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? "Generating Smart Token..."
              : "Confirm Procurement Slot"}

            {!loading && (
              <ArrowRight className="h-5 w-5" />
            )}
          </button>

          {/* VOICE */}

          <button
            onClick={() =>
              alert("Voice assistance will be connected later.")
            }
            className="mx-auto mt-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2E7D32] hover:text-[#2E7D32]"
          >
            <Volume2 className="h-4 w-4" />
            Listen / Voice Assistance
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