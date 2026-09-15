# v4 round 3: ideas for visual craft and learning experience

Date: 15 September 2026
Builds on: [v4-prototype-goal.md](v4-prototype-goal.md) (phases 0–8, done) · [v4-round2-goal.md](v4-round2-goal.md) (phases 9–15, done) · [v4-prototype-review.md](v4-prototype-review.md) · direction: [relay-design-direction.md](relay-design-direction.md)
Prototype: [`prototypes/v4/`](../prototypes/v4/)

> **Status (all implemented).** Every idea below was built and committed one per change on `design/v4-prototype`: A1 route grammar (+A2 glass depth, A3 inciting moment, A4 contrast pass), B1 watch-it-all, B2 connections map, B3 say-it-back, B4 closed feedback loop, C1 depth ladder, C2 cutaway lens, D1 signs-on-arrival, D2 sign vocabulary, E1 scalable reading UI, E3 concise narration. Per-organ depth cooling (A2) was deliberately dropped to protect pathway-organ salience; E1 shipped as a measured pass over the reading surfaces, with full-chrome rem left as a follow-up. Layout audit stays 0 collisions across 40 views; no console errors.

This is a design memo, not a phase plan. It proposes the next round of improvements **strictly on visual craft and learning experience** — nothing about porting to `src/`, commissioning art, or the science/anatomy review, which are tracked elsewhere. Everything here rides on the existing placeholder art and honest-draft framing, and respects the hard constraints (no gamification; no numbers/quantity encoded by brightness/speed/size/count; motion carries meaning and has a reduced-motion twin; dark-first desktop pointer + keyboard).

Every idea is grounded in the code that exists. File and function references are to the current build.

---

## Where the prototype already is strong (so we build, not repeat)

- **Zoom-is-depth** is the spine: `HS.level()` in `camera.js` maps zoom ratio to `body / organ / structure`, and `lodLabels` + `updateLod` in `anatomy.js` cross-fade in cortex/medulla, pituitary lobes and islets. Cell insets (`engine.js openCell`) are the fourth rung.
- **Route drama** is mature: draw-on, casing, static glow, comet-tail pulse and arrival ripple all live in `overlay.js` (`setRoute`, `drawOn`, `travel`, `renderOverlay`), each already gated behind `HS.RM()`.
- **The felt body** — signs (`buildSigns`/`setSign`): heart ripple, breathing, drifting glucose glyphs, widening pupils, sleepy lids, cool wash.
- **Comprehension scaffolds** — Try it? (gated feedback), What if? (predict-first counterfactual), Read the route (generated causal diagram in `more.js causalSVG`), leads-to chips, and the whole Advanced layer (passports, Rebuild, Compare, stepped cell mechanisms).

The gaps below are the *seams* between these strong pieces: the body still reads as a labelled diagram more than a body; the single most important misconception (schematic line ≠ vessel) is defended mostly in prose; the timescale contrast that is the point of the stress scene is only ever told in words; and the felt signs are not yet tied to the moment the signal arrives.

---

## My top 5 picks

1. **Route grammar you can read without colour** (visual craft / accessibility) — give nerve / blood / portal / feedback routes distinct line *textures*, not just hues, and surface the stimulate·inhibit·modulate end-glyphs as a legend. Directly defends prototype tasks 5 and 6, and fixes a colour-only distinction.
2. **Inside-the-body depth** (visual craft) — a translucent front-of-torso pass and gentle depth-sorted cooling so organs read as *inside* a body rather than painted on a silhouette.
3. **Play the whole response on one ribbon** (comprehension) — a guided-mode "watch it all" that runs fast-then-slow across the existing seconds→hours ribbon, so the timescale contrast is *felt*, not just read. No Advanced, no table.
4. **Signs fire when the signal lands** (motion & feedback / pedagogy) — couple sign onset to pulse arrival so the hidden messenger and the thing-you've-felt happen in the same instant (direction §4.7's explicit goal).
5. **A depth ladder instead of a depth label** (wayfinding) — turn the `#lvlChip` into a three-rung body → organ → cell indicator, teaching the zoom-is-depth model at a glance.

---

## Theme A — Visual craft

