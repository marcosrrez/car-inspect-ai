# 🧭 CarInspectAI — North Star Architecture & Product Document

**Code Name:** AutoPilot Inspect  
**Product Category:** Active Visual Inspection Co-Pilot & Vehicle Longevity Companion  
**Target Platform MVP:** Toyota & Lexus 3.5L V6 (2GR-FE / 2GR-FKS Platform)  
**Version:** 1.0 — Production Blueprint  

---

## 1. Executive Mission & Product Thesis

Used vehicle transactions suffer from severe information asymmetry. An untrained buyer standing on an outdoor lot under time pressure cannot reliably identify mechanical flaws from text checklists.

### Core Product Thesis
> **Don’t ask a consumer to inspect a car. Teach them how to look, guide them to the right place, validate their evidence capture, and explain the findings in plain English with deterministic financial leverage.**

### The Fundamental Product Loop
```
┌─────────┐      ┌──────────┐      ┌───────────┐      ┌────────────┐      ┌──────────┐
│ 1. SEE  │ ──>  │ 2. FIND  │ ──>  │3. CAPTURE │ ──>  │4.UNDERSTAND│ ──>  │5. DECIDE │
│ (Teach) │      │ (Locate) │      │(Validate) │      │ (Diagnose) │      │ (Score)  │
└─────────┘      └──────────┘      └───────────┘      └────────────┘      └──────────┘
```

---

## 2. The Tri-Layer System Architecture

CarInspectAI decouples user guidance, machine vision diagnostics, and business scoring rules into three distinct layers to prevent hallucinations and guarantee deterministic reliability.

```
                  ┌──────────────────────────────────────────────────┐
                  │              LAYER 1: THE TARGETER               │
                  │      (Edge Client / Mobile PWA / Browser)        │
                  │  • Component recognition & targeting guidance    │
                  │  • Real-time focus, motion, & lux validation     │
                  │  • Visual reference overlay (GOOD/CONCERN/CRIT)  │
                  └─────────────────────────┬────────────────────────┘
                                            │ High-Quality Validated Evidence
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │            LAYER 2: THE DIAGNOSTICIAN            │
                  │             (Cloud Multimodal VLM)               │
                  │  • Strict classification vs predefined rubric    │
                  │  • Plain-language mechanical explanation         │
                  │  • Confidence score & uncertainty flagging       │
                  └─────────────────────────┬────────────────────────┘
                                            │ Structured Taxonomy Output
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │               LAYER 3: THE JUDGE                 │
                  │          (Deterministic Rules Engine)            │
                  │  • Fixed point deductions (+2, -2, -10)          │
                  │  • Walk-Away fatal deal-breaker triggers         │
                  │  • Dealer negotiation talking points & scripts   │
                  └──────────────────────────────────────────────────┘
```

---

## 3. The Visual Knowledge Base (Core Infrastructure)

Reference photography is not decorative UI; it is the **ground-truth baseline** for both the user and the diagnostic AI.

Every inspection item contains a structured reference set:

| Category | Definition | Visual Indicator | System Consequence |
| :--- | :--- | :--- | :--- |
| **GOOD** | Factory normal wear / healthy condition | Clean amber oil, dry timing seam, clear coolant | `+2 to +3 points` (Pass) |
| **CONCERN** | Maintenance item / minor wear | Dark varnish, belt micro-cracks, oil sweat | `−1 to −5 points` (Dealer Discount Script) |
| **CRITICAL** | Fatal mechanical defect | Milky emulsion, rod knock, subframe rot | `WALK AWAY` (Deal-Breaker Alert) |

### Human-in-the-Loop Confirmation Rhythm
1. **Teach:** Show visual reference examples before opening shutter.
2. **Capture:** Shutter unlocks only when lighting and framing pass thresholds.
3. **Analyze:** VLM classifies condition against the strict taxonomy.
4. **Confirm:** Display user’s photo side-by-side with reference example. User confirms: *"Does this match what you see?"*
5. **Lock & Score:** Deterministic rules engine calculates point impact and outputs negotiation script.

---

## 4. The Two-Mode Lifecycle Engine

