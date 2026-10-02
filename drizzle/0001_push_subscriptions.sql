CREATE TABLE "push_subscriptions" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
-- Server-only table: RLS on with no policies, so the public Supabase API cannot read or write it
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;
