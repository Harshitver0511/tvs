# TVS Credit Smart Lending Hub — Production Roadmap (National Finals)

Goal: turn the Round-2 prototype (all mock data, all client-side) into a secure, fast, installable (PWA), farmer-first lending app that runs on **real data** wherever public APIs allow.

> Next.js here is **16.3**, which has breaking changes (e.g. `middleware.ts` → `proxy.ts`). Before writing Next-specific code, check `node_modules/next/dist/docs/`.

---

## Current state (what we start from)

| Area | Today | Problem |
|---|---|---|
| Data | `app/lib/data.ts`, 4 hard-coded applicants, 4 warnings | Nothing real; scores are typed in, not computed |
| Rendering | Every page is `"use client"` | Heavy JS bundle; slow on 2G/3G/low-end Android |
| Layout | Navbar copy-pasted into 7 files | Hard to maintain |
| Backend | None | No auth, no DB, no API, no audit trail |
| Assistant | Keyword matching on `assistantQA` | Not real AI |
| PWA | None | Not installable, no offline |
| Security | None | No login, no validation, no compliance |
| Bugs | `/apply` form ignored; `/staff?district=` ignored; deck spacebar broken | — |

---

## Target architecture

```
 Farmer phone (PWA, Hindi/regional, offline drafts)      Staff browser (RBAC)
                    │                                          │
                    └──────────────► Next.js 16 (Vercel, Mumbai bom1) ◄──────┘
                                     • Server Components + Route Handlers / Server Actions
                                     • Auth (OTP for farmers, email/SSO for staff)
                                     • zod validation, rate limiting, security headers
                                            │
              ┌─────────────────────────────┼──────────────────────────────┐
              ▼                             ▼                              ▼
   Postgres + PostGIS               Redis (Upstash)               Python FastAPI "geo-ml" service
   (Supabase / Neon)                cache + rate limit            • Sentinel-2 NDVI (Copernicus)
   users, plots (geometry),         + job queue                   • Weather features (NASA POWER)
   applications, decisions,                                       • Scoring model + SHAP
   audit_log, consents                                            (Render / Railway / Fly, India region if possible)
                                            │
                     External APIs: Copernicus, NASA POWER, Open-Meteo, data.gov.in (mandi),
                     SoilGrids, India Post pincode, Bhashini, Claude API, Setu/Digio sandbox
```

---

## Phase 0 — Setup & hygiene (Day 1)

**What changes**
- Turn the folder into a git repo and push to GitHub (private).
- Install dependencies and confirm the prototype still runs.
- Fix the 3 known bugs.
- Add `.env.example`.

**How**
1. `git init`, commit the prototype as the baseline, create GitHub repo, push.
2. `npm install && npm run dev` — confirm all 7 routes load.
3. Bug fixes:
   - `app/deck/page.tsx`: `e.key === "Space"` → `e.key === " "`.
   - `app/staff/StaffClient.tsx`: read `district` with `useSearchParams()` and pre-filter the table.
   - `/apply`: send the actual form data (not just the preset id) — will be replaced by a real POST in Phase 2.
4. Remove duplicate root-level `TVS_Credit_Smart_Lending_Deck.pptx` (keep the one in `public/`).
5. Create `.env.example` listing every key used in later phases (no real values).

**Done when**: repo on GitHub, app runs, bugs fixed.

---

## Phase 1 — Foundation: architecture, DB, auth (Days 2–5)

### 1.1 Shared layout & Server Components
**What**: one navbar, and pages rendered on the server so the phone downloads far less JavaScript.

**How**
- Create `app/components/Navbar.tsx` (server component) + small `NavLinks` client component only for active-link highlighting. Delete the 7 copies.
- Use route groups:
  - `app/(farmer)/…` — apply, my-loans, assistant (mobile-first layout)
  - `app/(staff)/…` — dashboard, monitoring, application detail (desktop layout, protected)
  - `app/(marketing)/…` — landing, deck
- Remove `"use client"` from page files. Keep it only on interactive leaf components (map, charts, forms, chat box).
- Maps/charts: load with `dynamic(() => import(...), { ssr: false })` **inside** a client component so they're split into their own chunk and only downloaded when needed.
- Move fonts from the CSS `@import` of Google Fonts to `next/font/google` (self-hosted, no render-blocking request).

