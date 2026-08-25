"use client";

import React, { useState } from "react";
import {
  Cpu,
  X,
  Search,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import { OBD_DTC_DATABASE } from "../utils/obdDatabase";
import { ObdDtcFault } from "../types/inspection";
import { useInspectionStore } from "../store/useInspectionStore";

interface ObdDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ObdDecoderModal: React.FC<ObdDecoderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateItemResult, openWalkAwayModal } = useInspectionStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFault, setSelectedFault] = useState<ObdDtcFault | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const filteredCodes = OBD_DTC_DATABASE.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.system.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyToInspection = (fault: ObdDtcFault) => {
    updateItemResult("s5_warning_lights_obd", {
      finding_category: `Fault Code ${fault.code}: ${fault.title}`,
      points: fault.points_deduction,
      is_walk_condition: fault.is_walk,
      explanation: `OBD-II Scan Detected ${fault.code}: ${fault.explanation}`,
      negotiation_tip: fault.dealer_script,
    });

    onClose();

    if (fault.is_walk) {
      openWalkAwayModal(
        `OBD-II Fault: ${fault.code} — ${fault.title}`,
        fault.explanation
      );
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200/80 my-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                Diagnostic Trouble Code Scanner
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                OBD-II Fault Decoder & Leverage
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            placeholder="Search code e.g. P0016, P0420, P0741, P0300..."
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
          />
        </div>

        {/* Main Content Area: List vs Detail */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {selectedFault ? (
            /* Detailed Code View */
            <div className="space-y-4 animate-in fade-in duration-150">
              <button
                onClick={() => setSelectedFault(null)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition"
              >
                ← Back to code list
              </button>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-lg text-zinc-900">
                    {selectedFault.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedFault.is_walk
                        ? "bg-red-100 text-red-700"
                        : selectedFault.points_deduction <= -4
                        ? "bg-amber-100 text-amber-800"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {selectedFault.severity}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-zinc-900">
                  {selectedFault.title}
                </h4>

                <div className="text-xs text-zinc-600">
                  <strong className="text-zinc-800">System:</strong> {selectedFault.system} •{" "}
                  <strong className="text-zinc-800">Est. Repair:</strong> ${selectedFault.estimated_repair_cost.toLocaleString()}
                </div>
              </div>

              {/* Plain English Explanation */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-zinc-900 block">
                  Master Tech Explanation:
                </span>
                <p className="text-zinc-600 leading-relaxed">
                  {selectedFault.explanation}
                </p>
              </div>

              {/* Symptoms */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-zinc-900 block">
                  Observed Symptoms:
                </span>
                <p className="text-zinc-600 leading-relaxed">
                  {selectedFault.symptoms}
                </p>
              </div>

              {/* Dealer Negotiation Script */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-orange-800 uppercase tracking-wider text-[10px]">
                    Dealer Negotiation Script:
                  </span>
                  <button
                    onClick={() => handleCopy(selectedFault.dealer_script)}
                    className="text-orange-700 hover:text-orange-900 flex items-center gap-1 font-semibold"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="italic text-zinc-800 leading-relaxed">
                  "{selectedFault.dealer_script}"
                </p>
              </div>

              {/* Apply to Checklist Button */}
              <button
                onClick={() => handleApplyToInspection(selectedFault)}
                className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-99 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Apply Code to Station 5 Checklist ({selectedFault.points_deduction} pts)</span>
              </button>
            </div>
          ) : (
            /* Code List View */
            <div className="space-y-2">
              {filteredCodes.length > 0 ? (
                filteredCodes.map((f) => (
                  <div
                    key={f.code}
                    onClick={() => setSelectedFault(f)}
                    className="p-3.5 rounded-2xl border border-zinc-200/80 bg-white hover:bg-zinc-50 transition cursor-pointer flex items-center justify-between group text-xs"
                  >
                    <div className="min-w-0 mr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-zinc-900 group-hover:text-orange-600 transition">
                          {f.code}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                            f.is_walk
                              ? "bg-red-50 text-red-600"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {f.system}
                        </span>
                      </div>
                      <p className="text-zinc-600 truncate mt-0.5">
                        {f.title}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-zinc-900">
                        -${f.estimated_repair_cost.toLocaleString()}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          f.is_walk ? "text-red-600" : "text-amber-700"
                        }`}
                      >
                        {f.is_walk ? "Walk Away" : `${f.points_deduction} pts`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  No matching DTC codes found. Enter standard format (e.g. P0016).
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
