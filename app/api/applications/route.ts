import { NextResponse } from "next/server";
import { tvsDb } from "../../lib/db";
import { fetchAgroWeather } from "../../lib/services/weather";
import { computeSatelliteNdvi } from "../../lib/services/copernicus";
import { fetchSoilProfile } from "../../lib/services/soil";
import { getMandiPricing } from "../../lib/services/mandi";
import { extractMLFeatures, evaluateMLDecision } from "../../lib/services/ml-scoring";

import { applicationSubmitSchema } from "../../lib/validations";
import { getClientIp } from "../../lib/rateLimit";
import { maskPhone } from "../../lib/pii";
import { requireApiRole } from "../../lib/dal";
import { applicantsVisibleTo } from "../../lib/access";
import { measurePlot } from "../../lib/services/geo";
import { idempotencyKey, getIdempotentResult, saveIdempotentResult } from "../../lib/idempotency";
import { sendPushToUser } from "../../lib/push/server";

// Declared vs measured area differing by more than this is flagged for the credit officer
const AREA_MISMATCH_THRESHOLD = 0.2;

// Staff see the portfolio (field officers only their district); farmers see their own.
export async function GET() {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;
  const applicants = applicantsVisibleTo(auth.user, await tvsDb.getAllApplicants());
  return NextResponse.json(applicants, { headers: { "Cache-Control": "no-store" } });
}

// Purge everything — admin only, audit-logged.
export async function DELETE(request: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth.response) return auth.response;
  await tvsDb.clearAllApplications();
  await tvsDb.logAction(auth.user.id, auth.user.role, "ALL_APPLICATIONS_PURGED", "application", "*", {
    ip: getClientIp(request),
  });
  return NextResponse.json({ success: true, message: "All applications purged" });
}