### 1.2 Database (Postgres + PostGIS)
**What**: real persistent storage replacing `data.ts`.

**How**
- Create a Supabase (or Neon) project in the Mumbai region; enable the `postgis` extension.
- Use **Drizzle ORM** (lightweight, good with PostGIS) — `app/db/schema.ts`, migrations in `drizzle/`.
- Tables:

| Table | Key columns |
|---|---|
| `users` | id, phone (unique), name, role (`farmer`/`field_officer`/`credit_officer`/`admin`), preferred_lang, created_at |
| `farmers` | user_id, state, district, village, pincode, lgd_code |
| `plots` | id, farmer_id, `geom geometry(Polygon,4326)`, area_acres (computed with `ST_Area`), crop_type, irrigation, source (`drawn`/`gps_walk`) |
| `applications` | id, farmer_id, plot_id, product, requested_amount, status (`draft`/`submitted`/`scoring`/`decided`/`disbursed`), created_at |
| `feature_snapshots` | application_id, ndvi_series jsonb, rainfall jsonb, soil jsonb, mandi jsonb, fetched_at |
| `decisions` | application_id, score, risk_tier, factors jsonb (SHAP), offer jsonb, model_version, decided_by (`model`/user id) |
| `consents` | user_id, purpose, text_version, granted_at, revoked_at, ip |
| `audit_log` | actor_id, action, entity, entity_id, before jsonb, after jsonb, at |
| `early_warnings` | district, crop, type, severity, metrics jsonb, generated_at |

- Seed script `scripts/seed.ts` loads today's 4 demo applicants so the demo never looks empty.

### 1.3 Authentication & roles
**What**: farmers log in with phone OTP; staff log in with email + role-based access.

**How**
- **Supabase Auth** (phone OTP via Twilio/MSG91 provider, email for staff) — or Auth.js if not using Supabase.
- `proxy.ts` (Next 16 replacement for middleware — verify in docs) protects `/(staff)` routes; server-side role check in every staff page/action as well (never rely on the proxy alone).
- Row-Level Security in Postgres: farmer can only read their own rows; staff by role.

**Done when**: a farmer can log in, create a draft application saved in the DB; staff pages redirect when not logged in.

---

## Phase 2 — Real data integrations (Days 5–10) ⭐ biggest demo impact

All external calls happen **server-side** (keys never reach the browser) and are **cached in Redis** per plot/day so repeat views are instant.

### 2.1 Plot capture (replacement for Bhulekh land records)
**What**: since Bhulekh/Bhoomi need government permission, the farmer provides the land boundary themselves, and satellites verify it.

**How**
- Map screen with **draw polygon** (`leaflet-draw` / `@geoman-io/leaflet-geoman-free`) on satellite tiles (Esri World Imagery for display).
- **GPS walk mode**: farmer walks the field edge; `navigator.geolocation.watchPosition` collects points → polygon.
- Compute area server-side with PostGIS `ST_Area(geom::geography)` → acres. Flag if declared acres differ >20%.
- **7/12 / Khatauni photo upload** → OCR (Google Vision / Azure Document Intelligence / Tesseract) to extract owner name + survey number; fuzzy-match against applicant name. Shown to credit officer as "document match %".
- Roadmap slide: AgriStack Farmer Registry + consent-based land record fetch once TVS gets access.

### 2.2 Satellite NDVI — Copernicus Data Space (Sentinel-2)
**What**: real crop-health time series for the exact plot.

**How** (in the Python service, `geo-ml/app/ndvi.py`)
- Register free at dataspace.copernicus.eu → create OAuth client.
- Token: `POST https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`
- Stats: `POST https://sh.dataspace.copernicus.eu/api/v1/statistics` with the plot polygon, date range (last 6–12 months), 10–15 day interval, evalscript computing `(B08-B04)/(B08+B04)` and masking clouds using `SCL`.
- Return mean NDVI per interval + cloud-free pixel %. Compare with same season last year.
- Fallback: Microsoft Planetary Computer STAC (`sentinel-2-l2a`) if quota runs out.
- Also return a small NDVI PNG of the plot (Process API) to overlay on the map.

### 2.3 Rainfall & weather — NASA POWER + Open-Meteo
**What**: real 90-day rainfall vs the long-term average → anomaly %, plus 7-day forecast.

