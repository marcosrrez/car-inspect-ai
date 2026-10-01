"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ArrowUp,
  ArrowLeft,
  Plus,
  Mic,
  Check,
  SquarePen,
  FileText,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useInspectionStore } from "../store/useInspectionStore";
import { isWriteTool } from "../lib/agentTools";
import { compressImage } from "../utils/imageCompression";

interface StagedAction {
  id: string;
  kind: string;
  summary: string;
  applied: boolean;
  data: Record<string, unknown>;
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// Turn an attached file into a Claude content block (document for PDFs, image otherwise).
async function fileToBlock(file: File): Promise<Block> {
  if (file.type === "application/pdf") {
    const buf = await file.arrayBuffer();
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: bufToBase64(buf) },
    } as unknown as Block;
  }
  const comp = await compressImage(file, 1600, 1600, 0.8);
  const buf = await comp.file.arrayBuffer();
  const mt = comp.file.type || "image/jpeg";
  return {
    type: "image",
    source: { type: "base64", media_type: mt, data: bufToBase64(buf) },
  } as unknown as Block;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  attachment?: string;
  staged?: StagedAction[];
}

interface Block {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

const uid = () => `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const GREETING =
  "Hi — I'm your garage assistant. Tell me what you did to the car, drop in a Carfax or invoice, ask what's overdue, or add a vehicle. I'll take care of the filing.";

export const AgentChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: uid(), role: "assistant", text: GREETING },
  ]);

  const apiMsgs = useRef<Array<{ role: string; content: unknown }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Optional voice-to-text (Web Speech API), only where supported.
  const [micSupported, setMicSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => never;
      webkitSpeechRecognition?: new () => never;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    setMicSupported(true);
    const rec = new (SR as unknown as { new (): {
      lang: string;
      interimResults: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    } })();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join(" ");
      setInput((prev) => (prev ? prev + " " : "") + t);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // auto-grow textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const patchMsg = (id: string, patch: Partial<Msg> | ((m: Msg) => Partial<Msg>)) =>
    setMsgs((p) =>
      p.map((m) => (m.id === id ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m))
    );

  const newChat = () => {
    apiMsgs.current = [];
    setMsgs([{ id: uid(), role: "assistant", text: GREETING }]);
  };

  // ---- store-backed tool execution ----
  const buildContext = (): string => {
    const s = useInspectionStore.getState();
    const v = s.vehicle;
    return JSON.stringify({
      active_vehicle: v
        ? `${v.year} ${v.make} ${v.model} ${v.trim || ""} — ${(v.mileage || 0).toLocaleString()} mi`
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
      default:
        return JSON.parse(buildContext());
    }
  };

  const toStaged = (name: string, input: Record<string, unknown>): StagedAction | null => {
    if (name === "complete_pending_item") {
      const q = String(input.query || "").toLowerCase();
      const openItems = useInspectionStore.getState().getPendingItems().filter((p) => !p.resolved);
      const match =
        openItems.find((p) => p.title.toLowerCase().includes(q)) ||
        openItems.find((p) => q.includes(p.title.toLowerCase().slice(0, 8)));
      if (!match) return null;
      return { id: uid(), kind: name, summary: `Mark done: ${match.title}`, applied: false, data: { itemId: match.id } };
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

  const applyAction = (msgId: string, a: StagedAction) => {
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
    patchMsg(msgId, (m) => ({
      staged: m.staged?.map((x) => (x.id === a.id ? { ...x, applied: true } : x)),
    }));
  };

  // ---- one streamed (or mock-JSON) model turn ----
  const streamTurn = async (
    liveId: string
  ): Promise<{ content: Block[]; stop_reason: string }> => {
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
      throw new Error(msg);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/event-stream") || !res.body) {
      const data = await res.json(); // mock path
      if (data.error) throw new Error(data.error);
      const text = (data.content || [])
        .filter((b: Block) => b.type === "text")
        .map((b: Block) => b.text)
        .join("\n");
      if (text) patchMsg(liveId, { text });
      return { content: data.content || [], stop_reason: data.stop_reason };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let final: { content: Block[]; stop_reason: string } | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let ev = "message";
        let data = "";
        for (const line of chunk.split("\n")) {
          if (line.startsWith("event:")) ev = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        if (!data) continue;
        const parsed = JSON.parse(data);
        if (ev === "delta") {
          patchMsg(liveId, (m) => ({ text: m.text + parsed.text }));
        } else if (ev === "final") {
          final = parsed;
        } else if (ev === "error") {
          throw new Error(parsed.message || "Assistant error.");
        }
      }
    }
    if (!final) throw new Error("No response from assistant.");
    return final;
  };

  // Once an attached file has been sent in a turn, replace its heavy base64 block
  // with a placeholder so it isn't re-uploaded on subsequent tool-loop requests.
  const stripDocBlocks = () => {
    apiMsgs.current = apiMsgs.current.map((m) => {
      if (m.role === "user" && Array.isArray(m.content)) {
        return {
          ...m,
          content: (m.content as Block[]).map((b) =>
            b.type === "image" || b.type === "document"
              ? { type: "text", text: "[attached file read above]" }
              : b
          ),
        };
      }
      return m;
    });
  };

  const runAgent = async () => {
    for (let i = 0; i < 6; i++) {
      const liveId = uid();
      setMsgs((p) => [...p, { id: liveId, role: "assistant", text: "", streaming: true }]);
      let final: { content: Block[]; stop_reason: string };
      try {
        final = await streamTurn(liveId);
      } catch (e) {
        patchMsg(liveId, { streaming: false, text: e instanceof Error ? e.message : "Something went wrong." });
        return;
      }
      const content = final.content || [];
      apiMsgs.current.push({ role: "assistant", content });
      stripDocBlocks(); // doc consumed by the model this turn; don't resend it again

      const staged: StagedAction[] = [];
      const toolResults: Array<Record<string, unknown>> = [];
      for (const b of content) {
        if (b.type !== "tool_use" || !b.name) continue;
        if (isWriteTool(b.name)) {
          const a = toStaged(b.name, b.input || {});
          if (a) {
            staged.push(a);
            toolResults.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify({ status: "staged", summary: a.summary }) });
          } else {
            toolResults.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify({ status: "not_found" }) });
          }
        } else {
          toolResults.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify(runRead(b.name)) });
        }
      }

      patchMsg(liveId, (m) => ({
        streaming: false,
        staged: staged.length ? staged : undefined,
        text: m.text || "",
      }));

      if (final.stop_reason === "tool_use" && toolResults.length) {
        apiMsgs.current.push({ role: "user", content: toolResults });
        continue;
      }
      return;
    }
  };

  const send = async () => {
    if (busy) return;
    const text = input.trim();
    const file = pendingFile;
    if (!text && !file) return;
    setInput("");
    setPendingFile(null);
    setBusy(true);
    try {
      // Show the user's turn (text + any attachment).
      setMsgs((p) => [
        ...p,
        { id: uid(), role: "user", text, attachment: file?.name },
      ]);

      if (file) {
        let block: Block;
        try {
          block = await fileToBlock(file);
        } catch {
          setMsgs((p) => [
            ...p,
            { id: uid(), role: "assistant", text: "I couldn't read that file — try a PDF or a clear photo." },
          ]);
          return;
        }
        // Send the document AND the user's words together, as one turn, so the
        // model reasons over both (reconciling, capturing what the user said).
        const prompt =
          text ||
          "Here's a document for my garage. Read it, reconcile it with everything I've told you, and update my records.";
        apiMsgs.current.push({
          role: "user",
          content: [block, { type: "text", text: prompt }] as unknown,
        });
      } else {
        apiMsgs.current.push({ role: "user", content: text });
      }

      await runAgent();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition"
          aria-label="Open assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] bg-[#1a1a1a] text-zinc-100 flex flex-col sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:h-[680px] sm:max-h-[90vh] sm:rounded-3xl sm:border sm:border-zinc-800 sm:shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b border-zinc-800/80">
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-300 transition"
              aria-label="Close assistant"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center leading-tight">
              <div className="text-sm font-semibold text-zinc-100">Assistant</div>
              <div className="text-[11px] text-zinc-500">car-inspect-ai</div>
            </div>
            <button
              onClick={newChat}
              className="w-9 h-9 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-300 transition"
              aria-label="New chat"
            >
              <SquarePen className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {msgs.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] space-y-1.5">
                    {m.attachment && (
                      <div className="ml-auto w-fit flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                        <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{m.attachment}</span>
                      </div>
                    )}
                    {m.text && (
                      <div className="px-4 py-2.5 rounded-3xl rounded-br-lg bg-zinc-800 text-[15px] leading-relaxed text-zinc-100">
                        {m.text}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-orange-500/90 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      {m.text ? (
                        <div className="agent-prose text-[15px] leading-relaxed text-zinc-100">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                          {m.streaming && <span className="agent-caret" />}
                        </div>
                      ) : (
                        <div className="flex gap-1 pt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                        </div>
                      )}
                    </div>
                  </div>
                  {m.staged && m.staged.length > 0 && (
                    <div className="ml-9 space-y-1.5">
                      {m.staged.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/70 text-sm"
                        >
                          <span className="text-zinc-200 min-w-0 truncate">{a.summary}</span>
                          {a.applied ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <Check className="w-4 h-4" /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => applyAction(m.id, a)}
                              className="shrink-0 h-8 px-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition active:scale-95"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 px-3 pb-4 pt-1">
            {pendingFile && (
              <div className="mb-2 flex items-center gap-2 w-fit max-w-full px-3 py-2 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="truncate max-w-[200px]">{pendingFile.name}</span>
                <button onClick={() => setPendingFile(null)} className="text-zinc-500 hover:text-zinc-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="rounded-[26px] bg-zinc-800/70 border border-zinc-700/60 px-2.5 py-2">
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Message your assistant…"
                className="w-full resize-none bg-transparent px-2 pt-1.5 pb-1 text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) setPendingFile(f);
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-zinc-700/70 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition shrink-0"
                  aria-label="Attach document"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <div className="flex-1" />
                {micSupported && (
                  <button
                    onClick={toggleMic}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
                      listening
                        ? "bg-orange-500/20 text-orange-400"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    aria-label={listening ? "Stop voice input" : "Start voice input"}
                  >
                    <Mic className={`w-5 h-5 ${listening ? "animate-pulse" : ""}`} />
                  </button>
                )}
                <button
                  onClick={send}
                  disabled={busy || (!input.trim() && !pendingFile)}
                  className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition shrink-0 disabled:opacity-40 active:scale-95"
                  aria-label="Send"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
