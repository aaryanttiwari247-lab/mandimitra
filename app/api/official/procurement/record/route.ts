import { NextResponse } from "next/server";
import { updateBookingInAllStores } from "@/lib/procurement-store";

// Minimum Support Price (₹ / quintal)
const MSP_RATES: Record<string, number> = {
  Cotton: 7121,
  Wheat: 2275,
  Soybean: 4892,
  Mustard: 5650,
  Paddy: 2300,
  Gram: 5440,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, grossWeightKg, tareWeightKg, moisturePercentage = 8.5 } = body;

    if (!bookingId || grossWeightKg === undefined || tareWeightKg === undefined) {
      return NextResponse.json({ success: false, message: "Missing weight details" }, { status: 400 });
    }

    const netWeightKg = Math.max(0, Number(grossWeightKg) - Number(tareWeightKg));
    const netWeightQtl = Number((netWeightKg / 100).toFixed(2));

    // Moisture calculation (Standard allowed: 8%, above 12% deducts difference)
    const moisture = Number(moisturePercentage);
    let moistureDeductionQtl = 0;
    if (moisture > 8.0) {
      const excessRate = (moisture - 8.0) / 100;
      moistureDeductionQtl = Number((netWeightQtl * excessRate).toFixed(2));
    }

    const finalPayableWeightQtl = Number(Math.max(0, netWeightQtl - moistureDeductionQtl).toFixed(2));

    // Update booking status to COMPLETED
    const updated = updateBookingInAllStores(bookingId, {
      status: "COMPLETED",
      queueStatus: "COMPLETED",
      procurementStatus: "COMPLETED",
      completedAt: new Date().toISOString(),
    });

    const crop = updated?.crop || "Cotton";
    const mspPerQtl = MSP_RATES[crop] || 7121;
    const totalPayoutAmount = Number((finalPayableWeightQtl * mspPerQtl).toFixed(2));

    const receipt = {
      bookingId,
      token: updated?.token,
      farmerName: updated?.farmerName,
      crop,
      grossWeightKg: Number(grossWeightKg),
      tareWeightKg: Number(tareWeightKg),
      netWeightQtl,
      moisturePercentage: moisture,
      moistureDeductionQtl,
      finalPayableWeightQtl,
      mspPerQtl,
      totalPayoutAmount,
      currency: "INR",
      recordedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, receipt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record procurement";
    console.error("Procurement Record Error:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
