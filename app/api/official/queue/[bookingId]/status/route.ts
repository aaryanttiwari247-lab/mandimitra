import { NextResponse } from "next/server";
import { updateBookingInAllStores } from "@/lib/procurement-store";
import { Booking, BookingStatus } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId: rawId } = await params;
  const bookingId = decodeURIComponent(rawId || "").trim();
  const body = await req.json();
  const {
    status,
    verifiedBy,
    officialId,
    cropGrade,
    mspRate,
    totalPayout,
    actualQuantity,
    paymentStatus,
    cancellationReason,
    cancelledBy,
  } = body;

  const validStatuses: BookingStatus[] = ["WAITING", "CALLED", "VERIFIED", "PROCESSING", "COMPLETED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
  }

  const updates: Partial<Booking> = {
    status,
    queueStatus: status,
    procurementStatus: status,
  };

  if (cropGrade) updates.cropGrade = cropGrade;
  if (mspRate !== undefined) updates.mspRate = Number(mspRate);
  if (totalPayout !== undefined) updates.totalPayout = Number(totalPayout);
  if (actualQuantity !== undefined) updates.actualQuantity = Number(actualQuantity);
  if (paymentStatus) updates.paymentStatus = paymentStatus;

  const now = new Date().toISOString();
  if (status === "CALLED") updates.calledAt = now;
  if (status === "VERIFIED") {
    updates.verifiedBy = verifiedBy || officialId || "Procurement Officer";
  }
  if (status === "PROCESSING") updates.processingStartedAt = now;
  if (status === "COMPLETED") updates.completedAt = now;
  if (status === "CANCELLED") {
    updates.cancelledAt = now;
    updates.cancellationReason = cancellationReason || "Cancelled by Procurement Officer";
    updates.cancelledBy = cancelledBy || verifiedBy || officialId || "Procurement Officer";
  }

  const updated = updateBookingInAllStores(bookingId, updates);

  if (!updated) {
    return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, booking: updated });
}
