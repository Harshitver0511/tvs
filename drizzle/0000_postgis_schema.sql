CREATE TABLE "applications" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"farmer_id" varchar(50) NOT NULL,
	"plot_id" varchar(50) NOT NULL,
	"product" varchar(100) NOT NULL,
	"requested_amount" integer NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"bureau_status" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"role" varchar(50) NOT NULL,
	"action" varchar(255) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(100) NOT NULL,
	"details" jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"purpose" varchar(100) NOT NULL,
	"consent_given" integer NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"application_id" varchar(50) PRIMARY KEY NOT NULL,
	"score" integer NOT NULL,
	"risk_tier" varchar(50) NOT NULL,
	"recommendation" text NOT NULL,
	"factors" jsonb NOT NULL,
	"offer" jsonb NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "farmers" (
	"user_id" varchar(50) PRIMARY KEY NOT NULL,
	"state" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"village" varchar(100) NOT NULL,
	"pincode" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_snapshots" (
	"application_id" varchar(50) PRIMARY KEY NOT NULL,
	"ndvi_score" double precision NOT NULL,
	"ndvi_series" jsonb NOT NULL,
	"cloud_free_pct" double precision NOT NULL,
	"rainfall_last_90d_mm" double precision NOT NULL,
	"rainfall_district_avg_mm" double precision NOT NULL,
	"rainfall_anomaly_pct" double precision NOT NULL,
	"soil_properties" jsonb NOT NULL,
	"mandi" jsonb NOT NULL,
	"alternative_score" double precision NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mandis" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" geometry(Point,4326) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"farmer_id" varchar(50) NOT NULL,
	"geom" geometry(Polygon,4326) NOT NULL,
	"area_acres" double precision NOT NULL,
	"declared_area_acres" double precision,
	"crop_type" varchar(100) NOT NULL,
	"irrigation" varchar(100) NOT NULL,
	"soil_type" varchar(100),
	"source" varchar(50) DEFAULT 'drawn' NOT NULL,
	"document_match_pct" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" varchar(20) DEFAULT 'farmer' NOT NULL,
	"preferred_lang" varchar(10) DEFAULT 'hi',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_farmer_id_users_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_snapshots" ADD CONSTRAINT "feature_snapshots_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_farmer_id_users_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mandis_location_gist" ON "mandis" USING gist ("location");--> statement-breakpoint
CREATE INDEX "plots_geom_gist" ON "plots" USING gist ("geom");