### A1. Route grammar you can read without colour  ·  effort M  ·  *top pick*
**Problem.** A route's *carrier* is currently encoded by hue alone — `COL` in `overlay.js` (blue `msg`, purple `nerve`, amber `fb`). In grayscale and for colour-blind learners, a nerve route and a blood route are the same line. This is exactly the distinction prototype task 6 tests ("is this a blood vessel or a nerve?") and task 5 leans on (the dashed ghost). The schematic-not-a-vessel point is otherwise defended only in prose (the `HOW` map in `ui.js`, the static paragraph in `openRead`).

**What it feels like.** Each carrier has a *texture*, legible at a squint and in grayscale:
- blood-borne message — smooth solid line (as now);
- nerve / light signal — a fine beaded / segmented line (dots strung on the path), echoing the sympathetic-chain beads already drawn in `gNerv`;
- portal — a short double-stroke stub (it already means "a short hop straight to the next gland");
- feedback — dashed (as now) with the bar/diamond end.

The learner can *see* that CRH takes a portal hop, ACTH rides the blood, and the alarm runs down a nerve — before reading a word.

**Sketch.** In `overlay.js buildRoutes`, drive `stroke-dasharray` / a patterned overlay stroke from `r.kind` (and a new `carrier` field where kind is too coarse, e.g. portal vs blood are both `msg`). Add a tiny **grammar legend** to `openRead` in `ui.js` (and optionally a persistent mini-key) showing the four line textures plus the three end-glyphs — reuse `endGlyph()` from `overlay.js` so arrow = stimulates, bar = inhibits, diamond = modulates become teachable, not just decorative. Update the route card copy in `showRouteCard`.

**Risk / constraint.** Texture must not read as "amount" (§5.4 guardrail) — keep bead spacing fixed, never tied to anything quantitative. Re-run the grayscale/squint check (task quality bar) since we are changing the most salient marks on screen. Keep the pulse comet legible over a beaded line.

### A2. Inside-the-body depth  ·  effort M  ·  *top pick*
**Problem.** The silhouette (`bodyPath` in `anatomy.js`) is an opaque `url(#sil)` fill, and organs are painted on top in a fixed z-order (`ORDER`). The result reads as *organs on a body-shaped card*, not organs *inside* a translucent body. There is a rim light but no sense of interior space or front/back depth.

**What it feels like.** Two quiet additions:
- a **front-of-torso glass pass** — the body path redrawn once more *above* `#gOrg` at very low opacity with the `#sheen` gradient, clipped to `bodyClip`, so organs sit visibly *within* a body wall;
- **depth-sorted cooling** — organs meant to sit deeper (e.g. adrenal glands, pancreas behind the gut) get a touch more desaturation/haze than front organs, so the stack has air in it. Zooming in fades the haze away as you "enter" that layer.

**Sketch.** `anatomy.js buildWorld`: add the front pane after the `#gOrg` group; add an optional `depth` value per organ in `ORGS` and apply it as a CSS class driving `filter: saturate()/opacity`. Tie the haze to zoom via `updateLod`/`HS.zoomRatio()` so it lifts as you descend. Pure CSS/SVG, static, cheap.

**Risk / constraint.** Salience first: the active route and hotspots must stay the most salient thing (squint test) — keep the pane and haze subtle and verify grayscale still reads. Depth cooling must clearly encode *spatial depth*, never amount; if it risks reading as "less active", drop the cooling and keep only the glass pane.

### A3. The trigger as a legible inciting moment  ·  effort S–M
**Problem.** A trigger currently fires an atmosphere tint (`setAtmos`) and a ripple at the first lit structure (`trigger()` in `engine.js`). "It gets dark" earns this beautifully (the stage darkens dusk→night via `setNight`), but "something stressful happens" and "you skip a meal" are abstract tints — the *inciting event* isn't shown, so the story starts mid-sentence.

**What it feels like.** A brief, abstract cue at the body's edge that says *this is what happened, and here is where the body first notices it* — a jolt glyph resolving into the ripple at the brain for stress; a fading warmth at the gut for a skipped meal. It hands off to the existing first-light ripple, so it reinforces "the signal starts here."

**Sketch.** Extend `trigger.atmosphere` in each scene file to an optional richer intro spec consumed by `trigger()`; reuse `HS.ripple`. Reduced motion: show the end-state cue statically. Keep it to ~1s and non-repeating.

