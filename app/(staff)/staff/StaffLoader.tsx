"use client";
import dynamic from "next/dynamic";

// Leaflet needs `window`, so the desk is client-only and code-split.
const StaffClient = dynamic(() => import("./StaffClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-mono text-sm">
      Loading Credit Committee Underwriting Console...
    </div>
  ),
});

export default StaffClient;