CarInspectAI is designed for the **entire lifecycle of vehicle ownership**, transforming from a one-time pre-purchase inspection tool into a permanent vehicle health companion.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     CarInspect AI                                      │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ 1. PRE-PURCHASE INSPECTION (PPI)          │ 2. GARAGE CARE & LONGEVITY (CAR CARE NUT)  │
│ • 5-Station, 20-Point Guided Walkthrough  │ • 6-Month Baseline AI Acoustic/Visual Scan │
│ • Instant Walk-Away Deal-Breaker Alarms   │ • Master Tech Longevity Service Intervals  │
│ • Copyable Dealer Price Deduction Scripts │ • DIY vs. Professional Safety Boundaries   │
│ • PDF Pre-Purchase Scorecard Summary      │ • Lanolin Rustproofing & Detailing Guides  │
│                                           │ • Verified Digital Provenance Logbook      │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 5. Phase 1 MVP Platform Focus: Toyota 2GR-FE (3.5L V6)

To ensure maximum diagnostic accuracy, Phase 1 validates the workflow on the world's most ubiquitous reliable V6 platform (Toyota Highlander, RAV4 V6, Camry, Sienna, Lexus RX350/ES350).

### The 4 High-Consequence MVP Visual & Acoustic Checkpoints:
1. **Oil Filler Cap & Dipstick Underside:**
   - *Target:* Coolant intrusion vs. clean oil.
   - *Rubric:* `Clean Amber (+2)` | `Dark Varnish (-2)` | `Milky Foam (WALK AWAY)`.
2. **Front Timing Cover Mating Seam:**
   - *Target:* Aluminum seam between cylinder head and block.
   - *Rubric:* `Bone Dry (+3)` | `Oil Sweat (-2)` | `Active Wet Grime (-5, $1,800 discount)`.
3. **Cold Start Tailpipe Plume:**
   - *Target:* Exhaust gas coloration 10s after ignition.
   - *Rubric:* `Clear Water Vapor (+2)` | `Black Sooty (-3)` | `Blue/White Cloud (WALK AWAY)`.
4. **Cold Idle Engine Acoustic Scan (AST):**
   - *Target:* Valvetrain harmonics vs. bottom-end knock.
   - *Rubric:* `Harmonic Idle (+3)` | `Lifter Tick (-2)` | `Rod Knock (WALK AWAY)`.

---

## 6. Implementation Principles & UI Philosophy

1. **Section-Based, De-Contained UI:** Treat checklist items as clean sections of the page separated by subtle hairline dividers and generous whitespace. No nested cards inside cards.
2. **Restrained Color Coding:**
   - 🟠 **CarInspect Orange (`#FF5722`):** Primary action / Capture trigger / Active decision.
   - 🔵 **Subtle Blue:** AI diagnostic context & metadata.
   - 🟢 **Emerald Green:** Normal / healthy condition.
   - 🔴 **Signal Red:** Fatal deal-breaker / Walk-away condition.
3. **Progressive Disclosure:** Advanced instructions, diagnostic audio spectrograms, and DIY repair procedures remain tucked away until tapped.
4. **Offline First & Mobile Optimized:** Large 54px touch targets designed for one-handed operation in outdoor sunlight on active car lots.

---

## 7. Delivery Milestones

- [x] **Milestone 1: Clean Foundation & Calm UI** — Section-based inspection workflow, iOS Settings-style compact scoring rows, deduplicated header.
- [x] **Milestone 2: Multi-Service Cloud Deployment** — Next.js frontend on Vercel + FastAPI backend on Render with live Claude 3.5 Vision VLM and 19-class AST acoustic analysis.
- [x] **Milestone 3: Master-Tech Longevity Care Engine** — "The Car Care Nut" maintenance intervals, detailing & lanolin rustproofing guides, DIY vs. Pro decision matrix, and digital service logbook.
- [ ] **Milestone 4: Visual Reference Infrastructure** — Integrate `GOOD / CONCERN / CRITICAL` visual reference carousels into item guidance and side-by-side confirmation modals.
- [ ] **Milestone 5: Edge Camera Quality Gatekeeper** — Client-side brightness, focus, and framing validation before capture.
- [ ] **Milestone 6: Certified Provenance Report** — One-tap export of verified service and inspection provenance for private-party resale value boost.
