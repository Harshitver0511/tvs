#!/usr/bin/env tsx
/**
 * TVS Credit — rebuild the app tables on PostGIS.
 *
 * Drops the legacy tables created by scripts/supabase_schema.sql (jsonb plot
 * geometry, numeric columns, `audit_log`), recreates them from the Drizzle schema
 * (drizzle/0000_postgis_schema.sql), loads APMC mandi locations, and applies
 * drizzle/rls-policies.sql. Runs in a single transaction.
 *
 * Usage: npx tsx scripts/migrate-postgis.ts [--force]
 *   Refuses to drop tables that contain rows unless --force is given.
 */
import { readFileSync } from "fs";
import path from "path";
import * as dotenv from "dotenv";
import postgres from "postgres";
import { apmcDirectory } from "../app/lib/services/apmcDirectory";

dotenv.config({ path: ".env.local", quiet: true });

const LEGACY_TABLES = [
  "audit_log", "audit_logs", "consents", "decisions", "feature_snapshots",
  "applications", "plots", "farmers", "users", "mandis",
];

async function main() {
  const force = process.argv.includes("--force");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in .env.local");
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 20, onnotice: () => {} });

  try {
    // Safety: never silently drop data
    const nonEmpty: string[] = [];
    for (const t of LEGACY_TABLES) {
      const [{ exists }] = await sql`SELECT to_regclass(${"public." + t}) IS NOT NULL AS exists`;
      if (!exists) continue;
      const [{ n }] = await sql.unsafe(`SELECT count(*)::int AS n FROM public."${t}"`);
      if (n > 0) nonEmpty.push(`${t} (${n} rows)`);
    }
    if (nonEmpty.length && !force) {
      throw new Error(`Refusing to drop non-empty tables: ${nonEmpty.join(", ")}. Re-run with --force to discard them.`);
    }

    const schemaSql = readFileSync(path.join("drizzle", "0000_postgis_schema.sql"), "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    const rlsSql = readFileSync(path.join("drizzle", "rls-policies.sql"), "utf8");

    await sql.begin(async (tx) => {
      await tx.unsafe("CREATE EXTENSION IF NOT EXISTS postgis");
      await tx.unsafe(`DROP TABLE IF EXISTS ${LEGACY_TABLES.map((t) => `public."${t}"`).join(", ")} CASCADE`);
      for (const stmt of schemaSql) await tx.unsafe(stmt);

      for (const [key, m] of Object.entries(apmcDirectory)) {
        await tx`
          INSERT INTO mandis (key, name, location)
          VALUES (${key}, ${m.name}, ST_SetSRID(ST_MakePoint(${m.lng}, ${m.lat}), 4326))`;
      }

      await tx.unsafe(rlsSql);
    });

    // Post-checks
    const [{ udt }] = await sql`
      SELECT format_type(a.atttypid, a.atttypmod) AS udt
      FROM pg_attribute a WHERE a.attrelid = 'public.plots'::regclass AND a.attname = 'geom'`;
    const [{ n: mandiCount }] = await sql`SELECT count(*)::int AS n FROM mandis`;
    const [{ acres }] = await sql`
      SELECT round((ST_Area(ST_GeomFromEWKT('SRID=4326;POLYGON((78.3 20.13, 78.302 20.13, 78.302 20.132, 78.3 20.132, 78.3 20.13))')::geography) / 4046.8564224)::numeric, 2) AS acres`;
    console.log(`✓ plots.geom is ${udt}`);
    console.log(`✓ ${mandiCount} mandis loaded`);
    console.log(`✓ ST_Area sanity check: 0.002° square near Yavatmal = ${acres} acres (expect ≈11.4: 222 m × 209 m)`);
    console.log("✓ RLS policies applied");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("migrate-postgis failed:", e.message || e);
  process.exit(1);
});
