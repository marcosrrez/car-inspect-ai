"use client";

import React, { useState } from "react";
import { Car, X, Check, DollarSign, Gauge, Hash, Save } from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { VehicleProfile } from "../types/inspection";

export const VehicleEditModal: React.FC = () => {
  const { vehicle, updateVehicle, vehicleEditModalOpen, setVehicleEditModalOpen } =
    useInspectionStore();

  const [formData, setFormData] = useState<VehicleProfile>({ ...vehicle });

  if (!vehicleEditModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle(formData);
    setVehicleEditModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Vehicle Under Inspection</h3>
          </div>
          <button
            onClick={() => setVehicleEditModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Year */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) || 2015 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            {/* Make */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Make
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                placeholder="Toyota"
                required
              />
            </div>

            {/* Model */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                placeholder="Highlander"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Trim */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Trim / Engine
              </label>
              <input
                type="text"
                value={formData.trim}
                onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="V6 Limited AWD"
              />
            </div>

            {/* Mileage */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Odometer Mileage
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) =>
                    setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                />
                <Gauge className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Asking Price */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Asking Price ($USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.asking_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      asking_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* VIN */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                VIN (17-Character)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  maxLength={17}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-orange-500"
                  placeholder="4T3BK3BB0FU123456"
                />
                <Hash className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setVehicleEditModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Vehicle Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
