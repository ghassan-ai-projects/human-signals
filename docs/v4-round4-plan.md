# v4 round 4 plan: make the answers to §10 tasks 1, 5, 6 and 7/8 live where the learner is looking

Date: 15 September 2026
Branch: `design/v4-quality-round4`
Builds on: [v4-prototype-goal.md](v4-prototype-goal.md) (phases 0–8) · [v4-round2-goal.md](v4-round2-goal.md) (phases 9–15) · [v4-round3-ideas.md](v4-round3-ideas.md) (round 3, all shipped, plus the round-4 baseline) · [v4-prototype-review.md](v4-prototype-review.md) · direction: [relay-design-direction.md](relay-design-direction.md) §4, §10
Prototype: [`prototypes/v4/`](../prototypes/v4/)

---

## 1. Decision and rationale

> **This round closes the gap between an answer existing and an answer being present where the learner is already looking, and between a claim being readable and a claim being learnable, for exactly the four §10 tasks no script has yet exercised behaviourally: 1, 5, 6 and 7/8.**

Why these and not others:

- The measurable half of the §10 bar is green and independently re-verified for this plan: `node scripts/v4-quality-bar.mjs` → **83/83 pass**, and `coverage/v4/qb-baseline.json` matches on disk. Layout, salience-proxy, grayscale, reduced-motion and console checks need no round-4 work.
- The comprehension half is **12/14** (`scripts/v4-comprehension-check.mjs`, baseline `coverage/v4/comp-baseline.json`, recorded in `docs/v4-round3-ideas.md` §"Round 4: the comprehension bar, measured"). Both failures are *placement* failures, not content failures, and both are two of the four tasks you named.
- Tasks 1 and 7/8 are proxied as passing, but their proxies are **static-attribute probes, not behavioural ones** (T1: "is there a button with a subtitle"; T7/8: "do these words appear in the sheet"). I re-measured task 1 by hand and it is worse than the pass suggests: the **first tab stop on the first screen is the body SVG, and Enter there does nothing** — the entry point is seven stops in. A probe that reads `aria-label` cannot tell you whether a first-time learner finds a trigger, and a probe that reads the Read-the-route sheet cannot tell you whether a learner can *say the mechanism*. This round makes both proxies behavioural.
- Round 3 already built self-explanation (`pathway.reflect`, `openReflect` in [engine.js](../prototypes/v4/js/engine.js) — B3) and the "how these connect" map (`HS.openConnMap` in [ui.js](../prototypes/v4/js/ui.js) — B2). Task 7/8 is the only remaining high-value comprehension target whose affordances **already exist and are inert**, so the work is wiring and cueing, not new surfaces. That is the cheapest large win on the board.

**Expected outcome at the end of this round:** `scripts/v4-comprehension-check.mjs` **14/14, and 24/24** once the two new behavioural probes land; `scripts/v4-quality-bar.mjs` still **83/83**; no console errors; guided flow unchanged with Advanced off.

---

## 2. Ordered work items

Seven items, one commit each. Each is independently revertible and none depends on a later item. Effort: S ≤ half a day, M ≈ a day, L > a day.

Suggested order: **R4-1 first** (it is the interactive one and touches frames the others then sit on), then R4-2 → R4-3 → R4-4 → R4-5 → R4-6 → R4-7.

---

### R4-1 · Put the alias in the trigger, and make the first click an outcome

**§10 task:** 1 — *does a first-time learner click a trigger or an organ within 10 seconds, with no instructions?* (also, weakly, 2).

**Learner-facing problem.** Measured on the current build at 1440 × 900 with a keyboard, walking the tab order from the top:

| Tab stop | Element | Box | Enter does |
|---|---|---|---|
| 1 | `#world` (the body SVG, `tabindex="0"`) | **0,0 → 1440,900** — the entire viewport | **nothing.** `HS.E.state` stays `idle`, `HS.E.route` stays `null` |
| 2–6 | `#bSearch`, `#bSystems`, `#bLayers`, `#bHints`, `#bSettings` | toolbar, y = 20 | opens chrome |
| 7 | first `.trig` row | 25,115 → 303,168 | triggers the scene ✔ |

Two defects, and the first is the more serious one:

1. **The first tab stop is the illustration, and it is inert.** A keyboard-first learner's first action lands on a control whose `aria-label` promises *"Arrow keys pan, plus and minus zoom. Use the Systems panel, the pathway controls or Read the route for a text alternative."* — an instruction to go somewhere else. Pressing Enter does nothing at all (verified: state stays `idle`). Meanwhile the one action the tip asks for (*"pick something that happens to you"*) is **six stops away**, past five toolbar buttons. Task 1 is "click a trigger **or an organ** within 10 s" — and today neither the body nor the toolbar does anything leading to a scene. The body being the first stop is defensible for a returning learner; for a first-timer it is a dead end wearing a tab stop.
2. **The cue is absent and the vocabulary mismatched.** The only "start here" signal in the initial viewport is the tip `Start here: pick something that happens to you.` (app.js line 91), a ~300 px box at 326,92 → 630,153 — sitting in the panel's column directly above the trigger rows, which is correct. But the rows it points at say `Watch the fast and slow response`: they describe the *lesson*, not something that *happens to you*.

**Concrete change.**

| File | Function / location | Change |
|---|---|---|
| `js/camera.js` | `#world` keydown handler (lines 86–89), plus `js/app.js` global handler (line 20) | Give the body an honest Enter/Space activation at body level with no scene open: **move focus to the first trigger row** (`HS.$('#triggers .trig').focus()`), rather than doing nothing. This does not presume which scene the learner wants; it hands them to the actual entry point. Also extend the body's `aria-label` in [index.html](../prototypes/v4/index.html) line 15 with `Press Enter to choose what happens.` |
| `js/ui.js` | `HS.TRIGGERS` (lines 74–78) | Add a plain-language alias per trigger: `{id:'stress', title:'Something stressful happens', alias:'an exam, a near miss, a fright', syn:[…], icon:…}`. Same for meal (`you've gone hours without eating`) and dark (`the evening light fades`). The alias words go into `syn` too, so search picks them up. |
| `js/ui.js` | `HS.renderTriggers` (lines 79–81) | Render the alias as the `small` line, replacing the lesson-flavoured subtitle; `S.trigger.sub` stays available as the row's `title` so nothing is lost. Keep `aria-pressed` and the `data-trigger` contract untouched. |
| `js/ui.js` | `HS.renderTriggers` | When `HS.E.state !== 'triggered'`, add `class="trig first"` to each row — one quiet accent (reuse the `.trig.continue` treatment at [app.css](../prototypes/v4/css/app.css) line 328) so the column reads as *the* way in. Removed the moment any trigger is pressed. **Not** an animation, **not** a badge, **no count.** |
| `js/app.js` | first paint (line 91) | No anchor change: the tip already sits directly above the trigger column, and its text `Start here: pick something that happens to you.` is already right. |

