import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TVS Credit — Smart Lending Decision Hub",
  description: "AI-Powered Smart Lending for Rural India. Satellite analytics, alternative credit scoring, harvest-aligned EMIs, and GenAI loan assistance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
