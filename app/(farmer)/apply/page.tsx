"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Satellite,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  UploadCloud,
  ShieldCheck,
  MapPin,
  User,
  LandPlot,
  Crosshair,
  Scale,
  Lock,
  CheckSquare,
  Square,
  X,
  Loader2,
  WifiOff,
  Map as MapIcon,
  Bell,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import { VoiceInputButton } from "../../components/voice/VoiceButtons";
import { useLowData, useOnline } from "../../components/pwa/connectivity";
import { loadApplyDraft, saveApplyDraft, clearApplyDraft } from "../../lib/offline/drafts";
import { enablePush, getPushSubscription, isPushSupported } from "../../lib/push/client";
import { parseSpokenNumber, parseSpokenDigits, matchSpokenOption, CROP_OPTIONS, IRRIGATION_OPTIONS } from "../../lib/voice/parse";
import { formatINR } from "../../lib/format";

const PlotCaptureMap = dynamic(() => import("./PlotCaptureMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] bg-neutral-100 animate-pulse flex items-center justify-center" style={{ border: "3px solid #000" }}>
      <Satellite className="w-6 h-6 animate-spin text-[#C62828]" aria-hidden />
    </div>
  ),
});

type Step = 1 | 2 | 3 | "queued";

interface ApplyForm {
  name: string;
  phone: string;
  aadhaarMasked: string;
  pincode: string;
  district: string;
  state: string;
  village: string;
  landSizeAcres: number;
  cropType: string;
  irrigation: string;
  loanProduct: string;
  requestedAmount: number;
}

interface Consents {
  ekyc: boolean;
  satellite_analysis: boolean;
  mandi_financial: boolean;
}

const EMPTY_FORM: ApplyForm = {
  name: "",
  phone: "",
  aadhaarMasked: "XXXX-XXXX-",
  pincode: "",
  district: "",
  state: "",
  village: "",
  landSizeAcres: 0,
  cropType: "Cotton (Bt)",
  irrigation: "Borewell & Rainfed",
  loanProduct: "Tractor Loan (50 HP)",
  requestedAmount: 350000,
};

const CROPS = ["Cotton (Bt)", "Wheat (Sharbati)", "Paddy / Rice (Samba)", "Soybean (JS-335)", "Sugarcane (Co 0238)"] as const;
const IRRIGATION = ["Borewell & Rainfed", "Perennial Canal", "Drip Micro-Irrigation", "Strictly Rainfed"] as const;
const CONSENT_IDS = ["ekyc", "satellite_analysis", "mandi_financial"] as const;
const SCAN_STEPS = 6;

const noopSubscribe = () => () => {};
const inputCls = "w-full p-2.5 border-2 border-black bg-[#FAF8F5] font-bold";

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16)
      );
}

function FieldLabel({ htmlFor, children, voice }: { htmlFor: string; children: React.ReactNode; voice?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-2 mb-1">
      <label htmlFor={htmlFor} className="block font-bold uppercase text-xs">
        {children}
      </label>
      {voice}
    </div>
  );
}

function PushPrompt() {
  const t = useTranslations("push");
  const locale = useLocale();
  const supported = useSyncExternalStore(noopSubscribe, isPushSupported, () => false);
  const [state, setState] = useState<"idle" | "enabled" | "denied" | "unavailable" | "error">("idle");

  useEffect(() => {
    if (!supported) return;
    getPushSubscription()
      .then((s) => s && setState("enabled"))
      .catch(() => {});
  }, [supported]);

  if (!supported || state === "enabled") return null;
  return (
    <div className="p-4 bg-[#FFF8E1] border-2 border-black flex flex-wrap items-center gap-3">
      <Bell className="w-6 h-6 shrink-0" aria-hidden />
      <div className="flex-1 min-w-[200px]">
        <div className="font-black text-sm">{t("promptTitle")}</div>
        <div className="text-xs">{t("promptBody")}</div>
        {state !== "idle" && <div className="text-xs font-bold text-[#B71C1C] mt-1">{t(state)}</div>}
      </div>
      <button
        type="button"
        onClick={async () => {
          const r = await enablePush(locale);
          setState(r);
        }}
        className="px-4 py-2 border-2 border-black bg-white font-black text-sm cursor-pointer hover:bg-[#FFD152]"
      >
        {t("enable")}
      </button>
    </div>
  );
}