**Effort:** S.

**Acceptance check.** In a 1440 × 900 viewport with `HS.tipsOn=false` and cleared `localStorage`: (a) **Tab once from the top, press Enter, assert focus lands on the first `.trig` row and that Enter again opens a scene** (`HS.E.state === 'triggered'` within 600 ms) — the first half of this fails today; (b) the three rows are fully inside the viewport, each has an alias line matching `/exam|eat|light/i`, and each carries `.first`; (c) after any trigger fires, `.trig.first` count is 0.

**Reduced motion / keyboard.** No motion added. **This item *is* the keyboard fix**: today the first tab stop is inert; after it, Enter reaches the entry point. `.first` is a static border, unaffected by `.rm`. The body's `aria-label` change is text-only.

**Risks and guardrails.** No quantity, no gamification: `.first` is an orientation accent on a static list, with no counts, ticks or completion semantics. It is derived from the in-memory `HS.E.state`, **not persisted** — it must not go into `store.js`, or it becomes a "you haven't started yet" nag across sessions. Salience: the accent lives in the panel (`z-index:15`, `--float`), not on the stage.

---

### R4-2 · The unrevealed line says so, on the body, in its own voice

**§10 task:** 5 — *"What does the dashed line with `?` mean?" — the learner must say it has not been revealed yet, not that it is an association.* This is one of the two measured failures (`comp-baseline.json`, `task 5 … "no wording found"`).

**Learner-facing problem.** Open the HPA axis and press nothing: the dashed amber arcs ([stress.js](../prototypes/v4/js/scenes/stress.js) lines 14–15, `f1`/`f2`, `kind:'fb'`) are **the brightest marks on the whole stage** — `HS.setRoute` gives ghost `opacity:.62` plus `.45` casing and a `.14` glow, against `.24`/`.2` for the *faint* edges of the other pathway ([overlay.js](../prototypes/v4/js/overlay.js) lines 44–47) — and they carry exactly one symbol, a `?` badge at `[f1,.5]`. The words that answer task 5 do exist, but only in three places the learner is not at: the hover state (`'Something acts back here · Try it?'`, overlay.js line 151), the hotspot's `aria-label`/`tip` (engine.js line 134), and the pathway's `gate.tipKey` tip, which `afterPlay` shows **only after a full play-through** (stress.js line 41). A learner who opens the pathway and reads the screen — which is exactly what task 5 does — sees two unlabelled orange arcs.

Worse for the specific misconception the task names: an unnamed dashed connector is *the* conventional visual for "association" — and `documentation/07-anatomy-and-visual-system.md` line 53 fixes that convention ("Association is nondirectional dashed context"). So the current build renders the one thing the task says learners must not conclude.

**Concrete change.**

| File | Function / location | Change |
|---|---|---|
| `js/overlay.js` | `HS.renderOverlay` (lines 162–184), label draw loop | When `HS.level() === 'body'` and the pathway has `p.gate` and `!HS.isRevealed()` and `!E.tryMode` and `!E.whatIf`, push one always-on label anchored at `HS.ptOn(g.at[0], g.at[1])` — the ghost's midpoint, above the `?`: `{key:'ghostword', text:'Not revealed yet · tap ? to try it', cls:'badge ghostword', anchor:…, dx:0, dy:-26, noLeader:false, info:null}`. It is pushed **before** `HS.getLabels()` items so it wins collision resolution. Cleanest home for the push is a small helper `HS.gateLabelItem()` in `overlay.js` so `getLabels` in engine.js stays scene-data-only. |
| `js/scenes/*.js` | `gate` blocks, all five pathways | Add `gate.unrevealed = 'Not revealed yet · tap ? to try it'` to each gate (stress `slow`, meal `between`/`after`, dark `night`), so the string is scene data like every other string, not a literal in the renderer. Dark's differs slightly (`… tap ? to try it` is wrong there — the ghost badge is the same `?` hotspot, so the string is identical; keep it identical for consistency). |
| `js/ui.js` | `HS.showRouteCard` (lines 23–36) | For a ghost route the card currently opens only on click and never says "not revealed". Make the ghost case explicit: heading stays, body adds `Nothing has been shown here yet.` — the route card is the second place a learner looks. |
| `js/engine.js` | `openTry` (line 268) | No change needed. But `checkTry`'s `tr.correct` line is the moment the misconception is corrected; leave the wording as authored. |

**Why not just brighten/dim.** An earlier round already considered making the ghost quieter; that is the wrong lever. `.62` opacity is *correct* — it is the invitation. The defect is that the brightest mark on screen is also the least explained. Fix the explanation and leave the salience alone.

**Effort:** S.

**Acceptance check.** Proxied — see §3.

**Reduced motion / keyboard.** Static text, no motion. Keyboard: the `?` hotspot is already in the hotspot tab order (`HS.getHotspots`, engine.js line 134) and its `aria-label` already reads `Try it: something acts back here`; the new visible label changes nothing about focus. Ordering note: the new label is pushed *before* the loop's hotspot labels so the existing `out.slice(0,8)` cap (engine.js line 123) cannot silently drop it — with the dark scene at 7 labels on screen (`qb-baseline.json`) that cap is one label away from being hit.

**Risks and guardrails.** No quantity encoded — the words describe a *state* (not revealed yet), never an amount. The dashed texture stays exactly as it is, so the "association ≠ feedback" grayscale distinction is untouched; the label adds a *second*, non-visual channel. Salience: at body level this raises label count from 7 to 8 on the stress-slow and dark-night views — **exactly the §10 ceiling of 8**. The label must therefore be pushed first and must be allowed to displace a hotspot label if it comes to that. If the audit reports 9, cut a hotspot label from body level rather than raising the cap.

---

### R4-3 · Every route line states what it is not

**§10 task:** 6 — *"Is this line a blood vessel or a nerve?" — every learner must say no.* This is the second measured failure (`comp-baseline.json`, `task 6 … "before opening Read: vessel=false denies=false"`).

**Learner-facing problem.** The disclaimer is correct and complete, but it lives in one place: `openRead`'s static paragraph — *"Routes show that a message travels and where it arrives. They are not drawings of blood vessels or nerves. The line's texture shows how the message is carried; the arrow end shows what it does."* ([ui.js](../prototypes/v4/js/ui.js) line 248) — inside the side sheet, **below the fold** at 1440 × 900 (visible in `coverage/v4/ev-read-route-schematic.png`: the paragraph sits under four fast-route list items and never enters the first screen of the sheet). The task is asked *while looking at the body*. Two of the five pathways are nerve-typed (`stress:fast`'s `nerve` route and `dark:night`'s `rht`/`clockPineal`, `kind:'nerve'`, [dark.js](../prototypes/v4/js/scenes/dark.js) lines 8–9), and their label text `nerve signals · schematic route` puts the word *nerve* into the learner's reading path directly above a line they must learn is not a nerve.

