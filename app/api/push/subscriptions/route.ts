import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "../../../lib/dal";
import { saveSubscription, deleteSubscription } from "../../../lib/push/server";
import { tvsDb } from "../../../lib/db";

// Register / remove this browser for Web Push. The subscription always belongs
// to the signed-in user.

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().startsWith("https://").max(1000),
    keys: z.object({
      p256dh: z.string().min(20).max(200),
      auth: z.string().min(8).max(100),
    }),
  }),
  locale: z.string().max(10).optional(),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(1000) });

export async function POST(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });

  const { endpoint, keys } = parsed.data.subscription;
  await saveSubscription(auth.user.id, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
  await tvsDb.logAction(auth.user.id, auth.user.role, "PUSH_SUBSCRIBED", "push_subscription", new URL(endpoint).host, {});
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });

  await deleteSubscription(auth.user.id, parsed.data.endpoint);
  return NextResponse.json({ success: true });
}
