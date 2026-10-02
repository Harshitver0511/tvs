// Conversions between the app's plot shape ([lat, lng] corners, open ring) and
// PostGIS geometry (lng/lat axis order, closed ring, SRID 4326).

export type LatLng = [number, number];

const EARTH_RADIUS_M = 6378137;
export const SQ_METERS_PER_ACRE = 4046.8564224;

/** [lat, lng][] → EWKT "SRID=4326;POLYGON((lng lat, …, first))". */
export function latLngRingToEwkt(coords: LatLng[]): string {
  if (coords.length < 3) throw new Error("A plot polygon needs at least 3 corners");
  for (const [lat, lng] of coords) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("Invalid plot coordinate");
  }
  const ring = [...coords];
  const [firstLat, firstLng] = ring[0];
  const [lastLat, lastLng] = ring[ring.length - 1];
  if (firstLat !== lastLat || firstLng !== lastLng) ring.push(ring[0]);
  // PostGIS axis order is (x = longitude, y = latitude)
  return `SRID=4326;POLYGON((${ring.map(([lat, lng]) => `${lng} ${lat}`).join(", ")}))`;
}

/**
 * Hex (E)WKB polygon as returned by Postgres for a geometry column → outer ring
 * as [lat, lng][] without the closing vertex.
 */
export function ewkbPolygonToLatLng(hex: string): LatLng[] {
  const buf = Buffer.from(hex, "hex");
  const le = buf.readUInt8(0) === 1;
  const u32 = (o: number) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const f64 = (o: number) => (le ? buf.readDoubleLE(o) : buf.readDoubleBE(o));

  let off = 1;
  const type = u32(off);
  off += 4;
  if (type & 0x20000000) off += 4; // embedded SRID
  if ((type & 0x0fffffff) % 1000 !== 3) throw new Error("Expected a Polygon geometry");
  if (type & 0xc0000000) throw new Error("Only 2D plot polygons are supported");

  const rings = u32(off);
  off += 4;
  if (rings === 0) return [];
  const n = u32(off);
  off += 4;

  const pts: LatLng[] = [];
  for (let i = 0; i < n; i++, off += 16) pts.push([f64(off + 8), f64(off)]);
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (pts.length > 1 && first[0] === last[0] && first[1] === last[1]) pts.pop();
  return pts;
}

/** Spherical polygon area in acres — fallback when Postgres/PostGIS is unavailable. */
export function sphericalAreaAcres(coords: LatLng[]): number {
  const rad = Math.PI / 180;
  let sum = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % coords.length];
    sum += (lng2 - lng1) * rad * (2 + Math.sin(lat1 * rad) + Math.sin(lat2 * rad));
  }
  return Math.abs((sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2) / SQ_METERS_PER_ACRE;
}
