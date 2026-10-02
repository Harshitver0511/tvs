import { NextResponse } from "next/server";
import { redisPing, isRedisConfigured, CACHE_TTL } from "../../lib/redis";

export async function GET() {
  const configured = isRedisConfigured();

  if (!configured) {
    return NextResponse.json({
      redis: {
        status: "NOT_CONFIGURED",
        message: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set in .env.local",
      },
    });
  }

  const health = await redisPing();

  return NextResponse.json({
    redis: {
      status: health.connected ? "CONNECTED" : "UNREACHABLE",
      latencyMs: health.latencyMs,
      provider: "Upstash Redis",
      cacheTTLs: CACHE_TTL,
      usedBy: [
        "Rate Limiting (proxy.ts)",
        "Satellite NDVI Cache (copernicus.ts)",
        "Weather Cache (weather.ts)",
        "Soil Cache (soil.ts)",
        "Mandi Pricing Cache (mandi.ts)",
      ],
    },
  });
}
