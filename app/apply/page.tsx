"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sprout,
  Satellite,
  User,
  MapPin,
  Tractor,
  IndianRupee,
  ArrowRight,
  CheckCircle2,
  Phone,
  LandPlot,
} from "lucide-react";
import { applicants } from "../lib/data";

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState<string>("APP-1042");
  const [scanning, setScanning] = useState(false);

  const [form, setForm] = useState({
    name: "Ramesh Patil",
    phone: "+91 98231 44521",
    district: "Yavatmal",
    state: "Maharashtra",
    village: "Ghatanji",
    landSizeAcres: "6.5",
    cropType: "Cotton (Bt)",
    loanProduct: "Tractor Loan (50 HP)",
    requestedAmount: "450000",
  });

  const loadPreset = (id: string) => {
    const a = applicants.find((x) => x.id === id);
    if (!a) return;
    setSelectedId(id);
    setForm({
      name: a.name,
      phone: a.phone,
      district: a.district,
      state: a.state,
      village: a.village,
      landSizeAcres: String(a.landSizeAcres),
      cropType: a.cropType,
      loanProduct: a.loanProduct,
      requestedAmount: String(a.requestedAmount),
    });
  };

  const handleStep2 = () => {
    setStep(2);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setStep(3);
    }, 2800);
  };

  const handleFinalSubmit = () => {
    router.push(`/scoring?id=${selectedId}`);
  };

  return (
    <div className="min-h-screen w-full bg-grid-pattern" style={{ backgroundColor: "var(--pulse-cream)" }}>
      {/* === TOP NAVBAR === */}
      <header
        className="sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between"
        style={{ backgroundColor: "#FFFFFF", borderBottom: "3px solid #000000" }}
      >
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div
            className="px-3.5 py-1.5 font-black text-base sm:text-lg tracking-tight"
            style={{
              backgroundColor: "#FFFFFF",
              border: "3px solid #000000",
              boxShadow: "4px 4px 0px #000000",
              color: "#000000",
            }}
          >
            <span style={{ color: "#FF6B6B" }}>TVS</span> CREDIT<span className="text-xs ml-0.5">&apos;26</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-2 font-black text-xs uppercase tracking-wider">
          <Link href="/" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            HOME
          </Link>
          <Link
            href="/apply"
            className="px-3.5 py-1.5"
            style={{
              backgroundColor: "#FFD152",
              border: "2px solid #000000",
              boxShadow: "3px 3px 0px #000000",
              color: "#000000",
            }}
          >
            APPLY
          </Link>
          <Link href="/scoring" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            AI SCORE
          </Link>
          <Link href="/staff" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            STAFF DESK
          </Link>
          <Link href="/monitoring" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            RISK RADAR
          </Link>
          <Link href="/assistant" className="px-3 py-1.5 text-black hover:text-[#FF6B6B] transition-colors">
            SAHAYAK
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="pulse-pill" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
            STEP 0{step} / 03
          </span>
        </div>
      </header>

      {/* MARQUEE */}
      <div
        className="w-full overflow-hidden py-1.5 text-white font-black text-[11px] tracking-widest uppercase select-none"
        style={{ backgroundColor: "#000000", borderBottom: "3px solid #000000" }}
      >
        <div className="animate-ticker whitespace-nowrap flex items-center gap-6">
          <span>★ RAPID APPLICATION</span>
          <span>★ ZERO MANUAL CADASTRE WORK</span>
          <span>★ AUTOMATED SENTINEL-2 PARCEL SCAN</span>
          <span>★ 48-HOUR DISBURSAL GUARANTEE</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        {/* STEP PROGRESS TRACKER */}
        <div className="flex items-center gap-0">
          {[1, 2, 3].map((n, i) => (
            <div key={n} className="flex items-center flex-1">
              <div
                className="w-12 h-12 flex items-center justify-center font-black text-lg shrink-0"
                style={{
                  border: "3px solid #000000",
                  boxShadow: "4px 4px 0px #000000",
                  backgroundColor:
                    n === step ? "#FFD152" : step > n ? "#FF6B6B" : "#FFFFFF",
                  color: step > n ? "#FFFFFF" : "#000000",
                }}
              >
                {step > n ? "✓" : `0${n}`}
              </div>
              {i < 2 && (
                <div
                  className="flex-1 h-1.5"
                  style={{
                    backgroundColor: step > i + 1 ? "#FF6B6B" : "#000000",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: APPLICANT DETAILS FORM */}
        {step === 1 && (
          <div
            className="pulse-card p-6 sm:p-10 flex flex-col gap-6"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            {/* Header banner inside card */}
            <div className="flex items-center justify-between border-b-3 border-[#000000] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 bg-[#FFD152]"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                >
                  <Sprout size={24} strokeWidth={2.5} className="text-[#000000]" />
                </div>
                <div>
                  <h1 className="font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#000000]">
                    Applicant Details
                  </h1>
                  <p className="font-mono text-xs text-[#000000]/60 mt-0.5">
                    Enter farmer land details or load a test candidate
                  </p>
                </div>
              </div>

              <span
                className="px-2.5 py-1 font-mono text-[10px] font-black uppercase text-white bg-black hidden sm:inline-block"
                style={{ border: "2px solid #000000" }}
              >
                CROP YEAR 2026
              </span>
            </div>

            {/* Demo profile picker chips */}
            <div className="flex flex-col gap-2">
              <div className="font-mono text-xs font-bold uppercase text-[#000000]/70">
                ⚡ Quick Presets (Click to auto-populate):
              </div>
              <div
                className="flex flex-wrap gap-2.5 p-3.5"
                style={{
                  backgroundColor: "var(--pulse-cream)",
                  border: "3px solid #000000",
                  boxShadow: "4px 4px 0px #000000",
                }}
              >
                {applicants.map((p, idx) => {
                  const colors = ["#FF6B6B", "#FFD152", "#B8A9FF", "#FFFFFF"];
                  const isSelected = selectedId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => loadPreset(p.id)}
                      className="pulse-chip text-xs"
                      style={{
                        backgroundColor: isSelected ? "#000000" : colors[idx % colors.length],
                        color: isSelected ? "#FFFFFF" : "#000000",
                      }}
                    >
                      {p.name} [{p.district}]
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid sm:grid-cols-2 gap-5 pt-2">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  <User size={13} strokeWidth={3} /> Full Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ramesh Patil"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  <Phone size={13} strokeWidth={3} /> Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98231 44521"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  <MapPin size={13} strokeWidth={3} /> State
                </label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  District
                </label>
                <input
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="Yavatmal"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  Village
                </label>
                <input
                  value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })}
                  placeholder="Ghatanji"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  <LandPlot size={13} strokeWidth={3} /> Land Size (Acres)
                </label>
                <input
                  value={form.landSizeAcres}
                  onChange={(e) => setForm({ ...form, landSizeAcres: e.target.value })}
                  type="number"
                  placeholder="6.5"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  <Sprout size={13} strokeWidth={3} /> Crop Type
                </label>
                <input
                  value={form.cropType}
                  onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                  placeholder="Cotton (Bt)"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                  <Tractor size={13} strokeWidth={3} /> Loan Product
                </label>
                <input
                  value={form.loanProduct}
                  onChange={(e) => setForm({ ...form, loanProduct: e.target.value })}
                  placeholder="Tractor Loan (50 HP)"
                  className="px-4 py-3 bg-[#FAF8F5] font-bold text-[#000000] outline-none"
                  style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase font-bold text-[#000000]/70 flex items-center gap-1.5">
                <IndianRupee size={13} strokeWidth={3} /> Requested Loan Amount (₹ INR)
              </label>
              <input
                value={form.requestedAmount}
                onChange={(e) => setForm({ ...form, requestedAmount: e.target.value })}
                placeholder="450000"
                className="px-4 py-3 bg-[#FAF8F5] font-bold text-lg text-[#000000] outline-none"
                style={{ border: "3px solid #000000", boxShadow: "3px 3px 0px #000000" }}
              />
            </div>

            <button
              type="button"
              onClick={handleStep2}
              className="pulse-btn w-full px-6 py-4 text-base gap-2 mt-4"
              style={{
                backgroundColor: "#FFD152",
                color: "#000000",
                boxShadow: "5px 5px 0px #000000",
              }}
            >
              <Satellite size={20} strokeWidth={2.5} />
              VERIFY LAND VIA SENTINEL-2 SATELLITE
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* STEP 2: SATELLITE SCANNING ANIMATION (Pulse Dot Matrix Style) */}
        {step === 2 && (
          <div
            className="p-10 sm:p-14 text-center flex flex-col items-center gap-6"
            style={{
              backgroundColor: "#FFD152",
              backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)",
              backgroundSize: "16px 16px",
              border: "4px solid #000000",
              boxShadow: "6px 6px 0px #000000",
            }}
          >
            <div
              className="w-28 h-28 flex items-center justify-center relative bg-white"
              style={{ border: "3px solid #000000", boxShadow: "4px 4px 0px #000000" }}
            >
              <div
                className="absolute inset-0 bg-[#FF6B6B] opacity-30 origin-bottom-left"
                style={{ animation: "radarSweep 2s linear infinite" }}
              />
              <Satellite size={44} strokeWidth={2} className="text-[#000000]" />
            </div>

            <div>
              <div
                className="inline-block px-3 py-1 font-mono text-xs font-black text-white bg-black mb-3"
                style={{ border: "2px solid #000000" }}
              >
                SENTINEL-2 ORBITAL SCAN
              </div>
              <h2 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#000000]">
                Scanning Farm Coordinates
              </h2>
              <p className="font-bold text-sm text-[#000000] max-w-md mx-auto mt-2">
                Resolving cadastral survey in {form.district}, analyzing multi-season NDVI
                canopy vigor, soil moisture, and weather anomaly coefficients...
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {["NDVI: 0.68 (HIGH)", "SOIL MOISTURE: OPTIMAL", "CADASTRAL: MATCHED"].map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 font-mono text-xs font-black text-white bg-black"
                  style={{ border: "2px solid #000000" }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SANCTION COMPLETE (Pulse Style) */}
        {step === 3 && (
          <div
            className="pulse-card p-8 sm:p-12 text-center flex flex-col items-center gap-6"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div
              className="w-20 h-20 flex items-center justify-center bg-[#2ED573]"
              style={{ border: "3px solid #000000", boxShadow: "4px 4px 0px #000000" }}
            >
              <CheckCircle2 size={44} strokeWidth={2.5} className="text-white" />
            </div>

            <div>
              <div
                className="inline-block px-3 py-1 font-mono text-xs font-black text-black bg-[#FFD152] mb-2"
                style={{ border: "2px solid #000000" }}
              >
                VALIDATION 100% COMPLETE
              </div>
              <h2 className="font-black text-3xl sm:text-4xl uppercase tracking-tight text-[#000000]">
                Land Verified Successfully
              </h2>
              <p className="font-mono text-sm text-[#000000]/70 mt-1">
                Sentinel-2 satellite signature matches dossier for <strong>{form.name}</strong>
              </p>
            </div>

            <div
              className="flex flex-wrap gap-3 p-4 justify-center"
              style={{
                backgroundColor: "var(--pulse-cream)",
                border: "3px solid #000000",
                boxShadow: "3px 3px 0px #000000",
              }}
            >
              <span className="pulse-chip" style={{ backgroundColor: "#FF6B6B", color: "#000000" }}>
                DISTRICT: {form.district.toUpperCase()}
              </span>
              <span className="pulse-chip" style={{ backgroundColor: "#FFD152", color: "#000000" }}>
                ACRES: {form.landSizeAcres}
              </span>
              <span className="pulse-chip" style={{ backgroundColor: "#B8A9FF", color: "#000000" }}>
                CROP: {form.cropType.toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleFinalSubmit}
              className="pulse-btn px-8 py-4 text-base gap-2"
              style={{
                backgroundColor: "#FFD152",
                color: "#000000",
                boxShadow: "5px 5px 0px #000000",
              }}
            >
              VIEW AI CREDIT SCORE & HARVEST OFFER →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
