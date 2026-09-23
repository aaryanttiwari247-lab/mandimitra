import { NextResponse } from "next/server";
import { sendOtpSms, sanitizeMobileNumber } from "@/lib/sms-service";

// Global server-side store of recently dispatched OTPs per mobile number
const globalForOtps = globalThis as unknown as {
  __mandiMitraOtpStore?: Record<
    string,
    { currentOtp: string; validOtps: string[]; lastSentAt: number }
  >;
};

if (!globalForOtps.__mandiMitraOtpStore) {
  globalForOtps.__mandiMitraOtpStore = {};
}

export function getValidServerOtps(mobile: string): string[] {
  const clean = sanitizeMobileNumber(mobile);
  const entry = globalForOtps.__mandiMitraOtpStore?.[clean];
  if (!entry) return [];
  // Expire after 15 minutes
  if (Date.now() - entry.lastSentAt > 15 * 60 * 1000) return [];
  return entry.validOtps || [entry.currentOtp];
}

export function recordServerOtp(mobile: string, otp: string) {
  const clean = sanitizeMobileNumber(mobile);
  if (!globalForOtps.__mandiMitraOtpStore) {
    globalForOtps.__mandiMitraOtpStore = {};
  }
  const existing = globalForOtps.__mandiMitraOtpStore[clean];
  const validOtps = existing
    ? Array.from(new Set([otp, ...existing.validOtps])).slice(0, 5)
    : [otp];

  globalForOtps.__mandiMitraOtpStore[clean] = {
    currentOtp: otp,
    validOtps,
    lastSentAt: Date.now(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile, aadhaar, isResend } = body;

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

    // Check if an OTP was already sent in the last 45 seconds (prevent duplicate generation on double-clicks)
    const existingEntry = globalForOtps.__mandiMitraOtpStore?.[cleanMobile];
    const isRecent = existingEntry && Date.now() - existingEntry.lastSentAt < 45 * 1000;

    let otp: string;
    if (!isResend && isRecent && existingEntry?.currentOtp) {
      // Reuse existing active OTP to prevent out-of-sync display vs mobile
      otp = existingEntry.currentOtp;
    } else {
      // Generate guaranteed 6-digit numeric OTP
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      recordServerOtp(cleanMobile, otp);
    }

    // Dispatch SMS via live gateway (Fast2SMS / Twilio) or local simulation
    const smsResult = await sendOtpSms(cleanMobile, otp);

    const maskedMobile = `+91 ${cleanMobile.slice(0, 2)}******${cleanMobile.slice(-2)}`;

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully via SMS to ${maskedMobile}`,
      mobile: cleanMobile,
      maskedMobile,
      otp, // Exactly what was dispatched to Fast2SMS and mobile
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
