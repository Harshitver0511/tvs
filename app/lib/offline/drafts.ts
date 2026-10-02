"use client";
// Offline-first application draft, stored in IndexedDB on the farmer's phone.
// Holds only what the farmer typed; cleared after a successful submit or on sign-out.
import { del, get, set } from "idb-keyval";
import { APPLY_DRAFT_KEY } from "./keys";

export interface ApplyDraft<TForm, TConsents> {
  form: TForm;
  consents: TConsents;
  plotCoords: [number, number][];
  computedAcres: number;
  plotSource: "drawn" | "gps_walk";
  idempotencyKey: string;
  savedAt: string;
}

export async function loadApplyDraft<TForm, TConsents>(): Promise<ApplyDraft<TForm, TConsents> | undefined> {
  try {
    return await get(APPLY_DRAFT_KEY);
  } catch {
    return undefined; // private mode / storage blocked
  }
}

export async function saveApplyDraft<TForm, TConsents>(draft: ApplyDraft<TForm, TConsents>): Promise<void> {
  try {
    await set(APPLY_DRAFT_KEY, draft);
  } catch {}
}

export async function clearApplyDraft(): Promise<void> {
  try {
    await del(APPLY_DRAFT_KEY);
  } catch {}
}