**How**
- History: `GET https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MAX&community=AG&latitude={lat}&longitude={lng}&start={YYYYMMDD}&end={YYYYMMDD}&format=JSON`
  - Pull last 10 years → compute same-window average → `anomaly% = (current - avg)/avg`.
- Forecast: `GET https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&daily=precipitation_sum,temperature_2m_max&timezone=Asia/Kolkata`
- Cache: history 24h, forecast 3h.

### 2.4 Mandi prices — data.gov.in (Agmarknet)
**What**: real commodity price at nearest mandi + trend (feeds scoring and early warnings).

**How**
- Get free API key at data.gov.in.
- `GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=KEY&format=json&filters[state]=Maharashtra&filters[commodity]=Cotton&limit=100`
  (Current daily mandi price dataset — confirm resource id on the portal.)
- Store daily snapshots in DB via a cron job to build our own price history (the API gives only current prices).
- Mandi distance: keep a table of mandi lat/lng (geocode once), compute nearest with PostGIS `ST_Distance`.

### 2.5 Soil & location
- Soil: `GET https://rest.isric.org/soilgrids/v2.0/properties/query?lon=..&lat=..&property=clay&property=soc&property=phh2o&depth=0-30cm&value=mean` (can be slow/unstable → cache aggressively, fall back to state-level soil type).
- Pincode → district/state: `GET https://api.postalpincode.in/pincode/{pin}` (auto-fills the form).
- Reverse geocode plot centroid: Nominatim (respect 1 req/s; self-host later).

### 2.6 Identity & finance (sandbox, clearly labeled)
- Aadhaar eKYC / DigiLocker / PAN / bank account verification / Account Aggregator: use **Setu** or **Digio** sandbox APIs. Show "Sandbox" badge in UI — be honest with judges.
- Credit bureau: no public access → keep as "bureau status" field from sandbox/mock, mark clearly.

### 2.7 Pipeline wiring
- `POST /api/applications/:id/submit` → sets status `scoring`, enqueues job (Upstash QStash or Inngest).
- Job calls geo-ml service `POST /features` (NDVI, weather, soil, mandi) → saves `feature_snapshots` → calls `POST /score` → saves `decisions`.
- Farmer page polls / uses server-sent events to show live progress ("Scanning satellite… ✓ Rainfall… ✓").

**Done when**: a new plot drawn anywhere in India produces real NDVI, rainfall anomaly, soil, and mandi data on `/scoring`.

---

## Phase 3 — Real scoring engine with explainability (Days 9–13)

**What**: scores computed from live features, with real SHAP explanations, instead of hard-coded numbers.

**How** (in `geo-ml/`)
1. **Features**: NDVI mean/peak/trend vs last year, rainfall anomaly, irrigation type, soil quality, land size, mandi distance, mandi price trend, crop type, loan-to-land-value ratio, alt-data (UPI/utility from sandbox AA).
2. **Model**:
   - Build a **synthetic training set** (e.g. 20k farmers) with realistic distributions and default logic based on agri-credit research; state this openly.
   - Train **LightGBM/XGBoost**; also keep a transparent **points-based scorecard** (logistic regression) as a challenger model.
   - Calibrate to probability of default → map to 300–900 score + risk tier.
3. **Explainability**: `shap.TreeExplainer` per application → top factors with plain-language reason text in Hindi/English (these feed the existing SHAP bar chart).
4. **Offer engine**: approved amount from land size + crop + score; **harvest-aligned EMI schedule** generated from crop calendar (kharif/rabi harvest months per crop per state) instead of hard-coded months.
5. **Governance**: `model_version` saved with every decision; score below threshold → routed to credit officer ("human in the loop"); officer override requires a reason, stored in `audit_log`.
6. Fairness check: make sure the model doesn't use gender/caste/religion; show a simple fairness report in the deck.

**Done when**: changing the plot or rainfall changes the score and explanations live.

---

## Phase 4 — Security & regulatory compliance (Days 12–15)

**What**: things a lending company's judges will specifically look for.

