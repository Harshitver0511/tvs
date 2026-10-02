import "server-only";

/**
 * TVS Credit — Upstash QStash Job Queue Layer
 * 
 * Provides async job processing for scoring pipelines.
 * When QSTASH_TOKEN is set, uses Upstash QStash REST API.
 * Otherwise, executes jobs synchronously as a fallback.
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = "https://qstash.upstash.io/v2/publish/";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000";

export interface ScoringJob {
  applicationId: string;
  centroidLat: number;
  centroidLng: number;
  cropType: string;
  irrigation: string;
  state: string;
  district: string;
  areaAcres: number;
  requestedAmount: number;
  plotPolygon: [number, number][];
}

/**
 * Enqueues an async scoring job via Upstash QStash.
 * If QStash is not configured, falls back to direct synchronous execution.
 */
export async function enqueueScoringJob(job: ScoringJob): Promise<{
  queued: boolean;
  messageId?: string;
  fallback: boolean;
}> {
  if (!QSTASH_TOKEN) {
    console.log(`[Queue] QStash not configured. Executing job ${job.applicationId} synchronously.`);
    return { queued: false, fallback: true };
  }

  try {
    const targetUrl = `${APP_URL}/api/queue/process`;

    const res = await fetch(`${QSTASH_URL}${targetUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
        "Content-Type": "application/json",
        "Upstash-Retries": "3",
        "Upstash-Delay": "0s",
      },
      body: JSON.stringify(job),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[Queue] Job ${job.applicationId} enqueued → messageId: ${data.messageId}`);
      return { queued: true, messageId: data.messageId, fallback: false };
    }

    console.warn(`[Queue] QStash publish failed: ${res.status} ${res.statusText}`);
    return { queued: false, fallback: true };
  } catch (err: any) {
    console.warn("[Queue] QStash publish error:", err.message);
    return { queued: false, fallback: true };
  }
}

/**
 * Verifies an incoming QStash webhook (Upstash-Signature header).
 * The header is an HS256 JWT signed with the current or next signing key whose
 * `body` claim is base64url(sha256(rawBody)) — same algorithm as
 * @upstash/qstash's Receiver. Unsigned calls are only accepted in local
 * development when no signing keys are configured.
 */
export async function verifyQStashSignature(request: Request, rawBody: string): Promise<boolean> {
  const signature = request.headers.get("upstash-signature");
  const keys = [process.env.QSTASH_CURRENT_SIGNING_KEY, process.env.QSTASH_NEXT_SIGNING_KEY].filter(
    (k): k is string => !!k
  );

  if (keys.length === 0) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const { jwtVerify } = await import("jose");
  const { createHash } = await import("crypto");
  const bodyHash = createHash("sha256").update(rawBody).digest("base64url");

  for (const key of keys) {
    try {
      const { payload } = await jwtVerify(signature, new TextEncoder().encode(key), {
        issuer: "Upstash",
        clockTolerance: 5,
      });
      const claimedHash = typeof payload.body === "string" ? payload.body.replace(/=+$/, "") : "";
      if (claimedHash === bodyHash) return true;
    } catch {
      // try the next key
    }
  }
  return false;
}
