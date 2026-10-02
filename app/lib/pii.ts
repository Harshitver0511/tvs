// TVS Credit PII (Personally Identifiable Information) Protection Layer
// Compliant with DPDP Act 2023 & RBI Digital Lending Guidelines

/**
 * Masks a 12-digit Aadhaar number into standard statutory format: XXXX-XXXX-1234
 * Under Aadhaar Regulations and DPDP Act, raw 12-digit Aadhaar numbers must never
 * be stored in plaintext or logged.
 */
export function maskAadhaar(raw: string): string {
  if (!raw) return "XXXX-XXXX-XXXX";
  const clean = raw.replace(/\D/g, "");
  if (clean.length < 4) return "XXXX-XXXX-XXXX";
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * Masks an Indian mobile phone number: +91 XXXXX 98765
 */
export function maskPhone(raw: string): string {
  if (!raw) return "+91 XXXXX XXXXX";
  const clean = raw.replace(/\D/g, "").slice(-10);
  if (clean.length < 5) return "+91 XXXXX XXXXX";
  const last4 = clean.slice(-4);
  const first2 = clean.slice(0, 2);
  return `+91 ${first2}XXX X${last4}`;
}

/**
 * Masks a Bank Account Number: XXXXXXXX1234
 */
export function maskBankAccount(raw: string): string {
  if (!raw) return "XXXXXXXXXXXX";
  const clean = raw.replace(/\s+/g, "");
  if (clean.length < 4) return "XXXXXXXXXXXX";
  const last4 = clean.slice(-4);
  return `XXXXXXXX${last4}`;
}

/**
 * Masks PAN Number: XXXXX1234X
 */
export function maskPAN(raw: string): string {
  if (!raw) return "XXXXXXXXXX";
  const clean = raw.trim().toUpperCase();
  if (clean.length !== 10) return "XXXXXXXXXX";
  return `${clean.slice(0, 5)}****${clean.slice(9)}`;
}

/**
 * Validates whether an Indian mobile number is valid (10 digits starting 6, 7, 8, or 9)
 */
export function isValidIndianMobile(phone: string): boolean {
  const clean = phone.replace(/\D/g, "").slice(-10);
  return /^[6-9]\d{9}$/.test(clean);
}

/**
 * DPDP Purpose Registry definition
 */
export interface DpdpPurpose {
  id: "ekyc" | "satellite_analysis" | "mandi_financial" | "credit_bureau";
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  retentionPeriod: string;
  isMandatoryForCredit: boolean;
}

export const DPDP_PURPOSES: DpdpPurpose[] = [
  {
    id: "ekyc",
    titleEn: "Identity & DigiLocker eKYC Verification",
    titleHi: "पहचान एवं ई-केवाईसी सत्यापन",
    descEn: "Verification of farmer identity, name, and address via DigiLocker / Aadhaar XML reference for regulatory KYC compliance.",
    descHi: "नियामक ई-केवाईसी अनुपालन हेतु डिजीलॉकर/आधार संदर्भ के माध्यम से पहचान और पते का सत्यापन।",
    retentionPeriod: "5 years post-repayment as mandated by PMLA / RBI guidelines",
    isMandatoryForCredit: true,
  },
  {
    id: "satellite_analysis",
    titleEn: "Cadastral Remote Sensing & Land Telemetry",
    titleHi: "सैटेलाइट एवं कृषि-जलवायु विश्लेषण",
    descEn: "Acquisition and processing of Copernicus Sentinel-2 multispectral vegetation index (NDVI), NASA rainfall anomaly, and SoilGrids soil profile for plot creditworthiness.",
    descHi: "कृषि भूमि की उर्वरता और जोखिम मूल्यांकन हेतु कॉपरनिकस उपग्रह (NDVI), नासा वर्षा विश्लेषण और मृदा स्वास्थ्य डेटा का उपयोग।",
    retentionPeriod: "Active loan tenure plus 1 harvest cycle",
    isMandatoryForCredit: true,
  },
  {
    id: "mandi_financial",
    titleEn: "APMC Mandi & Alternative Financial Assessment",
    titleHi: "मंडी भाव एवं वैकल्पिक क्रेडिट मूल्यांकन",
    descEn: "Retrieval of local APMC market modal prices (data.gov.in) and alternative cashflow indicators to structure harvest-aligned EMI schedules.",
    descHi: "फसल कटाई अनुसार किस्त अनुसूची तैयार करने हेतु स्थानीय मंडी भाव और वैकल्पिक वित्तीय प्रवाह का विश्लेषण।",
    retentionPeriod: "Active loan tenure",
    isMandatoryForCredit: true,
  },
];
