"use client";

import React from "react";
import { useInspectionStore } from "../store/useInspectionStore";

export const StationNav: React.FC = () => {
  const { activeStationId, setActiveStation, stations } = useInspectionStore();

  const activeStation =
    stations.find((s) => s.id === activeStationId) || stations[0];
  const completedInStation =
    activeStation?.items.filter((it) => it.status === "inspected").length || 0;
  const totalInStation = activeStation?.items.length || 0;

  return (
    <div className="pt-3 pb-2 mb-2">
      {/* Horizontal Segmented Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {stations.map((st) => {
          const isActive = st.id === activeStationId;
          const isComplete = st.items.every((it) => it.status === "inspected");
          const hasWalk = st.items.some(
            (it) => it.status === "inspected" && it.is_walk_condition
          );

          return (
            <button
              key={st.id}
              onClick={() => setActiveStation(st.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-zinc-200/50 hover:bg-zinc-200/80 text-zinc-600"
              }`}
            >
              <span>
                {st.number}. {st.short_title}
              </span>
              {hasWalk && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              )}
              {!hasWalk && isComplete && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Clean, Deduplicated Station Heading */}
      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          {activeStation.title}
        </h1>
        <span className="text-xs text-zinc-400 font-medium shrink-0 ml-3">
          {completedInStation} of {totalInStation}
        </span>
      </div>
    </div>
  );
};
