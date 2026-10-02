import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./drizzleSchema";

const connectionString = process.env.DATABASE_URL;

// Only create the connection if DATABASE_URL is available.
// Otherwise, db will be null and the index.ts layer falls back to in-memory.
export const client = connectionString
  ? postgres(connectionString, { prepare: false, onnotice: () => {} }) // ST_IsValid emits NOTICEs
  : null;

export const db = client ? drizzle(client, { schema }) : null;
