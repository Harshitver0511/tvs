import "server-only";
import { redisGet, redisSet } from "./redis";

// Offline submissions can be replayed (Background Sync, retries on reconnect).
// The client sends an Idempotency-Key per draft; a repeat returns the first result
// instead of creating a duplicate application.

const TTL_SECONDS = 7 * 24 * 60 * 60; // matches the service worker queue retention
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

declare global {
  // eslint-disable-next-line no-var
  var __tvsIdempotency: Map<string, { value: unknown; expires: number }> | undefined;
}
const mem = globalThis.__tvsIdempotency || (globalThis.__tvsIdempotency = new Map());

/** Returns a namespaced key, or null if the header is absent/malformed. */
export function idempotencyKey(request: Request, userId: string): string | null {
  const raw = request.headers.get("idempotency-key");
  return raw && UUID.test(raw) ? `idem:apply:${userId}:${raw.toLowerCase()}` : null;
}

export async function getIdempotentResult<T>(key: string): Promise<T | null> {
  const hit = mem.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  return redisGet<T>(key);
}

export async function saveIdempotentResult(key: string, value: unknown): Promise<void> {
  mem.set(key, { value, expires: Date.now() + TTL_SECONDS * 1000 });
  await redisSet(key, value, TTL_SECONDS);
}
