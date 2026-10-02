// Turn spoken English / Hindi into form values. Pure functions (unit-testable).
// Speech engines often return a mix of digits and words ("3 लाख 50 हज़ार"),
// so both are handled.

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

const HINDI_UNITS = [
  "शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
  "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
  "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
  "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस",
  "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास",
  "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
  "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर",
  "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी",
  "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी",
  "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे",
];

const EN_UNITS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const WORD_VALUES: Record<string, number> = {
  ...Object.fromEntries(HINDI_UNITS.map((w, i) => [w, i])),
  ...Object.fromEntries(EN_UNITS.map((w, i) => [w, i])),
  ...EN_TENS,
  // common spelling variants ("oh" as zero in phone numbers). Short Hinglish words
  // like "do"/"ek" are deliberately excluded: they collide with English words.
  पांच: 5, छः: 6, छे: 6, पन्द्रह: 15, oh: 0,
};

const MULTIPLIERS: Record<string, number> = {
  hundred: 100, सौ: 100, sau: 100,
  thousand: 1e3, हज़ार: 1e3, हजार: 1e3, hazaar: 1e3, hazar: 1e3,
  lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, लाख: 1e5,
  million: 1e6,
  crore: 1e7, crores: 1e7, करोड़: 1e7, करोड: 1e7,
};

// Fraction words that modify the next number: साढ़े 3 = 3.5, सवा 2 = 2.25, पौने 2 = 1.75
const PREFIX_ADJUST: Record<string, number> = { साढ़े: 0.5, साढे: 0.5, sadhe: 0.5, सवा: 0.25, sawa: 0.25, पौने: -0.25, paune: -0.25 };
// Standalone fraction numbers
const FRACTIONS: Record<string, number> = { डेढ़: 1.5, डेढ: 1.5, dedh: 1.5, ढाई: 2.5, dhai: 2.5, half: 0.5, आधा: 0.5 };
const DECIMAL_POINT = new Set(["point", "दशमलव", "पॉइंट", "प्वाइंट"]);

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
    .replace(/(\d),(?=\d)/g, "$1") // 3,50,000 → 350000
    .replace(/₹|rs\.?|rupees?|रुपये|रुपए|रूपए/g, " ")
    .replace(/[^\p{L}\p{M}\d.\s-]/gu, " ")
    .replace(/-/g, " ")
    .trim();
}

function tokenValue(tok: string): number | undefined {
  if (/^\d+(\.\d+)?$/.test(tok)) return parseFloat(tok);
  return WORD_VALUES[tok] ?? FRACTIONS[tok];
}

/**
 * Parse a spoken amount / quantity: "साढ़े तीन लाख" → 350000, "two point five" → 2.5,
 * "3 लाख 50 हज़ार" → 350000, "ढाई एकड़" → 2.5. Returns null if no number is found.
 */
export function parseSpokenNumber(text: string): number | null {
  const tokens = normalise(text).split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let found = false;
  let adjust = 0;
  let decimalDigits: string | null = null;

  for (const tok of tokens) {
    if (DECIMAL_POINT.has(tok)) {
      decimalDigits = "";
      continue;
    }
    if (tok in PREFIX_ADJUST) {
      adjust = PREFIX_ADJUST[tok];
      continue;
    }
    const mult = MULTIPLIERS[tok];
    if (mult) {
      found = true;
      if (decimalDigits !== null) {
        current += decimalDigits ? parseFloat(`0.${decimalDigits}`) : 0;
        decimalDigits = null;
      }
      if (current === 0) current = 1;
      if (mult === 100) current *= 100;
      else {
        total += current * mult;
        current = 0;
      }
      continue;
    }
    const v = tokenValue(tok);
    if (v === undefined) continue;
    found = true;
    if (decimalDigits !== null) {
      decimalDigits += String(v);
      continue;
    }
    current += v + adjust;
    adjust = 0;
  }
  if (!found) return null;
  if (decimalDigits) current += parseFloat(`0.${decimalDigits}`);
  return Math.round((total + current) * 100) / 100;
}

/** Digit sequence for phone numbers / pincodes: "नौ आठ 2 3…" → "9823…". */
export function parseSpokenDigits(text: string): string {
  return normalise(text)
    .split(/\s+/)
    .map((tok) => {
      if (/^\d+$/.test(tok)) return tok;
      const v = WORD_VALUES[tok];
      return v !== undefined && v < 10 ? String(v) : "";
    })
    .join("");
}

export interface VoiceOption {
  value: string;
  /** Words a farmer might say for this option (English, Hindi, Hinglish). */
  synonyms: string[];
}

/** First option whose synonym appears in any of the recognised alternatives. */
export function matchSpokenOption(alternatives: string[], options: VoiceOption[]): string | null {
  for (const alt of alternatives) {
    const text = normalise(alt);
    for (const opt of options) {
      if (opt.synonyms.some((s) => text.includes(s.toLowerCase()))) return opt.value;
    }
  }
  return null;
}

export const CROP_OPTIONS: VoiceOption[] = [
  { value: "Cotton (Bt)", synonyms: ["cotton", "कपास", "कॉटन", "रूई", "kapas"] },
  { value: "Wheat (Sharbati)", synonyms: ["wheat", "गेहूं", "गेहूँ", "गेंहू", "gehu", "gehun"] },
  { value: "Paddy / Rice (Samba)", synonyms: ["paddy", "rice", "धान", "चावल", "dhan", "chawal"] },
  { value: "Soybean (JS-335)", synonyms: ["soybean", "soya", "सोयाबीन", "सोया"] },
  { value: "Sugarcane (Co 0238)", synonyms: ["sugarcane", "गन्ना", "ईख", "ganna"] },
];

export const IRRIGATION_OPTIONS: VoiceOption[] = [
  { value: "Drip Micro-Irrigation", synonyms: ["drip", "sprinkler", "ड्रिप", "टपक", "स्प्रिंकलर", "फव्वारा"] },
  { value: "Perennial Canal", synonyms: ["canal", "नहर", "nahar"] },
  { value: "Borewell & Rainfed", synonyms: ["borewell", "bore", "tubewell", "बोरवेल", "ट्यूबवेल", "नलकूप", "बोर"] },
  { value: "Strictly Rainfed", synonyms: ["rainfed", "rain", "बारिश", "वर्षा", "बरसात", "असिंचित", "baarish"] },
];
