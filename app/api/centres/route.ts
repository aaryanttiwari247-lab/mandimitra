import { NextResponse } from "next/server";
import { getStoredQueue } from "@/lib/procurement-store";
import { PROCUREMENT_CENTRES, getCentresByLocation } from "@/lib/locations-centres";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationParam = searchParams.get("location");

  const queue = getStoredQueue();
  const baseCentres = locationParam ? getCentresByLocation(locationParam) : PROCUREMENT_CENTRES;

  const centres = baseCentres.map((c) => {
    const activeAtCentre = queue.filter(
      (b) =>
        (b.centreId === c.id || (b.centre && b.centre.toLowerCase() === c.name.toLowerCase())) &&
        b.status !== "COMPLETED" &&
        b.status !== "CANCELLED"
    );
    const activeCount = activeAtCentre.length;
    const dynamicWait = Math.max(c.baseWaitMinutes, activeCount * 4);

    return {
      id: c.id,
      name: c.name,
      location: c.location,
      state: c.state,
      distance: c.distance,
      farmers: activeCount,
      wait: dynamicWait,
      bays: c.bays,
      contactNumber: c.contactNumber,
      recommended: c.recommended ?? false,
    };
  });

  return NextResponse.json({ success: true, centres });
}

