"use client";
import dynamic from "next/dynamic";

const StaffClient = dynamic(() => import("./StaffClient"), { ssr: false });

export default function StaffPage() {
  return <StaffClient />;
}
