# Human Signals V4 — independent browser review, Round 2 opening

Date: 16 September 2026
Reviewer: independent browser-review agent (Playwright/Chromium, review only — no application code modified)
App under review: `http://localhost:8765/v4/` (static server on :8765)
Evidence: probe scripts under `coverage/v4-r2/probe-0*.mjs` (gitignored) run against the live app; screenshots under `docs/improvement/validation-v4-r2-*.png` as cited per finding.

This review re-establishes the Round 2 baseline per the Round 2 rules in
`quality-bar.md`: the previous round's self-reported 5/5 is not inherited; each
pillar is scored against the level tables as written, from what is actually
observable in the browser.

---

## 1. Baseline pillar scores

| Pillar | Baseline | Target (baseline + 2, cap 5) |
| --- | ---: | ---: |
| Visual quality | **4** | 5 |
| Interactivity | **4** | 5 |
| Learning experience | **4** | 5 |

### Visual quality — 4 (explanatory)

The stage reliably teaches the causal grammar at the moment it matters, which is
the level-4 bar: active routes carry direction arrows and carrier textures, the
unrevealed feedback loop is drawn literally unfinished with a "Not revealed yet"
label anchored to it (`#s=meal&p=between` @1280×800,
`validation-v4-r2-trigger-meal-1280x800.png`), the line-grammar legend is handed
to the learner on stage (`validation-v4-r2-stress-fast-1920.png`), and time is a
qualitative ribbon, not a clock. Composition survives grayscale (active/faint
states separate by opacity and weight, the ghost by dash —
`validation-v4-r2-grayscale-meal-1920.png`; corroborated by the
`v4-quality-bar.mjs` grayscale probes) and holds at all four supported widths
(`validation-v4-r2-fresh-{1024x768,1280x800,1440x900,1920x1080}.png`), with no
label/UI collisions observed beyond what the 106/106 script pass already
asserts. It is not a 5: text at 200% base size set mid-session overlaps the
caption with the systems panel at 1024×768 (V4-R2-03), and the Blood layer
toggle's stage effect is barely perceptible at whole-body zoom (V4-R2-06), so
the "coherent across text scaling / open panels, no unresolved issues" bar of
level 5 is not met.

### Interactivity — 4 (meaningful)

Interactions expose cause and consequence, which is the level-4 bar: Try it?
requires a prediction before the loop is revealed, What if? requires a
prediction before "See what happens" and is fully reversible via Restore, Say it
back is ungraded and never records (probe-03), routes/segments/steps are
re-explored freely, and Watch it all plays both routes across the shared ribbon
(probe-02). The keyboard model is real: Tab order is logical with a visible
3px outline on every stop, `]`/`[` advance steps, a full pathway step advance
works keyboard-only, and the ribbon handle scrubbing works by arrow keys
(probe-05). It is not a 5: interrupting with Escape while a popover is open
leaves a stale popover and can exit the pathway underneath it (V4-R2-01, P1),
Escape from Try it? / What if? / Rebuild drops focus to the stage instead of
restoring the opener (V4-R2-02), the ribbon slider lacks Home/End (V4-R2-05),
and two advertised shortcuts (T, W) are silently dead on stress:fast
(V4-R2-07) — exactly the "no stale, contradictory, or inaccessible state"
regression surface level 5 demands.

### Learning experience — 4 (teachable)

The experience supports retrieval, prediction, mechanism feedback, progressive
disclosure, comparison and transfer, which is the level-4 bar: Say it back
opens with the model answer hidden on first visit and offers it for
self-comparison (probe-03); the gated Try it? withholds Say it back until the
loop is revealed, so the model answer never pre-empts the exercise
(`v4-comprehension-check.mjs` task 7 confirms); attempt recording is honest
("Recorded as an assisted attempt, because Why? was opened first"); the draft
status is on every screen and every explanatory block carries its truthful
evidence status ("Illustrative draft; not scientifically reviewed · Source: no
source assigned" — `validation-v4-r2-read-sheet-stress-1440.png`,
`validation-v4-r2-passport-cortisol-1440.png`). Trigger → source → signal →
target → effect is followable in all three scenes from their triggers
(probe-01), and "Watch it all" plus the compare map give the whole-body story.
It is not a 5: level 5 requires bounded learner observation in addition to
independent browser review, and no such observation exists in the repository —
that gate stays explicitly open — and searching for a body sign the app itself
names ("pupils") dead-ends (V4-R2-04).

