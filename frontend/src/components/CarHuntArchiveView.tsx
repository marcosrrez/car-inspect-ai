"use client";

import React, { useState } from "react";
import {
  Bookmark,
  Plus,
  Trash2,
  Phone,
  MapPin,
  ExternalLink,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Calendar,
  Send,
  Scale,
  Car,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { SavedInspectionSnapshot } from "../types/inspection";

export const CarHuntArchiveView: React.FC = () => {
  const {
    savedHuntSnapshots,
    saveCurrentInspectionSnapshot,
    addDealNoteToSnapshot,
    deleteSnapshot,
    vehicle,
    getTotalPoints,
    getCompletedCount,
    hasWalkAwayCondition,
    setActiveTab,
  } = useInspectionStore();

  const [activeNoteText, setActiveNoteText] = useState<Record<string, string>>({});
  const [activeNoteAuthor, setActiveNoteAuthor] = useState<Record<string, "buyer" | "seller" | "mechanic">>({});
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [dealershipLocation, setDealershipLocation] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [listingUrl, setListingUrl] = useState("");

  const currentScore = getTotalPoints();
  const currentCompleted = getCompletedCount();
  const currentHasFatal = hasWalkAwayCondition();

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    saveCurrentInspectionSnapshot({
      seller_name: sellerName || "Dealer / Seller",
      dealership_or_location: dealershipLocation || "Local Car Lot",
      phone: sellerPhone,
      listing_url: listingUrl,
    });
    setSaveModalOpen(false);
    setSellerName("");
    setDealershipLocation("");
    setSellerPhone("");
    setListingUrl("");
  };

  const handleAddNote = (snapshotId: string) => {
    const text = activeNoteText[snapshotId]?.trim();
    if (!text) return;
    const author = activeNoteAuthor[snapshotId] || "buyer";
    addDealNoteToSnapshot(snapshotId, text, author);
    setActiveNoteText({ ...activeNoteText, [snapshotId]: "" });
  };

  const totalDeductionsAll = savedHuntSnapshots.reduce(
    (sum, s) => sum + s.total_estimated_repairs_usd,
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner: Car Hunt Command Center */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
              Car Hunt Deal Tracker
            </span>
            <span className="text-xs text-zinc-400">
              {savedHuntSnapshots.length} Cars Inspected & Tracked
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            Saved Inspections & Negotiation Journal
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-lg leading-relaxed">
            Archive every car you inspect across different dealerships, record seller counter-offers, mechanic quotes, and compare options side-by-side.
          </p>
        </div>

        <button
          onClick={() => setSaveModalOpen(true)}
          className="h-11 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white text-xs font-semibold shrink-0 transition flex items-center gap-2 shadow-sm"
        >
          <Bookmark className="w-4 h-4" />
          <span>Save Current Car ({vehicle.model})</span>
        </button>
      </div>

      {/* Side-by-Side Car Hunt Comparison Matrix */}
      {savedHuntSnapshots.length >= 2 && (
        <div className="bg-zinc-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <Scale className="w-4 h-4 text-orange-400" />
              <span>Side-by-Side Car Comparison</span>
            </div>
            <span className="text-[11px] text-zinc-400">
              {savedHuntSnapshots.length} options evaluated
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                  <th className="py-2 pr-3 font-semibold">Vehicle</th>
                  <th className="py-2 px-2 font-semibold">Mileage</th>
                  <th className="py-2 px-2 font-semibold">Asking</th>
                  <th className="py-2 px-2 font-semibold">Deductions</th>
                  <th className="py-2 px-2 font-semibold">Target Offer</th>
                  <th className="py-2 pl-2 font-semibold text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {savedHuntSnapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-2.5 pr-3 font-bold text-zinc-100 truncate max-w-[140px]">
                      {s.vehicle.year} {s.vehicle.make} {s.vehicle.model}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400">
                      {(s.vehicle.mileage || 0).toLocaleString()} mi
                    </td>
                    <td className="py-2.5 px-2 text-zinc-300">
                      ${s.vehicle.asking_price.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-red-400 font-semibold">
                      -${s.total_estimated_repairs_usd.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-emerald-400 font-bold">
                      ${s.recommended_offer_usd.toLocaleString()}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.has_fatal_walk
                            ? "bg-red-950 text-red-400 border border-red-800/60"
                            : s.total_score >= 15
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                            : "bg-amber-950 text-amber-400 border border-amber-800/60"
                        }`}
                      >
                        {s.has_fatal_walk ? "Walk" : s.total_score >= 15 ? "Buy" : "Negotiate"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saved Car Snapshots List */}
      <div className="space-y-4">
        {savedHuntSnapshots.map((snapshot) => {
          const isExpanded = expandedSnapshotId === snapshot.id;
          const noteText = activeNoteText[snapshot.id] || "";
          const noteAuthor = activeNoteAuthor[snapshot.id] || "buyer";

          return (
            <div
              key={snapshot.id}
              className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs transition-all space-y-4"
            >
              {/* Header Row: Vehicle Title & Score Badge */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        snapshot.has_fatal_walk
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : snapshot.total_score >= 15
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {snapshot.verdict}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Inspected on {new Date(snapshot.savedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    {snapshot.vehicle.year} {snapshot.vehicle.make} {snapshot.vehicle.model} {snapshot.vehicle.trim || ""}
                  </h3>

                  {/* Seller / Location Info */}
                  {snapshot.seller_info && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                      {snapshot.seller_info.seller_name && (
                        <span>👤 {snapshot.seller_info.seller_name}</span>
                      )}
                      {snapshot.seller_info.dealership_or_location && (
                        <span>📍 {snapshot.seller_info.dealership_or_location}</span>
                      )}
                      {snapshot.seller_info.phone && (
                        <a
                          href={`tel:${snapshot.seller_info.phone}`}
                          className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{snapshot.seller_info.phone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-zinc-900">
                    {snapshot.total_score > 0 ? `+${snapshot.total_score}` : snapshot.total_score}
                    <span className="text-xs font-normal text-zinc-400 ml-1">pts</span>
                  </div>
                  <button
                    onClick={() => deleteSnapshot(snapshot.id)}
                    className="text-zinc-400 hover:text-red-600 transition p-1 mt-1 inline-block"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Financial Target Box */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-center text-xs">
                <div>
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase">Asking Price</div>
                  <div className="font-bold text-zinc-800 mt-0.5">
                    ${snapshot.vehicle.asking_price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-red-500 font-semibold uppercase">Deductions</div>
                  <div className="font-bold text-red-600 mt-0.5">
                    -${snapshot.total_estimated_repairs_usd.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 font-semibold uppercase">Target Max Offer</div>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    ${snapshot.recommended_offer_usd.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Deal Notes & Negotiation Log */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                    <span>Negotiation Log & Updates ({snapshot.deal_notes.length})</span>
                  </span>
                </div>

                {/* Notes Timeline */}
                <div className="space-y-1.5">
                  {snapshot.deal_notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="font-bold uppercase tracking-wider text-zinc-600">
                          {note.author === "buyer"
                            ? "My Note"
                            : note.author === "seller"
                            ? "Seller Counter"
                            : "Mechanic Advice"}
                        </span>
                        <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed font-medium">
                        "{note.text}"
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Quick Update Note Input */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={noteAuthor}
                    onChange={(e) =>
                      setActiveNoteAuthor({
                        ...activeNoteAuthor,
                        [snapshot.id]: e.target.value as "buyer" | "seller" | "mechanic",
                      })
                    }
                    className="h-10 px-2.5 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="buyer">My Note</option>
                    <option value="seller">Seller Offer</option>
                    <option value="mechanic">Mechanic</option>
                  </select>

                  <input
                    type="text"
                    value={noteText}
                    placeholder="e.g. Seller agreed to drop price to $14,800..."
                    onChange={(e) =>
                      setActiveNoteText({
                        ...activeNoteText,
                        [snapshot.id]: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddNote(snapshot.id);
                    }}
                    className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />

                  <button
                    onClick={() => handleAddNote(snapshot.id)}
                    className="h-10 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* Expandable 20-Point Breakdown Accordion */}
              <div className="pt-2 border-t border-zinc-100">
                <button
                  onClick={() =>
                    setExpandedSnapshotId(isExpanded ? null : snapshot.id)
                  }
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 transition"
                >
                  <span>{isExpanded ? "Hide 20-Point Breakdown" : "View Recorded Checkpoint Findings"}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-3 divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden text-xs bg-zinc-50">
                    {snapshot.items_summary.map((it) => (
                      <div
                        key={it.id}
                        className="p-2.5 sm:px-3.5 flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-zinc-800">
                            {it.title}:
                          </span>{" "}
                          <span className="text-zinc-600">{it.finding_category}</span>
                        </div>
                        <span
                          className={`font-bold shrink-0 ${
                            it.is_walk
                              ? "text-red-600"
                              : it.points < 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {it.is_walk ? "WALK" : `${it.points > 0 ? "+" : ""}${it.points}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Snapshot Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                  Car Hunt Archive
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                  Save Inspection Snapshot
                </h3>
              </div>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveCurrent} className="space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-zinc-700">
                <span className="font-bold text-zinc-900 block mb-0.5">
                  Saving Active Car: {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
                <div className="text-[11px] text-zinc-500">
                  Score: {currentScore > 0 ? `+${currentScore}` : currentScore} pts • {currentCompleted}/20 points inspected
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Salesperson / Private Seller Name
                </label>
                <input
                  type="text"
                  value={sellerName}
                  placeholder="e.g. Mike Sullivan / John Miller"
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Dealership Name or Meet Location
                </label>
                <input
                  type="text"
                  value={dealershipLocation}
                  placeholder="e.g. Metro Toyota Used Lot, 1200 Auto Mall Blvd"
                  onChange={(e) => setDealershipLocation(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={sellerPhone}
                    placeholder="(555) 234-5678"
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Listing URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={listingUrl}
                    placeholder="https://autotrader.com/..."
                    onChange={(e) => setListingUrl(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Save Snapshot to Car Hunt Archive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
