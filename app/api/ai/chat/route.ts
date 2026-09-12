import { NextRequest, NextResponse } from "next/server";
import {
  smartRuleEngine,
  FarmerChatContext,
} from "@/lib/ai-assistant-tools";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      farmerId,
      farmerName,
      farmerMobile,
      activeBooking,
      language = "hi",
      isLoggedIn = false,
    } = body;

    const actuallyLoggedIn = Boolean(isLoggedIn && (farmerMobile || farmerId));

    const context: FarmerChatContext = {
      farmerId: actuallyLoggedIn ? (farmerId || activeBooking?.farmerId) : undefined,
      farmerName: actuallyLoggedIn ? (farmerName || activeBooking?.farmerName) : undefined,
      farmerMobile: actuallyLoggedIn ? (farmerMobile || activeBooking?.farmerMobile) : undefined,
      activeBooking: actuallyLoggedIn ? activeBooking : null,
      language,
      isLoggedIn: actuallyLoggedIn,
    };

    const userMessages = (messages as Array<{ role: string; content: string }>).filter(
      (m) => m.role === "user" && typeof m.content === "string" && m.content.trim().length > 0
    );

    const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

    // Deterministic Smart Rule Engine (Zero External API Key / 8 Multilingual Languages)
    const result = smartRuleEngine(lastUserMessage, context, language);
    return NextResponse.json({
      text: result.text,
      menuOptions: result.menuOptions || [],
      demoMode: true,
      toolUsed: result.toolUsed,
    });
  } catch (error: any) {
    console.error("AI Assistant chat error:", error);
    return NextResponse.json(
      {
        text: "MandiMitra सहायक इस समय व्यस्त है। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
        error: error?.message || "Internal error",
        demoMode: true,
      },
      { status: 200 }
    );
  }
}
