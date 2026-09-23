import { NextResponse } from "next/server";
import {
  dispatchSms,
  getStoredSmsLogs,
  getActiveSmsProvider,
  SmsNotificationType,
} from "@/lib/sms-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get("mobile") || undefined;
    const logs = getStoredSmsLogs(mobile);
    const activeProvider = getActiveSmsProvider();

    return NextResponse.json({
      success: true,
      activeProvider,
      totalCount: logs.length,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch SMS logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, message, type = "FARMER_OTP", metadata } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields 'to' or 'message'" },
        { status: 400 }
      );
    }

    const result = await dispatchSms({
      to,
      message,
      type: type as SmsNotificationType,
      metadata,
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      sms: result.smsRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to dispatch SMS" },
      { status: 500 }
    );
  }
}