**How**
- **Input validation**: zod schema on every Server Action / Route Handler.
- **Rate limiting**: `@upstash/ratelimit` on OTP, submit, and assistant endpoints.
- **Security headers** in `next.config.ts`: CSP (allow only our tile/API domains), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy (geolocation only on self).
- **Secrets**: only in env vars on the server; never `NEXT_PUBLIC_` for API keys.
- **PII protection**: never store raw Aadhaar (store reference/masked `XXXX-XXXX-1234`); encrypt phone & document numbers at column level (pgcrypto); private storage bucket for document images with signed URLs.
- **DPDP Act 2023**: consent screen per purpose (KYC, satellite analysis, credit check) in the farmer's language, stored in `consents`; "withdraw consent" and "delete my data" options; privacy notice.
- **RBI Digital Lending Directions**:
  - Key Fact Statement (KFS) page before acceptance: APR, all fees, EMI schedule, cooling-off period.
  - Grievance Redressal Officer details on the app.
  - Loan disbursed/repaid only to/from borrower's bank account.
  - Data stored in India (Mumbai region).
- **Audit log** for every status change, decision, and staff view of PII.
- Dependency scanning (GitHub Dependabot), `npm audit` in CI.

**Done when**: security headers score A on securityheaders.com; KFS + consent flow work end to end.

---

## Phase 5 — PWA & low latency (Days 14–17)

**What**: installable app that works on cheap phones, weak signal, and offline.

**How**
- **Manifest**: `app/manifest.ts` (built-in in Next) — name, icons (192/512 + maskable), `display: standalone`, theme color, `lang`.
- **Service worker**: **Serwist** (`@serwist/next`) — precache app shell, cache-first for fonts/icons/map tiles already seen, network-first for API data.
- **Offline drafts**: application form saves to IndexedDB (`idb-keyval`) on each field change; Background Sync submits when online; show "Saved offline — will send when network returns".
- **Performance budget**: first-load JS < 150 KB on farmer pages; LCP < 2.5s on "Slow 3G" in Lighthouse.
  - Server Components (Phase 1), lazy-load map/charts, `next/image`, subset fonts, remove unused lucide icons.
  - Use `@next/bundle-analyzer` to find heavy chunks (Recharts/Leaflet should only load on pages that use them).
  - Farmer pages: text + icons first, map loads on tap ("View my field").
- **Low-data mode**: toggle that hides satellite imagery and uses lightweight tiles.
- **Edge caching**: static pages + cached API responses with `revalidate`.

**Done when**: app installs on Android, application can be filled in airplane mode and auto-submits later, Lighthouse PWA + Performance ≥ 90.

---

## Phase 6 — Farmer-first UX: language, voice, notifications (Days 16–19)

**What**: usable by farmers with low literacy, in their language.

**How**
- **i18n**: `next-intl` with `en`, `hi`, `mr`, `ta`, `pa` (matches our 4 demo states). All strings moved to `messages/*.json`.
- **Voice**: Bhashini APIs (register at bhashini.gov.in) — speech-to-text for form fields and assistant; text-to-speech to read out the offer and EMI schedule.
- **UI**: large tap targets (≥ 48px), icon + text on every action, number inputs with Indian formatting (₹4,50,000), progress stepper, minimal typing (dropdowns, voice).
- **Accessibility**: check contrast of the neo-brutalist palette (pink/yellow on white), screen-reader labels.
- **Notifications**: SMS + WhatsApp (Gupshup / Twilio / MSG91 WhatsApp API) for sanction, KFS link, EMI reminders a week before harvest-EMI dates; web push for installed PWA.

**Done when**: a full application can be completed in Hindi using voice.

---

## Phase 7 — Real AI assistant "TVS Sahayak" (Days 18–20)

**What**: replace keyword matching with a real LLM that knows the TVS products and the farmer's own application.

**How**
- Route Handler `app/api/assistant/route.ts` calling the **Claude API** (streaming) — key server-side only.
- **Grounding (RAG)**: TVS product docs / FAQs / RBI KFS rules stored as embeddings (pgvector in the same Postgres) → retrieve top chunks → answer only from them.
- **Personal context** (with consent): the logged-in farmer's application status, EMI dates, NDVI summary — via tool calls, never other farmers' data.
- Guardrails: system prompt restricts to lending/farming topics; never promises approval; hands off to human ("Talk to field officer") button.
- Voice in/out via Bhashini (Phase 6). Rate limited.
- Keep the old scripted `assistantQA` as offline fallback.

