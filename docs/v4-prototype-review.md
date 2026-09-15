# v4 interaction prototype: review note

Date: 15 September 2026
Prototype: [`prototypes/v4/`](../prototypes/v4/) · goal and phase log: [v4-prototype-goal.md](v4-prototype-goal.md) · direction: [relay-design-direction.md](relay-design-direction.md)
Evidence: [`design-review-evidence/v4/`](design-review-evidence/v4/)

Everything on screen is **illustrative textbook-level draft content on placeholder art**. Nothing here has passed scientific or anatomy review, and the prototype says so on every screen.

## What is built

| Trigger | Pathway | Hotspots | Gated feedback (Try it?) | What if? | Cell inset |
|---|---|---|---|---|---|
| Something stressful happens | Fast route | brain → adrenal medulla → heart → liver | — | — | — |
| | HPA axis | hypothalamus → pituitary → adrenal cortex → liver | cortisol brakes pituitary and hypothalamus | the brake stops working | cortisol in a liver cell |
| You skip a meal | Between meals | pancreas → liver → brain | rising glucose turns glucagon down | the liver can't answer glucagon | glucagon at a liver cell |
| | After a meal | intestines → pancreas → liver, muscles | falling glucose turns insulin down | — | insulin at a muscle cell |
| It gets dark | Melatonin at night | eyes → body clock (SCN) → pineal gland → brain | melatonin modulates the clock (◇) | the lights stay on | melatonin made in a pineal cell |

Published build: https://claude.ai/artifact/Ahe6QrAxD3Jj5v2zysLTJT (private until shared).

Common to every scene: trigger moment, ▶ Play (Next step under reduced motion), numbered hotspots with visited checks, a qualitative time ribbon, whole-body signs, zoom-is-depth labels and ⓘ text, More sheet, Read the route with a generated causal diagram, leads-to chips between scenes, search with synonyms, local progress with Continue and Erase, links that reopen a moment paused, keyboard model, reduced motion.

## Evidence

| # | Screen | File |
|---|---|---|
| 1 | Home, first visit | `01-home.jpg` |
| 2–5 | Stress: fast route · HPA axis · Try it? "Nearly" · What if? outcome | `02`–`05` |
| 6–8 | Close-ups: adrenal cortex/medulla · pituitary lobes · liver-cell inset | `06`–`08` |
| 9–12 | Meal: between meals · after a meal · muscle-cell inset · islets close-up | `09`–`12` |
| 13–15 | Dark: brain cutaway · whole body at night · What if? lights on | `13`–`15` |
| 16–18 | More sheet · Read the route diagram · keyboard sheet | `16`–`18` |
| 19–21 | HPA axis at 1280 · After a meal at 1920 · grayscale check | `19`–`21` |
| 22–26 | Advanced: organ labels with molecule class · a signal passport · Rebuild the route · Compare routes (1280) · cell stepper mid-step with named molecules | `22`–`26` |

Scripted checks run during Phase 7 (no screenshots needed to repeat them): no label, hotspot or panel overlaps and at most 8 labels in all five pathways at 1280, 1440 and 1920; reduced-motion walk-through of all five pathways; tree keyboard model; focus nudge out from under panels; no console errors.

Round-2 scripted check (Phase 15): 0 bottom-bar collisions or overflow and no label overlaps across all five pathways at 1024, 1280, 1440 and 1920 **with Advanced both off and on** (40 views); reduced-motion cell stepper steps by keyboard; no console errors. Two layout bugs it caught were fixed in the same pass — at 1280 the top caption slid under the toolbar, and the wide *After a meal* pathway bar touched the zoom control at 1440.

## The Advanced flow (round 2, optional, off by default)

An **Advanced** switch (pathway bar menu, settings, key A) is stored apart from progress and erasable. Guided flow is byte-for-byte unchanged with it off. With it on:

