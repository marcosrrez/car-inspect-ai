"use client";

import React from "react";
import { AlertOctagon, FileText, ChevronRight } from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

export const FloatingScorecard: React.FC = () => {
  const {
    hasWalkAwayCondition,
    getCompletedCount,
    getAllItems,
    setReportModalOpen,
    openWalkAwayModal,
  } = useInspectionStore();

  const completedCount = getCompletedCount();
  const totalCount = getAllItems().length;
  const hasFatal = hasWalkAwayCondition();

  if (completedCount === 0 && !hasFatal) {
    return null;
  }

  return (
    <div className="fixed bottom-5 inset-x-0 z-30 pointer-events-none flex justify-center px-4">
      {hasFatal ? (
        /* Calm, high-contrast Deal-Breaker Alert Pill */
        <button
          onClick={() =>
            openWalkAwayModal(
              "Deal-Breaker Condition Active",
              "One or more fatal mechanical flaws have been recorded. Overhaul costs exceed market value."
            )
          }
          className="pointer-events-auto bg-red-600 hover:bg-red-700 active:scale-98 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2.5 text-sm font-semibold transition"
        >
          <AlertOctagon className="w-4 h-4 text-white" />
          <span>Walk Away Alert Active</span>
          <ChevronRight className="w-4 h-4 opacity-80" />
        </button>
      ) : (
        /* Quiet, elegant floating inspection status */
        <button
          onClick={() => setReportModalOpen(true)}
          className="pointer-events-auto bg-zinc-900/90 hover:bg-zinc-900 active:scale-98 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 text-xs font-medium transition"
        >
          <span className="text-zinc-300">
            {completedCount} of {totalCount} completed
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-600" />
          <span className="text-orange-400 font-semibold flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>View Summary</span>
          </span>
        </button>
      )}
    </div>
  );
};
