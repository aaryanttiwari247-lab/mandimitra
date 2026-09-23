import { NextResponse } from "next/server";
import { sendOtpSms, sanitizeMobileNumber } from "@/lib/sms-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile, aadhaar } = body;

    const cleanAadhaar = aadhaar ? String(aadhaar).replace(/\D/g, "") : null;
    let cleanMobile = mobile ? sanitizeMobileNumber(String(mobile)) : null;

    // If only Aadhaar provided, generate consistent mobile identifier
    if (!cleanMobile && cleanAadhaar && cleanAadhaar.length === 12) {
      cleanMobile = `98765${cleanAadhaar.slice(-5)}`;
    }

    if (!cleanMobile || cleanMobile.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid 10-digit mobile number or 12-digit Aadhaar number.",
        },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Dispatch SMS via live gateway (Fast2SMS / Twilio) or local simulation
    const smsResult = await sendOtpSms(cleanMobile, otp);

    const maskedMobile = `+91 ${cleanMobile.slice(0, 2)}******${cleanMobile.slice(-2)}`;

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully via SMS to ${maskedMobile}`,
      mobile: cleanMobile,
      maskedMobile,
      otp, // Provided for instant demo auto-fill
      provider: smsResult.provider,
      status: smsResult.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to send OTP via SMS" },
      { status: 500 }
    );
  }
}
