import { NextResponse } from "next/server";
import { getStoredQueue } from "@/lib/procurement-store";

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
