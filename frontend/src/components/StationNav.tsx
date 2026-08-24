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
    <div className="pt-4 pb-2">
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
                  : "bg-zinc-200/60 hover:bg-zinc-200 text-zinc-600"
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

      {/* Calm Station Header & Progress */}
      <div className="mt-4 mb-2 flex items-baseline justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase">
            Station {activeStation.number} of {stations.length}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            {activeStation.title}
          </h1>
        </div>
        <div className="text-xs text-zinc-400 font-medium shrink-0">
          {completedInStation} of {totalInStation} items
        </div>
      </div>

      {/* Hairline subtle progress line */}
      <div className="w-full bg-zinc-200/80 h-1 rounded-full overflow-hidden mt-1 mb-4">
        <div
          className="bg-orange-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${
              totalInStation > 0
                ? (completedInStation / totalInStation) * 100
                : 0
            }%`,
          }}
        />
      </div>
    </div>
  );
};
