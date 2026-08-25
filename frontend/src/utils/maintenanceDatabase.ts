import { MaintenanceTask } from "../types/inspection";

export const CAR_CARE_NUT_MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: "engine_oil_filter",
    title: "Full Synthetic Engine Oil & OEM Filter",
    category: "fluids",
    interval_miles: 5000,
    interval_months: 6,
    is_diy_friendly: true,
    diy_difficulty: "Easy",
    why_it_matters:
      "The Car Care Nut rule: Modern engines use low-tension piston oil control rings. 10,000-mile factory intervals cause micro-varnish buildup that gums up the rings, leading to heavy oil burning ($4,000+ rebuild). 5,000 miles (3,000 for turbos) keeps the oil control rings clean forever.",
    oem_spec_note: "Always use OEM filters (Toyota Genuine/Denso) with anti-drainback valves and 0W-20 / 0W-16 full synthetic meeting API SP/ILSAC GF-6.",
    video_search_query: "the car care nut why 5000 mile oil changes matter toyota",
    pro_vs_diy_advice: "DIY Friendly. Use ramps, wheel chocks, a 14mm wrench, and a proper filter housing socket. Torque drain plug to 30 ft-lbs with a new crush washer.",
    step_by_step_summary: [
      "Warm engine to operating temperature, then shut off and raise front on ramps.",
      "Remove 14mm oil pan drain bolt and catch 5-6 quarts of warm oil.",
      "Replace drain plug crush washer (blue fiber/aluminum) and torque to 30 ft-lbs.",
      "Remove oil filter housing, replace large rubber O-ring, and install OEM filter cartridge.",
      "Refill with exact capacity of 0W-20 / 0W-16 full synthetic and check dipstick."
    ]
  },
  {
    id: "transmission_fluid",
    title: "Transmission Fluid Drain & Fill (WS / CVT)",
    category: "fluids",
    interval_miles: 60000,
    interval_months: 72,
    is_diy_friendly: true,
    diy_difficulty: "Moderate",
    why_it_matters:
      "Dealer 'lifetime fluid' is a myth designed for lease warranties. Transmission fluid undergoes thermal shear and friction material breakdown. A drain-and-fill every 60,000 miles (6 years) prevents shudder, slipping, and valve body failure ($5,000+ overhaul). Never perform a high-pressure flush.",
    oem_spec_note: "Use ONLY OEM fluid (e.g. Toyota Genuine ATF WS or FE CVT). Never use universal aftermarket multi-vehicle fluids.",
    video_search_query: "the car care nut should you change lifetime transmission fluid",
    pro_vs_diy_advice: "Intermediate DIY. Modern transmissions lack dipsticks and require checking fluid level via overflow tube at 104°F–113°F (40°C–45°C) with scan tool or jumper pin.",
    step_by_step_summary: [
      "Ensure car is 100% level on 4 jack stands.",
      "Remove transmission drain plug and 6mm plastic overflow straw; measure exact drained volume (usually 2.5 - 3.5 qts).",
      "Reinstall overflow straw and drain plug with new aluminum gasket.",
      "Refill exact drained amount + 0.5 qt extra through fill plug using fluid pump.",
      "Start engine, shift through P-R-N-D, monitor trans temp to 104°F, then pull overflow plug to drain excess until a light trickle."
    ]
  },
  {
    id: "brake_fluid_flush",
    title: "Hydraulic Brake Fluid Flush & Bleed",
    category: "fluids",
    interval_miles: 30000,
    interval_months: 36,
    is_diy_friendly: true,
    diy_difficulty: "Moderate",
    why_it_matters:
      "Brake fluid is hygroscopic and naturally absorbs atmospheric water vapor through microscopic rubber hose pores. Over 2-3 years, moisture content exceeds 3%, dropping the boiling point (causing brake fade) and rusting expensive ABS hydraulic actuator valves ($2,000+ repair).",
    oem_spec_note: "Use fresh, sealed container of OEM DOT 3 or DOT 4 fluid.",
    video_search_query: "the car care nut how to change brake fluid properly",
    pro_vs_diy_advice: "DIY with a one-person pressure bleeder (Motive) or vacuum bleeder. Hybrid vehicles (Prius/Highlander Hybrid) require an OBD-II scan tool (Techstream) to disable ABS pump before bleeding.",
    step_by_step_summary: [
      "Suck old dark fluid out of master cylinder reservoir using a syringe.",
      "Refill master cylinder to max line with fresh transparent DOT 3/4 fluid.",
      "Bleed calipers in order: Rear-Right → Rear-Left → Front-Right → Front-Left.",
      "Flush until fluid runs crystal clear without air bubbles at each bleeder nipple.",
      "Check pedal firmness and verify zero leaks around bleeder screws."
    ]
  },
  {
    id: "coolant_drain_fill",
    title: "Engine & Inverter Coolant (Super Long Life)",
    category: "fluids",
    interval_miles: 50000,
    interval_months: 60,
    is_diy_friendly: true,
    diy_difficulty: "Easy",
    why_it_matters:
      "Coolant anti-corrosion additives deplete over 5 years. Degraded coolant becomes acidic, corroding the aluminum radiator, cylinder head gaskets, and electric water pump bearings ($800–$1,500 replacement).",
    oem_spec_note: "Use 50/50 pre-diluted Pink Super Long Life Coolant (SLLC) with organic acid technology (OAT). Never mix with generic green coolant.",
    video_search_query: "the car care nut coolant drain and fill tutorial",
    pro_vs_diy_advice: "DIY Friendly. Open radiator petcock and engine block drain plugs into a clean catch pan. Use a spill-free funnel to burp air pockets.",
    step_by_step_summary: [
      "Ensure engine is completely cold before removing radiator / reservoir cap.",
      "Open bottom radiator petcock valve and drain ~5-6 quarts of coolant.",
      "Close petcock snug (do not overtighten plastic threads).",
      "Attach a no-spill funnel to radiator neck, fill with fresh 50/50 Pink SLLC.",
      "Run engine with heater on high to open thermostat, squeeze upper radiator hose to purge trapped air bubbles."
    ]
  },
  {
    id: "differential_transfer_case",
    title: "Transfer Case & Rear Differential Gear Oil",
    category: "fluids",
    interval_miles: 30000,
    interval_months: 36,
    is_diy_friendly: true,
    diy_difficulty: "Easy",
    why_it_matters:
      "AWD and 4WD vehicles carry less than 1 quart of gear oil in the rear differential and transfer case. High hypoid gear friction shears the oil rapidly. Changing every 30k-60k miles prevents expensive whining gear whine and bearing destruction ($2,500+ replacement).",
    oem_spec_note: "GL-5 75W-85 or 75W-90 synthetic hypoid gear oil with crush washers.",
    video_search_query: "the car care nut how to change differential fluid transfer case",
    pro_vs_diy_advice: "Easy DIY. Golden Rule: ALWAYS remove the FILL plug FIRST before removing the drain plug so you never drain a diff you cannot refill!",
    step_by_step_summary: [
      "Always break loose and remove the upper FILL plug first.",
      "Remove bottom DRAIN plug (often magnetic) and wipe clean metal shavings.",
      "Install drain plug with fresh crush washer; torque to 29 ft-lbs.",
      "Use fluid hand pump to inject 75W-85 gear oil into fill hole until fluid begins weeping out.",
      "Reinstall fill plug with new crush washer and torque to spec."
    ]
  },
  {
    id: "pcv_valve",
    title: "PCV Valve (Positive Crankcase Ventilation)",
    category: "mechanical",
    interval_miles: 60000,
    interval_months: 60,
    is_diy_friendly: true,
    diy_difficulty: "Easy",
    why_it_matters:
      "The #1 most overlooked maintenance part! A clogged PCV valve traps blow-by combustion gases inside the crankcase, causing high internal pressure that blows out your valve cover gaskets, rear main seal, and timing cover seams ($1,500+ leaks).",
    oem_spec_note: "OEM Toyota/Denso metal threaded PCV valve (~$15 part).",
    video_search_query: "the car care nut pcv valve replacement why it causes oil leaks",
    pro_vs_diy_advice: "Easy DIY. Takes 15 minutes with a 19mm or 22mm deep socket and needle nose pliers. Shake the old valve—if it doesn't click sharply, it was clogged.",
    step_by_step_summary: [
      "Locate PCV valve on rear or side of valve cover.",
      "Squeeze spring hose clamp and disconnect rubber vacuum hose (replace hose if brittle).",
      "Unthread PCV valve using deep socket.",
      "Thread in new OEM PCV valve with light thread sealant and snug gently (do not over-torque aluminum threads).",
      "Reconnect vacuum hose and secure clamp."
    ]
  },
  {
    id: "spark_plugs",
    title: "OEM Iridium Spark Plugs Replacement",
    category: "mechanical",
    interval_miles: 100000,
    interval_months: 84,
    is_diy_friendly: true,
    diy_difficulty: "Moderate",
    why_it_matters:
      "Worn spark plug electrodes widen the spark gap, forcing the ignition coils to work twice as hard and causing misfires, unburnt fuel washing cylinder walls, and catalytic converter damage ($1,800 replacement).",
    oem_spec_note: "Denso Iridium Long Life (SK20R11 / FK20HR11) or NGK Laser Iridium. Beware of counterfeit Amazon/eBay spark plugs—buy from dealer or certified distributor.",
    video_search_query: "the car care nut spark plug replacement fake spark plugs",
    pro_vs_diy_advice: "Moderate DIY on 4-cylinder engines (very easy). On transverse V6 engines, rear bank plugs require moving the upper intake plenum or using flexible swivel extensions.",
    step_by_step_summary: [
      "Disconnect battery negative terminal.",
      "Unclip ignition coil connectors and remove 10mm coil hold-down bolts.",
      "Pull ignition coils straight out and inspect boots for engine oil seepage.",
      "Use a 5/8\" magnetic spark plug socket with extensions to remove old plugs.",
      "Thread new pre-gapped OEM plugs by hand, torque to 15 ft-lbs (never use anti-seize on modern nickel-coated plugs)."
    ]
  },
  {
    id: "rustproofing_lanolin",
    title: "Annual Lanolin Rustproofing Undercoating (Fluid Film / Woolwax)",
    category: "preservation",
    interval_miles: 12000,
    interval_months: 12,
    is_diy_friendly: true,
    diy_difficulty: "Moderate",
    why_it_matters:
      "Road salt and brine eat unibody frames, subframes, brake lines, and rocker panels from the INSIDE out. Hard rubberized undercoatings trap moisture and cause hidden rot. Lanolin-based coatings (Fluid Film/Woolwax) never dry, self-heal, and displace moisture permanently, adding 10+ years to vehicle lifespan.",
    oem_spec_note: "Fluid Film Black or Woolwax Clear/Black with 360-degree extension wand.",
    video_search_query: "the car care nut rust prevention fluid film frame protection",
    pro_vs_diy_advice: "DIY Friendly every Autumn. Spray inside frame holes, subframe crossmembers, door bottom drains, and rocker panel plugs. Avoid spraying directly on hot exhaust or oxygen sensors.",
    step_by_step_summary: [
      "Wash vehicle undercarriage thoroughly and let dry completely for 24 hours.",
      "Wire-brush any existing loose surface oxidation.",
      "Insert 360-degree flexible extension wand into frame rail access holes, rocker panels, and tailgate/door drain slots.",
      "Spray generous coat along suspension control arms, subframe cradles, and fuel/brake hard lines.",
      "Avoid spraying directly on exhaust catalytic converter, brakes, and serpentine belts."
    ]
  },
  {
    id: "detailing_paint_protection",
    title: "Paint Decontamination & Ceramic Sealant Protection",
    category: "detailing",
    interval_miles: 6000,
    interval_months: 6,
    is_diy_friendly: true,
    diy_difficulty: "Easy",
    why_it_matters:
      "Industrial fallout, brake dust, and acid rain embed into the clearcoat. Automatic car washes with dirty brushes scratch the paint, destroying gloss and causing clearcoat failure. A 6-month decontamination and ceramic spray sealant preserves maximum private-party resale value.",
    oem_spec_note: "pH-neutral car shampoo, Iron remover spray, synthetic clay mitt, and SiO2 Ceramic Spray Sealant.",
    video_search_query: "how to wash car properly two bucket method ceramic spray",
    pro_vs_diy_advice: "DIY Friendly. Use the 2-Bucket Method with grit guards to avoid micro-swirl scratches. For heavy paint correction / rotary machine polishing, hire a certified detailer.",
    step_by_step_summary: [
      "Two-bucket wash with microfiber wash mitt and grit guards to lift road dirt without scratching.",
      "Spray iron fallout decontaminator on wet paint (turns purple dissolving brake dust) and rinse.",
      "Glide synthetic clay mitt with soapy lubrication over paint to remove rough bonded contaminants.",
      "Dry with plush microfiber drying towel.",
      "Apply SiO2 ceramic spray sealant panel-by-panel and buff to mirror shine (6-month hydrophobic UV barrier)."
    ]
  },
  {
    id: "honda_timing_belt_water_pump",
    title: "Honda J35 Timing Belt, Water Pump & Hydraulic Tensioner",
    category: "mechanical",
    interval_miles: 105000,
    interval_months: 84,
    is_diy_friendly: false,
    diy_difficulty: "Advanced",
    why_it_matters:
      "CRITICAL: The Honda Odyssey 3.5L J35 is an interference engine. If the rubber timing belt snaps or the hydraulic tensioner leaks, valves will smash into pistons, causing catastrophic engine destruction ($5,000+). Replace every 105,000 miles or 7 years without fail.",
    oem_spec_note: "OEM Aisin Timing Belt Kit (TKH-002) with Mitsuboshi belt, Koyo idler pulleys, and Aisin water pump.",
    video_search_query: "honda odyssey 3.5 j35 timing belt water pump replacement aisin",
    pro_vs_diy_advice: "Advanced DIY / Professional Recommended. Requires 19mm heavy-duty harmonic balancer socket, cam holding tool, and precise crankshaft TDC alignment.",
    step_by_step_summary: [
      "Remove front passenger wheel, splash shield, and engine mount bracket.",
      "Use high-mass 19mm socket and impact wrench to break free tight crankshaft pulley bolt.",
      "Align crankshaft and both camshaft sprockets to exact Top Dead Center (TDC) timing marks.",
      "Remove old hydraulic tensioner, water pump, and idler pulleys.",
      "Install new Aisin water pump with fresh gasket, bolt in new pulleys, route Mitsuboshi timing belt matching factory marks, and pull tensioner grenade pin."
    ]
  },
  {
    id: "honda_atf_dw1",
    title: "Honda DW-1 ATF Transmission Fluid (Drain & Fill)",
    category: "fluids",
    interval_miles: 30000,
    interval_months: 36,
    is_diy_friendly: true,
    diy_difficulty: "Easy",
    why_it_matters:
      "Honda automatic transmissions rely on unique friction modifiers in Genuine Honda ATF DW-1. Changing fluid every 30,000 miles (drain and fill ~3.5 quarts) prevents torque converter judder, harsh 2-3 shifting, and clutch plate wear.",
    oem_spec_note: "Genuine Honda ATF DW-1 only. Never use generic multi-vehicle fluid.",
    video_search_query: "honda odyssey transmission fluid change drain and fill dw1",
    pro_vs_diy_advice: "Easy DIY. Use a 3/8\" ratchet drive directly into the drain plug square hole. Clean magnetic drain plug and refill 3.3 quarts through upper fill hole.",
    step_by_step_summary: [
      "Warm transmission by driving 5 minutes, then park on level ground.",
      "Insert 3/8\" ratchet square head into bottom transmission drain bolt and drain ~3.3 quarts.",
      "Wipe clean fine metal paste from magnetic drain plug, install new 18mm aluminum crush washer, and torque to 36 ft-lbs.",
      "Remove upper transmission fill plug (17mm bolt) or dipstick tube.",
      "Use long transmission funnel to refill exactly 3.3–3.5 quarts of Genuine Honda ATF DW-1."
    ]
  },
  {
    id: "weatherstrip_interior_preservation",
    title: "Rubber Weatherstrip & Interior UV Preservation",
    category: "detailing",
    interval_miles: 6000,
    interval_months: 6,
    is_diy_friendly: true,
    diy_difficulty: "Easy",
    why_it_matters:
      "Door rubber weatherstrips dry out and crack from ozone and UV exposure, causing wind noise, water leaks, and frozen shut doors in winter. Sun destroys dashboard plastics and leather seats. Proper conditioning keeps the cabin whisper quiet and like-new.",
    oem_spec_note: "100% Pure Silicone Grease (Shin-Etsu Grease) for rubber weatherstrips; matte aerospace UV protectant (303 Aerospace) for dashboard/plastics.",
    video_search_query: "how to condition car door weatherstrips shin etsu grease",
    pro_vs_diy_advice: "10-minute DIY. Apply a pea-sized dab of silicone grease to all door, sunroof, and trunk rubber seals with a microfiber towel.",
    step_by_step_summary: [
      "Wipe all door, hood, and trunk rubber perimeter seals with a damp microfiber cloth to remove dirt.",
      "Massage a small amount of pure silicone grease / Shin-Etsu grease into the rubber gaskets.",
      "Let absorb for 15 minutes, then wipe excess (restores deep black suppleness and stops wind noise).",
      "Apply matte UV protectant (303 Aerospace) to dashboard, console, and door panels.",
      "Clean leather seats with pH-neutral leather cleaner and conditioner."
    ]
  }
];
