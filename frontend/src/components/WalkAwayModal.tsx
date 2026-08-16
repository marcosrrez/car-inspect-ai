"use client";

import React from "react";
import {
  AlertOctagon,
  X,
  ShieldX,
  FileSpreadsheet,
  ArrowRight,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

export const WalkAwayModal: React.FC = () => {
  const {
    walkModalOpen,
    walkModalItem,
    setWalkModalOpen,
    setReportModalOpen,
    getWalkConditions,
  } = useInspectionStore();

  if (!walkModalOpen) return null;

  const allWalkItems = getWalkConditions();
  const displayItem = walkModalItem || allWalkItems[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
      <div className="w-full max-w-lg bg-gradient-to-b from-red-950 via-slate-900 to-slate-950 border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col shadow-red-900/50">
        {/* Header Alert Ribbon */}
        <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between text-white font-black text-xs sm:text-sm tracking-wider uppercase">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 animate-bounce" />
            <span>CRITICAL DEAL-BREAKER DETECTED</span>
          </div>
          <button
            onClick={() => setWalkModalOpen(false)}
            className="p-1 rounded bg-black/20 hover:bg-black/40 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
              <ShieldX className="w-9 h-9 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              DO NOT BUY THIS VEHICLE
            </h2>
            <p className="text-xs sm:text-sm text-red-300 font-semibold">
              The AI diagnostic system detected a fatal mechanical or structural defect.
            </p>
          </div>

          {/* Defect Card */}
          {displayItem && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                  {displayItem.title}
                </span>
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                  WALK AWAY (-10 PTS)
                </span>
              </div>

              <div className="text-sm font-bold text-white">
                Finding: <span className="text-red-300">{displayItem.finding_category}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {displayItem.explanation}
              </p>

              {displayItem.negotiation_tip && (
                <div className="p-3 rounded-lg bg-black/40 border border-red-500/30 text-xs text-red-200 mt-2 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-red-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Directive for the Buyer:</span>
                  </div>
                  <p className="italic">{displayItem.negotiation_tip}</p>
                </div>
              )}
            </div>
          )}

          {/* Catastrophic Repair Estimate */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <DollarSign className="w-4 h-4 text-red-400" />
              <span>Estimated Failure Teardown Cost:</span>
            </div>
            <span className="font-mono font-black text-red-400 text-sm">
              $4,500 – $9,000+
            </span>
          </div>

          {/* Multiple Walk Items List if more than 1 */}
          {allWalkItems.length > 1 && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="font-semibold text-slate-400">
                Additional Deal-Breakers ({allWalkItems.length - 1} more):
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                {allWalkItems
                  .filter((it) => it.id !== displayItem?.id)
                  .map((it) => (
                    <li key={it.id}>
                      <span className="font-semibold">{it.title}:</span> {it.finding_category}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                setWalkModalOpen(false);
                setReportModalOpen(true);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>View Full Report & Scorecard</span>
            </button>
            <button
              onClick={() => setWalkModalOpen(false)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition"
            >
              Dismiss Warning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
