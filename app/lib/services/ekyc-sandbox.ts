// eKYC Sandbox Verification Service
// Simulates Aadhaar eKYC / DigiLocker / PAN verification flows
// Phase 2.6: Sandbox mode — clearly labeled as "SANDBOX" in all responses
// Note: Real Setu/Digio integration requires paid API keys

import { maskAadhaar, maskPAN } from "../pii";

export interface EkycVerificationResult {
  verified: boolean;
  mode: "SANDBOX";
  provider: string;
  aadhaarRef: string; // Always masked: XXXX-XXXX-1234
  panRef: string; // Always masked: XXXXX****X
  nameMatch: boolean;
  nameMatchPct: number;
  addressExtracted: string;
  photoAvailable: boolean;
  verifiedAt: string;
  disclaimers: string[];
}

export interface DigiLockerResult {
  connected: boolean;
  mode: "SANDBOX";
  documentsFound: string[];
  landRecordAvailable: boolean;
  aadhaarLinked: boolean;
  verifiedAt: string;
}

export interface BankVerificationResult {
  verified: boolean;
  mode: "SANDBOX";
  accountHolderName: string;
  bankName: string;
  ifsc: string;
  accountNumberMasked: string;
  nameMatchPct: number;
  verifiedAt: string;
}

/**
 * Simulated Aadhaar eKYC verification (Sandbox mode)
 * In production, this would call Setu/Digio API with real credentials
 */
export function verifyAadhaarEkyc(
  aadhaarNumber: string,
  applicantName: string
): EkycVerificationResult {
  const maskedAadhaar = maskAadhaar(aadhaarNumber);

  // Simulate name matching (85-98% match range for sandbox)
  const nameMatchPct = 88 + Math.floor(Math.random() * 10);

  return {
    verified: true,
    mode: "SANDBOX",
    provider: "Setu AA Gateway (Sandbox Environment)",
    aadhaarRef: maskedAadhaar,
    panRef: "XXXXX****X",
    nameMatch: nameMatchPct >= 80,
    nameMatchPct,
    addressExtracted: "Village/Gram — as registered in UIDAI database",
    photoAvailable: true,
    verifiedAt: new Date().toISOString(),
    disclaimers: [
      "⚠️ SANDBOX MODE: This is a simulated eKYC verification",
      "Production deployment requires Setu/Digio paid API credentials",
      "No real Aadhaar data is accessed or stored",
      "Compliant with UIDAI guidelines — masked reference only",
    ],
  };
}

/**
 * Simulated DigiLocker document fetch (Sandbox mode)
 */
export function verifyDigiLocker(applicantName: string): DigiLockerResult {
  return {
    connected: true,
    mode: "SANDBOX",
    documentsFound: [
      "Aadhaar Card",
      "PAN Card",
      "7/12 Extract (Land Record)",
      "Kisan Credit Card Statement",
    ],
    landRecordAvailable: true,
    aadhaarLinked: true,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Simulated bank account verification (Sandbox mode)
 */
export function verifyBankAccount(
  accountNumber: string,
  ifsc: string,
  applicantName: string
): BankVerificationResult {
  const nameMatchPct = 90 + Math.floor(Math.random() * 8);
  const lastFour = accountNumber.slice(-4) || "0000";

  return {
    verified: true,
    mode: "SANDBOX",
    accountHolderName: applicantName,
    bankName: "State Bank of India",
    ifsc: ifsc || "SBIN0001234",
    accountNumberMasked: `XXXXXXXX${lastFour}`,
    nameMatchPct,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Combined eKYC status for an application (all sandbox)
 */
export function getEkycSummary(applicantName: string, aadhaarNumber?: string) {
  return {
    aadhaar: verifyAadhaarEkyc(aadhaarNumber || "XXXXXXXXXXXX", applicantName),
    digilocker: verifyDigiLocker(applicantName),
    overallStatus: "VERIFIED_SANDBOX" as const,
    sandboxBadge: {
      visible: true,
      text: "🏷️ Sandbox Mode",
      description: "eKYC verification running in sandbox environment. Production requires Setu/Digio API credentials.",
      color: "#f59e0b", // amber
    },
  };
}
