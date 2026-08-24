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
    resetChecklist,
  } = useInspectionStore();

  const [report, setReport] = useState<OverallReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  if (!reportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl min-h-screen sm:min-h-0 sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200/80 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-100 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
                Inspection Summary
              </div>
              <h2 className="text-xl font-bold text-zinc-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="h-9 px-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={() => setReportModalOpen(false)}
              className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Scorecard Card */}
        <div className="my-6 p-6 rounded-3xl bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Vehicle Health Verdict
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 flex items-center gap-2">
              {hasFatal ? (
                <span className="text-red-600 flex items-center gap-2">
                  <AlertOctagon className="w-7 h-7 text-red-600" />
                  WALK AWAY
                </span>
              ) : totalScore >= 20 ? (
                <span className="text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  EXCELLENT CONDITION
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                  NEGOTIATION RECOMMENDED
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1 max-w-md">
              {hasFatal
                ? "Severe mechanical/structural damage detected. Do not proceed with purchase."
                : "Standard wear items identified. Use the talking points below during dealer negotiation."}
            </p>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-200/60 w-full sm:w-auto">
            <div className="text-xs font-medium text-zinc-400">Score Rating</div>
            <div className="text-3xl font-black text-zinc-900">
              {totalScore > 0 ? `+${totalScore}` : totalScore}
              <span className="text-sm font-normal text-zinc-400 ml-1">pts</span>
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {completedCount} of {items.length} items checked
            </div>
          </div>
        </div>

        {/* Dealer Negotiation Talking Points */}
        <div className="space-y-4 mb-8">
          <h3 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <span>Negotiation Talking Points & Repair Deductions</span>
          </h3>

          {report?.dealer_negotiation_script && report.dealer_negotiation_script.length > 0 ? (
            <div className="space-y-3">
              {report.dealer_negotiation_script.map((pt, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-900">
                      {pt.component} ({pt.finding})
                    </span>
                    <button
                      onClick={() => handleCopy(pt.talking_point, idx)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 italic leading-relaxed">
                    "{pt.talking_point}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 py-4 bg-zinc-50 rounded-2xl text-center border border-zinc-100">
              No defects or wear items recorded. Clean vehicle!
            </div>
          )}
        </div>

        {/* 20-Point Checklist Summary Breakdown */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-zinc-900 tracking-tight">
            Item-by-Item Breakdown
          </h3>
          <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-2xl overflow-hidden">
            {items.map((it) => (
              <div
                key={it.id}
                className="p-3.5 sm:px-4 flex items-center justify-between text-xs hover:bg-zinc-50 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
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
                  <div className="truncate font-medium text-zinc-800">
                    {it.title}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-zinc-500">
                    {it.finding_category || "Not inspected"}
                  </span>
                  <span
                    className={`font-semibold ${
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
                      : `${it.points > 0 ? "+" : ""}${it.points}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between print:hidden">
          <button
            onClick={() => {
              if (confirm("Reset all inspection data?")) {
                resetChecklist();
                setReportModalOpen(false);
              }
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Inspection</span>
          </button>

          <button
            onClick={() => setReportModalOpen(false)}
            className="h-11 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
