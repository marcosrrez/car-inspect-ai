// Tool catalog for the in-app assistant. Plain JSON-schema objects (no server
// imports) so both the API route and the client can share names/classification.

export const READ_TOOLS = [
  "get_overview",
  "list_pending",
  "list_service",
  "list_hunt",
] as const;

export const WRITE_TOOLS = [
  "add_service_record",
  "complete_pending_item",
  "add_pending_item",
  "update_vehicle",
  "add_history_report",
  "add_vehicle",
] as const;

export type AgentToolName =
  | (typeof READ_TOOLS)[number]
  | (typeof WRITE_TOOLS)[number];

export function isWriteTool(name: string): boolean {
  return (WRITE_TOOLS as readonly string[]).includes(name);
}

interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const AGENT_TOOLS: ToolDef[] = [
  {
    name: "get_overview",
    description:
      "Get a snapshot of the active vehicle plus counts of open pending items, service records, and history reports, and the list of vehicles in the garage. Use for general questions.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_pending",
    description: "List the active vehicle's pending items / deficiencies (open and resolved).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_service",
    description: "List the active vehicle's service/maintenance history records.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_hunt",
    description: "List saved Car Hunt inspection snapshots the user is shopping/comparing.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "add_service_record",
    description:
      "Stage a completed maintenance/service record to add to the active vehicle's log. Use when the user says they did or had work done.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "What was done, e.g. 'Engine oil & filter change'." },
        date: { type: "string", description: "ISO date YYYY-MM-DD. Default today if unstated." },
        mileage: { type: "number" },
        cost_usd: { type: "number" },
        performed_by: { type: "string", enum: ["diy", "professional"] },
        parts_brand: { type: "string" },
        notes: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_pending_item",
    description:
      "Stage marking a pending item / deficiency as done. 'query' is matched against open pending item titles.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text identifying the pending item to complete." },
      },
      required: ["query"],
    },
  },
  {
    name: "add_pending_item",
    description: "Stage a new pending item / deficiency / recommended repair for the active vehicle.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        estimated_cost_usd: { type: "number" },
        notes: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_vehicle",
    description:
      "Stage an update to the active vehicle's details (only include fields that change).",
    input_schema: {
      type: "object",
      properties: {
        mileage: { type: "number" },
        vin: { type: "string" },
        engine: { type: "string" },
        transmission: { type: "string" },
        trim: { type: "string" },
        owner_name: { type: "string" },
        location: { type: "string" },
      },
    },
  },
  {
    name: "add_history_report",
    description: "Stage a vehicle history report (Carfax / AutoCheck / other) for the active vehicle.",
    input_schema: {
      type: "object",
      properties: {
        provider: { type: "string", enum: ["carfax", "autocheck", "other"] },
        report_date: { type: "string" },
        owners_reported: { type: "number" },
        accidents_reported: { type: "number" },
        title_brand: { type: "string" },
        summary: { type: "string" },
        url: { type: "string" },
      },
      required: ["provider"],
    },
  },
  {
    name: "add_vehicle",
    description:
      "Stage adding a NEW vehicle to the garage. Use when the garage is empty or the user wants another vehicle.",
    input_schema: {
      type: "object",
      properties: {
        year: { type: "number" },
        make: { type: "string" },
        model: { type: "string" },
        trim: { type: "string" },
        mileage: { type: "number" },
        vin: { type: "string" },
        engine: { type: "string" },
      },
      required: ["make", "model"],
    },
  },
];

export const AGENT_SYSTEM = `You are the in-app assistant for CarInspect AI, a mobile pre-purchase inspection and
vehicle-maintenance app. You help the user manage ONE garage of vehicles: inspections, service
history, pending repairs/deficiencies, vehicle history reports, and car shopping ("Car Hunt").
Act like a sharp service advisor who knows this owner's car — think, connect the dots, and be
genuinely helpful, not a form filler.

TOOLS
- Read tools (get_overview, list_pending, list_service, list_hunt) fetch the user's real data. Call
  them when you need current state to reason or avoid duplicates — don't guess.
- Write tools STAGE a change the user confirms with an "Apply" button; they do NOT auto-save. After
  staging, tell the user plainly what you prepared.

READ EVERYTHING IN THE TURN, TOGETHER
- The user may type a message AND attach a document (invoice, Carfax, AutoCheck) in the same turn.
  Treat them as ONE situation. Never ignore the typed words in favor of the document or vice versa.
- Extract completed work from BOTH the document and what the user says. If the user says "I installed
  a VCM Tuner II" or "we serviced the transmission twice," those are completed service records too —
  stage them, even if they're not on the document.

RECONCILE — this is what makes you smart, not scripted
- Before staging anything, check current state (list_pending / list_service) so you don't duplicate.
- If a document RECOMMENDS work the user says is already done, do NOT stage it as a pending item.
  If that work is already an open pending item, stage complete_pending_item instead.
- If the user mentions doing something "twice" or "again," reflect that (e.g., note the repeat in the
  record), and don't create conflicting pending items.
- Call out mismatches you notice (e.g., "the invoice still lists transmission service as recommended,
  but you've done it twice — I'll skip that one and mark it handled").

BE PROACTIVE
- Surface the useful insight, not just a file dump: what's now overdue, what a finding implies, what
  you'd watch next. One or two sharp observations, not a lecture.
- Connect related facts when relevant (e.g., a VCM delete relates to Honda VCM oil-consumption history).
- If one detail is genuinely missing and blocks a good action, ask ONE crisp question. Otherwise make
  reasonable assumptions and say what you assumed.

STYLE
- Operate on the ACTIVE vehicle unless the user clearly means another (garage snapshot is below).
- Concise, specific, and human. Prefer doing over explaining. Use the user's own numbers/terms.
- Never claim something was saved — only that it's staged for their confirmation (the Apply button).`;
