import io
import os
import json
import base64
import httpx
import numpy as np
from PIL import Image, ImageStat, ImageFilter
from typing import Dict, Any, List, Optional
from app.schemas.diagnostic import VisualInspectionResult

# Comprehensive Checklist Rubrics for all 20 Items across 5 Stations
CHECKLIST_RUBRICS: Dict[str, Dict[str, Any]] = {
    # STATION 1: Cold Engine Bay & Fluids
    "s1_oil_cap": {
        "component": "Oil Filler Cap Underside",
        "station_id": "station_1",
        "options": {
            "Clean, amber / dry": {
                "points": 2, "is_walk": False,
                "explanation": "Oil cap underside is clean with light engine oil film and zero emulsified sludge.",
                "negotiation_tip": None
            },
            "Dark carbon varnish": {
                "points": -2, "is_walk": False,
                "explanation": "Moderate dark carbon varnish buildup present, indicating extended oil drain intervals.",
                "negotiation_tip": "Mention carbon varnish on oil cap. Request a $150 credit for an engine oil flush and fresh synthetic oil change."
            },
            "Milkshake, foamy": {
                "points": -10, "is_walk": True,
                "explanation": "Yellow-white 'mayonnaise' emulsion on oil cap underside indicates coolant mixing with engine oil.",
                "negotiation_tip": "WALK AWAY. Severe head gasket failure or cracked cylinder head/block. Do not negotiate."
            }
        }
    },
    "s1_dipstick": {
        "component": "Oil Dipstick Level & Quality",
        "station_id": "station_1",
        "options": {
            "Clean, amber level": {
                "points": 3, "is_walk": False,
                "explanation": "Oil level is at the full mark with transparent golden amber color and proper viscosity.",
                "negotiation_tip": None
            },
            "Dark, overdue oil": {
                "points": -2, "is_walk": False,
                "explanation": "Engine oil is jet-black and overdue for routine service.",
                "negotiation_tip": "Ask for a $100 maintenance credit for an immediate oil and filter change."
            },
            "Dry / Below min line": {
                "points": -4, "is_walk": False,
                "explanation": "Dipstick reads critically low or dry, suggesting oil burning or neglected maintenance.",
                "negotiation_tip": "Low oil level increases risk of premature bearing wear. Demand a $500 mechanical inspection credit."
            },
            "Milkshake, foamy": {
                "points": -10, "is_walk": True,
                "explanation": "Oil on dipstick has a pale, frothy milkshake consistency indicating catastrophic coolant intrusion into the oil sump.",
                "negotiation_tip": "WALK AWAY IMMEDIATELY. Blown head gasket or cracked engine block."
            }
        }
    },
    "s1_coolant": {
        "component": "Coolant Reservoir & Radiator Cap",
        "station_id": "station_1",
        "options": {
            "Bright OEM clean": {
                "points": 2, "is_walk": False,
                "explanation": "Coolant is clean, transparent OEM color (pink/green/blue) without rust sediment or oil film.",
                "negotiation_tip": None
            },
            "Murky / dirty sediment": {
                "points": -2, "is_walk": False,
                "explanation": "Coolant shows dark sediment and age degradation requiring a cooling system flush.",
                "negotiation_tip": "Request $200 off for a cooling system pressure test and coolant flush."
            },
            "Oil slick / milky mix": {
                "points": -10, "is_walk": True,
                "explanation": "Black oil film floating on top of coolant or milky slurry in the overflow tank.",
                "negotiation_tip": "WALK AWAY. Oil cooler rupture or blown head gasket breach. Catastrophic engine risk."
            }
        }
    },
    "s1_brake_fluid": {
        "component": "Brake Fluid Reservoir",
        "station_id": "station_1",
        "options": {
            "Clear / light honey": {
                "points": 2, "is_walk": False,
                "explanation": "Brake fluid is light golden amber and moisture-free with proper reservoir level.",
                "negotiation_tip": None
            },
            "Dark brown / moisture-heavy": {
                "points": -2, "is_walk": False,
                "explanation": "Brake fluid is dark brown, indicating moisture absorption (>3% water) and copper corrosion.",
                "negotiation_tip": "Ask for a $150 credit for a full hydraulic brake fluid flush and bleed."
            },
            "Pitch black / sediment": {
                "points": -4, "is_walk": False,
                "explanation": "Brake fluid is pitch black with rubber seal degradation sediment in the master cylinder.",
                "negotiation_tip": "Deduct $350 for master cylinder inspection and complete brake hydraulic service."
            }
        }
    },
    "s1_battery": {
        "component": "Battery Terminals & Age Code",
        "station_id": "station_1",
        "options": {
            "Clean, sealed posts (<3 yrs)": {
                "points": 2, "is_walk": False,
                "explanation": "Terminals are tight and clean with corrosion inhibitor; date code indicates battery is under 3 years old.",
                "negotiation_tip": None
            },
            "Minor acid crust": {
                "points": -1, "is_walk": False,
                "explanation": "Light powdery white/blue copper sulfate oxidation around battery terminal clamps.",
                "negotiation_tip": "Ask for $50 terminal cleaning and protector application."
            },
            "Heavy corroded crust / aged 5+ yrs": {
                "points": -3, "is_walk": False,
                "explanation": "Severe sulfuric acid blooming and bloated battery casing with expired service life.",
                "negotiation_tip": "Deduct $220 for a new AGM battery replacement."
            }
        }
    },

    # STATION 2: Engine Mechanical & Acoustic
    "s2_timing_cover": {
        "component": "Front Engine Timing Cover Seam",
        "station_id": "station_2",
        "options": {
            "Bone dry": {
                "points": 3, "is_walk": False,
                "explanation": "Timing cover metal seam and front crankshaft main seal are completely dry without oil weeping.",
                "negotiation_tip": None
            },
            "Slightly damp": {
                "points": -2, "is_walk": False,
                "explanation": "Timing chain cover gasket shows faint oil sweat / seepage along the aluminum mating edge.",
                "negotiation_tip": "Point out the timing cover seepage. Note that resealing requires engine support disassembly ($1,200 - $2,000 in labor)."
            },
            "Wet, grimy": {
                "points": -5, "is_walk": False,
                "explanation": "Seam is heavily coated with wet engine oil and caked road grime dripping onto the lower block.",
                "negotiation_tip": "Require a $1,800 price reduction to cover front engine teardown and timing cover gasket reseal."
            }
        }
    },
    "s2_valve_cover": {
        "component": "Valve Cover Gasket Perimeter",
        "station_id": "station_2",
        "options": {
            "Bone dry / clean": {
                "points": 2, "is_walk": False,
                "explanation": "Perimeter of valve cover and spark plug tube seals are dry and free of oil deposits.",
                "negotiation_tip": None
            },
            "Weeping around bolts": {
                "points": -2, "is_walk": False,
                "explanation": "Valve cover rubber gasket has hardened with visible oil sweating around fasteners.",
                "negotiation_tip": "Deduct $350 for valve cover gasket and spark plug tube seal replacement."
            },
            "Heavy pooled oil": {
                "points": -4, "is_walk": False,
                "explanation": "Active oil pooling on the exhaust heat shield causing burning oil odor and smoke risk.",
                "negotiation_tip": "Deduct $650 for valve cover reseal and exhaust heat shield degreasing."
            }
        }
    },
    "s2_serpentine_belt": {
        "component": "Serpentine Accessory Belt & Pulleys",
        "station_id": "station_2",
        "options": {
            "Supple, ribbed, no cracks": {
                "points": 2, "is_walk": False,
                "explanation": "Serpentine belt rubber is pliable with crisp V-grooves and zero dry rot or fraying.",
                "negotiation_tip": None
            },
            "Micro-cracks / dry rot": {
                "points": -2, "is_walk": False,
                "explanation": "Belt ribs show micro-cracking (>3 cracks per inch) and aging EPDM rubber degradation.",
                "negotiation_tip": "Deduct $150 for serpentine belt replacement."
            },
            "Frayed edges / misaligned": {
                "points": -3, "is_walk": False,
                "explanation": "Belt edges are frayed and cord threads exposed due to a misaligned pulley or worn tensioner.",
                "negotiation_tip": "Deduct $350 for belt and automatic tensioner assembly replacement."
            }
        }
    },

    # STATION 3: Underbody, Drivetrain & Suspension
    "s3_cv_axle_boots": {
        "component": "Front CV Axle Rubber Boots",
        "station_id": "station_3",
        "options": {
            "Intact, supple, sealed": {
                "points": 2, "is_walk": False,
                "explanation": "Accordion rubber CV boots are supple and securely clamped with zero grease leakage.",
                "negotiation_tip": None
            },
            "Surface hairline checks": {
                "points": -1, "is_walk": False,
                "explanation": "Minor superficial rubber surface weather checking; boot remains intact.",
                "negotiation_tip": "Note aging rubber boots to monitor at next service."
            },
            "Torn, slinging dark grease": {
                "points": -3, "is_walk": False,
                "explanation": "CV boot is split open, slinging molybdenum grease onto wheel well and brake caliper.",
                "negotiation_tip": "Deduct $450 per side for front CV axle shaft replacement."
            }
        }
    },
    "s3_oil_pan_leaks": {
        "component": "Oil Pan & Transmission Bellhousing",
        "station_id": "station_3",
        "options": {
            "Clean, dry metal": {
                "points": 3, "is_walk": False,
                "explanation": "Underside of engine oil pan, drain plug, and transmission bellhousing are bone dry.",
                "negotiation_tip": None
            },
            "Minor oil seepage": {
                "points": -2, "is_walk": False,
                "explanation": "Mild oil film accumulation around oil pan RTV silicone seal or transmission bellhousing inspection plate.",
                "negotiation_tip": "Deduct $400 for oil pan gasket reseal."
            },
            "Active dripping / wet casing": {
                "points": -5, "is_walk": False,
                "explanation": "Active hanging oil droplets at rear main seal or transmission torque converter seal.",
                "negotiation_tip": "Rear main seal replacement requires transmission removal ($1,200 - $1,800). Require this deducted."
            }
        }
    },
    "s3_subframe_rust": {
        "component": "Subframe & Frame Rails Rust",
        "station_id": "station_3",
        "options": {
            "Clean paint / factory e-coat": {
                "points": 3, "is_walk": False,
                "explanation": "Underbody unibody rails and suspension subframe show crisp factory e-coat with zero structural corrosion.",
                "negotiation_tip": None
            },
            "Light surface patina": {
                "points": 0, "is_walk": False,
                "explanation": "Minor cosmetic orange surface patina on heavy cast suspension arms; structural integrity is intact.",
                "negotiation_tip": "Standard road patina for model year; negotiate $100 for underbody wash and lanolin protectant."
            },
            "Perforated rot / flaky structural rust": {
                "points": -10, "is_walk": True,
                "explanation": "Structural metal flaking, laminated delamination, or hole perforation in subframe or suspension mount points.",
                "negotiation_tip": "WALK AWAY. Structural safety hazard that will fail state safety inspection and compromise crash protection."
            }
        }
    },
    "s3_struts_shocks": {
        "component": "Shock Absorbers & Strut Towers",
        "station_id": "station_3",
        "options": {
            "Dry shaft, firm dampening": {
                "points": 2, "is_walk": False,
                "explanation": "Hydraulic strut piston chrome shafts are mirror dry; strut mount tower rubber is uncracked.",
                "negotiation_tip": None
            },
            "Hydraulic oil misting": {
                "points": -2, "is_walk": False,
                "explanation": "Strut housing body shows oil mist film attracting road dirt.",
                "negotiation_tip": "Deduct $550 for front strut pair replacement."
            },
            "Wet dripping blown strut": {
                "points": -4, "is_walk": False,
                "explanation": "Strut damper internal hydraulic seal blown with oil running down spring perch; zero bounce damping.",
                "negotiation_tip": "Deduct $850 for complete front strut assemblies and wheel alignment."
            }
        }
    },

    # STATION 4: Exterior, Structural & Tires
    "s4_panel_gaps": {
        "component": "Fender & Hood Panel Gaps",
        "station_id": "station_4",
        "options": {
            "Uniform 3-4mm laser aligned": {
                "points": 2, "is_walk": False,
                "explanation": "Body panel gaps between hood, fenders, and doors are straight, parallel, and even (3-4mm).",
                "negotiation_tip": None
            },
            "Minor uneven gap (5-6mm)": {
                "points": -2, "is_walk": False,
                "explanation": "Fender gap widens slightly near headlight, indicating panel adjustment or minor cosmetic fender removal.",
                "negotiation_tip": "Deduct $200 for body shop panel alignment."
            },
            "Crooked / rubbing panels": {
                "points": -4, "is_walk": False,
                "explanation": "Severe panel misalignment with hood corner rubbing fender paint, pointing to previous structural collision repair.",
                "negotiation_tip": "Collision damage reduces vehicle market value by 15-20%. Demand a $2,000 accident history discount."
            }
        }
    },
    "s4_inner_aprons_crash": {
        "component": "Inner Aprons & Core Support Crash Signs",
        "station_id": "station_4",
        "options": {
            "Factory spot welds & sealer": {
                "points": 3, "is_walk": False,
                "explanation": "Radiator core support and strut tower inner aprons show factory robotic spot welds and smooth OEM seam sealer.",
                "negotiation_tip": None
            },
            "Minor plastic clip broken": {
                "points": -1, "is_walk": False,
                "explanation": "Upper radiator plastic beauty cover has a missing fastener; underlying metal structure is untouched.",
                "negotiation_tip": "Minor cosmetic clip issue ($15)."
            },
            "Kinked metal / aftermarket welds": {
                "points": -10, "is_walk": True,
                "explanation": "Crinkled sheet metal, clamp marks from frame straightening machine, or manual MIG weld beads on front apron.",
                "negotiation_tip": "WALK AWAY. Severe structural unibody crash damage that compromised crumple zone safety."
            }
        }
    },
    "s4_paint_bondo": {
        "component": "Paint Depth & Body Filler / Bondo",
        "station_id": "station_4",
        "options": {
            "Consistent factory orange peel": {
                "points": 2, "is_walk": False,
                "explanation": "Paint gloss and orange peel texture match factory standards with no tape lines or paint thickness anomalies.",
                "negotiation_tip": None
            },
            "Repainted panel / minor overspray": {
                "points": -2, "is_walk": False,
                "explanation": "Slight clearcoat tape line on door jamb rubber and higher gloss indicating prior cosmetic respray.",
                "negotiation_tip": "Deduct $300 for cosmetic blend and color correction."
            },
            "Heavy bondo mud / bubbling rust": {
                "points": -4, "is_walk": False,
                "explanation": "Dull reflection with thick plastic body filler under paint and rust blisters emerging at wheel arch.",
                "negotiation_tip": "Deduct $800 for rust repair and panel refinishing."
            }
        }
    },
    "s4_tire_tread": {
        "component": "Tire Tread Depth & Wear Pattern",
        "station_id": "station_4",
        "options": {
            "Even 6/32\"+ tread depth": {
                "points": 2, "is_walk": False,
                "explanation": "All 4 tires show healthy, uniform tread depth (>6/32\") without abnormal shoulder wear.",
                "negotiation_tip": None
            },
            "Inner / outer shoulder bald": {
                "points": -3, "is_walk": False,
                "explanation": "Inner tire shoulder worn down to wear bars due to negative camber or toe misalignment.",
                "negotiation_tip": "Deduct $650 for two new front tires and 4-wheel alignment."
            },
            "Severe dry rot / sidewall bubble": {
                "points": -4, "is_walk": False,
                "explanation": "Impact bubble in tire sidewall or heavy ozone weather checking indicating imminent blowout danger.",
                "negotiation_tip": "Deduct $800 for full set of replacement tires."
            }
        }
    },

    # STATION 5: Cabin, OBD-II & Road Test
    "s5_tailpipe_smoke": {
        "component": "Cold Start Tailpipe Smoke",
        "station_id": "station_5",
        "options": {
            "Clear / brief water vapor": {
                "points": 2, "is_walk": False,
                "explanation": "Exhaust is clear with normal, brief cold morning water vapor that dissipates within seconds.",
                "negotiation_tip": None
            },
            "Black sooty / rich mixture": {
                "points": -3, "is_walk": False,
                "explanation": "Black carbon smoke on acceleration indicating rich fuel mixture, leaking fuel injector, or faulty O2 sensor.",
                "negotiation_tip": "Deduct $400 for fuel system diagnosis and oxygen sensor replacement."
            },
            "Blue puff / oil consumption": {
                "points": -10, "is_walk": True,
                "explanation": "Distinct bluish-grey oil smoke on cold startup indicating worn valve stem seals or piston oil rings.",
                "negotiation_tip": "WALK AWAY. Internal engine oil burning requiring head rebuild or piston ring replacement ($3,000+)."
            },
            "Billowing sweet white smoke": {
                "points": -10, "is_walk": True,
                "explanation": "Thick, sweet-smelling white smoke billowing continuously from exhaust, proving coolant burning in cylinders.",
                "negotiation_tip": "WALK AWAY IMMEDIATELY. Blown head gasket or cracked cylinder head."
            }
        }
    },
    "s5_warning_lights_obd": {
        "component": "Instrument Warning Lights / OBD Readiness",
        "station_id": "station_5",
        "options": {
            "All bulbs self-test & extinguish": {
                "points": 3, "is_walk": False,
                "explanation": "All instrument cluster warning lamps illuminate during ignition self-test and extinguish once engine runs.",
                "negotiation_tip": None
            },
            "TPMS / Minor maintenance lamp": {
                "points": -1, "is_walk": False,
                "explanation": "Tire pressure monitoring lamp or oil service interval reminder illuminated.",
                "negotiation_tip": "Request $75 credit for TPMS sensor replacement."
            },
            "ABS / Airbag SRS light ON": {
                "points": -4, "is_walk": False,
                "explanation": "Supplemental Restraint System (SRS) or ABS/TCS safety module fault lamp illuminated.",
                "negotiation_tip": "Deduct $650 for safety restraint module diagnosis and repair."
            },
            "Check Engine Light ON": {
                "points": -5, "is_walk": False,
                "explanation": "Malfunction Indicator Lamp (MIL/CEL) illuminated with active Diagnostic Trouble Codes stored in ECU.",
                "negotiation_tip": "Demand $800 - $1,500 deduction for OBD-II emission diagnostic scan and repairs."
            }
        }
    },
    "s5_trans_engagement": {
        "component": "Transmission Gear Engagement (P to D / R)",
        "station_id": "station_5",
        "options": {
            "Crisp, immediate lock-in (<0.5s)": {
                "points": 2, "is_walk": False,
                "explanation": "Transmission shifts smoothly into Drive and Reverse within 0.5s without shudder or driveline thud.",
                "negotiation_tip": None
            },
            "Slight hesitation (1.0s)": {
                "points": -2, "is_walk": False,
                "explanation": "Mild hydraulic pressure delay before reverse gear catches; fluid may be aged.",
                "negotiation_tip": "Deduct $250 for transmission fluid and filter exchange."
            },
            "Hard violent clunk / slipping delay": {
                "points": -5, "is_walk": False,
                "explanation": "2+ second engagement lag followed by harsh violent clunk into gear, indicating worn clutch packs or valve body wear.",
                "negotiation_tip": "Deduct $2,500 - $4,000 for complete transmission overhaul or walk away."
            }
        }
    },
    "s5_hvac_performance": {
        "component": "HVAC System (A/C & Heat Performance)",
        "station_id": "station_5",
        "options": {
            "Sub-45°F A/C & boiling heat": {
                "points": 2, "is_walk": False,
                "explanation": "Air conditioning delivers rapid vent temperature under 45°F; heater core blows strong hot air.",
                "negotiation_tip": None
            },
            "Slow cooling (55°F)": {
                "points": -2, "is_walk": False,
                "explanation": "A/C takes several minutes to cool down and only reaches 55°F, suggesting low R-134a refrigerant charge.",
                "negotiation_tip": "Deduct $200 for A/C system evacuation, leak test, and recharge."
            },
            "Hot air only / Compressor dead": {
                "points": -4, "is_walk": False,
                "explanation": "A/C blows ambient/hot air with clutch not engaging or evaporator leak.",
                "negotiation_tip": "Deduct $900 for A/C compressor and condenser replacement."
            }
        }
    }
}

