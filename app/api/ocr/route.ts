import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import { z } from "zod";
import { requireApiRole } from "../../lib/dal";

// ~6 MB image once base64 is decoded
const ocrSchema = z.object({
  image: z.string().min(100, "Missing 'image' field. Provide base64-encoded document image.").max(8_000_000, "Image too large (max ~6 MB)"),
  language: z.enum(["hin+eng", "eng", "hin", "mar+eng"]).default("hin+eng"),
});

/**
 * POST /api/ocr — 7/12 Khatauni Document OCR Endpoint
 * 
 * Accepts a base64-encoded image of a land record document (7/12 extract, Khatauni, Jamabandi)
 * and extracts structured text using Tesseract OCR with Hindi + English language support.
 * 
 * Request body:
 * {
 *   "image": "data:image/jpeg;base64,...",  // Base64 encoded document image
 *   "language": "hin+eng"                    // OCR language (default: Hindi + English)
 * }
 */
export async function POST(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  try {
    const parsed = ocrSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    const { image, language } = parsed.data;

    // Extract base64 data from data URI if present
    const base64Data = image.includes("base64,")
      ? image.split("base64,")[1]
      : image;

    const imageBuffer = Buffer.from(base64Data, "base64");

    // Run Tesseract OCR
    const result = await Tesseract.recognize(imageBuffer, language, {
      logger: () => {}, // Suppress progress logs in production
    });

    const rawText = result.data.text;
    const confidence = result.data.confidence;

    // Extract structured fields from the OCR text
    const extractedFields = extractKhatauniFields(rawText);

    return NextResponse.json({
      success: true,
      ocr: {
        rawText,
        confidence: Math.round(confidence),
        language,
        extractedFields,
        wordsDetected: (result.data as any).words?.length || 0,
      },
      metadata: {
        engine: "Tesseract.js v5",
        processedAt: new Date().toISOString(),
        documentType: "7/12 Extract / Khatauni / Jamabandi",
      },
    });
  } catch (error: any) {
    console.error("OCR processing error:", error);
    return NextResponse.json(
      { error: "OCR processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Attempts to extract structured fields from the raw OCR text of a 7/12 or Khatauni document.
 * These documents typically contain: survey number, owner name, area, village, taluka, district.
 */
function extractKhatauniFields(text: string): Record<string, string | null> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Pattern matchers for common 7/12 extract fields
  const surveyNoMatch = text.match(/(?:गट|सर्वे|Survey|Gat)\s*(?:नं|No|Number|क्र)[.:]*\s*(\d+[/\-\w]*)/i);
  const areaMatch = text.match(/(?:क्षेत्रफल|Area|Hectare|एकड़|Acres?)[.:]*\s*([\d.]+)/i);
  const ownerMatch = text.match(/(?:मालिक|Owner|खातेदार|Khatedar|Name)[.:]*\s*([^\n,]+)/i);
  const villageMatch = text.match(/(?:गांव|Village|ग्राम|Gram)[.:]*\s*([^\n,]+)/i);
  const talukaMatch = text.match(/(?:तालुका|Taluka|तहसील|Tehsil)[.:]*\s*([^\n,]+)/i);
  const districtMatch = text.match(/(?:जिला|District|ज़िला)[.:]*\s*([^\n,]+)/i);
  const cropMatch = text.match(/(?:फसल|Crop|पीक|Pik)[.:]*\s*([^\n,]+)/i);

  return {
    surveyNumber: surveyNoMatch?.[1]?.trim() || null,
    ownerName: ownerMatch?.[1]?.trim() || null,
    area: areaMatch?.[1]?.trim() || null,
    village: villageMatch?.[1]?.trim() || null,
    taluka: talukaMatch?.[1]?.trim() || null,
    district: districtMatch?.[1]?.trim() || null,
    crop: cropMatch?.[1]?.trim() || null,
    totalLinesDetected: String(lines.length),
  };
}
