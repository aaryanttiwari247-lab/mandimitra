import { Booking } from "./types";

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

export function getStoredQueue(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredQueue(queue: Booking[]) {
  if (typeof window === "undefined") return;
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
  if (typeof window === "undefined") return null;

  let updatedBooking: Booking | null = null;

  // 1. Update queue
  const queue = getStoredQueue();
  const queueIndex = queue.findIndex((b) => b.bookingId === bookingId);
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
  if (current && current.bookingId === bookingId) {
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
  const historyIndex = history.findIndex((b) => b.bookingId === bookingId);
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
