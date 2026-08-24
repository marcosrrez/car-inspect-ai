"use client";

import React, { useState } from "react";
import {
  Camera,
  Mic,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Volume2,
  Copy,
  Check,
  Info,
  RotateCcw,
} from "lucide-react";
import { ChecklistItem } from "../types/inspection";
import { useInspectionStore } from "../store/useInspectionStore";

interface ChecklistCardProps {
  item: ChecklistItem;
  itemIndex: number;
  totalItems: number;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  item,
  itemIndex,
  totalItems,
}) => {
  const {
    openCameraModal,
    openAudioModal,
    quickScoreItem,
    openWalkAwayModal,
  } = useInspectionStore();

  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const isComplete = item.status === "inspected";
  const isWalk = item.is_walk_condition;
  const isConcern = isComplete && !isWalk && item.points < 0;
  const isGood = isComplete && item.points >= 0;

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="py-7 border-b border-zinc-200/70 last:border-b-0 transition-all duration-150">
      {/* Item Title & Subtitle */}
      <div className="mb-4">
        <h3 className="text-xl sm:text-[22px] font-bold text-zinc-900 tracking-tight mb-1">
          {item.title}
        </h3>
        <p className="text-sm sm:text-[15px] text-zinc-500 leading-normal">
          {item.subtitle || item.instruction}
        </p>
      </div>

      {/* State A: Uninspected / Active Workflow */}
      {!isComplete ? (
        <div className="space-y-4">
          {/* Primary Action Button */}
          {item.media_type === "audio" ? (
            <button
              onClick={() => openAudioModal(item.id)}
              className="w-full h-13 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2.5"
            >
              <Mic className="w-5 h-5" />
              <span>Record Engine Audio</span>
            </button>
          ) : (
            <button
              onClick={() => openCameraModal(item.id)}
              className="w-full h-13 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2.5"
            >
              <Camera className="w-5 h-5" />
              <span>Take Photo</span>
            </button>
          )}

          {/* Compact Grouped List: Quick Score */}
          <div>
            <div className="text-[11px] font-medium text-zinc-400 mb-1.5 px-0.5">
              Quick score
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-2xl divide-y divide-zinc-100 overflow-hidden shadow-xs">
              {item.rubric_summary.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    quickScoreItem(item.id, opt);
                    if (opt.is_walk) {
                      openWalkAwayModal(
                        item.title,
                        opt.explanation || "Deal-breaker condition recorded."
                      );
                    }
                  }}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-zinc-50/80 active:bg-zinc-100 transition text-xs sm:text-sm font-medium text-zinc-800"
                >
                  <span className="truncate mr-2">{opt.label}</span>
                  <span
                    className={`font-semibold shrink-0 text-xs ${
                      opt.is_walk
                        ? "text-red-600 font-bold"
                        : opt.points < 0
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {opt.is_walk
                      ? "Walk Away"
                      : `${opt.points > 0 ? "+" : "−"}${Math.abs(opt.points)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Progressive Disclosure: Inspection Guidance */}
          <div className="pt-1">
            <button
              onClick={() => setGuidanceOpen(!guidanceOpen)}
              className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1.5 transition font-medium"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Inspection guidance</span>
              {guidanceOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {guidanceOpen && (
              <div className="mt-3 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs text-zinc-600 space-y-2 animate-in fade-in duration-150">
                <div className="font-semibold text-zinc-800">Instructions:</div>
                <p className="leading-relaxed">{item.instruction}</p>
                <div className="font-semibold text-zinc-800 pt-1">Rubric Criteria:</div>
                <ul className="space-y-1">
                  {item.rubric_summary.map((r) => (
                    <li key={r.label} className="flex items-start gap-1.5">
                      <span className="text-zinc-400">•</span>
                      <span>
                        <strong className="text-zinc-700">{r.label}:</strong>{" "}
                        {r.explanation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* State B: Inspected / Determined State */
        <div className="space-y-3 pt-1">
          {/* Confident Finding Badge & Actions */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-50/80 rounded-2xl border border-zinc-100">
            <div className="flex items-center gap-3 min-w-0">
              {item.media_preview_url ? (
                <img
                  src={item.media_preview_url}
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded-xl border border-zinc-200 shrink-0"
                />
              ) : item.media_type === "audio" ? (
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isWalk
                      ? "bg-red-100 text-red-600"
                      : isConcern
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isWalk ? (
                    <AlertOctagon className="w-5 h-5" />
                  ) : isConcern ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
              )}

              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                  {item.finding_category}
                </div>
                <div
                  className={`text-xs font-semibold ${
                    isWalk
                      ? "text-red-600 font-bold"
                      : isConcern
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {isWalk
                    ? "Fatal Deal-Breaker"
                    : `${item.points > 0 ? "+" : "−"}${Math.abs(item.points)} points`}
                </div>
              </div>
            </div>

            {/* Retake Button */}
            <button
              onClick={() =>
                item.media_type === "audio"
                  ? openAudioModal(item.id)
                  : openCameraModal(item.id)
              }
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white transition shrink-0"
            >
              Retake
            </button>
          </div>

          {/* Explanation if available */}
          {item.explanation && (
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed px-1">
              {item.explanation}
            </p>
          )}

          {/* Fatal Deal-Breaker Warning */}
          {isWalk && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 flex items-start gap-2.5 text-xs">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-red-700">
                  Walk away:
                </strong>{" "}
                Severe mechanical flaw detected. Teardown and overhaul costs exceed reasonable buying threshold.
              </div>
            </div>
          )}

          {/* Dealer Negotiation Script Box */}
          {item.negotiation_tip && !isWalk && (
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 text-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                  Dealer Negotiation Script
                </span>
                <button
                  onClick={() => handleCopyScript(item.negotiation_tip!)}
                  className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition"
                >
                  {copiedScript ? (
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
              <p className="text-xs text-zinc-700 italic leading-relaxed">
                "{item.negotiation_tip}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
