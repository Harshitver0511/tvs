-- TVS Credit Smart Lending Hub — PostgreSQL & Supabase Row-Level Security (RLS) Policies
-- Implements Zero-Trust RBAC and DPDP Act data isolation per Phase 1.3

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enable RLS on All Tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role from auth JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    (SELECT role FROM users WHERE id = auth.uid()::text)
  );
$$ LANGUAGE sql STABLE;

-- ==============================================================================
-- 3. USERS & FARMERS POLICIES
-- ==============================================================================
-- Farmers can only read/edit their own profile
CREATE POLICY "farmers_own_profile_select" ON users
  FOR SELECT USING (auth.uid()::text = id OR auth.user_role() IN ('credit_officer', 'field_officer', 'admin'));

CREATE POLICY "farmers_own_profile_update" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "farmers_details_select" ON farmers
  FOR SELECT USING (auth.uid()::text = user_id OR auth.user_role() IN ('credit_officer', 'field_officer', 'admin'));

-- ==============================================================================
-- 4. PLOTS & APPLICATIONS POLICIES (Row-Level Security)
-- ==============================================================================
-- Farmers can only view and create plots for their own account
CREATE POLICY "plots_farmer_isolation_select" ON plots
  FOR SELECT USING (
    farmer_id = auth.uid()::text 
    OR auth.user_role() IN ('credit_officer', 'field_officer', 'admin')
  );

CREATE POLICY "plots_farmer_insert" ON plots
  FOR INSERT WITH CHECK (
    farmer_id = auth.uid()::text
  );

-- Applications: Farmers see ONLY their own applications; Staff see by role
CREATE POLICY "applications_farmer_isolation_select" ON applications
  FOR SELECT USING (
    farmer_id = auth.uid()::text
    OR auth.user_role() IN ('credit_officer', 'admin')
    OR (auth.user_role() = 'field_officer' AND EXISTS (
      SELECT 1 FROM farmers f 
      WHERE f.user_id = applications.farmer_id 
      AND f.district = (SELECT district FROM staff WHERE user_id = auth.uid()::text)
    ))
  );

CREATE POLICY "applications_farmer_insert" ON applications
  FOR INSERT WITH CHECK (
    farmer_id = auth.uid()::text
  );

CREATE POLICY "applications_staff_update" ON applications
  FOR UPDATE USING (
    auth.user_role() IN ('credit_officer', 'admin')
  );

-- ==============================================================================
-- 5. DECISIONS & AUDIT LOG POLICIES
-- ==============================================================================
-- Decisions readable by applicant farmer and credit officers; only writable by credit officers & ML service
CREATE POLICY "decisions_select" ON decisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = decisions.application_id AND (a.farmer_id = auth.uid()::text OR auth.user_role() IN ('credit_officer', 'field_officer', 'admin')))
  );

CREATE POLICY "decisions_credit_officer_modify" ON decisions
  FOR ALL USING (
    auth.user_role() IN ('credit_officer', 'admin')
  );

-- Audit log: strictly append-only, readable only by compliance admins and credit officers
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (
    auth.user_role() IN ('credit_officer', 'admin')
  );

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Consents (DPDP Act): Farmers manage their own consent revocations
CREATE POLICY "consents_user_policy" ON consents
  FOR ALL USING (
    user_id = auth.uid()::text OR auth.user_role() = 'admin'
  );
