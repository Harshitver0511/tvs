import "server-only";
import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "../db/drizzle";
import { pushSubscriptions } from "../db/drizzleSchema";

// Web Push via VAPID (free — the browser vendors' push services deliver it).

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured: boolean | null = null;
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  configured = !!(pub && priv);
  if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@tvscredit.com", pub!, priv!);
  return configured;
}

// In-memory fallback when DATABASE_URL isn't set (local demos)
declare global {
  // eslint-disable-next-line no-var
  var __tvsPushSubs: Map<string, StoredSubscription & { userId: string }> | undefined;
}
const mem = globalThis.__tvsPushSubs || (globalThis.__tvsPushSubs = new Map());

export async function saveSubscription(userId: string, sub: StoredSubscription): Promise<void> {
  if (db) {
    await db
      .insert(pushSubscriptions)
      .values({ endpoint: sub.endpoint, userId, p256dh: sub.p256dh, auth: sub.auth })
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, p256dh: sub.p256dh, auth: sub.auth } });
  } else {
    mem.set(sub.endpoint, { ...sub, userId });
  }
}

/** Removes a subscription only if it belongs to `userId`. */
export async function deleteSubscription(userId: string, endpoint: string): Promise<void> {
  if (db) {
    const rows = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    if (rows[0]?.userId === userId) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  } else if (mem.get(endpoint)?.userId === userId) {
    mem.delete(endpoint);
  }
}

async function subscriptionsFor(userId: string): Promise<StoredSubscription[]> {
  if (db) return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  return [...mem.values()].filter((s) => s.userId === userId);
}

async function removeExpired(endpoint: string) {
  if (db) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  else mem.delete(endpoint);
}

/** Sends to every device of the user. Returns how many deliveries succeeded. Never throws. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  let delivered = 0;
  try {
    const subs = await subscriptionsFor(userId);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
            { TTL: 24 * 60 * 60, urgency: "normal" }
          );
          delivered++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await removeExpired(s.endpoint); // unsubscribed / expired
          else console.warn("[push] send failed:", status ?? err);
        }
      })
    );
  } catch (e) {
    console.warn("[push] lookup failed:", e);
  }
  return delivered;
}
