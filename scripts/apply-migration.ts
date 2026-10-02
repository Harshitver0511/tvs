#!/usr/bin/env tsx
/**
 * Apply one drizzle/*.sql migration file in a transaction.
 * Usage: npx tsx scripts/apply-migration.ts drizzle/0001_push_subscriptions.sql
 */
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local", quiet: true });

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npx tsx scripts/apply-migration.ts <file.sql>");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in .env.local");
  const statements = readFileSync(file, "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      for (const stmt of statements) await tx.unsafe(stmt);
    });
    console.log(`✓ applied ${file} (${statements.length} statements)`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("apply-migration failed:", e.message || e);
  process.exit(1);
});
