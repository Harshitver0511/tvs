import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // next-intl request config. Equivalent to next-intl's createNextIntlPlugin(), which
  // only adds this alias but pulls in a native SWC binary we don't otherwise need.
  turbopack: {
    resolveAlias: { "next-intl/config": "./i18n/request.ts" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // microphone=(self): voice input on farmer forms (Web Speech API)
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(self), microphone=(self), payment=()" },
        ],
      },
      {
        // The service worker must never be served stale
        source: "/serwist/:path*",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default withSerwist(nextConfig);
