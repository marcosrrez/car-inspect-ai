"use client";

import React, { useState, useRef } from "react";
import {
  Mic,
  Square,
  X,
  RefreshCw,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { diagnoseAudio, fetchSampleAudioBlob } from "../utils/apiClient";

export const AudioRecorderModal: React.FC = () => {
  const {
    audioModalOpen,
    activeCaptureItemId,
    closeAudioModal,
    updateItemResult,
    openWalkAwayModal,
    getAllItems,
  } = useInspectionStore();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg("Microphone access denied. Please allow microphone permissions or test a sample below.");
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

      updateItemResult(item.id, {
        finding_category: diagResult.primary_condition,
        points: diagResult.points,
        is_walk_condition: diagResult.is_walk_condition,
        explanation: diagResult.explanation,
        negotiation_tip: diagResult.negotiation_tip,
        confidence: diagResult.confidence,
        audio_result: diagResult,
      });

      closeAudioModal();

      if (diagResult.is_walk_condition) {
        openWalkAwayModal(
          `${item.title} — ${diagResult.primary_condition}`,
          diagResult.explanation
        );
      }
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase">
              Acoustic Spectrogram Transformer
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

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Live Audio Visualizer / Timer */}
        <div className="my-6 bg-zinc-900 rounded-2xl p-6 text-white text-center flex flex-col items-center justify-center">
          <div className="text-xs text-zinc-400 font-medium mb-1">
            {isRecording ? "Listening to engine acoustics..." : "Ready to record 5-second sample"}
          </div>
          <div className="text-3xl font-mono font-bold text-orange-400">
            00:0{isRecording ? recordingTime : "0"} / 00:05
          </div>

          {/* Waveform bars */}
          {isRecording && (
            <div className="flex items-center gap-1.5 mt-4 h-8">
              {[40, 75, 95, 60, 85, 50, 90, 70, 45, 80, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-orange-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="space-y-3">
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
        </div>

        {/* Test / Demo Acoustic Presets */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Or test with calibrated engine audio:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: "healthy_idle", name: "Healthy Idle", pts: "+2", walk: false },
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
                  className={`text-[10px] font-semibold ${
                    p.walk ? "text-red-600" : "text-zinc-500"
                  }`}
                >
                  {p.walk ? "Walk Away" : p.pts}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
