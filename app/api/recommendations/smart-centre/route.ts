import { NextResponse } from "next/server";
import { calculateBestCentreAndSlot, CentreCongestion, SlotCongestion } from "@/lib/recommendation-engine";
import { getStoredQueue } from "@/lib/procurement-store";
import { getCentresByLocation } from "@/lib/locations-centres";
import { getDynamicSlotsForCentre } from "@/lib/slot-service";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      crop = "Wheat",
      crops,
      cropsList,
      quantity = 30,
      preferredSlot = "10:30 AM",
      location = "Bhopal",
      date,
    } = body;

    // Collect requested crops list
    const requestedCrops: string[] = Array.isArray(crops) && crops.length > 0
      ? crops
      : Array.isArray(cropsList) && cropsList.length > 0
      ? cropsList.map((item: { crop?: string } | string) => (typeof item === "string" ? item : item.crop || ""))
      : [crop];

    const cleanRequestedCrops = requestedCrops.filter(Boolean);

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
        acceptedCrops: c.acceptedCrops,
        agencyType: c.agencyType,
      };
    });

    // Generate dynamic full-day slots for the target centre & date
    const targetCentre = allottedCentres[0];
    const targetDate = date || new Date().toISOString().split("T")[0];
    const dynamicSlots = getDynamicSlotsForCentre(targetCentre, targetDate, liveQueue);

    const slotsData: SlotCongestion[] = dynamicSlots.map((s) => ({
      slotId: s.slotId,
      timeWindow: s.time,
      shortTime: s.shortTime,
      bookedCount: s.bookedCount,
      maxCapacity: s.maxCapacity,
      utilizationRate: s.utilizationRate,
      availableSeats: s.available,
    }));

    const recommendation = calculateBestCentreAndSlot(
      centresData,
      slotsData,
      preferredSlot,
      cleanRequestedCrops
    );

    return NextResponse.json({
      success: true,
      crop: cleanRequestedCrops[0] || crop,
      requestedCrops: cleanRequestedCrops,
      quantity: Number(quantity),
      date: targetDate,
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
