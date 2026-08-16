import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Station,
  ChecklistItem,
  VehicleProfile,
  VisualInspectionResult,
  AudioInspectionResult,
  OverallReportSummary,
} from "../types/inspection";

const INITIAL_STATIONS: Station[] = [
  {
    id: "station_1",
    number: 1,
    title: "Station 1: Cold Engine Bay & Fluids",
    short_title: "1. Fluids & Cold Bay",
    description: "Inspect primary fluid conditions, caps, and electrical connections before cranking engine.",
    icon_name: "Droplets",
    items: [
      {
        id: "s1_oil_cap",
        station_id: "station_1",
        title: "Oil Filler Cap Underside",
        subtitle: "Check for head gasket coolant emulsion vs clean oil",
        media_type: "image",
        instruction: "Remove the engine oil cap and photograph the underside. Inspect for milky caramel/yellow foam (mayonnaise texture).",
        rubric_summary: [
          { label: "Clean, amber / dry", points: 2 },
          { label: "Dark carbon varnish", points: -2 },
          { label: "Milkshake, foamy", points: -10, is_walk: true },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s1_dipstick",
        station_id: "station_1",
        title: "Oil Dipstick Level & Quality",
        subtitle: "Check level, viscosity, color, and foam",
        media_type: "image",
        instruction: "Pull the dipstick, wipe once, reinsert, pull again and photograph the oil level indicator tip against clean light.",
        rubric_summary: [
          { label: "Clean, amber level", points: 3 },
          { label: "Dark, overdue oil", points: -2 },
          { label: "Dry / Below min line", points: -4 },
          { label: "Milkshake, foamy", points: -10, is_walk: true },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s1_coolant",
        station_id: "station_1",
        title: "Coolant Reservoir & Cap",
        subtitle: "Check for oil slick, rust sediment, and OEM clarity",
        media_type: "image",
        instruction: "Photograph into the plastic coolant overflow expansion tank. Verify fluid clarity and absence of dark oil scum.",
        rubric_summary: [
          { label: "Bright OEM clean", points: 2 },
          { label: "Murky / sediment", points: -2 },
          { label: "Oil slick / milky mix", points: -10, is_walk: true },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s1_brake_fluid",
        station_id: "station_1",
        title: "Brake Fluid Reservoir",
        subtitle: "Check moisture degradation and fluid darkness",
        media_type: "image",
        instruction: "Photograph the translucent brake master cylinder reservoir under hood lighting.",
        rubric_summary: [
          { label: "Clear / light honey", points: 2 },
          { label: "Dark brown / moisture", points: -2 },
          { label: "Pitch black / sediment", points: -4 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s1_battery",
        station_id: "station_1",
        title: "Battery Terminals & Age Code",
        subtitle: "Check sulfuric acid blooms, date code, and post health",
        media_type: "image",
        instruction: "Photograph top of 12V battery showing both terminals and the circular date manufacturing stamp.",
        rubric_summary: [
          { label: "Clean, sealed posts (<3 yrs)", points: 2 },
          { label: "Minor acid crust", points: -1 },
          { label: "Heavy corroded crust (5+ yrs)", points: -3 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
    ],
  },
  {
    id: "station_2",
    number: 2,
    title: "Station 2: Engine Mechanical & Acoustic",
    short_title: "2. Engine & Acoustics",
    description: "Diagnose mechanical gaskets, seals, and run Audio Spectrogram Transformer (AST) acoustic scans.",
    icon_name: "Activity",
    items: [
      {
        id: "s2_timing_cover",
        station_id: "station_2",
        title: "Front Engine Timing Cover Seam",
        subtitle: "Check aluminum mating seam for oil sweat or dark grime",
        media_type: "image",
        instruction: "Point camera at the front engine timing cover aluminum perimeter seam between cylinder head and block.",
        rubric_summary: [
          { label: "Bone dry", points: 3 },
          { label: "Slightly damp", points: -2 },
          { label: "Wet, grimy", points: -5 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s2_valve_cover",
        station_id: "station_2",
        title: "Valve Cover Gasket Perimeter",
        subtitle: "Check valve cover flange and spark plug tube seals",
        media_type: "image",
        instruction: "Photograph the perimeter seal of the valve cover, especially above exhaust manifold heat shields.",
        rubric_summary: [
          { label: "Bone dry / clean", points: 2 },
          { label: "Weeping around bolts", points: -2 },
          { label: "Heavy pooled oil", points: -4 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s2_audio_idle",
        station_id: "station_2",
        title: "Cold Idle Acoustic AST Scan",
        subtitle: "19-Class AST transformer detection at 750 RPM",
        media_type: "audio",
        instruction: "Hold phone microphone 12-18 inches above engine valve cover for 5 seconds while vehicle idles in Park.",
        rubric_summary: [
          { label: "Healthy harmonic idle", points: 3 },
          { label: "Lifter tick / Vacuum leak", points: -2 },
          { label: "Rod knock / Bearing failure", points: -10, is_walk: true },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s2_audio_rev",
        station_id: "station_2",
        title: "Rev & Decel Acoustic AST Scan",
        subtitle: "Acoustic detection under 2,500 RPM blip and throttle release",
        media_type: "audio",
        instruction: "Have assistant blip throttle smoothly to 2,500 RPM and release while recording engine decel resonance.",
        rubric_summary: [
          { label: "Linear spool & smooth decel", points: 2 },
          { label: "Timing chain rattle / Misfire", points: -4 },
          { label: "Turbo siren / Piston slap", points: -5 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s2_serpentine_belt",
        station_id: "station_2",
        title: "Serpentine Accessory Belt & Pulleys",
        subtitle: "Check rubber rib dry rot, cracking, and alignment",
        media_type: "image",
        instruction: "Take a focused close-up photo of the ribbed side of the serpentine accessory drive belt.",
        rubric_summary: [
          { label: "Supple, ribbed, no cracks", points: 2 },
          { label: "Micro-cracks / dry rot", points: -2 },
          { label: "Frayed edges / misaligned", points: -3 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
    ],
  },
  {
    id: "station_3",
    number: 3,
    title: "Station 3: Underbody, Drivetrain & Suspension",
    short_title: "3. Underbody & Suspension",
    description: "Examine CV axles, oil pan drips, structural subframe rust, and hydraulic dampers.",
    icon_name: "ShieldAlert",
    items: [
      {
        id: "s3_cv_axle_boots",
        station_id: "station_3",
        title: "Front CV Axle Rubber Boots",
        subtitle: "Check accordion boots for tears or slung grease",
        media_type: "image",
        instruction: "Turn steering wheel fully to lock and photograph the rubber accordion CV axle boots behind the wheel.",
        rubric_summary: [
          { label: "Intact, supple, sealed", points: 2 },
          { label: "Surface hairline checks", points: -1 },
          { label: "Torn, slinging dark grease", points: -3 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s3_oil_pan_leaks",
        station_id: "station_3",
        title: "Engine Oil Pan & Transmission Bellhousing",
        subtitle: "Check lowest point of powertrain for active drips",
        media_type: "image",
        instruction: "Kneel and photograph underside of engine oil pan and transmission bellhousing joint with flash on.",
        rubric_summary: [
          { label: "Clean, dry metal", points: 3 },
          { label: "Minor oil seepage", points: -2 },
          { label: "Active dripping / wet casing", points: -5 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s3_subframe_rust",
        station_id: "station_3",
        title: "Subframe & Frame Rails Structural Rust",
        subtitle: "Check unibody rails for structural perforation vs surface patina",
        media_type: "image",
        instruction: "Photograph the front suspension subframe cradle and unibody frame rail pinch welds.",
        rubric_summary: [
          { label: "Clean paint / e-coat", points: 3 },
          { label: "Light surface patina", points: 0 },
          { label: "Perforated rot / flaky rust", points: -10, is_walk: true },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s3_struts_shocks",
        station_id: "station_3",
        title: "Shock Absorbers & Strut Dampers",
        subtitle: "Check hydraulic piston shafts for oil mist or blown seal",
        media_type: "image",
        instruction: "Photograph through the wheel opening at the chrome piston shaft and body of the front strut assembly.",
        rubric_summary: [
          { label: "Dry shaft, firm dampening", points: 2 },
          { label: "Hydraulic oil misting", points: -2 },
          { label: "Wet dripping blown strut", points: -4 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
    ],
  },
  {
    id: "station_4",
    number: 4,
    title: "Station 4: Exterior, Structural & Tires",
    short_title: "4. Exterior & Frame",
    description: "Detect panel gaps, collision damage, inner apron welds, body filler Bondo, and tire wear.",
    icon_name: "Cpu",
    items: [
      {
        id: "s4_panel_gaps",
        station_id: "station_4",
        title: "Fender & Hood Panel Gaps",
        subtitle: "Check uniform 3-4mm alignment along fender seams",
        media_type: "image",
        instruction: "Photograph down the line between hood and front fender on both left and right sides to check symmetry.",
        rubric_summary: [
          { label: "Uniform 3-4mm laser aligned", points: 2 },
          { label: "Minor uneven gap (5-6mm)", points: -2 },
          { label: "Crooked / rubbing panels", points: -4 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s4_inner_aprons_crash",
        station_id: "station_4",
        title: "Inner Aprons & Core Support Crash Signs",
        subtitle: "Check OEM spot welds vs frame pull marks / aftermarket welds",
        media_type: "image",
        instruction: "With hood open, photograph the inner fender sheet metal aprons and radiator upper support tie bar.",
        rubric_summary: [
          { label: "Factory spot welds & sealer", points: 3 },
          { label: "Minor plastic clip broken", points: -1 },
          { label: "Kinked metal / aftermarket welds", points: -10, is_walk: true },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s4_paint_bondo",
        station_id: "station_4",
        title: "Paint Texture & Body Filler / Bondo",
        subtitle: "Check orange peel consistency vs tape lines / thick filler",
        media_type: "image",
        instruction: "Photograph reflections along doors and quarter panels at a 45-degree angle to detect waviness or body filler.",
        rubric_summary: [
          { label: "Consistent factory orange peel", points: 2 },
          { label: "Repainted panel / overspray", points: -2 },
          { label: "Heavy bondo mud / bubbling rust", points: -4 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s4_tire_tread",
        station_id: "station_4",
        title: "Tire Tread Depth & Wear Pattern",
        subtitle: "Check for camber shoulder baldness or sidewall bubbles",
        media_type: "image",
        instruction: "Photograph tire tread across the contact patch showing both inner shoulder and center groove wear bars.",
        rubric_summary: [
          { label: "Even 6/32\"+ tread depth", points: 2 },
          { label: "Inner / outer shoulder bald", points: -3 },
          { label: "Severe dry rot / sidewall bubble", points: -4 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
    ],
  },
  {
    id: "station_5",
    number: 5,
    title: "Station 5: Cabin, OBD-II & Road Test",
    short_title: "5. Cabin & Road Test",
    description: "Check cold start exhaust smoke, instrument warning lights, transmission shift quality, and HVAC.",
    icon_name: "Gauge",
    items: [
      {
        id: "s5_tailpipe_smoke",
        station_id: "station_5",
        title: "Cold Start Tailpipe Smoke",
        subtitle: "Check for blue oil smoke or billowing white coolant vapor",
        media_type: "image",
        instruction: "Photograph exhaust tailpipe plume 10 seconds after cold engine ignition startup.",
        rubric_summary: [
          { label: "Clear / brief water vapor", points: 2 },
          { label: "Black sooty / rich mixture", points: -3 },
          { label: "Blue puff / oil consumption", points: -10, is_walk: true },
          { label: "Billowing sweet white smoke", points: -10, is_walk: true },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s5_warning_lights_obd",
        station_id: "station_5",
        title: "Instrument Warning Lights / OBD Readiness",
        subtitle: "Check Check Engine, ABS, SRS Airbag lamps during key-on test",
        media_type: "image",
        instruction: "Photograph instrument gauge cluster with engine running to confirm zero illuminated fault lamps.",
        rubric_summary: [
          { label: "All bulbs self-test & extinguish", points: 3 },
          { label: "TPMS / minor maintenance lamp", points: -1 },
          { label: "ABS / Airbag SRS light ON", points: -4 },
          { label: "Check Engine Light ON", points: -5 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s5_trans_engagement",
        station_id: "station_5",
        title: "Transmission Gear Engagement (P to D / R)",
        subtitle: "Check engagement delay (<0.5s) and absence of violent thud",
        media_type: "image",
        instruction: "With foot on brake at idle, shift from Park to Reverse, then to Drive. Note delay and photograph shifter console.",
        rubric_summary: [
          { label: "Crisp, immediate lock-in (<0.5s)", points: 2 },
          { label: "Slight hesitation (1.0s)", points: -2 },
          { label: "Hard violent clunk / slipping delay", points: -5 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
      {
        id: "s5_hvac_performance",
        station_id: "station_5",
        title: "HVAC System (A/C & Heat Performance)",
        subtitle: "Check sub-45°F A/C vent temp and heater core output",
        media_type: "image",
        instruction: "Turn A/C to max cold, recirculate on; photograph dash center vent showing climate controls.",
        rubric_summary: [
          { label: "Sub-45°F A/C & boiling heat", points: 2 },
          { label: "Slow cooling (55°F)", points: -2 },
          { label: "Hot air only / Compressor dead", points: -4 },
        ],
        status: "uninspected",
        points: 0,
        is_walk_condition: false,
      },
    ],
  },
];

const INITIAL_VEHICLE: VehicleProfile = {
  year: 2015,
  make: "Toyota",
  model: "Highlander",
  trim: "V6 Limited AWD",
  mileage: 115000,
  asking_price: 16500,
  vin: "4T3BK3BB0FU123456",
};

export interface PendingItem {
  itemId: string;
  stationId: string;
  blobData: string; // Base64 representation
  mediaType: "image" | "audio";
  context?: string;
  createdAt: string;
}

interface InspectionState {
  vehicle: VehicleProfile;
  stations: Station[];
  activeStationId: string;
  selectedItemId: string | null;
  walkModalOpen: boolean;
  walkModalItem: ChecklistItem | null;
  reportModalOpen: boolean;
  vehicleEditModalOpen: boolean;
  pendingQueue: PendingItem[];
  
  // Actions
  updateVehicle: (patch: Partial<VehicleProfile>) => void;
  setActiveStation: (stationId: string) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setWalkModalOpen: (open: boolean, item?: ChecklistItem | null) => void;
  setReportModalOpen: (open: boolean) => void;
  setVehicleEditModalOpen: (open: boolean) => void;
  
  // Inspection Results
  recordVisualResult: (itemId: string, result: VisualInspectionResult, previewUrl?: string) => void;
  recordAudioResult: (itemId: string, result: AudioInspectionResult, previewUrl?: string) => void;
  setItemStatus: (itemId: string, status: ChecklistItem["status"]) => void;
  enqueuePending: (pending: PendingItem) => void;
  removePending: (itemId: string) => void;
  
  // Reset & Scenarios
  resetChecklist: () => void;
  loadDemoScenario: (scenario: "clean_pass" | "blown_head_gasket" | "rod_knock" | "high_negotiation") => void;
  
  // Computed helpers
  getAllItems: () => ChecklistItem[];
  getTotalPoints: () => number;
  getWalkConditions: () => ChecklistItem[];
  getCompletedCount: () => number;
  getProgressPercentage: () => number;
  getStationById: (stationId: string) => Station | undefined;
  getItemById: (itemId: string) => ChecklistItem | undefined;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set, get) => ({
      vehicle: INITIAL_VEHICLE,
      stations: INITIAL_STATIONS,
      activeStationId: "station_1",
      selectedItemId: null,
      walkModalOpen: false,
      walkModalItem: null,
      reportModalOpen: false,
      vehicleEditModalOpen: false,
      pendingQueue: [],

      updateVehicle: (patch) =>
        set((state) => ({ vehicle: { ...state.vehicle, ...patch } })),

      setActiveStation: (stationId) => set({ activeStationId: stationId }),
      setSelectedItemId: (itemId) => set({ selectedItemId: itemId }),
      setWalkModalOpen: (open, item = null) =>
        set({ walkModalOpen: open, walkModalItem: item }),
      setReportModalOpen: (open) => set({ reportModalOpen: open }),
      setVehicleEditModalOpen: (open) => set({ vehicleEditModalOpen: open }),

      recordVisualResult: (itemId, result, previewUrl) => {
        set((state) => {
          let walkDetectedItem: ChecklistItem | null = null;
          const updatedStations = state.stations.map((st) => ({
            ...st,
            items: st.items.map((it) => {
              if (it.id === itemId) {
                const isError = result.finding_category === "Error";
                const updated: ChecklistItem = {
                  ...it,
                  status: isError ? "error" : "inspected",
                  finding_category: result.finding_category,
                  points: result.points,
                  is_walk_condition: result.is_walk_condition,
                  explanation: result.explanation,
                  negotiation_tip: result.negotiation_tip,
                  confidence: result.confidence,
                  visual_result: result,
                  media_preview_url: previewUrl || it.media_preview_url,
                  last_inspected_at: new Date().toISOString(),
                };
                if (result.is_walk_condition) {
                  walkDetectedItem = updated;
                }
                return updated;
              }
              return it;
            }),
          }));

          return {
            stations: updatedStations,
            walkModalOpen: walkDetectedItem !== null ? true : state.walkModalOpen,
            walkModalItem: walkDetectedItem !== null ? walkDetectedItem : state.walkModalItem,
          };
        });
      },

      recordAudioResult: (itemId, result, previewUrl) => {
        set((state) => {
          let walkDetectedItem: ChecklistItem | null = null;
          const updatedStations = state.stations.map((st) => ({
            ...st,
            items: st.items.map((it) => {
              if (it.id === itemId) {
                const updated: ChecklistItem = {
                  ...it,
                  status: "inspected",
                  finding_category: result.primary_condition,
                  points: result.points,
                  is_walk_condition: result.is_walk_condition,
                  explanation: result.explanation,
                  negotiation_tip: result.negotiation_tip,
                  confidence: result.confidence,
                  audio_result: result,
                  media_preview_url: previewUrl || it.media_preview_url,
                  last_inspected_at: new Date().toISOString(),
                };
                if (result.is_walk_condition) {
                  walkDetectedItem = updated;
                }
                return updated;
              }
              return it;
            }),
          }));

          return {
            stations: updatedStations,
            walkModalOpen: walkDetectedItem !== null ? true : state.walkModalOpen,
            walkModalItem: walkDetectedItem !== null ? walkDetectedItem : state.walkModalItem,
          };
        });
      },

      setItemStatus: (itemId, status) => {
        set((state) => ({
          stations: state.stations.map((st) => ({
            ...st,
            items: st.items.map((it) => (it.id === itemId ? { ...it, status } : it)),
          })),
        }));
      },

      enqueuePending: (pending) => {
        set((state) => ({
          pendingQueue: [...state.pendingQueue.filter((p) => p.itemId !== pending.itemId), pending],
          stations: state.stations.map((st) => ({
            ...st,
            items: st.items.map((it) =>
              it.id === pending.itemId ? { ...it, status: "pending" } : it
            ),
          })),
        }));
      },

      removePending: (itemId) => {
        set((state) => ({
          pendingQueue: state.pendingQueue.filter((p) => p.itemId !== itemId),
        }));
      },

      resetChecklist: () => {
        set({
          stations: INITIAL_STATIONS,
          activeStationId: "station_1",
          selectedItemId: null,
          walkModalOpen: false,
          walkModalItem: null,
          pendingQueue: [],
        });
      },

      loadDemoScenario: (scenario) => {
        set((state) => {
          const updatedStations = state.stations.map((st) => ({
            ...st,
            items: st.items.map((it) => {
              if (scenario === "clean_pass") {
                const opt = it.rubric_summary[0];
                return {
                  ...it,
                  status: "inspected" as const,
                  finding_category: opt.label,
                  points: opt.points,
                  is_walk_condition: false,
                  explanation: `Inspected: ${it.title} in excellent factory condition.`,
                  negotiation_tip: null,
                  confidence: 0.96,
                  last_inspected_at: new Date().toISOString(),
                };
              } else if (scenario === "blown_head_gasket") {
                if (it.id === "s1_dipstick" || it.id === "s1_oil_cap") {
                  return {
                    ...it,
                    status: "inspected" as const,
                    finding_category: "Milkshake, foamy",
                    points: -10,
                    is_walk_condition: true,
                    explanation: "Severe emulsified coolant foam on dipstick and oil cap underside.",
                    negotiation_tip: "WALK AWAY. Head gasket blown or cracked block. Catastrophic engine risk.",
                    confidence: 0.98,
                    last_inspected_at: new Date().toISOString(),
                  };
                }
                const opt = it.rubric_summary[0];
                return {
                  ...it,
                  status: "inspected" as const,
                  finding_category: opt.label,
                  points: opt.points,
                  is_walk_condition: false,
                  explanation: `Inspected: ${it.title} in standard condition.`,
                  negotiation_tip: null,
                  confidence: 0.94,
                  last_inspected_at: new Date().toISOString(),
                };
              } else if (scenario === "rod_knock") {
                if (it.id === "s2_audio_idle") {
                  return {
                    ...it,
                    status: "inspected" as const,
                    finding_category: "Rod Knock",
                    points: -10,
                    is_walk_condition: true,
                    explanation: "Heavy percussive bottom-end double knock from cylinder 3 connecting rod bearing.",
                    negotiation_tip: "DO NOT PURCHASE. Bottom end rod bearing failure imminent. Teardown needed.",
                    confidence: 0.97,
                    last_inspected_at: new Date().toISOString(),
                  };
                }
                const opt = it.rubric_summary[0];
                return {
                  ...it,
                  status: "inspected" as const,
                  finding_category: opt.label,
                  points: opt.points,
                  is_walk_condition: false,
                  explanation: `Inspected: ${it.title} in standard condition.`,
                  negotiation_tip: null,
                  confidence: 0.92,
                  last_inspected_at: new Date().toISOString(),
                };
              } else {
                // High negotiation scenario (Multiple minor wear items)
                if (it.id === "s2_timing_cover") {
                  return {
                    ...it,
                    status: "inspected" as const,
                    finding_category: "Wet, grimy",
                    points: -5,
                    is_walk_condition: false,
                    explanation: "Active oil seepage and road grime caked on front timing cover seam.",
                    negotiation_tip: "Require $1,800 discount for front engine disassembly and timing cover reseal.",
                    confidence: 0.94,
                    last_inspected_at: new Date().toISOString(),
                  };
                }
                if (it.id === "s3_oil_pan_leaks") {
                  return {
                    ...it,
                    status: "inspected" as const,
                    finding_category: "Active dripping / wet casing",
                    points: -5,
                    is_walk_condition: false,
                    explanation: "Hanging oil droplets on lower bellhousing inspection plate.",
                    negotiation_tip: "Deduct $1,200 for rear main seal and oil pan gasket replacement.",
                    confidence: 0.91,
                    last_inspected_at: new Date().toISOString(),
                  };
                }
                if (it.id === "s4_tire_tread") {
                  return {
                    ...it,
                    status: "inspected" as const,
                    finding_category: "Inner / outer shoulder bald",
                    points: -3,
                    is_walk_condition: false,
                    explanation: "Front tires worn bald at inner shoulder from camber alignment issue.",
                    negotiation_tip: "Deduct $650 for two new front tires and 4-wheel alignment.",
                    confidence: 0.95,
                    last_inspected_at: new Date().toISOString(),
                  };
                }
                const opt = it.rubric_summary[0];
                return {
                  ...it,
                  status: "inspected" as const,
                  finding_category: opt.label,
                  points: opt.points,
                  is_walk_condition: false,
                  explanation: `Inspected: ${it.title} in acceptable condition.`,
                  negotiation_tip: null,
                  confidence: 0.94,
                  last_inspected_at: new Date().toISOString(),
                };
              }
            }),
          }));

          const hasWalk = scenario === "blown_head_gasket" || scenario === "rod_knock";
          const walkItem = hasWalk
            ? updatedStations.flatMap((s) => s.items).find((i) => i.is_walk_condition) || null
            : null;

          return {
            stations: updatedStations,
            walkModalOpen: hasWalk,
            walkModalItem: walkItem,
          };
        });
      },

      getAllItems: () => get().stations.flatMap((s) => s.items),
      getTotalPoints: () =>
        get()
          .getAllItems()
          .filter((i) => i.status === "inspected")
          .reduce((sum, i) => sum + i.points, 0),
      getWalkConditions: () =>
        get()
          .getAllItems()
          .filter((i) => i.status === "inspected" && i.is_walk_condition),
      getCompletedCount: () =>
        get()
          .getAllItems()
          .filter((i) => i.status === "inspected").length,
      getProgressPercentage: () => {
        const total = get().getAllItems().length;
        if (total === 0) return 0;
        const completed = get().getCompletedCount();
        return Math.round((completed / total) * 100);
      },
      getStationById: (stationId) =>
        get().stations.find((s) => s.id === stationId),
      getItemById: (itemId) =>
        get()
          .getAllItems()
          .find((i) => i.id === itemId),
    }),
    {
      name: "car-inspector-store-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
