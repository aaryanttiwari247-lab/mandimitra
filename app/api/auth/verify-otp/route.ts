import { NextResponse } from "next/server";
import { getValidServerOtps } from "@/app/api/auth/send-otp/route";
import { sanitizeMobileNumber } from "@/lib/sms-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile, aadhaar, otp } = body;

    const cleanInputOtp = String(otp || "").trim();
    if (!cleanInputOtp || cleanInputOtp.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 6-digit OTP." },
        { status: 400 }
      );
    }

    const cleanAadhaar = aadhaar ? String(aadhaar).replace(/\D/g, "") : null;
    let cleanMobile = mobile ? sanitizeMobileNumber(String(mobile)) : null;

    if (!cleanMobile && cleanAadhaar && cleanAadhaar.length === 12) {
      cleanMobile = `98765${cleanAadhaar.slice(-5)}`;
    }

    if (!cleanMobile) {
      return NextResponse.json(
        { success: false, message: "Mobile number or Aadhaar required for OTP validation." },
        { status: 400 }
      );
    }

    // Retrieve active OTPs generated on the server for this mobile number
    const validOtps = getValidServerOtps(cleanMobile);

    const isMatch = validOtps.includes(cleanInputOtp);

    if (isMatch) {
      return NextResponse.json({
        success: true,
        message: "OTP verified successfully.",
        mobile: cleanMobile,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Incorrect OTP. Please check the code sent to your phone.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "OTP verification error." },
      { status: 500 }
    );
  }
}
