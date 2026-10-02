import { requirePageRole } from "@/app/lib/dal";
import AdminRolesClient from "./AdminRolesClient";

export default async function AdminRolesPage() {
  const admin = await requirePageRole(["admin"], "/admin/roles");
  return <AdminRolesClient adminId={admin.id} />;
}
