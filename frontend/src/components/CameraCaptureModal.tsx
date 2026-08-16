"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { ChecklistItem } from "../types/inspection";
import { compressImage, CompressionResult } from "../utils/imageCompression";
import { diagnoseVision, fetchSampleImageBlob } from "../utils/apiClient";
import { useInspectionStore } from "../store/useInspectionStore";

interface CameraCaptureModalProps {
  item: ChecklistItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const { vehicle, recordVisualResult, enqueuePending } = useInspectionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopLiveCamera();
      setCompressionInfo(null);
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen]);

  const startLiveCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraStream(stream);
      setUseLiveCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setErrorMsg("Camera access denied or unavailable. Please use photo upload.");
      setUseLiveCamera(false);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setUseLiveCamera(false);
  };

  const captureLiveFrame = async () => {
    if (!videoRef.current || !item) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      stopLiveCamera();
      canvas.toBlob(async (blob) => {
        if (blob) {
          await processImageBlob(blob);
        }
      }, "image/jpeg", 0.9);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to capture viewfinder frame.");
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await processImageBlob(file);
  };

  const processImageBlob = async (blobOrFile: Blob | File, presetCondition?: string) => {
    if (!item) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Client-Side Image Compression (Save bandwidth on mobile)
      const compressed = await compressImage(blobOrFile, 1920, 1920, 0.82);
      setCompressionInfo(compressed);

      // 2. Transmit to Backend Multimodal VLM Endpoint
      const carContext = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`;
      const result = await diagnoseVision(
        compressed.file,
        item.id,
        carContext,
        presetCondition
      );

      // 3. Record in Zustand Store
      recordVisualResult(item.id, result, compressed.previewUrl);
      onClose();
    } catch (err: any) {
      console.error("Vision diagnosis error:", err);
      // Offline fallback: Queue as pending if connection failed
      setErrorMsg(`API connection failed: ${err.message}. Queued locally.`);
      // Enqueue to pending queue
      const reader = new FileReader();
      reader.onloadend = () => {
        enqueuePending({
          itemId: item.id,
          stationId: item.station_id,
          blobData: reader.result as string,
          mediaType: "image",
          createdAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(blobOrFile);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPreset = async (scenario: string, conditionName?: string) => {
    if (!item) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const sampleBlob = await fetchSampleImageBlob(scenario);
      await processImageBlob(sampleBlob, conditionName);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load sample image.");
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-orange-400 uppercase">
              Visual Inspection Camera
            </div>
            <h3 className="text-base font-bold text-white">{item.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Prompt & Rubric Preview */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-400" />
              <span>Inspection Instruction:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{item.instruction}</p>

            <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-1.5">
              {item.rubric_summary.map((r, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                    r.is_walk
                      ? "bg-red-500/10 text-red-400 border-red-500/30 font-bold"
                      : r.points > 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {r.label} ({r.points > 0 ? `+${r.points}` : r.points} pts)
                </span>
              ))}
            </div>
          </div>

          {/* Live Camera Viewfinder */}
          {useLiveCamera ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-700 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-dashed border-orange-400/40 pointer-events-none m-6 rounded-lg" />
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                <button
                  onClick={captureLiveFrame}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo</span>
                </button>
                <button
                  onClick={stopLiveCamera}
                  className="px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Camera Buttons */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Native Mobile Camera / File Input */}
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-orange-500/60 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition text-center group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileInput}
                  disabled={loading}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 text-orange-400 flex items-center justify-center mb-2 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-orange-400 transition">
                  Open Camera / Upload
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Mobile camera or photo library
                </span>
              </label>

              {/* Viewfinder live stream */}
              <button
                onClick={startLiveCamera}
                disabled={loading}
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-950 transition text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 group-hover:text-slate-200 flex items-center justify-center mb-2 transition">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition">
                  Live Viewfinder
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Real-time webcam / camera stream
                </span>
              </button>
            </div>
          )}

          {/* Compression Info Badge */}
          {compressionInfo && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Client Compressed ({compressionInfo.savingsPercentage}% saved)</span>
              </div>
              <span className="font-mono text-[11px]">
                {Math.round(compressionInfo.originalSizeBytes / 1024)}KB → {Math.round(compressionInfo.compressedSizeBytes / 1024)}KB
              </span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center gap-3 text-orange-400 text-xs font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing image with Multimodal VLM & Strict JSON Schema...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Instant Test Presets (for 1-click test evaluation) */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Test Scenarios (Evaluate Without Camera):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.rubric_summary.map((r, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => {
                    if (r.is_walk || r.label.toLowerCase().includes("milkshake")) {
                      handleTestPreset("dipstick_milkshake", r.label);
                    } else if (r.points > 0) {
                      handleTestPreset("timing_cover_dry", r.label);
                    } else {
                      handleTestPreset("timing_cover_wet", r.label);
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-left text-xs transition flex items-center justify-between group"
                >
                  <span className="text-slate-300 group-hover:text-white line-clamp-1">
                    {r.label}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      r.is_walk ? "text-red-400" : r.points > 0 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {r.points > 0 ? `+${r.points}` : r.points}
                  </span>
                </button>
              ))}

              {/* Blurry / Error Fallback Test */}
              <button
                disabled={loading}
                onClick={() => handleTestPreset("blurry_test", "Error")}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left text-xs transition flex items-center justify-between group col-span-1 sm:col-span-2"
              >
                <span className="text-slate-400 group-hover:text-slate-200">
                  Simulate Blurry / Obscured Photo (&quot;I Can&apos;t See That&quot; Error Fallback)
                </span>
                <span className="text-amber-400 font-mono text-[10px]">Error Category</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
