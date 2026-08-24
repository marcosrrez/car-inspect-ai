import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Station,
  ChecklistItem,
  VehicleProfile,
  VisualInspectionResult,
  AudioInspectionResult,
  RubricOption,
} from "../types/inspection";

const INITIAL_STATIONS: Station[] = [
  {
    id: "station_1",
    number: 1,
    title: "Cold Engine Bay & Fluids",
    short_title: "Fluids",
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
          { label: "Clean, amber / dry", points: 2, explanation: "Clean with light oil film and zero emulsified sludge." },
          { label: "Dark carbon varnish", points: -2, explanation: "Dark carbon varnish present, indicating extended drain intervals.", negotiation_tip: "Request $150 credit for an engine oil flush and fresh synthetic oil change." },
          { label: "Milkshake, foamy", points: -10, is_walk: true, explanation: "Yellow-white mayonnaise emulsion indicates coolant mixing with engine oil.", negotiation_tip: "WALK AWAY. Severe head gasket failure or cracked block. Do not negotiate." },
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
          { label: "Clean, amber level", points: 3, explanation: "Oil level is at full mark with golden amber color." },
          { label: "Dark, overdue oil", points: -2, explanation: "Engine oil is jet-black and overdue for routine service.", negotiation_tip: "Ask for a $100 maintenance credit for an oil and filter change." },
          { label: "Dry / Below min line", points: -4, explanation: "Critically low oil level suggests neglected maintenance.", negotiation_tip: "Demand a $500 mechanical inspection credit." },
          { label: "Milkshake, foamy", points: -10, is_walk: true, explanation: "Pale, frothy milkshake consistency indicates catastrophic coolant intrusion.", negotiation_tip: "WALK AWAY IMMEDIATELY. Blown head gasket or cracked engine block." },
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
          { label: "Bright OEM clean", points: 2, explanation: "Coolant is clean, transparent OEM color without sediment." },
          { label: "Murky / sediment", points: -2, explanation: "Coolant shows dark sediment requiring a cooling system flush.", negotiation_tip: "Request $200 off for a cooling system pressure test and flush." },
          { label: "Oil slick / milky mix", points: -10, is_walk: true, explanation: "Black oil film floating on coolant or milky slurry in overflow tank.", negotiation_tip: "WALK AWAY. Oil cooler rupture or blown head gasket breach." },
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
          { label: "Clear / light honey", points: 2, explanation: "Brake fluid is light golden amber and moisture-free." },
          { label: "Dark brown / moisture", points: -2, explanation: "Brake fluid is dark brown indicating moisture absorption (>3%).", negotiation_tip: "Ask for a $150 credit for a hydraulic brake fluid flush." },
          { label: "Pitch black / sediment", points: -4, explanation: "Brake fluid is pitch black with rubber seal degradation sediment.", negotiation_tip: "Deduct $350 for master cylinder inspection and brake service." },
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
          { label: "Clean, sealed posts (<3 yrs)", points: 2, explanation: "Terminals tight and clean; battery is under 3 years old." },
          { label: "Minor acid crust", points: -1, explanation: "Light powdery white/blue oxidation around battery terminal clamps.", negotiation_tip: "Ask for $50 terminal cleaning and protector application." },
          { label: "Heavy corroded crust (5+ yrs)", points: -3, explanation: "Severe sulfuric acid blooming and bloated battery casing.", negotiation_tip: "Deduct $220 for a new AGM battery replacement." },
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
    title: "Engine Mechanical & Acoustics",
    short_title: "Engine & Sound",
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
          { label: "Bone dry", points: 3, explanation: "Timing cover metal seam is dry without oil weeping." },
          { label: "Slightly damp", points: -2, explanation: "Timing cover shows faint oil sweat along aluminum mating edge.", negotiation_tip: "Point out timing cover seepage. Resealing requires engine support disassembly ($1,200-$1,800)." },
          { label: "Wet, grimy", points: -5, explanation: "Seam is coated with wet engine oil and road grime dripping onto lower block.", negotiation_tip: "Require a $1,800 price reduction to cover timing cover reseal." },
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
          { label: "Bone dry / clean", points: 2, explanation: "Perimeter of valve cover is dry and clean." },
          { label: "Weeping around bolts", points: -2, explanation: "Valve cover gasket has hardened with visible oil sweating.", negotiation_tip: "Deduct $350 for valve cover gasket and tube seal replacement." },
          { label: "Heavy pooled oil", points: -4, explanation: "Active oil pooling on exhaust heat shield with smoke risk.", negotiation_tip: "Deduct $650 for valve cover reseal and degreasing." },
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
          { label: "Healthy harmonic idle", points: 3, explanation: "Smooth valvetrain acoustics and balanced combustion cycles." },
          { label: "Lifter tick / Vacuum leak", points: -2, explanation: "High frequency ticking or intake vacuum hiss detected.", negotiation_tip: "Request $400 diagnostic and intake smoke test credit." },
          { label: "Rod knock / Bearing failure", points: -10, is_walk: true, explanation: "Heavy low-frequency double knock from connecting rod journal bearing.", negotiation_tip: "WALK AWAY. Catastrophic engine bottom-end failure imminent." },
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
          { label: "Linear spool & smooth decel", points: 2, explanation: "Harmonic acceleration ramp with smooth decel return." },
          { label: "Timing chain rattle / Misfire", points: -4, explanation: "Rattling noise on decel indicates loose timing chain guide.", negotiation_tip: "Deduct $1,200 for timing chain tensioner and guide replacement." },
          { label: "Turbo siren / Piston slap", points: -5, explanation: "High-pitched siren whistle or cold cylinder bore slap.", negotiation_tip: "Deduct $1,800 for turbocharger or cylinder evaluation." },
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
          { label: "Supple, ribbed, no cracks", points: 2, explanation: "Belt rubber is pliable with crisp grooves and zero dry rot." },
          { label: "Micro-cracks / dry rot", points: -2, explanation: "Belt ribs show micro-cracking (>3 cracks per inch).", negotiation_tip: "Deduct $150 for serpentine belt replacement." },
          { label: "Frayed edges / misaligned", points: -3, explanation: "Belt edges frayed due to misaligned pulley or worn tensioner.", negotiation_tip: "Deduct $350 for belt and automatic tensioner assembly." },
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
    title: "Underbody, Drivetrain & Suspension",
    short_title: "Underbody",
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
          { label: "Intact, supple, sealed", points: 2, explanation: "Accordion boots are supple and securely clamped with zero grease leakage." },
          { label: "Surface hairline checks", points: -1, explanation: "Minor superficial rubber surface weather checking; boot intact.", negotiation_tip: "Note aging rubber boots to monitor at next service." },
          { label: "Torn, slinging dark grease", points: -3, explanation: "CV boot split open, slinging grease onto wheel well and brake.", negotiation_tip: "Deduct $450 per side for front CV axle shaft replacement." },
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
          { label: "Clean, dry metal", points: 3, explanation: "Underside of oil pan and bellhousing are bone dry." },
          { label: "Minor oil seepage", points: -2, explanation: "Mild oil film accumulation around oil pan seal.", negotiation_tip: "Deduct $400 for oil pan gasket reseal." },
          { label: "Active dripping / wet casing", points: -5, explanation: "Active hanging droplets at rear main seal.", negotiation_tip: "Rear main seal requires transmission removal ($1,500). Demand deducted." },
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
          { label: "Clean paint / e-coat", points: 3, explanation: "Underbody rails show factory e-coat with zero structural corrosion." },
          { label: "Light surface patina", points: 0, explanation: "Minor cosmetic orange surface patina; structural metal is solid.", negotiation_tip: "Standard road patina; ask $100 for lanolin protectant." },
          { label: "Perforated rot / flaky rust", points: -10, is_walk: true, explanation: "Structural metal delamination or hole perforation in subframe.", negotiation_tip: "WALK AWAY. Severe structural safety hazard." },
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
          { label: "Dry shaft, firm dampening", points: 2, explanation: "Hydraulic strut piston shafts are mirror dry." },
          { label: "Hydraulic oil misting", points: -2, explanation: "Strut housing shows oil mist attracting road dirt.", negotiation_tip: "Deduct $550 for front strut pair replacement." },
          { label: "Wet dripping blown strut", points: -4, explanation: "Damper internal hydraulic seal blown with oil running down perch.", negotiation_tip: "Deduct $850 for front strut assemblies and alignment." },
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
    title: "Exterior, Structural & Tires",
    short_title: "Exterior",
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
          { label: "Uniform 3-4mm laser aligned", points: 2, explanation: "Body panel gaps are straight, parallel, and even (3-4mm)." },
          { label: "Minor uneven gap (5-6mm)", points: -2, explanation: "Fender gap widens near headlight from minor panel adjustment.", negotiation_tip: "Deduct $200 for body shop panel alignment." },
          { label: "Crooked / rubbing panels", points: -4, explanation: "Severe misalignment with hood rubbing fender, indicating structural repair.", negotiation_tip: "Demand a $2,000 accident history discount." },
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
          { label: "Factory spot welds & sealer", points: 3, explanation: "Core support and inner aprons show factory spot welds and OEM sealer." },
          { label: "Minor plastic clip broken", points: -1, explanation: "Upper plastic beauty cover has a missing fastener; metal structure intact.", negotiation_tip: "Minor cosmetic clip issue ($15)." },
          { label: "Kinked metal / aftermarket welds", points: -10, is_walk: true, explanation: "Crinkled sheet metal, clamp pull marks, or manual MIG weld beads.", negotiation_tip: "WALK AWAY. Severe structural unibody crash damage." },
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
          { label: "Consistent factory orange peel", points: 2, explanation: "Paint gloss and texture match factory standards with no tape lines." },
          { label: "Repainted panel / overspray", points: -2, explanation: "Slight clearcoat tape line on door jamb indicating prior respray.", negotiation_tip: "Deduct $300 for cosmetic blend and correction." },
          { label: "Heavy bondo mud / bubbling rust", points: -4, explanation: "Dull reflection with thick body filler and rust blisters emerging.", negotiation_tip: "Deduct $800 for rust repair and panel refinishing." },
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
          { label: "Even 6/32\"+ tread depth", points: 2, explanation: "Healthy, uniform tread depth (>6/32\") without abnormal shoulder wear." },
          { label: "Inner / outer shoulder bald", points: -3, explanation: "Inner tire shoulder worn to wear bars from negative camber or toe issue.", negotiation_tip: "Deduct $650 for two new front tires and alignment." },
          { label: "Severe dry rot / sidewall bubble", points: -4, explanation: "Impact bubble in tire sidewall indicating imminent blowout danger.", negotiation_tip: "Deduct $800 for full set of replacement tires." },
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
    title: "Cabin, OBD-II & Road Test",
    short_title: "Road Test",
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
          { label: "Clear / brief water vapor", points: 2, explanation: "Exhaust is clear with brief normal cold water vapor." },
          { label: "Black sooty / rich mixture", points: -3, explanation: "Black carbon smoke on acceleration indicating rich fuel mixture.", negotiation_tip: "Deduct $400 for fuel system diagnosis and O2 sensor." },
          { label: "Blue puff / oil consumption", points: -10, is_walk: true, explanation: "Bluish-grey oil smoke on cold startup indicating worn valve seals/rings.", negotiation_tip: "WALK AWAY. Internal engine oil burning ($3,000+ rebuild)." },
          { label: "Billowing sweet white smoke", points: -10, is_walk: true, explanation: "Thick sweet-smelling white smoke proving coolant burning in cylinders.", negotiation_tip: "WALK AWAY IMMEDIATELY. Blown head gasket or cracked head." },
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
          { label: "All bulbs self-test & extinguish", points: 3, explanation: "All warning lamps illuminate on test and extinguish when running." },
          { label: "TPMS / minor maintenance lamp", points: -1, explanation: "Tire pressure monitoring lamp or oil service reminder on.", negotiation_tip: "Request $75 credit for TPMS sensor replacement." },
          { label: "ABS / Airbag SRS light ON", points: -4, explanation: "SRS airbag or ABS safety fault lamp illuminated.", negotiation_tip: "Deduct $650 for safety restraint module diagnosis and repair." },
          { label: "Check Engine Light ON", points: -5, explanation: "Malfunction Indicator Lamp illuminated with active ECU DTC codes.", negotiation_tip: "Demand $800 - $1,500 deduction for OBD-II emission diagnostic and repairs." },
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
          { label: "Crisp, immediate lock-in (<0.5s)", points: 2, explanation: "Transmission shifts into Drive and Reverse smoothly in under 0.5s." },
          { label: "Slight hesitation (1.0s)", points: -2, explanation: "Mild hydraulic delay before reverse catches.", negotiation_tip: "Deduct $250 for transmission fluid and filter exchange." },
          { label: "Hard violent clunk / slipping delay", points: -5, explanation: "2+ second engagement lag followed by harsh violent clunk into gear.", negotiation_tip: "Deduct $2,500 - $4,000 for transmission overhaul or walk away." },
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
          { label: "Sub-45°F A/C & boiling heat", points: 2, explanation: "A/C vent delivers rapid temp under 45°F; heater blows strong hot air." },
          { label: "Slow cooling (55°F)", points: -2, explanation: "A/C takes several minutes and only reaches 55°F.", negotiation_tip: "Deduct $200 for A/C system evacuation and recharge." },
          { label: "Hot air only / Compressor dead", points: -4, explanation: "A/C blows ambient/hot air with clutch not engaging.", negotiation_tip: "Deduct $900 for A/C compressor and condenser replacement." },
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

interface WalkAwayReason {
  componentName: string;
  explanation: string;
}

interface InspectionState {
  vehicle: VehicleProfile;
  stations: Station[];
  activeStationId: string;
  
  // Modals & Active Targets
  activeCaptureItemId: string | null;
  cameraModalOpen: boolean;
  audioModalOpen: boolean;
  walkAwayModalOpen: boolean;
  walkAwayReason: WalkAwayReason | null;
  reportModalOpen: boolean;
  vehicleEditModalOpen: boolean;

  // Actions
  updateVehicle: (patch: Partial<VehicleProfile>) => void;
  setActiveStation: (stationId: string) => void;
  openCameraModal: (itemId: string) => void;
  closeCameraModal: () => void;
  openAudioModal: (itemId: string) => void;
  closeAudioModal: () => void;
  openWalkAwayModal: (componentName: string, explanation: string) => void;
  closeWalkAwayModal: () => void;
  setReportModalOpen: (open: boolean) => void;
  setVehicleEditModalOpen: (open: boolean) => void;

  // Result Mutators
  updateItemResult: (
    itemId: string,
    data: {
      finding_category: string;
      points: number;
      is_walk_condition: boolean;
      explanation?: string;
      negotiation_tip?: string | null;
      confidence?: number;
      media_preview_url?: string;
      audio_result?: AudioInspectionResult;
      visual_result?: VisualInspectionResult;
    }
  ) => void;

  quickScoreItem: (itemId: string, opt: RubricOption) => void;
  resetChecklist: () => void;
  loadDemoScenario: (scenario: "clean_pass" | "blown_head_gasket" | "rod_knock" | "high_negotiation") => void;

  // Computed Selectors
  getAllItems: () => ChecklistItem[];
  getTotalPoints: () => number;
  hasWalkAwayCondition: () => boolean;
  getWalkConditions: () => ChecklistItem[];
  getCompletedCount: () => number;
  getProgressPercentage: () => number;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set, get) => ({
      vehicle: INITIAL_VEHICLE,
      stations: INITIAL_STATIONS,
      activeStationId: "station_1",
      
      activeCaptureItemId: null,
      cameraModalOpen: false,
      audioModalOpen: false,
      walkAwayModalOpen: false,
      walkAwayReason: null,
      reportModalOpen: false,
      vehicleEditModalOpen: false,

      updateVehicle: (patch) =>
        set((state) => ({ vehicle: { ...state.vehicle, ...patch } })),

      setActiveStation: (stationId) => set({ activeStationId: stationId }),

      openCameraModal: (itemId) =>
        set({ activeCaptureItemId: itemId, cameraModalOpen: true }),
      closeCameraModal: () =>
        set({ activeCaptureItemId: null, cameraModalOpen: false }),

      openAudioModal: (itemId) =>
        set({ activeCaptureItemId: itemId, audioModalOpen: true }),
      closeAudioModal: () =>
        set({ activeCaptureItemId: null, audioModalOpen: false }),

      openWalkAwayModal: (componentName, explanation) =>
        set({
          walkAwayModalOpen: true,
          walkAwayReason: { componentName, explanation },
        }),
      closeWalkAwayModal: () =>
        set({ walkAwayModalOpen: false, walkAwayReason: null }),

      setReportModalOpen: (open) => set({ reportModalOpen: open }),
      setVehicleEditModalOpen: (open) => set({ vehicleEditModalOpen: open }),

      updateItemResult: (itemId, data) => {
        set((state) => ({
          stations: state.stations.map((st) => ({
            ...st,
            items: st.items.map((it) => {
              if (it.id === itemId) {
                return {
                  ...it,
                  status: "inspected" as const,
                  finding_category: data.finding_category,
                  points: data.points,
                  is_walk_condition: data.is_walk_condition,
                  explanation: data.explanation || it.explanation,
                  negotiation_tip: data.negotiation_tip !== undefined ? data.negotiation_tip : it.negotiation_tip,
                  confidence: data.confidence,
                  media_preview_url: data.media_preview_url || it.media_preview_url,
                  audio_result: data.audio_result,
                  visual_result: data.visual_result,
                  last_inspected_at: new Date().toISOString(),
                };
              }
              return it;
            }),
          })),
        }));
      },

      quickScoreItem: (itemId, opt) => {
        set((state) => ({
          stations: state.stations.map((st) => ({
            ...st,
            items: st.items.map((it) => {
              if (it.id === itemId) {
                return {
                  ...it,
                  status: "inspected" as const,
                  finding_category: opt.label,
                  points: opt.points,
                  is_walk_condition: !!opt.is_walk,
                  explanation: opt.explanation || `Recorded ${opt.label}`,
                  negotiation_tip: opt.negotiation_tip || null,
                  last_inspected_at: new Date().toISOString(),
                };
              }
              return it;
            }),
          })),
        }));
      },

      resetChecklist: () => {
        set({
          stations: INITIAL_STATIONS,
          activeStationId: "station_1",
          activeCaptureItemId: null,
          cameraModalOpen: false,
          audioModalOpen: false,
          walkAwayModalOpen: false,
          walkAwayReason: null,
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
                  explanation: opt.explanation || `Inspected ${it.title} in clean condition.`,
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
                  explanation: opt.explanation || `Inspected ${it.title} in standard condition.`,
                  negotiation_tip: null,
                  confidence: 0.94,
                  last_inspected_at: new Date().toISOString(),
                };
              } else if (scenario === "rod_knock") {
                if (it.id === "s2_audio_idle") {
                  return {
                    ...it,
                    status: "inspected" as const,
                    finding_category: "Rod knock / Bearing failure",
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
                  explanation: opt.explanation || `Inspected ${it.title} in standard condition.`,
                  negotiation_tip: null,
                  confidence: 0.92,
                  last_inspected_at: new Date().toISOString(),
                };
              } else {
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
                  explanation: opt.explanation || `Inspected ${it.title} in acceptable condition.`,
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
            walkAwayModalOpen: hasWalk,
            walkAwayReason: walkItem
              ? { componentName: walkItem.title, explanation: walkItem.explanation || "" }
              : null,
          };
        });
      },

      getAllItems: () => get().stations.flatMap((s) => s.items),
      getTotalPoints: () =>
        get()
          .getAllItems()
          .filter((i) => i.status === "inspected")
          .reduce((sum, i) => sum + i.points, 0),
      hasWalkAwayCondition: () =>
        get()
          .getAllItems()
          .some((i) => i.status === "inspected" && i.is_walk_condition),
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
    }),
    {
      name: "car-inspect-store-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
