import { NextResponse } from "next/server";
import { calculateBestCentreAndSlot, CentreCongestion, SlotCongestion } from "@/lib/recommendation-engine";
import { getStoredQueue } from "@/lib/procurement-store";
import {
  getCentresByLocation,
  findNearestCentresForCrops,
  getEffectiveDistanceToCentre,
  centreAcceptsCrop,
  ProcurementCentre,
} from "@/lib/locations-centres";
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

    // Check centres allotted to the requested location
    const localCentres = getCentresByLocation(location);
    const localCompatibleCentres = localCentres.filter((c) =>
      cleanRequestedCrops.length === 0 ||
      cleanRequestedCrops.some((rc) => centreAcceptsCrop(c, rc))
    );

    let candidateCentres: Array<ProcurementCentre & { distanceKm: number; isCrossDistrict: boolean }> = [];
    const hasCompatibleLocalCentres = localCompatibleCentres.length > 0;

    if (hasCompatibleLocalCentres || cleanRequestedCrops.length === 0) {
      // Local centres can accept the crop
      candidateCentres = localCentres.map((c) => {
        const eff = getEffectiveDistanceToCentre(location, c);
        return {
          ...c,
          distanceKm: eff.distanceKm,
          isCrossDistrict: false,
        };
      });
    } else {
      // No local centre accepts the requested crop! Search nearest compatible centres across the network
      const nearest = findNearestCentresForCrops(cleanRequestedCrops, location, 8);
      candidateCentres = nearest.map((c) => ({
        ...c,
        distanceKm: c.calculatedDistanceKm,
        isCrossDistrict: c.isCrossDistrict,
      }));
    }

    if (candidateCentres.length === 0) {
      candidateCentres = localCentres.map((c) => ({
        ...c,
        distanceKm: parseFloat(c.distance) || 5,
        isCrossDistrict: false,
      }));
    }

    const centresData: CentreCongestion[] = candidateCentres.map((c) => {
      const activeForCentre = liveQueue.filter(
        (b) =>
          (b.centreId === c.id || (b.centre && b.centre.toLowerCase() === c.name.toLowerCase())) &&
          b.status !== "COMPLETED" &&
          b.status !== "CANCELLED"
      );
      const queueCount = activeForCentre.length;
      const dynamicWait = Math.max(c.baseWaitMinutes, queueCount * 4);

      return {
        centreId: c.id,
        name: c.name,
        location: c.location,
        isCrossDistrict: c.isCrossDistrict,
        distanceKm: c.distanceKm,
        activeQueueCount: queueCount,
        estimatedWaitMinutes: dynamicWait,
        baysAvailable: c.bays,
        processingSpeedPerQtlMin: 1.4,
        acceptedCrops: c.acceptedCrops,
        agencyType: c.agencyType,
      };
    });

    // Generate dynamic full-day slots for the target centre & date
    const targetCentre = candidateCentres[0] || localCentres[0];
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
      hasCompatibleLocalCentres,
      isCrossDistrictRecommendation: !hasCompatibleLocalCentres,
      homeDistrict: location,
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
