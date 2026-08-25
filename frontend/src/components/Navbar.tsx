"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Car,
  MoreHorizontal,
  FileText,
  Settings,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  Wrench,
  Cpu,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

export const Navbar: React.FC = () => {
  const {
    vehicle,
    garageVehicles,
    switchActiveVehicle,
    activeTab,
    setActiveTab,
    setVehicleEditModalOpen,
    setReportModalOpen,
    setObdModalOpen,
    resetChecklist,
    loadDemoScenario,
    getCompletedCount,
    getAllItems,
  } = useInspectionStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [garageDropdownOpen, setGarageDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const garageRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (garageRef.current && !garageRef.current.contains(e.target as Node)) {
        setGarageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const completedCount = getCompletedCount();
  const totalCount = getAllItems().length;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-zinc-200/70 transition-all">
      <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Multi-Vehicle Garage Dropdown Selector */}
        <div className="relative" ref={garageRef}>
          <button
            onClick={() => setGarageDropdownOpen(!garageDropdownOpen)}
            className="flex items-center gap-2 text-left p-1 rounded-xl hover:bg-zinc-100/80 transition group"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Car className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex items-center gap-1">
              <span className="font-semibold text-xs sm:text-sm text-zinc-900 truncate max-w-[130px] sm:max-w-[170px]">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition" />
            </div>
          </button>

          {/* Garage Dropdown Menu */}
          {garageDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white border border-zinc-200/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                My Garage ({garageVehicles.length} Vehicles)
              </div>

              <div className="py-1 space-y-0.5 max-h-48 overflow-y-auto">
                {garageVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      switchActiveVehicle(v.id);
                      setGarageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                      v.id === vehicle.id
                        ? "bg-orange-50 text-orange-950 font-bold border border-orange-200/60"
                        : "text-zinc-700 hover:bg-zinc-50 font-medium"
                    }`}
                  >
                    <span className="truncate mr-2">
                      {v.year} {v.make} {v.model}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {(v.mileage || 0).toLocaleString()} mi
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-1 border-t border-zinc-100">
                <button
                  onClick={() => {
                    setGarageDropdownOpen(false);
                    setVehicleEditModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 text-xs text-orange-600 font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Edit Vehicle</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mode Switcher: [ Inspection ] ↔ [ Garage Care ] */}
        <div className="bg-zinc-100 p-0.5 rounded-full flex items-center shrink-0 border border-zinc-200/50">
          <button
            onClick={() => setActiveTab("inspection")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              activeTab === "inspection"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Inspection
          </button>
          <button
            onClick={() => setActiveTab("garage")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === "garage"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Wrench className="w-3 h-3 text-orange-500" />
            <span>Care Log</span>
          </button>
        </div>

        {/* Right Menu (•••) */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              menuOpen
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
            aria-label="Session options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Vehicle Tools
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isOnline
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                  {isOnline ? "Online" : "Offline Lot Shield"}
                </span>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setObdModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50/60 text-xs text-orange-900 font-semibold flex items-center gap-2.5 transition"
                >
                  <Cpu className="w-4 h-4 text-orange-600" />
                  <span>OBD-II Fault Decoder</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setReportModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 text-xs text-zinc-700 flex items-center gap-2.5 transition"
                >
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span>Certified Dossier ({completedCount}/{totalCount})</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setVehicleEditModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 text-xs text-zinc-700 flex items-center gap-2.5 transition"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Edit Vehicle Specs</span>
                </button>
              </div>

              <div className="pt-1 border-t border-zinc-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  PPI Calibration Scenarios
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    loadDemoScenario("clean_pass");
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-zinc-50 text-xs text-zinc-700 flex items-center justify-between transition"
                >
                  <span>Clean Pass</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Grade A+</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    loadDemoScenario("blown_head_gasket");
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-zinc-50 text-xs text-zinc-700 flex items-center justify-between transition"
                >
                  <span>Head Gasket Fault</span>
                  <span className="text-[10px] text-red-600 font-medium">Walk Away</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    loadDemoScenario("rod_knock");
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-zinc-50 text-xs text-zinc-700 flex items-center justify-between transition"
                >
                  <span>AST Rod Knock</span>
                  <span className="text-[10px] text-red-600 font-medium">Walk Away</span>
                </button>
              </div>

              <div className="pt-1 border-t border-zinc-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (confirm("Reset current vehicle inspection?")) {
                      resetChecklist();
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-xs text-red-600 flex items-center gap-2.5 transition"
                >
                  <RotateCcw className="w-4 h-4 text-red-400" />
                  <span>Reset Checklist</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
