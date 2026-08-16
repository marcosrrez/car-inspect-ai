"use client";

import React from "react";
import {
  Droplets,
  Activity,
  ShieldAlert,
  Cpu,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

const ICON_MAP: Record<string, React.ElementType> = {
  Droplets,
  Activity,
  ShieldAlert,
  Cpu,
  Gauge,
};

export const StationNav: React.FC = () => {
  const { stations, activeStationId, setActiveStation } = useInspectionStore();

  return (
    <div className="w-full bg-slate-950/80 border-b border-slate-800 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
          {stations.map((station) => {
            const Icon = ICON_MAP[station.icon_name] || Droplets;
            const isActive = station.id === activeStationId;
            const completedCount = station.items.filter((i) => i.status === "inspected").length;
            const totalCount = station.items.length;
            const isCompleted = completedCount === totalCount;
            const hasWalk = station.items.some((i) => i.status === "inspected" && i.is_walk_condition);
            const hasNegative = station.items.some((i) => i.status === "inspected" && i.points < 0);

            return (
              <button
                key={station.id}
                onClick={() => setActiveStation(station.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                  isActive
                    ? "bg-slate-850 border-orange-500/60 shadow-lg shadow-orange-500/10 text-white"
                    : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {/* Station Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    hasWalk
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : isActive
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : isCompleted
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {hasWalk ? (
                    <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Station Labels */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
                      Station {station.number}
                    </span>
                    {hasWalk ? (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                        WALK
                      </span>
                    ) : hasNegative ? (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        DEFECT
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs font-bold text-slate-200 line-clamp-1">
                    {station.short_title.replace(/^\d+\.\s*/, "")}
                  </div>
                </div>

                {/* Item Counter Badge */}
                <div className="ml-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                  {completedCount}/{totalCount}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
