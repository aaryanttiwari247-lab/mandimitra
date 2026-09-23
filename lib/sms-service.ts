/**
 * MandiMitra SMS & Notification Engine
 * Supports:
 * 1. Live Indian SMS Gateway (Fast2SMS API)
 * 2. Global SMS Gateway (Twilio API)
 * 3. Custom Webhook Gateway (SMS_WEBHOOK_URL)
 * 4. In-Memory & Cross-Tab Browser Simulation (Instant testing without API keys)
 */

import { Booking, BookingStatus } from "./types";
import { broadcastProcurementUpdate } from "./cross-tab-sync";

export type SmsNotificationType =
  | "FARMER_OTP"
  | "BOOKING_CONFIRMED"
  | "TOKEN_CALLED"
  | "DOCS_VERIFIED"
  | "PROCUREMENT_COMPLETED"
  | "BOOKING_CANCELLED";

export interface SmsRecord {
  id: string;
  to: string;
  senderId: string;
  type: SmsNotificationType;
  message: string;
  status: "DELIVERED" | "SENT" | "SIMULATED" | "FAILED";
  provider: "FAST2SMS" | "TWILIO" | "WEBHOOK" | "SIMULATED";
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: "FAST2SMS" | "TWILIO" | "WEBHOOK" | "SIMULATED";
  status: "DELIVERED" | "SENT" | "SIMULATED" | "FAILED";
  error?: string;
  smsRecord: SmsRecord;
}

// Global server-side fallback store for recent SMS messages
const globalForSms = globalThis as unknown as { __mandiMitraSmsLogs?: SmsRecord[] };
if (!globalForSms.__mandiMitraSmsLogs) {
  globalForSms.__mandiMitraSmsLogs = [];
}

const SMS_STORAGE_KEY = "smart_procurement_sms_history";

/**
 * Retrieve recent SMS records (latest first)
 */
export function getStoredSmsLogs(filterMobile?: string): SmsRecord[] {
  let logs: SmsRecord[] = [];
  if (typeof window === "undefined") {
    logs = globalForSms.__mandiMitraSmsLogs || [];
  } else {
    try {
      const raw = localStorage.getItem(SMS_STORAGE_KEY);
      logs = raw ? JSON.parse(raw) : [];
    } catch {
      logs = [];
    }
  }

  if (filterMobile) {
    const cleanFilter = filterMobile.replace(/\D/g, "").slice(-10);
    return logs.filter((log) => {
      const cleanTo = log.to.replace(/\D/g, "").slice(-10);
      return cleanTo === cleanFilter;
    });
  }

  return logs;
}

/**
 * Save an SMS record to history
 */
export function saveSmsRecord(record: SmsRecord) {
  if (typeof window === "undefined") {
    const current = globalForSms.__mandiMitraSmsLogs || [];
    current.unshift(record);
    globalForSms.__mandiMitraSmsLogs = current.slice(0, 50);
    return;
  }

  try {
    const logs = getStoredSmsLogs();
    logs.unshift(record);
    localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));

    // Emit browser-level notification event for instant live UI popups
    window.dispatchEvent(
      new CustomEvent("mandimitra_sms_received", { detail: record })
    );
  } catch (err) {
    console.warn("Failed to save SMS record to localStorage:", err);
  }
}

/**
 * Sanitize 10-digit mobile number for Indian SMS delivery (+91)
 */
