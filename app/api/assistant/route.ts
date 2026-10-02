import { NextResponse } from "next/server";
import { z } from "zod";
import { askTvsSahayak, type ChatMessage } from "../../lib/services/gemini";

/**
 * TVS Sahayak Assistant Route Handler
 * 
 * POST /api/assistant
 * Powers the multilingual AI chat assistant using Google Gemini API.
 */

const assistantRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  messages: z
    .array(
      z.object({
        role: z.enum(["bot", "user"]),
        text: z.string().max(4000),
      })
    )
    .optional()
    .default([]),
  language: z.enum(["en", "hi"]).optional().default("en"),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = assistantRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const { message, messages, language } = parsed.data;

    const result = await askTvsSahayak({
      query: message,
      history: messages as ChatMessage[],
      language,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal assistant error";
    return NextResponse.json(
      {
        error: "Failed to generate assistant response",
        details: message,
        reply: "🙏 TVS Sahayak is temporarily unavailable. Please retry in a few moments or call 1800-425-4500.",
        configured: Boolean(process.env.GEMINI_API_KEY),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const configured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return NextResponse.json({
    service: "TVS Sahayak Copilot",
    provider: "Google Gemini",
    model,
    configured,
    features: [
      "Sentinel-2 NDVI Satellite Underwriting",
      "NASA POWER Weather & Rainfall Anomalies",
      "APMC Mandi Price Alignment",
      "Harvest-Aligned Bullet EMI Scheduling",
      "RBI Digital Lending KFS Compliance",
      "DPDP Act Consent & Erasure",
      "Multilingual Hindi & English Audio/Text",
    ],
  });
}
