"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Car,
  Check,
  Search,
  RefreshCw,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { decodeVinNumber } from "../utils/vinDecoder";

const EMPTY_FORM = {
  year: new Date().getFullYear(),
  make: "",
  model: "",
  trim: "",
  mileage: 0,
  asking_price: 0,
  vin: "",
};

export const VehicleEditModal: React.FC = () => {
  const {
    vehicle,
    updateVehicle,
    addVehicleToGarage,
    vehicleEditModalOpen,
    setVehicleEditModalOpen,
    vehicleModalMode,
  } = useInspectionStore();

  // In "edit" mode we pre-fill from the active vehicle; in "add" mode we start blank.
  const isEdit = vehicleModalMode === "edit" && !!vehicle;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [decoding, setDecoding] = useState(false);
  const [decodeMsg, setDecodeMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset the form each time the modal opens, based on add vs. edit mode.
  useEffect(() => {
    if (!vehicleEditModalOpen) return;
    setDecodeMsg(null);
    setErrorMsg(null);
    if (isEdit && vehicle) {
      setFormData({
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim || "",
        mileage: vehicle.mileage || 0,
        asking_price: vehicle.asking_price || 0,
        vin: vehicle.vin || "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [vehicleEditModalOpen, isEdit, vehicle]);

  if (!vehicleEditModalOpen) return null;

  const handleDecodeVin = async () => {
    if (!formData.vin || formData.vin.trim().length !== 17) {
      setDecodeMsg("Enter the full 17-character VIN to decode.");
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
        trim: `${decoded.trim ? decoded.trim + " " : ""}${decoded.engine || ""}`.trim(),
        vin: decoded.vin,
      }));
      setDecodeMsg(`✓ Decoded via NHTSA: ${decoded.year} ${decoded.make} ${decoded.model} (${decoded.engine}, ${decoded.drive_type})`);
    } catch (err: any) {
      setDecodeMsg(err.message || "Couldn't decode that VIN. You can enter the details manually below.");
    } finally {
      setDecoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make.trim() || !formData.model.trim()) {
      setErrorMsg("Make and model are required.");
      return;
    }
    if (isEdit) {
      updateVehicle(formData);
    } else {
      addVehicleToGarage({ ...formData, is_turbocharged: false });
    }
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
                {isEdit ? "Edit Vehicle Details" : "Add a Vehicle"}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                {isEdit ? "Vehicle Profile" : "New Vehicle"}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setVehicleEditModalOpen(false)}
            className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Enter the VIN to auto-fill from the free NHTSA database, or type the
          details in manually. Everything is stored locally on this device.
        </p>

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

          {errorMsg && (
            <div className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-200/70 rounded-lg p-2">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-99 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? "Save Changes" : "Add to Garage"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