- **Organ and structure one-liners** gain a named layer (e.g. corticotrophs cut ACTH from POMC), and **route labels name the molecule class and carrier** ("cortisol · steroid · blood").
- **Signal passports** for all 12 signals: made from, made in, travels, receptor location (with a surface/inside/transporter/synapse figure), how fast it acts, how it is switched off — plus a per-scene passport table that makes peptide vs steroid vs amine visible. Opened from a route, the tree, search or the More sheet.
- **Rebuild the route**: routes and numbers hide, the learner taps organs in causal order (with two distractors) and names the signal on each link; Check gives one specific correction at a time, then the true route draws on.
- **Compare routes** (stress, meal): both pathways on one body — A solid, B a hollow line that survives grayscale — with a shared words-only ribbon and a side-by-side table (first signal, carried by, reaches, timescale, what you'd notice, switched off by, overall).
- **Cell insets are steppers**: click a step or walk with Next/Previous or arrow keys; the active step lights and a spotlight glides to the part it is about; the signal molecule travels on step 1 and rests bound; Advanced adds the named molecules per step.

## Where the prototype went beyond the direction (confirm or reject)

| # | Change | Why | Affects |
|---|---|---|---|
| P1 | A pathway can carry its **own time ribbon and signs** (Between meals and After a meal tell different stories) | One ribbon could not describe fasting and eating honestly | §4.8 |
| P2 | Gated feedback may **leave the ribbon's end open** (melatonin's action on the clock does not cause morning) | Blocking "morning light" behind a Try it? taught a false dependency | §4.3, §4.8 |
| P3 | **Leads-to chips** on effect hotspots join scenes on the same body | Promoted from §13 "Pathways connecting"; it is what makes three scenes feel like one body | §13 → §4.3 |
| P4 | **Links reopen a moment** (scene, pathway, step, time, zoom, revealed), paused | Promoted from §13 "Share a moment"; REQ-017 needed it anyway | §13, REQ-017 |
| P5 | Try it? shows its **candidates as chips** in head-to-pelvis order, synced with the body | Keyboard and screen-reader users can answer without the illustration | §4.5, doc 09 |
| P6 | **One tip at a time**; zoom tips leave with their level; opening a sheet clears tips | Tips were stacking over each other and over sheets | §2.5 |
| P7 | **Stage atmosphere** per trigger; in the dark scene the stage itself moves from dusk to night to morning | The trigger *is* ambient light; the tint never encodes an amount | §5.4, §6.6 |
| P8 | Anatomy adds **muscles, SCN, pineal gland and the eye** in the cutaway, and **pancreatic islets** at close-up | Needed by the meal and dark scenes | §5.2 structure list |
| P9 | More sheet's **Why?** is the trail of steps up to the selected hotspot; its evidence block is a claim line with an honest review status | Makes the doc 04 claim model visible without inventing citations | §2.5 |
| P10 | Try it? and What if? cards **dock on the right**, and the camera frames the scene in the space beside them; labels stay out from under the card | A card "beside the hotspot" covered the very organs and outcome badges it asks about (evidence 15 before the fix) | §4.3 |

## Owner decisions still open

- **Illustration style** (Phase 0): the prototype uses D · Hybrid as a working choice.
- **D7 What if?** now has three authored counterfactuals (brake stops, liver can't answer glucagon, lights stay on). Accept, or defer.
- **D11 Zoom is depth**: accept removing the depth selector.
- **D5 Rotation**: accept front view plus zoom for R1.
- **D9 Blood layer**: heart and blood-borne routes only (as built), or a drawn vessel layer.

## Scientific review list

Every label, ⓘ text, sign, Try it? correction, What if? outcome and cell step needs review. Claims most worth scrutiny:

- **Stress:** cortisol acts on the hypothalamus and anterior pituitary (both), adrenaline relaxes airways, "heart settling" wording at hours.
- **Meal:** "rising glucose acts back on the pancreas" simplifies alpha-cell regulation (glucose and local insulin); "glucagon stays high" when the liver can't respond; ghrelin as the stomach's hunger signal; muscles and fat as the insulin targets named.
- **Dark:** melanopsin cells as a separate light-sensing system; the SCN → spinal cord → neck → pineal nerve route; melatonin *modulating* the SCN; "body temperature at its lowest" in the early morning; pupils widening is a light reflex, not melatonin.
- **Leads-to links:** cortisol's morning rise; the SCN shaping cortisol's daily rhythm; glucose released under stress prompting insulin.
- **Advanced (all new, undergraduate-physiology level, marked "Advanced · illustrative draft"):** every passport field for the 12 signals (source, synthesis site, transport, receptor location, timescale in words, clearance); the molecule-class and carrier on each route label; the named cell mechanisms — GR/GREs and PEPCK for cortisol; Gs/adenylyl cyclase/cAMP/PKA, glycogen phosphorylase, glucose-6-phosphatase and GLUT2 for glucagon; the insulin-receptor tyrosine kinase, IRS/PI3K/Akt and GLUT4 for insulin; β1/cAMP/PKA, α1, AANAT and HIOMT (ASMT) for melatonin; the organ/structure one-liners (e.g. corticotrophs, superior cervical ganglion). None of it is anatomy-placed; it rides on the same placeholder art.

## Anatomy review list

Placeholder shapes only. Review organ positions and proportions, laterality in the front view, the sagittal cutaway (relative positions of SCN, hypothalamus, pituitary stalk and lobes, pineal gland, optic chiasm), muscles, and the level-of-detail sets (adrenal cortex/medulla, pituitary lobes, pancreatic islets).

## Known limitations

- Front view only; no light theme (the direction is dark-first; style A is the light basis).
- Label offsets are authored in screen pixels per hotspot, with collision fallback; the real scene engine should author them per zoom level.
- Inside an artifact viewer the page address is not the viewer's address, so "copy link" is for the repo-served prototype.
- Desktop pointer and keyboard only; touch is out of scope (D13).

## Next, once decisions land

1. Illustration brief and commission (§11 Phase 1), using the P8 structure list.
2. Scene engine and system in `src/` (§11 Phase 3): the data shape in `prototypes/v4/js/scenes/*.js` is a working draft of the scene contract.
3. Run the §10 prototype tasks with 6–8 learners on this build.
