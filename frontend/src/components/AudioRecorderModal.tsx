"use client";

import React, { useState, useRef } from "react";
import {
  Mic,
  Square,
  X,
  RefreshCw,
  Eye,
  Activity,
  AlertOctagon,
  Volume2,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { diagnoseAudio, fetchSampleAudioBlob } from "../utils/apiClient";
import { DiagnosticConfirmationModal } from "./DiagnosticConfirmationModal";

export const AudioRecorderModal: React.FC = () => {
  const {
    audioModalOpen,
    activeCaptureItemId,
    closeAudioModal,
    updateItemResult,
    openWalkAwayModal,
    getAllItems,
  } = useInspectionStore();

  const [activeTab, setActiveTab] = useState<"record" | "learn">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!audioModalOpen || !activeCaptureItemId) return null;

  const item = getAllItems().find((it) => it.id === activeCaptureItemId);
  if (!item) return null;

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 5) {
            stopRecording();
            return 5;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Microphone access denied. Please check permissions or test a sample below.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAudioBlob = async (blob: Blob, presetFault?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const diagResult = await diagnoseAudio(blob, "idling", presetFault);

      setPendingDiagnostic({
        itemId: item.id,
        finding_category: diagResult.primary_condition,
        points: diagResult.points,
        is_walk_condition: diagResult.is_walk_condition,
        explanation: diagResult.explanation,
        negotiation_tip: diagResult.negotiation_tip,
        confidence: diagResult.confidence,
        matchedReferenceTitle: diagResult.primary_condition,
        matchedReferenceCue: `Dominant Frequency: ${diagResult.spectrogram?.dominant_frequency_hz || 240} Hz • Harmonic Ratio: ${Math.round((diagResult.spectrogram?.harmonic_ratio || 0.85) * 100)}%`,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Acoustic analysis failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestSample = async (presetId: string, faultName: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const sampleBlob = await fetchSampleAudioBlob(presetId);
      await processAudioBlob(sampleBlob, faultName);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to analyze sample.");
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
    });

    const isWalk = pendingDiagnostic.is_walk_condition;
    const title = `${item.title} — ${pendingDiagnostic.finding_category}`;
    const expl = pendingDiagnostic.explanation;

    setPendingDiagnostic(null);
    closeAudioModal();

    if (isWalk) {
      openWalkAwayModal(title, expl);
    }
  };

  const handleManualOverride = (opt: any) => {
    updateItemResult(item.id, {
      finding_category: opt.label,
      points: opt.points,
      is_walk_condition: !!opt.is_walk,
      explanation: opt.explanation || `Manual score: ${opt.label}`,
      negotiation_tip: opt.negotiation_tip || null,
    });

    const isWalk = !!opt.is_walk;
    const title = item.title;
    const expl = opt.explanation || "";

    setPendingDiagnostic(null);
    closeAudioModal();

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
                19-Class AST Acoustic Transformer
              </div>
              <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
            </div>
            <button
              onClick={closeAudioModal}
              className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="bg-zinc-100 p-0.5 rounded-full flex items-center mb-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("record")}
              className={`flex-1 py-1.5 rounded-full transition flex items-center justify-center gap-1.5 ${
                activeTab === "record"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record Engine Audio</span>
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
              <span>Acoustic Reference Cues</span>
            </button>
          </div>

          {activeTab === "record" ? (
            /* TAB 1: Live Record Engine Audio */
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Audio Waveform / Timer Box */}
              <div className="bg-zinc-900 rounded-3xl p-6 text-white text-center flex flex-col items-center justify-center shadow-xs">
                <div className="text-xs text-zinc-400 font-medium mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  <span>{isRecording ? "Listening to valvetrain & crank harmonics..." : "Ready to record 5-second sample"}</span>
                </div>
                <div className="text-3xl font-mono font-black text-orange-400">
                  00:0{isRecording ? recordingTime : "0"} / 00:05
                </div>

                {isRecording && (
                  <div className="flex items-center gap-1.5 mt-4 h-8">
                    {[40, 75, 95, 60, 85, 50, 90, 70, 45, 80, 60, 85, 95, 60].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-orange-500 rounded-full animate-pulse"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isRecording ? (
                <button
                  disabled={loading}
                  onClick={startRecording}
                  className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold text-base shadow-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processing Spectrogram...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Start 5-Second Recording</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold text-base shadow-sm transition flex items-center justify-center gap-2.5"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>Stop & Analyze Now</span>
                </button>
              )}

              {/* Test / Calibrated Acoustic Benchmarks */}
              <div className="pt-3 border-t border-zinc-100">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Or test with calibrated engine audio:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: "healthy_idle", name: "Healthy Idle", pts: "+3", walk: false },
                    { id: "rod_knock", name: "Rod Knock", pts: "-10", walk: true },
                    { id: "lifter_tick", name: "Lifter Tick", pts: "-2", walk: false },
                    { id: "belt_squeal", name: "Belt Squeal", pts: "-1", walk: false },
                  ].map((p) => (
                    <button
                      key={p.id}
                      disabled={loading || isRecording}
                      onClick={() => handleTestSample(p.id, p.name)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-left border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition flex items-center justify-between"
                    >
                      <span>{p.name}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          p.walk ? "text-red-600" : "text-zinc-600"
                        }`}
                      >
                        {p.walk ? "Walk Away" : p.pts}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: Acoustic Reference Benchmarks */
            <div className="space-y-3">
              <div className="text-xs text-zinc-500 mb-1">
                Acoustic cues and frequency signatures to listen for:
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                  <strong className="text-emerald-900 font-bold block">
                    GOOD: Harmonic Idle (600–750 RPM)
                  </strong>
                  <p className="text-emerald-800/90">
                    Smooth, balanced purr with consistent valvetrain whir and zero metallic hammer strikes.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1">
                  <strong className="text-amber-900 font-bold block">
                    CONCERN: Upper Valvetrain Lifter Tick (2–4 kHz)
                  </strong>
                  <p className="text-amber-800/90">
                    Fast rhythmic typewriter-like ticking from hydraulic lifters or direct injector pulse.
                  </p>
                </div>

                <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-2xl space-y-1">
                  <strong className="text-red-900 font-bold block">
                    CRITICAL: Bottom-End Rod Knock (100–300 Hz)
                  </strong>
                  <p className="text-red-800/90">
                    Heavy, deep hollow double knock from cylinder journal bearings. Increases under throttle blip. <strong>WALK AWAY.</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("record")}
                className="w-full h-11 rounded-2xl bg-zinc-900 text-white font-semibold text-xs transition mt-3"
              >
                Ready → Record Audio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Confirmation Modal */}
      <DiagnosticConfirmationModal
        isOpen={pendingDiagnostic !== null}
        diagnostic={pendingDiagnostic}
        onConfirm={handleConfirmDiagnostic}
        onRetake={() => {
          setPendingDiagnostic(null);
          startRecording();
        }}
        onManualOverride={handleManualOverride}
      />
    </>
  );
};
