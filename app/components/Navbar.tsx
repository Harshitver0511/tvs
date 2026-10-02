"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Tractor,
  Satellite,
  Activity,
  Bot,
  ShieldCheck,
  FileText,
  Home,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  KeyRound,
  Scale,
  Layers,
  LogOut,
  Bell,
  BellOff,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { setLowData, useLowData } from "./pwa/connectivity";
import { enablePush, disablePush, getPushSubscription, isPushSupported } from "../lib/push/client";
import { clearApplyDraft } from "../lib/offline/drafts";
import type { UserRole } from "../lib/roles";

interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
}

// Farmers (and visitors) only see borrower tools; staff see the underwriting tools.
const FARMER_PRIMARY: NavItem[] = [
  { href: "/", key: "home", icon: Home },
  { href: "/apply", key: "apply", icon: Tractor },
];
const FARMER_MORE: NavItem[] = [
  { href: "/assistant", key: "assistant", icon: Bot },
  { href: "/consent", key: "consent", icon: Scale },
  { href: "/deck", key: "deck", icon: FileText },
];
const STAFF_PRIMARY: NavItem[] = [
  { href: "/", key: "home", icon: Home },
  { href: "/staff", key: "staff", icon: ShieldCheck },
];
const STAFF_MORE: NavItem[] = [
  { href: "/scoring", key: "scoring", icon: Satellite },
  { href: "/monitoring", key: "monitoring", icon: Activity },
  { href: "/assistant", key: "assistant", icon: Bot },
  { href: "/deck", key: "deck", icon: FileText },
];

const noopSubscribe = () => () => {};

function LowDataToggle() {
  const t = useTranslations("nav");
  const lowData = useLowData();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={lowData}
      onClick={() => setLowData(!lowData)}
      title={t("lowDataHint")}
      className={`px-2.5 py-1.5 text-xs font-black border-2 border-black flex items-center gap-1.5 cursor-pointer ${
        lowData ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
      }`}
      style={{ boxShadow: "2px 2px 0 #000" }}
    >
      <Gauge className="w-4 h-4" aria-hidden />
      <span className="hidden sm:inline">{t("lowData")}</span>
      <span className="sr-only sm:hidden">{t("lowData")}</span>
    </button>
  );
}

