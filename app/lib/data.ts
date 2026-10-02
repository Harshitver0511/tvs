// TVS Credit Smart Lending Decision Hub — Types & Live Data Models
// All static mock data has been removed. Data is driven by live database & real APIs.

export interface Applicant {
  id: string;
  /** users.id of the owning farmer (Supabase auth id for self-service applications). */
  farmerId?: string;
  name: string;
  phone: string;
  state: string;
  district: string;
  village: string;
  lat: number;
  lng: number;
  landSizeAcres: number;
  /** Farmer-declared acres; landSizeAcres is the PostGIS-measured value. */
  declaredAreaAcres?: number;
  cropType: string;
  soilType: string;
  irrigation: string;
  loanProduct: string;
  requestedAmount: number;
  bureauStatus: string;
  mandiDistanceKm: number;
  last90DaysRainfallMm: number;
  districtAvgRainfallMm: number;
  rainfallAnomalyPct: number;
  ndviScore: number;
  satelliteVegetationIndex: number[];
  plotPolygon: [number, number][];
  scoring: {
    score: number;
    riskTier: string;
    recommendation: string;
    factors: {
      name: string;
      contribution: number;
      status: "Positive" | "Warning" | "Alert" | "Neutral";
      detail: string;
    }[];
    offer: {
      approvedAmount: number;
      tenureMonths: number;
      flatEmi: number;
      interestRatePct: number;
      harvestEmiSchedule: {
        month: string;
        amount: number;
        type: string;
      }[];
    };
  };
}

export interface EarlyWarning {
  id: string;
  district: string;
  state: string;
  crop: string;
  activeLoansCount: number;
  totalExposureLakhs: number;
  warningType: string;
  severity: "High" | "Medium" | "Low";
  impactDescription: string;
  recommendedAction: string;
}

// Live applicant registry (Empty by default — populated strictly from live DB / Supabase submissions)
export const applicants: Applicant[] = [];

// Live district early warning radar (Populated strictly from real weather & NDVI anomaly cron)
export const earlyWarnings: EarlyWarning[] = [];

export const assistantQA: {
  en: { triggers: string[]; answer: string }[];
  hi: { triggers: string[]; answer: string }[];
} = {
  en: [],
  hi: [],
};
