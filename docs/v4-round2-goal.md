# Goal, round 2: perfect the three scenes, add an optional Advanced flow

Date: 15 September 2026
Builds on: [v4-prototype-goal.md](v4-prototype-goal.md) (phases 0–8, done) · [v4-prototype-review.md](v4-prototype-review.md)
Lives in: [`prototypes/v4/`](../prototypes/v4/)

## The goal in one line

> **The three existing scenes feel finished: every interaction responds, every transition carries meaning, nothing collides at any supported width. On top, an optional Advanced flow lets a curious or advanced learner go deeper and test themselves, without changing the guided experience for anyone else.**

## Rules for this round

1. **No new cases.** No new triggers, pathways or organs systems. Work only inside stress, meal and dark.
2. **Advanced is optional and off by default.** Nothing in the guided flow is gated behind it, and turning it off returns exactly the guided experience. Its state is remembered locally and erasable.
3. **Advanced stays honest.** Named receptors, molecule classes, transporters and second messengers at undergraduate-physiology level, marked "Advanced · illustrative draft". Still no numbers, doses, gauges, diseases or treatments; time stays in words.
4. **Motion carries meaning, never decoration**, and every animation has a reduced-motion equivalent.
5. **One commit per phase**, verified in a browser with no console errors, with the goal's progress table updated in the same commit.

## Phases

| # | Phase | What ships | Done when |
|---|---|---|---|
| 9 | **Feel** | Labels and hotspots enter softly; hovering a hotspot previews its step and lights the route into it; hovering a route lights it and names the signal, clicking it opens a signal card (the dashed ghost offers Try it?); hovering a trigger or search result previews its organs; the arriving organ brightens once when a pulse lands; the time ribbon glides and can be clicked anywhere; route cross-fades on Fast / Slow; the current step is marked in the pathway bar; a first-load entrance for the body; the pathway bar and ribbon adapt from 1024 to 1920 without touching the zoom controls or mini-map | Scripted check at 1024, 1280, 1440, 1920 shows no bottom-bar collisions in any pathway; reduced motion still passes |
| 10 | **Craft of the illustration** | Refined heart (atria, great vessels), lungs (bronchial tree), brain in the head (hemispheres), kidneys with ureters, silhouette rim light; active routes get a soft static glow; ghost lines breathe once when first shown | Before/after evidence; routes and hotspots stay the most salient things (grayscale and squint check) |
| 11 | **Advanced: foundation and signal passports** | An *Advanced* switch (pathway bar and settings, key A). When on: advanced one-liners at organ and structure level; route labels name the molecule class; a **signal passport** for every signal in the five pathways (what it is made from, where it is made, how it travels, where its receptor sits, how quickly it acts, how it is switched off), opened from the route, the tree or More; a passport comparison table that makes peptide vs steroid vs amine visible | Passports for all 12 signals; guided flow unchanged with Advanced off |
| 12 | **Advanced: Rebuild the route** | A challenge per pathway: routes and numbers hide, the learner taps organs in causal order (with distractors) and names the signal on each link; Check gives specific corrections, then the true route draws on; recorded as practice | Works in all five pathways by mouse and keyboard |
| 13 | **Advanced: Compare routes** | In scenes with two pathways (stress, meal): both routes on one body in distinct styles, a shared ribbon showing where each is active in words, and a side-by-side table (first signal, carried by, reaches, timescale in words, what you'd notice, switched off by) | Fast vs Slow and Between vs After both readable at 1280 |
| 14 | **Cell mechanisms, step by step** | Every cell inset steps through its mechanism (Next / Previous, the active part lit, others dimmed); Advanced adds the named molecules (glucocorticoid receptor, cAMP, GLUT4, AANAT, MT1/MT2…) | All five insets, keyboard and reduced motion |
| 15 | **QA, evidence, publish** | Overlap and bottom-bar audits with Advanced on and off, reduced-motion and keyboard walk-throughs, refreshed evidence, republished artifact, review note updated with the Advanced flow and what it needs reviewed | Artifact link shared; evidence committed |

## Progress

| Phase | Status | Notes |
|---|---|---|
| 9 | Done | Labels and hotspots enter softly; hotspot hover/focus previews the step and lights the route into it; routes have wide hit areas: hover lights them and names the signal, click opens a signal card, the dashed ghost says "Something acts back here · Try it?" and opens it; trigger and search-result hover preview organs; the organ a signal lands on brightens once; route opacity cross-fades; the ribbon glides and accepts clicks anywhere; the current step is filled in the pathway bar; the body settles in on first load. Layout: at ≤1400 px the time chip and "Read the route" text fold away and zoom controls sit above the mini-map; at ≤1180 px the pathway name and Play text fold into icons, toggles use short words and the caption drops below the toolbar. Checked by script: no bottom-bar collisions or overflow in all five pathways at 1024, 1280, 1440 and 1920 |
| 10 | Done | Heart gains its great vessels (aortic arch, pulmonary trunk, superior vena cava) that scale with zoom; lungs a faint bronchial tree; the silhouette a soft inner rim light from the top-left. Active routes carry a quiet static glow that waits until draw-on finishes; a ghost feedback line breathes once when it first appears so the eye finds it. All static or one-shot, none of it encodes amount, and reduced motion skips the breath |
| 11 | — | |
| 12 | — | |
| 13 | — | |
| 14 | — | |
| 15 | — | |
