import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { tvsDb } from "../../../lib/db";
import { sendPushToUser } from "../../../lib/push/server";
import { verifyQStashSignature } from "../../../lib/queue";
import { formatINR } from "../../../lib/format";

/**
 * Daily EMI reminder job. Sends a Web Push to the farmer 7 days (or fewer, if
 * the job missed a day) before each harvest-EMI due date — once per EMI.
 *
 * Trigger: QStash schedule (signed) or `Authorization: Bearer $CRON_SECRET`
 * (Vercel Cron / manual). See scripts/schedule-emi-reminders.ts.
 *
 * The scoring engine labels EMIs by month ("Nov 2026"); the due date is the
 * EMI_DUE_DAY of that month.
 */
const EMI_DUE_DAY = 5;
const REMIND_DAYS_BEFORE = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function bearerOk(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Today's date in India (YYYY-MM-DD → UTC midnight) so day counts don't drift with server timezone. */
function todayIst(): number {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return Date.parse(`${ymd}T00:00:00Z`);
}

function dueDate(monthLabel: string): number | null {
  const parsed = new Date(`${EMI_DUE_DAY} ${monthLabel} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

async function run(request: Request, rawBody: string) {
  const authorized = bearerOk(request) || (request.headers.get("upstash-signature") && (await verifyQStashSignature(request, rawBody)));
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayIst();
  const applicants = await tvsDb.getAllApplicants();
  let checked = 0;
  let sent = 0;

  for (const app of applicants) {
    if (!app.farmerId) continue; // only self-service applications have a farmer account to notify
    for (const emi of app.scoring.offer?.harvestEmiSchedule ?? []) {
      const due = dueDate(emi.month);
      if (due === null) continue;
      const daysLeft = Math.round((due - today) / DAY_MS);
      if (daysLeft < 0 || daysLeft > REMIND_DAYS_BEFORE) continue;
      checked++;

      const key = `${app.id}:${emi.month}`;
      if (await tvsDb.hasAuditEntry("EMI_REMINDER_SENT", key)) continue;

      const dueText = new Date(due).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
      const delivered = await sendPushToUser(app.farmerId, {
        title: `EMI due ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}`,
        body: `${formatINR(emi.amount)} for loan ${app.id} is due on ${dueText}.`,
        url: `/kfs/${app.id}`,
        tag: `emi-${key}`,
      });
      if (delivered > 0) {
        sent++;
        await tvsDb.logAction(app.farmerId, "farmer", "EMI_REMINDER_SENT", "emi", key, {
          amount: emi.amount,
          dueDate: new Date(due).toISOString().slice(0, 10),
          daysLeft,
          delivered,
        });
      }
    }
  }

  return NextResponse.json({ success: true, date: new Date(today).toISOString().slice(0, 10), dueSoon: checked, remindersSent: sent });
}

// Vercel Cron uses GET; QStash schedules POST
export async function GET(request: Request) {
  return run(request, "");
}

export async function POST(request: Request) {
  return run(request, await request.text());
}
