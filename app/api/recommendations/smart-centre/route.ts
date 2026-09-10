import { NextResponse } from "next/server";
import { calculateBestCentreAndSlot, CentreCongestion, SlotCongestion } from "@/lib/recommendation-engine";
import { getStoredQueue } from "@/lib/procurement-store";
import { getCentresByLocation } from "@/lib/locations-centres";

const DEFAULT_SLOTS = [
  { slotId: "s1", timeWindow: "10:00 AM – 10:30 AM", shortTime: "10:00 AM", maxCapacity: 15, bookedCount: 15 },
  { slotId: "s2", timeWindow: "10:30 AM – 11:00 AM", shortTime: "10:30 AM", maxCapacity: 15, bookedCount: 1 },
  { slotId: "s3", timeWindow: "11:00 AM – 11:30 AM", shortTime: "11:00 AM", maxCapacity: 15, bookedCount: 7 },
  { slotId: "s4", timeWindow: "11:30 AM – 12:00 PM", shortTime: "11:30 AM", maxCapacity: 15, bookedCount: 12 },
  { slotId: "s5", timeWindow: "12:00 PM – 12:30 PM", shortTime: "12:00 PM", maxCapacity: 15, bookedCount: 15 },
];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { crop = "Wheat", quantity = 30, preferredSlot = "10:30 AM", location = "Bhopal" } = body;

    // Read current queue to calculate live congestion
    const liveQueue = getStoredQueue();

    // Get centres allotted to the requested location
    const allottedCentres = getCentresByLocation(location);

    const centresData: CentreCongestion[] = allottedCentres.map((c) => {
      const activeForCentre = liveQueue.filter(
        (b) =>
          (b.centreId === c.id || (b.centre && b.centre.toLowerCase() === c.name.toLowerCase())) &&
          b.status !== "COMPLETED" &&
          b.status !== "CANCELLED"
      );
      const queueCount = activeForCentre.length;
      const dynamicWait = Math.max(c.baseWaitMinutes, queueCount * 4);
      const numericDist = parseFloat(c.distance) || 4.5;

      return {
        centreId: c.id,
        name: c.name,
        distanceKm: numericDist,
        activeQueueCount: queueCount,
        estimatedWaitMinutes: dynamicWait,
        baysAvailable: c.bays,
        processingSpeedPerQtlMin: 1.4,
      };
    });

    const slotsData: SlotCongestion[] = DEFAULT_SLOTS.map((s) => ({
      slotId: s.slotId,
      timeWindow: s.timeWindow,
      shortTime: s.shortTime,
      bookedCount: s.bookedCount,
      maxCapacity: s.maxCapacity,
      utilizationRate: s.bookedCount / s.maxCapacity,
    }));

    const recommendation = calculateBestCentreAndSlot(centresData, slotsData, preferredSlot);

    return NextResponse.json({
      success: true,
      crop,
      quantity: Number(quantity),
      ...recommendation,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to compute recommendation";
    console.error("Smart Recommendation Error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
