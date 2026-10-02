import { requirePageRole } from "@/app/lib/dal";
import { USER_ROLES } from "@/app/lib/roles";
import ConsentClient from "./ConsentClient";

export default async function ConsentPortalPage() {
  await requirePageRole([...USER_ROLES], "/consent");
  return <ConsentClient />;
}
