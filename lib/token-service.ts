import type { BookingStatus } from "./types";

export type QueueItem = {
  bookingId: string;
  token: string;
  tokenNumber: number;
  farmerName: string;
  crop: string;
  quantity: number;
  status: BookingStatus;
  createdAt: string;
};

/**
 * Predicts realistic wait time based on farmers ahead and total crop volume.
 * Factors in average weighment time (1.2 min per quintal) + sample inspection (4 min base).
 */
export function calculatePredictiveWaitTime(
  farmersAhead: Array<{ quantity: number; status: BookingStatus }>
): { estimatedWaitMinutes: number; totalQuintalsAhead: number } {
  const activeAhead = farmersAhead.filter(
    (f) => f.status === "WAITING" || f.status === "CALLED" || f.status === "PROCESSING"
  );

  const totalQuintalsAhead = activeAhead.reduce((sum, f) => sum + (f.quantity || 0), 0);
  const headCount = activeAhead.length;

  const estimatedWaitMinutes = Math.max(5, Math.round(headCount * 4 + totalQuintalsAhead * 1.2));

  return {
    estimatedWaitMinutes,
    totalQuintalsAhead,
  };
}

export const LOCATION_TOKEN_CONFIG: Record<string, { code: string; base: number }> = {
  bhopal: { code: "BHO", base: 100 },
  sehore: { code: "SEH", base: 200 },
  narmadapuram: { code: "NAR", base: 300 },
  raisen: { code: "RAI", base: 400 },
  vidisha: { code: "VID", base: 500 },
  indore: { code: "IND", base: 600 },
  ujjain: { code: "UJJ", base: 700 },
  dewas: { code: "DEW", base: 800 },
  sagar: { code: "SAG", base: 900 },
  jabalpur: { code: "JAB", base: 1000 },
  gwalior: { code: "GWA", base: 1100 },
  kota: { code: "KOT", base: 1200 },
  jaipur: { code: "JAI", base: 1300 },
  karnal: { code: "KAR", base: 1400 },
  meerut: { code: "MEE", base: 1500 },
};

export function getLocationTokenMeta(locationOrCentre?: string): { code: string; base: number } {
  if (!locationOrCentre) return { code: "MM", base: 2000 };
  const raw = locationOrCentre.toLowerCase();

  for (const [key, cfg] of Object.entries(LOCATION_TOKEN_CONFIG)) {
    if (raw.includes(key) || key.includes(raw)) {
      return cfg;
    }
  }

  // Fallback: 3-letter uppercase prefix from first word
  const firstWord = locationOrCentre.trim().split(/[\s-_]+/)[0];
  const code = (firstWord || "MM").slice(0, 3).toUpperCase();
  return { code, base: 2000 };
}

/**
 * Generates formatted atomic token string:
 * Example: Centre 'Lakshmipur Procurement Centre' in Bhopal -> 'BHO-103'
 * Primary Token 101 is preserved as 'A101' for backward compatibility.
 */
export function formatSmartToken(locationOrCentre: string, tokenNumber: number): string {
  if (tokenNumber === 101) return "A101";
  const meta = getLocationTokenMeta(locationOrCentre);
  return `${meta.code}-${tokenNumber}`;
}

/**
 * Generates guaranteed unique token number and formatted string.
 * Ensures every location has its own non-overlapping number block and no collisions exist.
 */
export function generateUniqueToken(params?: {
  location?: string;
  centre?: string;
  existingBookings?: Array<{ tokenNumber?: number; location?: string; centre?: string }>;
}): { tokenNumber: number; token: string } {
  const meta = getLocationTokenMeta(params?.location || params?.centre);

  let allBookings = params?.existingBookings;
  if (!allBookings && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("smartProcurementQueue");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) allBookings = parsed;
      }
    } catch {}
  }

  const allUsedNumbers = new Set<number>();
  const locationNumbers: number[] = [];

  if (Array.isArray(allBookings)) {
    for (const b of allBookings) {
      if (b && typeof b.tokenNumber === "number" && !isNaN(b.tokenNumber)) {
        allUsedNumbers.add(b.tokenNumber);
        const bMeta = getLocationTokenMeta(b.location || b.centre);
        if (bMeta.code === meta.code || (b.tokenNumber >= meta.base + 1 && b.tokenNumber <= meta.base + 99)) {
          locationNumbers.push(b.tokenNumber);
        }
      }
    }
  }

  let nextNumber = meta.base + 1;
  if (locationNumbers.length > 0) {
    nextNumber = Math.max(...locationNumbers) + 1;
  }

  // Ensure nextNumber is absolutely unique across all locations and records
  while (allUsedNumbers.has(nextNumber)) {
    nextNumber++;
  }

  const token = formatSmartToken(params?.location || params?.centre || meta.code, nextNumber);

  return {
    tokenNumber: nextNumber,
    token,
  };
}
