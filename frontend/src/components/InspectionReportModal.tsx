"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  X,
  Printer,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  DollarSign,
  QrCode,
  Share2,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { generateOverallReport } from "../utils/apiClient";
import { OverallReportSummary } from "../types/inspection";

export const InspectionReportModal: React.FC = () => {
  const {
    reportModalOpen,
    setReportModalOpen,
    getAllItems,
    vehicle,
    getTotalPoints,
    getCompletedCount,
    hasWalkAwayCondition,
    serviceHistory,
    resetChecklist,
  } = useInspectionStore();

  const [report, setReport] = useState<OverallReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const items = getAllItems();
  const completedCount = getCompletedCount();
  const totalScore = getTotalPoints();
  const hasFatal = hasWalkAwayCondition();

  useEffect(() => {
    if (reportModalOpen) {
      fetchReport();
    }
  }, [reportModalOpen]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const summary = await generateOverallReport(items, vehicle);
      setReport(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFullDossier = () => {
    const lines = [
      `CARINSPECT AI — CERTIFIED PRE-PURCHASE INSPECTION DOSSIER`,
      `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`,
      `VIN: ${vehicle.vin || "N/A"} | Odometer: ${(vehicle.mileage || 0).toLocaleString()} miles`,
      `Inspection Date: ${new Date().toLocaleDateString()}`,
      `Verdict: ${hasFatal ? "WALK AWAY (DEAL-BREAKER FOUND)" : totalScore >= 20 ? "EXCELLENT CONDITION" : "NEGOTIATION RECOMMENDED"}`,
      `Health Score: ${totalScore > 0 ? `+${totalScore}` : totalScore} points (${completedCount}/${items.length} points checked)`,
      ``,
      `--- DEALER NEGOTIATION DEDUCTIONS ---`,
    ];

    if (report?.dealer_negotiation_script && report.dealer_negotiation_script.length > 0) {
      report.dealer_negotiation_script.forEach((s) => {
        lines.push(`• ${s.component} (${s.finding}): -$${s.estimated_repair_cost}`);
        lines.push(`  Talking Point: "${s.talking_point}"`);
      });
      lines.push(``);
      lines.push(`Total Recommended Price Deduction: -$${report.total_estimated_repairs_usd.toLocaleString()}`);
      lines.push(`Recommended Target Offer: $${report.recommended_offer_usd.toLocaleString()} (Asking: $${vehicle.asking_price.toLocaleString()})`);
    } else {
      lines.push(`No critical defects or wear items recorded.`);
    }

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  if (!reportModalOpen) return null;

  const totalDeductions = report?.total_estimated_repairs_usd || 0;
  const targetOffer = Math.max(0, vehicle.asking_price - totalDeductions);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl min-h-screen sm:min-h-0 sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200/80 my-auto animate-in zoom-in-95 duration-150 print:p-0 print:border-none print:shadow-none">
        {/* Certificate Top Header */}
        <div className="flex items-start justify-between pb-5 border-b border-zinc-200 print:pb-2">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                  CarInspect AI Verified
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  CERT-{vehicle.make.toUpperCase().slice(0, 3)}-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mt-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <div className="text-xs text-zinc-500 font-medium mt-0.5 flex flex-wrap gap-2">
                <span>{vehicle.trim || "Standard"}</span>
                <span>•</span>
                <span>{(vehicle.mileage || 0).toLocaleString()} miles</span>
                <span>•</span>
                <span>VIN: {vehicle.vin || "4T3BK3BB0FU123456"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="h-9 px-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleCopyFullDossier}
              className="h-9 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/80 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dossier Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-orange-600" />
                  <span className="hidden sm:inline">Copy Dossier</span>
                </>
              )}
            </button>

            <button
              onClick={() => setReportModalOpen(false)}
              className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Scorecard & Financial Verdict Banner */}
        <div className="my-6 p-6 rounded-3xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Inspection Health Rating
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 flex items-center gap-2">
              {hasFatal ? (
                <span className="text-red-600 flex items-center gap-2">
                  <AlertOctagon className="w-8 h-8 text-red-600" />
                  WALK AWAY
                </span>
              ) : totalScore >= 20 ? (
                <span className="text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  EXCELLENT CONDITION
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                  NEGOTIATE PRICE
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 max-w-md leading-relaxed">
              {hasFatal
                ? "Severe catastrophic mechanical defect detected (blown head gasket / rod knock / subframe rust). Do not purchase."
                : "20-Point visual and acoustic inspection completed. Use the itemized deductions below for seller negotiation."}
            </p>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-200 w-full sm:w-auto shrink-0">
            <div className="text-xs font-medium text-zinc-400">Score Rating</div>
            <div className="text-3xl font-black text-zinc-900">
              {totalScore > 0 ? `+${totalScore}` : totalScore}
              <span className="text-sm font-normal text-zinc-400 ml-1">pts</span>
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              {completedCount} of {items.length} checkpoints inspected
            </div>
          </div>
        </div>

        {/* Dealer Negotiation & Financial Leverage Calculator */}
        <div className="mb-6 p-5 rounded-3xl bg-zinc-900 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
              Financial Leverage & Dealer Offer Target
            </span>
            <DollarSign className="w-4 h-4 text-orange-400" />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-2xl bg-zinc-800/80">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Asking Price</div>
              <div className="text-base sm:text-lg font-bold text-zinc-100">
                ${vehicle.asking_price.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-red-950/60 border border-red-800/60">
              <div className="text-[10px] text-red-300 uppercase font-medium">Est. Deductions</div>
              <div className="text-base sm:text-lg font-bold text-red-400">
                -${totalDeductions.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/60">
              <div className="text-[10px] text-emerald-300 uppercase font-medium">Target Max Offer</div>
              <div className="text-base sm:text-lg font-bold text-emerald-400">
                ${targetOffer.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Dealer Negotiation Talking Points */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between">
            <span>Itemized Repair Deductions & Scripts</span>
            <span className="text-xs font-normal text-zinc-500 lowercase">
              {report?.dealer_negotiation_script?.length || 0} issues identified
            </span>
          </h3>

          {report?.dealer_negotiation_script && report.dealer_negotiation_script.length > 0 ? (
            <div className="space-y-2.5">
              {report.dealer_negotiation_script.map((pt, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <strong className="text-xs text-zinc-900 font-bold">
                        {pt.component} ({pt.finding})
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                        -${pt.estimated_repair_cost.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleCopy(pt.talking_point, idx)}
                        className="text-xs text-zinc-400 hover:text-zinc-900 transition flex items-center gap-1 print:hidden"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 italic pl-4">
                    "{pt.talking_point}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 py-3 bg-zinc-50 rounded-2xl text-center border border-zinc-200">
              ✓ No mechanical flaws recorded. Vehicle is in clean condition!
            </div>
          )}
        </div>

        {/* 20-Point Checklist Summary Table */}
        <div className="space-y-2.5 mb-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Complete 20-Point Diagnostic Checklist
          </h3>
          <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white text-xs">
            {items.map((it) => (
              <div
                key={it.id}
                className="p-3 sm:px-4 flex items-center justify-between hover:bg-zinc-50 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 mr-2">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      it.is_walk_condition
                        ? "bg-red-500"
                        : it.status === "inspected" && it.points >= 0
                        ? "bg-emerald-500"
                        : it.status === "inspected" && it.points < 0
                        ? "bg-amber-500"
                        : "bg-zinc-300"
                    }`}
                  />
                  <span className="font-semibold text-zinc-800 truncate">
                    {it.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-zinc-500 truncate max-w-[140px] text-right">
                    {it.finding_category || "Uninspected"}
                  </span>
                  <span
                    className={`font-bold shrink-0 ${
                      it.is_walk_condition
                        ? "text-red-600"
                        : it.status === "inspected" && it.points < 0
                        ? "text-amber-600"
                        : it.status === "inspected" && it.points > 0
                        ? "text-emerald-600"
                        : "text-zinc-400"
                    }`}
                  >
                    {it.is_walk_condition
                      ? "WALK"
                      : it.status !== "inspected"
                      ? "—"
                      : `${it.points > 0 ? "+" : "−"}${Math.abs(it.points)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Provenance History */}
        {serviceHistory && serviceHistory.length > 0 && (
          <div className="space-y-2.5 mb-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Recorded Maintenance Provenance ({serviceHistory.length} records)
            </h3>
            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white text-xs divide-y divide-zinc-100">
              {serviceHistory.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-900">{s.title}</span>
                    <div className="text-[11px] text-zinc-500">
                      {s.date} • {s.mileage.toLocaleString()} mi • {s.performed_by === "diy" ? "DIY" : "Shop"} • {s.parts_brand || "OEM Spec"}
                    </div>
                  </div>
                  <span className="font-bold text-zinc-800">${s.cost_usd}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-200 flex items-center justify-between print:hidden">
          <button
            onClick={() => {
              if (confirm("Reset all inspection data?")) {
                resetChecklist();
                setReportModalOpen(false);
              }
            }}
            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Inspection Data</span>
          </button>

          <button
            onClick={() => setReportModalOpen(false)}
            className="h-11 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