---

## 2. Findings

### V4-R2-01 — Escape ignores Layers/Settings popovers and fires the underlying Escape action (P1)

- Severity: P1 (clear quality-bar violation a learner hits)
- Pillar: Interactivity
- Route/state + viewport: any pathway, e.g. `#s=meal&p=between` with the Layers or Settings popover open, 1440×900 (not viewport-dependent)
- Observed: with `#popLayers` open, pressing Escape leaves the popover open (`probe-04` `popState2.open === true`, `probe-05` `esc-layers-popover.popAfter.open === true`) and the keydown falls through the Escape chain in `app.js` (which has no `.pop` branch) to the pathway semantics — at whole-body level with a route open, the next Escape calls `HS.leave()`, exiting the pathway while the popover is still on screen (probe-05 `esc3.route === null` with the popover open).
- Expected: the popover is the active surface; Escape should close it first (and restore focus to its toolbar button), matching the app's one-active-layer contract and the quality-bar level-3 "Escape/close behavior coherent". Outside click already closes popovers; Escape parity is the gap.
- Consequence: a learner who opens Settings mid-pathway and presses Escape to dismiss it exits the pathway and is left with a floating popover over the home scene — a contradictory state they must notice and clean up.
- Acceptance criteria: (1) with a `.pop` popover open, Escape closes it, restores focus to `#bLayers`/`#bSettings`, and changes no pathway/camera/dialog state (assertable: popover hidden + `E.route` unchanged after Escape); (2) a regression probe drives popover-open + Escape on `#s=meal&p=between` and asserts the route survives; (3) no console errors.
- Evidence: `coverage/v4-r2/probe-04.mjs`, `probe-05.mjs` outputs.

### V4-R2-02 — Escape from Try it?, What if? and Rebuild drops keyboard focus on the stage instead of restoring the opener (P2)

- Severity: P2
- Pillar: Interactivity
- Route/state + viewport: gated pathway Try card (`#s=meal&p=between`), What if? after reveal, Rebuild via Advanced; 1440×900
- Observed: Escape-close of `#tryCard`, `#wiCard` and `#rbCard` leaves `document.activeElement` on the `#world` stage with no focus ring (probe-05 `esc-try.focusAfter = BODY`, `esc-whatif.focusAfter = BODY`; probe-07 `rebuild.rbClosed.focus = BODY`). Root cause is visible in code: the layers close callbacks are registered as `()=>closeTry(false)` / `()=>restoreWhatIf(false)`, discarding the focus flag that `HS.layers.start` passes to `close(true)` on Escape (compare the keys dialog, which passes it through and does restore — probe-04 `keysClosed.focus = bSettings`); additionally `HS.layers.opener()` treats `document.body` as an "available" opener, so on click-paths that do not focus buttons (macOS convention) even a correct restore would target the stage.
- Expected: the app's own contract ("closing returns focus to the opener") and quality-bar level-3 focus restoration; the cards' visible Close/Restore buttons do restore — only the Escape path drops it.
- Consequence: a keyboard learner who opens Try it? / What if? (keys T / W are advertised) and closes with the advertised Escape loses their place and must re-tab from the top of the document.
- Acceptance criteria: Escape from each of the three cards restores focus to the control that opened it or its documented fallback (`#bRead`/`#bWhat`), asserted by a probe that opens each card, presses Escape, and checks `document.activeElement.id`; body is never the restore target when a fallback exists.
- Evidence: `coverage/v4-r2/probe-05.mjs`, `probe-07.mjs`.

### V4-R2-03 — At 200% base text set mid-session, the systems panel overlaps the scene caption at 1024×768 until the next state change (P2)

