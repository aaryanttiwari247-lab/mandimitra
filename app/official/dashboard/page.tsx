"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Layers,
  ListFilter,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  Sprout,
  Ticket,
  Users,
  Warehouse,
  Wheat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LOCATIONS_DATA,
  PROCUREMENT_CENTRES,
  getCentresByLocation,
  ProcurementCentre,
} from "@/lib/locations-centres";
import { broadcastProcurementUpdate, subscribeProcurementUpdates } from "@/lib/cross-tab-sync";

type Booking = {
  bookingId?: string;
  tokenNumber?: number;
  token?: string;

  farmerId?: string;
  farmerName?: string;
  farmerMobile?: string;

  crop?: string;
  cropGrade?: string;
  quantity?: number;

  date?: string;
  location?: string;
  centre?: string;
  centreId?: string;

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

  // Filter & View States
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [selectedCentre, setSelectedCentre] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [collapsedCentres, setCollapsedCentres] = useState<Record<string, boolean>>({});

  const toggleCentreCollapse = (centreId: string) => {
    setCollapsedCentres((prev) => ({
      ...prev,
      [centreId]: !prev[centreId],
    }));
  };

  const availableCentresForLocation = useMemo(() => {
    if (selectedLocation === "ALL") return PROCUREMENT_CENTRES;
    return getCentresByLocation(selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation !== "ALL" && selectedCentre !== "ALL") {
      const match = availableCentresForLocation.some(
        (c) => c.name.toLowerCase() === selectedCentre.toLowerCase()
      );
      if (!match) setSelectedCentre("ALL");
    }
  }, [selectedLocation, selectedCentre, availableCentresForLocation]);

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

    // 2. Fetch live server queue (READ-ONLY GET — no background POST loops)
    fetch("/api/official/queue")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.queue)) {
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
  // REAL-TIME POLLING (POLITE 10-SECOND REFRESH)
  // ============================================================

  useEffect(() => {
    loadQueue();

    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadQueue();
      }
    }, 10000);

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

    const unsubscribe = subscribeProcurementUpdates((msg) => {
      if (msg.type === "STATUS_UPDATED" || msg.type === "QUEUE_UPDATED" || msg.type === "BOOKING_CREATED") {
        loadQueue();
      }
    });

    return () => {
      clearInterval(pollTimer);
      unsubscribe();
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
  // FILTERED QUEUE (BY LOCATION, CENTRE, STATUS, SEARCH)
  // ============================================================

  const filteredQueue = useMemo(() => {
    return queue.filter((booking) => {
      // 1. Location filter
      if (selectedLocation !== "ALL") {
        const bLoc = (booking.location || "").toLowerCase().trim();
        const selLoc = selectedLocation.toLowerCase().trim();

        // If booking doesn't have location field, look up centre
        let matched = bLoc === selLoc || bLoc.includes(selLoc) || selLoc.includes(bLoc);
        if (!matched && booking.centre) {
          const centreObj = PROCUREMENT_CENTRES.find(
            (c) => c.name.toLowerCase() === booking.centre?.toLowerCase()
          );
          if (centreObj && centreObj.location.toLowerCase() === selLoc) {
            matched = true;
          }
        }
        if (!matched) return false;
      }

      // 2. Centre filter
      if (selectedCentre !== "ALL") {
        const selCentre = selectedCentre.toLowerCase().trim();
        const bCentre = (booking.centre || "").toLowerCase().trim();
        const bCentreId = (booking.centreId || "").toLowerCase().trim();
        const matched = bCentre === selCentre || bCentre.includes(selCentre) || bCentreId === selCentre;
        if (!matched) return false;
      }

      // 3. Status filter
      if (statusFilter !== "ALL") {
        if (getStatus(booking) !== statusFilter) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (booking.farmerName || "").toLowerCase().includes(q) ||
          (booking.token || "").toLowerCase().includes(q) ||
          (booking.farmerMobile || "").includes(q) ||
          (booking.crop || "").toLowerCase().includes(q) ||
          (booking.centre || "").toLowerCase().includes(q) ||
          (booking.location || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [queue, selectedLocation, selectedCentre, statusFilter, searchQuery]);

  // ============================================================
  // GROUPED BY ALLOTTED CENTRES
  // ============================================================

  const groupedCentres = useMemo(() => {
    const centresToDisplay =
      selectedCentre !== "ALL"
        ? availableCentresForLocation.filter(
            (c) => c.name.toLowerCase() === selectedCentre.toLowerCase()
          )
        : availableCentresForLocation;

    return centresToDisplay.map((centre) => {
      const centreFarmers = filteredQueue.filter((b) => {
        if (b.centreId && b.centreId === centre.id) return true;
        if (b.centre && (b.centre.toLowerCase() === centre.name.toLowerCase() || b.centre.toLowerCase().includes(centre.name.toLowerCase()))) {
          return true;
        }
        return false;
      });

      const activeFarmers = centreFarmers.filter((b) => {
        const s = getStatus(b);
        return s !== "COMPLETED" && s !== "CANCELLED";
      });

      const waiting = centreFarmers.filter((b) => getStatus(b) === "WAITING").length;
      const called = centreFarmers.filter((b) => getStatus(b) === "CALLED").length;
      const verified = centreFarmers.filter((b) => getStatus(b) === "VERIFIED").length;
      const processing = centreFarmers.filter((b) => getStatus(b) === "PROCESSING").length;
      const completed = centreFarmers.filter((b) => getStatus(b) === "COMPLETED").length;

      return {
        centre,
        farmers: centreFarmers,
        activeFarmers,
        counts: {
          total: centreFarmers.length,
          active: activeFarmers.length,
          waiting,
          called,
          verified,
          processing,
          completed,
        },
      };
    });
  }, [availableCentresForLocation, selectedCentre, filteredQueue]);

  // ============================================================
  // ACTIVE FARMERS
  // ============================================================

  const activeQueue = useMemo(() => {
    return filteredQueue.filter((booking) => {
      const status = getStatus(booking);

      return (
        status !== "COMPLETED" &&
        status !== "CANCELLED"
      );
    });
  }, [filteredQueue]);

  // ============================================================
  // CURRENT FARMER
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
    return filteredQueue.filter(
      (booking) =>
        getStatus(booking) === "WAITING"
    ).length;
  }, [filteredQueue]);

  const processedToday = useMemo(() => {
    return filteredQueue.filter((booking) => {
      const status = getStatus(booking);

      return (
        status === "VERIFIED" ||
        status === "PROCESSING" ||
        status === "COMPLETED" ||
        status === "CALLED"
      );
    }).length;
  }, [filteredQueue]);

  const completedToday = useMemo(() => {
    return filteredQueue.filter(
      (booking) =>
        getStatus(booking) === "COMPLETED"
    ).length;
  }, [filteredQueue]);

  const averageWait = useMemo(() => {
    const waitTimes = filteredQueue
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
  }, [filteredQueue]);

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

      // Real-time broadcast to farmer tabs
      broadcastProcurementUpdate({
        type: "STATUS_UPDATED",
        token: booking.token,
        bookingId: booking.bookingId,
        status: "CALLED",
        booking: {
          ...booking,
          status: "CALLED",
          queueStatus: "CALLED",
          procurementStatus: "CALLED",
          calledAt: now,
          updatedAt: now,
        } as any,
      });

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
            LOCATION & ALLOTTED CENTRES FILTER CONTROLS
            ==================================================== */}

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-[#2E7D32]" />
                  Allotted Procurement Centres & Yard Queue
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Select location or centre to monitor farmers divided by their allotted procurement yard.
                </p>
              </div>

              {/* VIEW MODE TOGGLE */}
              <div className="flex items-center rounded-xl bg-gray-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("grouped")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${
                    viewMode === "grouped"
                      ? "bg-[#2E7D32] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  Divided by Centre ({groupedCentres.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("flat")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${
                    viewMode === "flat"
                      ? "bg-[#2E7D32] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ListFilter className="h-4 w-4" />
                  Unified List ({filteredQueue.length})
                </button>
              </div>
            </div>

            {/* CONTROLS ROW */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* LOCATION SELECTOR */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Location / District ({LOCATIONS_DATA.length})
                </label>
                <div className="relative mt-1.5">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2E7D32]" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 pl-10 pr-8 text-sm font-semibold text-gray-900 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  >
                    <option value="ALL">All Locations (15 Districts)</option>
                    {LOCATIONS_DATA.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.state}) — {loc.centresCount} Centres
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ALLOTTED CENTRE SELECTOR */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Allotted Centre ({availableCentresForLocation.length})
                </label>
                <div className="relative mt-1.5">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2E7D32]" />
                  <select
                    value={selectedCentre}
                    onChange={(e) => setSelectedCentre(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 pl-10 pr-8 text-sm font-semibold text-gray-900 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  >
                    <option value="ALL">
                      All Centres ({availableCentresForLocation.length})
                    </option>
                    {availableCentresForLocation.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Search Farmer / Token
                </label>
                <div className="relative mt-1.5">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Token, Name, Mobile, Crop..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 pl-10 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  />
                </div>
              </div>
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
                Filter Status:
              </span>
              {[
                { id: "ALL", label: "All" },
                { id: "WAITING", label: "Waiting" },
                { id: "CALLED", label: "Called" },
                { id: "VERIFIED", label: "Verified" },
                { id: "PROCESSING", label: "Processing" },
                { id: "COMPLETED", label: "Completed" },
              ].map((pill) => {
                const count =
                  pill.id === "ALL"
                    ? queue.length
                    : queue.filter((b) => getStatus(b) === pill.id).length;
                const active = statusFilter === pill.id;

                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      active
                        ? "bg-[#2E7D32] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {pill.label} ({count})
                  </button>
                );
              })}

              {(selectedLocation !== "ALL" || selectedCentre !== "ALL" || statusFilter !== "ALL" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation("ALL");
                    setSelectedCentre("ALL");
                    setStatusFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="ml-auto text-xs font-bold text-red-600 hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================
            QUEUE + CURRENT FARMER
            ==================================================== */}

        <div className="mt-8 grid gap-7 lg:grid-cols-[1.65fr_0.85fr]">

          {/* ==================================================
              CENTRE-DIVIDED QUEUE OR FLAT LIST
              ================================================== */}

          <div className="space-y-6">
            {viewMode === "grouped" ? (
              // GROUPED BY ALLOTTED CENTRES VIEW
              groupedCentres.map((group) => {
                const isCollapsed = Boolean(collapsedCentres[group.centre.id]);

                return (
                  <div
                    key={group.centre.id}
                    className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                  >
                    {/* CENTRE HEADER */}
                    <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 via-white to-gray-50/50 p-6 sm:p-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E7D32] text-white shadow-sm">
                            <Warehouse className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {group.centre.name}
                              </h3>
                              <span className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-bold text-[#2E7D32]">
                                {group.centre.location}, {group.centre.state}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {group.centre.distance} • {group.centre.bays} Bays Capacity • Est. Wait ~{group.centre.baseWaitMinutes} min • 📞 {group.centre.contactNumber}
                            </p>
                          </div>
                        </div>

                        {/* CENTRE QUEUE STATS CHIPS & COLLAPSE */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                            Total: {group.counts.total}
                          </span>
                          <span className="rounded-xl bg-[#FFF8E1] px-2.5 py-1 text-xs font-bold text-[#A16207]">
                            Waiting: {group.counts.waiting}
                          </span>
                          <span className="rounded-xl bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#2E7D32]">
                            Verified: {group.counts.verified}
                          </span>
                          <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            Processing: {group.counts.processing}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleCentreCollapse(group.centre.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50"
                          >
                            {isCollapsed ? (
                              <>
                                Expand <ChevronDown className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                Collapse <ChevronUp className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* FARMERS IN THIS CENTRE */}
                    {!isCollapsed && (
                      <div>
                        {group.farmers.length === 0 ? (
                          <div className="p-8 text-center text-sm text-gray-500">
                            <Users className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 font-medium">No farmers currently registered for this centre matching active filters.</p>
                          </div>
                        ) : (
                          group.farmers.map((booking, index) => {
                            const status = getStatus(booking);
                            const isCurrent =
                              currentFarmer?.bookingId &&
                              booking.bookingId === currentFarmer.bookingId;

                            return (
                              <div
                                key={booking.bookingId ?? `${booking.token}-${index}`}
                                className={`border-b border-gray-100 px-6 py-5 last:border-b-0 sm:px-7 transition ${
                                  isCurrent ? "bg-[#F1F8F2]" : "bg-white hover:bg-gray-50/50"
                                }`}
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                  {/* FARMER INFO */}
                                  <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F5E9] text-sm font-bold text-[#2E7D32]">
                                      {booking.token ?? "—"}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-bold text-gray-900">
                                          {booking.farmerName ?? "Farmer"}
                                        </h4>
                                        {booking.farmerMobile && (
                                          <span className="text-xs text-gray-500">
                                            ({booking.farmerMobile})
                                          </span>
                                        )}
                                        {isCurrent && (
                                          <span className="text-xs font-bold text-[#2E7D32]">
                                            CURRENT
                                          </span>
                                        )}
                                      </div>

                                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                        <span className="font-semibold text-gray-900">
                                          {booking.crop ?? "Crop"}
                                        </span>
                                        {booking.cropGrade && (
                                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800">
                                            {booking.cropGrade}
                                          </span>
                                        )}
                                        <span>•</span>
                                        <span>
                                          <strong>{booking.quantity ?? 0}</strong> Quintals
                                        </span>
                                        <span>•</span>
                                        <span className="text-gray-500">
                                          Slot: {booking.fullTime ?? booking.time ?? "Regular"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ACTIONS */}
                                  <div className="flex flex-wrap items-center gap-3">
                                    <StatusBadge status={status} />

                                    {status === "WAITING" && (
                                      <button
                                        onClick={() => handleVerifyFarmer(booking)}
                                        className="flex items-center gap-1.5 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#256428]"
                                      >
                                        Verify Farmer
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </button>
                                    )}

                                    {status === "VERIFIED" && (
                                      <button
                                        onClick={() => handleCallFarmer(booking)}
                                        className="flex items-center gap-1.5 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#256428]"
                                      >
                                        Call Farmer
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </button>
                                    )}

                                    {status === "CALLED" && (
                                      <button
                                        onClick={() => handleOpenProcurement(booking)}
                                        className="flex items-center gap-1.5 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#256428]"
                                      >
                                        Open Procurement
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </button>
                                    )}

                                    {status === "PROCESSING" && (
                                      <button
                                        onClick={() => handleOpenProcurement(booking)}
                                        className="flex items-center gap-1.5 rounded-xl border border-[#2E7D32] bg-white px-4 py-2.5 text-xs font-bold text-[#2E7D32] transition hover:bg-[#E8F5E9]"
                                      >
                                        View Procurement
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // UNIFIED FLAT QUEUE LIST VIEW
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6 sm:px-7">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Live Farmer Queue
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Showing {filteredQueue.length} farmers across selected centres.
                    </p>
                  </div>
                  <Ticket className="h-7 w-7 text-[#2E7D32]" />
                </div>

                {filteredQueue.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
                      <Users className="h-7 w-7 text-[#2E7D32]" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-gray-900">
                      No active farmers found
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      No farmers match the current location, centre, or search filter.
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredQueue.map((booking, index) => {
                      const status = getStatus(booking);
                      const isCurrent =
                        currentFarmer?.bookingId &&
                        booking.bookingId === currentFarmer.bookingId;

                      return (
                        <div
                          key={booking.bookingId ?? `${booking.token}-${index}`}
                          className={`border-b border-gray-100 px-6 py-5 last:border-b-0 sm:px-7 ${
                            isCurrent ? "bg-[#F1F8F2]" : "bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F5E9] text-sm font-bold text-[#2E7D32]">
                                {booking.token ?? "—"}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-gray-900">
                                    {booking.farmerName ?? "Farmer"}
                                  </h4>
                                  {isCurrent && (
                                    <span className="text-xs font-bold text-[#2E7D32]">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-gray-600">
                                  {booking.crop ?? "Crop"} {booking.cropGrade ? `(${booking.cropGrade})` : ""} • {booking.quantity ?? 0} Quintals • Slot: {booking.fullTime ?? booking.time ?? "Regular"}
                                </p>
                                <p className="mt-0.5 text-xs text-[#2E7D32] font-semibold">
                                  📍 {booking.centre ?? "Centre"} ({booking.location ?? "Location"})
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <StatusBadge status={status} />

                              {status === "WAITING" && (
                                <button
                                  onClick={() => handleVerifyFarmer(booking)}
                                  className="flex items-center gap-1.5 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#256428]"
                                >
                                  Verify Farmer
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {status === "VERIFIED" && (
                                <button
                                  onClick={() => handleCallFarmer(booking)}
                                  className="flex items-center gap-1.5 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#256428]"
                                >
                                  Call Farmer
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {status === "CALLED" && (
                                <button
                                  onClick={() => handleOpenProcurement(booking)}
                                  className="flex items-center gap-1.5 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#256428]"
                                >
                                  Open Procurement
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {status === "PROCESSING" && (
                                <button
                                  onClick={() => handleOpenProcurement(booking)}
                                  className="flex items-center gap-1.5 rounded-xl border border-[#2E7D32] bg-white px-4 py-2.5 text-xs font-bold text-[#2E7D32] transition hover:bg-[#E8F5E9]"
                                >
                                  View Procurement
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  {currentFarmer.cropGrade ? `(${currentFarmer.cropGrade})` : ""} •{" "}
                  {currentFarmer.quantity ??
                    0}{" "}
                  Quintals
                </p>

                <p className="mt-1.5 text-xs font-semibold text-[#2E7D32]">
                  📍 {currentFarmer.centre ?? "Procurement Centre"} ({currentFarmer.location ?? "Yard"})
                </p>

                <p className="mt-1 text-xs text-gray-500">
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