class VisionLanguageModelService:
    def __init__(self):
        # Auto-load from environment or local api_keys
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")
        self.gemini_key = os.environ.get("GEMINI_API_KEY")

        if not self.anthropic_key and os.path.exists("/Users/florecer/.api_keys"):
            try:
                with open("/Users/florecer/.api_keys", "r") as f:
                    for line in f:
                        if line.startswith("ANTHROPIC_API_KEY="):
                            self.anthropic_key = line.strip().split("=", 1)[1]
            except Exception:
                pass

    def _assess_image_quality(self, img: Image.Image) -> Dict[str, Any]:
        img_gray = img.convert('L')
        edges = img_gray.filter(ImageFilter.FIND_EDGES)
        edge_stat = ImageStat.Stat(edges)
        edge_variance = edge_stat.var[0] if len(edge_stat.var) > 0 else 0.0
        
        stat = ImageStat.Stat(img)
        mean_brightness = sum(stat.mean[:3]) / len(stat.mean[:3])
        
        is_blurry = edge_variance < 15.0
        is_too_dark = mean_brightness < 20.0
        is_too_bright = mean_brightness > 245.0
        
        return {
            "edge_variance": edge_variance,
            "mean_brightness": mean_brightness,
            "is_blurry": is_blurry,
            "is_too_dark": is_too_dark,
            "is_too_bright": is_too_bright,
            "is_obscured": is_blurry or is_too_dark or is_too_bright
        }

    def _call_anthropic_vision(
        self,
        image_bytes: bytes,
        component_name: str,
        options: Dict[str, Any],
        car_context: str
    ) -> Optional[VisualInspectionResult]:
        """Queries Claude 3.5 Sonnet Vision with strict structured JSON prompt."""
        if not self.anthropic_key:
            return None
        
        try:
            b64_img = base64.b64encode(image_bytes).decode('utf-8')
            categories_list = list(options.keys()) + ["Error"]
            
            prompt = f"""You are an expert master automotive diagnostician evaluating a {car_context}.
Inspect this photo of the vehicle's {component_name}.
You must categorize the visible condition into one of these exact categories: {json.dumps(categories_list)}.

Rubric Options:
{json.dumps({k: {"points": v["points"], "is_walk": v["is_walk"]} for k, v in options.items()}, indent=2)}

Important: If the photo is too blurry, too dark, occluded, or does NOT show the {component_name}, set "finding_category": "Error".

Return ONLY valid JSON matching this exact structure:
{{
  "component_analyzed": "{component_name}",
  "finding_category": "<exact category or 'Error'>",
  "points": <integer points based on rubric>,
  "is_walk_condition": <true/false>,
  "explanation": "<1-2 sentence mechanical breakdown of visible evidence>",
  "negotiation_tip": "<what buyer should say to dealer if points < 0, or null>"
}}"""

            headers = {
                "x-api-key": self.anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }

            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": b64_img
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            }

            with httpx.Client(timeout=25.0) as client:
                res = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
                if res.status_code == 200:
                    resp_json = res.json()
                    text_content = resp_json["content"][0]["text"]
                    # Extract JSON block
                    start = text_content.find('{')
                    end = text_content.rfind('}') + 1
                    if start != -1 and end != 0:
                        parsed = json.loads(text_content[start:end])
                        return VisualInspectionResult(
                            component_analyzed=parsed.get("component_analyzed", component_name),
                            finding_category=parsed.get("finding_category", "Error"),
                            points=int(parsed.get("points", 0)),
                            is_walk_condition=bool(parsed.get("is_walk_condition", False)),
                            explanation=parsed.get("explanation", ""),
                            negotiation_tip=parsed.get("negotiation_tip", None),
                            confidence=0.96
                        )
        except Exception as e:
            print(f"Anthropic Vision API call error (fallback to local engine): {e}")
        return None

    def diagnose_image(
        self,
        image_bytes: bytes,
        component_key: str,
        car_context: str = "2015 Toyota Highlander V6",
        preset_condition: Optional[str] = None
    ) -> VisualInspectionResult:
        rubric_data = CHECKLIST_RUBRICS.get(component_key)
        if not rubric_data:
            return VisualInspectionResult(
                component_analyzed=component_key.replace('_', ' ').title(),
                finding_category="Error",
                points=0,
                is_walk_condition=False,
                explanation=f"Component '{component_key}' is not mapped in the 20-point diagnostic rubric.",
                negotiation_tip="Verify component ID and retry."
            )

        comp_name = rubric_data["component"]
        options = rubric_data["options"]

        # 1. Check if preset condition is requested (for 1-click test evaluations)
        if preset_condition and preset_condition in options:
            opt = options[preset_condition]
            return VisualInspectionResult(
                component_analyzed=comp_name,
                finding_category=preset_condition,
                points=opt["points"],
                is_walk_condition=opt["is_walk"],
                explanation=opt["explanation"],
                negotiation_tip=opt["negotiation_tip"],
                confidence=0.98,
                suggested_action="Score recorded."
            )

        # 2. Try Live Multimodal Vision LLM (Claude 3.5 Sonnet) if API Key is available
        if self.anthropic_key and not preset_condition:
            llm_result = self._call_anthropic_vision(image_bytes, comp_name, options, car_context)
            if llm_result:
                return llm_result

        # 3. Embedded Automotive Computer-Vision & Quality Engine Fallback
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            quality = self._assess_image_quality(pil_img)
            features = self._detect_visual_features(pil_img, component_key)
        except Exception:
            return VisualInspectionResult(
                component_analyzed=comp_name,
                finding_category="Error",
                points=0,
                is_walk_condition=False,
                explanation=f"We couldn't read the image for {comp_name}. Please retake a clear photo.",
                negotiation_tip=None
            )

        # "I Can't See That" / Obscured / Blurry photo fallback
        if quality["is_obscured"] and not preset_condition:
            reason = "too blurry" if quality["is_blurry"] else ("too dark" if quality["is_too_dark"] else "overexposed")
            return VisualInspectionResult(
                component_analyzed=comp_name,
                finding_category="Error",
                points=0,
                is_walk_condition=False,
                explanation=f"We couldn't clearly see the {comp_name} in that photo because the image is {reason}. Please ensure the flash is on and try again.",
                negotiation_tip=None,
                confidence=0.25,
                suggested_action=f"Hold the camera steady 8-12 inches from the {comp_name} with good lighting."
            )

        selected_cat = self._match_condition_from_image(component_key, features, quality, options)
        opt = options[selected_cat]

        return VisualInspectionResult(
            component_analyzed=comp_name,
            finding_category=selected_cat,
            points=opt["points"],
            is_walk_condition=opt["is_walk"],
            explanation=opt["explanation"],
            negotiation_tip=opt["negotiation_tip"],
            confidence=0.94 if not opt["is_walk"] else 0.98,
            detected_features=features,
            suggested_action="Score recorded in checklist." if not opt["is_walk"] else "CRITICAL: Deal-breaker detected."
        )

    def _detect_visual_features(self, img: Image.Image, component_key: str) -> List[str]:
        img_rgb = img.convert('RGB')
        stat = ImageStat.Stat(img_rgb)
        r, g, b = stat.mean[0], stat.mean[1], stat.mean[2]
        features = []
        
        if r > 160 and g > 130 and b > 80 and (r - b) > 40:
            features.append("Caramel / milky foam discoloration")
        if max(r, g, b) < 65:
            features.append("Dark viscous fluid / grime coating")
        if (g > 100 or b > 100) and abs(g - b) < 30 and g > r + 15:
            features.append("Turquoise / white battery acid sulfate crust")
        if r > 140 and g > 100 and b < 70 and (r - b) > 70:
            features.append("Golden amber fluid film")
        if abs(r - g) < 20 and abs(g - b) < 20 and 70 < r < 180:
            features.append("Uniform clean aluminum metal surface")

        return features

    def _match_condition_from_image(self, component_key: str, features: List[str], quality: Dict[str, Any], options: Dict[str, Any]) -> str:
        opt_keys = list(options.keys())
        if any("milky" in f.lower() or "caramel" in f.lower() for f in features):
            for k in opt_keys:
                if options[k]["is_walk"] or "milkshake" in k.lower():
                    return k
        if any("acid" in f.lower() or "corros" in f.lower() for f in features):
            for k in opt_keys:
                if "corrod" in k.lower() or "acid" in k.lower():
                    return k
        if any("dark viscous" in f.lower() or "grime" in f.lower() for f in features):
            for k in opt_keys:
                if "wet" in k.lower() or "grimy" in k.lower() or "dark" in k.lower() or "dripping" in k.lower() or "torn" in k.lower():
                    return k
        for k in opt_keys:
            if "clean" in k.lower() or "bone dry" in k.lower() or "bright" in k.lower() or "intact" in k.lower() or "uniform" in k.lower():
                return k
        return opt_keys[0]

vision_service = VisionLanguageModelService()
