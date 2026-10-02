/// <reference lib="webworker" />
// TVS Credit service worker (bundled by @serwist/turbopack via app/serwist/[path]/route.ts)
import { defaultCache } from "@serwist/turbopack/worker";
import {
  BackgroundSyncQueue,
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkOnly,
  Route,
  Serwist,
  type PrecacheEntry,
  type RuntimeCaching,
  type SerwistGlobalConfig,
} from "serwist";
import { del } from "idb-keyval";
import { APPLY_DRAFT_KEY } from "./lib/offline/keys";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

// Pages that render borrower PII or staff data are never stored on the device
const PRIVATE_PAGES = /^\/(kfs|scoring|consent|staff|admin|monitoring|auth|login)(\/|$)/;
// Defaults we replace: caching API responses / unknown cross-origin data is not acceptable for PII
const DROPPED_DEFAULT_CACHES = new Set(["apis", "cross-origin", "others"]);

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && PRIVATE_PAGES.test(url.pathname),
    handler: new NetworkOnly(),
  },
  {
    // Map tiles the farmer has already looked at (OSM policy: no bulk prefetching)
    matcher: /^https:\/\/([a-c]\.)?tile\.openstreetmap\.org\/|^https:\/\/server\.arcgisonline\.com\//,
    handler: new CacheFirst({
      cacheName: "map-tiles",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  ...defaultCache.filter((rule) => {
    const cacheName = (rule.handler as { cacheName?: string }).cacheName;
    return !cacheName || !DROPPED_DEFAULT_CACHES.has(cacheName);
  }),
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

// ─── Offline application submit ─────────────────────────────────────────────
// If POST /api/applications can't reach the network, queue it and tell the page
// with a 202 so it can show "saved offline". Replayed on Background Sync (or at
// next service-worker start-up on browsers without it).

async function notify(title: string, body: string, url: string) {
  for (const client of await self.clients.matchAll({ type: "window" })) {
    client.postMessage({ type: "TVS_APPLY_SYNC", title, body, url });
  }
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    await self.registration.showNotification(title, { body, icon: "/pwa-icon/192", badge: "/pwa-icon/192", data: { url } });
  }
}

const applyQueue = new BackgroundSyncQueue("apply-submissions", {
  maxRetentionTime: 7 * 24 * 60,
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      let res: Response;
      try {
        res = await fetch(entry.request.clone());
      } catch (err) {
        await queue.unshiftRequest(entry);
        throw err; // still offline; the browser will retry the sync later
      }
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { applicationId?: string };
        await del(APPLY_DRAFT_KEY);
        await notify(
          "Application submitted / आवेदन जमा हो गया",
          `${data.applicationId ?? ""} — tap to view your decision / अपना निर्णय देखें`,
          data.applicationId ? `/scoring?id=${data.applicationId}` : "/apply"
        );
      } else if (res.status === 401) {
        // Session expired while offline: keep the draft, ask the farmer to sign in and resend
        await notify("Sign in to send your application / आवेदन भेजने के लिए साइन इन करें", "Your form is saved on this phone.", "/login?role=farmer&redirect=/apply");
      } else {
        await notify("Application needs attention / आवेदन में सुधार करें", "Open the form to fix and resend it.", "/apply");
      }
    }
  },
});

serwist.registerRoute(
  new Route(
    ({ request, url, sameOrigin }) => sameOrigin && request.method === "POST" && url.pathname === "/api/applications",
    async ({ request }) => {
      const backup = request.clone();
      try {
        return await fetch(request);
      } catch {
        await applyQueue.pushRequest({ request: backup });
        return Response.json({ queued: true }, { status: 202 });
      }
    },
    "POST"
  )
);

// ─── Web Push ───────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data?.json() as { title?: string; body?: string; url?: string; tag?: string };
    } catch {
      return { title: "TVS Credit", body: event.data?.text() };
    }
  })();
  event.waitUntil(
    self.registration.showNotification(data?.title || "TVS Credit", {
      body: data?.body,
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      tag: data?.tag,
      data: { url: data?.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data?.url as string) || "/", self.location.origin);
  if (target.origin !== self.location.origin) return; // only ever open our own pages
  event.waitUntil(
    (async () => {
      for (const client of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) {
        if ("focus" in client) {
          await client.focus();
          return (client as WindowClient).navigate(target.href);
        }
      }
      return self.clients.openWindow(target.href);
    })()
  );
});

serwist.addEventListeners();
