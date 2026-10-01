import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-5-5";

// Known maintenance task_ids the UI can line up with its maintenance tracker.
const KNOWN_TASK_IDS = [
  "engine_oil_filter",
  "transmission_fluid",
  "brake_fluid_flush",
  "coolant_drain_fill",
  "differential_transfer_case",
  "pcv_valve",
  "spark_plugs",
  "rustproofing_lanolin",
  "detailing_paint_protection",
  "honda_timing_belt_water_pump",
  "honda_atf_dw1",
  "weatherstrip_interior_preservation",
];

const SYSTEM = `You are an automotive records clerk. You read a single document about ONE vehicle
(a shop/service invoice, a Carfax or AutoCheck vehicle history report, a registration, or a
window sticker) and extract structured data. Return ONLY a JSON object, no prose, no markdown
fences.

Classify each line of work:
- Work that was COMPLETED/PERFORMED -> service_records.
- Work that is RECOMMENDED / an estimate / "due" / a deficiency not yet done -> pending_items.
Never invent data. If a field is unknown, omit it. Money is a number of US dollars (no "$"/"+tax").
Dates are ISO YYYY-MM-DD. For service_records, when the work clearly matches one of these task ids,
set task_id to it (else omit): ${KNOWN_TASK_IDS.join(", ")}.

Return exactly this shape:
{
  "document_type": "string (e.g. 'Shop invoice', 'Carfax', 'AutoCheck')",
  "summary": "one or two sentence plain-English summary",
  "vehicle": { "year": number?, "make": string?, "model": string?, "trim": string?, "vin": string?,
               "mileage": number?, "engine": string?, "transmission": string?, "owner_name": string?,
               "location": string?, "service_center": string? },
  "service_records": [ { "task_id": string?, "title": string, "date": string?, "mileage": number?,
                         "cost_usd": number?, "performed_by": "professional"|"diy"?, "parts_brand": string?,
                         "notes": string? } ],
  "pending_items": [ { "title": string, "priority": "high"|"medium"|"low"?, "estimated_cost_usd": number?,
                       "notes": string? } ],
  "history_report": { "provider": "carfax"|"autocheck"|"other", "report_date": string?, "owners_reported": number?,
                      "accidents_reported": number?, "title_brand": string?, "summary": string? } | null,
  "ownership_history": [ { "label": string, "period": string?, "location": string?, "annual_miles": number?,
                           "usage_notes": string? } ],
  "accident_history": [ { "date": string?, "description": string, "damage_location": string?,
                          "airbags_deployed": boolean? } ],
  "warnings": [ "string (anything ambiguous or worth the user double-checking)" ]
}
history_report should be non-null only for an actual Carfax/AutoCheck/history report (not a shop invoice).`;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response.");
  return JSON.parse(text.slice(start, end + 1));
}

export async function POST(req: Request) {
  // Optional mock mode for local/e2e testing without an API key.
  if (process.env.INGEST_MOCK === "1") {
    return Response.json(MOCK_EXTRACTION);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "AI document scanning isn't configured yet. Add ANTHROPIC_API_KEY to the deployment to enable it.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }

  const contextRaw = form.get("vehicle");
  const vehicleContext = typeof contextRaw === "string" ? contextRaw : "";

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return Response.json({ error: "Uploaded file is empty." }, { status: 400 });
  }
  const b64 = bytes.toString("base64");
  const mime = file.type || "application/octet-stream";

  const docBlock: Anthropic.ContentBlockParam =
    mime === "application/pdf"
      ? {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: b64 },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: (["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mime)
              ? mime
              : "image/jpeg") as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
            data: b64,
          },
        };

  const userText =
    "Extract this vehicle document into the JSON schema." +
    (vehicleContext
      ? ` For reference, the user's current vehicle is: ${vehicleContext}. Prefer the document's own values; use this only to disambiguate.`
      : "");

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: [docBlock, { type: "text", text: userText }] }],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "The document could not be processed." },
        { status: 422 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json({ error: "No text in model response." }, { status: 502 });
    }
    const parsed = extractJson(textBlock.text);
    return Response.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed.";
    const status = err instanceof Anthropic.APIError && err.status ? err.status : 500;
    return Response.json({ error: message }, { status });
  }
}

// Canned result mirroring the HondaPro invoice, used only when INGEST_MOCK=1.
const MOCK_EXTRACTION = {
  document_type: "Shop invoice",
  summary:
    "HondaPro invoice for a 2016 Honda Odyssey EX-L at 119,716 mi: spark plugs replaced and PCM software updated; several recommendations noted.",
  vehicle: {
    year: 2016,
    make: "Honda",
    model: "Odyssey",
    trim: "EX-L",
    vin: "5FNRL5H62GB009671",
    mileage: 119716,
    engine: "3.5L V6 (212CI)",
    transmission: "6AT",
    owner_name: "Marcos Gutierrez",
    location: "Siloam Springs, AR",
    service_center: "HondaPro — 300 W Poplar St, Fayetteville, AR",
  },
  service_records: [
    {
      task_id: "spark_plugs",
      title: "Replace spark plugs (6)",
      date: "2026-09-22",
      mileage: 119716,
      cost_usd: 193,
      performed_by: "professional",
      parts_brand: "DILZKR7A11G (12290-R71-L01)",
      notes: "Completed. Labor $140.",
    },
    {
      title: "PCM software updates",
      date: "2026-09-22",
      mileage: 119716,
      cost_usd: 84,
      performed_by: "professional",
      notes: "Completed.",
    },
  ],
  pending_items: [
    { title: "Transmission service (erratic shift)", priority: "medium", estimated_cost_usd: 142 },
    { title: "Valve adjustment (due at 105,000 mi)", priority: "high", estimated_cost_usd: 797, notes: "Includes valve cover gasket and PCV valve." },
    { title: "Driver's slide door release actuator", priority: "low", estimated_cost_usd: 819, notes: "Binding/popping." },
    { title: "Driver's washer nozzle", priority: "low", estimated_cost_usd: 76, notes: "Broken." },
    { title: "Front wiper blades", priority: "low", estimated_cost_usd: 74, notes: "Streaking and aftermarket." },
    { title: "Rear wiper insert", priority: "low", estimated_cost_usd: 9, notes: "Torn off." },
    { title: "Coolant reservoir cap", priority: "low", estimated_cost_usd: 20, notes: "Broken." },
    { title: "Washer fluid reservoir cap", priority: "low", estimated_cost_usd: 7, notes: "Broken." },
  ],
  history_report: null,
  ownership_history: [],
  accident_history: [],
  warnings: [
    "Timing belt was noted as replaced on 8/17/26 at 119,601 mi (vehicle memo).",
    "Recommend cabin and engine filters at 149,000 mi.",
  ],
};
