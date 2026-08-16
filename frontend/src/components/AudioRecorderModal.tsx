"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Volume2,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  Activity,
  Play,
  CheckCircle2,
} from "lucide-react";
import { ChecklistItem } from "../types/inspection";
import { diagnoseAudio, fetchSampleAudioBlob } from "../utils/apiClient";
import { useInspectionStore } from "../store/useInspectionStore";

interface AudioRecorderModalProps {
  item: ChecklistItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const { recordAudioResult } = useInspectionStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [contextHint, setContextHint] = useState<"idling" | "revving">("idling");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (item) {
      setContextHint(item.id.includes("rev") ? "revving" : "idling");
    }
  }, [item]);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      cleanUpMedia();
      setAudioBlob(null);
      setAudioUrl(null);
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen]);

  const cleanUpMedia = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      setAudioBlob(null);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Audio Context for Live Waveform Visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start Visualizer Loop
      drawWaveform();

      // MediaRecorder Setup
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        cleanUpMedia();
        await processAudio(blob);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordDuration(0);

      // 5-second countdown timer
      let seconds = 0;
      timerIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordDuration(seconds);
        if (seconds >= 5) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Microphone access denied or unavailable.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgb(15, 23, 42)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#f97316";
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    render();
  };

  const processAudio = async (blob: Blob, presetFault?: string) => {
    if (!item) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await diagnoseAudio(blob, contextHint, presetFault);
      recordAudioResult(item.id, result);
      onClose();
    } catch (err: any) {
      console.error("Audio diagnosis error:", err);
      setErrorMsg(`Audio AST inference failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPreset = async (presetId: string, faultName: string) => {
    if (!item) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const sampleBlob = await fetchSampleAudioBlob(presetId);
      await processAudio(sampleBlob, faultName);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch sample audio.");
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
            <div className="text-[11px] font-semibold tracking-wider text-orange-400 uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Audio Spectrogram Transformer (AST)</span>
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
          {/* Instructions */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-orange-400" />
              <span>Acoustic Scan Procedure:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{item.instruction}</p>

            {/* Context Selector */}
            <div className="pt-2 border-t border-slate-850 flex items-center gap-2">
              <span className="text-slate-400 font-medium">Acoustic Mode:</span>
              <button
                onClick={() => setContextHint("idling")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                  contextHint === "idling"
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                Idling (750 RPM)
              </button>
              <button
                onClick={() => setContextHint("revving")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                  contextHint === "revving"
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                Rev / Decel (2,500 RPM)
              </button>
            </div>
          </div>

          {/* Waveform Visualizer Canvas */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-32 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={500}
              height={128}
              className="w-full h-full object-cover"
            />

            {!isRecording && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 pointer-events-none">
                <Volume2 className="w-6 h-6 text-slate-500 mb-1" />
                <span className="text-xs text-slate-400">Microphone standby</span>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>REC 0:0{recordDuration} / 0:05</span>
              </div>
            )}
          </div>

          {/* Record / Stop Button */}
          <div className="flex justify-center">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop & Evaluate AST</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={loading}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 transition"
              >
                <Mic className="w-4 h-4" />
                <span>Record 5-Second Engine Audio</span>
              </button>
            )}
          </div>

          {/* Loading status */}
          {loading && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center gap-3 text-orange-400 text-xs font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transforming audio to Mel-Spectrogram & AST 19-Class inference...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1-Click Acoustic Test Presets */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Audio Test Presets (Instant Fault Simulation):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                disabled={loading}
                onClick={() => handleTestPreset("healthy_idle", "Healthy Engine Idle")}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left text-xs transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-emerald-400 font-semibold">Healthy Engine Idle</div>
                  <div className="text-[10px] text-slate-400">Smooth 750 RPM harmonic cycle</div>
                </div>
                <span className="font-mono text-[10px] font-bold text-emerald-400">+3 pts</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleTestPreset("rod_knock", "Rod Knock")}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left text-xs transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-red-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Rod Knock (Fatal)
                  </div>
                  <div className="text-[10px] text-slate-400">Heavy double-tap journal knock</div>
                </div>
                <span className="font-mono text-[10px] font-bold text-red-400">WALK</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleTestPreset("lifter_tick", "Lifter / Tappet Tick")}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left text-xs transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-amber-400 font-semibold">Valvetrain Lifter Tick</div>
                  <div className="text-[10px] text-slate-400">Half-speed clicking in head</div>
                </div>
                <span className="font-mono text-[10px] font-bold text-amber-400">-2 pts</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleTestPreset("belt_squeal", "Serpentine Belt Squeal")}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left text-xs transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-amber-400 font-semibold">Serpentine Belt Squeal</div>
                  <div className="text-[10px] text-slate-400">2.2 kHz pulley chirp</div>
                </div>
                <span className="font-mono text-[10px] font-bold text-amber-400">-2 pts</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
