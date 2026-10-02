import { db } from "./app/lib/db/drizzle";
import { users, farmers, plots, applications, featureSnapshots, decisions } from "./app/lib/db/drizzleSchema";

async function clearDatabase() {
  console.log("Connecting to database...");
  try {
    if (!db) {
      console.log("Database connection not available.");
      return;
    }
    console.log("Wiping all tables...");
    
    await db.delete(decisions);
    await db.delete(featureSnapshots);
    await db.delete(applications);
    await db.delete(plots);
    await db.delete(farmers);
    await db.delete(users);
    
    console.log("Database wiped successfully!");
  } catch (err) {
    console.error("Error wiping database:", err);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
