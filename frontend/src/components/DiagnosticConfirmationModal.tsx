"use client";

import React from "react";
import {
  Check,
  RotateCcw,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { VISUAL_KNOWLEDGE_BASE } from "../utils/visualKnowledgeBase";

interface PendingDiagnostic {
  itemId: string;
  finding_category: string;
  points: number;
  is_walk_condition: boolean;
  explanation: string;
  negotiation_tip: string | null;
  confidence?: number;
  previewUrl?: string;
  matchedReferenceTitle?: string;
  matchedReferenceCue?: string;
}

interface DiagnosticConfirmationModalProps {
  isOpen: boolean;
  diagnostic: PendingDiagnostic | null;
  onConfirm: () => void;
  onRetake: () => void;
  onManualOverride: (opt: any) => void;
}

export const DiagnosticConfirmationModal: React.FC<DiagnosticConfirmationModalProps> = ({
  isOpen,
  diagnostic,
  onConfirm,
  onRetake,
  onManualOverride,
}) => {
  const { getAllItems } = useInspectionStore();

  if (!isOpen || !diagnostic) return null;

  const item = getAllItems().find((it) => it.id === diagnostic.itemId);
  const refSet = VISUAL_KNOWLEDGE_BASE[diagnostic.itemId];

  const isWalk = diagnostic.is_walk_condition;
  const isConcern = !isWalk && diagnostic.points < 0;
  const isGood = !isWalk && diagnostic.points >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200/80 my-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                AI Diagnostic Confirmation
              </div>
              <h3 className="text-base font-bold text-zinc-900 truncate">
                {item?.title || "Component Inspection"}
              </h3>
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isWalk
                ? "bg-red-50 text-red-600 border border-red-200"
                : isConcern
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {isWalk && <AlertOctagon className="w-3.5 h-3.5" />}
            {isGood && <CheckCircle2 className="w-3.5 h-3.5" />}
            {isConcern && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>
              {isWalk
                ? "Walk Away"
                : `${diagnostic.points > 0 ? "+" : "−"}${Math.abs(diagnostic.points)} pts`}
            </span>
          </div>
        </div>

        {/* Side-by-Side Visual Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* User Photo */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Your Captured Photo
            </div>
            <div className="aspect-square rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center relative">
              {diagnostic.previewUrl ? (
                <img
                  src={diagnostic.previewUrl}
                  alt="Captured inspection target"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-zinc-400">Captured Image</span>
              )}
            </div>
          </div>

          {/* Reference Ground Truth */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Matched Ground Truth
            </div>
            <div
              className={`aspect-square rounded-2xl p-3 flex flex-col justify-between border ${
                isWalk
                  ? "bg-red-50/50 border-red-200 text-red-900"
                  : isConcern
                  ? "bg-amber-50/50 border-amber-200 text-amber-900"
                  : "bg-emerald-50/50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div>
                <div className="text-xs font-bold mb-1">
                  {diagnostic.finding_category}
                </div>
                <p className="text-[11px] leading-snug opacity-90">
                  {diagnostic.matchedReferenceCue ||
                    refSet?.what_to_look_for ||
                    "Evaluated against OEM taxonomy."}
                </p>
              </div>

              <div className="text-[10px] font-semibold opacity-75">
                Benchmark Calibration Match
              </div>
            </div>
          </div>
        </div>

        {/* Plain Language Explanation */}
        <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200/80 mb-4 text-xs space-y-1.5">
          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>Diagnostic Breakdown:</span>
          </div>
          <p className="text-zinc-600 leading-relaxed">
            {diagnostic.explanation}
          </p>
        </div>

        {/* Deal-Breaker Warning Alert */}
        {isWalk && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4 text-red-900 flex items-start gap-2.5 text-xs">
            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-red-700">
                Fatal Deal-Breaker:
              </strong>{" "}
              Overhaul costs exceed vehicle purchase threshold. Walk away.
            </div>
          </div>
        )}

        {/* Dealer Negotiation Script */}
        {diagnostic.negotiation_tip && !isWalk && (
          <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3 mb-4 text-xs text-orange-950">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-0.5">
              Dealer Negotiation Talking Point:
            </span>
            <p className="italic text-zinc-700">
              "{diagnostic.negotiation_tip}"
            </p>
          </div>
        )}

        {/* Action Buttons: Confirm vs Retake */}
        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-99 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Confirm Finding & Lock Score ({diagnostic.points > 0 ? `+${diagnostic.points}` : diagnostic.points} pts)</span>
          </button>

          <button
            onClick={onRetake}
            className="w-full h-11 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-xs transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Photo</span>
          </button>
        </div>

        {/* Manual Override Accordion if AI was off */}
        {item && item.rubric_summary.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-100 text-center">
            <span className="text-[11px] text-zinc-400">
              Doesn't look right? Tap below to override:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1.5">
              {item.rubric_summary.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onManualOverride(opt)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition"
                >
                  {opt.label} ({opt.points > 0 ? `+${opt.points}` : opt.points})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
