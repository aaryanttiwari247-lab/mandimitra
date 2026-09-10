import { NextResponse } from "next/server";
import { getStoredQueue } from "@/lib/procurement-store";
import { calculatePredictiveWaitTime } from "@/lib/token-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const queue = getStoredQueue();
  const cleanQuery = decodeURIComponent(token || "").trim().toUpperCase().replace(/^#/, "");

  const found = queue.find(
    (b) => {
      const bToken = (b.token || "").toUpperCase().replace(/^#/, "");
      const bId = (b.bookingId || "").toUpperCase();
      const bFmrId = (b.farmerId || "").toUpperCase();
      const bMob = (b.farmerMobile || "").toUpperCase();
      const bNum = b.tokenNumber != null ? `A${b.tokenNumber}`.toUpperCase() : "";
      const bNumRaw = b.tokenNumber != null ? String(b.tokenNumber) : "";
      return (
        (bToken && bToken === cleanQuery) ||
        (bId && bId === cleanQuery) ||
        (bFmrId && bFmrId === cleanQuery) ||
        (bMob && bMob === cleanQuery) ||
        (bNum && bNum === cleanQuery) ||
        (bNumRaw && bNumRaw === cleanQuery)
      );
    }
  );

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
