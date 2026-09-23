import { ProcurementCentre } from "./locations-centres";
import { Booking } from "./types";

export type SessionType = "ALL" | "MORNING" | "AFTERNOON";

export interface DynamicSlot {
  slotId: string;
  time: string; // e.g. "10:30 AM – 11:00 AM"
  shortTime: string; // e.g. "10:30 AM"
  session: "MORNING" | "AFTERNOON";
  maxCapacity: number;
  bookedCount: number;
  available: number;
  utilizationRate: number; // 0.0 to 1.0
  status: "AVAILABLE" | "FILLING_FAST" | "FULL";
}

export const STANDARD_MANDI_SLOTS = [
  // Morning Session (09:30 AM – 01:00 PM)
  { slotId: "s0930", time: "09:30 AM – 10:00 AM", shortTime: "09:30 AM", session: "MORNING" as const, peakMultiplier: 0.45 },
  { slotId: "s1000", time: "10:00 AM – 10:30 AM", shortTime: "10:00 AM", session: "MORNING" as const, peakMultiplier: 0.85 },
  { slotId: "s1030", time: "10:30 AM – 11:00 AM", shortTime: "10:30 AM", session: "MORNING" as const, peakMultiplier: 0.90 },
  { slotId: "s1100", time: "11:00 AM – 11:30 AM", shortTime: "11:00 AM", session: "MORNING" as const, peakMultiplier: 0.75 },
  { slotId: "s1130", time: "11:30 AM – 12:00 PM", shortTime: "11:30 AM", session: "MORNING" as const, peakMultiplier: 0.65 },
  { slotId: "s1200", time: "12:00 PM – 12:30 PM", shortTime: "12:00 PM", session: "MORNING" as const, peakMultiplier: 0.80 },
  { slotId: "s1230", time: "12:30 PM – 01:00 PM", shortTime: "12:30 PM", session: "MORNING" as const, peakMultiplier: 0.50 },

  // Afternoon Session (01:30 PM – 05:00 PM)
  { slotId: "s0130", time: "01:30 PM – 02:00 PM", shortTime: "01:30 PM", session: "AFTERNOON" as const, peakMultiplier: 0.35 },
  { slotId: "s0200", time: "02:00 PM – 02:30 PM", shortTime: "02:00 PM", session: "AFTERNOON" as const, peakMultiplier: 0.55 },
  { slotId: "s0230", time: "02:30 PM – 03:00 PM", shortTime: "02:30 PM", session: "AFTERNOON" as const, peakMultiplier: 0.65 },
  { slotId: "s0300", time: "03:00 PM – 03:30 PM", shortTime: "03:00 PM", session: "AFTERNOON" as const, peakMultiplier: 0.50 },
  { slotId: "s0330", time: "03:30 PM – 04:00 PM", shortTime: "03:30 PM", session: "AFTERNOON" as const, peakMultiplier: 0.40 },
  { slotId: "s0400", time: "04:00 PM – 04:30 PM", shortTime: "04:00 PM", session: "AFTERNOON" as const, peakMultiplier: 0.30 },
  { slotId: "s0430", time: "04:30 PM – 05:00 PM", shortTime: "04:30 PM", session: "AFTERNOON" as const, peakMultiplier: 0.20 },
];

/**
 * Deterministic pseudo-random integer generator based on centre, date, and slot string.
 * Ensures realistic variation across dates and centres, but remains consistent on re-renders.
 */
function getDeterministicSeed(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates dynamic time slots for a specific procurement centre and date,
 * combining physical bay capacity, date-based demand, and actual live queue bookings.
 */
export function getDynamicSlotsForCentre(
  centre?: ProcurementCentre,
  date?: string,
  liveBookings: Booking[] = []
): DynamicSlot[] {
  const bays = centre?.bays ?? 4;
  const capacityPerBay = centre?.bayCapacityPerSlot ?? 3;
  const maxSlotCapacity = Math.max(6, bays * capacityPerBay);
  const targetDate = date || new Date().toISOString().split("T")[0];
  const centreName = centre?.name || "";
  const centreId = centre?.id || "";

  return STANDARD_MANDI_SLOTS.map((base) => {
    // 1. Calculate actual active bookings in system for this centre, date, and slot
    const realBookingsCount = liveBookings.filter((b) => {
      const matchCentre =
        (b.centreId && b.centreId === centreId) ||
        (b.centre && centreName && b.centre.toLowerCase() === centreName.toLowerCase());
      const matchDate = b.date === targetDate;
      const matchTime =
        b.time === base.shortTime ||
        b.fullTime === base.time ||
        (b.time && b.time.includes(base.shortTime));
      const isActive = b.status !== "CANCELLED";

      return matchCentre && matchDate && matchTime && isActive;
    }).length;

    // 2. Compute simulated baseline load (different by date & centre)
    const seed = getDeterministicSeed(`${centreId}-${targetDate}-${base.slotId}`);
    const noise = (seed % 100) / 100; // 0.00 to 0.99

    // Base occupancy combines the time-of-day curve with centre-specific variance
    const combinedFactor = Math.min(0.95, Math.max(0.1, base.peakMultiplier + (noise - 0.5) * 0.3));
    let simulatedBooked = Math.round(maxSlotCapacity * combinedFactor);

    // Some peak slots in high-volume centres naturally fill up completely
    if (combinedFactor > 0.88 && seed % 4 === 0) {
      simulatedBooked = maxSlotCapacity;
    }

    // Total booked includes real bookings plus baseline bookings (capped at max capacity)
    const totalBooked = Math.min(maxSlotCapacity, simulatedBooked + realBookingsCount);
    const available = Math.max(0, maxSlotCapacity - totalBooked);
    const utilizationRate = maxSlotCapacity > 0 ? totalBooked / maxSlotCapacity : 1;

    let status: "AVAILABLE" | "FILLING_FAST" | "FULL" = "AVAILABLE";
    if (available === 0) {
      status = "FULL";
    } else if (available <= 3 || utilizationRate >= 0.8) {
      status = "FILLING_FAST";
    }

    return {
      slotId: base.slotId,
      time: base.time,
      shortTime: base.shortTime,
      session: base.session,
      maxCapacity: maxSlotCapacity,
      bookedCount: totalBooked,
      available,
      utilizationRate,
      status,
    };
  });
}