**Risk.** Easiest idea to over-decorate. It must mark *where the signal enters the body*; if it's just a flourish, cut it. Lower priority than A1/A2.

### A4. Contrast and grayscale token pass  ·  effort S  ·  *quick win*
**Problem.** `--ink-3` (`#6C858B`) carries a lot of small secondary text (ribbon words, chips, captions) on the dark stage; at 11–12px this is near the WCAG AA edge. `route.faint` at opacity .22 and the sign-off states also sit close to invisible.

**What it feels like.** Nothing new — the same UI, verified. A short audit fixing any small text below 4.5:1 and any state (faint route, candidate ring, ghost) that fails grayscale, nudging tokens rather than redesigning.

**Sketch.** Audit `app.css` tokens and the states in `overlay.js`; adjust `--ink-3`, `.route.faint`, `.chip`. Fold into the same grayscale check A1 requires.

---

## Theme B — Comprehension & pedagogy

### B1. Play the whole response on one ribbon  ·  effort M  ·  *top pick*
**Problem.** The stress scene's whole point is *two responses at two timescales*. But `play()` in `engine.js` plays **one** pathway; the hand-off is a tip ("now follow the slow route: choose Slow", in `stress.js afterPlay`). Compare (both routes, a table) is **Advanced-only** by design. In guided mode the seconds-vs-hours contrast is only ever *told* on the ribbon, never *shown* end-to-end.