function PushToggle() {
  const t = useTranslations("push");
  const locale = useLocale();
  const supported = useSyncExternalStore(noopSubscribe, isPushSupported, () => false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supported) return;
    getPushSubscription()
      .then((s) => setSubscribed(!!s))
      .catch(() => setSubscribed(false));
  }, [supported]);

  if (!supported) return null;

  const toggle = async () => {
    setMessage("");
    if (subscribed) {
      await disablePush();
      setSubscribed(false);
      return;
    }
    const result = await enablePush(locale);
    if (result === "enabled") setSubscribed(true);
    else setMessage(t(result));
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="w-full p-2 border-2 border-black bg-[#FAF8F5] hover:bg-[#FFD152] flex items-center gap-2 font-display font-black text-xs uppercase cursor-pointer"
      >
        {subscribed ? <BellOff className="w-4 h-4" aria-hidden /> : <Bell className="w-4 h-4" aria-hidden />}
        <span>{subscribed ? t("disable") : t("enable")}</span>
      </button>
      {message && <p className="text-[11px] mt-1 text-red-700 font-bold">{message}</p>}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUser(data?.authenticated ? data.user : null))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    try {
      const { createClient } = await import("../lib/supabase");
      await createClient().auth.signOut();
    } catch {}
    await fetch("/api/auth/me", { method: "POST" }).catch(() => {});
    await disablePush().catch(() => {});
    await clearApplyDraft(); // shared phones: don't leave one farmer's draft for the next user
    setCurrentUser(null);
    window.location.href = "/login";
  };

  const isStaff = !!currentUser && currentUser.role !== "farmer";
  const primary = isStaff ? STAFF_PRIMARY : FARMER_PRIMARY;
  const more = isStaff
    ? [...STAFF_MORE, ...(currentUser?.role === "admin" ? [{ href: "/admin/roles", key: "admin", icon: ShieldCheck }] : [])]
    : FARMER_MORE;
  const isMoreActive = more.some((i) => pathname === i.href);
  const closeMenus = () => {
    setMoreMenuOpen(false);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white select-none" style={{ borderBottom: "3px solid #000" }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 text-black no-underline shrink-0" aria-label={t("homeAria")}>
          <div
            className="w-10 h-10 flex items-center justify-center text-black border-2 border-black"
            style={{ backgroundColor: "var(--pulse-yellow)", boxShadow: "2px 2px 0 #000" }}
          >
            <Tractor className="w-5 h-5" aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base sm:text-xl tracking-tight leading-none font-display">TVS CREDIT</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-700 hidden sm:inline">
              {t("tagline")}
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5" aria-label={t("mainNav")}>
          {primary.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 text-xs font-black uppercase font-display border-2 flex items-center gap-1.5 no-underline ${
                  active ? "bg-black text-white border-black" : "bg-white text-black border-transparent hover:border-black"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                <span>{t(`links.${item.key}`)}</span>
              </Link>
            );
          })}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              aria-expanded={moreMenuOpen}
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`px-3 py-2 text-xs font-black uppercase font-display border-2 border-black flex items-center gap-1.5 cursor-pointer ${
                isMoreActive ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-50"
              }`}
            >
              <Layers className="w-4 h-4" aria-hidden />
              <span>{t("more")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {moreMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white p-2 z-50" style={{ border: "3px solid #000", boxShadow: "5px 5px 0 #000" }}>
                {more.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      aria-current={active ? "page" : undefined}
                      className={`p-2 border-2 flex items-start gap-2.5 no-underline ${
                        active ? "bg-black text-white border-black" : "bg-white hover:bg-[#FAF8F5] text-black border-transparent hover:border-black"
                      }`}
                    >
                      <Icon className="w-5 h-5 mt-0.5 shrink-0" aria-hidden />
                      <span>
                        <span className="block font-display font-black text-xs uppercase">{t(`links.${item.key}`)}</span>
                        <span className={`block text-[11px] ${active ? "text-neutral-300" : "text-neutral-700"}`}>
                          {t(`desc.${item.key}`)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher />
          <div className="hidden sm:block">
            <LowDataToggle />
          </div>

          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="px-2.5 py-1.5 text-xs font-bold border-2 border-black flex items-center gap-1.5 cursor-pointer bg-[#2ED573] hover:bg-[#52E08A]"
                style={{ boxShadow: "2px 2px 0 #000" }}
              >
                {isStaff ? <ShieldCheck className="w-4 h-4" aria-hidden /> : <Tractor className="w-4 h-4" aria-hidden />}
                <span className="font-display font-black uppercase text-[11px] truncate max-w-[110px] hidden sm:inline">
                  {currentUser.name.split(" ")[0]}
                </span>
                <span className="sr-only">{t("accountMenu")}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white p-3 z-50 space-y-2" style={{ border: "3px solid #000", boxShadow: "5px 5px 0 #000" }}>
                  <div className="border-b-2 border-black pb-2">
                    <div className="font-display font-black text-sm uppercase truncate">{currentUser.name}</div>
                    <div className="text-[11px] font-mono text-neutral-700 truncate">{currentUser.email}</div>
                    <span className="inline-block mt-1 text-[10px] font-mono font-bold uppercase bg-neutral-100 px-1.5 py-0.5 border border-neutral-400">
                      {t(`roles.${currentUser.role}`)}
                    </span>
                  </div>
                  {!isStaff && <PushToggle />}
                  {!isStaff && (
                    <Link
                      href="/consent"
                      onClick={closeMenus}
                      className="w-full p-2 border-2 border-black bg-[#FAF8F5] hover:bg-[#FFD152] flex items-center gap-2 no-underline text-black font-display font-black text-xs uppercase"
                    >
                      <Scale className="w-4 h-4" aria-hidden />
                      <span>{t("links.consent")}</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white border-2 border-black font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden />
                    <span>{t("signOut")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="pulse-btn px-2.5 py-1.5 text-xs text-black no-underline bg-white hover:bg-neutral-100"
              style={{ border: "2px solid #000" }}
            >
              <KeyRound className="w-4 h-4 sm:mr-1" aria-hidden />
              <span className="hidden sm:inline font-mono font-bold">{t("signIn")}</span>
              <span className="sr-only sm:hidden">{t("signIn")}</span>
            </Link>
          )}

          {!isStaff && (
            <Link
              href="/apply"
              className="pulse-btn hidden md:inline-flex px-3 py-1.5 text-xs text-black no-underline"
              style={{ backgroundColor: "var(--pulse-yellow)" }}
            >
              <Sparkles className="w-4 h-4 mr-1" aria-hidden />
              <span>{t("applyNow")}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 border-2 border-black bg-white cursor-pointer"
            style={{ boxShadow: "2px 2px 0 #000" }}
            aria-expanded={mobileMenuOpen}
            aria-label={t("toggleMenu")}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          className="lg:hidden bg-[#FAF8F5] px-4 py-4 space-y-2 max-h-[85vh] overflow-y-auto"
          style={{ borderTop: "3px solid #000" }}
          aria-label={t("mainNav")}
        >
          {[...primary, ...more].map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-3 border-2 text-sm font-black uppercase font-display no-underline ${
                  active ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-[#FFD152]"
                }`}
                style={{ boxShadow: "2px 2px 0 #000", minHeight: 48 }}
              >
                <Icon className="w-5 h-5" aria-hidden />
                <span>{t(`links.${item.key}`)}</span>
              </Link>
            );
          })}
          <div className="pt-2">
            <LowDataToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
