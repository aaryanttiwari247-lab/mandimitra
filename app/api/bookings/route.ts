import { NextResponse } from "next/server";
import { generateUniqueToken } from "@/lib/token-service";
import { getStoredQueue, saveStoredQueue, saveStoredCurrentBooking, saveStoredHistory, getStoredHistory } from "@/lib/procurement-store";
import { Booking } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { farmerId, farmerName, farmerMobile, crop, quantity, date, centre, time, fullTime, distance, location } = body;

    if (!farmerId || !crop || !quantity || !date || !centre || !time) {
      return NextResponse.json({ success: false, message: "Missing required booking details" }, { status: 400 });
    }

    const queue = getStoredQueue();

    // Generate guaranteed unique token based on location/centre
    const { tokenNumber, token } = generateUniqueToken({
      location: location || centre,
      centre,
      existingBookings: queue,
    });

    const newBooking: Booking = {
      bookingId: `BOOK-${Date.now()}`,
      tokenNumber,
      token,
      farmerId,
      farmerName: farmerName || "Farmer",
      farmerMobile: farmerMobile || "",
      crop,
      quantity: Number(quantity),
      date,
      centre,
      distance: distance || "4.7 km",
      time,
      fullTime: fullTime || `${time} – ${time}`,
      availableSlots: 10,
      queuePosition: queue.filter(b => b.status === "WAITING" || b.status === "CALLED").length + 1,
      waitTime: 24,
      status: "WAITING",
      queueStatus: "WAITING",
      procurementStatus: "WAITING",
      calledAt: null,
      processingStartedAt: null,
      completedAt: null,
      verifiedBy: null,
      arrivalTime: "15 min prior",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    queue.push(newBooking);
    saveStoredQueue(queue);
    saveStoredCurrentBooking(newBooking);

    const history = getStoredHistory().filter(b => b.bookingId !== newBooking.bookingId);
    history.unshift(newBooking);
    saveStoredHistory(history.slice(0, 15));

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create booking";
    console.error("Booking Error:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET() {
  const queue = getStoredQueue();
  return NextResponse.json({ success: true, bookings: queue });
}