**What it feels like.** A guided "**Watch the whole response**" that runs the fast route landing around *seconds*, then continues into the slow route landing at *minutes*/*hours*, all sweeping across the one shared ribbon the scene already has (`stress.js time`: now→seconds→minutes→hours→calm). The learner sees the burst arrive and fade while the slow tide is still rising. No molecule classes, no side-by-side table — that stays Advanced, so this doesn't duplicate Compare.

**Sketch.** A scene-level sequence in `engine.js` that chains `enterPathway`/`play` across `S.toggle.options` while advancing `setTime` along the scene ribbon; expose it as an optional control in the pathway bar or the caption for two-route scenes (stress, meal). Reduced-motion twin: step it (fast steps, then slow steps) with the ribbon jumping, matching the existing RM `play()` branch. Meal reuses it for between-vs-after.

**Risk / constraint.** Timescale is qualitative — the ribbon stays word-based; nothing measures the gap. Must guard the same stale-autoplay case `enterPathway` already handles (don't fire into a challenge/other pathway).

### B2. A "how these connect" overview of the three scenes  ·  effort M
**Problem.** The three scenes genuinely are one body — cortisol → glucose → *After a meal*; the SCN shaping cortisol's rhythm — but that wholeness is only discoverable one `leads`-chip at a time (`getLabels` lead chips, More's "Related pathways"). A first-timer never sees the big picture.

**What it feels like.** A small, quiet map — the body with the three scene entry points and the leads-to arrows between them, generated from data. Opened from the panel or Read the route. It's an *orientation* aid ("these fit together, and here's how"), never a progress board.

**Sketch.** Generate from existing data: `HS.TRIGGERS`, and the `leads` fields already on hotspots (e.g. `stress.js` liver → `meal:after`, hyp → `dark:night`; `dark.js` brain → `stress:slow`). Render as a compact SVG akin to `causalSVG` in `more.js`. Clicking a node/edge calls `HS.openPathway`.

**Risk / constraint.** Must not become a completion tracker (no ticks/scores per scene) — that would edge into gamification. It shows structure, not achievement.

### B3. Self-explanation, ungraded  ·  effort M
**Problem.** The validation tasks are explanation tasks ("explain the order in your own words", "explain negative feedback", "explain fast vs slow" — §10 tasks 4, 7, 8), but the app only ever *shows*; it never invites the learner to articulate. Self-explanation is one of the best-evidenced comprehension moves — and it's a form of assessment that carries **no** score.

**What it feels like.** After finishing a pathway (or revealing a Try it? loop), an optional, dismissible "**Say it back**" prompt: one open question ("In a sentence, why does the body calm down?") with a text field and a "Show how we'd put it" reveal to self-compare against a model line. No marking, no right/wrong, no counter — pure metacognition. Skippable and off-by-default-quiet, like the existing tips.

**Sketch.** New optional card reusing the `.try`/`.res` styling and the tip-dismiss pattern; model answers authored per pathway in scene data (a `reflect` field next to `afterPlay`). The reveal text can reuse the existing `read()` prose. Recorded — if at all — only as "explored", never scored (see `store.js` which already keeps attempts qualitatively).

**Risk / constraint.** The line between reflection and a graded quiz is where gamification creeps in. Keep it opt-in, ungraded, no streak, framed as "check yourself against how we'd say it."

### B4. Make the negative-feedback *loop* legible as a loop  ·  effort S–M
**Problem.** Negative feedback is the hardest idea in the stress scene. It's taught well as a *fact* (Try it?, the dashed feedback arc in `causalSVG`, the calming signs after "Watch the body calm down"), but the *circularity* — output turning its own upstream down — is spread across three places and never seen as one closed loop on the body.

**What it feels like.** When the feedback route is revealed, the causal diagram's feedback arc and the on-body ghost line briefly read as a **closed circuit** — the pulse that ran downstream (ACTH→cortisol) continues back up the feedback line to the pituitary/hypothalamus in one continuous motion, closing the ring. It's the existing `travel` on `gate.routes`, timed to feel like *the same signal completing a loop* rather than a separate afterthought.

**Sketch.** In `engine.js checkTry`'s post-reveal travel, chain the downstream and feedback travels into one visible circuit; optionally draw the loop once in `causalSVG` as a continuous path. Reduced motion: show the closed loop statically (it largely already does via the dashed arc).

**Risk.** Small; just sequencing existing motion. Keep it one-shot.

---

## Theme C — Wayfinding & orientation

### C1. A depth ladder, not a depth label  ·  effort S  ·  *top pick / quick win*
**Problem.** Zoom-is-depth is the core interaction model, but the only persistent signal of it is the text `#lvlChip` ("Organ · pathway names") and one-time tips in `app.js onLevel`. Nothing shows that there *is* a ladder (body → organ → close-up → cell) or where you are on it.

**What it feels like.** The `#lvlChip` becomes a tiny vertical ladder of three rungs — **body · organ · cell** — with the current rung lit and the others dimmed, and the cell rung lighting when an inset is open. It silently teaches "there's more if you go deeper," which is the thing first-timers miss.

**Sketch.** Replace the `#lvlChip` innerHTML in `camera.js updateView` (and `openCell`, which already writes "Cell · mechanism" there) with a 3-rung SVG/CSS control driven by `HS.level()`. Optionally clickable to zoom a rung. Pure presentation.

**Risk.** None to speak of; keep it quiet and out of the salience contest.

### C2. The cutaway as a lens on the head  ·  effort M
**Problem.** The sagittal brain cutaway (`gInset` in `anatomy.js`) floats to the left of the body, joined to the head only by a faint dashed leader. Learners can miss that the circle *is* the inside of the head they're looking at — a spatial-orientation risk the front-view-only design (D5) makes more acute.

**What it feels like.** Treat the cutaway as a magnifier lens: when you zoom toward the brain, the lens visibly "draws out" of the head (a brief connective motion) and its ring reads as a lens rather than a detached diagram; zooming back tucks it home. The dashed leader becomes the lens's arm.

**Sketch.** Animate the `gInset` circle's relationship on entering the `brain`/`head` region in `camTo`; strengthen the leader in `buildWorld`. Reduced-motion twin: no draw-out, just a clearer static lens treatment and label ("inside the head").

**Risk / constraint.** Motion must carry the meaning "this is the same head, opened up" — not spin for effect. If it can't be made to say that clearly, ship only the static lens styling.

---

## Theme D — Motion & feedback

### D1. Signs fire when the signal lands  ·  effort S–M  ·  *top pick*
**Problem.** Direction §4.7 is explicit: a response is not only a route; the body shows a sign so the learner connects the hidden signal to something they've felt. Right now signs toggle on the **time index** (`applySigns`/`signOn` keyed to `E.tIdx`), while the pulse arrival brightens only the organ's halo (`goHot`'s `arrive` class). So the messenger arrives and the *felt* sign appears on separate clocks.

**What it feels like.** The instant the adrenaline pulse reaches the heart, the heart's ripple sign *starts* — signal and sensation in the same beat. Following the fast route, each landing lights its sign in turn (heart pounding, breath quickening), so the invisible chemistry and the body you'd feel are unmistakably the same event.

**Sketch.** In `engine.js goHot`/`play` and `overlay.js travel`'s arrival callback, kick the arriving hotspot's associated sign on landing (map hotspot `org` → sign, or add a `sign` ref on the hotspot). Keep the ribbon-driven state as the source of truth (scrubbing still works); this only *syncs onset* during playback. Reduced motion: signs appear with the instant step, as now.

**Risk / constraint.** Signs stay boolean and illustrative — onset timing, never magnitude, so no quantity leaks in. Verify a scrub back-and-forth doesn't double-trigger.

### D2. A calmer, more legible sign vocabulary  ·  effort S–M
**Problem.** The signs are a lovely idea but uneven in legibility: the glucose glyphs (`type:'glyphs'` drifting hexagons) read as generic sparkles more than "sugar into the blood," and the cool `wash` for the overnight temperature dip is easy to miss. Their labels do the heavy lifting.

**What it feels like.** Each sign gets a clearer, self-evident identity — the glucose glyphs read as sugar leaving the liver into the bloodstream (direction of drift toward the body, not random); the cool wash paired with the sleepy lids so "the body cools and settles" reads as one gesture. Same restraint, sharper meaning.

**Sketch.** Refine the SVG/anim in `overlay.js buildSigns` and the drift vectors in the scene `signs` data; no new mechanism.

**Risk.** Keep it illustrative and quantity-free; re-check grayscale.

---

## Theme E — Accessibility

### E1. Let the floating UI scale with the browser  ·  effort M–L
**Problem.** The world zooms, but the floating UI is fixed-px (`body{font-size:14px}`, `min-width:1024px`, px paddings throughout `app.css`). At 200% browser zoom the toolbar, pathway bar and sheet don't reflow gracefully — a WCAG 2.2 concern (1.4.4 resize text) even on a desktop-only target. The round-2 audits checked *viewport* widths, not *text* zoom.

**What it feels like.** The chrome stays usable and uncut when a low-vision learner zooms the page or bumps the base font — panels reflow, nothing clips, the same content just gets bigger.

**Sketch.** Move key UI dimensions to `rem` and relative units; extend the existing `@media` fold-downs (which already collapse labels/segments at ≤1400/1180) to react to effective size, not just viewport px. Verify against the collision/overlap script already used in Phase 15.

**Risk.** Touches a lot of `app.css`; do it as a measured pass with the existing audit script as the gate. Largest-effort a11y item here.

### E2. Carrier texture as colour-blind support  ·  effort — (folded into A1)
The route-grammar textures in **A1** are also the colour-blind fix for the nerve/blood/feedback distinction, which is currently hue-only. Flagged separately so it isn't lost when A1 is weighed purely as visual craft.

### E3. A quieter live-region option  ·  effort S
**Problem.** `HS.say` narrates generously (full step text, full Try it? candidate lists, full passport fields). Rich for first pass, but verbose for a returning screen-reader user.

**What it feels like.** An optional "concise narration" setting that trims announcements to the essential (step name, result tone) — parallel to the existing Reduce-motion / Tips toggles in Settings.

**Sketch.** A settings toggle gating the verbosity of `HS.say` calls; store alongside the other prefs in `advanced.js`/`store.js`.

**Risk.** None; additive.

---

## Theme F — Assessment without gamification

The constraint is absolute (no points/streaks/badges/milestones). The move is to deepen *self-assessment and reflection*, which are ungraded by nature.

- **B3 (self-explanation)** is the flagship here — active recall and articulation with no score.
- **The Rebuild challenge is Advanced-only.** A *guided* light-touch recall — "put these steps in order" using the numbered hotspots, with the specific, kind corrections `rebuild.js` already writes, but **without** the signal-naming/molecule layer — would give non-Advanced learners one active-recall moment without importing the Advanced apparatus. Effort M. Constraint watch: frame as "check your understanding," recorded (if at all) only as practice like the current attempts in `store.js`, never scored.
- **Understanding as a quiet map, not a counter.** The Settings progress summary (`renderSummary`) is already careful — plain counts, "no score." It could become a small body map showing which pathways were explored and which feedback loops revealed, as *navigation* ("here's what you've looked at, here's what's left to explore"), **not** completion rewards. Effort M. This is the idea most at risk of sliding into gamification — only pursue it if it stays purely navigational.

---

## Quick wins (small effort, clear payoff)

1. **C1 — depth ladder** replacing the `#lvlChip` text: teaches the core zoom-is-depth model for a few lines of presentation code.
2. **D1 — signs fire on pulse arrival**: reconnects the felt body to the hidden signal (direction §4.7) by syncing onset during playback.
3. **A4 — contrast/grayscale token pass**: a measured audit, no redesign; clears likely AA gaps on secondary text and faint states.
4. **A1's legend half — surface the stimulate·inhibit·modulate glyphs** in Read the route: makes the existing `endGlyph` grammar teachable at almost no cost (the carrier-texture half is the M-effort part).
5. **B4 — close the feedback loop visually**: sequences motion that already exists into one legible circuit.

## Bigger bets (more effort, more upside)

1. **A1 — route grammar you can read without colour** (with A2). The highest-leverage pair: together they move the piece from "labelled diagram" to "a body with a readable signalling grammar," and defend the central misconception (tasks 5, 6) structurally rather than in prose.
2. **A2 — inside-the-body depth.**
3. **B1 — play the whole response on one ribbon.** The cleanest way to make the stress scene's core insight *felt* in guided mode without touching the Advanced boundary.
4. **B2 — the connections overview**, so three scenes read as one body.
5. **B3 — self-explanation**, the strongest assessment-without-gamification move.
6. **E1 — scalable UI** as the one substantial accessibility investment.

---

## What I deliberately did *not* propose

- No sound / haptics (out of the dark-first desktop pointer+keyboard scope).
- No new scenes, pathways, organs or triggers (out of scope by the round-2 rules and still sensible).
- No rotation / back view (owner decision D5; front-view depth cues in A2/C2 are the cheaper answer).
- Nothing that encodes amount by brightness, speed, size or count — several ideas (A2 depth cooling, A3 trigger, D1/D2 signs) name this guardrail explicitly because they sit closest to it.
- No leaderboards, points, streaks, badges or completion rewards, anywhere — including inside the assessment theme, which is built entirely from ungraded self-assessment.

---

## Round 4: where the measurable quality bar actually stands

Date: 15 September 2026 · branch `design/v4-quality-round4` · audit: `scripts/v4-quality-bar.mjs`

Before proposing anything, the §10 quality bar was re-measured in a real browser rather than inferred from the docs. `scripts/v4-quality-bar.mjs` walks all five pathways at 1280, 1440 and 1920 and checks: labels on screen (bar: ≤ 8), label/label, label/hotspot and label/UI overlaps, leader-line crossings, bottom-bar overflow, grayscale survival of route/hotspot/ghost/lit/candidate states, a reduced-motion step for every pathway, and console errors throughout.

**Result: 83/83 checks pass on the current build.** Baseline saved at `coverage/v4/qb-baseline.json`.

Two caveats found while building the audit, both in the *measurement*, not the prototype — recorded so the numbers are not over-trusted:

1. A first pass counted `12 labels` in the dark scene because the probe matched `#labels > *`, which also matches the numbered hotspot buttons. The real figure is **7 labels + 5 hotspots**.
2. The grayscale check first reported "no dashed distinction" because it read only `#overlay`. The dashed feedback route and the `ghostin` ghosts live in `#world`. Reading both SVGs, the dashed distinction is present (e.g. `route ghostin` at `6px,7px`, feedback at `3.5px,4.5px`).

**What this means for round 4.** The *layout, salience-proxy, grayscale, reduced-motion and console* parts of the bar are already satisfied. The parts of §10 that cannot be measured by a script — whether a first-time learner finds a trigger in 10 s, whether the ghost reads as "not yet revealed" rather than "association", whether the schematic reads as not-a-vessel, and whether negative feedback is explainable in the learner's own words — are the ones still open. Round 4 should therefore target **comprehension and first-run legibility**, not more layout polish, and should add scriptable proxies for those task outcomes where it can.
