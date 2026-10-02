import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../db/drizzle";
import { latLngRingToEwkt, sphericalAreaAcres, SQ_METERS_PER_ACRE, type LatLng } from "../db/geometry";

// Server-side geospatial queries (PostGIS). Each has a pure-JS fallback so the
// app still works without DATABASE_URL, and reports which method was used.

export interface PlotMeasurement {
  acres: number;
  valid: boolean;
  invalidReason?: string;
  method: "postgis" | "spherical-js";
}

/** Validate a plot boundary and measure its true area with ST_Area(geography). */
export async function measurePlot(coords: LatLng[]): Promise<PlotMeasurement> {
  if (db) {
    try {
      const ewkt = latLngRingToEwkt(coords);
      const rows = await db.execute<{ valid: boolean; reason: string; sq_m: number }>(sql`
        SELECT ST_IsValid(g) AS valid,
               ST_IsValidReason(g) AS reason,
               ST_Area(g::geography) AS sq_m
        FROM (SELECT ST_GeomFromEWKT(${ewkt}) AS g) AS p`);
      const row = rows[0];
      return {
        acres: Number(row.sq_m) / SQ_METERS_PER_ACRE,
        valid: row.valid,
        invalidReason: row.valid ? undefined : row.reason,
        method: "postgis",
      };
    } catch (e) {
      console.warn("[geo] PostGIS measurePlot failed, using JS fallback:", e);
    }
  }
  return { acres: sphericalAreaAcres(coords), valid: true, method: "spherical-js" };
}

export interface MandiDistance {
  key: string;
  name: string;
  distanceKm: number;
}

/**
 * Mandis ordered by true (geodesic) distance from a point — ST_Distance on
 * geography, not planar degrees. Returns null when PostGIS / the mandis table isn't available.
 */
export async function mandisByDistance(lat: number, lng: number, limit = 10): Promise<MandiDistance[] | null> {
  if (!db) return null;
  try {
    const rows = await db.execute<{ key: string; name: string; meters: number }>(sql`
      SELECT key, name,
             ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS meters
      FROM mandis
      ORDER BY meters
      LIMIT ${limit}`);
    if (rows.length === 0) return null;
    return rows.map((r) => ({
      key: r.key,
      name: r.name,
      distanceKm: Math.round((Number(r.meters) / 1000) * 10) / 10,
    }));
  } catch (e) {
    console.warn("[geo] PostGIS mandi distance failed, using haversine fallback:", e);
    return null;
  }
}