**Concrete change.**

| File | Function / location | Change |
|---|---|---|
| `js/overlay.js` | `HS.routeText` is in `advanced.js` (lines 61–66) | Add `HS.routeWord = id => 'schematic ' + HS.routeText(id)` — the presentation helper that prepends the word *schematic* to every route label. Keep `HS.routeText` unchanged so `showRouteCard`, the causal diagram and Compare keep their current strings. |
| `js/engine.js` | `HS.getLabels` (lines 114–116), both the pulse label and the `L!=='body'` route-name branch | Use `HS.routeWord(id)` in place of `HS.routeText(id)` so the on-body label reads `schematic cortisol · blood`, `schematic nerve signals · schematic route` (de-duplicate the double), `schematic CRH · portal`. |
| `js/scenes/*.js` | `routes` blocks, all three scenes | Because `label` already carries `· schematic route` on exactly three routes, normalise those three, otherwise the prefix collides with itself: `stress.js` line 9 `nerve` → `label:'nerve signals'`; `stress.js` line 12 `acth` → `label:'ACTH · blood'`; `dark.js` line 9 `clockPineal` → `label:'nerve signals'`. Everything else is left alone — projected result is `schematic nerve signals`, `schematic ACTH · blood`, `schematic CRH · portal`, `schematic adrenaline · blood`, `schematic light signals · nerve`, `schematic melatonin · blood`. The feedback route `dark.js` `fbMel` (`melatonin · acts on the clock`) is deliberately **not** prefixed — it is not a carrier route and `HS.carrierOf` classifies it `feedback`, so its label must keep saying what it does. Update `read()`'s inline `<span class="n">` text in `stress.js` line 148 and `dark.js` line 124 to match (they already say `· schematic route`; keep them, they are the text alternative and the words there are load-bearing). |
| `js/ui.js` | `HS.showRouteCard` (lines 23–36) | The card's `.lvl` line already says `Signal · message / nerve route / acts back`; add a permanent footer line to every route card: `Schematic: not a drawing of a blood vessel or a nerve.` This makes the disclaimer reachable from the body by one click anywhere on any route — no requirement to know that `Read the route` exists. |
| `prototypes/v4/index.html` | `.draft` banner (line 48) | **Optional, and only if the label test above still fails:** add `· routes are schematic` to the banner. It is a three-word addition to a string that already exists, but it is global chrome and adds reading load on every screen, so try R4-3's first three changes alone first. |

**Effort:** S–M (the string normalisation across three scene files and their `read()` text is the bulk of it).

**Acceptance check.** Proxied — see §3. The proxy is deliberately split (see §3 for why).

**Reduced motion / keyboard.** Text only, no motion. The pulse label path (`pr && pr.label`, engine.js line 115) uses the same helper, so the reduced-motion static route names read identically. Keyboard unaffected; the route card is reached by click on a `.rhit` hit area (16 px stroke, wide) or by Enter on a focused hotspot, unchanged.

**Risks and guardrails.** No quantity. Salience: prefixing every route name with "schematic" makes route labels longer (from ~22 to ~32 characters). The label collision resolver in `overlay.js` (lines 162–184) already handles overflow by stepping labels aside, and route names that cannot be placed are dropped rather than overlapped (`drop`, overlay.js line 179) — so the worst case is a route name that steps aside, which the existing audit will catch as a label-count *decrease*, not a collision. Re-run the quality bar and expect label counts to stay ≤ 8 and overlaps at 0. Do **not** add the word to hotspot labels — hotspots name organs and steps, and the "not a vessel" claim is about lines.

---

### R4-4 · One place that names the route carriers, plus the naming moment

**§10 task:** 6 (reinforcement), and the "grayscale passes for routes" half of the bar.

**Learner-facing problem.** Round 3's A1 shipped carrier *textures* (`TEXTURE` in [overlay.js](../prototypes/v4/js/overlay.js) line 11: blood smooth, nerve `1.5 6.5` beads, portal `3.5 4.5`, feedback `7 7`) and a legend, `HS.grammarLegend()` (overlay.js lines 14–24). But that legend renders in exactly one place: the bottom of `openRead` (ui.js line 248) — again, below the fold. So the most important non-colour distinction in the piece is encoded on the body at all times and explained on the body never. A learner who does not open `Read the route` never learns that beads mean nerve and smooth means blood, which is precisely the distinction task 6 asks them to make.

**Concrete change.**

| File | Function / location | Change |
|---|---|---|
| `js/overlay.js` | `HS.setRoute` (line 41) | Add a `HS.carrierHint(id)` helper that returns `{text, drawId}` for the *last* route that entered state `on` on this pathway, and expose it via a single persistent label pushed in `HS.renderOverlay` at `HS.level() !== 'body'`, `cls:'sig carrierhint'`, positioned like the route names. Text: `smooth line = carried in the blood` / `beaded line = a nerve or light signal` / `short dashes = a portal hop` / `wide dashes = acts back`. It is drawn **once per carrier per pathway**, latched in a `Set` on `HS.ov` and cleared in `HS.buildRoutes` (line 30), so it never repeats and never becomes permanent chrome. |
| `js/overlay.js` | `HS.grammarLegend` (lines 14–24) | Keep as is. Additionally wire the same function into a small popover behind a click on the `#lvlChip` — no. **Do not**: the depth chip is a depth indicator and giving it a second job is the sort of scope creep this round should refuse. Instead, leave the legend where it is and rely on the one-time on-body hint above. |
| `css/app.css` | near `.lab.badge` (line 193) | Add `.lab.carrierhint` styling — same plate as `.lab.sig`, dimmer border, `font-family:var(--mono)`. One rule. |

**Effort:** M.

**Acceptance check.** Scripted: in each of the five pathways, exactly one `.lab.carrierhint` appears at organ level, it disappears after (and stays gone for) that pathway in the session, and the audit's label count stays ≤ 8 with 0 overlaps at 1280/1440/1920. Human: screenshot with the hint visible, judged against "does this sentence tell you what the bead pattern means without reading anything else".

**Reduced motion / keyboard.** The hint is a one-shot *appearance*, not an animation — under `.rm` it appears with no fade. It is a label, not a control: `pointer-events:none` so it cannot steal a click from a route beneath it, and it is not in the tab order (labels currently are only focusable when they carry an `i` or `cell` button; this one carries neither).

