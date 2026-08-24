export type SeverityType = "normal" | "warning" | "critical";
export type SeverityColor = "green" | "yellow" | "red";
export type ItemStatus = "uninspected" | "pending" | "inspected" | "error";

export interface AudioConditionCandidate {
  condition: string;
  confidence: number;
  severity: SeverityType;
  description: string;
  is_walk_condition: boolean;
}

export interface SpectrogramSummary {
  time_frames: number;
  mel_bands: number;
  dominant_frequency_hz: number;
  spectral_centroid_hz: number;
  harmonic_ratio: number;
  transient_impact_level: string;
  energy_levels: number[];
}

export interface AudioInspectionResult {
  component_analyzed: string;
  primary_condition: string;
  top_conditions: AudioConditionCandidate[];
  confidence: number;
  severity_color: SeverityColor;
  points: number;
  is_walk_condition: boolean;
  explanation: string;
  negotiation_tip: string | null;
  spectrogram: SpectrogramSummary;
}

export interface VisualInspectionResult {
  component_analyzed: string;
  finding_category: string;
  points: number;
  is_walk_condition: boolean;
  explanation: string;
  negotiation_tip: string | null;
  confidence: number;
  detected_features: string[];
  suggested_action?: string | null;
}

export interface RubricOption {
  label: string;
  points: number;
  is_walk?: boolean;
  explanation?: string;
  negotiation_tip?: string | null;
}

export interface ChecklistItem {
  id: string;
  station_id: string;
  title: string;
  subtitle: string;
  media_type: "image" | "audio";
  instruction: string;
  rubric_summary: RubricOption[];
  status: ItemStatus;
  finding_category?: string;
  points: number;
  is_walk_condition: boolean;
  explanation?: string;
  negotiation_tip?: string | null;
  confidence?: number;
  media_preview_url?: string;
  audio_result?: AudioInspectionResult;
  visual_result?: VisualInspectionResult;
  last_inspected_at?: string;
}

export interface Station {
  id: string;
  number: number;
  title: string;
  short_title: string;
  description: string;
  icon_name: string;
  items: ChecklistItem[];
}

export interface VehicleProfile {
  year: number;
  make: string;
  model: string;
  trim: string;
  mileage: number;
  asking_price: number;
  vin: string;
  is_turbocharged?: boolean;
}

export interface ServiceRecord {
  id: string;
  task_id: string;
  title: string;
  date: string;
  mileage: number;
  cost_usd: number;
  performed_by: "diy" | "professional";
  parts_brand?: string;
  notes?: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  category: "fluids" | "mechanical" | "preservation" | "detailing";
  interval_miles: number;
  interval_months: number;
  is_diy_friendly: boolean;
  diy_difficulty: "Easy" | "Moderate" | "Advanced" | "Professional Only";
  why_it_matters: string;
  oem_spec_note: string;
  video_search_query: string;
  pro_vs_diy_advice: string;
  step_by_step_summary: string[];
}

export interface OverallReportSummary {
  total_score: number;
  max_possible_score: number;
  health_percentage: number;
  grade: string;
  verdict: "EXCELLENT BUY" | "FAIR / NEGOTIATE" | "MAJOR RISK" | "WALK AWAY - DEAL BREAKER";
  walk_conditions_count: number;
  walk_condition_reasons: string[];
  total_estimated_repairs_usd: number;
  recommended_offer_usd: number;
  dealer_negotiation_script: {
    component: string;
    finding: string;
    deduction_points: number;
    estimated_repair_cost: number;
    talking_point: string;
    is_walk: boolean;
  }[];
  completed_items_count: number;
  total_items_count: number;
  vehicle: VehicleProfile;
}
