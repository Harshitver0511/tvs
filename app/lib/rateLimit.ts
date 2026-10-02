// TVS Credit In-Memory & Redis-Compatible Sliding Window Rate Limiter
// Enforces security thresholds on OTP, Application Submissions, and Underwriting Endpoints

interface RateLimitConfig {
  maxRequests: number; // Max requests allowed within window
  windowSeconds: number; // Sliding window duration in seconds
}

// Preset rate limit policies per sensitive route
export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  "auth:otp": { maxRequests: 5, windowSeconds: 600 }, // 5 OTPs per 10 minutes per IP/phone
  "apps:submit": { maxRequests: 10, windowSeconds: 60 }, // 10 application submissions per minute per IP
  "apps:score": { maxRequests: 25, windowSeconds: 60 }, // 25 scoring recalculations per minute
  "consent:manage": { maxRequests: 20, windowSeconds: 60 }, // 20 consent updates per minute
  "auth:session": { maxRequests: 10, windowSeconds: 60 }, // post-login session handshakes
  "admin:users": { maxRequests: 30, windowSeconds: 60 }, // role changes / staff invites
  "docs:ocr": { maxRequests: 6, windowSeconds: 60 }, // CPU-heavy Tesseract OCR
  "privacy:erasure": { maxRequests: 3, windowSeconds: 3600 }, // DPDP erasure requests
  "assistant:chat": { maxRequests: 30, windowSeconds: 60 }, // 30 AI queries per minute
  "default": { maxRequests: 60, windowSeconds: 60 }, // 60 general requests per minute
};

interface WindowEntry {
  timestamps: number[];
}

// In-memory sliding window bucket store
const memoryStore = new Map<string, WindowEntry>();

// Clean up stale memory store entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < 600 * 1000);
      if (entry.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix epoch seconds when the oldest token expires
}

/**
 * Checks rate limit for a given client key and route rule
 */
export async function checkRateLimit(
  clientIdentifier: string,
  ruleKey: keyof typeof RATE_LIMIT_RULES = "default"
): Promise<RateLimitResult> {
  const rule = RATE_LIMIT_RULES[ruleKey] || RATE_LIMIT_RULES["default"];
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const storeKey = `${ruleKey}:${clientIdentifier}`;

  // Check if Upstash Redis credentials exist in environment
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken && !upstashUrl.includes("xxxx")) {
    try {
      // Execute sliding window rate limit via Upstash Redis REST pipeline
      const pipelineRes = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["ZREMRANGEBYSCORE", storeKey, 0, now - windowMs],
          ["ZCARD", storeKey],
          ["ZADD", storeKey, now, `${now}-${Math.random()}`],
          ["EXPIRE", storeKey, rule.windowSeconds],
        ]),
        cache: "no-store",
      });

      if (pipelineRes.ok) {
        const results = await pipelineRes.json();
        const currentCount = Number(results[1]?.result || 0);
        const remaining = Math.max(0, rule.maxRequests - currentCount - 1);
        const success = currentCount < rule.maxRequests;
        return {
          success,
          limit: rule.maxRequests,
          remaining,
          reset: Math.ceil((now + windowMs) / 1000),
        };
      }
    } catch {
      // Fallback to high-speed in-memory store
    }
  }

  // Fast In-Memory Sliding Window Implementation
  let entry = memoryStore.get(storeKey);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(storeKey, entry);
  }

  // Filter timestamps within current sliding window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= rule.maxRequests) {
    const oldest = entry.timestamps[0];
    const resetTime = Math.ceil((oldest + windowMs) / 1000);
    return {
      success: false,
      limit: rule.maxRequests,
      remaining: 0,
      reset: resetTime,
    };
  }

  entry.timestamps.push(now);
  const remaining = rule.maxRequests - entry.timestamps.length;
  const resetTime = Math.ceil((now + windowMs) / 1000);

  return {
    success: true,
    limit: rule.maxRequests,
    remaining,
    reset: resetTime,
  };
}

/**
 * Extracts client IP from request headers (x-forwarded-for, x-real-ip, etc.)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
