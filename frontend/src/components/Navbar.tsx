"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  Settings,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  AlertTriangle,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

export const Navbar: React.FC = () => {
  const {
    vehicle,
    setVehicleEditModalOpen,
    setReportModalOpen,
    resetChecklist,
    loadDemoScenario,
    getWalkConditions,
    getCompletedCount,
    getAllItems,
  } = useInspectionStore();

  const [isOnline, setIsOnline] = useState(true);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const walkCount = getWalkConditions().length;
  const completedCount = getCompletedCount();
  const totalCount = getAllItems().length;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Car className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-lg">
                CarInspect<span className="text-orange-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                PWA Local-First
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Pre-Purchase AST Acoustics & Multimodal VLM Inspection
            </p>
          </div>
        </div>

        {/* Center: Vehicle Quick Badge */}
        <button
          onClick={() => setVehicleEditModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition group text-left"
          title="Click to edit vehicle profile"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <span className="font-semibold text-slate-200 group-hover:text-orange-300 transition">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
            <span className="text-slate-400 ml-1.5 font-mono">
              {vehicle.trim ? `• ${vehicle.trim}` : ""}
            </span>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 ml-1" />
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online status */}
          <div
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
            title={isOnline ? "Online: Live AI APIs active" : "Offline: Caching locally"}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* Demo Scenarios Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Demo Scenarios</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {demoMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setDemoMenuOpen(false)}
              >
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Instant 1-Click Test Runs
                </div>
                <button
                  onClick={() => loadDemoScenario("clean_pass")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between group transition"
                >
                  <div>
                    <div className="font-semibold text-emerald-400">1. Pristine Clean Pass</div>
                    <div className="text-[11px] text-slate-400">All 20 items healthy (+46 pts)</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Grade A+
                  </span>
                </button>

                <button
                  onClick={() => loadDemoScenario("blown_head_gasket")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between group transition mt-1"
                >
                  <div>
                    <div className="font-semibold text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      2. Blown Head Gasket
                    </div>
                    <div className="text-[11px] text-slate-400">Milkshake foamy oil (WALK AWAY)</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    WALK
                  </span>
                </button>

                <button
                  onClick={() => loadDemoScenario("rod_knock")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between group transition mt-1"
                >
                  <div>
                    <div className="font-semibold text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      3. AST Engine Rod Knock
                    </div>
                    <div className="text-[11px] text-slate-400">Connecting rod failure (WALK AWAY)</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    WALK
                  </span>
                </button>

                <button
                  onClick={() => loadDemoScenario("high_negotiation")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between group transition mt-1"
                >
                  <div>
                    <div className="font-semibold text-amber-400">4. High Dealer Leverage</div>
                    <div className="text-[11px] text-slate-400">Timing cover leak & bald tires (-$3,650)</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Grade C
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              if (confirm("Reset all 20 inspection items to uninspected state?")) {
                resetChecklist();
              }
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Reset Checklist"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* View Report Button */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 transition active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scorecard</span>
            {completedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                {completedCount}/{totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