---

## Phase 8 — Staff dashboard & early warnings on real data (Days 19–22)

**What**: staff tools that make decisions and monitor risk using live data.

**How**
- `/staff`: server-side paginated queries from DB (filters: district, crop, status, risk tier, date); KPIs computed via SQL; application detail page with map, features, SHAP, documents, **approve / reject / override** actions (audit-logged).
- **Early warnings engine**: daily cron (Vercel Cron / Inngest) per district in the portfolio:
  - NDVI drop vs last year > X% across active plots
  - Rainfall anomaly worse than −30% (NASA POWER / Open-Meteo forecast)
  - Mandi price fall > 15% in 2 weeks
  → writes `early_warnings`; `/monitoring` reads from DB.
- Actions become real: "Notify borrowers" sends WhatsApp/SMS, "Offer restructuring" creates a task, "Dispatch field officer" assigns a visit — all audit-logged.
- Portfolio map: PostGIS clustering for many plots.

---

## Phase 9 — Quality, observability, deployment (throughout, finalize Days 22–24)

- **Tests**: Vitest (scoring helpers, EMI schedule, validators), pytest (geo-ml features/model), Playwright E2E (login → apply → score → KFS → accept).
- **CI**: GitHub Actions — lint, typecheck, tests, build on every PR.
- **Monitoring**: Sentry (frontend + backend), Vercel Analytics / Speed Insights, structured logs for external API failures.
- **Resilience**: every external API has timeout + retry + cached fallback; UI shows "data from X days ago" instead of breaking.
- **Deploy**: Vercel (region `bom1`), geo-ml on Render/Railway/Fly, Supabase Mumbai. Separate `staging` and `production` environments.

---

## Phase 10 — Finals demo preparation (last 2–3 days)

- **Demo script**: farmer installs PWA → Hindi voice → draws field / GPS walk → live satellite scan → real score + SHAP → harvest EMI → KFS + consent → staff approves → early warning triggers WhatsApp.
- **Backup**: pre-cached demo applicants and a recorded video in case venue internet fails (offline PWA helps here).
- **Deck updates** (`app/deck/page.tsx` + `generate_deck.py`): architecture diagram, real data sources table, security/compliance slide, model explainability & fairness, latency numbers (Lighthouse on slow 3G), roadmap (AgriStack, Account Aggregator, bureau integration, TVS dealer network).
- Be explicit about what is **real** (satellite, weather, mandi, soil) vs **sandbox** (eKYC, AA) vs **synthetic** (training data).

---

## Accounts / API keys to create (start now — some take days)

| Service | Purpose | Cost |
|---|---|---|
| GitHub | Code, CI | Free |
| Supabase or Neon | Postgres + PostGIS + Auth | Free tier |
| Upstash | Redis cache, rate limit, QStash | Free tier |
| Copernicus Data Space | Sentinel-2 NDVI | Free (quota) |
| NASA POWER | Rainfall history | Free, no key |
| Open-Meteo | Forecast | Free (non-commercial) |
| data.gov.in | Mandi prices | Free key |
| Bhashini | Indian-language voice/translation | Free (registration approval) |
| Anthropic (Claude API) | Assistant | Paid, small |
| Setu / Digio sandbox | eKYC, DigiLocker, AA | Free sandbox |
| Twilio / MSG91 / Gupshup | OTP, SMS, WhatsApp | Trial credits |
| Sentry | Error monitoring | Free tier |
| Vercel, Render/Railway | Hosting | Free/hobby |

---

## Progress tracker

- [ ] Phase 0 — Setup & bug fixes
- [ ] Phase 1 — Server components, shared layout, DB, auth
- [ ] Phase 2 — Real data (plot capture, NDVI, weather, mandi, soil, sandbox KYC)
- [ ] Phase 3 — Real scoring + SHAP + offer engine
- [ ] Phase 4 — Security & RBI/DPDP compliance
- [ ] Phase 5 — PWA & low latency
- [ ] Phase 6 — Languages, voice, notifications
- [ ] Phase 7 — Real AI assistant
- [ ] Phase 8 — Staff dashboard & early warnings on real data
- [ ] Phase 9 — Tests, CI, monitoring, deploy
- [ ] Phase 10 — Finals demo prep
