# v4 round 4 — learner-experience verification

Date: 15 September 2026 · branch `design/v4-quality-round4` · reviewer pass over commits `fe17b02` (R4-1) … `70ad510` (R4-7)
Prototype: `prototypes/v4/` · server `http://localhost:8765/v4/` · audits re-run: **`node scripts/v4-quality-bar.mjs` → 97/97**, **`node scripts/v4-comprehension-check.mjs` → 33/33**, both exit 0.

Scope: I re-ran both audits, then inspected the running build at 1280 / 1440 / 1920 in all five pathways, at 200 % base font size, during ▶ Play and pause, with the pointer and with the keyboard, and diffed the computed 100 % geometry against `git show a2d684f:prototypes/v4/css/app.css`. All screenshots are in `coverage/v4/rev/`; the measurement dumps are `coverage/v4/rev/report{,2,3,4,5}.json`. Every claim below is either a command output or a screenshot I looked at. Where I could not reproduce something I say so.

> **Working-tree note (added after the measurements).** All measurements and screenshots below were taken against the committed round-4 build (`HEAD` = `07c59fe`, server restarted against it) between 20:05 and 20:07. While this review was being written, a **concurrent session modified `prototypes/v4/js/{engine,overlay,ui}.js` and `prototypes/v4/css/app.css` in the working tree** (mtimes 20:15–20:20; `git status` shows them modified, and `docs/v4-round4-verify-craft.md` appeared at 20:12). I did not make or commit those edits. Re-checked on the current dirty tree: **F2, F6 and F8 are fixed there** (the edits add a `TIP_POS` default, a `setSayUI`/`E.playing` guard, and `.card p.schem`). **F1, F3, F4, F5, F7, F9, F10 and F11 still reproduce on the current dirty tree.** This note is so the tree you ship can be matched to the finding set; the findings themselves describe `HEAD`.

**Bottom line:** R4-1, R4-3 and R4-6 deliver exactly what they promise. R4-2 delivers the *words* and not the *shape* it and two design docs say it delivered. R4-4 is not proxied by anything and does not reach a learner who starts with two of the three triggers; it also introduced an uncaught `TypeError`. R4-5's card is well built but its `Y` shortcut writes a literal `y` into the learner's answer, and its button is gated on a render pass that does not run when the state it gates on changes. R4-7 is layout-neutral at 100 % (verified) but leaves 13 px font declarations and breaks the 200 % layout it exists to support.

---

## 1. Findings, ranked

### F1 — `Y`, the documented "Say it back" shortcut, types a literal `y` into the answer box · **high**

**Evidence.** `coverage/v4/rev/say-card-first.png` shows the reflect card opened with a single `y` already in the textarea. Measured value from `report5.json` / `report2.json`:

```
open stress:slow → focus body → keyboard.press('y')
→ { open: true, value: "y", active: "reflText" }
```

Cause: `app.js` handles `y` on `document` keydown and calls `HS.openReflectNow()`; `openReflect` synchronously calls `$('#reflText').focus()`. The key event's default insertion then lands in the newly focused textarea. (`t`, `w`, `r` do not do this — measured: `t`/`r` focus a button, `w` focuses `BODY`.)

**What a learner experiences.** They press the shortcut the keyboard sheet advertises, and their answer starts with a stray `y`; the first thing in the box is not their words.

**Minimal fix.** In the `y` branch (`app.js`): `e.preventDefault(); HS.openReflectNow();` (or focus the textarea on the next frame instead of synchronously).

---

### F2 — pressing H (Hints) after a pathway has opened throws an uncaught `TypeError`, and the tip does not come back · **high**

**Evidence.** Open `stress:fast` (which fires the R4-4 grammar tip), then press `h` twice (`report5.json` → `crash`):

```
curTip:            { key: "linegrammar", text: "The line styles tell you how a message travels." }   // pos is undefined
after first h:     { on: false, rich: false }
after second h:    { on: true,  rich: false, bHints: "Hints on" }
page errors:       ["pageerror: Cannot convert undefined or null to object"]
```