- Severity: P2
- Pillar: Visual quality
- Route/state + viewport: `#s=meal&p=between`, 1024×768, root font-size set to 200% after load (browser default-font or user-stylesheet path — no `resize` event fires)
- Observed: panel and caption overlap by ~302×93 px; the caption ("You skip a meal / Glucose in the blood starts to fall") is largely behind the panel (`validation-v4-r2-text200-noresize-1024.png`). The `html.bigtext` mitigation works when it runs: after any resize or pathway re-entry, `applyTextScale()` moves the caption right and clears the overlap (`validation-v4-r2-text200-afterresize-1024.png`, overlap 0) — but it only recomputes on load, `resize`, and `enterPathway`, so the stale window is real for exactly the "user sets a larger base size" scenario the CSS comment targets.
- Expected: visual level 2 — "text remains usable at 200% base size" — without requiring the learner to trigger a resize or re-enter a pathway.
- Consequence: a learner who enlarges their base font while a pathway is open reads a caption that is half-hidden; the fix exists but does not engage.
- Acceptance criteria: with a 200% root font-size applied at any time, `document.querySelector('#caption')` and `#panel` do not intersect at 1024×768 (probe asserts overlap area 0 both with and without a subsequent resize), or `applyTextScale` observes root font-size changes directly (e.g. ResizeObserver on `documentElement`).
- Evidence: `coverage/v4-r2/probe-07.mjs` (`text200-both`), screenshots above.

### V4-R2-04 — Searching for a body sign the app itself names ("pupil") returns "No match" (P2)

- Severity: P2
- Pillar: Learning experience / Interactivity
- Route/state + viewport: search palette (⌘K) on a fresh load, 1440×900
- Observed: query "pupil"/"pupils" → "No match. Try a signal like ACTH, an organ, or 'stress'." (`validation-v4-r2-search-pupil-1440.png`), while the app itself surfaces the sign in the stress ribbon copy ("Adrenaline: heart faster, pupils wider…"), Read the route ("Pupils widen"), and the compare view. By contrast "insulin" jumps to the meal:after pathway, "cortisol" and "epinephrine" jump to their signals with organs lit (probe-04 `search:*` entries).
- Expected: a learner searching a word the interface just taught them should land somewhere sensible (at minimum the Fast route, where the sign lives), per the sweep requirement that results "jump to sensible states"; the current empty state dead-ends on the app's own vocabulary.
- Consequence: a first dead-end in the one feature marketed as global lookup ("Search signals, organs, triggers"); the learner learns that search is narrower than the words on screen.
- Acceptance criteria: searching "pupil" or "pupils" offers an entry that opens `stress:fast` (a sign entry, or a synonym on the Fast route); probe asserts Enter reaches `E.sceneId === 'stress' && E.route === 'fast'`.
- Evidence: `coverage/v4-r2/probe-04.mjs`, screenshot above.

### V4-R2-05 — Time-ribbon slider (role="slider") does not support Home/End (P2)