export default function ApplyPage() {
  const router = useRouter();
  const t = useTranslations("apply");
  const tCrop = useTranslations("crops");
  const tIrr = useTranslations("irrigation");
  const online = useOnline();
  const lowData = useLowData();

  const [farmerName, setFarmerName] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<ApplyForm>(EMPTY_FORM);
  const [consents, setConsents] = useState<Consents>({ ekyc: true, satellite_analysis: true, mandi_financial: true });
  const [plotCoords, setPlotCoords] = useState<[number, number][]>([]);
  const [computedAcres, setComputedAcres] = useState(0);
  const [plotSource, setPlotSource] = useState<"drawn" | "gps_walk">("drawn");
  const [idemKey, setIdemKey] = useState<string>("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const [loadingPincode, setLoadingPincode] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false);
  const [docMatchPct, setDocMatchPct] = useState(0);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [scanIdx, setScanIdx] = useState(0);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mapRequested, setMapRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [waitingForNetwork, setWaitingForNetwork] = useState(false);

  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "ready" | "prompt">("detecting");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<ApplyForm>) => setForm((prev) => ({ ...prev, ...patch }));

  // Who is applying. Offline: keep going with the saved draft (the page itself is cached).
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.authenticated) {
          window.location.href = "/login?role=farmer&redirect=/apply";
          return;
        }
        setFarmerName(data.user.name);
        setForm((prev) => ({ ...prev, name: prev.name || data.user.name || "" }));
      })
      .catch(() => {});
  }, []);

  // Restore the draft saved on this phone
  useEffect(() => {
    loadApplyDraft<ApplyForm, Consents>().then((draft) => {
      if (draft) {
        setForm({ ...EMPTY_FORM, ...draft.form });
        setConsents(draft.consents);
        setPlotCoords(draft.plotCoords);
        setComputedAcres(draft.computedAcres);
        setPlotSource(draft.plotSource);
        setIdemKey(draft.idempotencyKey);
        setDraftRestored(true);
      } else {
        setIdemKey(newIdempotencyKey());
      }
      setDraftLoaded(true);
    });
  }, []);

  // Autosave every change (debounced) so nothing is lost on a weak network
  useEffect(() => {
    if (!draftLoaded || step === "queued") return;
    const id = setTimeout(() => {
      saveApplyDraft<ApplyForm, Consents>({
        form,
        consents,
        plotCoords,
        computedAcres,
        plotSource,
        idempotencyKey: idemKey,
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [draftLoaded, step, form, consents, plotCoords, computedAcres, plotSource, idemKey]);

  const requestLiveLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("prompt");
      return;
    }
    setGpsStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(5);
        const lng = +pos.coords.longitude.toFixed(5);
        setLiveLocation({ lat, lng });
        setGpsStatus("ready");
        setPlotCoords((prev) =>
          prev.length >= 3
            ? prev
            : [
                [+(lat - 0.0018).toFixed(5), +(lng - 0.0022).toFixed(5)],
                [+(lat + 0.0022).toFixed(5), +(lng - 0.0018).toFixed(5)],
                [+(lat + 0.0018).toFixed(5), +(lng + 0.0025).toFixed(5)],
                [+(lat - 0.0022).toFixed(5), +(lng + 0.002).toFixed(5)],
              ]
        );
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          if (geoRes.ok) {
            const addr = (await geoRes.json()).address || {};
            setForm((prev) => ({
              ...prev,
              district: prev.district || addr.state_district || addr.county || addr.city || addr.town || "",
              state: prev.state || addr.state || "",
              village: prev.village || addr.village || addr.suburb || addr.neighbourhood || "",
              pincode: prev.pincode || (addr.postcode ? String(addr.postcode).replace(/\D/g, "").slice(0, 6) : ""),
            }));
          }
        } catch {}
      },
      () => setGpsStatus("prompt"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    requestLiveLocation();
  }, [requestLiveLocation]);

  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    update({ pincode: clean });
    if (clean.length !== 6 || !navigator.onLine) return;
    setLoadingPincode(true);
    try {
      const res = await fetch(`/api/pincode/${clean}`);
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, district: data.district, state: data.state, village: data.postOffices?.[0] || prev.village }));
        if (data.approxLat && data.approxLng) {
          setPlotCoords((prev) =>
            prev.length >= 3
              ? prev
              : [
                  [data.approxLat - 0.002, data.approxLng - 0.003],
                  [data.approxLat + 0.003, data.approxLng - 0.002],
                  [data.approxLat + 0.002, data.approxLng + 0.004],
                  [data.approxLat - 0.003, data.approxLng + 0.002],
                ]
          );
        }
      }
    } catch {
    } finally {
      setLoadingPincode(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrBusy(true);
    setError("");
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result as string }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error);
        setDocUploaded(true);
        setDocMatchPct(data.ocr.confidence || 85);
        const fields = data.ocr.extractedFields || {};
        setForm((prev) => ({
          ...prev,
          landSizeAcres: fields.area ? parseFloat(fields.area) || prev.landSizeAcres : prev.landSizeAcres,
          village: fields.village || prev.village,
        }));
      } catch {
        setError(t("errors.ocr"));
      } finally {
        setOcrBusy(false); // only after OCR really finishes
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProceedToScan = () => {
    if (plotCoords.length < 3) {
      setError(t("errors.needPlot"));
      return;
    }
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length !== 10) {
      setError(t("errors.needNamePhone"));
      return;
    }
    setError("");
    setStep(2);
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i < SCAN_STEPS) setScanIdx(i);
      else {
        clearInterval(id);
        setStep(3);
      }
    }, 450);
  };

  const submit = useCallback(async () => {
    if (!CONSENT_IDS.every((c) => consents[c])) {
      setError(t("errors.consents"));
      return;
    }
    setSubmitting(true);
    setError("");
    const now = new Date().toISOString();
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idemKey },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, "").slice(-10),
          aadhaarMasked: /^XXXX-XXXX-\d{4}$/.test(form.aadhaarMasked) ? form.aadhaarMasked : undefined,
          state: form.state || "Maharashtra",
          district: form.district || "Yavatmal",
          village: form.village || "Gram",
          pincode: form.pincode || "445001",
          product: form.loanProduct,
          requestedAmount: Number(form.requestedAmount) || 350000,
          cropType: form.cropType,
          irrigation: form.irrigation,
          areaAcres: Number(form.landSizeAcres || computedAcres) || computedAcres || 1,
          plotPolygon: plotCoords,
          source: plotSource,
          documentMatchPct: docMatchPct || 92,
          consents: CONSENT_IDS.map((purpose) => ({ purpose, granted: consents[purpose], timestamp: now })),
        }),
      });

      if (res.status === 202) {
        // Service worker queued it: it will be sent automatically when back online
        setStep("queued");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await clearApplyDraft();
        router.push(`/scoring?id=${data.applicationId}`);
        return;
      }
      if (res.status === 401) {
        window.location.href = "/login?role=farmer&redirect=/apply";
        return;
      }
      setError(data.details?.[0] || data.error || t("errors.submit"));
    } catch {
      // No service worker to queue it (first visit / unsupported browser): retry when online
      setWaitingForNetwork(true);
    } finally {
      setSubmitting(false);
    }
  }, [consents, form, plotCoords, plotSource, computedAcres, docMatchPct, idemKey, router, t]);

  // Fallback retry when the browser comes back online
  useEffect(() => {
    if (waitingForNetwork && online) {
      setWaitingForNetwork(false);
      submit();
    }
  }, [waitingForNetwork, online, submit]);

  const showMap = !lowData || mapRequested;

  return (
    <div className="min-h-screen w-full bg-grid-pattern pb-16 farmer-ui" style={{ backgroundColor: "var(--pulse-cream)" }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="p-4 sm:p-6 bg-white mb-6" style={{ border: "3px solid #000", boxShadow: "5px 5px 0 #000" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight uppercase">{t("title")}</h1>
              <p className="text-sm text-neutral-700 mt-1">{t("subtitle")}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap" role="status">
              {gpsStatus === "ready" && liveLocation ? (
                <div className="bg-[#E8F8F0] p-2.5 border-2 border-black flex items-center gap-2 text-xs font-bold text-[#1B5E20]">
                  <Crosshair className="w-4 h-4" aria-hidden />
                  {t("gps.ready")}
                </div>
              ) : gpsStatus === "detecting" ? (
                <div className="bg-[#FFF9C4] p-2.5 border-2 border-black flex items-center gap-2 text-xs font-bold text-[#8A3A00]">
                  <Crosshair className="w-4 h-4 animate-spin" aria-hidden />
                  {t("gps.detecting")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={requestLiveLocation}
                  className="bg-white hover:bg-[#FFD152] px-3 border-2 border-black flex items-center gap-2 cursor-pointer text-xs font-bold"
                >
                  <Crosshair className="w-4 h-4" aria-hidden />
                  {t("gps.enable")}
                </button>
              )}
            </div>
          </div>
          {draftRestored && step === 1 && (
            <p className="mt-3 text-xs font-bold text-[#1B5E20] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" aria-hidden /> {t("draftRestored")}
            </p>
          )}
        </div>

        {/* Stepper */}
        <ol className="grid grid-cols-3 gap-2 sm:gap-4 mb-6" aria-label={t("steps.label")}>
          {([1, 2, 3] as const).map((n) => {
            const current = step === n || (step === "queued" && n === 3);
            const done = typeof step === "number" && step > n;
            return (
              <li
                key={n}
                aria-current={current ? "step" : undefined}
                className={`p-3 text-left ${current ? "bg-[#FFD152]" : done ? "bg-[#2ED573]" : "bg-white"}`}
                style={{ border: "3px solid #000", boxShadow: "3px 3px 0 #000" }}
              >
                <div className="font-display font-black text-xs sm:text-sm uppercase">
                  {n}. {t(`steps.s${n}`)}
                </div>
                <div className="text-[11px] hidden sm:block text-neutral-800">{t(`steps.s${n}desc`)}</div>
              </li>
            );
          })}
        </ol>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-[#FFEBEE] border-2 border-[#B71C1C] text-[#B71C1C] font-bold text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-5 p-5 bg-white space-y-4" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
              <h2 className="text-base font-display font-black uppercase flex items-center gap-2 border-b-2 border-black pb-2">
                <User className="w-5 h-5" aria-hidden />
                {t("profile.title")}
              </h2>

              {farmerName && (
                <div className="p-2.5 bg-[#E8F8F0] border-2 border-black flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#1B7F45] shrink-0" aria-hidden />
                  <span>{t("profile.signedInAs", { name: farmerName })}</span>
                </div>
              )}

              <div>
                <FieldLabel
                  htmlFor="name"
                  voice={<VoiceInputButton field={t("profile.name")} onHeard={(alts) => (update({ name: alts[0] }), true)} />}
                >
                  {t("profile.name")}
                </FieldLabel>
                <input id="name" autoComplete="name" value={form.name} onChange={(e) => update({ name: e.target.value })} className={inputCls} />
              </div>

              <div>
                <FieldLabel
                  htmlFor="phone"
                  voice={
                    <VoiceInputButton
                      field={t("profile.phone")}
                      onHeard={(alts) => {
                        const digits = parseSpokenDigits(alts[0]).slice(-10);
                        if (digits.length !== 10) return false;
                        update({ phone: digits });
                        return true;
                      }}
                    />
                  }
                >
                  {t("profile.phone")}
                </FieldLabel>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="98XXXXXXXX"
                  className={inputCls}
                />
              </div>

              <div>
                <FieldLabel htmlFor="aadhaar">
                  <Lock className="w-3 h-3 inline mr-1" aria-hidden />
                  {t("profile.aadhaar")}
                </FieldLabel>
                <input
                  id="aadhaar"
                  inputMode="numeric"
                  value={form.aadhaarMasked}
                  onChange={(e) => {
                    const last4 = e.target.value.replace(/\D/g, "").slice(-4);
                    update({ aadhaarMasked: last4 ? `XXXX-XXXX-${last4}` : "XXXX-XXXX-" });
                  }}
                  maxLength={14}
                  className={`${inputCls} tracking-wider`}
                />
                <span className="text-[11px] text-neutral-700 mt-0.5 block">{t("profile.aadhaarHint")}</span>
              </div>

              <div>
                <FieldLabel
                  htmlFor="pincode"
                  voice={
                    <VoiceInputButton
                      field={t("profile.pincode")}
                      onHeard={(alts) => {
                        const digits = parseSpokenDigits(alts[0]);
                        if (digits.length !== 6) return false;
                        handlePincodeChange(digits);
                        return true;
                      }}
                    />
                  }
                >
                  <MapPin className="w-3 h-3 inline mr-1" aria-hidden />
                  {t("profile.pincode")} {loadingPincode && <span className="text-blue-800 normal-case">· {t("profile.resolving")}</span>}
                </FieldLabel>
                <input
                  id="pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  placeholder="445001"
                  className={inputCls}
                />
              </div>

              <div>
                <FieldLabel
                  htmlFor="village"
                  voice={<VoiceInputButton field={t("profile.village")} onHeard={(alts) => (update({ village: alts[0] }), true)} />}
                >
                  {t("profile.village")}
                </FieldLabel>
                <input id="village" value={form.village} onChange={(e) => update({ village: e.target.value })} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel htmlFor="district">{t("profile.district")}</FieldLabel>
                  <input id="district" value={form.district} onChange={(e) => update({ district: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <FieldLabel htmlFor="state">{t("profile.state")}</FieldLabel>
                  <input id="state" value={form.state} onChange={(e) => update({ state: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <FieldLabel
                  htmlFor="crop"
                  voice={
                    <VoiceInputButton
                      field={t("profile.crop")}
                      onHeard={(alts) => {
                        const v = matchSpokenOption(alts, CROP_OPTIONS);
                        if (v) update({ cropType: v });
                        return !!v;
                      }}
                    />
                  }
                >
                  {t("profile.crop")}
                </FieldLabel>
                <select id="crop" value={form.cropType} onChange={(e) => update({ cropType: e.target.value })} className={inputCls}>
                  {CROPS.map((c) => (
                    <option key={c} value={c}>
                      {tCrop(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel
                  htmlFor="irrigation"
                  voice={
                    <VoiceInputButton
                      field={t("profile.irrigation")}
                      onHeard={(alts) => {
                        const v = matchSpokenOption(alts, IRRIGATION_OPTIONS);
                        if (v) update({ irrigation: v });
                        return !!v;
                      }}
                    />
                  }
                >
                  {t("profile.irrigation")}
                </FieldLabel>
                <select id="irrigation" value={form.irrigation} onChange={(e) => update({ irrigation: e.target.value })} className={inputCls}>
                  {IRRIGATION.map((c) => (
                    <option key={c} value={c}>
                      {tIrr(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-300">
                <div>
                  <FieldLabel
                    htmlFor="amount"
                    voice={
                      <VoiceInputButton
                        field={t("profile.amount")}
                        onHeard={(alts) => {
                          const n = alts.map(parseSpokenNumber).find((v) => v !== null && v >= 1000);
                          if (!n) return false;
                          update({ requestedAmount: Math.round(n) });
                          return true;
                        }}
                      />
                    }
                  >
                    {t("profile.amount")}
                  </FieldLabel>
                  <input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={10000}
                    max={5000000}
                    step={5000}
                    value={form.requestedAmount || ""}
                    onChange={(e) => update({ requestedAmount: Number(e.target.value) })}
                    aria-describedby="amount-words"
                    className={inputCls}
                  />
                  <span id="amount-words" className="text-sm font-black mt-1 block">
                    {formatINR(form.requestedAmount)}
                  </span>
                </div>
                <div>
                  <FieldLabel
                    htmlFor="acres"
                    voice={
                      <VoiceInputButton
                        field={t("profile.acres")}
                        onHeard={(alts) => {
                          const n = alts.map(parseSpokenNumber).find((v) => v !== null && v > 0 && v <= 500);
                          if (!n) return false;
                          update({ landSizeAcres: n });
                          return true;
                        }}
                      />
                    }
                  >
                    {t("profile.acres")}
                  </FieldLabel>
                  <input
                    id="acres"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={0}
                    value={form.landSizeAcres || ""}
                    onChange={(e) => update({ landSizeAcres: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] border-2 border-black space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display uppercase text-xs font-black flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#1B7F45]" aria-hidden />
                    {t("doc.title")}
                  </span>
                  {docUploaded && <span className="text-[11px] font-mono px-1.5 bg-[#2ED573] border border-black font-black">{t("doc.match", { pct: docMatchPct })}</span>}
                </div>
                <p className="text-xs text-neutral-700">{t("doc.hint")}</p>
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrBusy || !online}
                  className="w-full text-sm font-bold border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {ocrBusy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <UploadCloud className="w-4 h-4" aria-hidden />}
                  {ocrBusy ? t("doc.reading") : docUploaded ? t("doc.done") : online ? t("doc.upload") : t("doc.needsNetwork")}
                </button>
              </div>
            </section>

            <section className="lg:col-span-7 p-5 bg-white space-y-3" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
              <div className="border-b-2 border-black pb-2">
                <h2 className="text-base font-display font-black uppercase flex items-center gap-2">
                  <LandPlot className="w-5 h-5" aria-hidden />
                  {t("plot.title")}
                </h2>
                <p className="text-xs text-neutral-700">{t("plot.subtitle")}</p>
              </div>

              {showMap ? (
                <PlotCaptureMap
                  initialCenter={liveLocation ? [liveLocation.lat, liveLocation.lng] : plotCoords[0] ?? [20.1384, 78.3182]}
                  userLocation={liveLocation}
                  initialPolygon={plotCoords}
                  declaredAcres={form.landSizeAcres}
                  onPolygonChange={(coords, acres, source) => {
                    setPlotCoords(coords);
                    setComputedAcres(acres);
                    setPlotSource(source);
                  }}
                  onRequestLocation={requestLiveLocation}
                />
              ) : (
                <div className="p-6 bg-[#FAF8F5] border-2 border-dashed border-black text-center space-y-3">
                  <p className="text-sm">{t("plot.lowDataNote")}</p>
                  {plotCoords.length >= 3 && <p className="text-sm font-bold">{t("plot.pointsReady", { count: plotCoords.length })}</p>}
                  <button
                    type="button"
                    onClick={() => setMapRequested(true)}
                    className="px-5 border-2 border-black bg-[#FFD152] font-black text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <MapIcon className="w-5 h-5" aria-hidden />
                    {t("plot.showMap")}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToScan}
                disabled={plotCoords.length < 3}
                className="pulse-btn w-full py-3.5 text-base text-black bg-[#FFD152] hover:bg-[#FFE082] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{t("plot.next")}</span>
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
              </button>
            </section>
          </div>
        )}

        {step === 2 && (
          <section className="p-8 sm:p-12 bg-white text-center max-w-3xl mx-auto space-y-6" style={{ border: "3px solid #000", boxShadow: "6px 6px 0 #000" }}>
            <div className="w-20 h-20 mx-auto bg-[#FFD152] border-4 border-black flex items-center justify-center">
              <Satellite className="w-10 h-10 animate-spin" aria-hidden />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black uppercase">{t("scan.title")}</h2>
            <ul className="bg-[#FAF8F5] p-5 border-2 border-black text-left space-y-2.5 text-sm" aria-live="polite">
              {Array.from({ length: SCAN_STEPS }, (_, idx) => (
                <li key={idx} className={`flex items-center gap-2.5 ${idx <= scanIdx ? "text-black font-bold" : "text-neutral-500"}`}>
                  {idx <= scanIdx ? (
                    <CheckCircle2 className="w-5 h-5 text-[#1B7F45] shrink-0" aria-hidden />
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-neutral-400 shrink-0" />
                  )}
                  {t(`scan.s${idx + 1}`)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 3 && (
          <section className="p-6 sm:p-10 bg-white max-w-3xl mx-auto space-y-6" style={{ border: "3px solid #000", boxShadow: "6px 6px 0 #000" }}>
            <div className="flex items-center gap-3 border-b-2 border-black pb-4">
              <div className="w-12 h-12 bg-[#2ED573] border-2 border-black flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" aria-hidden />
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase">{t("review.title")}</h2>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                [t("review.applicant"), form.name],
                [t("review.area"), t("review.acres", { value: computedAcres })],
                [t("review.crop"), tCrop(form.cropType as (typeof CROPS)[number])],
                [t("review.amount"), formatINR(form.requestedAmount)],
              ].map(([k, v]) => (
                <div key={k} className="p-3 bg-[#FAF8F5] border-2 border-black">
                  <dt className="text-[11px] text-neutral-700 uppercase">{k}</dt>
                  <dd className="text-sm font-bold mt-0.5 truncate">{v}</dd>
                </div>
              ))}
            </dl>

            <fieldset className="p-5 bg-white space-y-3" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
              <legend className="px-2 font-display font-black text-sm uppercase flex items-center gap-2">
                <Scale className="w-5 h-5" aria-hidden />
                {t("consent.title")}
              </legend>
              {CONSENT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="checkbox"
                  aria-checked={consents[id]}
                  onClick={() => setConsents((c) => ({ ...c, [id]: !c[id] }))}
                  className={`w-full text-left p-3 border-2 border-black cursor-pointer flex items-start gap-2.5 ${consents[id] ? "bg-[#FAF8F5]" : "bg-neutral-100"}`}
                >
                  {consents[id] ? (
                    <CheckSquare className="w-5 h-5 text-[#1B7F45] shrink-0 mt-0.5" aria-hidden />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" aria-hidden />
                  )}
                  <span>
                    <span className="block font-bold text-sm">{t(`consent.${id}.title`)}</span>
                    <span className="block text-xs text-neutral-800 leading-relaxed">{t(`consent.${id}.body`)}</span>
                  </span>
                </button>
              ))}
              <div className="p-3 bg-[#FAF8F5] border border-black/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  {t.rich("consent.withdraw", {
                    link: (chunks) => (
                      <a href="/consent" className="font-bold underline text-black">
                        {chunks}
                      </a>
                    ),
                  })}
                </span>
                <button type="button" onClick={() => setPrivacyOpen(true)} className="font-bold underline cursor-pointer px-2">
                  {t("consent.privacyNotice")}
                </button>
              </div>
            </fieldset>

            <PushPrompt />

            {waitingForNetwork && (
              <div role="status" className="p-3 bg-black text-white font-bold text-sm flex items-center gap-2">
                <WifiOff className="w-5 h-5" aria-hidden /> {t("submit.waiting")}
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={submitting || waitingForNetwork || !CONSENT_IDS.every((c) => consents[c])}
              className="pulse-btn w-full py-4 text-base text-black bg-[#2ED573] hover:bg-[#52E08A] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden /> : null}
              <span>{online ? t("submit.button") : t("submit.offlineButton")}</span>
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
            </button>
          </section>
        )}

        {step === "queued" && (
          <section role="status" className="p-8 bg-white max-w-2xl mx-auto space-y-4 text-center" style={{ border: "3px solid #000", boxShadow: "6px 6px 0 #000" }}>
            <WifiOff className="w-12 h-12 mx-auto" aria-hidden />
            <h2 className="text-2xl font-display font-black uppercase">{t("queued.title")}</h2>
            <p className="text-sm">{t("queued.body")}</p>
            <PushPrompt />
          </section>
        )}
      </main>

      {privacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
          <div className="bg-white max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto text-sm" style={{ border: "4px solid #000", boxShadow: "8px 8px 0 #000" }}>
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 id="privacy-title" className="font-display font-black text-base uppercase">
                {t("privacy.title")}
              </h3>
              <button type="button" onClick={() => setPrivacyOpen(false)} aria-label={t("privacy.close")} className="p-2 border border-black hover:bg-neutral-100 cursor-pointer">
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            {(["fiduciary", "purpose", "rights", "dpo", "appeal"] as const).map((k) => (
              <div key={k}>
                <strong className="uppercase text-xs">{t(`privacy.${k}.title`)}</strong>
                <p>{t(`privacy.${k}.body`)}</p>
              </div>
            ))}
            <button type="button" onClick={() => setPrivacyOpen(false)} className="pulse-btn px-4 py-2 text-sm font-bold bg-[#FFD152] text-black">
              {t("privacy.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
