# v4 round 4: the reconciled work list

Date: 15 September 2026 · branch `design/v4-quality-round4`
Inputs: [v4-round4-plan.md](v4-round4-plan.md) (the plan) · [v4-round4-review-visual.md](v4-round4-review-visual.md) · [v4-round4-review-interaction.md](v4-round4-review-interaction.md) · [v4-round4-review-learning.md](v4-round4-review-learning.md)

This supersedes the plan's §2 as the thing to build. Where a review disagreed with the plan, the disagreement is resolved here, and where two reviews disagreed with **each other** the resolution is argued rather than averaged. Every claim marked **[measured]** was verified against the running build by the reviewers and, for the four heaviest, re-verified independently.

## What changed from the plan, and why

Six decisions, in order of consequence:

1. **R4-3's `schematic` prefix on every route name is CUT.** The learning review's case is stronger than the plan's: prefixing six route names permanently, in the pathways already at 7 of the 8 available labels, is habituation — and it **reverses the direction's own rule** (§5.3/§7 specify `ACTH · schematic route` on *first appearance*, then the short name). The plan stripped those first-appearance strings out of scene data so it could re-add them everywhere. Ship the route-card deny line only, which fires at the moment of confusion, next to the texture swatch that is the visual evidence it denies.
2. **R4-2 fixes the mark's *shape*, not just its caption.** The learning review is right that a caption on a dashed line fights the ambiguity instead of removing it, and that the plan's anchor was the `?` badge's own midpoint — captioning the confusion. The ghost path is split so the line terminates into the `?` at a blunt unfinished end, and the always-on label becomes a question in the learner's voice. Both reviews agreed on the `!isRevealed()` gate surviving a backwards ribbon scrub **[measured]**, and both agreed the label must be pointer-neutral, so the copy says "open the ? dot", not "tap ?" (the literal `?` key opens the shortcut list app-wide — `app.js:25`).
3. **R4-2's gate drops the `HS.level() === 'body'` test.** `dark:night` opens at **organ** level (zoom 2.75) **[measured by two parties]**, so the plan's gate would have silently skipped one of the four pathways its own acceptance check names.
4. **R4-5 restores the sequencing tip and makes `playAll` honest.** The plan deleted the §3-mandated "now follow the slow route" beat to substitute a contrast cue, and its replacement copy was **false**: `playAll` calls `enterPathway` per option, which fades the other route out **[verified in `engine.js:172–179`]**, so "see the slow route arrive while this one fades" described something the build does not do. Fix the behaviour (hold route A `faint` while B plays) *and* append the cue rather than replacing the beat.
5. **R4-4 is re-based on the existing `HS.tip` mechanism**, not a new per-session `Set` latch. The plan's latch is cleared in one place but needs five **[measured]**, which made its own acceptance check unsatisfiable, and `HS.tip` is already one-shot, dismissible, remembered and Settings-switchable.
6. **R4-6 shrinks to the one honest sheet.** A Thyroid row that sends the learner to the HPA axis asserts the thyroid axis *is* the HPA axis — a physiology claim produced by a navigation button, in a product whose central honesty claim is that it asserts no unestablished relationships. `thyroid` and `dopa` get an honest "not built yet" row and an upgraded toast; only `glucoseSys`, which actually has children, gets a real overview sheet.

## Kept from the plan unchanged

The diagnosis (an answer existing vs being where the learner is looking); refusing to fix the ghost by brightening or dimming it; R4-1's trigger aliases and static no-motion accent; making "say it back" reachable rather than adding a control; R4-5's three-way gamification fence (no `recordAttempt`, no correctness, model framed as "how we'd put it"); refusing Theme F's guided recall and quiet body map; refusing a persistent grammar legend on `#lvlChip`; refusing a `playAll` progress bar; running the quality bar after each risky item with a learning-preserving remedy (drop a hotspot label, never raise the cap).

---

## The work list