Cause: `HS.tipRich(key,text,html,pos)` stores `HS._curTip = {key,text,pos}` with `pos === undefined` (the `enterPathway` call passes only three arguments), while `renderTip` defaults nothing and runs `Object.entries(pos)` (`ui.js:49`). `HS.setTips(true)` (`ui.js:78`) then calls `renderTip(..., HS._curTip.pos)`.

**What a learner experiences.** The Hints switch labels itself "Hints on" but the tip is gone, and the console logs an error. Both audits still report "no console errors" because neither toggles hints after a pathway entry.

**Minimal fix.** `HS.tipRich`: store `HS._curTip = {key,text,pos: pos || {right:16,bottom:214}}`; and/or make `renderTip` `Object.entries(pos || {})`. (Both, ideally.)

---

### F3 — R4-4 never reaches a learner who starts with "You skip a meal" or "It gets dark", and can be lost for the whole session · **high**

**Evidence.** `report2.json` → `grammarReach`, driven through the real trigger click:

| first trigger clicked | lands on | grammar tip? | tip shown instead |
|---|---|---|---|
| Something stressful happens | `stress:fast` (not gated) | **yes** | — |
| You skip a meal | `meal:between` (gated) | no | ghost tip |
| It gets dark | `dark:night` (gated) | no | ghost tip |

`meal` has no ungated pathway and `dark` has only the gated one, so the natural single-scene session never teaches the grammar. The latch is also set before the render guard (`engine.js:230`): `if(HS.tipRich && !HS._grammarShown && !ghostTip){ HS._grammarShown = true; HS.tipRich(...) }`, and `tipRich` returns early when `!HS.tipsOn || tipsSeen.has(key)`. `report5.json` → `tipsOffFirst`: with hints off at the first pathway, `flag:true, rich:false`; after re-enabling and opening another pathway, still `rich:false`. So a learner who had tips off, or who only visited gated pathways, never sees the carrier grammar.

Neither audit touches R4-4 at all: `grep -rn "tipRich|tiprich|linegrammar" scripts/*.mjs` matches only `scripts/v4-evidence.mjs` (the screenshot script). The quality bar's 2/2 "text-zoom" and the comprehension suite's 33 checks contain nothing about the legend, and the plan's original `.carrierhint` proxy was dropped when the implementation changed shape.

**What a learner experiences.** The one thing R4-4 exists to teach — beads = nerve/light, smooth = blood, dashes = acts back — is not taught in two of the three first-run flows, and the §10 task-6 distinction rests on it.

**Minimal fix.** Latch on the *render*, not the intent (have `tipRich` return `true` only when it drew, and set `_grammarShown` on that); and stop deriving the ghost-tip deferral from current state alone — use `tipsSeen.has('ghosthow_'+scene+'_'+path)` so the grammar tip lands on the next entry once the ghost instruction has had its one showing. Add one proxy per gated pathway (comprehension or quality bar) that the grammar tip appears exactly once in a three-pathway session.

---

### F4 — R4-2's "shape" half was not implemented, and two design docs plus the work list claim it was · **high (honesty), low (learner impact)**

**Evidence.** `git show 96bed5d -- prototypes/v4/js/overlay.js` changes the texture comment, four legend words, `HS.GHOST_WORD`, the label push and the `aria-hidden` attribute — **no change to the drawn path, the dash array, the end glyph or the line cap.** The pre-round build at `a2d684f` already skipped end glyphs for ghosts (`if(st==='hide'||st==='ghost'||drawing[id]) return;`) and already set `stroke-dasharray='6 7'`. Measured geometry (`report2.json` → `ghostShape`):

```
stress:slow    qT=0.500  distToStart=252.0  distToEnd=255.4  cap=round
meal:between   qT=0.500  distToStart=133.9  distToEnd=121.9  cap=round
meal:after     qT=0.500  distToStart=109.3  distToEnd= 88.0  cap=round
dark:night     qT=0.500  distToStart=135.2  distToEnd=141.2  cap=round
```

The `?` sits at the half-way point of a full-length line and the line continues past it; the cap is round, not the "blunt" end the work list specifies. The work list's R4-2 bullet ("split the ghost's drawn path at the `?` badge so the line terminates into the dot with a blunt cap") was not built.

