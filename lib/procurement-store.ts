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

// Global server-side fallback queue for cross-tab & cross-device sync
const globalForQueue = globalThis as unknown as { __mandiMitraQueue?: Booking[] };
if (!globalForQueue.__mandiMitraQueue) {
  globalForQueue.__mandiMitraQueue = [
    {
      bookingId: "BOOK-INIT-001",
      tokenNumber: 101,
      token: "A101",
      farmerId: "FMR9801",
      farmerName: "Rameshwar Singh",
      farmerMobile: "9876543210",
      crop: "Wheat (Grade A)",
      quantity: 45,
      date: new Date().toISOString().split("T")[0],
      centre: "Lakshmipur Procurement Centre",
      distance: "4.7 km",
      time: "10:00 AM",
      fullTime: "10:00 AM – 10:30 AM",
      availableSlots: 10,
      queuePosition: 1,
      waitTime: 15,
      status: "WAITING",
      queueStatus: "WAITING",
      procurementStatus: "WAITING",
      arrivalTime: "09:50 AM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getStoredQueue(): Booking[] {
  if (typeof window === "undefined") {
    return globalForQueue.__mandiMitraQueue || [];
  }
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
  // 1. If on server, update globalForQueue
  if (typeof window === "undefined") {
    const queue = globalForQueue.__mandiMitraQueue || [];
    const idx = queue.findIndex((b) => b.bookingId === bookingId || b.token === bookingId);
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