- Severity: P2
- Pillar: Interactivity
- Route/state + viewport: `#s=meal&p=between` (or any pathway), ribbon handle focused, 1440×900
- Observed: `#rbHandle` is a `role="slider"` with `aria-valuemin/max/now/text` and arrow-key support, but Home and End are no-ops (probe-08 `slider-home-end`: tIdx 0 → 0 → 0 on End, Home), and in probe-02 the keyboard path could not jump to the end of the ribbon at all. The WAI-ARIA slider pattern pairs arrows with Home/End for bounded ranges; this handle is bounded 0–4.
- Expected: Home/End move the handle to the first/last reachable stop (respecting the gate's end-block, as mouse scrubs do).
- Consequence: minor — keyboard scrubbing exists but is slower and does not match the announced slider role; screen-reader users expecting the standard keys find them dead.
- Acceptance criteria: with the handle focused, Home sets time index to the lowest reachable value and End to the highest reachable value (gated end still toasts and holds at last−1 until revealed); probe asserts both.
- Evidence: `coverage/v4-r2/probe-02.mjs`, `probe-08.mjs`.

### V4-R2-06 — Blood layer toggle has no clearly visible stage effect at whole-body zoom (P2)

- Severity: P2
- Pillar: Visual quality
- Route/state + viewport: Layers popover on `#s=meal&p=between`, 1440×900
- Observed: Nervous toggling is obvious (nerve tract opacity 0.35 → ~1.0) and Endocrine de-emphasis is obvious (glands to `saturate(0.2)`), but Blood only adds a `.lit` outline stroke to the heart organ, which sits dimmed at opacity 0.32 when outside the active pathway — measured computed styles are unchanged (probe-04 `afterBlood` identical to `before`) and the before/after screenshots (`validation-v4-r2-layers-before-1440.png` vs `validation-v4-r2-layers-blood-endocrine-1440.png`) show no change a learner could name. The toast explains the intent ("the heart and blood-borne routes are emphasised") but the stage does not visibly follow.
- Expected: the review-sweep bar — "visual effect on stage actually visible"; level-4 visual requires carrier/location emphasis to be readable without guesswork.
- Consequence: a learner toggling Blood concludes the control is broken and stops trusting the Layers popover.
- Acceptance criteria: enabling Blood produces a before/after stage difference that is measurable (e.g. heart group opacity/emphasis, or lit-class on blood-borne routes, not only stroke color of a dimmed organ) and visible in screenshots at whole-body zoom; probe asserts the measured property changes.
- Evidence: `coverage/v4-r2/probe-04.mjs`, screenshots above.

### V4-R2-07 — Advertised shortcuts T and W are silently dead on stress:fast (P2)

- Severity: P2
- Pillar: Interactivity
- Route/state + viewport: `#s=stress&p=fast`, 1440×900
- Observed: the Keyboard dialog lists T ("Try it?") and W ("What if?") under "In a pathway" unconditionally, but stress:fast has no gate and no whatIf, so pressing T and W does nothing (probe-05 `esc-try.tOpen === false` after T on stress:fast) with no feedback; the same pathway bar hides the equivalent buttons correctly.
- Expected: either the shortcut list is scoped to what the current pathway supports, or a no-target press gives the same honest feedback the UI buttons give by being absent (toast/status), per level-2 "every advertised trigger … works".
- Consequence: a keyboard learner following the ? dialog hits two dead keys on the scene most learners try first (stress), and cannot tell whether the feature or their keystroke failed.
- Acceptance criteria: pressing T/W on a pathway without a gate/whatIf produces visible or announced feedback (or the shortcuts dialog marks them per-pathway); probe asserts a status message (or scoped dialog) on stress:fast.
- Evidence: `coverage/v4-r2/probe-05.mjs`.

---

## 3. Regression check results (run this session, from repo root, server on :8765)

| Script | Result |
| --- | --- |
| `node scripts/v4-quality-bar.mjs` | **106/106 pass, 0 fail** (layout/collisions at 1280/1440/1920, label ceiling during playback, route names, grayscale, reduced-motion advances + no animation, text zoom, reader focus @1280 and @1024, console clean) |
| `node scripts/v4-comprehension-check.mjs` | **47/47 pass, 0 fail** (triggers, ghost grammar, route card, evidence status, Say it back gating/ungraded, layer contract, keyboard, shortcuts) |
| `node scripts/v4-browser-check.mjs` | **ERRORS: none**, title "Human Signals Body Scenes" |

Additional sweeps performed for this review (all console-error-free unless a
finding says otherwise): fresh loads at 1024/1280/1440/1920; all three scenes
started from their triggers at 1280×800 and 1024×768; full pathway progression
including Watch it all, exit, Continue-card re-enter, progress persistence;
share-link round-trip into a fresh context (identical scene/route/time/step,
opened paused — `validation-v4-r2-share-restore-1440.png`); zoom +/−/reset,
minimap zoom-out, arrow-key pan (viewBox moves); Read sheet open/close/restore;
Say it back; gated Try it? reveal; What if?; Advanced + passport; How-these-connect
and compare views with legend; Layers toggles; all Settings switches; erase
progress with two-step confirm; an aggressive multi-scene interaction pass with
**zero console errors/pageerrors** (probe-06).

## 4. Scope note

This review covers layout, state, interaction and wording in the browser only.
The anatomical/physiological correctness of the model, the artwork, asset
provenance, and publication readiness remain separate review gates and are
**not** assessed or closed by this report; the "Illustrative draft · not
reviewed science" banner and per-block "Source: no source assigned" statuses
observed on every surface are the app's own (correct) marking of that open gate.
