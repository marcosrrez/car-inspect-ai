from typing import List, Dict, Any
from app.schemas.diagnostic import StationItemResult, OverallReportSummary, VehicleProfile

REPAIR_ESTIMATES = {
    "Milkshake, foamy": 4500.0,
    "Rod Knock": 6500.0,
    "Main Bearing Knock": 7000.0,
    "Wet, grimy": 1800.0,
    "Active dripping / wet casing": 1500.0,
    "Perforated rot / flaky structural rust": 4000.0,
    "Kinked metal / aftermarket welds": 3500.0,
    "Blue puff / oil consumption": 3200.0,
    "Billowing sweet white smoke": 4200.0,
    "Hard violent clunk / slipping delay": 3000.0,
    "Check Engine Light ON": 900.0,
    "Hot air only / Compressor dead": 950.0,
    "Torn, slinging dark grease": 450.0,
    "Wet dripping blown strut": 850.0,
    "Severe dry rot / sidewall bubble": 800.0,
    "Inner / outer shoulder bald": 650.0,
    "Heavy corroded crust / aged 5+ yrs": 220.0,
    "Dark carbon varnish": 150.0,
    "Dark, overdue oil": 100.0,
    "Murky / dirty sediment": 200.0,
    "Dark brown / moisture-heavy": 150.0,
    "Slightly damp": 400.0,
    "Weeping around bolts": 350.0,
    "Micro-cracks / dry rot": 150.0,
    "Frayed edges / misaligned": 350.0,
    "Lifter / Tappet Tick": 650.0,
    "Vacuum Leak / Intake Hiss": 300.0,
    "Serpentine Belt Squeal": 200.0,
    "Minor oil seepage": 350.0,
    "Hydraulic oil misting": 450.0,
    "Minor uneven gap (5-6mm)": 200.0,
    "Repainted panel / minor overspray": 300.0,
    "ABS / Airbag SRS light ON": 650.0,
    "Slow cooling (55°F)": 200.0,
    "Slight hesitation (1.0s)": 250.0,
    "Black sooty / rich mixture": 400.0
}

def generate_inspection_report(items: List[StationItemResult], vehicle: VehicleProfile) -> OverallReportSummary:
    completed = [item for item in items if item.status == "inspected"]
    total_score = sum(item.points for item in completed)
    
    # Check for Walk Conditions
    walk_items = [item for item in completed if item.is_walk_condition]
    walk_count = len(walk_items)
    walk_reasons = [f"{w.component_name}: {w.finding_category} ({w.explanation})" for w in walk_items]
    
    # Calculate estimated repair total
    est_repairs = 0.0
    negotiation_script = []
    
    for item in completed:
        if item.points < 0 and item.finding_category:
            cost = REPAIR_ESTIMATES.get(item.finding_category, 250.0)
            est_repairs += cost
            
            if item.negotiation_tip:
                negotiation_script.append({
                    "component": item.component_name,
                    "finding": item.finding_category,
                    "deduction_points": item.points,
                    "estimated_repair_cost": cost,
                    "talking_point": item.negotiation_tip,
                    "is_walk": item.is_walk_condition
                })

    # Health percentage (Scaled from rubric: max score across 20 points is +50 pts)
    # A base score of 0 gives 50%, positive boosts to 100%, negative penalizes
    max_possible = 50
    if walk_count > 0:
        health_pct = max(5, min(35, 40 + total_score))
        grade = "F (DEAL BREAKER)"
        verdict = "WALK AWAY - DEAL BREAKER"
    elif total_score >= 40:
        health_pct = min(100, int(80 + (total_score - 40) * 2))
        grade = "A+"
        verdict = "EXCELLENT BUY"
    elif total_score >= 25:
        health_pct = int(70 + (total_score - 25) * 0.66)
        grade = "B"
        verdict = "FAIR / NEGOTIATE"
    elif total_score >= 0:
        health_pct = int(50 + total_score * 0.8)
        grade = "C"
        verdict = "FAIR / NEGOTIATE"
    else:
        health_pct = max(10, int(50 + total_score * 1.2))
        grade = "D"
        verdict = "MAJOR RISK"

    asking = vehicle.asking_price or 15000.0
    if walk_count > 0:
        recommended_offer = 0.0
    else:
        # Deduct repair cost and 15% safety buffer
        recommended_offer = max(500.0, asking - est_repairs * 1.15)

    return OverallReportSummary(
        total_score=total_score,
        max_possible_score=max_possible,
        health_percentage=health_pct,
        grade=grade,
        verdict=verdict,
        walk_conditions_count=walk_count,
        walk_condition_reasons=walk_reasons,
        total_estimated_repairs_usd=round(est_repairs, 2),
        recommended_offer_usd=round(recommended_offer, 2),
        dealer_negotiation_script=negotiation_script,
        completed_items_count=len(completed),
        total_items_count=len(items) if items else 20,
        vehicle=vehicle
    )
