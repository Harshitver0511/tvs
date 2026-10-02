import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "../../lib/dal";

/**
 * POST /api/ml-score — FastAPI Python ML Service Proxy
 * 
 * Forwards scoring requests to the Python FastAPI geospatial ML microservice
 * running at GEO_ML_SERVICE_URL (default: http://localhost:8000).
 * 
 * This bridges the Next.js frontend with the Python LightGBM/XGBoost + SHAP
 * scoring engine defined in geo-ml/service.py.
 * 
 * If the Python service is unavailable, falls back to the TypeScript scoring engine.
 */

const GEO_ML_URL = process.env.GEO_ML_SERVICE_URL || "http://localhost:8000";

const mlScoreSchema = z.object({
  applicantId: z.string().min(1).max(40),
  cropType: z.string().min(2).max(100).default("Cotton (Bt)"),
  irrigationType: z.string().min(2).max(100).default("Borewell & Rainfed"),
  landSizeAcres: z.number().min(0.1).max(500).default(5.0),
  requestedAmountInr: z.number().min(10000).max(5000000).default(350000),
  ndviMean: z.number().min(-1).max(1).default(0.65),
  rainfallAnomalyPct: z.number().min(-100).max(500).default(-15.0),
  last90dRainfallMm: z.number().min(0).max(10000).default(310),
  soilSocGkg: z.number().min(0).max(500).default(7.8),
  soilClayPct: z.number().min(0).max(100).default(42.0),
  mandiDistanceKm: z.number().min(0).max(1000).default(14.0),
  altDataScore: z.number().min(0).max(1).default(0.88),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["credit_officer", "field_officer", "admin"]);
  if (auth.response) return auth.response;

  try {
    const parsed = mlScoreSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const {
      applicantId,
      cropType = "Cotton (Bt)",
      irrigationType = "Borewell & Rainfed",
      landSizeAcres = 5.0,
      requestedAmountInr = 350000,
      ndviMean = 0.65,
      rainfallAnomalyPct = -15.0,
      last90dRainfallMm = 310,
      soilSocGkg = 7.8,
      soilClayPct = 42.0,
      mandiDistanceKm = 14.0,
      altDataScore = 0.88,
    } = body;

    if (!applicantId) {
      return NextResponse.json(
        { error: "Missing applicantId" },
        { status: 400 }
      );
    }

    // Try calling the Python FastAPI service
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const mlResponse = await fetch(`${GEO_ML_URL}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_id: applicantId,
          crop_type: cropType,
          irrigation_type: irrigationType,
          land_size_acres: landSizeAcres,
          requested_amount_inr: requestedAmountInr,
          ndvi_mean: ndviMean,
          rainfall_anomaly_pct: rainfallAnomalyPct,
          last_90d_rainfall_mm: last90dRainfallMm,
          soil_soc_gkg: soilSocGkg,
          soil_clay_pct: soilClayPct,
          mandi_distance_km: mandiDistanceKm,
          alt_data_score: altDataScore,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (mlResponse.ok) {
        const mlResult = await mlResponse.json();
        return NextResponse.json({
          success: true,
          source: "python-fastapi",
          serviceUrl: GEO_ML_URL,
          result: mlResult,
        });
      }
    } catch (fastApiError: any) {
      console.warn(
        `Python FastAPI service unavailable at ${GEO_ML_URL}:`,
        fastApiError.message
      );
    }

    // Fallback: Use the TypeScript scoring engine
    const { extractMLFeatures, evaluateMLDecision } = await import(
      "../../lib/services/ml-scoring"
    );

    const mlFeatures = extractMLFeatures({
      landSizeAcres,
      cropType,
      irrigation: irrigationType,
      state: "Maharashtra",
      requestedAmount: requestedAmountInr,
      satellite: {
        ndviScore: ndviMean,
        ndviSeries: [ndviMean - 0.05, ndviMean - 0.02, ndviMean, ndviMean + 0.01],
        cloudFreePct: 85,
        vigorStatus: ndviMean >= 0.65 ? "Healthy Standing Crop" : "Moderate Stress",
        chlorophyllDensityIndex: ndviMean * 100,
        seasonDeltaPct: 5.2,
        resolutionMeters: 10,
        source: "ml-score-proxy-fallback",
      } as any,
      weather: {
        lat: 20.0, lng: 78.0,
        last90DaysRainfallMm: last90dRainfallMm,
        districtAvgRainfallMm: last90dRainfallMm / (1 + rainfallAnomalyPct / 100),
        rainfallAnomalyPct,
        forecast7DayPrecipitationMm: 25,
        maxTemperatureCelsius: 34,
        heatStressRisk: "Low",
        source: "ml-score-proxy-fallback",
      } as any,
      soil: { type: "Black Cotton", clayPct: soilClayPct, socGkg: soilSocGkg, ph: 7.2, fertilityRating: "Moderate", nitrogenFixationCapacity: "Medium", source: "ml-score-proxy-fallback" } as any,
      mandi: {
        marketName: "Nearest APMC", commodity: cropType, state: "Maharashtra", district: "Nagpur",
        distanceKm: mandiDistanceKm, modalPricePerQtl: 6200, minPrice: 5800, maxPrice: 6800,
        priceTrendPct: 4.5, mspPerQtl: 6080, source: "ml-score-proxy-fallback",
      } as any,
    });

    const tsResult = evaluateMLDecision(mlFeatures, "Maharashtra");

    return NextResponse.json({
      success: true,
      source: "typescript-fallback",
      note: `Python FastAPI service at ${GEO_ML_URL} was unreachable. Used TypeScript scoring engine.`,
      result: {
        applicant_id: applicantId,
        score_100_scale: tsResult.score100Scale,
        risk_tier: tsResult.riskTier,
        recommendation: tsResult.recommendation,
        shap_attributions: tsResult.decisionFactors.map((f) => ({
          feature: f.name,
          weight: f.contribution / 100,
          status: f.status,
          reason_en: f.detail,
        })),
        model_version: tsResult.governance.modelVersion,
      },
    });
  } catch (error: any) {
    console.error("ML scoring proxy error:", error);
    return NextResponse.json(
      { error: "ML scoring failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ml-score — Health check for the Python ML service
 */
export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${GEO_ML_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const health = await res.json();
      return NextResponse.json({
        status: "connected",
        serviceUrl: GEO_ML_URL,
        ...health,
      });
    }

    return NextResponse.json({
      status: "unreachable",
      serviceUrl: GEO_ML_URL,
      fallback: "typescript-scoring-engine",
    });
  } catch {
    return NextResponse.json({
      status: "unreachable",
      serviceUrl: GEO_ML_URL,
      fallback: "typescript-scoring-engine",
      hint: "Start the Python service with: cd geo-ml && uvicorn service:app --reload",
    });
  }
}