export function sanitizeMobileNumber(mobile: string): string {
  const digits = String(mobile).replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Check which SMS gateway is currently configured
 */
export function getActiveSmsProvider(): {
  provider: "FAST2SMS" | "TWILIO" | "WEBHOOK" | "SIMULATED";
  isLive: boolean;
  name: string;
} {
  const fast2SmsKey = process.env.FAST2SMS_API_KEY || process.env.NEXT_PUBLIC_FAST2SMS_API_KEY;
  if (fast2SmsKey && fast2SmsKey.trim().length > 5) {
    return { provider: "FAST2SMS", isLive: true, name: "Fast2SMS Gateway (Live SMS)" };
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  if (twilioSid && twilioToken) {
    return { provider: "TWILIO", isLive: true, name: "Twilio Gateway (Live SMS)" };
  }

  const webhookUrl = process.env.SMS_WEBHOOK_URL;
  if (webhookUrl && webhookUrl.startsWith("http")) {
    return { provider: "WEBHOOK", isLive: true, name: "Custom SMS Webhook" };
  }

  return { provider: "SIMULATED", isLive: false, name: "In-Browser Simulation (Demo Mode)" };
}

/**
 * Send real SMS via Fast2SMS API
 */
async function sendViaFast2SMS(mobile: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY || process.env.NEXT_PUBLIC_FAST2SMS_API_KEY;
  if (!apiKey) return { success: false, error: "FAST2SMS_API_KEY is not configured" };

  const cleanMobile = sanitizeMobileNumber(mobile);
  const otpMatch = message.match(/\b\d{6}\b/);

  try {
    // 1. If message contains 6-digit OTP, try Fast2SMS dedicated OTP route
    if (otpMatch) {
      const otpCode = otpMatch[0];
      const otpRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otpCode,
          numbers: cleanMobile,
        }),
      });

      const otpData = await otpRes.json();
      if (otpData.return === true || otpData.status_code === 200 || (Array.isArray(otpData.message) && otpData.message[0]?.toLowerCase().includes("success"))) {
        return { success: true, messageId: otpData.request_id || `F2S-OTP-${Date.now()}` };
      }

      console.warn("[Fast2SMS OTP Route Warning]:", otpData.message || otpData);
    }

    // 2. Standard Quick SMS Route
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: cleanMobile,
      }),
    });

    const data = await res.json();
    if (data.return === true || data.status_code === 200 || (Array.isArray(data.message) && data.message[0]?.toLowerCase().includes("success"))) {
      return { success: true, messageId: data.request_id || `F2S-${Date.now()}` };
    }

    const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || JSON.stringify(data));
    return { success: false, error: errorMsg };
  } catch (error: any) {
    return { success: false, error: error?.message || "Fast2SMS network error" };
  }
}

/**
 * Send real SMS via Twilio API
 */
async function sendViaTwilio(mobile: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    const toNumber = mobile.startsWith("+") ? mobile : `+91${mobile}`;
    const params = new URLSearchParams();
    params.append("To", toNumber);
    params.append("From", fromNumber);
    params.append("Body", message);

    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const data = await res.json();
    if (res.ok && data.sid) {
      return { success: true, messageId: data.sid };
    }
    return { success: false, error: data.message || "Twilio request failed" };
  } catch (error: any) {
    return { success: false, error: error?.message || "Twilio network error" };
  }
}

/**
 * Send SMS via Custom Webhook
 */
async function sendViaWebhook(mobile: string, message: string, type: SmsNotificationType, metadata?: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const webhookUrl = process.env.SMS_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: "SMS_WEBHOOK_URL not configured" };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: mobile,
        message,
        type,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      return { success: true, messageId: `WH-${Date.now()}` };
    }
    return { success: false, error: `Webhook returned ${res.status}` };
  } catch (error: any) {
    return { success: false, error: error?.message || "Webhook error" };
  }
}

/**
 * Primary SMS Dispatcher
 */