**Risks and guardrails.** This is the item most at risk of over-decorating. Hard rules: one hint per carrier per pathway per session; never more than one hint on screen at a time; no motion beyond the existing label fade; no hint at body level (body level is already at the 8-label ceiling in two pathways). Quantity: the hint *describes a texture*, and the texture is fixed in `TEXTURE` and never varies with anything — restate that in the code comment so a later round does not make bead spacing dynamic.

---

### R4-5 · "Say it back" becomes reachable and cues on the two tasks it answers

**§10 tasks:** 7 (*explain negative feedback in their own words*) and 8 (*explain Fast vs Slow without inventing exact times*).

**Learner-facing problem.** The afforance exists and is well-built: `pathway.reflect = {q, model}` on all five pathways (e.g. [stress.js](../prototypes/v4/js/scenes/stress.js) lines 29 and 42), opened by `openReflect` in engine.js (lines 229–244), ungraded, dismissible, "nothing is scored". But it is reachable in **only one way**: `afterPlay` fires it 900 ms after a play-through **and only when the gate is already revealed** (`!p.gate||isRevealed()`, engine.js line 225). For the HPA axis — the pathway task 7 is about — a learner must (a) press ▶ Play to the end, (b) find and open Try it? on the dashed line, (c) answer it, and *then* the question about negative feedback appears. Task 7's scripted path ("complete the feedback Try it? and explain negative feedback") technically reaches it; a learner who understood the feedback and wants to say it back has no way to ask. Meanwhile Task 8's contrast is only ever *felt* through `playAll` (the `#bAll` "Watch it all" button) or read off the Compare table, which is Advanced-only. `HS.connEdges`/`openConnMap` in ui.js (lines 99–120) prove the pattern for wiring existing data into an existing dialog.

**Concrete change.**

| File | Function / location | Change |
|---|---|---|
| `js/engine.js` | `openReflect` (line 229) | Remove the `E.tryMode`/`E.whatIf`/`E.cellOpen` early-return *only* for the manual entry point; add `HS.openReflectNow = () => openReflect(true)` with a `force` flag that skips the `reflectSeen` guard (line 225 already guards the automatic path). Keep the automatic path exactly as it is. |
| `js/engine.js` | `renderDots` (lines 147–155) | When a pathway is *explored* (`done === true`, line 152) and `p.reflect` exists and `!reflectSeen.has(key())`, the chip already switches to `Route explored`. Make that chip a **button** for this case, labelled `Route explored · say it back`, opening `HS.openReflectNow()`. It is the existing "explored" moment, given one action. No new control, no new surface. |
| `js/engine.js` | `afterPlay` (line 220) | For two-route scenes only (`S.toggle.options.length > 1`) and only when `!E.playingAll`, the after-play tip points at the contrast instead of the next route: `stress.js afterPlay.tip.text` becomes `Fast route done, within seconds. Press ▶ Watch it all to see the slow route arrive while this one fades.` (`meal.js` mirrors with Between/After). This is the task-8 cue and it reuses the shipped `playAll` (engine.js line 250). |
| `js/scenes/*.js` | `reflect` blocks | Add one line to the stress `slow` and `fast` model answers that names the *contrast* rather than only the route, e.g. `fast` model already says "within seconds"; append `The slow route takes over minutes and lasts hours, and its brake is what turns it down.` No new numbers — `minutes` and `hours` are the ribbon's own words and are already on screen. |
| `js/engine.js` | `openReflect` card markup (line 234) | Add one sentence under the prompt: `There is no score and no wrong answer — compare with how we'd put it when you're ready.` Currently the card says `just for you, nothing is scored`; making the comparison model's status explicit is what keeps this from reading as a quiz. |
| `js/app.js` | `KEYS` (line 76) | Add `['Y','Say it back, when a route is explored']` to the "In a pathway" list, and bind `y`/`Y` in the pathway key handler (lines 50–57) next to `t`/`w`. |

**Effort:** M.

**Acceptance check.** Scripted proxy for "an explanation moment exists per pathway and is cue-free": for all five pathways, after `HS.openPathway` + full `goHot` walk + `HS.markRevealed`, a `#reflCard` can be opened by script without any pointer interaction, its prompt matches `p.reflect.q`, and pressing `Show how we'd put it` reveals a non-empty model. Plus: the automatic path still fires exactly once (call `afterPlay` twice, assert one card). Human: transcribe a learner's answer to the HPA question and judge it against "says the result turns the process down, without a number".

**Reduced motion / keyboard.** The card is already keyboard-complete (textarea, two buttons, Escape closes, focus returns to `#bRead`, `HS.say` announces). Add `Y` as above so the feature is not pointer-only in the chip form. Under `.rm` the card's appearance is instant (it uses `tipin .18s`, already neutralised by `.rm *{transition-duration:.12s}` and the card has no keyframe entry — verify, and add `.rm #reflCard{animation:none}` if it animates).

