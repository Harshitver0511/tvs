#!/usr/bin/env tsx
/**
 * Create the daily QStash schedule that calls /api/cron/emi-reminders.
 * Run once after deploying (QStash cannot reach localhost):
 *   npx tsx scripts/schedule-emi-reminders.ts https://your-app.vercel.app
 * Runs at 09:00 IST (03:30 UTC) every day.
 */
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

async function main() {
  const base = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN is not set in .env.local");
  if (!/^https:\/\//.test(base)) throw new Error("Pass the public https URL of the deployed app");

  const res = await fetch(`https://qstash.upstash.io/v2/schedules/${base}/api/cron/emi-reminders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Upstash-Cron": "30 3 * * *" },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`QStash ${res.status}: ${body}`);
  console.log("✓ schedule created:", body);
}

main().catch((e) => {
  console.error("schedule-emi-reminders failed:", e.message || e);
  process.exit(1);
});
