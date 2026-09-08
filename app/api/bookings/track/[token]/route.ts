import { NextResponse } from "next/server";
import { getStoredQueue } from "@/lib/procurement-store";
import { calculatePredictiveWaitTime } from "@/lib/token-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const queue = getStoredQueue();

  const found = queue.find(
    (b) => b.token?.toUpperCase() === token.toUpperCase() || b.bookingId === token
  );

  if (!found) {
    return NextResponse.json({ success: false, message: "Token not found" }, { status: 404 });
  }

  // Calculate live position and predictive wait time
  const waitingAhead = queue.filter(
    (b) =>
      b.centre === found.centre &&
      (b.status === "WAITING" || b.status === "CALLED" || b.status === "PROCESSING") &&
      new Date(b.createdAt).getTime() < new Date(found.createdAt).getTime()
  );

  const { estimatedWaitMinutes, totalQuintalsAhead } = calculatePredictiveWaitTime(waitingAhead);
  const queuePosition = waitingAhead.length + 1;

  return NextResponse.json({
    success: true,
    booking: {
      ...found,
      queuePosition,
      waitTime: estimatedWaitMinutes,
      totalQuintalsAhead,
    },
  });
}
