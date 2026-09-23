import { NextResponse } from "next/server";
import { updateBookingInAllStores } from "@/lib/procurement-store";
import { Booking, BookingStatus } from "@/lib/types";
import {
  sendTokenCalledSms,
  sendDocsVerifiedSms,
  sendProcurementCompletedSms,
  sendBookingCancelledSms,
} from "@/lib/sms-service";

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
  if (body.farmerArrived !== undefined) updates.farmerArrived = Boolean(body.farmerArrived);
  if (status === "CALLED" || body.farmerArrived) {
    updates.calledAt = updates.calledAt || now;
    updates.arrivedAt = updates.arrivedAt || now;
    updates.farmerArrived = true;
  }
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

  // Dispatch real-time SMS alerts to farmer's mobile
  if (updated.farmerMobile) {
    if (status === "CALLED") {
      sendTokenCalledSms(updated).catch(err => console.warn("SMS sendTokenCalled error:", err));
    } else if (status === "VERIFIED") {
      sendDocsVerifiedSms(updated, verifiedBy || officialId).catch(err => console.warn("SMS sendDocsVerified error:", err));
    } else if (status === "COMPLETED") {
      sendProcurementCompletedSms({
        booking: updated,
        netWeightQtl: updated.actualQuantity || updated.quantity || 0,
        cropGrade: updated.cropGrade || "Grade A",
        mspPerQtl: updated.mspRate || 2425,
        totalPayoutAmount: updated.totalPayout || 0,
      }).catch(err => console.warn("SMS sendProcurementCompleted error:", err));
    } else if (status === "CANCELLED") {
      sendBookingCancelledSms(updated, updates.cancellationReason || undefined).catch(err => console.warn("SMS sendBookingCancelled error:", err));
    }
  }

  return NextResponse.json({ success: true, booking: updated });
}
