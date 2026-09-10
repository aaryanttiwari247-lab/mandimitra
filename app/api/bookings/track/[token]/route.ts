import { NextResponse } from "next/server";
import { getStoredQueue, matchesBookingIdentifier, normalizeTokenClean } from "@/lib/procurement-store";
import { calculatePredictiveWaitTime } from "@/lib/token-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const queue = getStoredQueue();
  const cleanQuery = normalizeTokenClean(decodeURIComponent(token || ""));

  // 1. Exact Token or Booking ID match first
  let found = queue.find(
    (b) =>
      (b.token && normalizeTokenClean(b.token) === cleanQuery) ||
      (b.bookingId && normalizeTokenClean(b.bookingId) === cleanQuery)
  );

  // 2. Fallback: Match by Mobile, FarmerId, or TokenNumber
  if (!found) {
    found = queue.find((b) => matchesBookingIdentifier(b, cleanQuery));
  }

  if (!found) {
    return NextResponse.json({ success: false, message: "Token not found" }, { status: 404 });
  }

  const isStillWaiting = !found.status || found.status === "WAITING";

  // Calculate live position and predictive wait time
  const waitingAhead = isStillWaiting
    ? queue.filter(
        (b) =>
          b.centre === found.centre &&
          (b.status === "WAITING" || b.status === "CALLED" || b.status === "PROCESSING") &&
          new Date(b.createdAt || 0).getTime() < new Date(found.createdAt || 0).getTime()
      )
    : [];

  const { estimatedWaitMinutes, totalQuintalsAhead } = calculatePredictiveWaitTime(waitingAhead);
  const queuePosition = isStillWaiting ? waitingAhead.length + 1 : 1;

  return NextResponse.json({
    success: true,
    booking: {
      ...found,
      queuePosition: isStillWaiting ? queuePosition : 1,
      waitTime: isStillWaiting ? estimatedWaitMinutes : 0,
      totalQuintalsAhead,
    },
  });
}
