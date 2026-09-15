# Human Signals V4 browser review — 2026-09-15

Review scope: browser-only, desktop review of `http://localhost:8765/v4/`. No application source, tests, package files, or existing docs were changed. Viewports inspected: 1728×972, 1440×900, and 1280×800.

## Baseline pillar scores

Scale: 1 = blocked, 3 = usable with material friction, 5 = strong and evidence-ready.

| Pillar | Baseline | Evidence |
| --- | ---: | --- |
| Visual quality | 3/5 | Distinctive model-first canvas and restrained palette at 1440×900; hierarchy weakens when side sheets and the timeline compete for the same space. |
| Interactivity | 3/5 | Search, keyboard shortcuts, reduced-motion setting, prediction feedback, and local progress are discoverable; overlay and focus behavior is inconsistent. |
| Learning experience | 3/5 | The route → prediction → causal feedback → transfer loop is clear; claim-level evidence status is not available to the learner. |

## Findings

### V4-BR-01 — Concurrent sheets create an obscuring, ambiguous interaction state

- Severity: P1
- Pillars: Interactivity, Visual quality
- Route/view: `/v4/#s=stress&p=fast&t=1&h=3&c=292,375,1.27`, stress response / Fast route
- Viewport: 1728×972 desktop
- Observed behavior/evidence: After opening “Say it back”, then “Read the route”, then Settings → “Keyboard shortcuts”, the browser screenshot showed three concurrent layers: the keyboard panel centered, the route reader open on the right, and the reflection sheet in front of it. The layers obscure one another and present different content contexts. Escape removed the top layer but did not return focus to a clearly visible owning control.
- Learner/user consequence: The learner can lose the active route context, miss controls behind a sheet, or believe multiple tasks are simultaneously active. Keyboard and pointer users receive different practical affordances because an underlying control can remain exposed semantically while being blocked visually.
- Suggested bounded change: Enforce a single active modal/sheet state, or make an explicit back-stack with one visible layer at a time. On close/Escape, restore focus to the control that opened the layer and make the background inert while a layer is active.
- Acceptance criteria: No normal user sequence leaves more than one modal/sheet visible; Escape closes one visible layer; focus returns to its opener; no background control is actionable while a modal/sheet is open.
- Confidence: High. Unverified gate: focus-trap and screen-reader behavior still need a dedicated accessibility pass after implementation.

### V4-BR-02 — Narrow desktop loses the model-first learning composition

- Severity: P1
- Pillars: Visual quality, Learning experience
- Route/view: `/v4/#s=stress&p=fast&t=1&h=3&c=292,375,1.27`, Read the route open
- Viewport: 1280×800 desktop
- Observed behavior/evidence: The systems panel occupies the left side, the route reader occupies roughly the right third, and the central body is compressed between them. The lower body is covered by the timeline/pathway bar, while the route reader shows only its opening content above the fold. Several organ/step labels sit close to the canvas edges.
- Learner/user consequence: The learner must trade away either the whole-body causal model or readable route detail. The step order, organ locations, and current timeline moment are harder to hold together in working memory at a common laptop-sized desktop viewport.
- Suggested bounded change: Define one narrow-desktop focus state for the route reader: reduce or collapse the systems panel while the reader is open, keep the current-step model context visible, and prevent the timeline from covering active anatomy.
- Acceptance criteria: At 1280×800, opening the route reader keeps the current objective, current step, route summary, and an unclipped model context visible without browser zoom; active labels remain readable and the timeline does not cover the active organ/feedback marker.
- Confidence: High. Unverified gate: the anatomy artwork itself remains illustrative and requires scientific/anatomical review before correctness claims.

### V4-BR-03 — Draft labeling does not provide claim-level provenance

- Severity: P1
- Pillar: Learning experience
- Route/view: `/v4/#s=stress&p=fast&t=1&h=3&c=292,375,1.27`, Read the route and Advanced signal passport
- Viewport: 1440×900 desktop
- Observed behavior/evidence: The app consistently displays “Illustrative draft · not reviewed science”, and the reader explains that routes are schematic. However, the route explanation and advanced passport present specific mechanism claims without a source identifier, claim-level review state, or provenance affordance. The visible boundary is global, not attached to the individual explanatory blocks.
- Learner/user consequence: A learner can tell that the overall app is draft material but cannot tell which statement is a deliberate simplification, which is awaiting review, or where a claim came from. This weakens trust and makes later recall vulnerable to unmarked uncertainty.
- Suggested bounded change: Add a compact evidence/provenance disclosure to each explanatory route/passport block, using explicit states such as illustrative, simplified, or reviewed, and provide a source or “no source assigned” state. Keep the draft boundary visible in the same view as the claim.
- Acceptance criteria: Every learner-facing mechanism explanation has an adjacent evidence/review state; unreviewed claims cannot appear as an undifferentiated authoritative list; the app never implies scientific validation where none exists.
- Confidence: High. Unverified gate: all physiology wording, causal relationships, and anatomical visuals require independent scientific review before any block can be marked reviewed.

## Positive evidence to preserve

The core loop is promising and should remain intact: the meal prediction allows an answer selection, Check produces mechanism-based feedback (“rising glucose acts back on the pancreas…”), and “Watch glucose settle” visibly advances the feedback state. The “What if?” prompt provides a transfer task, unavailable pathways explain their scope instead of failing silently, and Settings states that progress is stored only on the device.

