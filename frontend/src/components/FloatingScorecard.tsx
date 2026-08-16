"use client";

import React from "react";
import { AlertOctagon, TrendingUp, TrendingDown, CheckCircle2, FileSpreadsheet, ShieldAlert, ArrowRight } from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

export const FloatingScorecard: React.FC = () => {
  const {
    getTotalPoints,
    getWalkConditions,
    getCompletedCount,
    getAllItems,
    getProgressPercentage,
    setWalkModalOpen,
    setReportModalOpen,
  } = useInspectionStore();

  const totalPoints = getTotalPoints();
  const walkItems = getWalkConditions();
  const completedCount = getCompletedCount();
  const totalCount = getAllItems().length;
  const progressPct = getProgressPercentage();

  // Color calculation
  const isWalk = walkItems.length > 0;
  let healthScore = 50 + totalPoints;
  if (isWalk) healthScore = Math.min(25, Math.max(5, 30 + totalPoints));
  else healthScore = Math.min(100, Math.max(10, healthScore));

  const getScoreColor = () => {
    if (isWalk) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (totalPoints > 15) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (totalPoints >= 0) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-800 shadow-xl backdrop-blur-md sticky top-[57px] z-20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        {/* Deal Breaker Urgent Red Banner if triggered */}
        {isWalk && (
          <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-red-950 via-red-900 to-rose-950 border-2 border-red-500 text-white flex flex-wrap items-center justify-between gap-2 animate-pulse shadow-lg shadow-red-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 font-black">
                <AlertOctagon className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black tracking-wide uppercase flex items-center gap-1.5 text-red-200">
                  <span>🚨 DEAL-BREAKER DETECTED ({walkItems.length} FATAL FLAW{walkItems.length > 1 ? "S" : ""})</span>
                </div>
                <div className="text-[11px] sm:text-xs text-red-200/90 font-medium">
                  {walkItems[0]?.title}: <span className="underline font-bold">{walkItems[0]?.finding_category}</span>. DO NOT BUY THIS CAR.
                </div>
              </div>
            </div>

            <button
              onClick={() => setWalkModalOpen(true, walkItems[0])}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-red-700 font-extrabold text-xs flex items-center gap-1 shadow transition active:scale-95 shrink-0"
            >
              <span>View Deal-Breaker Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Floating Scorecard Grid */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Score Delta */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium hidden sm:inline">Score Tally:</span>
              <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1 ${getScoreColor()}`}>
                {totalPoints > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : totalPoints < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : null}
                <span>{totalPoints > 0 ? `+${totalPoints}` : totalPoints} pts</span>
              </div>
            </div>

            {/* Health Percentage Meter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium hidden sm:inline">Health:</span>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <div className="w-16 sm:w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWalk
                        ? "bg-red-500"
                        : healthScore > 75
                        ? "bg-emerald-400"
                        : healthScore > 50
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, healthScore))}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-slate-200">
                  {isWalk ? "CRITICAL" : `${healthScore}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Progress & Report CTA */}
          <div className="flex items-center gap-3">
            {/* Checklist Progress */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <strong className="text-white font-mono">{completedCount}</strong>/{totalCount}
              </span>
              <span className="text-slate-500 hidden md:inline">({progressPct}% Complete)</span>
            </div>

            {/* View Full Report */}
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
              <span>Inspection Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
