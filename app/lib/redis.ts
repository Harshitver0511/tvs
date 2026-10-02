// TVS Credit Upstash Redis Cache Layer
// Provides centralized caching via Upstash Redis REST API
// Used by: NDVI (24h), Weather (3h), Soil (24h), Mandi (12h), Rate Limiting

const getRedisConfig = () => ({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export function isRedisConfigured(): boolean {
  const { url, token } = getRedisConfig();
  return Boolean(url && token && !url.includes("xxxx") && !url.includes("your-"));
}

/**
 * GET a cached value from Upstash Redis
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const { url, token } = getRedisConfig();
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        return JSON.parse(data.result) as T;
      }
    }
  } catch {
    // Redis unavailable — non-critical, fall through
  }
  return null;
}

/**
 * SET a value in Upstash Redis with TTL (seconds)
 */
export async function redisSet(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
  const { url, token } = getRedisConfig();
  if (!url || !token) return false;

  try {
    // Upstash REST API: POST /{command}/{args...}
    // SET key value EX ttl
    const pipeline = [
      ["SET", key, JSON.stringify(value), "EX", String(ttlSeconds)],
    ];

    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * DELETE a key from Upstash Redis
 */
export async function redisDel(key: string): Promise<boolean> {
  const { url, token } = getRedisConfig();
  if (!url || !token) return false;

  try {
    const res = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Health check: Ping Upstash Redis
 */
export async function redisPing(): Promise<{ connected: boolean; latencyMs: number }> {
  const { url, token } = getRedisConfig();
  if (!url || !token) return { connected: false, latencyMs: -1 };

  const start = Date.now();
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { connected: true, latencyMs };
    }
  } catch { /* connection failed */ }
  return { connected: false, latencyMs: Date.now() - start };
}

// Cache TTL constants (seconds)
export const CACHE_TTL = {
  NDVI: 86400,      // 24 hours — satellite revisit every ~5 days
  WEATHER: 10800,   // 3 hours — forecast updates
  SOIL: 86400,      // 24 hours — soil doesn't change fast
  MANDI: 43200,     // 12 hours — prices update daily
  EKYC: 3600,       // 1 hour — verification results
} as const;
