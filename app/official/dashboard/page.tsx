"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Sprout,
  Ticket,
  Users,
  Wheat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type Status =
  | "WAITING"
  | "VERIFIED"
  | "PROCESSING"
  | "COMPLETED"
  | "CALLED"
  | "CANCELLED";

function StatusBadge({ status }: { status: Status }) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1.5 text-xs font-bold text-[#2E7D32]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        VERIFIED
      </span>
    );
  }

  if (status === "PROCESSING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
        <PackageCheck className="h-3.5 w-3.5" />
        PROCESSING
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1.5 text-xs font-bold text-[#2E7D32]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        COMPLETED
      </span>
    );
  }

  if (status === "CALLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
        <Ticket className="h-3.5 w-3.5" />
        CALLED
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
        CANCELLED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8E1] px-3 py-1.5 text-xs font-bold text-[#A16207]">
      <Clock3 className="h-3.5 w-3.5" />
      WAITING
    </span>
  );
}

export default function OfficialDashboardPage() {
  const router = useRouter();

  const [queue, setQueue] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD QUEUE (FROM LOCAL STORAGE & LIVE BACKEND API)
  // ============================================================

  const loadQueue = useCallback(() => {
    // 1. Immediately display localStorage queue if present
    try {
      const savedQueue = localStorage.getItem("smartProcurementQueue");
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQueue(parsed);
        }
      }
    } catch {}

    // 2. Fetch live server queue (for cross-device & cross-tab sync)
    fetch("/api/official/queue")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.queue)) {
          setQueue((prev) => {
            const map = new Map<string, Booking>();
            const prevMap = new Map<string, Booking>();
            prev.forEach((b: Booking) => {
              const key = (b.bookingId || b.token || "").toUpperCase();
              if (key) prevMap.set(key, b);
            });

            data.queue.forEach((serverItem: Booking) => {
              const key = (serverItem.bookingId || serverItem.token || "").toUpperCase();
              if (!key) return;
              const localItem = prevMap.get(key);
              if (localItem) {
                const localTime = new Date(localItem.updatedAt || 0).getTime();
                const serverTime = new Date(serverItem.updatedAt || 0).getTime();
                if (localTime > serverTime) {
                  map.set(key, localItem);
                  fetch("/api/official/queue", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(localItem),
                  }).catch(() => {});
                  return;
                }
              }
              map.set(key, serverItem);
            });

            prevMap.forEach((localItem, key) => {
              if (!map.has(key)) {
                map.set(key, localItem);
              }
            });

            const merged = Array.from(map.values());
            const finalResult = merged.length > 0 ? merged : data.queue;
            try {
              localStorage.setItem("smartProcurementQueue", JSON.stringify(finalResult));
            } catch {}
            return finalResult;
          });
        }
      })
      .catch((err) => console.warn("Live queue fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // ============================================================
  // REAL-TIME POLLING (AUTO-REFRESH EVERY 3 SECONDS)
  // ============================================================

  useEffect(() => {
    loadQueue();

    // Auto-poll every 3 seconds so farmer bookings show up without refreshing
    const pollTimer = setInterval(() => {
      loadQueue();
    }, 3000);

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "smartProcurementQueue" ||
        event.key === "smartProcurementBooking" ||
        event.key === "smartProcurementHistory"
      ) {
        loadQueue();
      }
    };

    const handleQueueUpdate = () => {
      loadQueue();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("smartProcurementQueueUpdated", handleQueueUpdate);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("smartProcurementQueueUpdated", handleQueueUpdate);
    };
  }, [loadQueue]);


  const getStatus = (
    booking: Booking
  ): Status => {
    const rawStatus = String(
      booking.procurementStatus ??
        booking.queueStatus ??
        booking.status ??
        "WAITING"
    ).toUpperCase();

    if (rawStatus.includes("CANCEL")) {
      return "CANCELLED";
    }

    if (rawStatus.includes("COMPLETED")) {
      return "COMPLETED";
    }

    if (rawStatus.includes("PROCESSING")) {
      return "PROCESSING";
    }

    if (rawStatus.includes("CALLED")) {
      return "CALLED";
    }

    if (rawStatus.includes("VERIFIED")) {
      return "VERIFIED";
    }

    return "WAITING";
  };

  // ============================================================
  // ACTIVE FARMERS
  // ============================================================

  const activeQueue = useMemo(() => {
    return queue.filter((booking) => {
      const status = getStatus(booking);

      return (
        status !== "COMPLETED" &&
        status !== "CANCELLED"
      );
    });
  }, [queue]);

  // ============================================================
  // CURRENT FARMER
  //
  // IMPORTANT:
  // VERIFIED farmer can be current.
  // But WAITING farmer must NOT become VERIFIED automatically.
  // ============================================================

  const currentFarmer = useMemo(() => {
    if (activeQueue.length === 0) {
      return null;
    }

    const verified = activeQueue.find(
      (booking) =>
        getStatus(booking) === "VERIFIED"
    );

    if (verified) {
      return verified;
    }

    const processing = activeQueue.find(
      (booking) =>
        getStatus(booking) === "PROCESSING"
    );

    if (processing) {
      return processing;
    }

    const called = activeQueue.find(
      (booking) =>
        getStatus(booking) === "CALLED"
    );

    if (called) {
      return called;
    }

    return activeQueue[0];
  }, [activeQueue]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const farmersWaiting = useMemo(() => {
    return queue.filter(
      (booking) =>
        getStatus(booking) === "WAITING"
    ).length;
  }, [queue]);

  const processedToday = useMemo(() => {
    return queue.filter((booking) => {
      const status = getStatus(booking);

      return (
        status === "VERIFIED" ||
        status === "PROCESSING" ||
        status === "COMPLETED" ||
        status === "CALLED"
      );
    }).length;
  }, [queue]);

  const completedToday = useMemo(() => {
    return queue.filter(
      (booking) =>
        getStatus(booking) === "COMPLETED"
    ).length;
  }, [queue]);

  const averageWait = useMemo(() => {
    const waitTimes = queue
      .map((booking) => booking.waitTime)
      .filter(
        (value): value is number =>
          typeof value === "number" &&
          value > 0
      );

    if (waitTimes.length === 0) {
      return 0;
    }

    const total = waitTimes.reduce(
      (sum, value) => sum + value,
      0
    );

    return Math.round(
      total / waitTimes.length
    );
  }, [queue]);

  // ============================================================
  // VERIFY FARMER
  //
  // VERY IMPORTANT:
  //
  // DO NOT modify localStorage here.
  // DO NOT set status to VERIFIED here.
  //
  // This button ONLY opens the verification page.
  // ============================================================

  const handleVerifyFarmer = (
    booking: Booking
  ) => {
    if (!booking.token) {
      alert(
        "This farmer does not have a valid token."
      );
      return;
    }

    router.push(
      `/official/verify?token=${encodeURIComponent(
        booking.token
      )}`
    );
  };

  // ============================================================
  // OPEN PROCUREMENT
  // ============================================================

  const handleOpenProcurement = (
    booking: Booking
  ) => {
    if (!booking.token) {
      alert(
        "This farmer does not have a valid token."
      );
      return;
    }

    router.push(
      `/official/procurement?token=${encodeURIComponent(
        booking.token
      )}`
    );
  };

  // ============================================================
  // CALL FARMER
  // ============================================================

  const handleCallFarmer = (
    booking: Booking
  ) => {
    if (!booking.token) {
      return;
    }

    try {
      const savedQueue =
        localStorage.getItem(
          "smartProcurementQueue"
        );

      if (!savedQueue) {
        return;
      }

      const existingQueue: Booking[] =
        JSON.parse(savedQueue);

      const now =
        new Date().toISOString();

      const updatedQueue =
        existingQueue.map((item) => {
          const sameBooking =
            booking.bookingId &&
            item.bookingId ===
              booking.bookingId;

          const sameToken =
            item.token &&
            item.token.toUpperCase() ===
              booking.token?.toUpperCase();

          if (
            !sameBooking &&
            !sameToken
          ) {
            return item;
          }

          return {
            ...item,

            status: "CALLED",

            queueStatus: "CALLED",

            procurementStatus: "CALLED",

            calledAt: now,

            updatedAt: now,
          };
        });

      localStorage.setItem(
        "smartProcurementQueue",
        JSON.stringify(updatedQueue)
      );

      setQueue(updatedQueue);

      // Update current booking in localStorage if matched
      try {
        const currentBookingData = localStorage.getItem("smartProcurementBooking");
        if (currentBookingData) {
          const currentBooking: Booking = JSON.parse(currentBookingData);
          const sameBooking = booking.bookingId && currentBooking.bookingId === booking.bookingId;
          const sameToken = booking.token && currentBooking.token && booking.token.toUpperCase() === currentBooking.token.toUpperCase();
          if (sameBooking || sameToken) {
            localStorage.setItem("smartProcurementBooking", JSON.stringify({
              ...currentBooking,
              status: "CALLED",
              queueStatus: "CALLED",
              procurementStatus: "CALLED",
              calledAt: now,
              updatedAt: now,
            }));
          }
        }
      } catch {}

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

      // Sync CALLED status to server
      const identifier = booking.bookingId || booking.token || "";
      if (identifier) {
        fetch(`/api/official/queue/${encodeURIComponent(identifier)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CALLED" }),
        }).catch(() => {});
      }

      fetch("/api/official/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...booking,
          status: "CALLED",
          queueStatus: "CALLED",
          procurementStatus: "CALLED",
          calledAt: now,
          updatedAt: now,
        }),
      }).catch(() => {});

      router.push(
        `/official/procurement?token=${encodeURIComponent(
          booking.token
        )}`
      );
    } catch (error) {
      console.error(
        "Unable to call farmer:",
        error
      );

      alert(
        "Unable to call farmer."
      );
    }
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
            Loading official dashboard...
          </p>
        </div>
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

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          <button
            onClick={() =>
              router.push(
                "/official/dashboard"
              )
            }
            className="flex items-center gap-2 font-bold text-[#2E7D32]"
          >
            <Sprout className="h-6 w-6" />

            Smart Procurement
          </button>

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-xs text-gray-500">
                Logged in as
              </p>

              <p className="text-sm font-bold text-gray-900">
                Procurement Officer
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/official/login")
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:text-red-600"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        {/* ====================================================
            PAGE TITLE
            ==================================================== */}

        <div className="mb-7">

          <p className="text-sm font-semibold text-[#2E7D32]">
            Official Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Procurement Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor farmers, verify tokens and manage
            procurement at your centre.
          </p>

        </div>

        {/* ====================================================
            CENTRE STATUS
            ==================================================== */}

        <div className="overflow-hidden rounded-[30px] bg-[#2E7D32] shadow-sm">

          <div className="flex flex-col justify-between gap-8 p-7 sm:flex-row sm:items-center sm:p-9">

            <div className="text-white">

              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
                CENTRE STATUS
              </div>

              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                Procurement is Active
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                Farmers with active tokens are currently
                being processed at this procurement centre.
              </p>

            </div>

            <div className="min-w-[185px] rounded-2xl bg-white/10 p-5">

              <p className="text-sm text-white/70">
                Current Token
              </p>

              <p className="mt-1 text-4xl font-bold text-white">
                {currentFarmer?.token ?? "—"}
              </p>

              <p className="mt-2 text-sm font-medium text-white/80">
                {currentFarmer
                  ? getStatus(currentFarmer)
                  : "NO ACTIVE TOKEN"}
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
            STATISTICS
            ==================================================== */}

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={
              <Users className="h-6 w-6 text-[#2E7D32]" />
            }
            label="Farmers Waiting"
            value={farmersWaiting}
            tag="LIVE"
          />

          <StatCard
            icon={
              <PackageCheck className="h-6 w-6 text-[#2E7D32]" />
            }
            label="Processed Today"
            value={processedToday}
            tag="TODAY"
          />

          <StatCard
            icon={
              <CheckCircle2 className="h-6 w-6 text-[#2E7D32]" />
            }
            label="Completed"
            value={completedToday}
            tag="TODAY"
          />

          <StatCard
            icon={
              <Clock3 className="h-6 w-6 text-[#2E7D32]" />
            }
            label="Average Wait"
            value={`${averageWait} min`}
            tag="ESTIMATE"
          />

        </div>

        {/* ====================================================
            QUEUE + CURRENT FARMER
            ==================================================== */}

        <div className="mt-8 grid gap-7 lg:grid-cols-[1.65fr_0.85fr]">

          {/* ==================================================
              LIVE QUEUE
              ================================================== */}

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6 sm:px-7">

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Live Farmer Queue
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Farmers currently waiting at the centre.
                </p>
              </div>

              <Ticket className="h-7 w-7 text-[#2E7D32]" />

            </div>

            {activeQueue.length === 0 ? (

              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
                  <Users className="h-7 w-7 text-[#2E7D32]" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  No active farmers
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  There are currently no farmers in the
                  procurement queue.
                </p>

              </div>

            ) : (

              <div>

                {activeQueue.map(
                  (booking, index) => {

                    const status =
                      getStatus(booking);

                    const isCurrent =
                      currentFarmer?.bookingId &&
                      booking.bookingId ===
                        currentFarmer.bookingId;

                    return (
                      <div
                        key={
                          booking.bookingId ??
                          `${booking.token}-${index}`
                        }
                        className={`border-b border-gray-100 px-6 py-6 last:border-b-0 sm:px-7 ${
                          isCurrent
                            ? "bg-[#F1F8F2]"
                            : "bg-white"
                        }`}
                      >

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                          {/* FARMER */}

                          <div className="flex min-w-0 items-center gap-4">

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E8F5E9] text-sm font-bold text-[#2E7D32]">
                              {booking.token ??
                                "—"}
                            </div>

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <h3 className="font-bold text-gray-900">
                                  {booking.farmerName ??
                                    "Farmer"}
                                </h3>

                                {isCurrent && (
                                  <span className="text-xs font-bold text-[#2E7D32]">
                                    CURRENT
                                  </span>
                                )}

                              </div>

                              <p className="mt-1 text-sm text-gray-600">
                                {booking.crop ??
                                  "Crop"}{" "}
                                •{" "}
                                {booking.quantity ??
                                  0}{" "}
                                Quintals
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                Slot:{" "}
                                {booking.fullTime ??
                                  booking.time ??
                                  "Not available"}
                              </p>

                            </div>

                          </div>

                          {/* ACTIONS */}

                          <div className="flex flex-wrap items-center gap-3">

                            <StatusBadge
                              status={status}
                            />

                            {/* =================================
                                WAITING
                                ================================= */}

                            {status ===
                              "WAITING" && (
                              <button
                                onClick={() =>
                                  handleVerifyFarmer(
                                    booking
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#256428]"
                              >
                                Verify Farmer

                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}

                            {/* =================================
                                VERIFIED
                                ================================= */}

                            {status ===
                              "VERIFIED" && (
                              <button
                                onClick={() =>
                                  handleCallFarmer(
                                    booking
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#256428]"
                              >
                                Call Farmer

                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}

                            {/* =================================
                                CALLED
                                ================================= */}

                            {status ===
                              "CALLED" && (
                              <button
                                onClick={() =>
                                  handleOpenProcurement(
                                    booking
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#256428]"
                              >
                                Open Procurement

                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}

                            {/* =================================
                                PROCESSING
                                ================================= */}

                            {status ===
                              "PROCESSING" && (
                              <button
                                onClick={() =>
                                  handleOpenProcurement(
                                    booking
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl border border-[#2E7D32] bg-white px-5 py-3 text-sm font-bold text-[#2E7D32] transition hover:bg-[#E8F5E9]"
                              >
                                View Procurement

                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

          {/* ==================================================
              CURRENT FARMER
              ================================================== */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                  Current Farmer
                </p>

                <h2 className="mt-2 text-4xl font-bold text-[#2E7D32]">
                  {currentFarmer?.token ??
                    "—"}
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
                <Users className="h-7 w-7 text-[#2E7D32]" />
              </div>

            </div>

            {currentFarmer ? (

              <div className="mt-7 rounded-2xl bg-gray-50 p-6">

                <p className="text-lg font-bold text-gray-900">
                  {currentFarmer.farmerName ??
                    "Farmer"}
                </p>

                <p className="mt-3 text-sm text-gray-600">
                  {currentFarmer.crop ??
                    "Crop"}{" "}
                  •{" "}
                  {currentFarmer.quantity ??
                    0}{" "}
                  Quintals
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Slot:{" "}
                  {currentFarmer.fullTime ??
                    currentFarmer.time ??
                    "Not available"}
                </p>

                <div className="mt-5">
                  <StatusBadge
                    status={getStatus(
                      currentFarmer
                    )}
                  />
                </div>

                {/* CURRENT FARMER ACTION */}

                {getStatus(
                  currentFarmer
                ) === "WAITING" && (
                  <button
                    onClick={() =>
                      handleVerifyFarmer(
                        currentFarmer
                      )
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#256428]"
                  >
                    Verify Farmer

                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {getStatus(
                  currentFarmer
                ) === "VERIFIED" && (
                  <button
                    onClick={() =>
                      handleCallFarmer(
                        currentFarmer
                      )
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#256428]"
                  >
                    Call Farmer

                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {getStatus(
                  currentFarmer
                ) === "CALLED" && (
                  <button
                    onClick={() =>
                      handleOpenProcurement(
                        currentFarmer
                      )
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#256428]"
                  >
                    Open Procurement

                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {getStatus(
                  currentFarmer
                ) === "PROCESSING" && (
                  <button
                    onClick={() =>
                      handleOpenProcurement(
                        currentFarmer
                      )
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#2E7D32] bg-white px-5 py-3.5 text-sm font-bold text-[#2E7D32] transition hover:bg-[#E8F5E9]"
                  >
                    View Procurement

                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

              </div>

            ) : (

              <div className="mt-7 rounded-2xl bg-gray-50 p-8 text-center">

                <Ticket className="mx-auto h-10 w-10 text-gray-400" />

                <p className="mt-3 text-sm font-medium text-gray-500">
                  No current farmer
                </p>

              </div>

            )}

          </div>

        </div>

        {/* ====================================================
            QUEUE INFORMATION
            ==================================================== */}

        <div className="mt-7 grid gap-5 md:grid-cols-3">

          <InfoBox
            icon={
              <Ticket className="h-5 w-5 text-[#2E7D32]" />
            }
            title="Smart Tokens"
            text="Each farmer receives a unique token for orderly procurement."
          />

          <InfoBox
            icon={
              <Wheat className="h-5 w-5 text-[#2E7D32]" />
            }
            title="Crop Procurement"
            text="View crop and quantity information before processing."
          />

          <InfoBox
            icon={
              <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
            }
            title="Verification"
            text="Verify farmer identity before calling them for procurement."
          />

        </div>

      </section>

    </main>
  );
}

// ================================================================
// STAT CARD
// ================================================================

function StatCard({
  icon,
  label,
  value,
  tag,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tag: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
          {icon}
        </div>

        <span className="text-sm font-medium text-gray-400">
          {tag}
        </span>

      </div>

      <p className="mt-7 text-base text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-4xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}

// ================================================================
// INFO BOX
// ================================================================

function InfoBox({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-gray-500">
        {text}
      </p>

    </div>
  );
}