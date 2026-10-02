#!/usr/bin/env tsx
/**
 * TVS Credit — bootstrap the single administrator account.
 *
 * The admin is the only role that cannot be granted from the UI. It is stored in
 * Supabase `app_metadata.role` (writable only with the service-role key).
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> ["Full Name"] [--replace]
 *
 *   ADMIN_PASSWORD   optional; if unset a strong random password is generated and printed once
 *   --replace        demote an existing admin (to farmer) and make <email> the admin
 */
import { randomBytes } from "crypto";
import * as dotenv from "dotenv";
import { createClient, type User } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

async function main() {
  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const [emailArg, nameArg] = args.filter((a) => !a.startsWith("--"));
  const email = emailArg?.trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> ["Full Name"] [--replace]');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const allUsers: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const otherAdmins = allUsers.filter((u) => u.app_metadata?.role === "admin" && u.email?.toLowerCase() !== email);
  if (otherAdmins.length && !replace) {
    console.error(
      `An admin already exists (${otherAdmins.map((u) => u.email).join(", ")}). ` +
        "There can be only one — re-run with --replace to transfer the admin role."
    );
    process.exit(1);
  }
  for (const u of otherAdmins) {
    await supabase.auth.admin.updateUserById(u.id, { app_metadata: { ...u.app_metadata, role: "farmer", district: null } });
    console.log(`Demoted previous admin ${u.email} → farmer`);
  }

  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");
  const name = nameArg || "TVS Credit Administrator";
  const existing = allUsers.find((u) => u.email?.toLowerCase() === email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: { ...existing.app_metadata, role: "admin", district: null },
      user_metadata: { ...existing.user_metadata, name },
      email_confirm: true,
      ...(process.env.ADMIN_PASSWORD ? { password } : {}),
    });
    if (error) throw error;
    console.log(`✓ ${email} promoted to admin${process.env.ADMIN_PASSWORD ? " (password updated)" : " (password unchanged)"}`);
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    console.log(`✓ Admin account created: ${email}`);
    if (generated) console.log(`  Temporary password (shown once): ${password}\n  Change it via "Forgot password" on /login.`);
  }
}

main().catch((e) => {
  console.error("create-admin failed:", e.message || e);
  process.exit(1);
});
