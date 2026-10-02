// TVS Credit Request Validation Schemas using Zod
// Mandated under RBI Digital Lending Guidelines & DPDP Act 2023 for strict boundary validation

import { z } from "zod";
import { ASSIGNABLE_ROLES } from "./roles";

// 1. Phone number validation: Indian 10-digit mobile
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number too long")
  .refine(
    (val) => {
      const clean = val.replace(/\D/g, "").slice(-10);
      return /^[6-9]\d{9}$/.test(clean);
    },
    { message: "Must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9" }
  );

// 2. Aadhaar Masked Reference: XXXX-XXXX-1234 or 12 digits
export const aadhaarMaskedSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const clean = val.trim();
      return /^XXXX-XXXX-\d{4}$/.test(clean) || /^\d{12}$/.test(clean);
    },
    { message: "Aadhaar must be provided in masked format: XXXX-XXXX-1234" }
  );

// 3. Coordinate vertex tuple [latitude, longitude]
export const coordinateTupleSchema = z.tuple([
  z.number().min(6.0, "Latitude must be within India bounds").max(38.0, "Latitude must be within India bounds"),
  z.number().min(68.0, "Longitude must be within India bounds").max(98.0, "Longitude must be within India bounds"),
]);

// 4. Polygon schema: at least 3 vertices
export const polygonSchema = z
  .array(coordinateTupleSchema)
  .min(3, "Farm plot boundary must contain at least 3 vertices");

// 5. DPDP Consent Item Schema
export const dpdpConsentItemSchema = z.object({
  purpose: z.enum(["ekyc", "satellite_analysis", "mandi_financial", "credit_bureau"]),
  granted: z.boolean(),
  timestamp: z.string().optional(),
});

// 6. Application Submission Schema
export const applicationSubmitSchema = z.object({
  name: z
    .string()
    .min(2, "Applicant name must be at least 2 characters")
    .max(120, "Applicant name too long")
    // Any script (Hindi names arrive in Devanagari from voice input)
    .regex(/^[\p{L}\p{M}\s.'-]+$/u, "Applicant name can only contain letters, spaces, and standard punctuation"),
  phone: phoneSchema,
  state: z.string().min(2, "State is required").default("Maharashtra"),
  district: z.string().min(2, "District is required").default("Yavatmal"),
  village: z.string().optional().default("Gram"),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits")
    .regex(/^\d{6}$/, "Pincode must contain 6 numeric digits"),
  product: z.string().min(2, "Loan product is required").default("Tractor Loan (50 HP)"),
  requestedAmount: z
    .number()
    .min(10000, "Minimum loan amount is ₹10,000")
    .max(5000000, "Maximum loan amount under priority sector is ₹50,00,000"),
  cropType: z.string().min(2, "Crop type is required").default("Cotton (Bt)"),
  irrigation: z.string().min(2, "Irrigation type is required").default("Borewell"),
  areaAcres: z
    .number()
    .min(0.1, "Field area must be at least 0.1 acres")
    .max(500, "Field area cannot exceed 500 acres"),
  plotPolygon: polygonSchema,
  source: z.enum(["drawn", "gps_walk"]).default("drawn"),
  documentMatchPct: z.number().min(0).max(100).default(95),
  aadhaarMasked: aadhaarMaskedSchema,
  consents: z.array(dpdpConsentItemSchema).min(1, "At least one DPDP consent confirmation is required"),
});

export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;

// 7. OTP Request Schema
export const otpRequestSchema = z.object({
  action: z.literal("request"),
  phone: phoneSchema,
  name: z.string().optional(),
});

// 8. OTP Verify Schema
export const otpVerifySchema = z.object({
  action: z.literal("verify"),
  phone: phoneSchema,
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 numeric digits"),
});

// 9. Credit Officer Override Schema
export const creditOfficerOverrideSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  targetDecision: z.enum(["APPROVED", "CONDITIONAL", "REJECTED"]),
  overrideNote: z
    .string()
    .min(10, "Mandatory RBI audit rationale must be at least 10 characters explaining underwriting basis")
    .max(1000, "Rationale note cannot exceed 1000 characters"),
});

// 10. Consent Grant / Revocation Schemas (subject is always the signed-in user)
const consentPurposeSchema = z.enum(["ekyc", "satellite_analysis", "mandi_financial", "credit_bureau"]);

export const consentGrantSchema = z.object({
  purpose: consentPurposeSchema,
});

export const consentRevokeSchema = z.object({
  purpose: z.enum(["ekyc", "satellite_analysis", "mandi_financial", "credit_bureau"]),
  reason: z.string().optional(),
});

// 11. DPDP Right to Erasure Schema (Section 12)
export const dataErasureSchema = z.object({
  confirmationText: z.literal("DELETE_MY_DATA", {
    message: "Confirmation must match exact string: DELETE_MY_DATA",
  }),
  reason: z.string().optional(),
});

// 12. Staff RBAC administration (admin only)
const districtSchema = z
  .string()
  .trim()
  .min(2, "District must be at least 2 characters")
  .max(100)
  .regex(/^[\p{L}\s.'-]+$/u, "District can only contain letters");

export const roleUpdateSchema = z
  .object({
    userId: z.string().uuid("Invalid user id"),
    role: z.enum(ASSIGNABLE_ROLES),
    district: districtSchema.optional(),
  })
  .refine((v) => v.role !== "field_officer" || !!v.district, {
    message: "Field officers must be assigned a district",
    path: ["district"],
  });

export const staffInviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
    name: z.string().trim().min(2, "Name is required").max(120),
    role: z.enum(["field_officer", "credit_officer"]),
    district: districtSchema.optional(),
  })
  .refine((v) => v.role !== "field_officer" || !!v.district, {
    message: "Field officers must be assigned a district",
    path: ["district"],
  });

// 13. eKYC sandbox request
export const ekycRequestSchema = z.object({
  name: z.string().trim().min(2, "Applicant name is required for eKYC verification").max(120),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$|^XXXX-XXXX-\d{4}$/, "Aadhaar must be 12 digits or masked XXXX-XXXX-1234")
    .optional(),
});
