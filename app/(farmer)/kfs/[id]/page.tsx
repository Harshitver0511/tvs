import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, Scale, Clock, ArrowLeft, CalendarDays } from "lucide-react";
import { tvsDb } from "../../../lib/db";
import Navbar from "../../../components/Navbar";
import { ListenButton } from "../../../components/voice/VoiceButtons";
import { requirePageRole } from "../../../lib/dal";
import { canViewApplicant } from "../../../lib/access";
import { formatINR } from "../../../lib/format";

interface KfsPageProps {
  params: Promise<{ id: string }>;
}

/** "Nov 2026" (scoring engine format) → localised month name. */
function localMonth(label: string, locale: string): string {
  const d = new Date(`1 ${label}`);
  return Number.isNaN(d.getTime()) ? label : d.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" });
}

export default async function KfsPage({ params }: KfsPageProps) {
  const { id } = await params;
  const user = await requirePageRole(["farmer", "field_officer", "credit_officer", "admin"], `/kfs/${id}`);
  const applicant = await tvsDb.getApplicantById(id);
  if (!applicant || !canViewApplicant(user, applicant)) notFound();

  const t = await getTranslations("kfs");
  const locale = await getLocale();

  const offer = applicant.scoring.offer;
  const loanAmount = offer?.approvedAmount ?? applicant.requestedAmount ?? 350000;
  const tenureMonths = offer?.tenureMonths ?? 24;
  const nominalRate = offer?.interestRatePct ?? 14.5;
  const totalInterest = Math.round(loanAmount * (nominalRate / 100) * (tenureMonths / 24));
  const processingFee = Math.round(loanAmount * 0.015);
  const gst = Math.round(processingFee * 0.18);
  const stampDuty = 250;
  const totalUpfrontCharges = processingFee + gst + stampDuty;
  const netDisbursedAmount = loanAmount - totalUpfrontCharges;
  const totalPayable = loanAmount + totalInterest;
  const apr = Number((nominalRate + (totalUpfrontCharges / loanAmount) * (12 / tenureMonths) * 100).toFixed(2));

  const schedule = (offer?.harvestEmiSchedule ?? []).map((e) => ({
    month: localMonth(e.month, locale),
    amount: e.amount,
    kind: /harvest|bullet/i.test(e.type) ? t("emi.harvest") : t("emi.small"),
  }));

  const rows: [string, string, string?][] = [
    [t("rows.sanction"), formatINR(loanAmount)],
    [t("rows.interest", { months: tenureMonths, rate: nominalRate }), formatINR(totalInterest)],
    [t("rows.processing"), formatINR(processingFee), "bg-[#FAF8F5]"],
    [t("rows.gst"), formatINR(gst), "bg-[#FAF8F5]"],
    [t("rows.stamp"), formatINR(stampDuty), "bg-[#FAF8F5]"],
    [t("rows.upfront"), `−${formatINR(totalUpfrontCharges)}`, "bg-[#FFEBEE] font-bold"],
    [t("rows.net"), formatINR(netDisbursedAmount), "bg-[#E8F8F0] font-black"],
    [t("rows.total"), formatINR(totalPayable), "font-bold"],
    [t("rows.apr"), `${apr}%`, "bg-[#FFF3C4] font-black"],
  ];

  // What the Listen button reads out
  const spoken = [
    t("speech.intro", { amount: formatINR(loanAmount), months: tenureMonths, apr }),
    t("speech.net", { amount: formatINR(netDisbursedAmount) }),
    ...schedule.map((s) => t("speech.emi", { month: s.month, amount: formatINR(s.amount), kind: s.kind })),
    t("speech.coolingOff"),
  ].join(" ");

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] pb-16 farmer-ui">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/scoring?id=${applicant.id}`} className="pulse-btn px-4 py-2 text-sm font-bold bg-white text-black hover:bg-neutral-100 flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t("back")}
          </Link>
          <ListenButton text={spoken} />
        </div>

        <div className="bg-white p-6 sm:p-8 space-y-6 text-black text-sm" style={{ border: "4px solid #000", boxShadow: "8px 8px 0 #000" }}>
          <div className="p-4 bg-[#FFD152] border-2 border-black flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="pulse-pill bg-black text-white text-[10px]">RBI CIR: DOR.CRE.REC.66/21.07.001/2022-23</span>
              <h1 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight mt-1">{t("title")}</h1>
              <p className="text-xs">{t("subtitle")}</p>
            </div>
            <div className="text-right text-xs">
              <div>{t("reference")}</div>
              <div className="font-bold text-sm">{applicant.id}</div>
              <div>{new Date().toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}</div>
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#FAF8F5] border border-black">
              <dt className="text-[11px] uppercase font-bold">{t("borrower")}</dt>
              <dd className="font-bold mt-0.5 truncate">{applicant.name}</dd>
              <dd className="text-xs">
                {applicant.district}, {applicant.state}
              </dd>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-black">
              <dt className="text-[11px] uppercase font-bold">{t("product")}</dt>
              <dd className="font-bold mt-0.5">{applicant.loanProduct}</dd>
              <dd className="text-xs">{t("tenure", { months: tenureMonths })}</dd>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-black">
              <dt className="text-[11px] uppercase font-bold">{t("sanction")}</dt>
              <dd className="font-black mt-0.5">{formatINR(loanAmount)}</dd>
            </div>
            <div className="p-3 bg-[#E8F8F0] border-2 border-black">
              <dt className="text-[11px] uppercase font-bold">{t("apr")}</dt>
              <dd className="font-black text-base text-[#1B5E20] mt-0.5">{apr}%</dd>
              <dd className="text-[11px]">{t("aprNote")}</dd>
            </div>
          </dl>

          <div className="border-2 border-black overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">{t("tableCaption")}</caption>
              <thead>
                <tr className="bg-[#FAF8F5] border-b-2 border-black">
                  <th scope="col" className="p-2.5 font-bold border-r border-black w-12 text-center">
                    #
                  </th>
                  <th scope="col" className="p-2.5 font-bold border-r border-black">
                    {t("item")}
                  </th>
                  <th scope="col" className="p-2.5 font-bold text-right w-40">
                    {t("value")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/30">
                {rows.map(([label, value, cls], i) => (
                  <tr key={i} className={cls}>
                    <td className="p-2 text-center font-bold border-r border-black">{i + 1}</td>
                    <th scope="row" className="p-2 border-r border-black font-normal">
                      {label}
                    </th>
                    <td className="p-2 text-right font-bold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schedule.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-display font-black uppercase flex items-center gap-2">
                <CalendarDays className="w-5 h-5" aria-hidden />
                {t("emi.title")}
              </h2>
              <p className="text-xs">{t("emi.note")}</p>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {schedule.map((s, i) => (
                  <li key={i} className={`p-3 border-2 border-black ${s.kind === t("emi.harvest") ? "bg-[#E8F8F0]" : "bg-white"}`}>
                    <div className="text-xs font-bold">{s.month}</div>
                    <div className="font-black text-base">{formatINR(s.amount)}</div>
                    <div className="text-[11px]">{s.kind}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FFF8E7] border-2 border-black space-y-1">
              <div className="font-bold uppercase flex items-center gap-2">
                <Clock className="w-4 h-4" aria-hidden />
                {t("coolingOff.title")}
              </div>
              <p className="text-xs leading-relaxed">{t("coolingOff.body")}</p>
            </div>
            <div className="p-4 bg-[#FAF8F5] border-2 border-black space-y-1">
              <div className="font-bold uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4" aria-hidden />
                {t("disbursal.title")}
              </div>
              <p className="text-xs leading-relaxed">{t("disbursal.body")}</p>
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-black space-y-2">
            <div className="font-bold uppercase flex items-center gap-2 border-b border-black pb-1">
              <Scale className="w-4 h-4" aria-hidden />
              {t("grievance.title")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="uppercase font-bold block">{t("grievance.officer")}</span>
                <span className="font-bold">Sri R. Vasudevan</span>
                <span className="block">TVS Credit Services Ltd.</span>
              </div>
              <div>
                <span className="uppercase font-bold block">{t("grievance.contact")}</span>
                <a href="tel:18004254500" className="font-bold block text-black">
                  1800-425-4500 ({t("grievance.tollFree")})
                </a>
                <a href="mailto:nodalofficer@tvscredit.com" className="block text-black">
                  nodalofficer@tvscredit.com
                </a>
              </div>
              <div>
                <span className="uppercase font-bold block">{t("grievance.ombudsman")}</span>
                <a href="https://cms.rbi.org.in" target="_blank" rel="noreferrer" className="font-bold text-black underline">
                  cms.rbi.org.in
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
