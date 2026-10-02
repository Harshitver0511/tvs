import { NextResponse } from "next/server";
import { fetchAgroWeather } from "../../../lib/services/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  const lat = latStr ? parseFloat(latStr) : 20.1384;
  const lng = lngStr ? parseFloat(lngStr) : 78.3182;
  // Same India bounding box as coordinateTupleSchema in lib/validations.ts
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 6 || lat > 38 || lng < 68 || lng > 98) {
    return NextResponse.json({ error: "lat/lng must be within India" }, { status: 400 });
  }

  try {
    const data = await fetchAgroWeather(lat, lng);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch weather telemetry" },
      { status: 500 }
    );
  }
}
