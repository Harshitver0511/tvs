"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ArrowRight, Tractor, Satellite, Sprout, Bot, Bike, Sun, AlertTriangle, Coins, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Tractor, Satellite, Sprout, Bot, Bike, Sun, AlertTriangle, Coins };

export interface ProductCard {
  id: string;
  category: string;
  icon: keyof typeof ICONS;
  badge: string;
  title: string;
  desc: string;
  bg: string;
  link: string;
}

/** Small interactive island: filter chips + search over server-translated cards. */
export default function ProductGrid({
  cards,
  filters,
  searchPlaceholder,
  exploreLabel,
  noResults,
}: {
  cards: ProductCard[];
  filters: { id: string; label: string; bg: string }[];
  searchPlaceholder: string;
  exploreLabel: string;
  noResults: string;
}) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = cards.filter(
    (c) => (active === "all" || c.category === active) && (!q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2.5" role="group">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={active === f.id}
              onClick={() => setActive(f.id)}
              className="pulse-chip"
              style={{ backgroundColor: active === f.id ? "#000" : f.bg, color: active === f.id ? "#FFF" : "#000", minHeight: 44 }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 px-4 py-3 bg-white" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
          <Search size={20} strokeWidth={3} className="text-black/70" aria-hidden />
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent font-bold text-base text-black placeholder-black/50 outline-none"
          />
        </label>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-live="polite">
        {shown.length === 0 && <p className="font-bold">{noResults}</p>}
        {shown.map((card) => {
          const Icon = ICONS[card.icon];
          return (
            <article key={card.id} className="pulse-card p-6 flex flex-col justify-between gap-5" style={{ backgroundColor: card.bg }}>
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 flex items-center justify-center bg-white" style={{ border: "3px solid #000", boxShadow: "3px 3px 0 #000" }}>
                  <Icon size={22} strokeWidth={2.5} aria-hidden />
                </div>
                <span className="px-2.5 py-1 font-mono text-[10px] font-black uppercase text-white bg-black">{card.badge}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-black text-xl leading-tight uppercase tracking-tight text-black">{card.title}</h3>
                <p className="text-sm font-medium text-black leading-relaxed">{card.desc}</p>
              </div>
              <Link
                href={card.link}
                className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5 hover:underline pt-2 border-t-2 border-black/30"
                style={{ minHeight: 44 }}
              >
                {exploreLabel} <ArrowRight size={14} strokeWidth={3} aria-hidden />
              </Link>
            </article>
          );
        })}
      </section>
    </>
  );
}
