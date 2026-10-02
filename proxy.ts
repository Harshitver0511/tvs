import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "./app/lib/rateLimit";
import { canAccessPath, isStaffRole, roleFromAppMetadata } from "./app/lib/roles";

// Next.js 16 Proxy: rate limiting, security headers, Supabase session refresh and
// optimistic RBAC redirects. Authoritative checks live in app/lib/dal.ts and run
// in every protected page and route handler — this is only the first gate.

type RateRule = keyof typeof RATE_LIMIT_RULES;

function rateRuleFor(pathname: string, method: string): RateRule | null {
  if (method === "GET" || method === "HEAD") return null;
  if (pathname === "/api/applications") return "apps:submit";
  if (pathname === "/api/ml-score") return "apps:score";
  if (pathname === "/api/consents") return "consent:manage";
  if (pathname === "/api/erasure") return "privacy:erasure";
  if (pathname === "/api/ocr") return "docs:ocr";
  if (pathname === "/api/auth/session") return "auth:session";
  if (pathname === "/api/assistant") return "assistant:chat";
  if (pathname.startsWith("/api/admin/")) return "admin:users";
  return null;
}

// Pages that need a signed-in user of any role (row-level checks happen server-side)
const SIGNED_IN_PREFIXES = ["/apply", "/scoring", "/consent", "/kfs"];

const CSP = [
  "default-src 'self'",
  // Next.js inline bootstrap scripts; 'unsafe-eval' only for dev Fast Refresh
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://server.arcgisonline.com https://services.arcgisonline.com https://*.supabase.co https://images.unsplash.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "geolocation=(self), camera=(self), microphone=(self), payment=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return res;
}

function loginRedirect(request: NextRequest, pathname: string, role: "farmer" | "staff", denied = false) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
  loginUrl.searchParams.set("role", role);
  if (denied) loginUrl.searchParams.set("denied", "1");
  return withSecurityHeaders(NextResponse.redirect(loginUrl));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Sliding-window rate limiting on sensitive mutations
  const rule = rateRuleFor(pathname, request.method);
  if (rule) {
    const rl = await checkRateLimit(getClientIp(request), rule);
    if (!rl.success) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Too many requests. Please wait and try again.", retryAfter: rl.reset },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, rl.reset - Math.floor(Date.now() / 1000))),
              "X-RateLimit-Limit": String(rl.limit),
              "X-RateLimit-Remaining": String(rl.remaining),
            },
          }
        )
      );
    }
  }

  // 2. Supabase session refresh (rotates auth cookies)
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  withSecurityHeaders(response);

  // API routes authorize themselves via the DAL (and return 401/403 JSON)
  if (pathname.startsWith("/api/")) return response;

  // 3. Optimistic page RBAC. Role comes only from app_metadata (admin-controlled).
  const needsStaff = pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/monitoring");
  const needsSignIn = needsStaff || SIGNED_IN_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsSignIn) return response;

  if (!user) return loginRedirect(request, pathname, needsStaff ? "staff" : "farmer");

  const role = roleFromAppMetadata(user.app_metadata);
  if (!canAccessPath(role, pathname)) {
    return loginRedirect(request, pathname, isStaffRole(role) || needsStaff ? "staff" : "farmer", true);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pptx)$).*)",
  ],
};
