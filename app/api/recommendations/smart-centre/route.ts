import { NextResponse } from "next/server";
import { calculateBestCentreAndSlot, CentreCongestion, SlotCongestion } from "@/lib/recommendation-engine";
import { getStoredQueue } from "@/lib/procurement-store";

// Default Centres metadata
const DEFAULT_CENTRES = [
  {
    centreId: "centre_lakshmipur",
    name: "Lakshmipur Procurement Centre",
    distanceKm: 4.7,
    baysAvailable: 6,
    processingSpeedPerQtlMin: 1.2,
    baseWait: 24,
  },
  {
    centreId: "centre_rampur",
    name: "Rampur Procurement Centre",
    distanceKm: 2.0,
    baysAvailable: 4,
    processingSpeedPerQtlMin: 1.8,
    baseWait: 95,
  },
  {
    centreId: "centre_shivpur",
    name: "Shivpur Procurement Centre",
    distanceKm: 6.2,
    baysAvailable: 5,
    processingSpeedPerQtlMin: 1.5,
    baseWait: 48,
  },
];

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
    const { crop = "Cotton", quantity = 30, preferredSlot = "10:30 AM" } = body;

    // Read current queue to calculate live congestion
    const liveQueue = getStoredQueue();

    const centresData: CentreCongestion[] = DEFAULT_CENTRES.map((c) => {
      const activeForCentre = liveQueue.filter(
        (b) => (b.centre?.toLowerCase().includes(c.name.toLowerCase().split(" ")[0]) || b.centreId === c.centreId) &&
               b.status !== "COMPLETED" && b.status !== "CANCELLED"
      );
      const queueCount = activeForCentre.length;
      const dynamicWait = Math.max(c.baseWait, queueCount * 12 + Math.round(Number(quantity) * 0.4));

      return {
        centreId: c.centreId,
        name: c.name,
        distanceKm: c.distanceKm,
        activeQueueCount: queueCount,
        estimatedWaitMinutes: dynamicWait,
        baysAvailable: c.baysAvailable,
        processingSpeedPerQtlMin: c.processingSpeedPerQtlMin,
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
