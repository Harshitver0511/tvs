import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TVS Credit — Kisan Loan",
    short_name: "TVS Kisan",
    description: "Apply for tractor and farm loans with satellite-verified land, harvest-aligned EMIs, in English or Hindi.",
    start_url: "/apply?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF8F5",
    theme_color: "#FFD152",
    lang: "hi-IN",
    dir: "ltr",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Apply for a loan / ऋण आवेदन", url: "/apply?source=pwa-shortcut", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
      { name: "TVS Sahayak", url: "/assistant", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
    ],
  };
}
