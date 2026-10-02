-- TVS Credit — Row-Level Security (defence in depth)
-- Applied by scripts/migrate-postgis.ts (or run in the Supabase SQL Editor).
--
-- The Next.js server talks to Postgres directly with the owner role (DATABASE_URL),
-- which bypasses RLS; all writes go through it after DAL authorization
-- (app/lib/dal.ts). These policies only govern Supabase's public REST/Realtime API
-- (anon / authenticated keys):
--   * no INSERT / UPDATE / DELETE policies at all → the public API is read-only
--   * roles come from the JWT's app_metadata (admin-controlled), never from a table
--     a user could edit
--   * farmers read only their own rows; field officers only their district

CREATE OR REPLACE FUNCTION public.tvs_jwt_role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'farmer') $$;

CREATE OR REPLACE FUNCTION public.tvs_jwt_district() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT auth.jwt() -> 'app_metadata' ->> 'district' $$;

CREATE OR REPLACE FUNCTION public.tvs_can_see_district(d text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT public.tvs_jwt_role() IN ('admin', 'credit_officer')
        OR (public.tvs_jwt_role() = 'field_officer' AND lower(d) = lower(public.tvs_jwt_district()))
  $$;

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots             ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandis            ENABLE ROW LEVEL SECURITY;

-- Farmer profile rows
CREATE POLICY users_select ON users FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR public.tvs_jwt_role() IN ('admin', 'credit_officer', 'field_officer'));

CREATE POLICY farmers_select ON farmers FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.tvs_can_see_district(district));

-- Applications and everything hanging off them follow the farmer's district
CREATE POLICY applications_select ON applications FOR SELECT TO authenticated
  USING (
    farmer_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM farmers f WHERE f.user_id = applications.farmer_id AND public.tvs_can_see_district(f.district))
  );

CREATE POLICY plots_select ON plots FOR SELECT TO authenticated
  USING (
    farmer_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM farmers f WHERE f.user_id = plots.farmer_id AND public.tvs_can_see_district(f.district))
  );

CREATE POLICY feature_snapshots_select ON feature_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM applications a WHERE a.id = feature_snapshots.application_id));

CREATE POLICY decisions_select ON decisions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM applications a WHERE a.id = decisions.application_id));

-- DPDP consents: own records only (admin for grievance handling)
CREATE POLICY consents_select ON consents FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.tvs_jwt_role() = 'admin');

-- Audit trail: credit officers and admin; append-only (no update/delete policies)
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT TO authenticated
  USING (public.tvs_jwt_role() IN ('admin', 'credit_officer'));

-- Mandi reference data is public
CREATE POLICY mandis_select ON mandis FOR SELECT TO anon, authenticated USING (true);