| # | Item | Lens that forced it | Effort | Commit |
|---|---|---|---|---|
| **R4-1** | First-run: trigger aliases, own `.first` skin, and **Enter on the body starts the first trigger** | interaction (task 1 is broken, not passing) | S | 1 |
| **R4-2** | The unrevealed line reads unfinished in its **shape**, with one always-on pointer-neutral label | learning + interaction | M | 2 |
| **R4-3** | The not-a-vessel answer arrives at the moment of confusion (route card), not as a prefix | learning | S | 3 |
| **R4-4** | The carrier grammar is taught once via `HS.tip` + the existing legend | learning (re-based) | S | 4 |
| **R4-5** | "Say it back" on demand; the fast→slow hand-off kept and the contrast made true | learning + interaction | M | 5 |
| **R4-6** | One honest overview sheet (`glucoseSys`); the two unbuilt systems stop being dead ends | learning (shrunk) | S–M | 6 |
| **R4-7** | Proxies, evidence, review list, direction §14, and the two weak checks repaired | all three | M | 7 |

### R4-1 — first-run cue and the body Enter defect

- `ui.js` `HS.TRIGGERS`: add a plain-language alias per trigger (`an exam, a near miss, a fright`), also pushed into `syn` so search finds it. Render as the row's `small` line.
- `ui.js` `HS.renderTriggers`: while `HS.E.state !== 'triggered'`, add `class="first"` to each row. **Its own skin**, not `.trig.continue` — that is the blue Continue-row treatment and a returning learner would see four near-identical controls (interaction #9).
- `camera.js` `#world` keydown: **Enter starts the first trigger** when no scene is triggered. This is the real task-1 fix: the first Tab stop is `#world` and Enter there currently leaves `HS.E.state === 'idle'` **[measured]**.
- Acceptance: first Tab stop on first paint, Enter, → `HS.E.state === 'triggered'`; `.first` count is 0 afterwards; three aliases present; labels/overlaps unchanged.

### R4-2 — the unrevealed line says so in its shape

- `overlay.js`: split the ghost's drawn path at the `?` badge so the line **terminates into the dot** with a blunt cap (every other route kind has an end glyph; §5.3 withholds one from the ghost, so the asymmetry is made loud). Static — no motion, so reduced motion needs nothing new.
- `overlay.js` `renderOverlay`: one always-on label, gated `p.gate && !HS.isRevealed() && !E.tryMode && !E.whatIf` — **no level test**. Text is scene data (`gate.unrevealed`) and pointer-neutral.
- `overlay.js` line ~151: suppress the hover label while the always-on one is present (`!items.some(i => i.key === 'ghostword')`), because otherwise hovering renders both and breaks the 8-label ceiling **[measured: 9 labels]**.
- The label's span gets `aria-hidden="true"`; `HS.say` already announces the gate.
- Push it **before** `getLabels()` items so it wins collision resolution and is not dropped by the 8-cap.
- Acceptance: wording present in all four gated pathways at their natural level; hover adds no second label; reveal removes it; scrub back keeps it gone; label count ≤ 8 with 0 overlaps at 1280/1440/1920.

### R4-3 — the not-a-vessel answer at the moment of confusion

- `ui.js` `HS.showRouteCard`: add the deny line — `Schematic: not a drawing of a blood vessel or a nerve.` — above the existing texture swatch, which is the evidence for the claim.
- `ui.js` `openRead`: **`scrollTop = 0` on open** (copied from `openMore`), because the sheet is 1332 px tall in a 636 px viewport and the existing "About routes" paragraph sits at y≈1053 **[measured]** — i.e. the answer already exists and is merely unreachable.
- Keep the direction's first-appearance treatment (`ACTH · schematic route` then the short name); do **not** add a prefix renderer, do not touch `engine.js:115–116`, do not rewrite the three scene labels.
- Acceptance: deny line present in `#cards` one click from the body; the route-card texture swatch is still visible without scrolling; no route name got longer, so label counts are unchanged.

### R4-4 — teach the carrier grammar once

- Replace the planned latch with an `HS.tip` at first pathway entry rendering the existing `HS.grammarLegend()`. `HS.tip` is already one-shot, dismissible, remembered and Settings-switchable (`ui.js:49`).
- Drop `short dashes = a portal hop` in favour of `HOW`'s existing `carried a short way in portal blood` — "short" is the one word in the legend that can read as magnitude (§5.4).
- Add a guard assertion that **no** string in `TEXTURE`/legend contains a comparative or magnitude word, and restate in a code comment that bead spacing is fixed and never tied to quantity.
- Acceptance: exactly one carrier legend tip per session; dismissible; absent under reduced motion only if tips are off (tips are independent of motion); no new label on the stage at body level.

### R4-5 — "say it back" on demand, and an honest hand-off

- `engine.js` `openReflect`: **no `force` flag, keep every early-return** — `#reflCard`, `#tryCard`, `#wiCard` all sit at `right:16px; top:96px` and would stack (interaction #4). Expose `HS.openReflectNow` as a caller-side alias that closes any open card first.
- `engine.js` `renderDots`: render a **sibling** `<button id="bSay">` from its own markup, gated on state (`p.reflect && !E.playing && !E.tryMode && !E.whatIf`), **not** on `reflectSeen`. `#timeChip` is overwritten every step, so a button inside it is destroyed **[measured]**.
- `engine.js` `afterPlay`: **restore** the fast→slow hand-off and append the contrast: `That was the fast route, within seconds. Now follow the slow route: choose Slow — or press ▶ Watch it all to see both across the ribbon.`
- `engine.js` `playAll`: hold route A `faint` while B plays (the `faint` state already exists), so the contrast cue is **true**.
- First manual open behaves as today (model hidden); later opens in the session open with the model visible and the prompt recast as comparison — preserving the retrieval benefit without a counter.
- `app.js`: bind `Y`, listing it in `KEYS`; record and restore the **invoking focus origin** rather than always `#bRead`.
- Fix the model line's referent: `its brake` → `cortisol's brake on the brain … that slow response` (adrenaline is *cleared* — `stress.js:21` — so the possessive, not the physiology, is the error).
- Acceptance: card opens by script with no pointer input in all five pathways; prompt equals `p.reflect.q`; model non-empty; automatic path fires once; `HS.recordAttempt` call count is 0 across the reflect path; `#bSay` survives a step change; `Y` opens it; no dialog stacking.

### R4-6 — one honest overview sheet

- `ui.js` `HS.TREE`: rename the two unbuilt systems' suffix to `· not built yet`; keep an upgraded toast that says what the system is for and where the nearest built thing is. **No `[data-go]` to an unrelated pathway.**
- `ui.js` `HS.openOverview(id)`: one real sheet for `glucoseSys`, reusing `#sheet` with `openMore`'s open/close/focus contract, `scrollTop = 0`, and `HS.sheetReturn` set to the invoking row.
- Acceptance: `glucoseSys` row opens a non-empty sheet with a question, a named signal, a limits sentence and ≥1 `[data-go]`; `[data-go]` closes the sheet **before** opening the pathway; Escape returns focus to the row; `thyroid`/`dopa` rows say "not built yet" and navigate nowhere.

### R4-7 — close the loops, and repair the two weak checks

- Repair the two checks the planner flagged: `route marks have luminance spread ≥ 30` must only consider **active** routes, and `reduced motion: next step advances one step` asserts `after >= before`, which cannot fail — make it assert a real advance.
- Add: a route that is `on` still has a **visible name** (the `drop` path in `overlay.js:179` can hide a route name and the current audit stays green — a silent regression my own label-squeeze check exposed).
- Add: reduced motion asserted two-pronged — `animationName === 'none'` **and** `transitionDuration <= 0.12s` — over an enumerated element list, because `animationName` alone passes on `#sheet`, whose motion is a transition, and `.card` still runs `tipin 0.18s` under `.rm` today **[measured]**.
- Fix `.rm`: append `.rm .card{animation:none}` to the list at `app.css:386`.
- Regenerate evidence including the 8 screenshots a reviewer deleted from `coverage/v4/tmp-review`.
- Docs: `v4-round2-goal.md` Phase 16 rows; `relay-design-direction.md` §4.3 (on-body unrevealed state is a requirement) and §14 (P11–P13); `v4-prototype-review.md` (beyond-the-direction table + scientific review list, adding the `Watch it all` tip sentence and the "no score and no wrong answer" sentence, and the two `reflect` model lines); `v4-round3-ideas.md` (what shipped).

## What is explicitly not proxied

Stated at the same strength as the plan's own list. A script can prove presence, reachability and state; it **cannot** prove that a learner reads the ghost as "not yet revealed" rather than "an association someone hasn't drawn", that a learner rejects the vessel reading, or that their explanation of negative feedback is any good. For those four, the evidence is the scripted proxy **plus a committed screenshot plus an explicit judgement recorded in the review note** — never a claim that the task passed.

One addition the learning review asked for, which is a guardrail on *our* claims rather than on the learner's: the `stroke-dasharray` byte-equality check proves the texture is **fixed**, not that a learner reads it as a carrier rather than an amount. The §5.4 claim is written at that strength.
