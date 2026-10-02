# Complete Production Deployment Guide
## TVS Credit Smart Lending Decision Hub

This guide walks you through deploying both components of the system to production:
1. **The Python FastAPI Geospatial ML & SHAP Microservice (`geo-ml`)**
2. **The Next.js 16 Web Application & PWA (`tvs`)**

---

## Architecture in Production

```
                                  USER BROWSER / PWA
                                          │
                                          ▼
                       Next.js 16 Web App (Hosted on Vercel)
                          https://tvs-pied.vercel.app
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
          Supabase Postgres        Upstash Redis           Python FastAPI ML
             + PostGIS               & QStash            (Render / Railway)
          (Database & Auth)      (Cache & Cron)      https://tvs-geo-ml.onrender.com
                  │                                               │
                  └───────────────► GEO_ML_SERVICE_URL ◄──────────┘
```

---

# Part 1: Deploying the Python ML Microservice (`geo-ml`)

You can deploy the Python service for free using **Render** or **Railway**.

### Option A: Deploy on Render (Recommended — Free & Simple)

1. **Sign Up / Log in**: Go to [render.com](https://render.com) and log in with your GitHub account.
2. **Create New Web Service**:
   - On the dashboard, click **"New +"** → **"Web Service"**.
   - Select **"Build and deploy from a Git repository"** and connect your repo: `Harshitver0511/tvs`.
3. **Configure the Service**:
   - **Name**: `tvs-geo-ml`
   - **Region**: `Singapore` (or closest to India for minimal latency)
   - **Branch**: `main`
   - **Root Directory**: `geo-ml` *(IMPORTANT: make sure to set this!)*
   - **Runtime**: `Python 3` (or `Docker`)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn service:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. **Click "Deploy Web Service"**:
   - Render will build the dependencies (`fastapi`, `lightgbm`, `xgboost`, `shap`, `scikit-learn`) and deploy.
   - Once live, you will get a public URL like:
     ```
     https://tvs-geo-ml.onrender.com
     ```
5. **Verify the Deployment**:
   - Open in your browser: `https://tvs-geo-ml.onrender.com/health`
   - You should see:
     ```json
     {
       "status": "ok",
       "service": "TVS Credit Geospatial Underwriting & SHAP Service",
       "version": "3.1.0"
     }
     ```
   - *Note your Render URL — you will need it for Next.js in Part 2!*

---

### Option B: Deploy on Railway (Alternative)

1. Go to [railway.app](https://railway.app) and click **"New Project"**.
2. Select **"Deploy from GitHub repo"** → Select `Harshitver0511/tvs`.
3. Under **Settings**:
   - Set **Root Directory** to `/geo-ml`.
   - Railway will automatically detect the `Dockerfile` we created in `geo-ml/Dockerfile`.
4. Click **"Generate Domain"** under Networking to get your public URL (e.g., `https://geo-ml-production.up.railway.app`).

---

# Part 2: Deploying the Next.js Web App (`tvs`)

The Next.js 16 app is hosted on **Vercel** (the creators of Next.js).

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New..."** → **"Project"**.
3. Import your GitHub repository: `Harshitver0511/tvs`.

### Step 2: Project Build Settings

- **Framework Preset**: `Next.js`
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build` (or `next build`)
- **Install Command**: `npm install`

### Step 3: Add Environment Variables in Vercel

In the Vercel project setup (under **Environment Variables**), add the following keys from your `.env.local`:

| Variable Name | Production Value / Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your live Vercel URL (e.g. `https://tvs-pied.vercel.app`) |
| `GEO_ML_SERVICE_URL` | **Your Python ML URL from Part 1** (e.g. `https://tvs-geo-ml.onrender.com`) |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tpudowdranwctqexioti.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Your Supabase anon public key)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Your Supabase service role secret key)* |
| `DATABASE_URL` | `postgresql://postgres:...@db.tpudowdranwctqexioti.supabase.co:5432/postgres?sslmode=require` |
| `DIRECT_URL` | `postgresql://postgres:...@db.tpudowdranwctqexioti.supabase.co:5432/postgres?sslmode=require` |
| `UPSTASH_REDIS_REST_URL` | `https://normal-ox-307716.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | *(Your Upstash token)* |
| `QSTASH_URL` | `https://qstash-eu-central-1.upstash.io` |
| `QSTASH_TOKEN` | *(Your QStash token)* |
| `QSTASH_CURRENT_SIGNING_KEY` | *(Your signing key)* |
| `QSTASH_NEXT_SIGNING_KEY` | *(Your next signing key)* |
| `COPERNICUS_CLIENT_ID` | `sh-6035abbc-01f7-466f-b648-fce6e56f6afd` |
| `COPERNICUS_CLIENT_SECRET` | `xzpfrjdvJBOumKzy1fVAQzbIdwtjWOFv` |
| `PII_ENCRYPTION_KEY` | `Ho/B2qTsK5xZapLTa9Rh64l3ElHKotRjYXx73d1tfLM=` |
| `JWT_SECRET` | `tvs_nandu_harshit_2026` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`| `BGy0OoQkgfwkfaLLG_6MQged_W6wPGxnTc8WUJPacGTPqWAYU1lVvBIBX05fRVRDEVfAskn4bETf9JZan1W5xR0` |
| `VAPID_PRIVATE_KEY` | `yYED4ZgRsE6fDcx7k7lXTSpE8Vmkqa75IW-DB0faV3c` |
| `VAPID_SUBJECT` | `mailto:support@tvscredit.com` |
| `CRON_SECRET` | `F56T9MvvueZqWja0EGJJZyKpI3bDTgD4` |

### Step 4: Click "Deploy"

Vercel will run Turbopack optimization, Serwist service worker bundling, and static generation. Within 1–2 minutes, your web application will be live!

---

# Part 3: Verification & Health Check

Once both services are deployed, test your live app:

1. **Test Landing Page**:
   - Open `https://your-app.vercel.app/`
   - Confirm Neo-Brutalist cards, navigation, and language switchers load instantly.
2. **Test TVS Sahayak (Gemini AI)**:
   - Go to `https://your-app.vercel.app/assistant`
   - Check the top badge: should show **"Gemini Ready"** (green dot).
   - Ask a question in Hindi or English (or click the microphone) and verify live responses.
3. **Test Satellite Scoring & Python ML Microservice**:
   - Go to `https://your-app.vercel.app/scoring`
   - When scoring an applicant, Next.js calls `POST /api/ml-score`.
   - The route handler forwards the payload to `GEO_ML_SERVICE_URL/underwrite`.
   - Verify that the LightGBM score (e.g. 750 / 900) and SHAP factor attribution waterfall render on the page!
4. **Test Redis & Upstash Health**:
   - Open `https://your-app.vercel.app/api/health`
   - Verifies Upstash Redis connectivity and cache latency.

---

# Pro-Tip for Hackathon / Finals Presentation

If Render's free tier goes to sleep after inactivity (takes ~30s to wake up on first call):
- The Next.js API route (`app/api/ml-score/route.ts`) has a built-in **automatic fallback**: if `GEO_ML_SERVICE_URL` is unreachable or warming up, it seamlessly computes scoring via the TypeScript engine without crashing or showing an error!
- To keep Render awake during your 15-minute presentation slot, simply visit `https://tvs-geo-ml.onrender.com/health` 5 minutes before your demo!
