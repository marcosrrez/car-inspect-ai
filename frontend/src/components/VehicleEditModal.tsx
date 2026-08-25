"use client";

import React, { useState } from "react";
import {
  X,
  Car,
  Check,
  Search,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { decodeVinNumber } from "../utils/vinDecoder";

export const VehicleEditModal: React.FC = () => {
  const {
    vehicle,
    updateVehicle,
    vehicleEditModalOpen,
    setVehicleEditModalOpen,
  } = useInspectionStore();

  const [formData, setFormData] = useState({
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim || "",
    mileage: vehicle.mileage || 118000,
    asking_price: vehicle.asking_price || 14500,
    vin: vehicle.vin || "",
  });

  const [decoding, setDecoding] = useState(false);
  const [decodeMsg, setDecodeMsg] = useState<string | null>(null);

  if (!vehicleEditModalOpen) return null;

  const handleDecodeVin = async () => {
    if (!formData.vin || formData.vin.trim().length < 11) {
      setDecodeMsg("Please enter at least 11-17 VIN characters.");
      return;
    }

    setDecoding(true);
    setDecodeMsg(null);
    try {
      const decoded = await decodeVinNumber(formData.vin);
      setFormData((prev) => ({
        ...prev,
        year: decoded.year,
        make: decoded.make,
        model: decoded.model,
        trim: `${decoded.trim ? decoded.trim + " " : ""}${decoded.engine || ""}`,
        vin: decoded.vin,
      }));
      setDecodeMsg(`✓ Decoded via NHTSA: ${decoded.year} ${decoded.make} ${decoded.model} (${decoded.engine}, ${decoded.drive_type})`);
    } catch (err: any) {
      setDecodeMsg(err.message || "Failed to decode VIN.");
    } finally {
      setDecoding(false);
    }
  };

  const handlePresetSelect = (preset: {
    year: number;
    make: string;
    model: string;
    trim: string;
    vin: string;
    asking_price: number;
    mileage: number;
  }) => {
    setFormData(preset);
    setDecodeMsg(`✓ Loaded ${preset.year} ${preset.make} ${preset.model} specs.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle(formData);
    setVehicleEditModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                NHTSA VIN & Spec Decoder
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">Vehicle Profile</h3>
            </div>
          </div>
          <button
            onClick={() => setVehicleEditModalOpen(false)}
            className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Benchmark Preset Buttons */}
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            Quick Platform Presets:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  year: 2015,
                  make: "Toyota",
                  model: "Highlander",
                  trim: "V6 Limited AWD (2GR-FE)",
                  vin: "4T3BK3BB0FU123456",
                  asking_price: 16500,
                  mileage: 115000,
                })
              }
              className="p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left font-medium text-zinc-800 transition truncate"
            >
              2015 Highlander V6
            </button>
            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  year: 2016,
                  make: "Honda",
                  model: "Odyssey",
                  trim: "EX-L (3.5L J35 V6)",
                  vin: "5FNRL5H64GB123456",
                  asking_price: 15800,
                  mileage: 104000,
                })
              }
              className="p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left font-medium text-zinc-800 transition truncate"
            >
              2016 Odyssey EX-L
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* VIN Input with NHTSA Live Decode Button */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              17-Digit Vehicle Identification Number (VIN)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.vin}
                placeholder="e.g. 4T3BK3BB0FU123456"
                onChange={(e) =>
                  setFormData({ ...formData, vin: e.target.value.toUpperCase() })
                }
                className="flex-1 h-11 px-3.5 rounded-xl border border-zinc-200 text-xs font-mono font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
              <button
                type="button"
                disabled={decoding}
                onClick={handleDecodeVin}
                className="h-11 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/80 font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                {decoding ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-orange-600" />
                )}
                <span>Decode</span>
              </button>
            </div>
            {decodeMsg && (
              <div className="text-[11px] font-medium text-orange-700 mt-1 bg-orange-50/70 p-2 rounded-lg border border-orange-200/60">
                {decodeMsg}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) || 2015 })
                }
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Make
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Trim & Engine
              </label>
              <input
                type="text"
                value={formData.trim}
                placeholder="e.g. V6 Limited AWD"
                onChange={(e) =>
                  setFormData({ ...formData, trim: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Mileage (miles)
              </label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                }
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Asking Price ($)
            </label>
            <input
              type="number"
              value={formData.asking_price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  asking_price: parseInt(e.target.value) || 0,
                })
              }
              className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-99 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply Vehicle Specs</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
