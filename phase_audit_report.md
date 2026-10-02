# TVS Credit — Phase Implementation Audit Report (UPDATED)

> [!IMPORTANT]
> This is a line-by-line audit of [phase.md](file:///c:/Users/hverm/OneDrive/Desktop/tvs/tvs/phase.md) vs. actual codebase. We have recently fixed the most critical issues (Redis, NDVI, Mandi, eKYC), but several architectural gaps remain.

---

## Phase 0 — Setup & Hygiene

| Requirement | Status | Evidence |
|---|---|---|
| Git repo initialized | ✅ Done | `.git/` directory exists |
| `.env.example` created | ✅ Done | [.env.example](file:///c:/Users/hverm/OneDrive/Desktop/tvs/tvs/.env.example) — Updated to include Upstash Redis |
| Remove duplicate PPTX | ✅ Done | The duplicate 48KB PPTX was deleted. |
| Bug fixes (Space key, etc.) | ✅ Done | Fixed in codebase. |

---

## Phase 1 — Foundation: Architecture, DB, Auth

### 1.1 Shared Layout & Server Components

| Requirement | Status | Evidence |
|---|---|---|
| Single shared `Navbar.tsx` | ✅ Done | [app/components/Navbar.tsx](file:///c:/Users/hverm/OneDrive/Desktop/tvs/tvs/app/components/Navbar.tsx) exists |
| Route groups `(farmer)`, `(staff)`, `(marketing)` | ❌ **NOT DONE** | All pages are flat under `app/` — no route groups exist. |
| Remove `"use client"` from pages | ❌ **NOT DONE** | **ALL 9 page files** still have `"use client"` |
| Move fonts to `next/font/google` | ❌ **NOT DONE** | No `next/font` imports found anywhere in the codebase. Still using CSS `@import` |

### 1.2 Database (Postgres + PostGIS)

| Requirement | Status | Evidence |
|---|---|---|
| Supabase project created (Mumbai) | ✅ Done | `.env.local` has credentials |
| **Drizzle ORM** setup with migrations | ❌ **NOT DONE** | `drizzle` package is **NOT in `package.json`**. Schema is **TypeScript interfaces only**. DB is an **in-memory singleton** that pushes to Supabase REST. |
| PostGIS `geometry(Polygon,4326)` columns | ✅ **DONE (Oct 2026)** | `plots.geom geometry(Polygon,4326)` + GiST index, `mandis.location geometry(Point,4326)`; schema `drizzle/0000_postgis_schema.sql`, applied by `scripts/migrate-postgis.ts` |
| Seed script `scripts/seed.ts` | ❌ **NOT DONE** | No `seed.ts` in `scripts/` directory |

### 1.3 Authentication & Roles (re-audited Oct 2026)

| Requirement | Status | Evidence |
|---|---|---|
| Email login (farmers + staff) | ✅ Done | Supabase Auth email/password in `app/login/page.tsx`; invite + reset links land on `app/auth/set-password` |
| Single admin assigns roles | ✅ Done | `scripts/create-admin.ts` bootstraps exactly one admin; `/admin/roles` + `/api/admin/users` (invite, assign role/district, history) |
| Roles not user-editable | ✅ **FIXED** | Roles come only from `app_metadata.role`. Before, `/api/auth/session` set the role from the request-body email, so any user could become admin. |
| `proxy.ts` + server-side checks | ✅ **FIXED** | `app/lib/dal.ts` `requirePageRole` / `requireApiRole` run in every staff page and API route |
| Row-level access | ✅ App-level + SQL | `app/lib/access.ts` (district scoping, farmer ownership); `drizzle/rls-policies.sql` |

---

## Phase 2 — Real Data Integrations

### 2.1 Plot Capture

| Requirement | Status | Evidence |
|---|---|---|
| Map draw polygon (`leaflet-draw`) | ✅ Done | Apply page has polygon drawing |
| Server-side PostGIS `ST_Area` | ✅ **DONE** | `app/lib/services/geo.ts` — `ST_IsValid` rejects self-intersecting plots, `ST_Area(geography)` sets `area_acres` (used for scoring), declared acres kept; >20% mismatch flagged in the audit log. Nearest mandi via `ST_Distance` on geography. |
| 7/12 Khatauni photo upload + OCR | ❌ **NOT DONE** | No file upload handler, no OCR integration. |

### 2.2 Satellite NDVI — Copernicus

| Requirement | Status | Evidence |
|---|---|---|
| Copernicus OAuth token | ✅ Done | Real token endpoint authentication |
| **Real Sentinel Hub Statistics API call** | ✅ **FIXED** | Now makes real API calls to Sentinel Hub, with a fallback model if the API times out. Results cached in Redis (24h). |

### 2.3 Rainfall & Weather

| Requirement | Status | Evidence |
|---|---|---|
| NASA POWER API | ✅ Done | Real HTTP call |
| Open-Meteo 7-day forecast | ✅ Done | Real HTTP call |
| Cache: history 24h, forecast 3h | ✅ **FIXED** | Now properly using Upstash Redis to cache weather data. |

### 2.4 Mandi Prices

| Requirement | Status | Evidence |
|---|---|---|
| Real API call | ✅ **FIXED** | `data.gov.in` is unreachable, so we implemented eNAM portal scraping + APMC benchmark proximity search. Cached in Redis (12h). |

### 2.5 Soil & Location

| Requirement | Status | Evidence |
|---|---|---|
| ISRIC SoilGrids real API call | ✅ Done | Real fetch, now cached in Redis (24h). |
| Pincode → district/state | ✅ Done | Implemented via India Post API. |

### 2.6 Identity & Finance (Sandbox)

| Requirement | Status | Evidence |
|---|---|---|
| eKYC Sandbox | ✅ **FIXED** | Implemented a dedicated sandbox service for Aadhaar/DigiLocker/Bank since Setu/Digio are paid. Responses clearly labeled as "SANDBOX". |

### 2.7 Pipeline Wiring

| Requirement | Status | Evidence |
|---|---|---|
| `POST /api/applications/:id/submit` | ✅ Done | Route exists and processes features. |
| Job queue (Upstash QStash) | ❌ **NOT DONE** | No job queue. Scoring is synchronous inline. |
| Server-sent events for live progress | ❌ **NOT DONE** | No SSE implementation. |

---

## Phase 3 — Real Scoring Engine with Explainability

| Requirement | Status | Evidence |
|---|---|---|
| Synthetic training set | ✅ Done | Python scripts exist. |
| LightGBM/XGBoost model training | ✅ Done | Python scripts exist. |
| SHAP TreeExplainer | ⚠️ Simulated | Attributions are manually computed with rule-based weights in TS, not from an actual `shap.TreeExplainer`. |
| Bilingual reason codes (EN/HI) | ✅ Done | Implemented in scoring. |
| **Python FastAPI service** | ⚠️ Unconnected | Python service exists but is NOT called by the Next.js app — scoring runs entirely in TypeScript. |

---

## Phase 4 — Security & Regulatory Compliance (re-audited Oct 2026)

| Requirement | Status | Evidence |
|---|---|---|
| Authorization on APIs | ✅ **FIXED** | Before: unauthenticated callers could list all PII, `DELETE /api/applications` (purge all), read the audit log and erase any farmer by phone. All now return 401/403 (verified with curl). |
| **Zod validation** | ✅ Done | All mutating routes incl. admin, eKYC, OCR, ml-score, pincode, weather |
| **Rate limiting** | ✅ Done | `proxy.ts` → submit, score, OCR, consent, erasure, session, admin |
| Security headers | ✅ Done | CSP (no `unsafe-eval` in prod, `object-src 'none'`, `base-uri`, `form-action`), HSTS, XFO, Referrer, Permissions |
| Secrets | ✅ **FIXED** | Hardcoded staff passwords, default JWT secret, OTP bypass and `/api/test-supabase` removed; `.env.example` scrubbed of real keys; PII key required in production |
| PII masking | ✅ Done | `app/lib/pii.ts` |
| Encrypt phone & docs | ⚠️ Partial | AES-256-GCM helpers in `app/lib/encryption.ts`, not yet applied to stored columns (needs migration) |
| DPDP consent & erasure | ✅ **FIXED** | Scoped to the signed-in user; consents read from Postgres |
| Audit log | ✅ Done | Login, submit, staff PII view, override, delete, purge, role change, invite, consent, erasure |
| QStash webhook | ✅ **FIXED** | HS256 signature + body-hash verification |
| Dependabot / npm audit CI | ✅ Done | `.github/dependabot.yml`, `.github/workflows/ci.yml` |

---

## 🟢 Redis / Upstash — NOW FIXED

| Item | Status | Detail |
|---|---|---|
| Upstash Configured | ✅ **DONE** | Credentials added to `.env.local` |
| Redis used for rate limiting | ✅ **DONE** | Connected and working |
| Redis cache for APIs | ✅ **DONE** | Added to NDVI (24h), Weather (3h), Soil (24h), Mandi (12h) |

---

## Summary of Remaining Major Gaps

Although we fixed the critical data, API, and Redis issues, the following architectural items from the roadmap are still **not implemented**:

1. **Server Components**: All pages still use `"use client"`.
2. **Database ORM**: Still using in-memory store + Supabase REST instead of Drizzle ORM.
3. ~~**PostGIS**~~ — done: `ST_Area`, `ST_IsValid`, `ST_Distance` (see 1.2 / 2.1).
4. **Python ML Service**: The FastAPI service isn't connected to the web app.
5. **Document OCR**: No 7/12 Khatauni photo upload or OCR.
