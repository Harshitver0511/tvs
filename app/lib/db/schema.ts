// Database Schema Definition matching TVS Credit Production Architecture
// Compatible with Postgres + PostGIS and Drizzle ORM

import type { UserRole } from "../roles";
export type { UserRole };
export type ApplicationStatus = "draft" | "submitted" | "scoring" | "decided" | "disbursed";
export type RiskTier = "Very Low" | "Low" | "Low-Medium" | "Medium" | "Elevated" | "High";

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  preferredLang: string;
  createdAt: string;
}

export interface FarmerProfile {
  userId: string;
  state: string;
  district: string;
  village: string;
  pincode: string;
  lgdCode?: string;
}

export interface PlotGeometry {
  type: "Polygon";
  coordinates: [number, number][]; // [lat, lng][]
}

export interface Plot {
  id: string;
  farmerId: string;
  geom: PlotGeometry;
  /** Measured with PostGIS ST_Area (falls back to spherical JS maths without a DB). */
  areaAcres: number;
  /** Area the farmer typed in the form. */
  declaredAreaAcres?: number;
  cropType: string;
  irrigation: string;
  soilType?: string;
  source: "drawn" | "gps_walk";
  documentPhotoUrl?: string;
  documentMatchPct?: number;
  createdAt: string;
}

export interface Application {
  id: string;
  farmerId: string;
  plotId: string;
  product: string;
  requestedAmount: number;
  status: ApplicationStatus;
  bureauStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureSnapshot {
  applicationId: string;
  ndviSeries: number[];
  ndviScore: number;
  cloudFreePct: number;
  rainfallLast90DaysMm: number;
  rainfallDistrictAvgMm: number;
  rainfallAnomalyPct: number;
  forecastRainSum7DaysMm: number;
  soilProperties: {
    type: string;
    clayPct: number;
    socGkg: number;
    ph: number;
  };
  mandi: {
    marketName: string;
    distanceKm: number;
    modalPricePerQtl: number;
    priceTrendPct: number;
  };
  alternativeScore: number;
  fetchedAt: string;
}

export interface DecisionFactor {
  name: string;
  contribution: number;
  status: "Positive" | "Warning" | "Alert" | "Neutral";
  detail: string;
}

export interface HarvestEmiScheduleItem {
  month: string;
  amount: number;
  type: string;
}

export interface Decision {
  applicationId: string;
  score: number;
  riskTier: RiskTier;
  recommendation: string;
  factors: DecisionFactor[];
  offer: {
    approvedAmount: number;
    tenureMonths: number;
    flatEmi: number;
    interestRatePct: number;
    harvestEmiSchedule: HarvestEmiScheduleItem[];
  };
  modelVersion: string;
  decidedBy: string; // "model" | staff user_id
  decidedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: "ekyc" | "satellite_analysis" | "credit_bureau" | "account_aggregator" | "mandi_financial";
  textVersion: string;
  grantedAt: string;
  revokedAt?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  timestamp: string;
}

export interface EarlyWarningRecord {
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
  generatedAt: string;
}
