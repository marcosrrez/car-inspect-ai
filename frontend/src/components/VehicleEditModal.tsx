"use client";

import React, { useState } from "react";
import { X, Car, Check } from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";

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

  if (!vehicleEditModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle(formData);
    setVehicleEditModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
                Inspection Target
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Vehicle Profile</h3>
            </div>
          </div>
          <button
            onClick={() => setVehicleEditModalOpen(false)}
            className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) || 2015 })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Make
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Trim / Engine
              </label>
              <input
                type="text"
                value={formData.trim}
                placeholder="e.g. XLE V6 AWD"
                onChange={(e) =>
                  setFormData({ ...formData, trim: e.target.value })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Mileage (miles)
              </label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
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
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                VIN (Optional)
              </label>
              <input
                type="text"
                value={formData.vin}
                placeholder="17-digit VIN"
                onChange={(e) =>
                  setFormData({ ...formData, vin: e.target.value })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full h-13 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Vehicle Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
