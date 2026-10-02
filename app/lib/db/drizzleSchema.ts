import { pgTable, text, timestamp, varchar, integer, jsonb, doublePrecision, customType, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { latLngRingToEwkt, ewkbPolygonToLatLng } from "./geometry";
import type { PlotGeometry } from "./schema";

// PostGIS polygon (SRID 4326). The app keeps using { type, coordinates: [lat, lng][] };
// the axis flip and ring closing happen here. Requires `CREATE EXTENSION postgis`.
const polygon4326 = customType<{ data: PlotGeometry; driverData: string }>({
  dataType() {
    return "geometry(Polygon,4326)";
  },
  toDriver(value) {
    return sql`ST_GeomFromEWKT(${latLngRingToEwkt(value.coordinates)})`;
  },
  fromDriver(value) {
    return { type: "Polygon", coordinates: ewkbPolygonToLatLng(value) };
  },
});

// PostGIS point (written via SQL in scripts/migrate-postgis.ts). Distance queries
// cast to geography for metre-accurate ST_Distance.
const geometryPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(Point,4326)";
  },
});

export const users = pgTable("users", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g. USR-12345
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("farmer"),
  preferredLang: varchar("preferred_lang", { length: 10 }).default("hi"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const farmers = pgTable("farmers", {
  userId: varchar("user_id", { length: 50 }).primaryKey().references(() => users.id, { onDelete: "cascade" }),
  state: varchar("state", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  village: varchar("village", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
});

export const plots = pgTable("plots", {
  id: varchar("id", { length: 50 }).primaryKey(),
  farmerId: varchar("farmer_id", { length: 50 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  geom: polygon4326("geom").notNull(),
  // area_acres = ST_Area(geom::geography); declared_area_acres = what the farmer typed
  areaAcres: doublePrecision("area_acres").notNull(),
  declaredAreaAcres: doublePrecision("declared_area_acres"),
  cropType: varchar("crop_type", { length: 100 }).notNull(),
  irrigation: varchar("irrigation", { length: 100 }).notNull(),
  soilType: varchar("soil_type", { length: 100 }),
  source: varchar("source", { length: 50 }).notNull().default("drawn"),
  documentMatchPct: integer("document_match_pct"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("plots_geom_gist").using("gist", t.geom)]);

export const applications = pgTable("applications", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g. APP-1001
  farmerId: varchar("farmer_id", { length: 50 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  plotId: varchar("plot_id", { length: 50 }).references(() => plots.id, { onDelete: "cascade" }).notNull(),
  product: varchar("product", { length: 100 }).notNull(),
  requestedAmount: integer("requested_amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  bureauStatus: varchar("bureau_status", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const featureSnapshots = pgTable("feature_snapshots", {
  applicationId: varchar("application_id", { length: 50 }).primaryKey().references(() => applications.id, { onDelete: "cascade" }),
  ndviScore: doublePrecision("ndvi_score").notNull(),
  ndviSeries: jsonb("ndvi_series").notNull(),
  cloudFreePct: doublePrecision("cloud_free_pct").notNull(),
  rainfallLast90DaysMm: doublePrecision("rainfall_last_90d_mm").notNull(),
  rainfallDistrictAvgMm: doublePrecision("rainfall_district_avg_mm").notNull(),
  rainfallAnomalyPct: doublePrecision("rainfall_anomaly_pct").notNull(),
  soilProperties: jsonb("soil_properties").notNull(),
  mandi: jsonb("mandi").notNull(),
  alternativeScore: doublePrecision("alternative_score").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
});

export const decisions = pgTable("decisions", {
  applicationId: varchar("application_id", { length: 50 }).primaryKey().references(() => applications.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  riskTier: varchar("risk_tier", { length: 50 }).notNull(),
  recommendation: text("recommendation").notNull(),
  factors: jsonb("factors").notNull(),
  offer: jsonb("offer").notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }).defaultNow(),
});

export const consents = pgTable("consents", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: varchar("user_id", { length: 50 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  purpose: varchar("purpose", { length: 100 }).notNull(),
  consentGiven: integer("consent_given").notNull(), // 1 for true, 0 for false
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }).notNull(),
  details: jsonb("details").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
});

// APMC mandi locations for nearest-market search (KNN on GiST + ST_Distance on geography)
export const mandis = pgTable("mandis", {
  key: varchar("key", { length: 100 }).primaryKey(), // district key used by services/mandi.ts
  name: text("name").notNull(),
  location: geometryPoint("location").notNull(),
}, (t) => [index("mandis_location_gist").using("gist", t.location)]);

// Web Push subscriptions (one row per browser/device a farmer enabled notifications on)
export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("push_subscriptions_user_idx").on(t.userId)]);
