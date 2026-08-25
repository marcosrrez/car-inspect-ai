"use client";

import React, { useState, useRef } from "react";
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
  const [activeTab, setActiveTab] = useState<"capture" | "learn">("capture");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (!cameraModalOpen || !activeCaptureItemId) return null;

  const item = getAllItems().find((it) => it.id === activeCaptureItemId);
  if (!item) return null;

  const refSet = VISUAL_KNOWLEDGE_BASE[item.id];

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

      // Match reference cue
      const matchedRef = refSet?.references.find(
        (r) => r.title.toLowerCase().includes(diagResult.finding_category.toLowerCase()) ||
               (diagResult.is_walk_condition && r.type === "critical") ||
               (diagResult.points < 0 && r.type === "concern") ||
               (diagResult.points >= 0 && r.type === "good")
      );

      // Open side-by-side confirmation modal!
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
    setLoading(true);
    setErrorMsg(null);
    try {
      const sampleBlob = await fetchSampleImageBlob(presetId);
      const compRes = await compressImage(sampleBlob, 1920, 1920, 0.85);
      const previewUrl = compRes.previewUrl;

      const carContext = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      const diagResult = await diagnoseVision(sampleBlob, item.id, carContext, label);

      const matchedRef = refSet?.references.find((r) => r.title.toLowerCase().includes(label.toLowerCase()));

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
      setErrorMsg(err.message || "Failed to load sample evaluation.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDiagnostic = () => {
    if (!pendingDiagnostic) return;

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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <div>
              <div className="text-[10px] font-bold tracking-wider text-orange-600 uppercase">
                Active Vision Co-Pilot
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

          {/* Mode Switcher: [ Capture Camera ] ↔ [ See Reference Examples ] */}
          <div className="bg-zinc-100 p-0.5 rounded-full flex items-center mb-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("capture")}
              className={`flex-1 py-1.5 rounded-full transition flex items-center justify-center gap-1.5 ${
                activeTab === "capture"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Capture</span>
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
              <span>See Examples (Good vs Bad)</span>
            </button>
          </div>

          {activeTab === "capture" ? (
            /* TAB 1: Live Capture & Targeting Gatekeeper */
            <div className="space-y-4">
              {/* Location Guidance */}
              {refSet?.bay_location_guide && (
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs flex items-start gap-2 text-zinc-700">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block font-semibold">Where to look:</strong>
                    {refSet.bay_location_guide}
                  </div>
                </div>
              )}

              {/* Quality Checklist */}
              <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-200/80 text-xs text-orange-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-orange-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Quality Capture Checklist:</span>
                </div>
                <div className="text-[11px] text-zinc-600 space-y-0.5">
                  <div>• Hold steady with flash / good light</div>
                  <div>• Wipe lens if oily or smudged</div>
                  <div>• Keep target centered within 12–18 inches</div>
                </div>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Unable to analyze clearly: </span>
                    {errorMsg}
                  </div>
                </div>
              )}

              {/* Primary Camera Action */}
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
                    <span>Open Camera & Capture</span>
                  </>
                )}
              </button>

              {/* Calibrated Test Presets */}
              <div className="pt-3 border-t border-zinc-100">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Or test with calibrated benchmark images:
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
                      <span className="truncate mr-1">{opt.label}</span>
                      <span
                        className={`text-[10px] font-bold shrink-0 ${
                          opt.is_walk
                            ? "text-red-600"
                            : opt.points < 0
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {opt.is_walk ? "Walk Away" : `${opt.points > 0 ? "+" : ""}${opt.points}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: Visual Teaching Knowledge Base (GOOD / CONCERN / CRITICAL) */
            <div className="space-y-3">
              <div className="text-xs text-zinc-500 mb-1">
                Learn what normal vs dangerous looks like before photographing:
              </div>

              {refSet?.references && refSet.references.length > 0 ? (
                refSet.references.map((ref, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      ref.type === "critical"
                        ? "bg-red-50/50 border-red-200 text-red-950"
                        : ref.type === "concern"
                        ? "bg-amber-50/50 border-amber-200 text-amber-950"
                        : "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
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

                    <p className="text-zinc-600 leading-normal">
                      {ref.visual_cue}
                    </p>

                    {ref.negotiation_script && (
                      <div className="text-[11px] italic text-zinc-500 pt-1">
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
                onClick={() => setActiveTab("capture")}
                className="w-full h-11 rounded-2xl bg-zinc-900 text-white font-semibold text-xs transition mt-3"
              >
                Ready → Open Camera
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
          fileInputRef.current?.click();
        }}
        onManualOverride={handleManualOverride}
      />
    </>
  );
};
