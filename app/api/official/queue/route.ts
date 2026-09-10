import { NextResponse } from "next/server";
import { getStoredQueue, saveStoredQueue } from "@/lib/procurement-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  let queue = getStoredQueue();

  if (statusFilter && statusFilter !== "ALL") {
    queue = queue.filter((b) => b.status === statusFilter.toUpperCase());
  }

  const counts = {
    total: queue.length,
    waiting: queue.filter((b) => b.status === "WAITING").length,
    called: queue.filter((b) => b.status === "CALLED").length,
    verified: queue.filter((b) => b.status === "VERIFIED").length,
    processing: queue.filter((b) => b.status === "PROCESSING").length,
    completed: queue.filter((b) => b.status === "COMPLETED").length,
    cancelled: queue.filter((b) => b.status === "CANCELLED").length,
  };

  return NextResponse.json({ success: true, queue, counts });
}

export async function POST(req: Request) {
  try {
    const booking = (await req.json()) as any;
    if (!booking || (!booking.bookingId && !booking.token)) {
      return NextResponse.json({ success: false, message: "Invalid booking" }, { status: 400 });
    }

    const queue = getStoredQueue();
    const targetBookingId = (booking.bookingId || "").trim().toUpperCase();
    const targetToken = (booking.token || "").trim().toUpperCase();

    const idx = queue.findIndex(
      (b) =>
        (targetBookingId && b.bookingId && b.bookingId.toUpperCase() === targetBookingId) ||
        (targetToken && b.token && b.token.toUpperCase() === targetToken)
    );

    let savedItem: any;
    if (idx !== -1) {
      savedItem = {
        ...queue[idx],
        ...booking,
        updatedAt: booking.updatedAt || new Date().toISOString(),
      };
      queue[idx] = savedItem;
    } else {
      savedItem = {
        ...booking,
        updatedAt: booking.updatedAt || new Date().toISOString(),
      };
      queue.push(savedItem);
    }

    saveStoredQueue(queue);
    return NextResponse.json({ success: true, queue, booking: savedItem });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
