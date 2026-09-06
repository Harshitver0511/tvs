# TVS Credit — Smart Lending Decision Hub ✅

## Build Complete — All 7 Routes Live

The full AI-Powered Smart Lending Decision Hub for TVS Credit is now running at **http://localhost:3000**.

---

## Pages Built

### 1. Landing Page (`/`)
Hero section, 3-step process (Apply → Score → Fund), TVS product portfolio, metrics.

![Landing Page](C:/Users/hverm/.gemini/antigravity-ide/brain/ecc413bf-f858-4f00-a6d9-67683fcf702f/landing_page_1788695502878.png)

---

### 2. Loan Application Flow (`/apply`)
3-step wizard with demo preset profiles, form inputs, satellite radar scanning animation, and routing to credit scoring.

![Apply Page](C:/Users/hverm/.gemini/antigravity-ide/brain/ecc413bf-f858-4f00-a6d9-67683fcf702f/apply_page_1788695532489.png)

---

### 3. Credit Scoring & Land Insights (`/scoring`) — 🏆 Flagship
- Leaflet satellite map with NDVI polygon overlay
- SHAP explainability bar chart (factor contributions)
- Weather & rainfall anomaly panel with drought risk flags
- 6-month NDVI vegetation trend chart
- Score badge with risk tier classification
- Harvest-aligned EMI offer with seasonal payment schedule

![Scoring Page](C:/Users/hverm/.gemini/antigravity-ide/brain/ecc413bf-f858-4f00-a6d9-67683fcf702f/scoring_page_1788695555892.png)

---

### 4. Staff Dashboard (`/staff`)
- KPI stat cards (Total Applications, Approvals, Avg Score, Exposure)
- Risk distribution pie chart & district score bar chart
- India-level risk concentration map (CircleMarkers by exposure/risk)
- Filterable applications table with risk tier badges

![Staff Dashboard](C:/Users/hverm/.gemini/antigravity-ide/brain/ecc413bf-f858-4f00-a6d9-67683fcf702f/staff_dashboard_1788695596189.png)

---

### 5. Portfolio Monitoring & Early Warnings (`/monitoring`)
- Severity-coded alert feed (High/Medium/Low)
- Satellite NDVI dips, rainfall deficits, mandi price slumps
- Action buttons: Notify Borrowers, Offer Restructuring, Dispatch Field Officer

![Monitoring Page](C:/Users/hverm/.gemini/antigravity-ide/brain/ecc413bf-f858-4f00-a6d9-67683fcf702f/monitoring_page_1788695628368.png)

---

### 6. TVS Sahayak GenAI Assistant (`/assistant`)
- Hindi/English language toggle
- Scripted Q&A covering documents, satellite verification, EMIs, eligibility, disbursement
- Quick-prompt chips and full chat interface

![Assistant Page](C:/Users/hverm/.gemini/antigravity-ide/brain/ecc413bf-f858-4f00-a6d9-67683fcf702f/assistant_page_1788695659842.png)

---

## Demo Recording

![Full app walkthrough](C:/Users/hverm/.gemini/antigravity-ide/brain/ecc413bf-f858-4f00-a6d9-67683fcf702f/tvs_hub_verification_1788695412624.webp)

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.3 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 + Custom CSS variables |
| Maps | react-leaflet + OpenStreetMap |
| Charts | Recharts (Bar, Pie, Area) |
| Fonts | Outfit (headings) + Inter (body) |
| Data | 4 real Indian agricultural district profiles |

## Project Structure
```
tvs/tvs/app/
├── page.tsx              # Landing page
├── layout.tsx            # Root layout
├── globals.css           # Design system
├── lib/data.ts           # Data store (applicants, warnings, Q&A)
├── apply/page.tsx        # Loan application flow
├── scoring/
│   ├── page.tsx          # SSR wrapper
│   └── ScoringClient.tsx # Flagship scoring page
├── staff/
│   ├── page.tsx          # SSR wrapper
│   └── StaffClient.tsx   # Staff dashboard
├── monitoring/page.tsx   # Early warnings
└── assistant/page.tsx    # GenAI chatbot
```

## Run Commands
```bash
cd tvs/tvs
npm run dev    # → http://localhost:3000
```