export async function dispatchSms(params: {
  to: string;
  message: string;
  type: SmsNotificationType;
  metadata?: Record<string, any>;
}): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(params.to);
  const activeGateway = getActiveSmsProvider();
  const timestamp = new Date().toISOString();
  const recordId = `SMS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const senderId = "VK-MANDI";

  let status: "DELIVERED" | "SENT" | "SIMULATED" | "FAILED" = "SIMULATED";
  let messageId = recordId;
  let errorMsg: string | undefined = undefined;

  if (activeGateway.provider === "FAST2SMS") {
    const res = await sendViaFast2SMS(cleanMobile, params.message);
    if (res.success) {
      status = "DELIVERED";
      messageId = res.messageId || recordId;
    } else {
      status = "FAILED";
      errorMsg = res.error;
      console.warn(`[SMS] Fast2SMS dispatch failed to ${cleanMobile}:`, res.error);
    }
  } else if (activeGateway.provider === "TWILIO") {
    const res = await sendViaTwilio(cleanMobile, params.message);
    if (res.success) {
      status = "SENT";
      messageId = res.messageId || recordId;
    } else {
      status = "FAILED";
      errorMsg = res.error;
      console.warn(`[SMS] Twilio dispatch failed to ${cleanMobile}:`, res.error);
    }
  } else if (activeGateway.provider === "WEBHOOK") {
    const res = await sendViaWebhook(cleanMobile, params.message, params.type, params.metadata);
    if (res.success) {
      status = "SENT";
      messageId = res.messageId || recordId;
    } else {
      status = "FAILED";
      errorMsg = res.error;
    }
  } else {
    // Simulated mode (Demo)
    status = "SIMULATED";
  }

  const smsRecord: SmsRecord = {
    id: messageId,
    to: cleanMobile,
    senderId,
    type: params.type,
    message: params.message,
    status,
    provider: activeGateway.provider,
    timestamp,
    metadata: params.metadata,
  };

  // Always log to server terminal for clear debugging and proof of delivery
  console.log(`\n======================================================`);
  console.log(`[MandiMitra SMS DISPATCH] (${activeGateway.provider})`);
  console.log(`TO:        +91-${cleanMobile}`);
  console.log(`TYPE:      ${params.type}`);
  console.log(`STATUS:    ${status}`);
  console.log(`TIMESTAMP: ${timestamp}`);
  console.log(`MESSAGE:   ${params.message}`);
  console.log(`======================================================\n`);

  saveSmsRecord(smsRecord);

  // If in browser, trigger cross-tab update
  if (typeof window !== "undefined") {
    try {
      broadcastProcurementUpdate({
        type: "STATUS_UPDATED",
        token: params.metadata?.token,
        bookingId: params.metadata?.bookingId,
        status: params.metadata?.status,
        booking: params.metadata?.booking,
      });
    } catch {}
  }

  return {
    success: status !== "FAILED",
    messageId,
    provider: activeGateway.provider,
    status,
    error: errorMsg,
    smsRecord,
  };
}

// =========================================================================
// HIGH-LEVEL NOTIFICATION HELPERS & TEMPLATES
// =========================================================================

/**
 * 1. Dispatch Farmer Login / Verification OTP
 */
export async function sendOtpSms(mobile: string, otp: string): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(mobile);
  const message = `MandiMitra OTP: Your verification code is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone. - Govt of MP`;

  return dispatchSms({
    to: cleanMobile,
    message,
    type: "FARMER_OTP",
    metadata: { otp, mobile: cleanMobile },
  });
}

/**
 * 2. Dispatch Booking Slot Confirmation SMS
 */
export async function sendBookingConfirmationSms(booking: Booking): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(booking.farmerMobile || "");
  const token = booking.token || `#${booking.tokenNumber || "A101"}`;
  const centre = booking.centre || "Mandi Centre";
  const date = booking.date || "Tomorrow";
  const time = booking.time || "09:00 AM";
  const crop = booking.crop || "Crop";
  const qty = booking.quantity || 0;

  const message = `MandiMitra: Slot Confirmed! Token #${token} for ${qty} Qtl ${crop} at ${centre} on ${date} (${time}). Please arrive 15 mins prior with Aadhaar and Land documents. Track at: /farmer/track-token?token=${encodeURIComponent(token)}`;

  return dispatchSms({
    to: cleanMobile,
    message,
    type: "BOOKING_CONFIRMED",
    metadata: {
      bookingId: booking.bookingId,
      token,
      centre,
      crop,
      quantity: qty,
      date,
      time,
    },
  });
}