**Risks and guardrails.** This is the item where gamification would creep in, so the fence is explicit: **no score, no streak, no attempt counter, no "correct"**, and the model answer is presented as *how we'd put it*, never as the right answer. `HS.recordAttempt` must **not** be called from `openReflect` — check that it still isn't after the change (it is not called today; keep it that way, and add a line to `docs/v4-round3-ideas.md`'s B3 entry recording that decision). The `Route explored` chip becoming a button must not resurrect once dismissed: gate it on `!reflectSeen.has(key())` so a learner who has said it back sees the plain chip again. Salience: the chip lives in the pathway bar, not on the stage.

---

### R4-6 · The five inert tree rows become pathway overviews

**§10 tasks:** supports 1 and 2 (finding a way in); the direction's §2.3 "Pathway overview" is the spec it satisfies.

**Learner-facing problem.** Five tree rows do nothing. `HS.TREE` in [ui.js](../prototypes/v4/js/ui.js) (lines 127–138) defines `thyroid` (Thyroid), `dopa` (Dopamine) with no `children`, and `stress`/`glucoseSys`/`rhythm` render as `System · not in this concept` when clicked — the click handler at line 173 toasts `<system> is not part of this concept. It uses the same scene template.` Three of those five have real, *already-authored* content reachable elsewhere: the thyroid and dopamine systems appear in the prototype only as "not traced in this scene" strings (`stress.js` `info.thy`, `info.panc`), and the whole point of `desktop-learning-design-plan.md` §3 ("Pathway overview… gives every tree branch a useful destination and prevents the tree from becoming an index of dead ends") is that a branch must lead somewhere. A first-time learner who clicks the second visible system in the tree gets a dead end and a sentence about the concept's scope — on the **first screen of the product**.

**Concrete change.**

| File | Function / location | Change |
|---|---|---|
| `js/ui.js` | `HS.TREE` (lines 127–138) | Give `thyroid`, `dopa` and `glucoseSys` an `overview` object: `{ q, map, signals, limits, start }` — the five fields §2.3 names. Content is honest and short: `thyroid` → `q:'How does the thyroid set the pace of metabolism?', limits:'Not built in this prototype — the thyroid axis is out of scope for these three scenes.', start:{scene:'stress',path:'slow'}` (the HPA axis is the nearest built thing); `dopa` → same shape, `start:{scene:'stress',path:'fast'}`; `glucoseSys` → already has children, so it gets `q`/`map`/`limits` only. |
| `js/ui.js` | tree click handler (line 173) | Replace the bare toast for a childless `n.dot` with `HS.openOverview(n.id)`; keep the toast text as the `limits` line inside the overview, so nothing is lost. |
| `js/ui.js` | new `HS.openOverview(id)` | Reuse the `#sheet` element exactly as `HS.openMore` (more.js line 47) and `HS.openPassport` (advanced.js line 91) do: same open/close/focus-return contract, `aria-label` = the system name. The `map` is generated from `HS.connEdges()`/`HS.TREE` — **not** hand-drawn, so it cannot drift. |
| `js/ui.js` | `HS.openConnMap` (lines 103–119) | `glucoseSys`'s overview links to `#bConn`; no duplication of that dialog. |
| `prototypes/v4/index.html` | — | No change. The sheet already exists. |

**Effort:** M.

**Acceptance check.** Scripted: for each of the three childless/aggregate system rows, clicking the row opens a non-empty `#sheet` whose text contains a question sentence, at least one named signal, a limits sentence containing "not", and at least one `[data-go]` button that opens a real pathway; Escape closes and returns focus to the tree row. Assert the guided flow is unchanged: `HS.openPathway('stress','slow',false)` still produces the same label count and zero overlaps.

**Reduced motion / keyboard.** The sheet's open/close is a transform transition already covered by the existing `.rm` rules; add `.rm .sheet` to the transition-duration override if it is not already caught (it is not in the `.rm` block at app.css line 260 — **check and fix in this commit**). Keyboard: the overview is reachable by the tree's existing WAI-ARIA model (Enter on a childless row); the `[data-go]` buttons are ordinary buttons; the sheet handler already forwards Escape and restores focus (`HS.closeRead`).

**Risks and guardrails.** The honest-science fence: these overviews are **navigation**, and every one of them must say plainly that the system is not built here. They must not describe thyroid or dopamine physiology — only say what the system is *for* and where the nearest built thing is. Do not add a thyroid or dopamine scene, pathway, signal or organ (round rule 1). No counts of lessons, no "2 of 3 released", no progress. Salience: the overview is a sheet, closed by default, and changes nothing on the stage.

**Flag on the brief.** You asked me to skip anything the round-3 ideas already proposed, and Theme F does float "a guided light-touch recall — *put these steps in order* — without the signal-naming layer". I am **not** proposing that. Reason: the two things that would make guided recall honest are (a) ungraded framing and (b) specific, kind corrections — and `rebuild.js` supplies both, but shipping a guided variant means either duplicating `rebuild.js`'s state machine or teaching it a second, non-Advanced mode, for a benefit that is entirely captured by R4-5 at a fraction of the cost and with none of the gamification risk. Rebuild stays Advanced-only; recorded under "excluded" below.

---

### R4-7 · Close the four loops: proxies, evidence, review list, direction §14

**§10 tasks:** none directly — this is the item that makes the other six *checkable* by you without a human, and keeps the documentation honest.

**Concrete change.**

| File | Change |
|---|---|
| `scripts/v4-comprehension-check.mjs` | Replace the two static probes with the behavioural ones specified in §3 below (T1 order probe, T5 wording probe, T6 deny + cross-check probe, T7/8 self-explanation-reachability probe). Keep the existing passing probes. New total: **24 checks**. |
| `scripts/v4-quality-bar.mjs` | Add two checks (see §3): `labels ≤ 8` already covers the R4-2/R4-4 ceiling; add **`carrier hint appears at most once per pathway`** and **`route labels carry the schematic marker at body and organ level`**. New total: **93 checks** (83 + 2 × 5 pathways for the marker, and 5 for the hint, minus the removed duplicates as implemented). |
| `coverage/v4/comp-baseline.json` | Regenerate; the round's headline number is 14/14 → 24/24. |
| `coverage/v4/qb-baseline.json` | Regenerate; 83/83 must not regress. |
| `coverage/v4/` | Add `ev-ghost-wording.png` (the stress slow view with the new label visible) and `ev-route-schematic-marker.png` (a fast-route view with `schematic` on the route label and the carrier hint visible), matching the existing `ev-*.png` naming. |
| `docs/v4-round3-ideas.md` | Append a short **"Round 4: what shipped"** block under the round-4 baseline section: the new comprehension number, the two re-run audits, and the note that the B3 reflect decision (never recorded as an attempt) is now explicit. |
| `docs/v4-round2-goal.md` | Add a **Phase 16** row to the progress table, one row per work item, in the same commit-per-item rhythm the previous rounds used. |
| `docs/v4-prototype-review.md` | Update the "What is built" table's common-to-every-scene paragraph, add R4-2/R4-3/R4-4/R4-6 to the "Where the prototype went beyond the direction" table as **P11–P14**, and add to the **scientific review list**: the `unrevealed` wording on all four gates, the `Schematic: not a drawing of a blood vessel or a nerve.` card line, the carrier-hint sentences, the two new `reflect` model lines (they make a *claim about the contrast*, which needs review like any other claim), and every sentence in the three new pathway overviews. |
| `docs/relay-design-direction.md` | §14 gains **P11–P14** with one line each. §4.3 gains the on-body unrevealed label as a stated requirement ("the ghost's unrevealed state is named on the body, not only on hover"), because a reviewer reading §4.3 today would conclude the hover state was sufficient. |

**Effort:** S–M.

**Acceptance check.** Both `node scripts/v4-quality-bar.mjs` and `node scripts/v4-comprehension-check.mjs` exit 0; `docs/v4-round4-plan.md` section 2's per-item checks are all green; every document listed above is modified in the commit its item belongs to.

---

## 3. Per-item scriptable proxies

The two audits you already have are the vehicle. `scripts/v4-quality-bar.mjs` (83 checks) and `scripts/v4-comprehension-check.mjs` (14 checks) both run against `http://localhost:8765/v4/` and both take `--json`.

| Item | Proxied? | What is measured | Pass threshold |
|---|---|---|---|
| **R4-1** | **Behavioural, in-page — and one check fails today** | Fresh context, 1440 × 900, `HS.tipsOn=false`, cleared `localStorage`. (a) **The first-tab-stop check:** `keyboard.press('Tab')` from the top, record `document.activeElement.id` (today: `world`), press `Enter`, wait 600 ms, assert the active element is now a `.trig` row — **this fails on the current build and is the headline check of the item**. (b) Press `Enter` again and assert `HS.E.state === 'triggered'` within 600 ms. (c) Assert each of the three rows' boxes is fully inside the viewport and each `small` matches `/exam|eat|light/i`. (d) Assert `.trig.first` count is 3 before and 0 after a trigger fires. | 6 checks; (a) and (d)-after are the new ones. |
| **R4-2** | **Yes — this is the check that replaces the failing probe** | Open `stress:slow` at body level with nothing hovered. Read `#labels .lab` texts. Assert **at least one visible label matches `/not revealed|not shown yet|try it/i`** *and* that the same label's anchor is within 60 px of the ghost's `?...` hotspot box (so it is attached to the dashed line, not floating somewhere else). Repeat for `meal:between`, `meal:after`, `dark:night`. Then hover the ghost route and assert the wording is still present (no double-label). Then press the `?` and assert the label is replaced by the revealed state's wording. | 4 checks (one per gated pathway) + 1 hover-stability + 1 reveal-transition; all green. **This directly inverts the current `task 5 … "no wording found"` failure.** |
| **R4-3** | **Yes, but split — and this is the one place I want to be explicit about the limits** | (a) *Text presence*: `document.body.innerText` must contain `/not a drawing of a blood vessel or a nerve/i` **before** `openRead` is called — this is the check that currently fails. To be honest about what that proves, (b) *Reachability*: the same string must be inside `#labels` or inside a `.card` that is reachable from the body by one click on a `.rhit` — assert by dispatching a click on `#gRoutes .rhit[data-st="on"]` and reading `#cards`' text. (c) *Marker*: every visible `#labels .lab.sig` text in all five pathways matches `/schematic/i` for blood/nerve/portal carriers, and the `feedback` carrier matches `/acts back/i`. (d) *Card line*: after clicking any route, `#cards` text contains the deny sentence. | 4 groups, all green. **Caveat stated plainly:** (a) proves words exist in the DOM, (b) proves they are one click away, (c) proves the claim is on the line's own label. **None of them proves a learner believes it** — that remains task 6 with a human. This is the strongest available proxy, and it is strictly stronger than the current premise-plus-human-judgement. |
| **R4-4** | **Yes** | At organ level in each pathway, count `#labels .lab.carrierhint`. Assert `=== 1`. Then move the time ribbon and visit two more hotspots and assert it stays at 1 (latched). Then `HS.leave()` and re-open the pathway and assert it is 0 for the rest of the session (per-session latch). Assert it carries `pointer-events:none`. | 5 checks (one per pathway) + 3 behaviour checks. |
| **R4-5** | **Partly — and here I will be blunt about which part** | *Scriptable:* (a) for all five pathways, `HS.openReflectNow()` (or the documented manual entry) opens `#reflCard` with `h5` text equal to `p.reflect.q`; (b) the reveal button produces non-empty model text; (c) the automatic path fires **at most once** per pathway per session (call the after-play hook twice, assert one card); (d) `HS.recordAttempt` is **never** called by the reflect path — wrap it, open the card, check the wrapper's call count is 0; (e) the `Route explored` chip is a `<button>` when unexplored-and-reflectable and a `<span>` once said back; (f) pressing `Y` opens the card. *Not scriptable:* whether the learner's explanation is right or says a mechanism. That requires a human. **Strongest available evidence:** a scripted transcript capture — the checker types a fixed placeholder into `#reflText`, clicks Show, and the checker output records both strings side by side so you can eyeball that the model answer is the *contrast/feedback* sentence and not a restatement of the route. Plus one screenshot per scene with the card open. | 6 scripted checks + 1 human-judged screenshot per scene. |
| **R4-6** | **Yes** | For `thyroid`, `dopa`, `glucoseSys`: click the row, assert `#sheet` is open, non-empty, contains `?` (a question), contains at least one signal name from that system's `children`, contains a limits sentence matching `/not (built|traced|covered)/i`, and contains ≥ 1 `[data-go]`; click the first `[data-go]` and assert a pathway opens (`HS.E.route !== null`); press Escape and assert focus is back on the tree row. | 3 × 6 checks. |
| **R4-7** | **Meta** | Both audits exit 0; `coverage/v4/*.json` regenerate; `git show --stat` on each item's commit names its doc update. | n/a |

**Where no proxy is possible, stated plainly.** Four things in this round cannot be scripted and must not be claimed as verified:

1. **Task 1's actual 10 seconds.** A script can prove the *first available action leads to a scene* (R4-1's proxy). It cannot prove a human takes it in 10 s without instruction. That needs the 6–8 learner sessions in `docs/v4-prototype-review.md` "Next".
2. **Task 5's "not an association".** A script can prove the words are on the body next to the dashed line. Whether a learner *reads* them as "not yet revealed" rather than "we haven't drawn this association" is the comprehension outcome itself.
3. **Task 6's "every learner must say no".** As above — presence and reachability are scriptable; belief is not.
4. **Task 7/8's "in their own words".** Reachability and cue-freeness are scriptable; the quality of the explanation is not, and no script should ever be allowed to stand in for it.

