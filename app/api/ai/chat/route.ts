import { NextRequest, NextResponse } from "next/server";
import {
  AI_TOOL_DECLARATIONS,
  executeTool,
  smartRuleEngine,
  FarmerChatContext,
} from "@/lib/ai-assistant-tools";

const SYSTEM_INSTRUCTION = `You are MandiMitra AI, an intelligent, empathetic, and reliable agricultural procurement companion for Indian farmers.
- Always communicate in simple, respectful, and farmer-friendly language (Hindi, Bengali, or English, matching what the farmer speaks).
- NEVER guess, invent, or hallucinate: token numbers, queue ranks, wait times, weighbridge weights, crop quality grades, MSP rates, or bank DBT payment disbursements.
- ALWAYS invoke the appropriate backend tools whenever a farmer asks about their token, queue position, centres, timings, inspection, or money.
- Only report verified facts returned by backend tools.
- Keep answers direct, supportive, and actionable for farmers.`;

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
    } = body;

    const context: FarmerChatContext = {
      farmerId: farmerId || activeBooking?.farmerId,
      farmerName: farmerName || activeBooking?.farmerName,
      farmerMobile: farmerMobile || activeBooking?.farmerMobile,
      activeBooking,
      language,
    };

    const userMessages = (messages as Array<{ role: string; content: string }>).filter(
      (m) => m.role === "user" && typeof m.content === "string" && m.content.trim().length > 0
    );

    const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If GEMINI_API_KEY is available, execute via Google Gemini with Tool Calling
    if (apiKey) {
      const candidateModels = Array.from(
        new Set([
          process.env.GEMINI_MODEL || "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
        ])
      );

      // Format conversation for Gemini
      const contents = messages.slice(-8).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Convert tool declarations to Gemini format
      const functionDeclarations = AI_TOOL_DECLARATIONS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));

      for (const modelName of candidateModels) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

          let response = await fetch(geminiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
              contents,
              tools: [{ functionDeclarations }],
              tool_config: { function_calling_config: { mode: "AUTO" } },
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const candidate = data.candidates?.[0]?.content;
            const functionCalls = candidate?.parts?.filter((p: any) => p.functionCall);

            if (functionCalls && functionCalls.length > 0) {
              // Execute the requested tool(s)
              const toolResultsParts = [];
              for (const part of functionCalls) {
                const call = part.functionCall;
                const result = executeTool(call.name, call.args || {}, context);
                toolResultsParts.push({
                  functionResponse: {
                    name: call.name,
                    response: { result },
                  },
                });
              }

              // Second turn: send tool results back to Gemini for natural language formulation
              const followupContents = [
                ...contents,
                candidate,
                {
                  role: "user",
                  parts: toolResultsParts,
                },
              ];

              const followupRes = await fetch(geminiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                  contents: followupContents,
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 600,
                  },
                }),
              });

              if (followupRes.ok) {
                const followupData = await followupRes.json();
                const finalText =
                  followupData.candidates?.[0]?.content?.parts?.[0]?.text ||
                  "Record checked successfully.";
                return NextResponse.json({
                  text: finalText,
                  demoMode: false,
                  model: modelName,
                  toolCalls: functionCalls.map((fc: any) => fc.functionCall.name),
                });
              }
            }

            // Direct text without tool call
            const textPart = candidate?.parts?.find((p: any) => p.text)?.text;
            if (textPart) {
              return NextResponse.json({ text: textPart, demoMode: false, model: modelName });
            }
          } else {
            console.warn(`Gemini model ${modelName} returned status ${response.status}. Trying next...`);
          }
        } catch (geminiErr) {
          console.warn(`Gemini API call with ${modelName} failed:`, geminiErr);
        }
      }
    }

    // 2. Deterministic Smart Rule Engine Fallback (Zero-key / Offline)
    const fallback = smartRuleEngine(lastUserMessage, context, language);
    return NextResponse.json({
      text: fallback.text,
      demoMode: true,
      toolUsed: fallback.toolUsed,
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
