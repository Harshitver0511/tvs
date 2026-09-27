@AGENTS.md

# TVS Credit — Smart Lending Decision Hub

Front-end demo/prototype for TVS Credit: AI-assisted rural lending (tractor/farm loans) using satellite crop data (NDVI), rainfall anomalies, alternative credit signals, and harvest-aligned EMIs. **No backend, no API calls, no database** — everything is driven by static mock data in `app/lib/data.ts`.

## Commands
- `npm install` — `node_modules` is not installed yet
- `npm run dev` → http://localhost:3000
- `npm run build` / `npm run lint`
- `python generate_deck.py` — regenerates `TVS_Credit_Smart_Lending_Deck.pptx` in the CWD (needs `python-pptx`). The `/deck` page's download link serves `public/TVS_Credit_Smart_Lending_Deck.pptx`, so copy the output there.

## Stack
Next.js 16.3 (App Router, TS) — breaking changes vs. older Next; check `node_modules/next/dist/docs/` before using Next APIs. React 19, Tailwind CSS 4, react-leaflet 5 + OpenStreetMap tiles, Recharts 3, lucide-react icons. No test suite.

## Routes (all `"use client"`)
| Route | File | What it does |
|---|---|---|
| `/` | `app/page.tsx` | Landing page: hero, filterable product cards, search |
| `/apply` | `app/apply/page.tsx` | 3-step wizard: pick preset applicant → fake satellite scan (2.8s timeout) → `router.push('/scoring?id=<id>')` |
| `/scoring` | `page.tsx` → `ScoringClient.tsx` | Flagship. Reads `?id=` (default `APP-1042`). Leaflet plot polygon, SHAP-style factor bar chart, NDVI area chart, rainfall panel, score/risk tier, harvest EMI offer |
| `/staff` | `page.tsx` → `StaffClient.tsx` | Staff dashboard: KPIs, risk pie, district bar chart, India map CircleMarkers, filterable table (ALL/APPROVED/CONDITIONAL/REVIEW) |
| `/monitoring` | `app/monitoring/page.tsx` | Early-warning feed from `earlyWarnings`; action buttons only toggle local state |
| `/assistant` | `app/assistant/page.tsx` | "TVS Sahayak" chatbot, EN/HI toggle. Scripted: keyword-matches `assistantQA` triggers, no real LLM |
| `/deck` | `app/deck/page.tsx` | 10-slide in-browser pitch deck (arrow-key nav, fullscreen, .pptx download) |

`scoring/page.tsx` and `staff/page.tsx` are thin wrappers using `dynamic(..., { ssr: false })` because Leaflet needs `window`. Keep that pattern for any new map component.

## Data (`app/lib/data.ts`)
- `Applicant` interface + `applicants[]` — 4 hand-written profiles, each with precomputed `scoring` (score, riskTier, factors, offer + harvestEmiSchedule):
  - `APP-1042` Ramesh Patil, Yavatmal MH, cotton — 74, Low-Medium
  - `APP-1088` Gurpreet Singh Dhillon, Bathinda PB — 88, Very Low
  - `APP-1104` Murugan Selvam, Cauvery delta TN, paddy — 79, Low
  - `APP-1135` Suresh Chandra Yadav, Sehore MP, soybean — 53, Elevated
- `EarlyWarning` + `earlyWarnings[]` — 4 district alerts (`EW-901`…`EW-904`)
- `assistantQA` — `{ en: [...], hi: [...] }` of `{ triggers, answer }`
- Scores are **not computed** anywhere; they're hard-coded. Staff thresholds: ≥70 approved, 55–69 conditional, <55 review (≥80 / 70–79 buckets in the pie).

## Design system (`app/globals.css`)
"Pulse" neo-brutalist style: cream bg `#FAF8F5`, black 3px borders, hard offset shadows, zero radius. Palette vars `--pulse-yellow #FFD152`, `--pulse-pink #FF6B6B`, `--pulse-purple #B8A9FF`, `--pulse-green #2ED573`. Fonts: Archivo Black (display), Space Grotesk (body), Space Mono. Utility classes: `.pulse-card`, `.pulse-btn`, `.pulse-pill`, `.pulse-chip`, `.bg-grid-pattern`, `.bg-dot-banner`, `.animate-ticker`. Pages mostly use Tailwind classes + inline `style` with hex values. Leaflet CSS loaded from unpkg in `app/layout.tsx`.

## Known quirks / gotchas
- The top navbar is **copy-pasted into every page** (no shared component); nav changes must be made in each file.
- `/apply` form edits are cosmetic: only the selected preset `id` is passed to `/scoring`.
- `/monitoring` links to `/staff?district=...` but `StaffClient` doesn't read search params.
- `/deck` keydown checks `e.key === "Space"` (the real value is `" "`), so spacebar doesn't advance.
- `walkthrough.md` is an earlier build report: its font list (Outfit/Inter) is stale and screenshot paths point to another machine.
- `TVS_Credit_Smart_Lending_Deck.pptx` exists both at the project root and in `public/`.
- Not a git repo.
