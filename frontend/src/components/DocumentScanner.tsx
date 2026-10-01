"use client";

import React, { useRef, useState } from "react";
import {
  Sparkles,
  Upload,
  X,
  RefreshCw,
  Check,
  FileText,
  Wrench,
  AlertTriangle,
  Car,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { ingestDocument } from "../utils/apiClient";
import { DocumentExtraction } from "../types/inspection";

type Phase = "idle" | "uploading" | "review" | "done";

interface Props {
  variant?: "primary" | "subtle";
  label?: string;
}

export const DocumentScanner: React.FC<Props> = ({
  variant = "primary",
  label = "Scan a document",
}) => {
  const { vehicle, applyExtraction } = useInspectionStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [ex, setEx] = useState<DocumentExtraction | null>(null);

  // selections
  const [svcSel, setSvcSel] = useState<boolean[]>([]);
  const [pendSel, setPendSel] = useState<boolean[]>([]);
  const [includeReport, setIncludeReport] = useState(true);
  const [applyVehicle, setApplyVehicle] = useState(true);

  const reset = () => {
    setPhase("idle");
    setError(null);
    setEx(null);
    setSvcSel([]);
    setPendSel([]);
  };

  const openModal = () => {
    reset();
    setOpen(true);
  };
  const closeModal = () => {
    setOpen(false);
    reset();
  };

  const handleFile = async (file: File) => {
    setPhase("uploading");
    setError(null);
    try {
      const result = await ingestDocument(file, vehicle);
      setEx(result);
      setSvcSel((result.service_records || []).map(() => true));
      setPendSel((result.pending_items || []).map(() => true));
      setIncludeReport(!!result.history_report);
      setApplyVehicle(true);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
      setPhase("idle");
    }
  };

  const handleConfirm = () => {
    if (!ex) return;
    const filtered: DocumentExtraction = {
      ...ex,
      service_records: (ex.service_records || []).filter((_, i) => svcSel[i]),
      pending_items: (ex.pending_items || []).filter((_, i) => pendSel[i]),
      history_report: includeReport ? ex.history_report : null,
    };
    const res = applyExtraction(filtered, { applyVehicleFields: applyVehicle });
    if (!res.ok) {
      setError(res.error || "Could not apply.");
      return;
    }
    setPhase("done");
    setTimeout(closeModal, 1200);
  };

  const triggerClass =
    variant === "primary"
      ? "h-12 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
      : "h-9 px-3.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition flex items-center gap-1.5";

  return (
    <>
      <button onClick={openModal} className={triggerClass}>
        <Sparkles className={variant === "primary" ? "w-4 h-4" : "w-3.5 h-3.5"} />
        <span>{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    AI Document Scan
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {phase === "review" ? "Review & confirm" : "Upload a document"}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) handleFile(f);
              }}
            />

            {/* IDLE */}
            {phase === "idle" && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Upload a <strong>Carfax</strong> or <strong>AutoCheck</strong> PDF, or a
                  photo of a <strong>shop invoice</strong>. The assistant reads it and sorts
                  everything into the right place — completed work into your service log,
                  recommendations into pending items, and vehicle details onto the profile.
                  You review before anything is saved.
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-24 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-orange-400 hover:bg-orange-50/40 text-zinc-500 hover:text-orange-700 transition flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-semibold">Choose PDF or photo</span>
                </button>
                {error && (
                  <div className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-200/70 rounded-lg p-2.5">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* UPLOADING */}
            {phase === "uploading" && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <RefreshCw className="w-7 h-7 animate-spin text-orange-500" />
                <span className="text-xs font-medium">Reading the document with AI…</span>
              </div>
            )}

            {/* DONE */}
            {phase === "done" && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-emerald-600">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Added to your garage</span>
              </div>
            )}

            {/* REVIEW */}
            {phase === "review" && ex && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs text-zinc-600">
                  <span className="font-bold text-zinc-900">{ex.document_type}</span>
                  {ex.summary ? ` — ${ex.summary}` : ""}
                </div>

                {/* Vehicle fields */}
                {ex.vehicle && Object.keys(ex.vehicle).length > 0 && (
                  <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-zinc-200/80 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyVehicle}
                      onChange={(e) => setApplyVehicle(e.target.checked)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <span className="min-w-0">
                      <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-orange-500" />
                        {vehicle ? "Update vehicle details" : "Create this vehicle"}
                      </span>
                      <span className="text-zinc-500 block mt-0.5">
                        {[
                          ex.vehicle.year,
                          ex.vehicle.make,
                          ex.vehicle.model,
                          ex.vehicle.trim,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        {ex.vehicle.mileage
                          ? ` · ${ex.vehicle.mileage.toLocaleString()} mi`
                          : ""}
                        {ex.vehicle.vin ? ` · VIN ${ex.vehicle.vin}` : ""}
                      </span>
                    </span>
                  </label>
                )}

                {/* Service records */}
                {ex.service_records?.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-zinc-400" /> Completed work →
                      service log
                    </div>
                    <div className="space-y-1.5">
                      {ex.service_records.map((r, i) => (
                        <label
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl border border-zinc-200/70 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={svcSel[i] ?? true}
                            onChange={(e) =>
                              setSvcSel((s) =>
                                s.map((v, j) => (j === i ? e.target.checked : v))
                              )
                            }
                            className="mt-0.5 accent-orange-500"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-semibold text-zinc-800">{r.title}</span>
                            <span className="text-zinc-500 block">
                              {[
                                r.date,
                                r.mileage ? `${r.mileage.toLocaleString()} mi` : null,
                                r.cost_usd != null ? `$${r.cost_usd}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending items */}
                {ex.pending_items?.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" /> Recommendations →
                      pending items
                    </div>
                    <div className="space-y-1.5">
                      {ex.pending_items.map((p, i) => (
                        <label
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl border border-zinc-200/70 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={pendSel[i] ?? true}
                            onChange={(e) =>
                              setPendSel((s) =>
                                s.map((v, j) => (j === i ? e.target.checked : v))
                              )
                            }
                            className="mt-0.5 accent-orange-500"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-semibold text-zinc-800">{p.title}</span>
                            <span className="text-zinc-500 block">
                              {[
                                p.priority,
                                p.estimated_cost_usd != null
                                  ? `~$${p.estimated_cost_usd}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* History report */}
                {ex.history_report && (
                  <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-zinc-200/80 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeReport}
                      onChange={(e) => setIncludeReport(e.target.checked)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <span className="min-w-0">
                      <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-orange-500" />
                        Add history report
                      </span>
                      <span className="text-zinc-500 block mt-0.5">
                        {ex.history_report.summary ||
                          ex.history_report.provider ||
                          "Vehicle history"}
                      </span>
                    </span>
                  </label>
                )}

                {ex.warnings && ex.warnings.length > 0 && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/70 rounded-lg p-2.5 space-y-1">
                    {ex.warnings.map((w, i) => (
                      <div key={i}>⚠ {w}</div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-200/70 rounded-lg p-2.5">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={closeModal}
                    className="flex-1 h-11 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Add to garage
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
