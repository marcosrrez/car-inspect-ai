"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { FloatingScorecard } from "../components/FloatingScorecard";
import { StationNav } from "../components/StationNav";
import { ChecklistCard } from "../components/ChecklistCard";
import { CameraCaptureModal } from "../components/CameraCaptureModal";
import { AudioRecorderModal } from "../components/AudioRecorderModal";
import { WalkAwayModal } from "../components/WalkAwayModal";
import { VehicleEditModal } from "../components/VehicleEditModal";
import { InspectionReportModal } from "../components/InspectionReportModal";
import { useInspectionStore } from "../store/useInspectionStore";
import { ChecklistItem } from "../types/inspection";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const {
    stations,
    activeStationId,
    setActiveStation,
    setReportModalOpen,
    removePending,
  } = useInspectionStore();

  const [activeCaptureItem, setActiveCaptureItem] = useState<ChecklistItem | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activeStationIndex = stations.findIndex((s) => s.id === activeStationId);
  const activeStation = stations[activeStationIndex] || stations[0];

  const handleOpenCapture = (item: ChecklistItem) => {
    setActiveCaptureItem(item);
    if (item.media_type === "audio") {
      setAudioModalOpen(true);
    } else {
      setCameraModalOpen(true);
    }
  };

  const handlePrevStation = () => {
    if (activeStationIndex > 0) {
      setActiveStation(stations[activeStationIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextStation = () => {
    if (activeStationIndex < stations.length - 1) {
      setActiveStation(stations[activeStationIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setReportModalOpen(true);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing CarInspect AI Local State...</span>
        </div>
      </div>
    );
  }

  const completedInStation = activeStation.items.filter((i) => i.status === "inspected").length;
  const isLastStation = activeStationIndex === stations.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white pb-24">
      {/* Top Navbar */}
      <Navbar />

      {/* Floating Dynamic Scorecard */}
      <FloatingScorecard />

      {/* 5-Station Wizard Navigation Tabs */}
      <StationNav />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Station Title Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Step {activeStation.number} of {stations.length}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                {completedInStation} of {activeStation.items.length} items evaluated
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeStation.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {activeStation.description}
            </p>
          </div>

          {/* Quick Progress Dial */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Station Progress
              </div>
              <div className="text-sm font-mono font-bold text-white">
                {Math.round((completedInStation / activeStation.items.length) * 100)}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-orange-500 flex items-center justify-center text-xs font-mono font-bold text-orange-400 shadow-sm">
              {completedInStation}/{activeStation.items.length}
            </div>
          </div>
        </div>

        {/* 20-Point Checklist Item Cards for Active Station */}
        <div className="space-y-4">
          {activeStation.items.map((item) => (
            <ChecklistCard
              key={item.id}
              item={item}
              onOpenCapture={handleOpenCapture}
              onRetryPending={removePending}
            />
          ))}
        </div>

        {/* Station Navigation Footer Buttons */}
        <div className="pt-4 flex items-center justify-between gap-3">
          <button
            onClick={handlePrevStation}
            disabled={activeStationIndex === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              activeStationIndex === 0
                ? "opacity-30 cursor-not-allowed bg-slate-900 text-slate-500 border-slate-800"
                : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700 active:scale-95"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Station</span>
          </button>

          <button
            onClick={handleNextStation}
            className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition"
          >
            <span>{isLastStation ? "Complete & View Full Report" : `Continue to Station ${activeStation.number + 1}`}</span>
            {isLastStation ? (
              <FileSpreadsheet className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </main>

      {/* Interactive Modals */}
      <CameraCaptureModal
        item={activeCaptureItem}
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
      />

      <AudioRecorderModal
        item={activeCaptureItem}
        isOpen={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
      />

      <WalkAwayModal />
      <VehicleEditModal />
      <InspectionReportModal />
    </div>
  );
}