/**
 * 3. Dispatch Token Called to Mandi Gate Alert
 */
export async function sendTokenCalledSms(booking: Booking): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(booking.farmerMobile || "");
  const token = booking.token || `#${booking.tokenNumber || ""}`;
  const centre = booking.centre || "Mandi Centre";

  const message = `URGENT - MandiMitra: Token #${token} has been CALLED! Please proceed immediately to Mandi Entry Gate at ${centre} with your loaded vehicle for entry clearance.`;

  return dispatchSms({
    to: cleanMobile,
    message,
    type: "TOKEN_CALLED",
    metadata: {
      bookingId: booking.bookingId,
      token,
      centre,
      status: "CALLED",
    },
  });
}

/**
 * 4. Dispatch Document Verification Successful Alert
 */
export async function sendDocsVerifiedSms(booking: Booking, officerName?: string): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(booking.farmerMobile || "");
  const token = booking.token || `#${booking.tokenNumber || ""}`;
  const centre = booking.centre || "Mandi Centre";
  const officer = officerName || booking.verifiedBy || "Procurement Officer";

  const message = `MandiMitra: Documents for Token #${token} verified successfully by ${officer} at ${centre}. Please proceed to Weighbridge & Quality Testing Bay.`;

  return dispatchSms({
    to: cleanMobile,
    message,
    type: "DOCS_VERIFIED",
    metadata: {
      bookingId: booking.bookingId,
      token,
      centre,
      status: "VERIFIED",
      officer,
    },
  });
}

/**
 * 5. Dispatch Procurement & DBT Payment Completed Alert
 */
export async function sendProcurementCompletedSms(params: {
  booking: Booking;
  netWeightQtl: number;
  cropGrade: string;
  mspPerQtl: number;
  totalPayoutAmount: number;
}): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(params.booking.farmerMobile || "");
  const token = params.booking.token || `#${params.booking.tokenNumber || ""}`;
  const crop = params.booking.crop || "Produce";
  const formattedPayout = `Rs ${Number(params.totalPayoutAmount).toLocaleString("en-IN")}`;
  const formattedRate = `Rs ${Number(params.mspPerQtl).toLocaleString("en-IN")}`;

  const message = `MandiMitra: Procurement Successful! Token #${token}. Net Weight: ${params.netWeightQtl} Qtl ${crop} (${params.cropGrade}) @ ${formattedRate}/Qtl. Payout of ${formattedPayout} processed via Direct Benefit Transfer (DBT) to your Aadhaar-linked bank account.`;

  return dispatchSms({
    to: cleanMobile,
    message,
    type: "PROCUREMENT_COMPLETED",
    metadata: {
      bookingId: params.booking.bookingId,
      token,
      crop,
      cropGrade: params.cropGrade,
      netWeightQtl: params.netWeightQtl,
      mspPerQtl: params.mspPerQtl,
      totalPayoutAmount: params.totalPayoutAmount,
      status: "COMPLETED",
    },
  });
}

/**
 * 6. Dispatch Booking Cancelled Alert
 */
export async function sendBookingCancelledSms(booking: Booking, reason?: string): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(booking.farmerMobile || "");
  const token = booking.token || `#${booking.tokenNumber || ""}`;
  const cancelReason = reason || booking.cancellationReason || "Slot cancelled";

  const message = `MandiMitra: Booking for Token #${token} has been cancelled. Reason: ${cancelReason}. You can book a new slot anytime at the MandiMitra portal.`;

  return dispatchSms({
    to: cleanMobile,
    message,
    type: "BOOKING_CANCELLED",
    metadata: {
      bookingId: booking.bookingId,
      token,
      reason: cancelReason,
      status: "CANCELLED",
    },
  });
}
