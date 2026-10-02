"use client";
// Browser side of Web Push (free, VAPID — no third-party service).

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration | undefined> {
  return (await navigator.serviceWorker.getRegistration()) ?? undefined;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  return (await (await registration())?.pushManager.getSubscription()) ?? null;
}

export type EnablePushResult = "enabled" | "denied" | "unavailable" | "error";

export async function enablePush(locale: string): Promise<EnablePushResult> {
  if (!isPushSupported()) return "unavailable";
  const reg = await registration();
  if (!reg) return "unavailable"; // service worker not installed (e.g. dev mode)
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  try {
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      }));
    const res = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), locale }),
    });
    return res.ok ? "enabled" : "error";
  } catch {
    return "error";
  }
}

export async function disablePush(): Promise<void> {
  const sub = await getPushSubscription();
  if (!sub) return;
  await fetch("/api/push/subscriptions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe();
}
