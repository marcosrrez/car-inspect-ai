import {
  VehicleProfile,
  ServiceRecord,
  PendingItem,
  VehicleHistoryReport,
  SavedInspectionSnapshot,
} from "../types/inspection";
import { CAR_CARE_NUT_MAINTENANCE_TASKS } from "../utils/maintenanceDatabase";

export interface InsightState {
  vehicle: VehicleProfile | null;
  activeVehicleId: string | null;
  serviceRecordsByVehicle: Record<string, ServiceRecord[]>;
  pendingItemsByVehicle: Record<string, PendingItem[]>;
  historyReportsByVehicle: Record<string, VehicleHistoryReport[]>;
  savedHuntSnapshots: SavedInspectionSnapshot[];
}

export interface GarageInsights {
  hasVehicle: boolean;
  vehicleLabel: string;
  mileage: number;
  openPending: { title: string; priority: string }[];
  highPriorityOpen: string[];
  overdue: { title: string; milesOver: number }[];
  dueSoon: { title: string; milesLeft: number }[];
  lastService?: { title: string; date: string; mileage: number };
  serviceCount: number;
  reportCount: number;
  huntCount: number;
  urgentCount: number;
  contextText: string;
  briefing: string;
}

export function computeInsights(s: InsightState): GarageInsights {
  const v = s.vehicle;
  const vid = s.activeVehicleId;
  const services = (vid && s.serviceRecordsByVehicle[vid]) || [];
  const pending = (vid && s.pendingItemsByVehicle[vid]) || [];
  const reports = (vid && s.historyReportsByVehicle[vid]) || [];
  const miles = v?.mileage || 0;

  const openPending = pending
    .filter((p) => !p.resolved)
    .map((p) => ({ title: p.title, priority: p.priority }));
  const highPriorityOpen = openPending
    .filter((p) => p.priority === "high")
    .map((p) => p.title);

  const overdue: { title: string; milesOver: number }[] = [];
  const dueSoon: { title: string; milesLeft: number }[] = [];
  if (v) {
    for (const task of CAR_CARE_NUT_MAINTENANCE_TASKS) {
      const latest = services.find((r) => r.task_id === task.id);
      if (!latest) continue; // don't nag about services never logged
      const milesSince = miles - latest.mileage;
      const remaining = task.interval_miles - milesSince;
      if (remaining <= 0) overdue.push({ title: task.title, milesOver: Math.abs(remaining) });
      else if (remaining <= 1000) dueSoon.push({ title: task.title, milesLeft: remaining });
    }
  }

  const lastService = [...services].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  )[0];

  const urgentCount = overdue.length + highPriorityOpen.length;
  const vehicleLabel = v
    ? `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`
    : "";

  // Compact machine-readable state for the model to reason proactively.
  const contextText = JSON.stringify({
    active_vehicle: v
      ? `${vehicleLabel} — ${miles.toLocaleString()} mi${v.vin ? ` — VIN ${v.vin}` : ""}`
      : null,
    overdue_maintenance: overdue.map((o) => `${o.title} (overdue ${o.milesOver.toLocaleString()} mi)`),
    due_soon_maintenance: dueSoon.map((d) => `${d.title} (in ${d.milesLeft.toLocaleString()} mi)`),
    open_pending_high: highPriorityOpen,
    open_pending_other: openPending.filter((p) => p.priority !== "high").map((p) => p.title),
    last_service: lastService
      ? `${lastService.title} on ${lastService.date} at ${lastService.mileage.toLocaleString()} mi`
      : null,
    service_count: services.length,
    report_count: reports.length,
    hunt_count: s.savedHuntSnapshots.length,
  });

  const briefing = buildBriefing({
    hasVehicle: !!v,
    vehicleLabel,
    overdue,
    dueSoon,
    highPriorityOpen,
    openCount: openPending.length,
    lastService,
  });

  return {
    hasVehicle: !!v,
    vehicleLabel,
    mileage: miles,
    openPending,
    highPriorityOpen,
    overdue,
    dueSoon,
    lastService: lastService
      ? { title: lastService.title, date: lastService.date, mileage: lastService.mileage }
      : undefined,
    serviceCount: services.length,
    reportCount: reports.length,
    huntCount: s.savedHuntSnapshots.length,
    urgentCount,
    contextText,
    briefing,
  };
}

function buildBriefing(a: {
  hasVehicle: boolean;
  vehicleLabel: string;
  overdue: { title: string; milesOver: number }[];
  dueSoon: { title: string; milesLeft: number }[];
  highPriorityOpen: string[];
  openCount: number;
  lastService?: { title: string; date: string; mileage: number };
}): string {
  if (!a.hasVehicle) {
    return "Hi — I'm your garage assistant. Add a vehicle or drop in a Carfax, AutoCheck, or shop invoice and I'll set everything up for you. You can also just tell me about your car.";
  }
  const lines: string[] = [`Here's where your **${a.vehicleLabel}** stands:`];
  if (a.overdue.length) {
    lines.push(
      `- ⚠️ **Overdue:** ${a.overdue
        .slice(0, 4)
        .map((o) => `${o.title} (${o.milesOver.toLocaleString()} mi over)`)
        .join("; ")}`
    );
  }
  if (a.dueSoon.length) {
    lines.push(
      `- 🔧 **Due soon:** ${a.dueSoon
        .slice(0, 4)
        .map((d) => `${d.title} (${d.milesLeft.toLocaleString()} mi)`)
        .join("; ")}`
    );
  }
  if (a.highPriorityOpen.length) {
    lines.push(`- 🔴 **High-priority to-dos:** ${a.highPriorityOpen.slice(0, 4).join("; ")}`);
  }
  if (a.openCount) {
    lines.push(`- 📋 ${a.openCount} open item${a.openCount === 1 ? "" : "s"} total`);
  }
  if (a.lastService) {
    lines.push(
      `- 🧾 Last logged: ${a.lastService.title} (${a.lastService.date})`
    );
  }
  if (lines.length === 1) {
    lines.push("- ✅ Nothing overdue — you're in good shape.");
  }
  lines.push("");
  lines.push("What would you like to do? You can tell me about work you did, drop in a document, or ask me anything about the car.");
  return lines.join("\n");
}

export function suggestedPrompts(ins: GarageInsights): string[] {
  if (!ins.hasVehicle) {
    return ["Add my vehicle", "What can you do?"];
  }
  const out: string[] = [];
  if (ins.overdue.length || ins.dueSoon.length) out.push("What's overdue or due soon?");
  out.push("Summarize this vehicle");
  if (ins.openPending.length) out.push("What should I prioritize?");
  out.push("Plan my maintenance for the next year");
  out.push("What should I budget for repairs?");
  return out.slice(0, 4);
}
