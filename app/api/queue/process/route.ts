import { NextResponse } from "next/server";
import { verifyQStashSignature, ScoringJob } from "../../../lib/queue";
import { fetchAgroWeather } from "../../../lib/services/weather";
import { computeSatelliteNdvi } from "../../../lib/services/copernicus";
import { fetchSoilProfile } from "../../../lib/services/soil";
import { getMandiPricing } from "../../../lib/services/mandi";

/**
 * POST /api/queue/process — QStash Webhook Receiver
 * 
 * This endpoint is called by Upstash QStash when a scoring job is dequeued.
 * It processes the full scoring pipeline asynchronously:
 *   1. Fetch Weather (NASA POWER + Open-Meteo)
 *   2. Compute NDVI (Copernicus Sentinel-2)
 *   3. Fetch Soil (ISRIC SoilGrids)
 *   4. Fetch Mandi Pricing (eNAM/APMC)
 * 
 * Results are stored in an in-memory progress map for SSE consumption.
 */

// In-memory progress store (per application)
declare global {
  // eslint-disable-next-line no-var
  var __scoringProgress: Map<string, { step: string; progress: number; data?: any; completedAt?: string }> | undefined;
}

const progressStore = globalThis.__scoringProgress || (globalThis.__scoringProgress = new Map());

export { progressStore };

export async function POST(request: Request) {
  // Verify QStash signature
  const rawBody = await request.text();
  if (!(await verifyQStashSignature(request, rawBody))) {
    return NextResponse.json({ error: "Invalid QStash signature" }, { status: 401 });
  }

  try {
    const job: ScoringJob = JSON.parse(rawBody);
    const { applicationId, centroidLat, centroidLng, cropType, irrigation, state, district, areaAcres, plotPolygon } = job;

    console.log(`[Queue/Process] Starting scoring pipeline for ${applicationId}`);

    // Step 1: Weather
    progressStore.set(applicationId, { step: "Fetching weather telemetry (NASA POWER + Open-Meteo)...", progress: 10 });
    const weather = await fetchAgroWeather(centroidLat, centroidLng);
    progressStore.set(applicationId, { step: "Weather data acquired", progress: 30, data: { rainfall: weather.last90DaysRainfallMm } });

    // Step 2: NDVI
    progressStore.set(applicationId, { step: "Computing satellite NDVI (Copernicus Sentinel-2)...", progress: 40 });
    const satellite = await computeSatelliteNdvi(plotPolygon, cropType, irrigation);
    progressStore.set(applicationId, { step: "NDVI analysis complete", progress: 55, data: { ndvi: satellite.ndviScore } });

    // Step 3: Soil
    progressStore.set(applicationId, { step: "Fetching soil profile (ISRIC SoilGrids)...", progress: 65 });
    const soil = await fetchSoilProfile(centroidLat, centroidLng, state);
    progressStore.set(applicationId, { step: "Soil profile acquired", progress: 75, data: { soilType: soil.type } });

    // Step 4: Mandi
    progressStore.set(applicationId, { step: "Fetching mandi pricing (eNAM/APMC)...", progress: 85 });
    const mandi = await getMandiPricing(cropType, district, state, centroidLat, centroidLng);
    progressStore.set(applicationId, { step: "Mandi pricing acquired", progress: 95, data: { market: mandi.marketName } });

    // Step 5: Complete
    progressStore.set(applicationId, {
      step: "Scoring pipeline complete",
      progress: 100,
      completedAt: new Date().toISOString(),
      data: { weather, satellite, soil, mandi },
    });

    console.log(`[Queue/Process] Pipeline complete for ${applicationId}`);

    return NextResponse.json({
      success: true,
      applicationId,
      message: "Scoring pipeline completed",
    });
  } catch (error: any) {
    console.error("[Queue/Process] Error:", error);
    return NextResponse.json(
      { error: "Queue processing failed" },
      { status: 500 }
    );
  }
}
