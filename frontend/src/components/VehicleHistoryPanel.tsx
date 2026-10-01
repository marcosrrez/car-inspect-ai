"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  Gauge,
  X,
  AlertTriangle,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import {
  HistoryReportProvider,
  PendingPriority,
} from "../types/inspection";

const PROVIDER_LABEL: Record<HistoryReportProvider, string> = {
  carfax: "Carfax",
  autocheck: "AutoCheck",
  other: "Report",
};

const PRIORITY_STYLE: Record<PendingPriority, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export const VehicleHistoryPanel: React.FC = () => {
  const {
    vehicle,
    getHistoryReports,
    addHistoryReport,
    deleteHistoryReport,
    getPendingItems,
    addPendingItem,
    togglePendingItem,
    deletePendingItem,
  } = useInspectionStore();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [ownershipOpen, setOwnershipOpen] = useState(false);

  // Report form
  const [rProvider, setRProvider] = useState<HistoryReportProvider>("carfax");
  const [rDate, setRDate] = useState("");
  const [rUrl, setRUrl] = useState("");
  const [rOwners, setROwners] = useState("");
  const [rAccidents, setRAccidents] = useState("");
  const [rTitle, setRTitle] = useState("");
  const [rSummary, setRSummary] = useState("");

  // Pending form
  const [pTitle, setPTitle] = useState("");
  const [pPriority, setPPriority] = useState<PendingPriority>("medium");
  const [pCost, setPCost] = useState("");
  const [pNotes, setPNotes] = useState("");

  if (!vehicle) return null;

  const reports = getHistoryReports();
  const pending = getPendingItems();
  const openItems = pending.filter((p) => !p.resolved);
  const ownership = vehicle.ownership_history || [];
  const accidents = vehicle.accident_history || [];

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    addHistoryReport({
      provider: rProvider,
      report_date: rDate || undefined,
      url: rUrl.trim() || undefined,
      owners_reported: rOwners ? parseInt(rOwners) : undefined,
      accidents_reported: rAccidents ? parseInt(rAccidents) : undefined,
      title_brand: rTitle.trim() || undefined,
      summary: rSummary.trim() || undefined,
    });
    setRProvider("carfax");
    setRDate("");
    setRUrl("");
    setROwners("");
    setRAccidents("");
    setRTitle("");
    setRSummary("");
    setReportModalOpen(false);
  };

  const submitPending = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim()) return;
    addPendingItem({
      title: pTitle.trim(),
      priority: pPriority,
      estimated_cost_usd: pCost ? parseInt(pCost) : undefined,
      notes: pNotes.trim() || undefined,
    });
    setPTitle("");
    setPPriority("medium");
    setPCost("");
    setPNotes("");
    setPendingModalOpen(false);
  };

  const intelRows = [
    vehicle.owner_name && { icon: User, label: vehicle.owner_name },
    vehicle.location && { icon: MapPin, label: vehicle.location },
    vehicle.engine && { icon: Gauge, label: vehicle.engine },
  ].filter(Boolean) as { icon: typeof User; label: string }[];

  return (
    <div className="space-y-4">
      {/* Vehicle Intelligence Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
              Vehicle Intelligence
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              {vehicle.trim ? (
                <span className="text-zinc-400 font-medium"> · {vehicle.trim}</span>
              ) : null}
            </h3>
            {vehicle.vin && (
              <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                VIN {vehicle.vin}
              </div>
            )}
          </div>
          {accidents.length > 0 ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldAlert className="w-3 h-3" />
              {accidents.length} on record
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              No accidents
            </span>
          )}
        </div>

        {(intelRows.length > 0 || vehicle.ownership_count != null) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-zinc-600">
            {intelRows.map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <r.icon className="w-3.5 h-3.5 text-zinc-400" />
                {r.label}
              </span>
            ))}
            {vehicle.ownership_count != null && (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                {vehicle.ownership_count} prior owner
                {vehicle.ownership_count === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}

        {vehicle.notes && (
          <div className="mt-3 p-3 rounded-2xl bg-orange-50/50 border border-orange-200/50 text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
            {vehicle.notes}
          </div>
        )}

        {(ownership.length > 0 || accidents.length > 0) && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <button
              onClick={() => setOwnershipOpen(!ownershipOpen)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 transition"
            >
              <span>
                {ownershipOpen ? "Hide" : "View"} ownership & accident history
              </span>
              {ownershipOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {ownershipOpen && (
              <div className="mt-3 space-y-3 text-xs">
                {ownership.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60"
                  >
                    <div className="font-semibold text-zinc-800">{o.label}</div>
                    <div className="text-zinc-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      {o.location && <span>📍 {o.location}</span>}
                      {o.annual_miles != null && (
                        <span>{o.annual_miles.toLocaleString()} mi/yr</span>
                      )}
                    </div>
                    {o.usage_notes && (
                      <p className="text-zinc-600 mt-1">{o.usage_notes}</p>
                    )}
                  </div>
                ))}
                {accidents.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {a.date ? `${a.date} — ` : ""}Reported damage
                    </div>
                    <p className="text-amber-900/80 mt-1">{a.description}</p>
                    <div className="text-amber-700/70 mt-1 flex flex-wrap gap-x-3">
                      {a.damage_location && <span>Area: {a.damage_location}</span>}
                      {a.airbags_deployed != null && (
                        <span>
                          Airbags: {a.airbags_deployed ? "deployed" : "not deployed"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vehicle History Reports (Carfax / AutoCheck) */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <FileText className="w-4 h-4 text-orange-500" />
            <span>History Reports</span>
            {reports.length > 0 && (
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
                {reports.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setReportModalOpen(true)}
            className="h-8 px-3 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add report</span>
          </button>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-zinc-400 leading-relaxed">
            Attach a Carfax or AutoCheck report to keep ownership, title, and
            accident history on file for this vehicle.
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900">
                        {PROVIDER_LABEL[r.provider]}
                      </span>
                      {r.title_brand && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.title_brand} title
                        </span>
                      )}
                      {r.report_date && (
                        <span className="text-[11px] text-zinc-400">{r.report_date}</span>
                      )}
                    </div>
                    <div className="text-zinc-500 mt-0.5 flex flex-wrap gap-x-3">
                      {r.owners_reported != null && (
                        <span>{r.owners_reported} owners</span>
                      )}
                      {r.accidents_reported != null && (
                        <span>{r.accidents_reported} accidents</span>
                      )}
                    </div>
                    {r.summary && <p className="text-zinc-600 mt-1">{r.summary}</p>}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold mt-1"
                      >
                        <span>Open report</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHistoryReport(r.id)}
                    className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 transition"
                    aria-label="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Items / Deficiencies */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Pending & Deficiencies</span>
            {openItems.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {openItems.length} open
              </span>
            )}
          </div>
          <button
            onClick={() => setPendingModalOpen(true)}
            className="h-8 px-3 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add item</span>
          </button>
        </div>

        {pending.length === 0 ? (
          <p className="text-xs text-zinc-400 leading-relaxed">
            Track outstanding repairs, deficiencies, and recommended work. Check
            them off as you complete them.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  p.resolved
                    ? "bg-zinc-50 border-zinc-200/60 opacity-60"
                    : "bg-white border-zinc-200/80"
                }`}
              >
                <button
                  onClick={() => togglePendingItem(p.id)}
                  className="mt-0.5 shrink-0 text-zinc-400 hover:text-emerald-600 transition"
                  aria-label={p.resolved ? "Mark not done" : "Mark done"}
                >
                  {p.resolved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-semibold text-zinc-900 ${
                        p.resolved ? "line-through text-zinc-400" : ""
                      }`}
                    >
                      {p.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLE[p.priority]}`}
                    >
                      {p.priority}
                    </span>
                    {p.estimated_cost_usd != null && (
                      <span className="text-[11px] font-semibold text-zinc-500">
                        ~${p.estimated_cost_usd.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {p.notes && <p className="text-zinc-500 mt-0.5">{p.notes}</p>}
                </div>
                <button
                  onClick={() => deletePendingItem(p.id)}
                  className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 transition"
                  aria-label="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="text-base font-bold text-zinc-900">Add History Report</h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Provider</label>
                  <select
                    value={rProvider}
                    onChange={(e) => setRProvider(e.target.value as HistoryReportProvider)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="carfax">Carfax</option>
                    <option value="autocheck">AutoCheck</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Report date</label>
                  <input
                    type="date"
                    value={rDate}
                    onChange={(e) => setRDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Owners reported</label>
                  <input
                    type="number"
                    value={rOwners}
                    onChange={(e) => setROwners(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Accidents reported</label>
                  <input
                    type="number"
                    value={rAccidents}
                    onChange={(e) => setRAccidents(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Title brand</label>
                <input
                  type="text"
                  value={rTitle}
                  placeholder="e.g. Clean"
                  onChange={(e) => setRTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Report link (optional)</label>
                <input
                  type="url"
                  value={rUrl}
                  placeholder="https://..."
                  onChange={(e) => setRUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Summary / notes</label>
                <textarea
                  value={rSummary}
                  rows={2}
                  placeholder="Key findings from the report..."
                  onChange={(e) => setRSummary(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-bold text-xs shadow-sm transition"
              >
                Save Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Pending Item Modal */}
      {pendingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="text-base font-bold text-zinc-900">Add Pending Item</h3>
              <button
                onClick={() => setPendingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitPending} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">What needs doing?</label>
                <input
                  type="text"
                  value={pTitle}
                  placeholder="e.g. Valve adjustment (overdue)"
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Priority</label>
                  <select
                    value={pPriority}
                    onChange={(e) => setPPriority(e.target.value as PendingPriority)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Est. cost ($)</label>
                  <input
                    type="number"
                    value={pCost}
                    onChange={(e) => setPCost(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Notes</label>
                <textarea
                  value={pNotes}
                  rows={2}
                  onChange={(e) => setPNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-bold text-xs shadow-sm transition"
              >
                Add Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
