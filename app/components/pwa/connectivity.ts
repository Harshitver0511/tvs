"use client";
import { useSyncExternalStore } from "react";

// ─── Online / offline ──────────────────────────────────────────────────────
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

// ─── Low-data mode ─────────────────────────────────────────────────────────
// Explicit choice is remembered on the device; otherwise it follows the
// browser's Save-Data flag / a 2G connection.
const STORAGE_KEY = "tvs_low_data";
const EVENT = "tvs-low-data-change";

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", cb: () => void) => void;
  removeEventListener?: (type: "change", cb: () => void) => void;
}

function connection(): NetworkInformationLike | undefined {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

function readStored(): "1" | "0" | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "1" || v === "0" ? v : null;
  } catch {
    return null;
  }
}

export function autoLowData(): boolean {
  const c = connection();
  return !!c && (c.saveData === true || c.effectiveType === "2g" || c.effectiveType === "slow-2g");
}

function getLowData(): boolean {
  const stored = readStored();
  return stored === null ? autoLowData() : stored === "1";
}

function subscribeLowData(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  connection()?.addEventListener?.("change", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
    connection()?.removeEventListener?.("change", cb);
  };
}

export function useLowData(): boolean {
  return useSyncExternalStore(subscribeLowData, getLowData, () => false);
}

/** true/false = explicit choice; null = go back to automatic detection. */
export function setLowData(value: boolean | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