Docs that now state it was:

- `docs/v4-prototype-review.md:64` — P11 "its **shape** reads as unfinished (no end glyph, the `?` terminates the line)"
- `docs/relay-design-direction.md:703` — P11 "the `?` terminates the line … so the shape now carries the meaning"
- `docs/v4-round4-worklist.md:46` — describes the split as the change

**What a learner experiences.** The words are correct and always on, so task 5 is largely answered — the learner-facing outcome is mostly carried by the label. But the shape is still a full-length dashed connector, i.e. still the conventional "association" mark the diagnosis named; the second channel the round claims to have added does not exist.

**Minimal fix.** Either implement it (clip the ghost path to end at `g.at`, `stroke-linecap:butt` on `#r-<gateRoute>`) or correct P11 in both docs and the R4-2 work-list bullet to claim only what shipped: *named on the body at all times; no end glyph (pre-existing), label on the `?` badge's plate*. Do not leave the doc claiming a shape change that has no commit.

---

### F5 — hovering the `?` badge takes `stress:slow` and `dark:night` to 9 labels, over the §10 ceiling the round was protecting · **medium**

**Evidence.** `report3.json` → `qHover`. Before hover: 8 labels. After a `pointerenter` on `#labels .hs.q`, at 1280 / 1440 / 1920:

```
stress:slow  before=8 → n=9   ["Not revealed yet", …7 hotspot labels…, "Something acts back here · Try it?"]
dark:night   before=8 → n=9   ["Not revealed yet", …7 route/hotspot labels…, "Something acts back here · Try it?"]
ll=0  (no geometric overlap)
```

The R4-2 guardrail only suppressed the *route*-hover label (`overlay.js:178`), not the gate *hotspot*'s hover tip (`overlay.js`, the `hh.tip` push). The audits cannot see this: the quality bar measures paused/unhovered and route-hover states, and the comprehension hover check only hovers the route.

**What a learner experiences.** The action the always-on label tells them to take ("Open the ? dot") is the one that pushes the stage past the app's own hard ceiling, and shows the state label and the question label at the same time.

**Minimal fix.** Suppress the `hovhot` label when `hh.id === 'q'` and `ghostword` is present (the badge already carries `aria-label` and `tip`); or accept 9 as the documented hover peak and add a quality-bar check so it cannot grow further.

---

### F6 — `#bSay` is visible, and acts, when its own gate says it should be hidden · **medium**

**Evidence.** `report5.json`:

```
tryThenSay:  beforeTry { hidden:false }   after openTry { hidden:false, tryMode:true }
sayOverTry:  before { try:true, sayHidden:false }  → after click { try:false, refl:true, dialogs:1 }
sayDuringPlayWindow: at 250 ms { sayHidden:false, playing:true } → clicked → { refl:true, playing:true }
```

`report3.json` → `bSayTimeline`: `hidden:false` at 200 ms and 400 ms of playback (`playing:true`), then `true` from 600 ms once the first step calls `renderDots`. The gate (`!E.playing && !E.tryMode && …`) is only evaluated when `renderDots` runs; `openTry`, `closeTry`, `play` and `stopPlay` do not run it.

**What a learner experiences.** While the Try it? card is open, a live "Say it back" button sits in the same bar; clicking it silently discards the Try it? card and substitutes the reflect card. For the first half-second of ▶ Play the same button is live and opens the reflect dialog over the running animation. After `stopPlay` the button is left hidden until the next step, so a learner who pauses to answer cannot see it.

**Minimal fix.** Factor the visibility expression into a small `setSayUI()` and call it from `openTry`/`closeTry`/`play`/`stopPlay` (not only from `renderDots`); add `E.playing` to `openReflect`'s guard as a belt-and-braces.

---

### F7 — R4-7 leaves 13 px font declarations and the 200 % layout it exists to support overflows and collides · **medium**

**Evidence.** Remaining px font declarations at HEAD: **13** (`grep -nE 'font-size:[0-9.]+px|font:[^;]*[0-9.]+px' prototypes/v4/css/app.css`), down from 110 at `a2d684f` — but not zero:

```
.try textarea (the Say-it-back answer box)   font:13.5px/19px   measured 13.5 → 13.5 at 200 %
.hs (the numbered step badges on the body)   font:700 13px      measured 13   → 13
.try .why, .pin input, .leadchip, .linkbtn, .gobtn, .menuitem,
.connlink, .cstep, .clspill, .connsvg .cnode text   …all still px
```

At 200 % base font size (`report3.json` → `zoom200`, screenshots `zoom200-1440.png`, `grammar-200pct.png`):

- `#pbar` is **1466 px wide in a 1440 px viewport** (`x=-13 … r=1453`); `#bExit` is clipped 4 px.
- The 600 px panel covers the left of the scene caption — the screenshot reads "ng stressful happens".
- `.ribbon` keeps `width:720px` while its own time words double: the last label overflows (`rbWordsOverflow:true`, "calm again" outside the ribbon box) at 1440 **and** 1920.
- The grammar tip overlaps the bottom bar by **14 080 px²** (`tipOverlapsBottom`), i.e. its lower edge sits over the ribbon.

The "text-zoom" check samples only `.trig`, `.sec`, `.row` and `.panel` width, so it passes 2/2 while these are broken. The commit message's "All 100 px font-sizes … are now rem" is not true; the follow-up note at the end of the same message is closer to the truth.

**What a learner experiences.** 100 % is safe (below), but a learner who raises their font size gets doubled prose inside fixed-width chrome: clipped primary controls, a covered caption, a time label outside its rail.

**Minimal fix.** Convert the 13 remaining shorthands (`font:0.84375rem/19px`, `0.75rem`, `1rem`, `0.6875rem`, …); make `.ribbon` and `#pbar` `max-width:min(…, calc(100vw - 32px))` / allow the ribbon words to shrink; raise the tip above the bottom bar with `bottom: calc(214px + …)` or place it relative to the ribbon. Extend the text-zoom check to assert no element right-edge exceeds the viewport and that `.caption` / `.ribbon` / `.tip` do not overlap `#bottom` at 200 %.

---

### F8 — R4-3's caveat line loses its caveat treatment in the route card to a CSS specificity override · **medium (salience)**

**Evidence.** The new `.schem` rule is `(0,1,0)`, but `.card p{…color:var(--ink-2);font-size:.875rem;line-height:1.4}` is `(0,1,1)` and outranks it. Measured computed style of the route card's deny line at committed `HEAD` (served with `git show HEAD:prototypes/v4/css/app.css`):

```
HEAD : { font-size: "14px", color: "rgb(162, 182, 186)", border-left: "dashed 2px" }   ← body copy
dirty: { font-size: "12px", color: "rgb(240, 194, 126)", border-left: "dashed 2px" }   ← the intended .schem
```

The dashed left edge survives (nothing else sets it), so the sentence is present and readable — but at 14 px in the ordinary grey paragraph colour, not the 12 px amber caveat treatment the rule's own comment says it must have ("so it reads as a caveat rather than body copy"). The comprehension check only asserts `/not a drawing of a blood vessel or a nerve/i.test(txt)`, so it passes.

**What a learner experiences.** In the route card the disclaimer reads as one more sentence of the route description rather than a caveat about the drawing; the visual channel that was supposed to do the work in R4-3 is absent. (`read-sheet.png` is unaffected — `#sheet .schem` is not outranked there.)

