import {
  AudioInspectionResult,
  VisualInspectionResult,
  OverallReportSummary,
  VehicleProfile,
  ChecklistItem,
  DocumentExtraction,
} from "../types/inspection";

export async function ingestDocument(
  file: File,
  vehicle?: VehicleProfile | null
): Promise<DocumentExtraction> {
  const formData = new FormData();
  formData.append("file", file);
  if (vehicle) {
    formData.append(
      "vehicle",
      `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""} VIN ${vehicle.vin || "n/a"}`.trim()
    );
  }
  const res = await fetch("/api/ingest", { method: "POST", body: formData });
  if (!res.ok) {
    let msg = `Document scan failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as DocumentExtraction;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export async function diagnoseAudio(
  audioBlob: Blob,
  context: string = "idling",
  presetFault?: string
): Promise<AudioInspectionResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  formData.append("context", context);
  if (presetFault) {
    formData.append("preset_fault", presetFault);
  }

  const res = await fetch(`${API_BASE_URL}/diagnose/audio`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Audio diagnosis API error (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function diagnoseVision(
  imageBlob: Blob,
  componentKey: string,
  carContext: string = "2015 Toyota Highlander V6",
  presetCondition?: string
): Promise<VisualInspectionResult> {
  const formData = new FormData();
  formData.append("image", imageBlob, "inspection.jpg");
  formData.append("component_key", componentKey);
  formData.append("car_context", carContext);
  if (presetCondition) {
    formData.append("preset_condition", presetCondition);
  }

  const res = await fetch(`${API_BASE_URL}/diagnose/vision`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vision diagnosis API error (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function generateOverallReport(
  items: ChecklistItem[],
  vehicle: VehicleProfile
): Promise<OverallReportSummary> {
  const payloadItems = items.map((it) => ({
    item_id: it.id,
    station_id: it.station_id,
    component_name: it.title,
    status: it.status,
    finding_category: it.finding_category || null,
    points: it.points,
    is_walk_condition: it.is_walk_condition,
    explanation: it.explanation || null,
    negotiation_tip: it.negotiation_tip || null,
    confidence: it.confidence || null,
    media_type: it.media_type,
    media_url: it.media_preview_url || null,
    audio_conditions: it.audio_result?.top_conditions || null,
  }));

  const res = await fetch(`${API_BASE_URL}/reports/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: payloadItems,
      vehicle,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Report generation API error (${res.status}): ${errorText}`);
  }

  return await res.json();
}

