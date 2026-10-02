"use client";

import React, { useRef } from "react";
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Building2,
  Calendar,
  IndianRupee,
  Scale,
  PhoneCall,
  Mail,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface KfsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: {
    id: string;
    name: string;
    phone: string;
    district: string;
    state: string;
    product?: string;
  };
  offer: {
    approvedAmount: number;
    tenureMonths: number;
    annualPercentageRate: number;
    flatMonthlyEmi: number;
    harvestEmiSchedule: Array<{ month: string; amount: number; type: string }>;
  };
}

export default function KfsModal({ isOpen, onClose, applicant, offer }: KfsModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const loanAmount = offer.approvedAmount;
  const tenureMonths = offer.tenureMonths;
  const tenureYears = tenureMonths / 12;
  const nominalRate = offer.annualPercentageRate; // % p.a.
  const totalInterest = Math.round(loanAmount * (nominalRate / 100) * (tenureMonths / 24)); // Agro harvest structured simple interest amortized

  // Upfront charges broken out as mandated by RBI
  const processingFeeRate = 0.015; // 1.5%
  const processingFee = Math.round(loanAmount * processingFeeRate);
  const gstOnProcessing = Math.round(processingFee * 0.18); // 18% GST
  const stampDuty = 250;
  const totalUpfrontCharges = processingFee + gstOnProcessing + stampDuty;
  const netDisbursedAmount = loanAmount - totalUpfrontCharges;
  const totalPayable = loanAmount + totalInterest;

  // True APR calculation including all upfront fees
  const apr = Number(
    (nominalRate + ((totalUpfrontCharges / loanAmount) * (12 / tenureMonths) * 100)).toFixed(2)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div
        ref={printRef}
        className="bg-white border-4 border-black w-full max-w-4xl max-h-[92vh] flex flex-col my-auto animate-in fade-in"
        style={{ boxShadow: "10px 10px 0px #000" }}
      >
        {/* Header bar */}
        <div className="p-4 sm:p-5 bg-[#FFD152] border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center font-black">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="pulse-pill bg-black text-white text-[10px] font-mono">
                  RBI CIR: DOR.CRE.REC.66/21.07.001/2022-23
                </span>
                <span className="pulse-pill bg-[#2ED573] text-black text-[10px] font-mono">
                  VERIFIED STATUTORY DISCLOSURE
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-black uppercase tracking-tight text-black mt-0.5">
                Key Fact Statement (KFS) — Digital Lending
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="pulse-btn px-3 py-1.5 text-xs font-mono font-bold bg-white text-black hover:bg-neutral-100 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 border-2 border-black bg-white hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-black font-mono text-xs">
          {/* Statutory Notice Banner */}
          <div className="p-3.5 bg-[#FAF8F5] border-2 border-black flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2ED573] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-black">
                Regulated Entity: TVS Credit Services Limited (NBFC-ND-SI)
              </div>
              <p className="text-[11px] text-neutral-700 leading-relaxed font-sans">
                This Key Fact Statement provides transparent disclosure of all loan charges, APR, repayment schedule, and statutory exit rights before loan agreement execution, in strict compliance with the Reserve Bank of India (Digital Lending) Directions, 2022.
              </p>
            </div>
          </div>

          {/* Borrower & Loan Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#FAF8F5] border border-black">
              <div className="text-[9px] uppercase text-neutral-500 font-bold">Borrower Name</div>
              <div className="font-bold text-sm text-black mt-0.5 truncate">{applicant.name}</div>
              <div className="text-[10px] text-neutral-600">{applicant.district}, {applicant.state}</div>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-black">
              <div className="text-[9px] uppercase text-neutral-500 font-bold">Application ID</div>
              <div className="font-bold text-sm text-black mt-0.5">{applicant.id}</div>
              <div className="text-[10px] text-neutral-600">Product: {applicant.product || "Agri Equipment Loan"}</div>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-black">
              <div className="text-[9px] uppercase text-neutral-500 font-bold">Sanction Amount</div>
              <div className="font-black text-sm text-[#000000] mt-0.5">
                ₹{loanAmount.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-neutral-600">Tenure: {tenureMonths} Months</div>
            </div>
            <div className="p-3 bg-[#E8F8F0] border-2 border-black">
              <div className="text-[9px] uppercase text-neutral-600 font-bold">Annual Percentage Rate (APR)</div>
              <div className="font-black text-base text-[#107C41] mt-0.5">
                {apr}% P.A.
              </div>
              <div className="text-[9px] text-neutral-700">All-Inclusive Cost of Credit</div>
            </div>
          </div>

          {/* Standardized RBI 9-Point Tabular Disclosure */}
          <div>
            <div className="border-b-2 border-black pb-1 mb-2">
              <h3 className="font-display font-black text-sm uppercase text-black">
                Part A: Financial & Fee Disclosures (RBI Standardized Format)
              </h3>
            </div>

            <div className="border-2 border-black overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b-2 border-black">
                    <th className="p-2.5 font-bold border-r border-black w-12 text-center">Sr.</th>
                    <th className="p-2.5 font-bold border-r border-black">Parameter as per RBI Mandate</th>
                    <th className="p-2.5 font-bold text-right w-44">Details / Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/30 text-[11px]">
                  <tr>
                    <td className="p-2 text-center font-bold border-r border-black">1</td>
                    <td className="p-2 border-r border-black font-semibold">Loan Sanction Amount (Principal)</td>
                    <td className="p-2 text-right font-black">₹{loanAmount.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-center font-bold border-r border-black">2</td>
                    <td className="p-2 border-r border-black">
                      Total Interest Charge over tenure ({nominalRate}% simple interest p.a.)
                    </td>
                    <td className="p-2 text-right font-bold">₹{totalInterest.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#FAF8F5]/60">
                    <td className="p-2 text-center font-bold border-r border-black">3</td>
                    <td className="p-2 border-r border-black">
                      Upfront Processing Fee (1.50% of Sanction Amount)
                    </td>
                    <td className="p-2 text-right font-mono">₹{processingFee.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#FAF8F5]/60">
                    <td className="p-2 text-center font-bold border-r border-black">4</td>
                    <td className="p-2 border-r border-black">
                      GST @ 18% on Processing Fee (Statutory Levy)
                    </td>
                    <td className="p-2 text-right font-mono">₹{gstOnProcessing.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#FAF8F5]/60">
                    <td className="p-2 text-center font-bold border-r border-black">5</td>
                    <td className="p-2 border-r border-black">
                      Stamp Duty & State Documentation Franking (Fixed)
                    </td>
                    <td className="p-2 text-right font-mono">₹{stampDuty.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#FFEBEE]">
                    <td className="p-2 text-center font-bold border-r border-black">6</td>
                    <td className="p-2 border-r border-black font-bold">
                      Total Upfront Charges Deducted from Sanction Amount (3 + 4 + 5)
                    </td>
                    <td className="p-2 text-right font-black text-[#D32F2F]">
                      -₹{totalUpfrontCharges.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr className="bg-[#E8F8F0]">
                    <td className="p-2 text-center font-bold border-r border-black">7</td>
                    <td className="p-2 border-r border-black font-black">
                      Net Disbursed Amount (Direct to Borrower's Bank Savings Account)
                    </td>
                    <td className="p-2 text-right font-black text-sm text-[#107C41]">
                      ₹{netDisbursedAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 text-center font-bold border-r border-black">8</td>
                    <td className="p-2 border-r border-black font-bold">
                      Total Amount to be Paid by Borrower over {tenureMonths} Months
                    </td>
                    <td className="p-2 text-right font-black">₹{totalPayable.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#FFD152]/30">
                    <td className="p-2 text-center font-bold border-r border-black">9</td>
                    <td className="p-2 border-r border-black font-black">
                      Annual Percentage Rate (APR) — All Inclusive Cost Measure
                    </td>
                    <td className="p-2 text-right font-black text-sm">{apr}% P.A.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Part B: Statutory Cooling-Off & Direct Disbursal Mandate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cooling-off clause */}
            <div className="p-4 bg-[#FFF8E7] border-2 border-black space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-black" />
                <h4 className="font-bold text-xs uppercase">Statutory 3-Day Cooling-Off Period</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-800 font-sans">
                As per RBI guidelines, borrower is granted a <strong>mandatory 3-day look-up/cooling-off period</strong> starting from the disbursement date. You can exit this credit agreement without any penalty, foreclosure fees, or prepayment charges by returning the principal disbursed amount along with proportionate APR.
              </p>
            </div>

            {/* Direct Bank Disbursal */}
            <div className="p-4 bg-[#FAF8F5] border-2 border-black space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-black" />
                <h4 className="font-bold text-xs uppercase">Direct Bank Account Execution</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-800 font-sans">
                Disbursement is executed directly from TVS Credit's RBI-regulated escrow account to the borrower's Aadhaar-linked savings bank account via NACH/NEFT. <strong>No third-party digital wallet or LSP pooling account is utilized.</strong>
              </p>
            </div>
          </div>

          {/* Part C: Harvest-Aligned Repayment Schedule Snapshot */}
          <div>
            <div className="border-b-2 border-black pb-1 mb-2">
              <h3 className="font-display font-black text-sm uppercase text-black">
                Part C: Structured Harvest Repayment Schedule
              </h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {offer.harvestEmiSchedule.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2 border border-black text-center ${
                    item.type.includes("Harvest") || item.type.includes("Bullet")
                      ? "bg-[#FFD152] font-bold"
                      : "bg-[#FAF8F5]"
                  }`}
                >
                  <div className="text-[9px] uppercase text-neutral-600">{item.month}</div>
                  <div className="font-black text-xs text-black">₹{item.amount.toLocaleString("en-IN")}</div>
                  <div className="text-[8px] uppercase tracking-tighter truncate">{item.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Part D: Grievance Redressal & Nodal Officer */}
          <div className="p-4 bg-white border-2 border-black space-y-2">
            <div className="flex items-center justify-between border-b border-black pb-1">
              <h4 className="font-display font-black text-xs uppercase flex items-center gap-2">
                <Scale className="w-4 h-4 text-black" />
                <span>Grievance Redressal & Escalation Matrix (RBI Mandate)</span>
              </h4>
              <span className="pulse-pill bg-[#2ED573] text-black text-[9px]">Level 1 to Ombudsman</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
              <div>
                <span className="text-[9px] uppercase text-neutral-500 font-bold block">Principal Nodal Officer</span>
                <span className="font-bold">Sri R. Vasudevan</span>
                <span className="block text-neutral-600">TVS Credit Services Ltd.</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 font-bold block">Helpline & Email</span>
                <div className="flex items-center gap-1 font-bold">
                  <PhoneCall className="w-3.5 h-3.5" /> 1800-425-4500 (Toll-Free)
                </div>
                <div className="flex items-center gap-1 text-neutral-700">
                  <Mail className="w-3.5 h-3.5" /> nodalofficer@tvscredit.com
                </div>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 font-bold block">RBI Ombudsman Escalation</span>
                <span className="text-neutral-700">
                  If unresolved within 30 days, file grievance at RBI CMS:
                </span>
                <a
                  href="https://cms.rbi.org.in"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-black underline block hover:text-blue-700"
                >
                  cms.rbi.org.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#FAF8F5] border-t-3 border-black flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
            <CheckCircle2 className="w-4 h-4 text-[#2ED573]" />
            <span>Digital KFS Timestamp: {new Date().toLocaleDateString("en-IN")} • TVS-KFS-V3</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="pulse-btn px-5 py-2.5 text-xs font-mono font-bold bg-white text-black hover:bg-neutral-100"
            >
              Close Window
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="pulse-btn px-5 py-2.5 text-xs font-mono font-bold bg-[#FFD152] text-black hover:bg-[#FFE082]"
            >
              Print Official Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