**Minimal fix.** Add `.card p.schem{font-size:.75rem;color:var(--warm);margin:8px 0 10px}` (or raise the base rule's specificity). The concurrent working-tree session has already added exactly this rule.

---

### F9 — the post-play cue names a control whose label is hidden at the widths the evidence uses · **low**

**Evidence.** `stress.js` `afterPlay.tip.text`: "…or press ▶ Watch it all to see both across the ribbon." `app.css:417`: `@media (max-width:1500px){ … #bAll .lbl{display:none} }`. At 1280 and 1440 the button shows only the `▶▶` glyph (`ghost-stress-slow-1440.png`).

**What a learner experiences.** The tip names "Watch it all"; the control has no such words on screen. Also, the work-list's promised `playAll` change ("hold route A `faint` while B plays") was not implemented — `git diff a2d684f..HEAD -- prototypes/v4/js/engine.js | grep -E 'playAll|faint'` is empty, and `playAll` still enters each pathway in turn. The shipped sentence no longer claims simultaneity, so it is not false; the sub-item is simply undelivered (I could not reproduce a false claim from it).

**Minimal fix.** Name the glyph the learner sees ("press ▶▶ to watch both routes"), or only show the sentence above 1500 px. If the `faint` hand-off was wanted, either build it or drop it from the work list.

---

### F10 — the R4-2 anchor proxy was loosened 4× and no longer proves attachment · **low (proxy strength)**

**Evidence.** Plan §3 / work list: "within **60 px** of the ghost's `?...` hotspot box". Shipped `scripts/v4-comprehension-check.mjs`: `anchored: anchorDist != null && anchorDist < 240`. Measured distance: **66.5 px** at all three widths (112 px at 200 %), `report.json` → `ghost`. The label *is* attached (its bottom edge is ~15 px above the badge centre, i.e. just clear of the plate), so the learner experience is right — but a check that passes at 240 px would also pass a label floating ~200 px from the line.

**Minimal fix.** Measure edge-to-edge against the badge box and assert `<= 12 px` gap, or keep centre-to-centre but set the threshold to ~80 px (the measured value plus a small margin).

---

### F11 — minor: the reflect card's "from" default · **low**

**Evidence.** `report.json` → `say.escFocus`: pressing `Y` from the document body, then Escape, returns focus to `#bRead` (`HS._reflFrom` falls back to `$('#bRead')`). From a focused hotspot it correctly returns to the hotspot (`escFromHotspot: "hs |Step 1 of 4: Hypothalamus releases CRH"`).

**Minimal fix.** Fall back to `$('#bSay')` rather than `#bRead` — the button that owns the action.

---

## 2. Answers to the specific questions

### 1. Does the round deliver its promise, per item?

| Item | Verdict |
|---|---|
| **R4-1** | **Delivered.** Screenshot `first-run.png`: all three rows carry the quiet amber inset accent and the everyday-event subtitle ("an exam, a near miss, a fright", "you have not eaten for hours", "the evening light fades"). `.trig.first` count 3 before, 0 after a trigger fires; the audit's first-Tab → Enter → `state==='triggered'` check passes. No claim in it is unmet. |
| **R4-2** | **Half delivered.** The label is real, correct, always on, on the badge's plate, pointer-neutral, suppressed while Try it?/What if? is open, gone after reveal, and never duplicated (verified in all four gated pathways at 1280/1440/1920, during play, and at 200 %). The **shape** half is unchanged from `a2d684f` and the docs claim otherwise (**F4**). Hovering the `?` takes the stage to 9 labels (**F5**). |
| **R4-3** | **Delivered, one salience defect.** `route-card.png` shows the deny line directly under the texture swatch, before the "Illustrative · not reviewed" chip; `read-sheet.png` shows the same paragraph at the top of the sheet and `scrollTop=0` works. No route name got longer, so label counts are unchanged (97/97 still green). But in the card the line computes to 14 px `--ink-2` instead of the 12 px `--warm` caveat treatment (**F8**). |
| **R4-4** | **Partially delivered, unproxied, and buggy.** Where it fires (`grammar-stress-fast.png`) it is legible and correct at 1280/1440/1920 and does not collide with the bar, mini-map or labels (tip box 352×194, bottom 686 vs ribbon top 724 at 100 %). But it does not fire for the meal or dark first-run flows, can be lost for a session, and introduced **F2**. |
| **R4-5** | **Core delivered, edges broken.** On demand in all five pathways, ungraded, no `recordAttempt`, no dialog stacking, Escape returns focus sensibly; the first-open-hides / later-open-shows split behaves as designed (`report3`/`report2`). But **F1** (stray `y`) and **F6** (gating) are real. |
| **R4-6** | **Delivered as amended.** `thyroid-toast.png`: the row states what the system is for and that it is not built, navigates nowhere, the toast duration scales with length, and the suffix reads "· not built yet". The overview sheet the work list specified was cut; that cut is recorded honestly in `v4-round2-goal.md:54` and `relay-design-direction.md:712`, so it is a scope decision, not an over-claim. |
| **R4-7** | **Partially delivered.** 100 % geometry is unchanged (verified below), but 13 px font declarations remain and 200 % breaks (**F7**); the audit that certifies it samples four selectors. |

**Checks that pass while the experience is wrong or unchanged:** R4-2's shape (nothing on the body changed), R4-4 (no check exists; two first-run flows get nothing), R4-7's text-zoom (four selectors), R4-5's `#bSay` gate (existence/visibility at rest only), and R4-2's hover peak (all audits measure the unhovered and route-hover states).

### 2. Is the "Not revealed yet" label right?

**Yes, on the whole.** Measured in all four gated pathways (`report.json` → `ghost`, `report2.json` → `ghostShape/ghostSuppression`):

- **Natural zoom:** present in all four; `stress:slow` and `dark:night` open at body / organ respectively and both show it. Anchor is the gate midpoint, label directly above the `?` badge (centre-to-centre 66.5 px; bottom edge ~15 px above the badge centre, clear of the plate).
- **All three widths:** 111.5 × 29.4 px at 1280 / 1440 / 1920, identical.
- **During ▶ Play:** present in 22/22 sampled frames for every gated pathway; peak label count stays 8 with 0 overlaps (`report.json` → `ghostPlay`).
- **Never twice, never after reveal, never when it should not be:** exactly one instance; 0 after `markRevealed`; 0 while Try it? is open; 0 while What if? is active.
- **Does it sit far from the line?** No — the badge is *on* the line (distance 0 to the path, 0.1 in `meal:after`), and the label is anchored to the badge.
- **200 %:** 205 × 46.8 px, no overlaps, `gwToQ` 112 px, ~10 px clear above the badge (`ghost-200pct.png`). The label itself fits — it is the *grammar tip* that collides at 200 % (**F7**).
- **One exception:** hovering the `?` badge itself takes the pair to 9 labels (**F5**).

### 3. Is anything dishonest or over-claiming?

**On screen: no.** I grepped the round diff for user-facing strings and checked each against the prototype's promise:

- `Not revealed yet`; `The dashed line means this step has not been revealed yet. Open the ? dot to work it out.` — describes the app's state, not biology. ✔
- `Schematic: not a drawing of a blood vessel or a nerve.` and the Read-the-route paragraph — denials, not claims. ✔
- Carrier legend: `Blood-borne message`, `Nerve or light signal`, `Portal — straight to the next gland`, `Feedback — acts back`, `stimulates / inhibits / modulates` — no magnitude word ("a short hop" was correctly retired); the `TEXTURE` constants are fixed and carry a "never tied to quantity" comment. ✔
- Trigger aliases and `syn` additions — everyday events, no claims. ✔
- `Say it back` title/copy and the reflect model lines — ungraded framing intact; the new fast→slow model sentence is a physiology claim and *is* on the review list (`v4-prototype-review.md:92`ff). ✔
- Thyroid / Dopamine `unbuilt` strings — scope statements, no physiology, no navigation to an unrelated system. ✔
- No new citation, reviewer, approval or "reviewed" string; `Illustrative draft · not reviewed science` is untouched in the banner, the route card and the sheet.

**In the docs: three over-claims.**

1. `v4-prototype-review.md:64` and `relay-design-direction.md:703` (P11) claim "the `?` terminates the line" / "the shape now carries the meaning" — not implemented (**F4**).
2. `v4-prototype-review.md:66` (P13) says "first open keeps the model hidden, later opens show it" — true. `P14` says textures/end glyphs are "taught **once** on the body" — not guaranteed for meal/dark first-run sessions (**F3**).
3. `v4-prototype-review.md:67` (P15) "the reading UI scales with the user's font size (rem throughout)" and the R4-7 commit message "All 100 px font-sizes … are now rem" — 13 remain (**F7**).

### 4. The grammar tip (R4-4)

Legible and collision-free **where it appears**: 352 × 194 px at `right:16 / bottom:214`, bottom edge 686 vs the bottom bar's top at 724 (1440) and the mini-map at 734 — no overlap with the pathway bar, labels or mini-map at 1280 / 1440 / 1920 (`grammar-stress-fast.png`, `grammar-1280-1280.png`, `grammar-1280-1920.png`). Its contents are right: four line textures plus the three end glyphs.

**Teaching it once is not reliable.** It shows on `stress:fast` (the ungated pathway) and on any gated pathway whose gate is already revealed; it does **not** show when the first pathway has an unrevealed gate, which is the case for the meal trigger (`between`) and the dark trigger (`night`) — 2 of the 3 first-run flows. The latch is also set before the render guard, so hints-off at first entry loses it for the session. Details and fix in **F3**. At 200 % the tip overlaps the bottom bar (**F7**).

### 5. "Say it back" (R4-5)

- **Discoverable:** yes — a labelled button in the pathway bar next to Read the route (`say-button.png`), visible at 1280 / 1440 / 1920 with no toolbar/draft/caption overlap (`report.json` → `sayWidths`, overlap 0 at all three). The keyboard sheet lists `Y`.
- **Hidden when it should be:** **no** — visible and live while Try it? is open and for the first ~500 ms of playback; left hidden after `stopPlay` until the next step (**F6**).
- **First-open vs later-open:** behaves exactly as specified — first open hides the model with `Show how we'd put it`; the second open (same pathway, same session) shows the model and hides the button, with the copy recast to "Reading it again — here is how we'd put it, so you can compare with your own version." That is consistent, though note the model is revealed on *any* second open, even if the learner closed the first without answering — a deliberate trade the work list made, worth knowing when judging the retrieval benefit.
- **Stacking:** never stacks — `openReflectNow` closes Try it? / What if? / Cell first, measured `dialogs:1`. The flip side is the silent swap in **F6**.
- **`Y`:** opens it, but writes `y` into the box (**F1**).
- **Escape:** closes and returns focus to the invoking element (hotspot → hotspot; button → button); from the document body it falls back to `#bRead` (**F11**).

### 6. Did px→rem break anything at 100 %?

**No — verified.** I served the page with the pre-round stylesheet injected (`git show a2d684f:prototypes/v4/css/app.css` fulfilled via `page.route`) and compared computed boxes and font sizes old vs new at 1280 / 1440 / 1920 (`report2.json` → `geom`, `report3.json` → `fonts`):

```
differences > 0.75 px at 100 %: none
identical: .panel / .trig / .row / .sec / .caption b / .caption span / .panel-foot / .draft
           #lvlChip / #mini / #pbar / #pbar .chip / .rb-words / .rb-cap / #dots .hdot
           #timeChip / #bSay / #bRead / #bAll / #tryCard / .try h5 / .try p / #sheet 400
           / #sheet .sub / .tip / .connlink / #labels .hs / .try .why
route card (.card): width 300 → 300 and font 14 → 14; height 276 → 288 — that +12 px is
           R4-3's added "Schematic: not a drawing…" line, not a px→rem change.
```

(My first geometry run reported `.caption b`/`.caption span` as "missing in old" — that was a measurement artefact: no scene was open at first paint. Re-measured with `stress:slow` open, they are identical.)

So nothing used to fit and now does not, no wrapping changed, and the label collision resolver behaves identically at 100 %. The problems are all at 200 % (**F7**).

### 7. Anything genuinely broken or embarrassing to fix before closing

In order: **F1** (stray `y` in the learner's answer), **F2** (Hints toggle throws), **F3** (grammar never taught in 2 of 3 first-run flows), **F4** (shape claim without the shape change), **F5** (9 labels on hovering the `?`), **F6** (`#bSay` gating), **F7** (200 % overflow/clipping), **F8** (the route-card caveat renders as body copy). All are reproduced above with the command or measurement; none is speculative.

### 8. What is right and should not be changed

- **R4-1** is the cleanest item of the round: the aliases are in the learner's own vocabulary and the accent is a static, unpersisted orientation cue that disappears on use. Do not add motion, counts or persistence to it.
- **R4-3** is exactly right: one sentence, at the point of confusion, next to the visual evidence for it, plus the text-alternative home at the top of the sheet. `scrollTop=0` is the correct minimal fix.
- **R4-6** is honest and well argued. The decision *not* to send a Thyroid question to the HPA axis is the right call for a prototype whose central claim is that it asserts nothing it has not established, and the cut is recorded in the direction and goal docs rather than hidden. The length-scaled toast duration is a real improvement.
- **The ghost wording itself** is well built: short, pointer-neutral, on the `?` badge's plate, dashed-bordered in the attention colour, `aria-hidden` to avoid a double announcement, suppressed while a gated card is open, and it survives a backwards ribbon scrub. Keep it.
- **R4-5's fencing** is right: no `recordAttempt`, no correctness, "nothing is scored", the model framed as "how we'd put it", and `openReflectNow` closing other cards before opening. The card's markup and the Escape/focus contract are good.
- **The duplicate-route-name suppression** in `getLabels` and the `.rm` selector additions are sound and preserved the 8-label ceiling through playback.
- **The px→rem conversion is genuinely layout-neutral at 100 %**, and the `.panel` / `.card` / `#sheet` / `#tryCard` conversions are correct — the gap is the 13 shorthands and the fixed widths, not the approach.

---

## 3. How to reproduce (one-liners)

Run against a server on `:8765` from the repo root; all snippets used in this review were temporary scripts, since deleted, of the shape `scripts/.tmp-learner-review*.mjs`.

```js
// F1  Y types a character
await page.evaluate(() => window.HS.openPathway('stress','slow',false));
await page.evaluate(() => document.body.focus());
await page.keyboard.press('y');
await page.evaluate(() => document.querySelector('#reflText').value);   // "y"
```

```js
// F2  H crash
window.addEventListener('pageerror', e => console.log(e.message));
await page.evaluate(() => window.HS.openPathway('stress','fast',false));
await page.keyboard.press('h'); await page.keyboard.press('h');
// pageerror: Cannot convert undefined or null to object; #bHints says "Hints on"; no tip
```

```js
// F3  grammar tip reachability
// click [data-trigger="meal"] → window.HS.E.route === 'between', !document.querySelector('.tip.tiprich')
// click [data-trigger="stress"] → window.HS.E.route === 'fast',  !!document.querySelector('.tip.tiprich')
```

```js
// F4  is the ? at a line end?
const p = document.getElementById('r-' + window.HS.pathway().gate.routes[0]);
const L = p.getTotalLength(), m = p.getScreenCTM();
const q = document.querySelector('#labels .hs.q').getBoundingClientRect();
// sample p.getPointAtLength(0), (L/2), (L) → the ? matches t≈0.5 for all four gated pathways
// getComputedStyle(p).strokeLinecap → "round"
```

```js
// F5  9 labels on ? hover
document.querySelector('#labels .hs.q').dispatchEvent(new PointerEvent('pointerenter'));
document.querySelectorAll('#labels .lab').length;   // 9 on stress:slow and dark:night
```

```js
// F7  200 % layout
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
await page.evaluate(() => window.HS.openPathway('stress','fast',false));
// #pbar width 1466 in a 1440 viewport; .ribbon scrollWidth > clientWidth ("calm again");
// .tip bottom 687 vs #bottom top 666 (14 080 px² overlap)
```

```js
// F8  route-card caveat specificity (compare HEAD CSS against the working tree)
await page.route('**/css/app.css', r => r.fulfill({ body: execSync('git show HEAD:prototypes/v4/css/app.css').toString() }));
// open stress:fast, click a #world .rhit[data-st="on"], then:
getComputedStyle(document.querySelector('.card .schem'));
// HEAD:  font-size 14px, color rgb(162,182,186)   ← .card p (0,1,1) wins
// fixed: font-size 12px, color rgb(240,194,126)   ← .card p.schem
```
