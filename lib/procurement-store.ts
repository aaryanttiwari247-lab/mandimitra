import { Booking } from "./types";
import { generateSeedBookings } from "./seed-data";

export const STORAGE_KEYS = {
  BOOKING: "smartProcurementBooking",
  QUEUE: "smartProcurementQueue",
  HISTORY: "smartProcurementHistory",
  FARMER_SESSION: "smart_procurement_farmer",
  OFFICIAL_SESSION: "smart_procurement_official",
  OTP: "smart_procurement_otp",
} as const;

export const CUSTOM_EVENTS = {
  QUEUE_UPDATED: "smartProcurementQueueUpdated",
  BOOKING_UPDATED: "smartProcurementBookingUpdated",
} as const;

function dispatchCustom(eventName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(eventName));
  }
}

// Global server-side fallback queue for cross-tab & cross-device sync
const globalForQueue = globalThis as unknown as { __mandiMitraQueue?: Booking[] };
if (!globalForQueue.__mandiMitraQueue || globalForQueue.__mandiMitraQueue.length <= 1) {
  globalForQueue.__mandiMitraQueue = generateSeedBookings();
}

export function getStoredQueue(): Booking[] {
  if (typeof window === "undefined") {
    return globalForQueue.__mandiMitraQueue || [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
    if (!raw) {
      const seeded = generateSeedBookings();
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length <= 1) {
      const seeded = generateSeedBookings();
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = generateSeedBookings();
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(seeded));
    } catch {}
    return seeded;
  }
}

export function saveStoredQueue(queue: Booking[]) {
  if (typeof window === "undefined") {
    globalForQueue.__mandiMitraQueue = queue;
    return;
  }
  localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
  dispatchCustom(CUSTOM_EVENTS.QUEUE_UPDATED);
}

export function getStoredCurrentBooking(): Booking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKING);
    if (!raw) return null;
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

export function saveStoredCurrentBooking(booking: Booking) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.BOOKING, JSON.stringify(booking));
  dispatchCustom(CUSTOM_EVENTS.BOOKING_UPDATED);
}

export function getStoredHistory(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredHistory(history: Booking[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

export function updateBookingInAllStores(
  bookingId: string,
  updates: Partial<Booking>
): Booking | null {
  const norm = (bookingId || "").trim().toUpperCase();

  // 1. If on server, update globalForQueue
  if (typeof window === "undefined") {
    const queue = globalForQueue.__mandiMitraQueue || [];
    const idx = queue.findIndex(
      (b) =>
        (b.bookingId && b.bookingId.toUpperCase() === norm) ||
        (b.token && b.token.toUpperCase() === norm)
    );
    if (idx !== -1) {
      queue[idx] = { ...queue[idx], ...updates, updatedAt: new Date().toISOString() };
      globalForQueue.__mandiMitraQueue = queue;
      return queue[idx];
    }
    return null;
  }

  let updatedBooking: Booking | null = null;

  // 1. Update queue
  const queue = getStoredQueue();
  const queueIndex = queue.findIndex(
    (b) =>
      (b.bookingId && b.bookingId.toUpperCase() === norm) ||
      (b.token && b.token.toUpperCase() === norm)
  );
  if (queueIndex !== -1) {
    queue[queueIndex] = {
      ...queue[queueIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    updatedBooking = queue[queueIndex];
    saveStoredQueue(queue);
  }

  // 2. Update current booking if matched
  const current = getStoredCurrentBooking();
  if (
    current &&
    ((current.bookingId && current.bookingId.toUpperCase() === norm) ||
      (current.token && current.token.toUpperCase() === norm))
  ) {
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStoredCurrentBooking(updated);
    if (!updatedBooking) updatedBooking = updated;
  }

  // 3. Update history
  const history = getStoredHistory();
  const historyIndex = history.findIndex(
    (b) =>
      (b.bookingId && b.bookingId.toUpperCase() === norm) ||
      (b.token && b.token.toUpperCase() === norm)
  );
  if (historyIndex !== -1) {
    history[historyIndex] = {
      ...history[historyIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStoredHistory(history);
  }

  return updatedBooking;
}
