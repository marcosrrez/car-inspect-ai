"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  X,
  Printer,
  Copy,
  Check,
  AlertOctagon,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Car,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Download,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useInspectionStore } from "../store/useInspectionStore";
import { generateOverallReport } from "../utils/apiClient";
import { OverallReportSummary } from "../types/inspection";

export const InspectionReportModal: React.FC = () => {
  const {
    reportModalOpen,
    setReportModalOpen,
    vehicle,
    getAllItems,
    getTotalPoints,
    getWalkConditions,
    getCompletedCount,
  } = useInspectionStore();

  const [reportData, setReportData] = useState<OverallReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const items = getAllItems();
  const completedCount = getCompletedCount();
  const walkItems = getWalkConditions();

  useEffect(() => {
    if (reportModalOpen) {
      loadReport();
    }
  }, [reportModalOpen]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await generateOverallReport(items, vehicle);
      setReportData(data);

      // Trigger celebratory confetti if Grade is A/A+ and all items inspected
      if (data.grade.startsWith("A") && data.walk_conditions_count === 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!reportData) return;
    const lines = [
      `🚗 PRE-PURCHASE INSPECTION REPORT: ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`,
      `VIN: ${vehicle.vin || "N/A"} | Mileage: ${vehicle.mileage?.toLocaleString()} mi | Asking Price: $${vehicle.asking_price?.toLocaleString()}`,
      `----------------------------------------------------`,
      `Overall Grade: ${reportData.grade}`,
      `Verdict: ${reportData.verdict}`,
      `Health Score: ${reportData.health_percentage}% (Score Tally: ${reportData.total_score > 0 ? "+" : ""}${reportData.total_score} pts)`,
      `Walk Conditions: ${reportData.walk_conditions_count}`,
      `Estimated Repairs: $${reportData.total_estimated_repairs_usd.toLocaleString()}`,
      `Recommended Offer: $${reportData.recommended_offer_usd.toLocaleString()}`,
      `----------------------------------------------------`,
      `DEALER NEGOTIATION TALKING POINTS:`,
      ...reportData.dealer_negotiation_script.map(
        (s, idx) => `${idx + 1}. [${s.component}]: ${s.talking_point} (Est. Repair: $${s.estimated_repair_cost})`
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (!reportModalOpen) return null;

  const isWalk = walkItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:text-black print:bg-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center print:border-black print:text-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-orange-400 uppercase print:text-black">
                Comprehensive Diagnostic Report
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white print:text-black">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? "Copied!" : "Copy Text"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => setReportModalOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto print:overflow-visible">
          {/* Executive Scorecard Header Card */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border ${
              isWalk
                ? "bg-red-950/30 border-red-500/50 text-red-200"
                : reportData?.grade.startsWith("A")
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                : "bg-amber-950/30 border-amber-500/40 text-amber-200"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Grade Badge */}
              <div className="text-center md:border-r border-slate-700/50 pr-4">
                <div className="text-xs uppercase font-bold text-slate-400 mb-1">
                  Overall Health Grade
                </div>
                <div
                  className={`text-4xl sm:text-5xl font-black tracking-tight ${
                    isWalk
                      ? "text-red-400"
                      : reportData?.grade.startsWith("A")
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {reportData?.grade || (isWalk ? "F (WALK)" : "B")}
                </div>
                <div className="text-xs font-bold mt-1 text-white">
                  {reportData?.verdict || (isWalk ? "WALK AWAY - DEAL BREAKER" : "FAIR / NEGOTIATE")}
                </div>
              </div>

              {/* Score Stats */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-medium">Diagnostic Score:</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {reportData?.total_score && reportData.total_score > 0 ? `+${reportData.total_score}` : reportData?.total_score || 0} pts
                </div>
                <div className="text-xs text-slate-400">
                  Inspected: {completedCount} / 20 Checklist Items
                </div>
              </div>

              {/* Estimated Repairs */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-medium">Estimated Immediate Repairs:</div>
                <div className="text-2xl font-mono font-bold text-amber-400">
                  ${reportData?.total_estimated_repairs_usd.toLocaleString() || "0"}
                </div>
                <div className="text-xs text-slate-400">
                  Based on itemized mechanic rates
                </div>
              </div>

              {/* Recommended Offer */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-medium">Recommended Max Offer:</div>
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  {isWalk ? "$0 (PASS)" : `$${reportData?.recommended_offer_usd.toLocaleString() || "N/A"}`}
                </div>
                <div className="text-xs text-slate-400">
                  Asking: ${vehicle.asking_price.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Deal Breaker Alert Section if flagged */}
          {isWalk && (
            <div className="p-4 rounded-xl bg-red-950/40 border-2 border-red-500 space-y-3">
              <div className="flex items-center gap-2 font-black text-red-400 text-sm uppercase">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
                <span>Fatal Deal-Breaker Summary ({walkItems.length} Flagged)</span>
              </div>
              <ul className="space-y-2">
                {walkItems.map((w) => (
                  <li key={w.id} className="p-3 rounded-lg bg-black/40 border border-red-500/30 text-xs">
                    <div className="font-bold text-red-200">
                      {w.title}: <span className="underline">{w.finding_category}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{w.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dealer Negotiation Script Generator */}
          {reportData && reportData.dealer_negotiation_script.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Dealer Negotiation Talking Points & Repair Deductions</span>
                </h3>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  Total Deductions: ${reportData.total_estimated_repairs_usd.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2.5">
                {reportData.dealer_negotiation_script.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {idx + 1}. {s.component} ({s.finding})
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        -${s.estimated_repair_cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 text-orange-200 italic">
                      &ldquo;{s.talking_point}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full 20-Point Checklist Itemized Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">
              Itemized 20-Point Inspection Results
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Component</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Points</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-950/40 transition">
                      <td className="p-3 font-medium text-slate-200">
                        {item.title}
                      </td>
                      <td className="p-3 text-slate-400">
                        {item.finding_category || "Uninspected"}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold ${
                          item.is_walk_condition
                            ? "text-red-400"
                            : item.points > 0
                            ? "text-emerald-400"
                            : item.points < 0
                            ? "text-amber-400"
                            : "text-slate-500"
                        }`}
                      >
                        {item.status === "inspected"
                          ? item.is_walk_condition
                            ? "WALK (-10)"
                            : item.points > 0
                            ? `+${item.points}`
                            : item.points
                          : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            item.status === "inspected"
                              ? item.is_walk_condition
                                ? "bg-red-500/20 text-red-300"
                                : item.points > 0
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                              : item.status === "error"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
