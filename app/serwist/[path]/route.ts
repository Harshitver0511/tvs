import { createSerwistRoute } from "@serwist/turbopack";

// Serves the bundled service worker at /serwist/sw.js (Turbopack-compatible Serwist build)
const revision = process.env.VERCEL_GIT_COMMIT_SHA || `${Date.now()}`;

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "app/sw.ts",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  useNativeEsbuild: true,
});
