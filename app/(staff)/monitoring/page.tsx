import { requirePageRole } from "@/app/lib/dal";
import { STAFF_ROLES } from "@/app/lib/roles";
import MonitoringClient from "./MonitoringClient";

export default async function MonitoringPage() {
  await requirePageRole(STAFF_ROLES, "/monitoring");
  return <MonitoringClient />;
}
