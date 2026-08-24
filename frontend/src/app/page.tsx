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
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export default function Home() {
  const {
    stations,
    activeStationId,
    setActiveStation,
    setReportModalOpen,
  } = useInspectionStore();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading CarInspect AI...</span>
        </div>
      </div>
    );
  }

  const currentStationIndex = stations.findIndex((s) => s.id === activeStationId);
  const activeStation = stations[currentStationIndex] || stations[0];
  const items = activeStation?.items || [];
  const isLastStation = currentStationIndex === stations.length - 1;

  const handlePrevStation = () => {
    if (currentStationIndex > 0) {
      setActiveStation(stations[currentStationIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextStation = () => {
    if (currentStationIndex < stations.length - 1) {
      setActiveStation(stations[currentStationIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setReportModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col selection:bg-orange-500 selection:text-white pb-28">
      {/* Calm Top Header */}
      <Navbar />

      {/* Main Inspection Workflow Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6">
        {/* Horizontal Segmented Station Selector */}
        <StationNav />

        {/* Focused Inspection Item Stream (Content → Whitespace → Content) */}
        <div className="space-y-4 my-2">
          {items.map((item, idx) => (
            <ChecklistCard
              key={item.id}
              item={item}
              itemIndex={idx}
              totalItems={items.length}
            />
          ))}
        </div>

        {/* Calm Step Navigation Footer */}
        <div className="mt-8 pt-4 flex items-center justify-between gap-3">
          <button
            onClick={handlePrevStation}
            disabled={currentStationIndex === 0}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition ${
              currentStationIndex === 0
                ? "opacity-25 cursor-not-allowed text-zinc-400"
                : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200/80 shadow-sm active:scale-95"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Station</span>
          </button>

          <button
            onClick={handleNextStation}
            className="px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm active:scale-95 transition"
          >
            <span>
              {isLastStation
                ? "View Final Report"
                : `Next: Station ${currentStationIndex + 2}`}
            </span>
            {isLastStation ? (
              <FileText className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </main>

      {/* Floating Quiet Status Pill */}
      <FloatingScorecard />

      {/* Modals */}
      <CameraCaptureModal />
      <AudioRecorderModal />
      <WalkAwayModal />
      <VehicleEditModal />
      <InspectionReportModal />
    </div>
  );
}
