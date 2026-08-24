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
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-zinc-100 transition-all duration-200 mb-5">
      {/* Step Counter & Status Tag */}
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-medium">
        <span>Item {itemIndex + 1} of {totalItems}</span>
        {isComplete && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isWalk
                ? "bg-red-50 text-red-600"
                : isConcern
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isWalk && <AlertOctagon className="w-3 h-3" />}
            {!isWalk && isGood && <CheckCircle2 className="w-3 h-3" />}
            {!isWalk && isConcern && <AlertTriangle className="w-3 h-3" />}
            {isWalk
              ? "Walk Away"
              : isConcern
              ? `${item.points} pts`
              : `+${item.points} pts`}
          </span>
        )}
      </div>

      {/* Hero Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-1.5">
        {item.title}
      </h2>

      {/* Subtitle / Plain guidance */}
      <p className="text-sm sm:text-base text-zinc-500 mb-5 leading-relaxed">
        {item.subtitle || item.instruction}
      </p>

      {/* Primary Action Button (The Star of the screen) */}
      {!isComplete ? (
        <div className="space-y-3">
          {item.media_type === "audio" ? (
            <button
              onClick={() => openAudioModal(item.id)}
              className="w-full h-13 sm:h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold text-base shadow-sm hover:shadow transition flex items-center justify-center gap-2.5"
            >
              <Mic className="w-5 h-5" />
              <span>Record Engine Audio</span>
            </button>
          ) : (
            <button
              onClick={() => openCameraModal(item.id)}
              className="w-full h-13 sm:h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold text-base shadow-sm hover:shadow transition flex items-center justify-center gap-2.5"
            >
              <Camera className="w-5 h-5" />
              <span>Take Photo</span>
            </button>
          )}

          {/* Quick manual selection row */}
          <div className="pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Or score directly:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {item.rubric_summary.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    quickScoreItem(item.id, opt);
                    if (opt.is_walk) {
                      openWalkAwayModal(item.title, opt.explanation || "Deal-breaker flaw detected.");
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition active:scale-[0.98] flex flex-col justify-between ${
                    opt.is_walk
                      ? "border-red-200 bg-red-50/40 hover:bg-red-50 text-red-900"
                      : opt.points < 0
                      ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-amber-900"
                      : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 hover:bg-zinc-100 text-zinc-800"
                  }`}
                >
                  <span className="font-semibold mb-1">{opt.label}</span>
                  <span
                    className={`text-[10px] font-medium ${
                      opt.is_walk
                        ? "text-red-600"
                        : opt.points < 0
                        ? "text-amber-700"
                        : "text-emerald-600"
                    }`}
                  >
                    {opt.is_walk ? "Walk Away (-10)" : `${opt.points > 0 ? "+" : ""}${opt.points} pts`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Completed State: Clean, confident results view */
        <div className="space-y-4 pt-1 border-t border-zinc-100">
          {/* Finding Badge & Media Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/80 rounded-2xl p-3.5 border border-zinc-100">
            <div className="flex items-center gap-3">
              {item.media_preview_url ? (
                <img
                  src={item.media_preview_url}
                  alt={item.title}
                  className="w-14 h-14 object-cover rounded-xl border border-zinc-200 shrink-0"
                />
              ) : item.media_type === "audio" ? (
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                  <Volume2 className="w-6 h-6" />
                </div>
              ) : null}

              <div>
                <div className="text-[11px] font-medium text-zinc-400">
                  Finding Category
                </div>
                <div className="text-sm sm:text-base font-bold text-zinc-900">
                  {item.finding_category}
                </div>
              </div>
            </div>

            {/* Retake Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  item.media_type === "audio"
                    ? openAudioModal(item.id)
                    : openCameraModal(item.id)
                }
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 transition"
              >
                Retake
              </button>
            </div>
          </div>

          {/* AI Explanation Breakdown */}
          {item.explanation && (
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              {item.explanation}
            </p>
          )}

          {/* Fatal Deal-Breaker Banner */}
          {isWalk && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-red-700">
                  Fatal Deal-Breaker Condition
                </div>
                <div className="text-xs text-red-800/90 mt-0.5">
                  Catastrophic mechanical wear detected. Teardown and overhaul costs exceed vehicle value.
                </div>
              </div>
            </div>
          )}

          {/* Dealer Negotiation Script Box */}
          {item.negotiation_tip && !isWalk && (
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-4 text-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
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
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-zinc-700 italic leading-relaxed">
                "{item.negotiation_tip}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progressive Disclosure: Inspection Guidance */}
      <div className="mt-4 pt-3 border-t border-zinc-100">
        <button
          onClick={() => setGuidanceOpen(!guidanceOpen)}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5 transition"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Inspection Guidance & Rubric</span>
          {guidanceOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {guidanceOpen && (
          <div className="mt-3 space-y-2 text-xs text-zinc-600 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 animate-in fade-in duration-150">
            <div className="font-semibold text-zinc-900 mb-1">
              Instructions:
            </div>
            <p className="mb-2 text-zinc-600 leading-relaxed">
              {item.instruction}
            </p>
            <div className="font-semibold text-zinc-900">
              Scoring Criteria:
            </div>
            <ul className="space-y-1.5">
              {item.rubric_summary.map((opt) => (
                <li key={opt.label} className="flex items-start gap-2">
                  <span
                    className={`font-semibold shrink-0 ${
                      opt.is_walk
                        ? "text-red-600"
                        : opt.points < 0
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    [{opt.is_walk ? "Walk Away" : `${opt.points > 0 ? "+" : ""}${opt.points}`}]
                  </span>
                  <span>
                    <strong className="text-zinc-800">{opt.label}:</strong>{" "}
                    {opt.explanation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
