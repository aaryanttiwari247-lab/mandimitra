import { NextResponse } from "next/server";
import { updateBookingInAllStores } from "@/lib/procurement-store";
import { Booking } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      bookingId,
      token,
      cancellationReason,
      cancelledBy,
    } = body;

    const identifier = (bookingId || token || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Missing booking identifier (bookingId or token)" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updates: Partial<Booking> = {
      status: "CANCELLED",
      queueStatus: "CANCELLED",
      procurementStatus: "CANCELLED",
      cancelledAt: now,
      cancelledBy: cancelledBy || "Farmer (Self-Cancelled)",
      cancellationReason: cancellationReason || "Cancelled by Farmer",
      updatedAt: now,
    };

    const updated = updateBookingInAllStores(identifier, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Booking not found or already cancelled" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Procurement booking cancelled successfully",
      booking: updated,
    });
  } catch (error) {
    console.error("Farmer booking cancellation error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}