For all four, the strongest available evidence short of learner sessions is: **the scripted presence/reachability proxy + one committed screenshot per state + an explicit pass/fail judgement written into the plan's own evidence note**, which is what R4-7 commits.

---

## 4. Reduced-motion and keyboard behaviour, per item

Reduced motion is a first-class path here, not a fallback: `HS.RM()` in [core.js](../prototypes/v4/js/core.js) line 11 already unions the user toggle, `prefers-reduced-motion`, and the `HS.instant` link-restore flag, and `.rm` in [app.css](../prototypes/v4/css/app.css) line 260 neutralises `beat`, `breathe`, `glyph`, `glow`, `wsh`, `#insetRim` and all transitions.

| Item | Adds motion? | Reduced-motion equivalent | Keyboard |
|---|---|---|---|
| R4-1 | No | n/a | The trigger column is the first tab stop after the toolbar; `.first` is a static border. Enter/Space activates (native button). |
| R4-2 | No (static label) | n/a | The `?` hotspot is in the existing hotspot tab order with an `aria-label` that already says "something acts back here"; the new label is decorative-adjacent text and must be `aria-hidden` on its span to avoid double announcement, since `HS.say` already announces the gate when Try it? opens. **Add `aria-hidden="true"` to the new label's span** — otherwise it duplicates the live region. |
| R4-3 | No | n/a | No change; route cards stay click/Enter reachable via `.rhit` and hotspots. |
| R4-4 | One appearance, no animation | Already instant: this is a label with a CSS opacity transition, which `.rm` collapses to 120 ms. Do not give it a keyframe. | Not focusable (`pointer-events:none`, no interactive child). |
| R4-5 | No new motion; the reflect card animates only if it inherits `@keyframes tipin` | **Verified in this pass:** `#reflCard` is created with `class="try float"` (engine.js line 232) and `.try` ([app.css](../prototypes/v4/css/app.css) line 103) declares **no** `animation` rule — the `tipin` keyframe belongs to `.tip` (line 80) and `.card` (line 93). So the card is already motion-free. Add `.rm #reflCard{animation:none}` anyway as a guard, since the round-4 additions make this card reachable far more often. | Textarea, Show, Close, Escape, focus returns to `#bRead`; **plus new `Y`** bound in the pathway key handler and listed in `KEYS`. |
| R4-6 | No new motion | **Verified in this pass:** the `.rm` block (app.css line 260) is *not* a global animation kill — it is an explicit selector list (`.rm .beat,.rm .breathe,.rm .glyph,.rm .glow,.rm .wsh,.rm #insetRim{animation:none!important}`), while `.rm *{transition-duration:.12s!important}` (line 262) does cover every transition, including `.sheet`'s `transition:transform .32s,opacity .25s` (line 176). So the sheet already behaves under `.rm`. **Standing rule this implies for the whole round:** any *new* keyframed element must be added to that selector list by hand, or it will animate under reduced motion. Note it in the R4-6 commit. | Enter on a childless tree row opens the overview; Escape closes via `HS.closeRead`; focus returns to the tree row (mirror `HS.openMore`'s `HS.sheetReturn` contract). |
| R4-7 | n/a | Add a reduced-motion assertion for each new surface to `v4-quality-bar.mjs`'s existing RM section, so every new element is walked with `HS.userRM=true`. For each new keyframed element introduced anywhere in this round, assert `getComputedStyle(el).animationName === 'none'` under `.rm` — that is the check that catches an omission from the line-260 selector list. | n/a |

