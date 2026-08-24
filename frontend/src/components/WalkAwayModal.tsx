"use client";

import React from "react";
import { AlertOctagon, FileText } from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

export const WalkAwayModal: React.FC = () => {
  const {
    walkAwayModalOpen,
    walkAwayReason,
    closeWalkAwayModal,
    setReportModalOpen,
  } = useInspectionStore();

  if (!walkAwayModalOpen || !walkAwayReason) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-red-100 animate-in zoom-in-95 duration-150">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertOctagon className="w-6 h-6" />
        </div>

        {/* Title */}
        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 mb-1">
          Fatal Deal-Breaker Condition
        </div>
        <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-2">
          {walkAwayReason.componentName}
        </h3>

        {/* Explanation */}
        <p className="text-sm text-zinc-600 leading-relaxed mb-6">
          {walkAwayReason.explanation}
        </p>

        {/* Financial Context Callout */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 mb-6">
          <div className="text-xs font-semibold text-zinc-900 mb-1">
            Why you should walk away:
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Major internal mechanical failures (e.g. blown head gaskets, bottom-end rod knocks, or structural frame rust) typically cost <strong>$3,500 – $8,500+</strong> in engine teardown or repair bills, exceeding reasonable negotiation margins.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              closeWalkAwayModal();
              setReportModalOpen(true);
            }}
            className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-zinc-400" />
            <span>View Full Scorecard & Report</span>
          </button>

          <button
            onClick={closeWalkAwayModal}
            className="w-full h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 text-sm font-medium transition"
          >
            Dismiss & Continue Checklist
          </button>
        </div>
      </div>
    </div>
  );
};
