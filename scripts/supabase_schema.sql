-- SUPERSEDED: the live schema is now drizzle/0000_postgis_schema.sql (PostGIS),
-- applied with `npx tsx scripts/migrate-postgis.ts`. Kept for reference only.

-- ==============================================================================
-- TVS CREDIT SMART LENDING DECISION HUB — SUPABASE INITIALIZATION SCHEMA
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable PostGIS Extension (For satellite plot polygons & spatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'farmer',
    preferred_lang TEXT DEFAULT 'hi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Farmers Profile Table
CREATE TABLE IF NOT EXISTS farmers (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT,
    pincode TEXT,
    lgd_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Plots Table (Cadastral land boundaries)
CREATE TABLE IF NOT EXISTS plots (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    geom JSONB NOT NULL,
    area_acres NUMERIC(6, 2) NOT NULL,
    crop_type TEXT NOT NULL,
    irrigation TEXT NOT NULL,
    soil_type TEXT,
    source TEXT DEFAULT 'drawn',
    document_match_pct NUMERIC(5, 2) DEFAULT 95.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plot_id TEXT REFERENCES plots(id) ON DELETE SET NULL,
    product TEXT NOT NULL,
    requested_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    bureau_status TEXT DEFAULT 'Verified via Alternative Data & Geospatial AI',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Feature Snapshots Table (Sentinel-2, Weather, Mandi, Soil)
CREATE TABLE IF NOT EXISTS feature_snapshots (
    id BIGSERIAL PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    ndvi_score NUMERIC(4, 3),
    ndvi_series JSONB,
    cloud_free_pct NUMERIC(5, 2),
    rainfall_last_90d_mm NUMERIC(8, 2),
    rainfall_district_avg_mm NUMERIC(8, 2),
    rainfall_anomaly_pct NUMERIC(6, 2),
    soil_properties JSONB,
    mandi JSONB,
    alternative_score NUMERIC(5, 2),
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Decisions Table (Explainable AI & Underwriting Offers)
CREATE TABLE IF NOT EXISTS decisions (
    id BIGSERIAL PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    risk_tier TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    factors JSONB NOT NULL,
    offer JSONB NOT NULL,
    decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Audit Log Table (Immutable Underwriting Trail)
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details JSONB
);

-- 9. Create Consents Table (DPDP Act Compliance)
CREATE TABLE IF NOT EXISTS consents (
    id BIGSERIAL PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    consent_given BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- ==============================================================================
-- 10. ENABLE ROW LEVEL SECURITY & POLICIES
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- Allow service_role key full unrestricted access (Used by Next.js Backend & API routes)
CREATE POLICY "service_role_all_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_farmers" ON farmers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_plots" ON plots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_applications" ON applications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_features" ON feature_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_decisions" ON decisions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_audit" ON audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_consents" ON consents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon public read access for submitted applications (or farmer access)
CREATE POLICY "anon_read_applications" ON applications FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_decisions" ON decisions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_plots" ON plots FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_users" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_farmers" ON farmers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_features" ON feature_snapshots FOR SELECT TO anon USING (true);

-- 10. GRANT PERMISSIONS (Required for PostgREST & Supabase API)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
