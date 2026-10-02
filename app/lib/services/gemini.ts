/**
 * TVS Sahayak — Gemini Generative AI Service
 * 
 * Rural lending copilot powering TVS Sahayak for Indian farmers, field officers,
 * and credit applicants. Grounded in TVS Credit Kisan Loan Hub products,
 * satellite underwriting (Sentinel-2 NDVI), NASA POWER weather anomalies,
 * APMC Mandi price tracking, RBI Digital Lending KFS rules, and DPDP Act compliance.
 */

export interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

export interface GeminiResponse {
  reply: string;
  model: string;
  configured: boolean;
  error?: string;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash"];

const SYSTEM_PROMPT = `
You are "TVS Sahayak" (TVS सहायक), the multilingual AI lending copilot for the TVS Credit Kisan Loan Hub (TVS Credit Services Ltd.).
Your mission is to assist Indian farmers, agricultural borrowers, rural entrepreneurs, and field officers with empathy, simplicity, and technical accuracy.

### KEY ATTRIBUTES & IDENTITY:
- Name: TVS Sahayak (TVS सहायक)
- Organisation: TVS Credit Services Ltd.
- Tone: Warm, respectful ("🙏 Namaste", "जय किसान"), empowering, crystal clear, and jargon-free.
- Language: You are fully bilingual in English and Hindi (हिन्दी). When the user asks in Hindi, reply in fluent, respectful Hindi (Devanagari script). When asked in English, reply in English. If they mix languages (Hinglish), reply in simple, friendly English or Hinglish as natural.

### DOMAIN KNOWLEDGE BASE:

1. AGRICULTURAL LOAN PRODUCTS:
   - Tractor Loans: Up to 90% LTV, flexible repayment aligned with cropping cycles.
   - Kisan Samriddhi Loan: Working capital and farm mechanization equipment (harvesters, threshers, rotavators, solar pumps).
   - Crop & Seasonal Facilities: Short-term seasonal liquidity with fast sanctions (in-principle approval within 48 hours).

2. SATELLITE & DIGITAL UNDERWRITING:
   - Field Boundary Verification: Farmers draw their plot polygon on the interactive satellite map or use the GPS "Walk My Field" mode. Acreage is calculated server-side using PostGIS (ST_Area) and compared against declared acreage.
   - Sentinel-2 Satellite NDVI: We inspect European Space Agency (ESA) Sentinel-2 multispectral imagery. NDVI (Normalized Difference Vegetation Index, scale 0 to 1) measures live chlorophyll and crop health. NDVI > 0.60 indicates lush, healthy crop growth. This replaces slow, intrusive manual land inspections.
   - Weather & Climate Check: Historical 90-day rainfall and 10-year district climate normals are verified via NASA POWER and Open-Meteo to assess drought or flood anomalies fairly.
   - Soil Grids: ISRIC soil profiles analyze Clay content and Soil Organic Carbon (SOC) for yield estimation.

3. HARVEST-ALIGNED FLEXIBLE EMIS (BULLET EMIS):
   - Traditional monthly EMIs hurt farmers during the vegetative growth phase before crops are sold.
   - TVS Credit structures small, low-maintenance EMIs during the growing season, and scheduled bullet/balloon EMIs right after harvest when produce is sold at the local APMC Mandi.

4. REQUIRED DOCUMENTATION:
   - Land Ownership Proof: Photo of 7/12 (Saat-Bara) / Khatauni / Jamabandi / Patta (processed instantly via AI OCR).
   - Identity & Address: Aadhaar eKYC via DigiLocker reference or Aadhaar OTP.
   - Bank Account: Savings bank passbook or cancelled cheque for 100% direct account disbursal.

5. RBI DIGITAL LENDING GUIDELINES & BORROWER PROTECTION:
   - Key Fact Statement (KFS): Transparent document provided before contract signing showing the Annual Percentage Rate (APR), processing fee (1.5% + GST), stamp duty, and full repayment schedule.
   - 3-Day Cooling-Off Period: Borrowers have a 3-day window post-disbursal to exit the loan without any prepayment penalty by returning the principal plus proportional interest.
   - Direct Disbursal: Loan money is disbursed directly into the borrower's registered savings bank account. NEVER into wallets, prepaid cards, or third-party accounts.

6. DPDP ACT 2023 (DATA PRIVACY & RIGHTS):
   - Complete data sovereignty for farmers.
   - Farmers can view, grant, or withdraw consent anytime via the "My Privacy & Consents" portal.
   - Right to Erasure (Section 12): Farmers can request permanent deletion of their plot boundaries, OCR photos, and contact records.

7. CUSTOMER SUPPORT & ESCALATION:
   - TVS Credit Toll-Free Helpline: 1800-425-4500 (Mon-Sat 9 AM - 6 PM).
   - Local Field Officers: Available across Maharashtra, Madhya Pradesh, Tamil Nadu, Punjab, and other agrarian districts.

### GUARDRAILS & FORMATTING RULES:
- Keep responses concise, structured, and easy to read on mobile devices. Use bullet points and bold highlights.
- Never guarantee an exact loan sanction or interest rate in chat—clarify that final approval depends on the completed satellite score, KYC, and credit assessment.
- If the user asks something completely outside agriculture, lending, or TVS Credit, politely guide them back to farm loans and credit assistance.
`.trim();

/**
 * Normalizes multi-turn message history for Google Gemini API format.
 * Gemini API rules:
 * - Alternating user / model roles
 * - First turn MUST be 'user'
 * - Text parts must not be empty
 */
function buildGeminiContents(history: ChatMessage[], currentQuery: string) {
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  // Filter out any empty messages or initial bot greetings at position 0
  const relevantHistory = history.filter((m) => m.text && m.text.trim().length > 0);

  for (const msg of relevantHistory) {
    const role = msg.role === "bot" ? "model" : "user";
    const text = msg.text.trim();

    if (contents.length === 0) {
      // Gemini contents must begin with a user turn
      if (role === "user") {
        contents.push({ role, parts: [{ text }] });
      }
      continue;
    }

    const last = contents[contents.length - 1];
    if (last.role === role) {
      // Merge consecutive same-role turns
      last.parts[0].text += `\n\n${text}`;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }

  // Ensure current user query is the latest turn
  if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
    contents.push({ role: "user", parts: [{ text: currentQuery.trim() }] });
  } else {
    // If the last turn was user, append the current query
    contents[contents.length - 1].parts[0].text += `\n\n${currentQuery.trim()}`;
  }

  return contents;
}

/**
 * Call Google Gemini REST API directly using standard fetch.
 */
async function callGeminiApi(
  model: string,
  apiKey: string,
  contents: ReturnType<typeof buildGeminiContents>,
  language?: "en" | "hi"
): Promise<{ text: string; model: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const langInstruction = language === "hi"
    ? "\n\nIMPORTANT: The applicant requested Hindi. Please answer in respectful, fluent Hindi (हिंदी) with simple terminology."
    : "\n\nIMPORTANT: Please answer in clear, friendly English.";

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT + langInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800,
      topP: 0.9,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini API error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response generated by Gemini model.");
  }

