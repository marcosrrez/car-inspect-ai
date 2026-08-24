"use client";

import React, { useState } from "react";
import {
  Wrench,
  Droplets,
  ShieldCheck,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Clock,
  Car,
  DollarSign,
  Video,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { CAR_CARE_NUT_MAINTENANCE_TASKS } from "../utils/maintenanceDatabase";
import { MaintenanceTask, ServiceRecord } from "../types/inspection";

export const GarageCareView: React.FC = () => {
  const {
    vehicle,
    updateVehicle,
    serviceHistory,
    addServiceRecord,
    deleteServiceRecord,
    setActiveTab,
  } = useInspectionStore();

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<MaintenanceTask | null>(null);

  // Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logMileage, setLogMileage] = useState(vehicle.mileage || 115000);
  const [logCost, setLogCost] = useState(50);
  const [logPerformedBy, setLogPerformedBy] = useState<"diy" | "professional">("diy");
  const [logPartsBrand, setLogPartsBrand] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const filteredTasks = CAR_CARE_NUT_MAINTENANCE_TASKS.filter((task) => {
    if (filterCategory === "all") return true;
    return task.category === filterCategory;
  });

  const getLatestServiceForTask = (taskId: string): ServiceRecord | undefined => {
    return serviceHistory.find((r) => r.task_id === taskId);
  };

  const calculateServiceStatus = (task: MaintenanceTask) => {
    const latest = getLatestServiceForTask(task.id);
    if (!latest) {
      return {
        status: "due_now",
        milesRemaining: 0,
        label: "Initial service due",
        percentUsed: 100,
      };
    }

    const currentMiles = vehicle.mileage || 0;
    const milesSince = currentMiles - latest.mileage;
    const milesRemaining = task.interval_miles - milesSince;
    const percentUsed = Math.min(100, Math.max(0, (milesSince / task.interval_miles) * 100));

    if (milesRemaining <= 0) {
      return {
        status: "overdue",
        milesRemaining: Math.abs(milesRemaining),
        label: `Overdue by ${Math.abs(milesRemaining).toLocaleString()} mi`,
        percentUsed: 100,
      };
    } else if (milesRemaining <= 1000) {
      return {
        status: "due_soon",
        milesRemaining,
        label: `Due in ${milesRemaining.toLocaleString()} mi`,
        percentUsed,
      };
    } else {
      return {
        status: "good",
        milesRemaining,
        label: `${milesRemaining.toLocaleString()} mi remaining`,
        percentUsed,
      };
    }
  };

  const handleOpenLogModal = (task: MaintenanceTask) => {
    setSelectedTaskForLog(task);
    setLogMileage(vehicle.mileage || 115000);
    setLogPartsBrand(task.oem_spec_note.split(".")[0]);
    setLogModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForLog) return;

    addServiceRecord({
      task_id: selectedTaskForLog.id,
      title: selectedTaskForLog.title,
      date: logDate,
      mileage: logMileage,
      cost_usd: logCost,
      performed_by: logPerformedBy,
      parts_brand: logPartsBrand,
      notes: logNotes,
    });

    if (logMileage > (vehicle.mileage || 0)) {
      updateVehicle({ mileage: logMileage });
    }

    setLogModalOpen(false);
    setSelectedTaskForLog(null);
    setLogNotes("");
  };

  const totalSpent = serviceHistory.reduce((sum, r) => sum + r.cost_usd, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 6-Month Inspection Routine Banner */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase">
            6-Month Routine Health Scan
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight mt-0.5">
            Maintain & Monitor Your Vehicle
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-lg leading-relaxed">
            Run an AI visual and acoustic scan every 6 months to compare baseline engine harmonics, track fluid degradation, and spot leaks early.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("inspection")}
          className="h-11 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white text-xs font-semibold shrink-0 transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>Launch 20-Pt Inspection</span>
        </button>
      </div>

      {/* Mileage Quick Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
          <Car className="w-4 h-4 text-zinc-400" />
          <span>Current Odometer:</span>
          <strong className="text-zinc-900 text-sm font-bold">
            {(vehicle.mileage || 115000).toLocaleString()} mi
          </strong>
        </div>

        <button
          onClick={() => {
            const newMiles = prompt(
              "Update current vehicle mileage:",
              String(vehicle.mileage || 115000)
            );
            if (newMiles && !isNaN(Number(newMiles))) {
              updateVehicle({ mileage: parseInt(newMiles) });
            }
          }}
          className="text-xs text-orange-600 hover:text-orange-700 font-semibold transition"
        >
          Update Mileage
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: "all", label: "All Maintenance" },
          { id: "fluids", label: "Fluids & Oils" },
          { id: "mechanical", label: "Engine & Mechanical" },
          { id: "preservation", label: "Rustproofing" },
          { id: "detailing", label: "Detailing & UV" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterCategory(f.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
              filterCategory === f.id
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-200/50 hover:bg-zinc-200/80 text-zinc-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Maintenance Tasks Stream */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const status = calculateServiceStatus(task);
          const latestService = getLatestServiceForTask(task.id);
          const isExpanded = expandedTaskId === task.id;

          return (
            <div
              key={task.id}
              className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs transition-all"
            >
              {/* Top Row: Title & Interval */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.is_diy_friendly
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {task.diy_difficulty}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Every {task.interval_miles.toLocaleString()} mi / {task.interval_months} mo
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    {task.title}
                  </h3>
                </div>

                {/* Log Service Button */}
                <button
                  onClick={() => handleOpenLogModal(task)}
                  className="h-8 px-3 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition shrink-0 flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Service</span>
                </button>
              </div>

              {/* Progress & Countdown Status */}
              <div className="my-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span
                    className={`font-semibold ${
                      status.status === "overdue"
                        ? "text-red-600"
                        : status.status === "due_soon"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {status.label}
                  </span>
                  {latestService && (
                    <span className="text-zinc-400 text-[11px]">
                      Last: {latestService.mileage.toLocaleString()} mi ({latestService.date})
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      status.status === "overdue"
                        ? "bg-red-500"
                        : status.status === "due_soon"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${status.percentUsed}%` }}
                  />
                </div>
              </div>

              {/* Master Tech Advice Summary */}
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-3">
                {task.why_it_matters}
              </p>

              {/* Expandable Deep Guide */}
              <div className="pt-2 border-t border-zinc-100">
                <button
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 transition"
                >
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isExpanded ? "Hide Master Tech Guide" : "View DIY Steps & OEM Specs"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200/70 rounded-2xl text-xs text-zinc-700 space-y-3 animate-in fade-in duration-150">
                    <div>
                      <strong className="text-zinc-900 font-semibold block mb-0.5">
                        OEM Spec & Parts Recommendation:
                      </strong>
                      <p className="text-zinc-600">{task.oem_spec_note}</p>
                    </div>

                    <div>
                      <strong className="text-zinc-900 font-semibold block mb-0.5">
                        DIY vs. Professional Boundary:
                      </strong>
                      <p className="text-zinc-600">{task.pro_vs_diy_advice}</p>
                    </div>

                    <div>
                      <strong className="text-zinc-900 font-semibold block mb-1">
                        Step-by-Step Procedure:
                      </strong>
                      <ol className="list-decimal list-inside space-y-1 text-zinc-600">
                        {task.step_by_step_summary.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60">
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          task.video_search_query
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Search Master Tech Video Tutorial on YouTube</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Service History Logbook */}
      <div className="mt-10 pt-6 border-t border-zinc-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Service History & Provenance Log
            </h3>
            <p className="text-xs text-zinc-500">
              Total Recorded Maintenance: <strong>${totalSpent.toLocaleString()}</strong> across {serviceHistory.length} records.
            </p>
          </div>
        </div>

        {serviceHistory.length > 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-3xl divide-y divide-zinc-100 overflow-hidden shadow-xs">
            {serviceHistory.map((rec) => (
              <div
                key={rec.id}
                className="p-4 sm:px-5 flex items-center justify-between hover:bg-zinc-50/60 transition text-xs sm:text-sm"
              >
                <div className="min-w-0 mr-3">
                  <div className="font-bold text-zinc-900 truncate">
                    {rec.title}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{rec.date}</span>
                    <span>•</span>
                    <span>{rec.mileage.toLocaleString()} mi</span>
                    <span>•</span>
                    <span className="capitalize text-zinc-600">
                      {rec.performed_by === "diy" ? "DIY" : "Pro Shop"}
                    </span>
                    {rec.parts_brand && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[180px]">{rec.parts_brand}</span>
                      </>
                    )}
                  </div>
                  {rec.notes && (
                    <p className="text-xs text-zinc-500 italic mt-1">
                      "{rec.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-zinc-900">
                    ${rec.cost_usd}
                  </span>
                  <button
                    onClick={() => deleteServiceRecord(rec.id)}
                    className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-50 rounded-3xl border border-zinc-200/60 text-zinc-400 text-xs">
            No service records logged yet. Tap <strong>Log Service</strong> above to record your latest fluid or filter change!
          </div>
        )}
      </div>

      {/* Log Service Modal */}
      {logModalOpen && selectedTaskForLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
              <div>
                <div className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                  Log Service Record
                </div>
                <h3 className="text-lg font-bold text-zinc-900 truncate max-w-xs">
                  {selectedTaskForLog.title}
                </h3>
              </div>
              <button
                onClick={() => setLogModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Date Performed
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Odometer Mileage
                  </label>
                  <input
                    type="number"
                    value={logMileage}
                    onChange={(e) => setLogMileage(parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Total Cost ($)
                  </label>
                  <input
                    type="number"
                    value={logCost}
                    onChange={(e) => setLogCost(parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Performed By
                  </label>
                  <select
                    value={logPerformedBy}
                    onChange={(e) =>
                      setLogPerformedBy(e.target.value as "diy" | "professional")
                    }
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="diy">DIY (Self)</option>
                    <option value="professional">Professional Mechanic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Parts / Fluid Brand Used
                </label>
                <input
                  type="text"
                  value={logPartsBrand}
                  placeholder="e.g. Toyota Genuine 0W-20 & OEM Denso Filter"
                  onChange={(e) => setLogPartsBrand(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Service Notes
                </label>
                <textarea
                  value={logNotes}
                  rows={2}
                  placeholder="e.g. Torqued to 30 ft-lbs, replaced crush washer, no metal shavings found."
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Service Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
