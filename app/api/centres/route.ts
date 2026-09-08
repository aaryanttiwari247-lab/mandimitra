import { NextResponse } from "next/server";
import { getStoredQueue } from "@/lib/procurement-store";

export async function GET() {
  const queue = getStoredQueue();

  const centres = [
    {
      id: "centre_lakshmipur",
      name: "Lakshmipur Procurement Centre",
      distance: "4.7 km away",
      farmers: 19 + queue.filter(b => b.centre?.includes("Lakshmipur") && b.status !== "COMPLETED").length,
      wait: 24,
      recommended: true,
    },
    {
      id: "centre_rampur",
      name: "Rampur Procurement Centre",
      distance: "2.0 km away",
      farmers: 87 + queue.filter(b => b.centre?.includes("Rampur") && b.status !== "COMPLETED").length,
      wait: 95,
      recommended: false,
    },
    {
      id: "centre_shivpur",
      name: "Shivpur Procurement Centre",
      distance: "6.2 km away",
      farmers: 41 + queue.filter(b => b.centre?.includes("Shivpur") && b.status !== "COMPLETED").length,
      wait: 48,
      recommended: false,
    },
  ];

  return NextResponse.json({ success: true, centres });
}