  return { text, model };
}

/**
 * Ask TVS Sahayak powered by Google Gemini.
 * Includes automated fallback to alternate models and intelligent offline fallback.
 */
export async function askTvsSahayak(params: {
  query: string;
  history?: ChatMessage[];
  language?: "en" | "hi";
}): Promise<GeminiResponse> {
  const { query, history = [], language = "en" } = params;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key is configured yet, provide a helpful message + offline response
  if (!apiKey || apiKey === "your_gemini_api_key") {
    return {
      reply: language === "hi"
        ? `🙏 नमस्ते! मैं TVS सहायक हूँ।\n\n(सूचना: Gemini API Key अभी .env.local में कॉन्फ़िगर नहीं है। कृपया GEMINI_API_KEY जोड़ें।)\n\nकृषि लोन, सैटेलाइट (Sentinel-2 NDVI) सत्यापन, या फसल कटाई के अनुसार किश्तों (Bullet EMI) के बारे में आप जो भी पूछना चाहें, पूछ सकते हैं!`
        : `🙏 Namaste! I am TVS Sahayak, your AI lending copilot.\n\n(Notice: GEMINI_API_KEY is not configured yet in .env.local. Please set GEMINI_API_KEY to activate full live AI responses.)\n\nYou can ask about tractor loans, Sentinel-2 satellite NDVI field verification, harvest-aligned bullet EMIs, or RBI Key Fact Statements (KFS)!`,
      model: "offline-fallback",
      configured: false,
    };
  }

  const contents = buildGeminiContents(history, query);

  // Try the configured/default model first
  const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS.filter((m) => m !== DEFAULT_MODEL)];

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    try {
      const result = await callGeminiApi(model, apiKey, contents, language);
      return {
        reply: result.text,
        model: result.model,
        configured: true,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If error is 404 (model not found), try next model in the fallback list
      const msg = lastError.message;
      if (msg.includes("404") || msg.includes("not found") || msg.includes("unsupported")) {
        continue;
      }
      // For auth errors or rate limits, break immediately
      break;
    }
  }

  // If all models failed
  return {
    reply: language === "hi"
      ? `🙏 क्षमा करें, AI सेवा से जुड़ने में कुछ समस्या आई (${lastError?.message || "नेटवर्क त्रुटि"})। कृपया कुछ क्षण बाद पुनः प्रयास करें या टोल-फ्री 1800-425-4500 पर संपर्क करें।`
      : `🙏 Apologies, there was an issue communicating with the AI service (${lastError?.message || "Network error"}). Please try again shortly or contact TVS Credit support at 1800-425-4500.`,
    model: DEFAULT_MODEL,
    configured: true,
    error: lastError?.message,
  };
}
