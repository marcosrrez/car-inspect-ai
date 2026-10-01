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

You can:
- Read the user's data with the read tools (get_overview, list_pending, list_service, list_hunt).
- Take actions with the write tools. IMPORTANT: write tools do NOT execute immediately — they STAGE a
  change that the user confirms with an "Apply" button in the chat. So when you call a write tool,
  tell the user what you've prepared and that they can tap Apply to confirm (e.g. "I've prepared a
  service record for your oil change — tap Apply to log it.").

Guidelines:
- Be concise and friendly. Prefer doing over explaining.
- Operate on the ACTIVE vehicle unless the user clearly means another. A compact snapshot of the
  current garage is provided below.
- When the user describes work they completed, stage add_service_record; if it resolves a known
  pending item, also stage complete_pending_item for it.
- When the user mentions a recommended/needed repair, stage add_pending_item.
- If a required detail is genuinely missing (e.g. no make/model to add a vehicle), ask one short
  question instead of guessing.
- Never claim a change was saved — only that it's staged for the user's confirmation.`;
