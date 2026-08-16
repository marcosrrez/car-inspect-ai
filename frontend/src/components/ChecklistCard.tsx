"use client";

import React, { useState } from "react";
import {
  Camera,
  Mic,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Volume2,
  Activity,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { ChecklistItem } from "../types/inspection";

interface ChecklistCardProps {
  item: ChecklistItem;
  onOpenCapture: (item: ChecklistItem) => void;
  onRetryPending?: (itemId: string) => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  item,
  onOpenCapture,
  onRetryPending,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedTip, setCopiedTip] = useState(false);

  const isInspected = item.status === "inspected";
  const isError = item.status === "error";
  const isPending = item.status === "pending";
  const isWalk = item.is_walk_condition;
  const isAudio = item.media_type === "audio";

  const handleCopyTip = () => {
    if (item.negotiation_tip) {
      navigator.clipboard.writeText(item.negotiation_tip);
      setCopiedTip(true);
      setTimeout(() => setCopiedTip(false), 2000);
    }
  };

  const getBorderColor = () => {
    if (isWalk) return "border-red-500/80 bg-red-950/20 shadow-red-900/20";
    if (isError) return "border-amber-500/60 bg-amber-950/10";
    if (isPending) return "border-blue-500/50 bg-blue-950/10";
    if (isInspected) {
      if (item.points > 0) return "border-emerald-500/40 bg-emerald-950/10";
      return "border-amber-500/40 bg-amber-950/10";
    }
    return "border-slate-800 bg-slate-900/60 hover:border-slate-700";
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${getBorderColor()}`}
    >
      {/* Card Header Bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-[240px]">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isAudio
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              }`}
            >
              {isAudio ? <Mic className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
              <span>{isAudio ? "AST Acoustic Scan" : "Visual Checklist"}</span>
            </span>

            {/* Status Pill */}
            {isWalk && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/50 flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3 h-3" />
                <span>WALK CONDITION</span>
              </span>
            )}
            {isInspected && !isWalk && item.points > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Passed (+{item.points})</span>
              </span>
            )}
            {isInspected && !isWalk && item.points < 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Wear Detected ({item.points})</span>
              </span>
            )}
            {isError && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>Retake Needed</span>
              </span>
            )}
            {isPending && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Offline Pending
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {item.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">{item.subtitle}</p>
        </div>

        {/* Action Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCapture(item)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-md ${
              isInspected
                ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700"
                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20"
            }`}
          >
            {isAudio ? <Mic className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span>{isInspected ? "Re-evaluate" : isAudio ? "Record Audio" : "Take Photo"}</span>
          </button>
        </div>
      </div>

      {/* Instruction & Rubric Accordion */}
      <div className="px-4 sm:px-5 pb-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
        >
          <Info className="w-3.5 h-3.5 text-orange-400" />
          <span>Inspection rubric & instructions</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDetails && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs space-y-2 animate-in fade-in duration-100">
            <p className="text-slate-300 leading-relaxed">{item.instruction}</p>
            <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-1.5">
              {item.rubric_summary.map((r, idx) => (
                <div
                  key={idx}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1.5 ${
                    r.is_walk
                      ? "bg-red-500/10 text-red-300 border-red-500/30 font-bold"
                      : r.points > 0
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                  }`}
                >
                  <span>{r.label}</span>
                  <span className="font-bold">
                    {r.is_walk ? "(WALK -10)" : r.points > 0 ? `(+${r.points})` : `(${r.points})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inspected Result View */}
      {isInspected && (
        <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Diagnosis Finding:</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                  isWalk
                    ? "bg-red-500/20 text-red-300 border-red-500/50"
                    : item.points > 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {item.finding_category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Score Impact:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  isWalk
                    ? "text-red-400 bg-red-500/10"
                    : item.points > 0
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-amber-400 bg-amber-500/10"
                }`}
              >
                {item.points > 0 ? `+${item.points}` : item.points} pts
              </span>
              {item.confidence && (
                <span className="text-slate-500 text-[11px]">
                  ({Math.round(item.confidence * 100)}% conf)
                </span>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="text-xs text-slate-200 leading-relaxed">
            <span className="text-slate-400 font-medium">Mechanical Analysis: </span>
            {item.explanation}
          </div>

          {/* Audio AST Top Candidates & Spectrogram Bar Visualizer */}
          {isAudio && item.audio_result && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1 text-orange-400">
                  <Activity className="w-3.5 h-3.5" />
                  AST Acoustic Top Predictions
                </span>
                <span>
                  Centroid: {item.audio_result.spectrogram.spectral_centroid_hz} Hz
                </span>
              </div>

              {/* 16-Band Normalized Energy Spectrum Bars */}
              <div className="h-10 bg-slate-950 rounded-lg p-1.5 flex items-end justify-between gap-1 border border-slate-800">
                {item.audio_result.spectrogram.energy_levels.map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-sm transition-all duration-300 ${
                      isWalk
                        ? "bg-red-500"
                        : val > 0.6
                        ? "bg-orange-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ height: `${Math.max(10, Math.round(val * 100))}%` }}
                    title={`Band ${idx + 1}: ${Math.round(val * 100)}% energy`}
                  />
                ))}
              </div>

              {/* Top 3 Conditions */}
              <div className="space-y-1.5 pt-1">
                {item.audio_result.top_conditions.map((cand, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded text-slate-300 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono">#{idx + 1}</span>
                      <span className="font-semibold text-slate-200">{cand.condition}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            cand.is_walk_condition
                              ? "bg-red-500"
                              : idx === 0
                              ? "bg-emerald-400"
                              : "bg-slate-500"
                          }`}
                          style={{ width: `${Math.round(cand.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-400 w-8 text-right">
                        {Math.round(cand.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negotiation Tip Quote Box */}
          {item.negotiation_tip && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-300 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Buyer Dealer Negotiation Leverage:
                </span>
                <button
                  onClick={handleCopyTip}
                  className="px-2 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  {copiedTip ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTip ? "Copied" : "Copy Script"}</span>
                </button>
              </div>
              <p className="italic text-slate-200">&ldquo;{item.negotiation_tip}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* Fallback "I Can't See That" / Error Card */}
      {isError && (
        <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-3 animate-in fade-in duration-100">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>AI Recognition Fallback: Image Obscured or Blurry</span>
          </div>
          <p className="leading-relaxed text-amber-200/90">{item.explanation}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-amber-400">
              Action: Ensure camera flash is enabled and hold steady 12 inches away.
            </span>
            <button
              onClick={() => onOpenCapture(item)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending Offline Card */}
      {isPending && (
        <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-3 rounded-xl bg-blue-950/30 border border-blue-500/40 text-blue-200 text-xs flex items-center justify-between">
          <span>Queued locally (Network dropped). Image is safely stored in local memory.</span>
          <button
            onClick={() => onRetryPending && onRetryPending(item.id)}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Upload</span>
          </button>
        </div>
      )}
    </div>
  );
};
