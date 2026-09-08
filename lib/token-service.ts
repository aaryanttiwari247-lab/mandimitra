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

/**
 * Generates formatted atomic token string:
 * Example: Centre 'Lakshmipur Procurement Centre' -> prefix 'LAK', tokenNumber 103 -> 'LAK-A103'
 */
export function formatSmartToken(centreCode: string, tokenNumber: number): string {
  const prefix = (centreCode || "LAK").slice(0, 3).toUpperCase();
  return `${prefix}-A${tokenNumber}`;
}