---

## 5. Risks and guardrails

**Quantity is never encoded by brightness, speed, size or count.**

- R4-1: the accent is a border on a list row; it carries no number and no length.
- R4-2: the ghost's opacity is *already* fixed and unrelated to any amount; the change adds words only. Restate in the code comment that ghost opacity is a **state**, not a magnitude.
- R4-3: "schematic" is a word about *representation*, not magnitude. The route stroke width (2.6) stays fixed.
- R4-4: the carrier textures in `TEXTURE` are fixed constants. The risk is a later round making bead spacing proportional to something; add a `/* fixed: never tied to quantity */` comment next to `TEXTURE` and an assertion in `v4-quality-bar.mjs` that each carrier's `stroke-dasharray` is byte-identical across all five pathways.
- R4-5: no measurement of the learner's answer, ever.
- R4-6: no counts of lessons, no "n of m released" in the overviews.

**No gamification.**

- No points, scores, streaks, badges, grades, completion rewards or counters of achievement are introduced anywhere. R4-1's `.first` accent is orientation, disappears on use, and is not a milestone. R4-5 is the one place a score could creep in, so it is fenced three ways: no `recordAttempt`, no correctness, explicit "nothing is scored" copy, and the model is framed as *how we'd put it*.
- R4-6 deliberately does not adopt round-3 Theme F's "quiet body map as navigation" or the guided recall variant, because both sit closest to the line (recorded under "excluded").

**Salience (the squint test) is not regressed.**

- Nothing new is drawn on the stage as a *mark*. Every addition on the body is a **label**: R4-2's ghost wording, R4-3's route-name prefix, R4-4's one-shot carrier hint. Labels are placed by the existing resolver in `overlay.js` (lines 162–184), which already keeps clear of the pathway bar, the ribbon, the zoom controls, the mini-map, the panel, the sheet and open cards.
- The hard ceiling: **two pathways are already at 7 labels on screen** (`qb-baseline.json`: `stress:slow`, `dark:night`). §10 allows 8. R4-2's always-on label takes them to 8 — the maximum — which is why R4-2's label is pushed first and why R4-4's hint is **banned at body level**.
- Ordering of the checks you will run: **`v4-quality-bar.mjs` must be run after each of R4-2, R4-3 and R4-4**, because those three are the ones that can push label count or route-name length. If any of them reports 9 labels or a non-zero overlap at any width, the fix is to drop a hotspot label at body level, **not** to raise the cap.
- Grayscale: R4-3 and R4-4 add words, which is the *best* grayscale cue (text survives desaturation). The new `.lab.carrierhint` and `.lab.ghostword` styling must keep ≥ 4.5:1 against `#0B171C` at 12 px; the existing `.lab.badge` colour `#FFD08A` on `#1A1408` already clears it, so reuse that pair rather than inventing one.

**Honest science is not weakened.**

