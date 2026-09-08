import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile, name, district, village, landAcres, primaryCrop } = body;

    if (!mobile || !name) {
      return NextResponse.json({ success: false, message: "Name and mobile are required" }, { status: 400 });
    }

    const farmerCode = `FMR${String(mobile).slice(-4)}`;

    const farmerRecord = {
      farmerId: farmerCode,
      farmerCode,
      name,
      mobile,
      district: district || "",
      village: village || "",
      landAcres: Number(landAcres) || 0,
      primaryCrop: primaryCrop || "Cotton",
      loginTime: new Date().toISOString(),
    };

    if (prisma) {
      try {
        const saved = await prisma.farmer.upsert({
          where: { mobile: String(mobile) },
          update: {
            name,
            district: district || "",
            village: village || "",
            landAcres: Number(landAcres) || 0,
            primaryCrop: primaryCrop || "Cotton",
          },
          create: {
            mobile: String(mobile),
            farmerCode,
            name,
            district: district || "",
            village: village || "",
            landAcres: Number(landAcres) || 0,
            primaryCrop: primaryCrop || "Cotton",
          },
        });

        farmerRecord.farmerId = saved.id;
        farmerRecord.farmerCode = saved.farmerCode;
      } catch (dbErr) {
        console.warn("Could not upsert farmer to DB, proceeding with client record:", dbErr);
      }
    }

    return NextResponse.json({ success: true, farmer: farmerRecord });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
