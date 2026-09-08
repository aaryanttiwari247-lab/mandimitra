import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile } = body;

    if (!mobile || String(mobile).length !== 10) {
      return NextResponse.json({ success: false, message: "Valid 10-digit mobile number required" }, { status: 400 });
    }

    // Lookup farmer in PostgreSQL database
    let farmer = null;
    if (prisma) {
      try {
        farmer = await prisma.farmer.findUnique({
          where: { mobile: String(mobile) },
          include: {
            bookings: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });
      } catch (dbErr) {
        console.warn("DB lookup error, falling back to dynamic profile:", dbErr);
      }
    }

    if (farmer) {
      return NextResponse.json({
        success: true,
        registered: true,
        farmer: {
          farmerId: farmer.id,
          farmerCode: farmer.farmerCode,
          name: farmer.name,
          mobile: farmer.mobile,
          village: farmer.village || "",
          district: farmer.district || "",
          landAcres: farmer.landAcres || 0,
          primaryCrop: farmer.primaryCrop || "Cotton",
          loginTime: new Date().toISOString(),
        },
        latestBooking: farmer.bookings[0] || null,
      });
    }

    // If not found in DB, return dynamic new farmer profile
    const farmerCode = `FMR${String(mobile).slice(-4)}`;
    const defaultName = `Farmer (${String(mobile).slice(-4)})`;

    return NextResponse.json({
      success: true,
      registered: false,
      farmer: {
        farmerId: farmerCode,
        farmerCode,
        name: defaultName,
        mobile: String(mobile),
        village: "",
        district: "",
        landAcres: 0,
        primaryCrop: "Cotton",
        loginTime: new Date().toISOString(),
      },
      latestBooking: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
