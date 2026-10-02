import { Suspense } from "react";
import { requirePageRole } from "@/app/lib/dal";
import { STAFF_ROLES } from "@/app/lib/roles";
import StaffClient from "./StaffLoader";

export default async function StaffPage() {
  await requirePageRole(STAFF_ROLES, "/staff");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-mono text-sm">
          Initializing Staff Desk...
        </div>
      }
    >
      <StaffClient />
    </Suspense>
  );
}