export async function POST(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;
  const actor = auth.user;
  // A farmer's application is linked to their own account; staff submitting on a
  // farmer's behalf create an unlinked farmer record.
  const farmerUserId = actor.role === "farmer" ? actor.id : undefined;

  // Replayed offline submission → return the original result, never a duplicate
  const idemKey = idempotencyKey(request, actor.id);
  if (idemKey) {
    const previous = await getIdempotentResult<Record<string, unknown>>(idemKey);
    if (previous) return NextResponse.json({ ...previous, replayed: true });
  }

  try {
    const rawBody = await request.json();
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "WebClient";

    // Strict Zod input validation
    const parsed = applicationSubmitSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return NextResponse.json(
        {
          error: "DPDP / RBI Input Validation Failed",
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    const {
      name,
      phone,
      state,
      district,
      village,
      pincode,
      product,
      requestedAmount,
      cropType,
      irrigation,
      areaAcres,
      plotPolygon,
      source,
      documentMatchPct,
      consents,
    } = parsed.data;

    // 0. Validate the boundary and measure the true area server-side (PostGIS ST_Area)
    const measurement = await measurePlot(plotPolygon);
    if (!measurement.valid) {
      return NextResponse.json(
        {
          error: "Plot boundary is invalid — redraw the field without crossing lines",
          details: [`plotPolygon: ${measurement.invalidReason}`],
        },
        { status: 400 }
      );
    }
    if (measurement.acres < 0.05 || measurement.acres > 1000) {
      return NextResponse.json(
        {
          error: "Drawn plot area is outside the allowed range",
          details: [`plotPolygon: measured ${measurement.acres.toFixed(2)} acres (allowed 0.05–1000)`],
        },
        { status: 400 }
      );
    }
    const declaredAcres = areaAcres;
    const measuredAcres = Math.round(measurement.acres * 100) / 100;
    const areaMismatchPct = Math.round((Math.abs(declaredAcres - measuredAcres) / measuredAcres) * 1000) / 10;
    const areaMismatch = areaMismatchPct / 100 > AREA_MISMATCH_THRESHOLD;

    // 1. Calculate centroid from polygon
    const count = plotPolygon.length || 1;
    const centroidLat = plotPolygon.reduce((sum: number, c: [number, number]) => sum + c[0], 0) / count;
    const centroidLng = plotPolygon.reduce((sum: number, c: [number, number]) => sum + c[1], 0) / count;

    // 2. Fetch live Weather telemetry (NASA POWER + Open-Meteo)
    const weather = await fetchAgroWeather(centroidLat, centroidLng);

    // 3. Compute Copernicus Sentinel-2 Satellite NDVI (Real API + Redis cache)
    const satellite = await computeSatelliteNdvi(plotPolygon, cropType, irrigation);

    // 4. Ingest Soil Health (SoilGrids / ICAR)
    const soil = await fetchSoilProfile(centroidLat, centroidLng, state);

    // 5. Ingest Mandi Pricing (eNAM / APMC Benchmark + Redis cache)
    const mandi = await getMandiPricing(cropType, district, state, centroidLat, centroidLng);

    // 6. Run Explainable AI Scoring Engine (Phase 3 LightGBM/TreeSHAP Engine)
    const mlFeatures = extractMLFeatures({
      landSizeAcres: measuredAcres, // scored on the satellite-measured area, not the declared one
      cropType,
      irrigation,
      state,
      requestedAmount,
      satellite,
      weather,
      soil,
      mandi,
    });
    const mlResult = evaluateMLDecision(mlFeatures, state);

    // 7. Persist to Database & Audit Trail
    const { applicationId, applicant } = await tvsDb.createApplication({
      farmerUserId,
      name,
      phone,
      state,
      district,
      village,
      pincode,
      product,
      requestedAmount,
      cropType,
      irrigation,
      areaAcres: measuredAcres,
      declaredAreaAcres: declaredAcres,
      plotPolygon,
      source,
      documentMatchPct,
      features: {
        ndviSeries: satellite.ndviSeries,
        ndviScore: satellite.ndviScore,
        cloudFreePct: satellite.cloudFreePct,
        rainfallLast90DaysMm: weather.last90DaysRainfallMm,
        rainfallDistrictAvgMm: weather.districtAvgRainfallMm,
        rainfallAnomalyPct: weather.rainfallAnomalyPct,
        forecastRainSum7DaysMm: weather.forecast7DayPrecipitationMm,
        soilProperties: {
          type: soil.type,
          clayPct: soil.clayPct,
          socGkg: soil.socGkg,
          ph: soil.ph,
        },
        mandi: {
          marketName: mandi.marketName,
          distanceKm: mandi.distanceKm,
          modalPricePerQtl: mandi.modalPricePerQtl,
          priceTrendPct: mandi.priceTrendPct,
        },
        alternativeScore: 0.14,
      },
      decision: {
        score: mlResult.score100Scale,
        riskTier: mlResult.riskTier,
        recommendation: mlResult.recommendation,
        factors: mlResult.decisionFactors,
        offer: {
          approvedAmount: mlResult.offer.approvedAmount,
          tenureMonths: mlResult.offer.tenureMonths,
          flatEmi: mlResult.offer.flatMonthlyEmi,
          interestRatePct: mlResult.offer.annualPercentageRate,
          harvestEmiSchedule: mlResult.offer.harvestEmiSchedule,
        },
        modelVersion: mlResult.governance.modelVersion,
        decidedBy: "model",
      },
    });

    // Record DPDP consents against the farmer's account (after the users row exists)
    if (farmerUserId) {
      for (const c of consents) {
        if (c.granted) await tvsDb.saveConsent(farmerUserId, c.purpose, clientIp, userAgent);
      }
    }

    // Log to immutable regulatory audit trail
    await tvsDb.logAction(actor.id, actor.role, "APPLICATION_SUBMITTED_AND_SCORED", "application", applicationId, {
      ip: clientIp,
      maskedPhone: maskPhone(phone),
      district,
      cropType,
      declaredAcres,
      measuredAcres,
      areaMeasuredBy: measurement.method,
      areaMismatchPct,
      areaMismatch,
      requestedAmount,
      approvedAmount: mlResult.offer.approvedAmount,
      score: mlResult.score100Scale,
      riskTier: mlResult.riskTier,
      timestamp: new Date().toISOString(),
    });

    const result = {
      success: true,
      applicationId,
      applicant,
      plotArea: { declaredAcres, measuredAcres, mismatchPct: areaMismatchPct, flagged: areaMismatch, method: measurement.method },
    };
    if (idemKey) await saveIdempotentResult(idemKey, result);

    // Notify the farmer's devices (useful when the submit was replayed offline)
    if (farmerUserId) {
      const delivered = await sendPushToUser(farmerUserId, {
        title: "Your loan decision is ready",
        body: `Application ${applicationId}: score ${mlResult.score100Scale}/100. Tap to see your offer and Key Fact Statement.`,
        url: `/scoring?id=${applicationId}`,
        tag: `decision-${applicationId}`,
      });
      if (delivered > 0) {
        await tvsDb.logAction(farmerUserId, "farmer", "PUSH_DECISION_SENT", "application", applicationId, { delivered });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Application processing error:", error);
    return NextResponse.json(
      { error: "Failed to process application" },
      { status: 500 }
    );
  }
}
