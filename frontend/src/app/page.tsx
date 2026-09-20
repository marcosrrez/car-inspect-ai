"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { FloatingScorecard } from "../components/FloatingScorecard";
import { StationNav } from "../components/StationNav";
import { ChecklistCard } from "../components/ChecklistCard";
import { GarageCareView } from "../components/GarageCareView";
import { CarHuntArchiveView } from "../components/CarHuntArchiveView";
import { CameraCaptureModal } from "../components/CameraCaptureModal";
import { AudioRecorderModal } from "../components/AudioRecorderModal";
import { WalkAwayModal } from "../components/WalkAwayModal";
import { VehicleEditModal } from "../components/VehicleEditModal";
import { InspectionReportModal } from "../components/InspectionReportModal";
import { ObdDecoderModal } from "../components/ObdDecoderModal";
import { useInspectionStore } from "../store/useInspectionStore";
import { ChevronLeft, ChevronRight, FileText, Car, Plus } from "lucide-react";

export default function Home() {
  const {
    activeTab,
    stations,
    activeStationId,
    setActiveStation,
    setReportModalOpen,
    obdModalOpen,
    setObdModalOpen,
    vehicle,
    openVehicleModal,
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
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col selection:bg-orange-500 selection:text-white pb-32">
      {/* Top Header with Multi-Vehicle Dropdown & 3-Mode Switcher */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 pt-2">
        {!vehicle ? (
          /* Empty garage — first-run onboarding */
          <div className="mt-10 sm:mt-16 flex flex-col items-center text-center px-2 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-orange-500 text-white flex items-center justify-center shadow-sm mb-5">
              <Car className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Add your first vehicle
            </h1>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm leading-relaxed">
              CarInspect AI walks you through a 20-point pre-purchase inspection,
              tracks the cars you&apos;re hunting, and logs your maintenance. Start
              by adding a vehicle — enter a VIN to auto-fill, or type the details
              in manually.
            </p>
            <button
              onClick={() => openVehicleModal("add")}
              className="mt-6 h-12 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add a Vehicle</span>
            </button>
            <p className="text-[11px] text-zinc-400 mt-4">
              Everything stays on this device.
            </p>
          </div>
        ) : activeTab === "inspection" ? (
          /* Mode 1: Pre-Purchase & 6-Month 20-Point Inspection */
          <>
            <StationNav />

            {/* Focused Inspection Items */}
            <div className="divide-y divide-zinc-200/60">
              {items.map((item, idx) => (
                <ChecklistCard
                  key={item.id}
                  item={item}
                  itemIndex={idx}
                  totalItems={items.length}
                />
              ))}
            </div>

            {/* Station Step Navigation Footer */}
            <div className="mt-10 pt-4 flex items-center justify-between gap-3">
              <button
                onClick={handlePrevStation}
                disabled={currentStationIndex === 0}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  currentStationIndex === 0
                    ? "opacity-25 cursor-not-allowed text-zinc-400"
                    : "text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200/80 shadow-xs active:scale-95"
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
          </>
        ) : activeTab === "hunt" ? (
          /* Mode 2: Car Hunt Archive, Negotiation Log & Side-by-Side Comparison */
          <CarHuntArchiveView />
        ) : (
          /* Mode 3: The Car Care Nut Master Longevity & Service Logbook */
          <GarageCareView />
        )}
      </main>

      {/* Floating Status Pill (Active during Inspection mode) */}
      {activeTab === "inspection" && vehicle && <FloatingScorecard />}

      {/* Modals */}
      <CameraCaptureModal />
      <AudioRecorderModal />
      <WalkAwayModal />
      <VehicleEditModal />
      <InspectionReportModal />
      <ObdDecoderModal
        isOpen={obdModalOpen}
        onClose={() => setObdModalOpen(false)}
      />
    </div>
  );
}
