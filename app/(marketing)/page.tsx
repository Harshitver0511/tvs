import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sprout, FileText, AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";
import ProductGrid, { type ProductCard } from "./_components/ProductGrid";

// Server Component: text is rendered on the server; only the filter/search grid ships JS.
const CARDS: Omit<ProductCard, "title" | "desc" | "badge">[] = [
  { id: "tractor", category: "machinery", icon: "Tractor", bg: "#FF6B6B", link: "/apply" },
  { id: "satellite", category: "satellite", icon: "Satellite", bg: "#FFD152", link: "/apply" },
  { id: "harvest", category: "harvest", icon: "Sprout", bg: "#B8A9FF", link: "/apply" },
  { id: "sahayak", category: "satellite", icon: "Bot", bg: "#FFFFFF", link: "/assistant" },
  { id: "bike", category: "machinery", icon: "Bike", bg: "#FF6B6B", link: "/apply" },
  { id: "solar", category: "machinery", icon: "Sun", bg: "#FFD152", link: "/apply" },
  { id: "warnings", category: "warnings", icon: "AlertTriangle", bg: "#B8A9FF", link: "/deck" },
  { id: "gold", category: "harvest", icon: "Coins", bg: "#FFFFFF", link: "/apply" },
];

const FILTERS = [
  { id: "all", bg: "#FFFFFF" },
  { id: "machinery", bg: "#FF6B6B" },
  { id: "satellite", bg: "#FFD152" },
  { id: "harvest", bg: "#B8A9FF" },
  { id: "warnings", bg: "#FFFFFF" },
];

export default async function Home() {
  const t = await getTranslations("landing");

  return (
    <div className="min-h-screen w-full bg-grid-pattern farmer-ui" style={{ backgroundColor: "var(--pulse-cream)" }}>
      <Navbar />

      <div className="w-full overflow-hidden py-2 text-white font-black text-xs tracking-widest uppercase select-none bg-black" aria-hidden>
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          {[1, 2].map((i) => (
            <span key={i} className="flex items-center gap-6">
              {(["t1", "t2", "t3", "t4", "t5"] as const).map((k) => (
                <span key={k}>★ {t(`ticker.${k}`)}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col gap-12">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000" }}>
              ✦ {t("badges.edition")}
            </span>
            <span className="pulse-pill" style={{ backgroundColor: "#FFD152", color: "#000" }}>
              {t("badges.inclusion")}
            </span>
          </div>

          <h1 className="flex flex-col font-black tracking-tight leading-[0.95]">
            <span className="text-5xl sm:text-7xl md:text-8xl text-black">{t("hero.line1")}</span>
            <span className="flex items-center flex-wrap gap-3 mt-1 sm:mt-2">
              <span className="text-5xl sm:text-7xl md:text-8xl text-black">{t("hero.line2a")}</span>
              {/* black on pink: 7.9:1 (white on pink was 2.6:1) */}
              <span
                className="text-5xl sm:text-7xl md:text-8xl px-4 py-1 text-black inline-block -rotate-1"
                style={{ backgroundColor: "#FF6B6B", border: "4px solid #000", boxShadow: "6px 6px 0 #000" }}
              >
                {t("hero.line2b")}
              </span>
            </span>
            <span className="mt-2">
              <span
                className="text-4xl sm:text-6xl md:text-7xl text-black px-3 py-1 inline-block"
                style={{ backgroundColor: "#FFD152", border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}
              >
                {t("hero.line3")}
              </span>
            </span>
          </h1>

          <p className="font-medium text-lg sm:text-xl text-black max-w-2xl leading-relaxed mt-2">{t("hero.body")}</p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/apply" className="pulse-btn px-7 py-4 text-base gap-2" style={{ backgroundColor: "#FFD152", color: "#000", boxShadow: "5px 5px 0 #000" }}>
              <Sprout size={20} strokeWidth={2.5} aria-hidden />
              {t("cta.apply")} →
            </Link>
            <Link href="/deck" className="pulse-btn px-7 py-4 text-base gap-2" style={{ backgroundColor: "#FFFFFF", color: "#000", boxShadow: "5px 5px 0 #000" }}>
              <FileText size={20} strokeWidth={2.5} aria-hidden />
              {t("cta.deck")} →
            </Link>
          </div>
        </div>

        <section
          className="p-8 sm:p-12 relative overflow-hidden"
          style={{
            backgroundColor: "#FFD152",
            backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            border: "4px solid #000",
            boxShadow: "6px 6px 0 #000",
          }}
        >
          <h2 className="font-black text-4xl sm:text-6xl uppercase text-white tracking-tight inline-block px-4 py-2 mb-4 bg-black">{t("products.title")}</h2>
          <p className="font-bold text-base text-black max-w-xl bg-[#FFD152]">{t("products.body")}</p>
        </section>

        <ProductGrid
          cards={CARDS.map((c) => ({
            ...c,
            title: t(`cards.${c.id}.title`),
            desc: t(`cards.${c.id}.desc`),
            badge: t(`cards.${c.id}.badge`),
          }))}
          filters={FILTERS.map((f) => ({ ...f, label: t(`filters.${f.id}`) }))}
          searchPlaceholder={t("search")}
          exploreLabel={t("explore")}
          noResults={t("noResults")}
        />

        <section
          className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          style={{ backgroundColor: "#FF6B6B", border: "4px solid #000", boxShadow: "6px 6px 0 #000" }}
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-2xl sm:text-4xl uppercase tracking-tight text-black leading-tight">{t("radar.title")}</h3>
            <p className="font-medium text-base text-black max-w-xl">{t("radar.body")}</p>
          </div>
          <Link href="/deck" className="pulse-btn px-6 py-4 text-sm font-black whitespace-nowrap gap-2" style={{ backgroundColor: "#FFD152", color: "#000", boxShadow: "4px 4px 0 #000" }}>
            <AlertTriangle size={18} strokeWidth={2.5} aria-hidden />
            {t("radar.cta")} →
          </Link>
        </section>
      </main>

      <footer className="mt-16 py-10 px-6 sm:px-8 text-black bg-white" style={{ borderTop: "4px solid #000" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="px-3 py-1 font-black text-sm tracking-tight bg-[#FFD152]" style={{ border: "2px solid #000", boxShadow: "3px 3px 0 #000" }}>
            TVS CREDIT
          </div>
          <div className="font-mono text-xs text-black">{t("footer")}</div>
        </div>
      </footer>
    </div>
  );
}
