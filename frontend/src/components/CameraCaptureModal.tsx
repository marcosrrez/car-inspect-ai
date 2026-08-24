"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { compressImage } from "../utils/imageCompression";
import { diagnoseVision, fetchSampleImageBlob } from "../utils/apiClient";

export const CameraCaptureModal: React.FC = () => {
  const {
    cameraModalOpen,
    activeCaptureItemId,
    closeCameraModal,
    updateItemResult,
    openWalkAwayModal,
    getAllItems,
    vehicle,
  } = useInspectionStore();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!cameraModalOpen || !activeCaptureItemId) return null;

  const item = getAllItems().find((it) => it.id === activeCaptureItemId);
  if (!item) return null;

  const handleProcessFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const compRes = await compressImage(file, 1920, 1920, 0.85);
      const compressedBlob = compRes.file;
      const previewUrl = compRes.previewUrl;

      const carContext = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`;
      const diagResult = await diagnoseVision(compressedBlob, item.id, carContext);

      if (diagResult.finding_category === "Error") {
        setErrorMsg(diagResult.explanation || "Image was too blurry or obscured. Please retake.");
        setLoading(false);
        return;
      }

      updateItemResult(item.id, {
        finding_category: diagResult.finding_category,
        points: diagResult.points,
        is_walk_condition: diagResult.is_walk_condition,
        explanation: diagResult.explanation,
        negotiation_tip: diagResult.negotiation_tip,
        media_preview_url: previewUrl,
        confidence: diagResult.confidence,
        visual_result: diagResult,
      });

      closeCameraModal();

      if (diagResult.is_walk_condition) {
        openWalkAwayModal(item.title, diagResult.explanation);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Diagnostic failed. Please check network and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunSamplePreset = async (presetId: string, label: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const sampleBlob = await fetchSampleImageBlob(presetId);
      const compRes = await compressImage(sampleBlob, 1920, 1920, 0.85);
      const previewUrl = compRes.previewUrl;

      const carContext = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      const diagResult = await diagnoseVision(sampleBlob, item.id, carContext, label);

      updateItemResult(item.id, {
        finding_category: diagResult.finding_category,
        points: diagResult.points,
        is_walk_condition: diagResult.is_walk_condition,
        explanation: diagResult.explanation,
        negotiation_tip: diagResult.negotiation_tip,
        media_preview_url: previewUrl,
        confidence: diagResult.confidence,
        visual_result: diagResult,
      });

      closeCameraModal();

      if (diagResult.is_walk_condition) {
        openWalkAwayModal(item.title, diagResult.explanation);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load sample evaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase">
              Photo Inspection
            </div>
            <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
          </div>
          <button
            onClick={closeCameraModal}
            className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Fallback Notice */}
        {errorMsg && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Unable to analyze clearly: </span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleProcessFile(f);
            }}
          />

          <button
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold text-base shadow-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Analyzing Image with Claude AI...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>Capture with Camera</span>
              </>
            )}
          </button>
        </div>

        {/* Test / Demo Presets */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Or test with calibrated samples:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.rubric_summary.map((opt) => (
              <button
                key={opt.label}
                disabled={loading}
                onClick={() =>
                  handleRunSamplePreset(
                    opt.is_walk ? "dipstick_milkshake" : "dipstick_clean",
                    opt.label
                  )
                }
                className="px-3 py-2 rounded-xl text-xs font-medium text-left border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition flex items-center justify-between"
              >
                <span className="truncate">{opt.label}</span>
                <span
                  className={`text-[10px] font-semibold shrink-0 ml-1 ${
                    opt.is_walk
                      ? "text-red-600"
                      : opt.points < 0
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {opt.is_walk ? "Walk" : `${opt.points > 0 ? "+" : ""}${opt.points}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