- Every new sentence is textbook-level, in words, with no numbers, doses, gauges, diseases or treatments; time stays in the ribbon's own words (`seconds`, `minutes`, `hours`).
- **Nothing on screen may claim a review that has not happened.** All five new strings categories (gates' `unrevealed`, the route-card deny line, the carrier hints, the two `reflect` model additions, the three pathway overviews) go into `docs/v4-prototype-review.md`'s scientific review list in the same commit, and the `Illustrative draft · not reviewed science` banner and the per-sheet `.sub` lines stay untouched.
- The `content/reviews/approvals.tsv` and `sources-checked.tsv` ledgers stay empty. No new citation, reviewer or approval is invented; `scripts/check-no-fabrication.ts` only guards `content/`, so nothing in this round touches it — but the same rule applies by hand to the new prose.

**Guided flow does not regress.**

- `Advanced` stays off by default (`HS.advOn` from `hs-v4-prefs`, [advanced.js](../prototypes/v4/js/advanced.js) line 9). Everything in this round is guided-path. `HS.routeText` keeps its Advanced branch (molecule class) untouched, and R4-3's `HS.routeWord` wraps it, so with Advanced on the label reads `schematic cortisol · steroid · blood` — verify this combination explicitly in one of the new quality-bar checks.
- No new triggers, pathways, organs or scenes. R4-6 adds *navigation to* existing systems and states plainly that they are not built.

---

## 6. Deliberately excluded

| Excluded | Why |
|---|---|
| **"Watch it all" (`playAll`) re-plays the whole sequence as a progress bar** or any sequential indicator of where in the two-route run you are | Non-essential; the time ribbon already shows position, and anything else is a completion counter. |
| **Replacing the `?` badge with an "unrevealed" timer or a "revealed n of 1" indicator** | A visible reveal counter is a completion counter. §10 task 5 asks for a *meaning*, not a state display. |
| **The "trigger as a legible inciting moment" (round-3 A3) being extended** | A3 shipped (`trigger.incite` in `loadScene`/`trigger`, engine.js lines 34–38). Extending it would be decoration on a solved problem. |
| **A content source / a second "session" file to carry the two new audit checks** | Both audits are standalone `node` scripts you run; a scenario or session harness is infrastructure this round does not need. If the T7/8 transcript capture grows, it goes in `v4-comprehension-check.mjs`. |
| **A guided (non-Advanced) short recall exercise** ("put these steps in order") | Round-3 Theme F floats it. R4-5 delivers the same comprehension benefit (articulate the mechanism) without duplicating `rebuild.js`'s state machine or teaching it a second mode, and with far less gamification surface. |
| **The quiet body-map progress overview** | Same Theme F entry, and it is the single idea most likely to read as a completion reward. `renderSummary` (ui.js line 92) is already careful; leave it. |
| **Making the carrier legend (`HS.grammarLegend`) persistent chrome or attaching it to `#lvlChip`** | Persistent legend competes with the routes for attention on the stage, and the depth chip has one job. R4-4's one-shot hint delivers the teaching without the permanent cost. Recorded so it is not silently dropped. |
| **Any further layout/collision work** | 83/83 green at 1280/1440/1920. The only layout-adjacent constraint this round imposes is *don't break it*, which is why the audit runs after R4-2/3/4. |
| **A light theme, touch, sound, 3D rotation, or a back view** | Out of scope by the standing constraints and owner decision D5/D13. |
| **Anything in `src/` (the React app)** | §11 Phase 3, after owner decisions D7 and D11. |
| **A real illustration/commission change** | §11 Phase 1, gated on the owner's style decision. |

---

## 7. Documentation step (which docs move, in which commit)

Per standing rule 2 ("Spec first… where the prototype has to go beyond it, the change is written back into the doc in the same commit") and the round-3 rhythm (goal/idea docs record every change; direction §14 records where the prototype went beyond the direction):

| Commit | Docs that must move in the same commit |
|---|---|
| R4-1 | `docs/v4-round2-goal.md` (Phase 16 row); `docs/v4-prototype-review.md` (the "Keyboard model complete" claim in the Phase-7 row is now **incomplete** — the first tab stop is inert; record it in Known limitations so the fix is traceable); `docs/desktop-learning-design-plan.md` §8 "Selection and focus" is the rule this satisfies |
| R4-2 | `docs/v4-round2-goal.md` (row); `docs/relay-design-direction.md` **§4.3** — add the on-body unrevealed label as a requirement; `docs/relay-design-direction.md` **§14** P11; `docs/v4-prototype-review.md` (P-table + scientific review list); `coverage/v4/ev-ghost-wording.png` |
| R4-3 | `docs/v4-round2-goal.md` (row); `docs/relay-design-direction.md` **§14** P12; `docs/v4-prototype-review.md` (P-table + scientific review list); `coverage/v4/ev-route-schematic-marker.png` |
| R4-4 | `docs/v4-round2-goal.md` (row); `docs/relay-design-direction.md` **§14** P13; `docs/v4-prototype-review.md` (P-table + scientific review list) |
| R4-5 | `docs/v4-round2-goal.md` (row); `docs/v4-round3-ideas.md` (**B3 entry**: record that reflect is never recorded as an attempt, and that it is now reachable on demand); `docs/v4-prototype-review.md` (scientific review list — the two new model lines make a claim) |
| R4-6 | `docs/v4-round2-goal.md` (row); `docs/relay-design-direction.md` **§2.3** (pathway overview is now built for three systems) and **§14** P14; `docs/v4-prototype-review.md` (P-table + scientific review list for the overview sentences) |
| R4-7 | `docs/v4-round2-goal.md` (Phase 16 table complete); `docs/v4-round3-ideas.md` (**Round 4: what shipped** — the new comprehension number, the two re-run audits, the explicit non-proxied list); `docs/v4-prototype-review.md` (updated evidence table with the new `ev-*.png`); `coverage/v4/comp-baseline.json`, `coverage/v4/qb-baseline.json` |

Each commit message body ends with a **"What I'd improve next"** note, per standing rule 5. One commit per item; no item depends on a later one.

---

## 8. Where I think the brief is wrong

You asked me to flag this. Three points, in descending order of importance.

1. **"The ones still unaddressed by any scripted proxy are tasks 1, 5, 6, 7/8" is half right.** `scripts/v4-comprehension-check.mjs` already exists and already proxies all four — tasks 1, 7 and 8 *pass* (12/14), and tasks 5 and 6 fail. So the **measured** gap is two tasks, not four. But your framing is too generous to task 1 in a way I only found by measuring it: its proxy passes because it checks that three buttons exist with subtitles, while the **first tab stop on the first screen is the body SVG, and Enter there does nothing** (verified; tab order is `world` → five toolbar buttons → first trigger, so the entry point is seven stops in). So the correct headline is **"two red, one hollow, one green-but-shallow"** — and task 1 deserves an item precisely because its proxy is the weakest of the four, not because it is failing. R4-1 and R4-5 convert tasks 1 and 7/8 from static-attribute probes into behavioural ones.

2. **R4-6 is the one item that is not on your list, and I would still argue for it.** The prompt's four tasks are all about *reading the body correctly*. R4-6 is about the first screen of the product containing a control that dead-ends with a sentence about the concept's scope. That is closer to task 1 (finding a way in) than the others, it is directly specified by `docs/desktop-learning-design-plan.md` §2.3 ("prevents the tree from becoming an index of dead ends"), and it costs an M. If you want the round tighter, **cut R4-4 first, not R4-6** — R4-4 is the one item whose benefit overlaps R4-3's, and it is the item most at risk of reading as decoration.

3. **R4-4 and R4-6 are the two items I would drop first if the round has to shrink to four.** In that case the surviving four are R4-1, R4-2, R4-3, R4-5 — exactly your four tasks, with R4-7 folded into R4-3's commit. I do not recommend shrinking, because R4-4 is the only item that teaches the *carrier grammar* the direction's §5.3 and the shipped A1 textures already encode, and R4-6 removes a dead end from first paint; but the round is designed so either cut is clean.

**One correction to the framing, in the other direction.** The brief says the measurable part of §10 "already passes: 83/83 checks". I re-ran it and it does pass on this branch, and `coverage/v4/qb-baseline.json` agrees. But two of those 83 checks are weaker than they look, and round 4 is the last chance to say so before they are relied on: `route marks have luminance spread ≥ 30` reads computed `stroke` colours across `#world` and `#overlay` regardless of which route is *active*, and `reduced motion: next step advances one step` asserts `after >= before`, which cannot fail. Neither is wrong, but neither is evidence of what its name suggests. I have not changed them in this plan (that would be scope creep on a green audit); flagging so the 83 is not over-trusted the way the label-count figure already was once, in round 3.
