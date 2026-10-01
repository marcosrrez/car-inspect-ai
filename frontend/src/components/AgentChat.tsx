"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Check, RefreshCw } from "lucide-react";
import { useInspectionStore } from "../store/useInspectionStore";
import { isWriteTool } from "../lib/agentTools";

// A staged (unconfirmed) write the user applies with one tap.
interface StagedAction {
  id: string;
  kind: string;
  summary: string;
  applied: boolean;
  data: Record<string, unknown>;
}

interface DisplayMsg {
  role: "user" | "assistant";
  text: string;
  staged?: StagedAction[];
}

// Loose content-block shape (mirrors Anthropic message blocks we care about).
interface Block {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

const uid = () => `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const AgentChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<DisplayMsg[]>([
    {
      role: "assistant",
      text:
        "Hi! I'm your garage assistant. Tell me what you did to the car, ask what's overdue, add a vehicle, or anything else — I'll handle it.",
    },
  ]);
  // Raw conversation sent to the model (text + tool_use/tool_result blocks).
  const apiMsgs = useRef<Array<{ role: string; content: unknown }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const buildContext = (): string => {
    const s = useInspectionStore.getState();
    const v = s.vehicle;
    return JSON.stringify({
      active_vehicle: v
        ? `${v.year} ${v.make} ${v.model} ${v.trim || ""} — ${(v.mileage || 0).toLocaleString()} mi${
            v.vin ? ` — VIN ${v.vin}` : ""
          }`
        : null,
      vehicles: s.garageVehicles.map((x) => `${x.year} ${x.make} ${x.model}`),
      open_pending: s.getPendingItems().filter((p) => !p.resolved).map((p) => p.title),
      service_count: s.getServiceHistory().length,
      report_count: s.getHistoryReports().length,
      hunt_count: s.savedHuntSnapshots.length,
    });
  };

  const runRead = (name: string): unknown => {
    const s = useInspectionStore.getState();
    switch (name) {
      case "list_pending":
        return s.getPendingItems().map((p) => ({
          title: p.title,
          priority: p.priority,
          resolved: p.resolved,
          estimated_cost_usd: p.estimated_cost_usd,
        }));
      case "list_service":
        return s.getServiceHistory().map((r) => ({
          title: r.title,
          date: r.date,
          mileage: r.mileage,
          cost_usd: r.cost_usd,
        }));
      case "list_hunt":
        return s.savedHuntSnapshots.map((h) => ({
          vehicle: `${h.vehicle.year} ${h.vehicle.make} ${h.vehicle.model}`,
          verdict: h.verdict,
          recommended_offer_usd: h.recommended_offer_usd,
        }));
      case "get_overview":
      default:
        return JSON.parse(buildContext());
    }
  };

  const toStaged = (name: string, input: Record<string, unknown>): StagedAction | null => {
    if (name === "complete_pending_item") {
      const q = String(input.query || "").toLowerCase();
      const openItems = useInspectionStore
        .getState()
        .getPendingItems()
        .filter((p) => !p.resolved);
      const match =
        openItems.find((p) => p.title.toLowerCase().includes(q)) ||
        openItems.find((p) => q.includes(p.title.toLowerCase().slice(0, 8)));
      if (!match) return null;
      return {
        id: uid(),
        kind: name,
        summary: `Mark done: ${match.title}`,
        applied: false,
        data: { itemId: match.id, title: match.title },
      };
    }
    const summaries: Record<string, string> = {
      add_service_record: `Log service: ${input.title}`,
      add_pending_item: `Add pending: ${input.title}`,
      update_vehicle: "Update vehicle details",
      add_history_report: `Add ${input.provider || "history"} report`,
      add_vehicle: `Add ${[input.year, input.make, input.model].filter(Boolean).join(" ")}`,
    };
    return { id: uid(), kind: name, summary: summaries[name] || name, applied: false, data: input };
  };

  const applyAction = (a: StagedAction) => {
    const s = useInspectionStore.getState();
    const d = a.data;
    const today = new Date().toISOString().slice(0, 10);
    switch (a.kind) {
      case "add_service_record":
        s.addServiceRecord({
          task_id: (d.task_id as string) || "general_service",
          title: d.title as string,
          date: (d.date as string) || today,
          mileage: (d.mileage as number) ?? (s.vehicle?.mileage || 0),
          cost_usd: (d.cost_usd as number) ?? 0,
          performed_by: (d.performed_by as "diy" | "professional") || "professional",
          parts_brand: d.parts_brand as string | undefined,
          notes: d.notes as string | undefined,
        });
        break;
      case "add_pending_item":
        s.addPendingItem({
          title: d.title as string,
          priority: (d.priority as "high" | "medium" | "low") || "medium",
          estimated_cost_usd: d.estimated_cost_usd as number | undefined,
          notes: d.notes as string | undefined,
        });
        break;
      case "complete_pending_item":
        s.togglePendingItem(d.itemId as string);
        break;
      case "update_vehicle":
        s.updateVehicle(d);
        break;
      case "add_history_report":
        s.addHistoryReport({
          provider: (d.provider as "carfax" | "autocheck" | "other") || "other",
          report_date: d.report_date as string | undefined,
          owners_reported: d.owners_reported as number | undefined,
          accidents_reported: d.accidents_reported as number | undefined,
          title_brand: d.title_brand as string | undefined,
          summary: d.summary as string | undefined,
          url: d.url as string | undefined,
        });
        break;
      case "add_vehicle":
        s.addVehicleToGarage({
          year: (d.year as number) || new Date().getFullYear(),
          make: d.make as string,
          model: d.model as string,
          trim: (d.trim as string) || "",
          mileage: (d.mileage as number) || 0,
          asking_price: 0,
          vin: (d.vin as string) || "",
          is_turbocharged: false,
          engine: d.engine as string | undefined,
        });
        break;
    }
    setMsgs((prev) =>
      prev.map((m) =>
        m.staged
          ? { ...m, staged: m.staged.map((x) => (x.id === a.id ? { ...x, applied: true } : x)) }
          : m
      )
    );
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((p) => [...p, { role: "user", text }]);
    apiMsgs.current.push({ role: "user", content: text });
    setBusy(true);
    try {
      for (let i = 0; i < 5; i++) {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMsgs.current, context: buildContext() }),
        });
        if (!res.ok) {
          let msg = `Assistant error (${res.status}).`;
          try {
            const b = await res.json();
            if (b?.error) msg = b.error;
          } catch {
            /* ignore */
          }
          setMsgs((p) => [...p, { role: "assistant", text: msg }]);
          break;
        }
        const data = await res.json();
        const content: Block[] = data.content || [];
        apiMsgs.current.push({ role: "assistant", content });

        const text2 = content
          .filter((b) => b.type === "text")
          .map((b) => b.text || "")
          .join("\n")
          .trim();

        const staged: StagedAction[] = [];
        const toolResults: Array<Record<string, unknown>> = [];
        for (const b of content) {
          if (b.type !== "tool_use" || !b.name) continue;
          if (isWriteTool(b.name)) {
            const a = toStaged(b.name, b.input || {});
            if (a) {
              staged.push(a);
              toolResults.push({
                type: "tool_result",
                tool_use_id: b.id,
                content: JSON.stringify({ status: "staged", summary: a.summary }),
              });
            } else {
              toolResults.push({
                type: "tool_result",
                tool_use_id: b.id,
                content: JSON.stringify({ status: "not_found" }),
              });
            }
          } else {
            toolResults.push({
              type: "tool_result",
              tool_use_id: b.id,
              content: JSON.stringify(runRead(b.name)),
            });
          }
        }

        if (text2 || staged.length) {
          setMsgs((p) => [
            ...p,
            { role: "assistant", text: text2, staged: staged.length ? staged : undefined },
          ]);
        }

        if (data.stop_reason === "tool_use" && toolResults.length) {
          apiMsgs.current.push({ role: "user", content: toolResults });
          continue;
        }
        break;
      }
    } catch (err) {
      setMsgs((p) => [
        ...p,
        { role: "assistant", text: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition"
          aria-label="Open assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-5 sm:right-5 z-[60] w-full sm:w-[400px] h-[80vh] sm:h-[600px] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl border border-zinc-200/80 flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 leading-none">Assistant</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Reads & updates your garage</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%] space-y-2">
                  {m.text && (
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-zinc-900 text-white rounded-br-md"
                          : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </div>
                  )}
                  {m.staged?.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-2xl border border-orange-200/70 bg-orange-50/60 text-xs"
                    >
                      <span className="font-semibold text-zinc-800 min-w-0 truncate">{a.summary}</span>
                      {a.applied ? (
                        <span className="shrink-0 inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => applyAction(a)}
                          className="shrink-0 h-7 px-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center gap-2 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-100 shrink-0 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message your assistant…"
              className="flex-1 h-11 px-3.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="h-11 w-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
