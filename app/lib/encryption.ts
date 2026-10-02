// TVS Credit — AES-256-GCM PII Encryption Layer
// Compliant with RBI Digital Lending Guidelines & DPDP Act 2023
// Encrypts phone numbers, Aadhaar, and document references at rest

import crypto from "crypto";

// Key material comes only from the environment. A dev-only fallback keeps local
// demos working; production refuses to run with it.
const DEV_FALLBACK_KEY = "tvs-credit-dev-only-key";
const ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY || DEV_FALLBACK_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the environment variable using SHA-256.
 * This ensures we always have a valid key length regardless of input.
 */
function deriveKey(): Buffer {
  if (ENCRYPTION_KEY === DEV_FALLBACK_KEY && process.env.NODE_ENV === "production") {
    throw new Error("PII_ENCRYPTION_KEY must be set in production");
  }
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string in format: iv:authTag:ciphertext
 * 
 * @example
 * const encrypted = encryptPII("9876543210");
 * // => "a1b2c3...:d4e5f6...:g7h8i9..."
 */
export function encryptPII(plaintext: string): string {
  if (!plaintext) return "";
  
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string back to plaintext.
 * Input must be in format: iv:authTag:ciphertext
 * 
 * @example
 * const phone = decryptPII(encryptedPhone);
 * // => "9876543210"
 */
export function decryptPII(encrypted: string): string {
  if (!encrypted || !encrypted.includes(":")) return encrypted;
  
  try {
    const parts = encrypted.split(":");
    if (parts.length !== 3) return encrypted;
    
    const key = deriveKey();
    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch {
    // If decryption fails (wrong key, corrupted data), return masked version
    return "***ENCRYPTED***";
  }
}

/**
 * Encrypts a phone number for database storage.
 * Returns both the encrypted value and a masked display version.
 */
export function encryptPhone(phone: string): { encrypted: string; masked: string } {
  const clean = phone.replace(/\D/g, "").slice(-10);
  return {
    encrypted: encryptPII(clean),
    masked: `+91 ${clean.slice(0, 2)}XXX X${clean.slice(-4)}`,
  };
}

/**
 * Encrypts an Aadhaar number for database storage.
 * Returns both the encrypted value and a masked display version.
 */
export function encryptAadhaar(aadhaar: string): { encrypted: string; masked: string } {
  const clean = aadhaar.replace(/\D/g, "");
  return {
    encrypted: encryptPII(clean),
    masked: `XXXX-XXXX-${clean.slice(-4)}`,
  };
}

/**
 * Encrypts a document reference/URL for secure storage.
 */
export function encryptDocumentRef(docUrl: string): string {
  return encryptPII(docUrl);
}

/**
 * Decrypts a stored phone number back to plaintext.
 */
export function decryptPhone(encrypted: string): string {
  return decryptPII(encrypted);
}
