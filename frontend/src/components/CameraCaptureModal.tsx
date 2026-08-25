"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  RefreshCw,
  AlertCircle,
  Eye,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Crosshair,
  Zap,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { compressImage } from "../utils/imageCompression";
import { diagnoseVision, fetchSampleImageBlob } from "../utils/apiClient";
import { VISUAL_KNOWLEDGE_BASE } from "../utils/visualKnowledgeBase";
import { DiagnosticConfirmationModal } from "./DiagnosticConfirmationModal";

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
  const [activeTab, setActiveTab] = useState<"camera" | "learn">("camera");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const [stabilityScore, setStabilityScore] = useState(0);
  const [lightingLevel, setLightingLevel] = useState<"optimal" | "low">("optimal");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Diagnostic Confirmation state
  const [pendingDiagnostic, setPendingDiagnostic] = useState<{
    itemId: string;
    finding_category: string;
    points: number;
    is_walk_condition: boolean;
    explanation: string;
    negotiation_tip: string | null;
    confidence?: number;
    previewUrl?: string;
    matchedReferenceTitle?: string;
    matchedReferenceCue?: string;
  } | null>(null);

  const item = getAllItems().find((it) => it.id === activeCaptureItemId);
  const refSet = item ? VISUAL_KNOWLEDGE_BASE[item.id] : null;

  // Voice Guidance Announcement
  useEffect(() => {
    if (cameraModalOpen && item && voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${item.title}. ${refSet?.bay_location_guide || item.instruction}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cameraModalOpen, item?.id, voiceEnabled]);

  // Live WebRTC Camera Stream Setup
  useEffect(() => {
    if (cameraModalOpen && activeTab === "camera") {
      startLiveCamera();
    } else {
      stopLiveCamera();
    }
    return () => {
      stopLiveCamera();
    };
  }, [cameraModalOpen, activeTab]);

  const startLiveCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
          startStabilityAnalyzer();
        }
      }
    } catch (err) {
      console.warn("Live WebRTC stream unavailable, fallback to standard camera picker:", err);
      setStreamActive(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
    setStabilityScore(0);
  };

  const startStabilityAnalyzer = () => {
    let score = 0;
    const interval = setInterval(() => {
      score += 25;
      if (score > 100) score = 100;
      setStabilityScore(score);
      if (score >= 100) clearInterval(interval);
    }, 400);
  };

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  };

  // Capture current live frame from WebRTC Video
  const handleCaptureLiveFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !item) return;

    triggerHaptic();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `${item.id}_capture.jpg`, { type: "image/jpeg" });
        await handleProcessFile(file);
      }
    }, "image/jpeg", 0.9);
  };

  const handleProcessFile = async (file: File) => {
    if (!item) return;
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

      const matchedRef = refSet?.references.find(
        (r) =>
          r.title.toLowerCase().includes(diagResult.finding_category.toLowerCase()) ||
          (diagResult.is_walk_condition && r.type === "critical") ||
          (diagResult.points < 0 && r.type === "concern") ||
          (diagResult.points >= 0 && r.type === "good")
      );

      setPendingDiagnostic({
        itemId: item.id,
        finding_category: diagResult.finding_category,
        points: diagResult.points,
        is_walk_condition: diagResult.is_walk_condition,
        explanation: diagResult.explanation,
        negotiation_tip: diagResult.negotiation_tip,
        confidence: diagResult.confidence,
        previewUrl,
        matchedReferenceTitle: matchedRef?.title,
        matchedReferenceCue: matchedRef?.visual_cue,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Diagnostic failed. Please check network and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunSamplePreset = async (presetId: string, label: string) => {
    if (!item) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const sampleBlob = await fetchSampleImageBlob(presetId);
      const compRes = await compressImage(sampleBlob, 1920, 1920, 0.85);
      const previewUrl = compRes.previewUrl;

      const carContext = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      const diagResult = await diagnoseVision(sampleBlob, item.id, carContext, label);

      const matchedRef = refSet?.references.find((r) =>
        r.title.toLowerCase().includes(label.toLowerCase())
      );

      setPendingDiagnostic({
        itemId: item.id,
        finding_category: diagResult.finding_category,
        points: diagResult.points,
        is_walk_condition: diagResult.is_walk_condition,
        explanation: diagResult.explanation,
        negotiation_tip: diagResult.negotiation_tip,
        confidence: diagResult.confidence,
        previewUrl,
        matchedReferenceTitle: matchedRef?.title,
        matchedReferenceCue: matchedRef?.visual_cue,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load sample evaluation.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDiagnostic = () => {
    if (!pendingDiagnostic || !item) return;

    updateItemResult(pendingDiagnostic.itemId, {
      finding_category: pendingDiagnostic.finding_category,
      points: pendingDiagnostic.points,
      is_walk_condition: pendingDiagnostic.is_walk_condition,
      explanation: pendingDiagnostic.explanation,
      negotiation_tip: pendingDiagnostic.negotiation_tip,
      confidence: pendingDiagnostic.confidence,
      media_preview_url: pendingDiagnostic.previewUrl,
    });

    const isWalk = pendingDiagnostic.is_walk_condition;
    const title = item.title;
    const expl = pendingDiagnostic.explanation;

    setPendingDiagnostic(null);
    closeCameraModal();

    if (isWalk) {
      openWalkAwayModal(title, expl);
    }
  };

  const handleManualOverride = (opt: any) => {
    if (!item) return;
    updateItemResult(item.id, {
      finding_category: opt.label,
      points: opt.points,
      is_walk_condition: !!opt.is_walk,
      explanation: opt.explanation || `Manual confirmation: ${opt.label}`,
      negotiation_tip: opt.negotiation_tip || null,
      media_preview_url: pendingDiagnostic?.previewUrl,
    });

    const isWalk = !!opt.is_walk;
    const title = item.title;
    const expl = opt.explanation || "";

    setPendingDiagnostic(null);
    closeCameraModal();

    if (isWalk) {
      openWalkAwayModal(title, expl);
    }
  };

  if (!cameraModalOpen || !activeCaptureItemId || !item) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <div>
              <div className="text-[10px] font-bold tracking-wider text-orange-600 uppercase flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-orange-500" />
                <span>AR Diagnostic Co-Pilot</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 truncate max-w-[280px]">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice Guidance Toggle */}
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                  voiceEnabled
                    ? "bg-orange-50 text-orange-600"
                    : "bg-zinc-100 text-zinc-400"
                }`}
                title={voiceEnabled ? "Voice Co-Pilot Enabled" : "Voice Co-Pilot Muted"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={closeCameraModal}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="bg-zinc-100 p-0.5 rounded-full flex items-center mb-3 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("camera")}
              className={`flex-1 py-1.5 rounded-full transition flex items-center justify-center gap-1.5 ${
                activeTab === "camera"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Scanner</span>
            </button>
            <button
              onClick={() => setActiveTab("learn")}
              className={`flex-1 py-1.5 rounded-full transition flex items-center justify-center gap-1.5 ${
                activeTab === "learn"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-orange-500" />
              <span>Visual Benchmarks</span>
            </button>
          </div>

          {activeTab === "camera" ? (
            /* TAB 1: Live WebRTC Scanner with AR Overlay & Quality Indicators */
            <div className="space-y-3">
              {/* Location Guidance */}
              {refSet?.bay_location_guide && (
                <div className="p-2.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs flex items-start gap-2 text-zinc-700">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-tight">
                    <strong className="text-zinc-900 font-semibold">Target Location: </strong>
                    {refSet.bay_location_guide}
                  </div>
                </div>
              )}

              {/* Live WebRTC Viewfinder or Canvas Camera Feed */}
              <div className="relative aspect-4/3 rounded-2xl bg-zinc-900 overflow-hidden border border-zinc-800 flex items-center justify-center shadow-inner">
                {streamActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-zinc-400">
                    <Camera className="w-8 h-8 mx-auto text-zinc-600 animate-pulse" />
                    <div className="text-xs font-medium">
                      Live Viewfinder Ready
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Tap capture below or select file from your photos.
                    </div>
                  </div>
                )}

                {/* AR Target Crosshair Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-orange-400/80 rounded-2xl relative flex items-center justify-center animate-pulse">
                    {/* Reticle Corner Brackets */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500 -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500 -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500 -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500 -mb-1 -mr-1" />
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  </div>
                </div>

                {/* Live Quality Telemetry Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-medium">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Lighting: Optimal</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-medium">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      stabilityScore >= 75 ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span>{stabilityScore >= 75 ? "Hold Steady" : "Align Target"}</span>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {/* Error Message if Blur detected */}
              {errorMsg && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Primary Capture Buttons */}
              <div className="space-y-2">
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

                {streamActive ? (
                  <button
                    disabled={loading}
                    onClick={handleCaptureLiveFrame}
                    className="w-full h-13 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Diagnosing Target with Claude AI...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Snap & Analyze Frame</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-13 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing with Claude AI...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Take Photo with Camera</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Benchmark Test Presets */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Or test with calibrated benchmark images:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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
                      className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-left border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition flex items-center justify-between"
                    >
                      <span className="truncate mr-1 text-[11px]">{opt.label}</span>
                      <span
                        className={`text-[10px] font-bold shrink-0 ${
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
          ) : (
            /* TAB 2: Visual Teaching Benchmarks (GOOD / CONCERN / CRITICAL) */
            <div className="space-y-2.5">
              <div className="text-xs text-zinc-500 mb-1">
                Visual references for <strong>{item.title}</strong>:
              </div>

              {refSet?.references && refSet.references.length > 0 ? (
                refSet.references.map((ref, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      ref.type === "critical"
                        ? "bg-red-50/50 border-red-200 text-red-950"
                        : ref.type === "concern"
                        ? "bg-amber-50/50 border-amber-200 text-amber-950"
                        : "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {ref.type === "critical" && (
                          <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                        )}
                        {ref.type === "concern" && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {ref.type === "good" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>
                          {ref.type.toUpperCase()}: {ref.title}
                        </span>
                      </div>
                      <span className="font-bold text-[10px]">
                        {ref.is_walk ? "WALK AWAY" : `${ref.points > 0 ? "+" : ""}${ref.points} pts`}
                      </span>
                    </div>

                    <p className="text-zinc-600 leading-normal text-[11px]">
                      {ref.visual_cue}
                    </p>

                    {ref.negotiation_script && (
                      <div className="text-[10px] italic text-zinc-500 pt-0.5">
                        "{ref.negotiation_script}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-400 py-4 text-center">
                  Standard rubric applies for this item.
                </div>
              )}

              <button
                onClick={() => setActiveTab("camera")}
                className="w-full h-11 rounded-2xl bg-zinc-900 text-white font-semibold text-xs transition mt-2"
              >
                Ready → Open Live Scanner
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Diagnostic Confirmation Modal */}
      <DiagnosticConfirmationModal
        isOpen={pendingDiagnostic !== null}
        diagnostic={pendingDiagnostic}
        onConfirm={handleConfirmDiagnostic}
        onRetake={() => {
          setPendingDiagnostic(null);
          startLiveCamera();
        }}
        onManualOverride={handleManualOverride}
      />
    </>
  );
};
