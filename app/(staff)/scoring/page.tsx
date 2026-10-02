import { requirePageRole } from "@/app/lib/dal";
import { USER_ROLES } from "@/app/lib/roles";
import ScoringClient from "./ScoringLoader";

export default async function ScoringPage() {
  // Any signed-in user; /api/applications/[id] enforces who may see which application
  await requirePageRole([...USER_ROLES], "/scoring");
  return <ScoringClient />;
}
