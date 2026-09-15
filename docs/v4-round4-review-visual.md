# v4 round 4 — visual / visual-craft review

Reviewer lens: **visual craft only.** Scope: [`docs/v4-round4-plan.md`](v4-round4-plan.md) as written, judged against [`docs/relay-design-direction.md`](relay-design-direction.md) §5, §5.3, §5.4, §6.5 (`labels-max`), §6.6 and §10, and against the live build at `http://localhost:8765/v4/`.

Method: read the plan, the direction, `prototypes/v4/css/app.css` (all 487 lines), `prototypes/v4/js/overlay.js` (all 221), `ui.js`, `engine.js`, and the three scene files; then measured the running prototype. Measurements below are from a Playwright probe at 1280 / 1440 / 1920 × 900 that (a) counted and boxed every visible `#labels .lab`, (b) measured the rendered plate width of every string R4-2/R4-3/R4-4 proposes to add, (c) computed WCAG contrast for the token pairs the plan proposes to reuse, and (d) **simulated R4-2 + R4-3 in-page** by injecting the exact label object the plan specifies at the exact anchor it specifies. No repository file was modified. Temp scripts were deleted.

---

## 1. Verdict

**Yes-with-changes.** The plan is visually *safe* in the narrow sense that nothing in it draws a new mark on the stage, every addition is text placed by the existing resolver, and §5.4's quantity guardrail is genuinely respected — I could not find a single place where brightness, thickness, speed or length starts encoding an amount. But it is not visually *correct* as written, for two reasons the plan half-sees and then talks itself out of. First, **the label-count arithmetic is right for the state the plan measured and wrong for the state it matters in**: R4-2 keeps `stress:slow` at exactly 8 while paused, but `stress:slow` at body level **already reaches 8 during ▶ Play** in the current build, so R4-2 takes it to **9** — and the audit the plan relies on to catch that never presses ▶. The plan's own fallback would then trade a §10 label-count violation for a §10 salience violation by deleting an organ name to pay for a UI hint. Second, and more serious: **R4-2, R4-3 and R4-4 all add text to a stage that is already annotation-dense, and R4-3 in particular makes the annotation louder rather than the illustration clearer** — the exact opposite of what §10's squint test asks for. The plan's §5 claim that "nothing new is drawn on the stage as a *mark*" is true and beside the point: at body level the labels *are* the marks, and this round adds three more of them, two of which violate the direction's own §1 rule "Labels, not paragraphs. On the canvas, text is a name or a single line." Build R4-1, R4-5 and R4-6 essentially as written; rewrite R4-2's string, anchor and fallback, invert R4-3's mechanic from *prefix every route* to *mark the exception*, and cut or radically re-scope R4-4.

---

## 2. The label-count squeeze

### 2.1 What the plan claims, and what is actually true

The plan states (§5, line 276) that "two pathways are already at 7 labels on screen (`qb-baseline.json`: `stress:slow`, `dark:night`)". I re-ran the audit and read the baseline directly. That is **correct**: `coverage/v4/qb-baseline.json` reports `stress:slow` = 7, `dark:night` = 7 at all three widths, 83/83 green.

But the plan's model of *why* is wrong in two places, and both matter for R4-3 and R4-4.

**(a) `stress:slow`'s 7 labels contain zero route labels.** Measured at body level, 1440 × 900:

```
stress:slow @1440 level=body n=7
   Hypothalamus      Pituitary       Adrenal glands
   Heart beats faster   Pupils widen   Breathing quickens
   Liver releases glucose
```

All seven are organ/sign labels. None is a route name. This is by construction: `engine.js` line 116 gates the route-name branch on `else if(L!=='body')`, so at body level route names are **not emitted at all**. The plan asserts (line 98) that R4-3 changes "both the pulse label and the `L!=='body'` route-name branch" — so at body level R4-3 changes nothing except during ▶ Play, when `pr && pr.label` (line 115) emits one pulse label via the same `HS.routeText` call. **R4-3's cost at body level is therefore roughly zero, and its benefit at body level is roughly zero.** The item's stated learner-facing problem (line 91: "the task is asked *while looking at the body*") is not addressed by its own change at the level the problem is stated at. That is a design mismatch, not just a measurement quibble.

**(b) `dark:night` is at *organ* level, not body level.** The audit's 7 for `dark:night` is an organ-level count (`level=organ` confirmed in the probe). Its 7 labels are 4 organ labels **plus 3 route names** — so ~9 characters each get added by R4-3, and R4-4's hint is explicitly allowed at organ level. `dark:night` is the pathway that absorbs the full cost of both items.

### 2.2 Does R4-2 + R4-3 + R4-4 fit?

I simulated it rather than reasoning about it. Injecting R4-2's label exactly as specified (`anchor: HS.ptOn(gate.at[0], gate.at[1])`, `dx:0, dy:-26`, `cls:'badge ghostword'`, pushed first) and prefixing route labels with R4-3's `schematic `:

| view | level | labels before | labels after R4-2 | after R4-2+R4-3 | overlaps | verdict |
|---|---|---|---|---|---|---|
| `stress:slow` | body, **paused** | 7 | **8** | 8 | 0 | at ceiling |
| `stress:slow` | body, **▶ Play (pulse in flight)** | **8** | **9** | **9** | 0 | ❌ **over §10's cap — see §2.3** |
| `meal:after` | body | 5 | **6** | 6 | 0 | fine |
| `meal:between` | body | 3 | **4** | 4 | 0 | fine |
| `stress:fast` | body | 4 | 4 (no gate) | 4 | 0 | fine |
| `dark:night` | **organ** | 7 | 7 (R4-2 body-only) | 7 | 0 | **+72 px/route name** |

So: **`stress:slow` paused lands on exactly 8, with zero overlaps, at 1280, 1440 and 1920** — the plan's arithmetic is right for the state it measured, and the layout survives. Credit where due: my simulation put the ghost label at `@635,466` at 1440, wedged between the Liver label and the Adrenal-glands label, and the resolver pushed Liver *up* by 47 px rather than overlapping it. The collision solver absorbs this cleanly. **But `stress:slow` during ▶ Play goes to 9, and the plan's own audit cannot see it (§2.3).**

**But the plan's fallback is where it goes wrong.** Line 83 says: "If the audit reports 9, cut a hotspot label from body level rather than raising the cap," and line 277 repeats it. This is not a safe fallback, and it is not needed — but more importantly, if it *were* ever needed, dropping a hotspot label at body level removes an **organ name** from the body in order to pay for an **instruction**. In `stress:slow` that means deleting "Adrenal glands" or "Hypothalamus" from the HPA axis view so that the sentence "Not revealed yet · tap ? to try it" can sit on it. The learner loses the name of the organ that makes cortisol in order to read a UI hint. §10's label ceiling exists to keep the *illustration* legible; satisfying it by deleting anatomy inverts its purpose. **That trade is worse than the violation it avoids.**

### 2.3 Where the 9th label will actually appear

Not in the four gated pathways at body level. It appears in **`dark:night` at organ level once R4-4 fires**, and it appears in **▶ Play at body level**. Concretely:

- `dark:night` already runs 7 at organ level, of which 3 are route names. R4-4 permits one `.lab.carrierhint` at `HS.level() !== 'body'`. That is the 8th. It is at ceiling, not over — but only because `dark:night` has 4 organ labels, not 7. The plan's stated reason for banning the hint at body level (line 133: "body level is already at the 8-label ceiling in two pathways") is correct for `stress:slow` and **wrong for `dark:night`**, which is at 7 at organ level and would gain nothing from the ban if it were lifted. The ban is right; the reasoning is misapplied, which means a later round reading the comment will lift the ban for the wrong pathway.
- **This is the real 9th label, and it is not a risk — it is a certainty.** `stress:slow` at body level during ▶ Play already reaches **8 labels** in the current build: the pulse label (engine.js line 115, `pr && pr.label`) *is* emitted at body level. Measured live at 1440, sampling every 150 ms through a play-through:

  ```
  t=0ms     n=7   Hypothalamus, Pituitary, Adrenal glands, Heart beats faster,
                  Pupils widen, Breathing quickens, Liver releases glucose
  t=600ms   n=7   ... Hypothalamus releases CRH   (current hotspot's one-liner)
  t=1500ms  n=8   ... Hypothalamus releases CRH, "CRH · portal"   (pulse route name)
  ```

  Eight, at the ceiling, *before* this round. R4-2's always-on ghost label is emitted at body level regardless of playback state, so the moment the pulse is in flight on `stress:slow` the count is **9**. And R4-3 makes that pulse label 72 px wider (`schematic CRH · portal`, 176 px) while it is in flight, so the same frame is both over the cap and carrying the longest route plate that state has ever had.

  **This state is not in the plan's test matrix.** Line 277 says to re-run `v4-quality-bar.mjs` after R4-2/3/4, but that audit calls `openPathway(s, p, false)` (line 84 of the script) and never presses ▶, so `HS.pulse.on` is never true and line 115 never fires. The audit the plan relies on to catch a 9th label **structurally cannot see the one state that produces it.** The plan would ship a §10 violation while reporting 83/83 green.

### 2.4 The `slice(0,8)` reasoning is self-contradictory

Line 70 says to push the ghost label in `renderOverlay`'s label draw loop, "**before** `HS.getLabels()` items so it wins collision resolution," and line 81 justifies this by saying the `out.slice(0,8)` cap at engine.js line 123 "cannot silently drop it."

`return out.slice(0,8)` is the **last statement of `HS.getLabels`**. Anything pushed in `renderOverlay` is downstream of the cap and is therefore *never* subject to it — which is why pushing first works. But `renderOverlay` line 150 reads `const items = HS.getLabels().slice()`, i.e. it takes a *copy of an already-capped array*. So the cap can and does drop hotspot labels (`p.hots.forEach(...)` at engine.js line 122 runs last and is the first thing truncated). Pushing the ghost word first means it survives the cap; it does **not** mean "the cap cannot drop it," because it was never in the capped array. The plan has the right instruction for the wrong reason, and the wrong reason is the one that will mislead a later round. **Better: move the ghost label into `HS.getLabels` at construction time as the first `out.push`, and raise nothing** — the cap already has headroom at body level (7 of 8 used), and putting the string where the other strings live makes the `slice` behaviour honest and testable.

### 2.5 What "8" actually costs

Even at exactly 8 with zero overlaps, `stress:slow` at body level becomes: 7 white organ/effect plates plus one amber mono plate carrying 33 characters. Visually that is not "8 labels" — it is 7 short names and one sentence. §10's "no more than 8 labels" is a *count* proxy for *uncluttered*; adding the longest string on the stage to the densest pathway satisfies the letter and erodes the spirit. See §3.

---

## 3. Salience / squint test

§10 requires "the current relationship is the most salient thing on screen at every zoom level (squint test)." I ran the squint test literally — blurring label text by 4 px and comparing. Here is what the stage looks like *before* this round, at `stress:slow` body level 1440:

- Brightest thing: the two amber dashed ghost arcs, `opacity .62` with a `.45` casing and a `.14` glow (overlay.js lines 44–47, 47). These are the highest-luminance marks on the canvas, and they are the correct thing to be most salient: they are the unanswered question.
- Second: the pale-blue solid route and the white hotspot discs.
- Third: the seven white-on-`#0B171C` label plates. Each is a **filled near-black rectangle at 87% of the stage's own value**, so in a blurred view they read as seven dark blocks floating over the body — heavier than the route, comparable to the organs.

Now add the plan:

1. **R4-2** puts a 253 × 29 px amber-on-`#1A1408` mono plate — the single widest label proposed, and the only one using the `.badge` amber plate — immediately adjacent to the brightest line on screen. It is anchored 26 px above the `?` badge at the ghost's midpoint (verified position `@635,466` at 1440). It does not merely explain the brightest mark; it *becomes* a second brightest mark sitting on top of it.
2. **R4-3** widens `dark:night`'s three route plates from 169/241/140 px to 241/313/212 px. The middle one, `schematic nerve signals · schematic route`, becomes a **313 px mono plate** — the widest single element in the entire interface after the ribbon, wider than the tree panel's trigger rows. In a squint test a 313 px bright-mono bar on a 1440 px stage is a *dominant* horizontal, competing directly with the route it names.
3. **R4-4** adds a 263–284 px mono sentence at organ level.

**Judgement: yes, this pushes the illustration below the annotation.** Not because any single label is illegible, but because the plan adds ~64 characters of mono text at body level (`stress:slow`) and ~28 characters per route name at organ level, to a stage whose existing text load is already the densest thing about it. §1 principle 3 of the direction is "**Labels, not paragraphs.** On the canvas, text is a name or a single line." `schematic nerve signals · schematic route` is not a name. `Not revealed yet · tap ? to try it` is not a name. `beaded line = a nerve or light signal` is not a name — it is a sentence in a label's clothing. Three of the round's four stage additions violate the direction's own stated copy rule.

**Concrete alternative.** Do not add text; change what the existing text and the existing mark say.

- **R4-2 instead of a sentence:** keep the `?` badge, and change the **hover/label string that is already there** to the answering words, then make the badge itself self-describing at rest. The direction §4.3 already says the ghost's label reads "Something acts back here" — which is the *wrong* sentence for task 5, because it describes an association. Replace it with **`Not revealed yet`** (three words, ~110 px) on the badge's own plate, which is what §5.3's "Unrevealed (ghost)" row already calls the state. If the affordance needs naming, put "tap ? to try it" in the **existing tip channel** (`HS.tip`, ui.js lines 49–53), which is designed for exactly one dismissible instructional line and already renders bottom-right where the pathway bar is — not on the body. Result: `stress:slow` stays at **7**, the brightest mark gets the three words that answer task 5, and the instructional half moves to the channel built for instructions.
- **R4-3 instead of a prefix:** prefixing is the wrong direction. §5.3's own table (direction line 426) already specifies the correct mechanic: "`ACTH · schematic route` on first appearance, then `ACTH · blood`." The word **schematic appears once, on first appearance** — that is the authored rule, and the build currently implements the *second* half everywhere (`cortisol · blood`, `melatonin · blood`) while only three routes carry the first-appearance form. So the plan has it backwards: it should **implement §5.3 as written** rather than inventing a prefix. Concretely: keep `· blood` when the route is `on` and already seen, and show `· schematic route` **on the route label only while that route is the current/just-drawn one**. Net text change: **zero on average**, and the "not a vessel" claim lands at the moment a line first appears — which is when the learner is actually asking the question. If a persistent cue is still wanted, the honest place is the **plate's border colour, not its text**: a dashed 1 px plate border `.lab.sig.ghostline` on route labels, reusing the visual grammar the directions already uses for "not real" (the `.draft` banner at app.css line 43 is dashed; `.card .ev` at line 98 is dashed). Text length unchanged, meaning carried by a form cue, and no new reading.
- **R4-4 instead of a sentence:** the plan itself identifies this item as "the item most at risk of over-decorating" (§8 line 335) and says to cut it first. I agree, but the fix is not to cut the *teaching* — it is to stop teaching it with a sentence on the body. The grammar legend already exists and already renders (`ui.js` line 248, `HS.grammarLegend`, overlay.js lines 14–24) with 42 × 12 px **line swatches** next to each carrier name. That swatch is the teaching device. Put **one swatch, not one sentence**, on the body: a 42 × 12 px inline `<svg>` in the route label's plate, so the label reads `[—beads—] nerve signals · blood` instead of `beaded line = a nerve or light signal`. This is *shorter* than the current label text, teaches the texture by showing it, costs no reading, survives grayscale perfectly (it is the actual texture), and does not need a one-shot latch because it is not a paragraph competing for attention.

---

## 4. The `.first` accent (R4-1)

The plan proposes a "single quiet accent (left border, or the existing `.trig.continue` treatment at app.css line 328)" on all three trigger rows while `HS.E.state !== 'triggered'`.

**Problems, in order of severity.**

1. **`.trig.continue` is the wrong treatment to borrow, because it is the treatment for `remembered`, not for `start`.** app.css line 328: `.trig.continue{border-color:#2F5A68;background:rgba(141,176,255,.07)}` — a full 1 px border *and* a tinted background, in the same blue family as `--primary-soft` used by `.row[aria-selected="true"]` (line 62), `.opt[aria-checked="true"]` (line 197) and `.tb[aria-pressed="true"]` (line 32). "Blue-tinted fill + border" is this system's **selected/active vocabulary**, used consistently in five places. Applying it to all three rows at rest reads as *three things are selected*, which is a visual lie — exactly the outcome the plan says it wants to avoid ("**not** an animation, **not** a badge, **no** count" addresses decoration, not state semantics).
2. **It collides with `.trig.continue` in the same stack.** `renderContinue` (ui.js lines 83–90) injects a `.trig.continue` button into `#continue` immediately above `#triggers`. On a returning learner's first paint there will be **four** rows in the same column, three of them wearing a start accent and one wearing a remembered accent, in overlapping blue. The plan keeps the tip "Start here: pick something that happens to you." (line 46) as well — so the first screen says "start here" four times (tip + three borders) and "continue" once, in the same colour, in a 278 px column.
3. **Grayscale: it survives, but weakly, and it collides with the `soon` row.** `#2F5A68` against the panel's `rgba(11,22,28,.86)` over a dark stage is a low-contrast edge; desaturated, a `#2F5A68` border and a `#2A3E46` `.sw` track (line 39) and `#15272F` `.ti` tile (line 52) all land in the same narrow luminance band. It will *read* as a slightly brighter edge, not as an instruction. Meanwhile `.trig.soon` (line 56) is `opacity:.55` — the "not in this concept" row — and the third row ("It gets dark") was rendering at 68 px height in my probe (a wrap), so the column is not visually uniform to begin with.

**Better.** Make "start here" a property of the **column**, not of three rows, and make it a **position/weight cue** rather than a state cue:

- Give the `WHAT HAPPENS IF…` section heading (`.sec`, line 49, currently 11 px uppercase `--ink-3`) one sentence of plain-language lead-in styled as body copy at `--ink-2` 12 px: that is where the vocabulary fix the plan wants actually belongs, and it is a **zero new control** change.
- Differentiate by **weight, not by fill**: raise the three `.trig` rows' title to 600/14 px (`.trig` is already `font-weight:500` at line 50) and leave the accent off entirely. Weight is legible in grayscale, reads as *primary list* rather than *selected item*, and cannot be confused with the `.continue` row, which keeps the only tinted fill in the column.
- If a mark is still wanted, use a **2 px left border in `--warm` `#F0C27E`** — the amber already used for "attention, not action" (`.tip .bulb` line 81, `.ev` chip line 98, `.thought` line 192) — rather than `#2F5A68`, which is the selected vocabulary. Warm/amber reads as *look here*, blue-fill reads as *this is chosen*. That distinction already exists in the system; use it.

Either way: **drop the trick of borrowing `.trig.continue`.** And if the tip stays, drop the accent — one instruction, not two.

---

## 5. Typography and contrast

### 5.1 The `.lab.badge` pair claim — **confirmed, and generously so**

I computed WCAG 2.x contrast from the literal token values in `app.css`:

| pair | source | ratio | 4.5:1 at 12 px? |
|---|---|---|---|
| `#FFD08A` on `#1A1408` | `.lab.badge`, line 193 | **12.76:1** | ✅ passes with large margin |
| `#7CCBFF` on `#0B171C` | `.lab.sig`, line 87 | **10.27:1** | ✅ |
| `#7C959B` on `#0B171C` | `--ink-3` on `.lab` plate, line 86 | **5.75:1** | ✅ (thin, but passes) |
| `#A2B6BA` on `#0B171C` | `--ink-2` on plate | **8.61:1** | ✅ |
| `#CFE0E2` on `#0B171C` | `.hot text` | **13.36:1** | ✅ |
| `#E6EFEF` on `#0B171C` | `--ink` on plate | **15.57:1** | ✅ |

The plan's claim (§5 line 278) is **correct**: the badge pair clears 4.5:1 comfortably. Note the badge's *actual* font-size is **11.5 px** (line 193), not 12 — the plan says "12 px" twice (lines 278, and §5). 11.5 px is smaller than the plan believes, though at 12.76:1 that is not a legibility failure. The real issue with reusing this pair is not contrast, it is **semantics**: `#FFD08A` on `#1A1408` with a `rgba(255,181,71,.55)` border (line 193) is the **amber badge plate**, used in the build for `E.whatIf` badge labels (`engine.js` line 108) and the `.thought` chip. Reusing it for the ghost's unrevealed state makes an *instruction* wear the *thought-experiment* plate. Use the plate that already means "unrevealed": `.hot.q circle.b` is `stroke:var(--fb)` dashed (line 237), and `--fb` `#FFB547` on `#0B171C` is the correct ink. (For reference, `#FFB547` on `#0B171C` ≈ 10.3:1 — passes.) Same amber family, correct association, no new token.

### 5.2 Does the string fit the plate?

R4-3's question — "does `schematic cortisol · blood` fit the label plate without wrapping or truncating, at 1280 and 1920, at body and organ level?" — **yes, mechanically, and it is not close.**

`.lab` is `white-space:nowrap` (line 86) with `padding:5px 6px 5px 10px` and `font-size:12px` mono for `.sig` (line 87). Measured by cloning plates in the live DOM at device scale 2:

```
 133x29   cortisol · blood                          (current)
 205x29   schematic cortisol · blood                 (+72)
 176x29   schematic CRH · portal                     (+72)
 212x29   schematic melatonin · blood                (+72)
 241x29   schematic light signals · nerve            (+72)
 313x29   schematic nerve signals · schematic route  (+72)   <-- widest
 277x29   schematic cortisol · steroid · blood       (+72, Advanced on)
 253x29   Not revealed yet · tap ? to try it         (R4-2)
 284x29   beaded line = a nerve or light signal      (R4-4)
```

`scrollWidth === offsetWidth` for every one: **no wrapping, no truncation.** Nothing overflows the app either — at 1920 the widest plate placed at `x=838` ends at `x=1151`, well clear of the zoom controls (`ctrlL` ≈ 1780). The resolver's clamp at overlay.js line 171 plus the `ctrlL-8-w` guard at line 172 both hold. So R4-3's own risk assessment (line 109) is accurate on this point.

**What the plan does not check, and should:** two string defects that the plan's own rules contradict each other on, both verified live:

- **The de-dup is not a fallback, it is load-bearing.** Line 111 says to normalise `dark.js` line 9 `clockPineal` to `label:'nerve signals'` "otherwise the prefix collides with itself." I confirmed the collision: with `routeWord` applied and no scene-file edit, `clockPineal` renders **`schematic nerve signals · schematic route` at 313 px** (vs 184 px normalised, 241 px today). At 1280 that plate sits at `x=573` and ends at `x=886` — 69% of the viewport as one mono bar. The plan's projected-results list (line 99) does not include a normalised `clockPineal` entry, so a reader following the list rather than the prose ships the 313 px plate. **Make the de-dup an explicit audit assertion**, not a scene-file edit a reviewer has to eyeball.
- **`fbMel` will be prefixed unless `getLabels` is also changed, which the plan does not say.** Line 97 defines `HS.routeWord = id => 'schematic ' + HS.routeText(id)` — **no carrier check**. Line 98 says to substitute `HS.routeWord(id)` at both call sites in `HS.getLabels`. But `dark:night`'s gate has `labelRoutes:['fbMel']`, so once the gate is revealed, `getLabels` emits `rl-fbMel` and `routeWord` prefixes it. Line 111 asserts the opposite ("The feedback route `dark.js` `fbMel` … is deliberately **not** prefixed — it is not a carrier route and `HS.carrierOf` classifies it `feedback`"), but `carrierOf` is never consulted by `routeWord` as specified. Result: the feedback label becomes `schematic melatonin · acts on the clock` — a line that **acts back**, wearing a word that means "this is a drawing convention," and the §10 task-6 claim ("not a vessel or a nerve") is attached to a route that is neither a vessel nor a nerve but *is* a feedback loop. **The helper needs the carrier guard built in** (`HS.carrierOf(id)==='feedback' ? HS.routeText(id) : 'schematic '+HS.routeText(id)`), or the item ships a bug that the plan's own audit check (c) would *not* catch, because it only asserts `/acts back/i` for feedback labels — and `melatonin · acts on the clock` still contains "acts on," not "acts back."

### 5.3 One genuine typography defect the plan adds

`.lab.carrierhint` is specified (line 125) as "same plate as `.lab.sig`, dimmer border, `font-family:var(--mono)`." `.lab.sig` is **already** mono (line 87) and **already** `--msg` `#7CCBFF` — i.e. **carrier-hint text and route text will be the same typeface, same size, same colour, on the same plate with a slightly dimmer border.** In a squint test these two label classes are indistinguishable, so a sentence *about* a route will read as *a route name*. That is a real confusion the plan creates: 284 px of `#7CCBFF` mono reading "beaded line = a nerve or light signal" sitting in the same visual register as `melatonin · blood`. Either drop the hint (my §3 recommendation) or give it the *other* type register — `.lab.one` is sans at `font-weight:500` (line 88), which is the system's existing "this is prose, not data" signal. Do not put teaching prose in the data typeface.

---

## 6. Visual honesty of R4-6

R4-6 converts five inert tree rows into overview sheets. The plan's own guardrail (line 186) requires each to "say plainly that the system is not built here," with `limits:'Not built in this prototype — the thyroid axis is out of scope for these three scenes.'`

**Will it look like a real destination or like an apology?** As specified, **like an apology** — and the reason is structural, not tonal. The plan reuses `#sheet`, which is a **400 px right-docked panel with `top:74px;bottom:190px`** (app.css line 176) — visually the *same container* as `Read the route`, which is the product's flagship content surface. So the learner clicks "Thyroid" in the tree and gets a panel that looks exactly like the panel they get for the HPA axis — same size, same position, same affordances — containing a question, a generated diagram, a limits sentence and a "go somewhere else" button. Two problems:

1. **The container over-promises.** A 400 × 636 px panel is the visual weight of a lesson. Filling it with "not built here" makes the emptiness *more* conspicuous than a toast did, because a toast is transient and a sheet is a destination you arrive at.
2. **The generated `map` from `HS.connEdges()`/`HS.TREE`** (line 176) will be thin or empty for `thyroid` and `dopa`: `connEdges()` (ui.js line 100) only returns edges where a hotspot's `leads` crosses scenes, and neither thyroid nor dopamine has children, pathways or leads. So two of the three overviews will render a diagram with **one node and zero edges** — a box with a word in it. That is worse than the toast: it is the visual signature of an unfinished feature.

**Lighter treatment that keeps the dead end from being a dead end.** Keep the row's **existing toast-plus-navigation** shape but add the one thing the toast lacks — a way forward — and do not open a sheet:

- Change the third tree row's own markup, not a new surface: rows without `children` currently render `<small>· not in this concept</small>` (ui.js line 147). Replace that with a **quiet inline `gobtn` inside the tree row's own group** — the system already has `.gobtn` styled for exactly this (app.css line 322: full-width, left-aligned, `small` subtitle, hover border) and already uses it in sheets. A `.gobtn` reading "HPA axis · the nearest thing that is built ›" appearing under the Thyroid row, in the left column, at the point of the dead end, is: the right size (it is a row, not a lesson), the right place (where the click happened), and honest (it never claims thyroid content exists).
- This costs the plan's whole `HS.openOverview` surface and its 18 scripted checks, and **removes a 400 px panel from the first screen**, which is the only screen §10 task 1 cares about.
- If a sheet is genuinely wanted for `glucoseSys` (which *does* have children and real destinations), ship it for that one system only, where the 400 px container is filled with three real pathways and the diagram has real edges — and it will look like a destination because it is one.

---

## 7. What the plan gets visually right (do not change)

- **R4-2's diagnosis is correct and important.** §5.3 of the direction fixes "Association = grey dotted line, **no end glyph**" — and the ghost is amber dashed *with* a `?`, so it is not literally drawn as an association. But the plan's observation (line 64) that "an unnamed dashed connector is *the* conventional visual for 'association'" is right, and its refusal to fix it by dimming the ghost is *right*: line 75's "`.62` opacity is correct — it is the invitation. Fix the explanation and leave the salience alone" is the best design judgement in the document. Keep that principle. (I disagree only with *how* it explains — see §3.)
- **R4-2's collision-and-ordering instinct is sound.** Pushing the new label ahead of hotspot labels so it cannot be dropped, and refusing to raise the cap, is the correct discipline even though the stated mechanism is muddled (§2.4).
- **R4-4's ban on body-level placement is correct**, and its `pointer-events:none` + not-in-tab-order reasoning (line 131) is exactly right — a label that can steal a click from a 16 px `.rhit` stroke beneath it would be a genuine interaction bug.
- **R4-4's "never tied to quantity" comment requirement** (line 133) and the `TEXTURE` byte-identity audit assertion (line 264) are the right guardrail for a system where `.route.hollow` and `.rglow` already exist and could tempt a later round into encoding amount. Keep.
- **R4-5's constraint that the project must not call `HS.recordAttempt`** (line 160) is a *visual* decision as much as an ethical one: `.hdot.v` (line 153) draws a green check and `.chip.done` (line 191) is `--good` + 600 weight, so a recorded reflection would immediately start painting completion state onto the body. Keeping reflect out of the progress system keeps the stage free of milestone marks. Keep unmodified.
- **R4-1's refusals** — "**Not** an animation, **not** a badge, **no** count" (line 45) — are the right instinct, even though its chosen accent contradicts them (§4).
- **The reduced-motion audit is, in one respect, better than the plan knows.** The plan repeats (lines 158, 252) the worry that `#reflCard` might inherit `@keyframes tipin`. I measured it: computed `animation-name` on `#reflCard` is **`none`**, `animation-duration: 0s`. The card is already motion-free. The plan's line 251 concludes this by reading `.try` (line 103) and correctly finding no `animation` rule; the residual doubt can be dropped, and `.rm #reflCard{animation:none}` is unnecessary. Similarly, `.rm *{transition-duration:.12s!important}` (line 262) is a **universal** selector, so every new label, sheet and card in this round is already covered — the plan's §4 warning that "any *new* keyframed element must be added to that selector list by hand" is correct and worth keeping as a standing note.
- **Do not touch** `.rglow`/`.casing`/`route.ghostin` ghost treatment, the `TEXTURE` constants, `--ink-3`'s 5.75:1 plate contrast, the ribbon's `min(720px, calc(100vw - 300px))` width (line 387), or the three `@media` breakpoints at 1180/1400/1500 (lines 388–401). Every one of these is load-bearing for the 83/83 and none of them needs to move for this round.

---

## 8. Ranked changes to the plan

1. **R4-2: replace the 33-character sentence with the three words `Not revealed yet` on the `?` badge's own plate, in `--fb` `#FFB547` on `#0B171C` (not the `.badge` `.whatIf` plate), and move "tap ? to try it" into the existing `HS.tip` channel** — this keeps `stress:slow` at 7 labels, answers §10 task 5, and stops paying for an instruction with an anatomy label.
2. **R4-3: invert the mechanic — implement §5.3's authored rule (`· schematic route` on first appearance, then `· blood`) instead of prefixing every route name**, so the "not a vessel" claim lands at the moment a line appears, average label length is unchanged, and the 313 px `schematic nerve signals · schematic route` plate can never ship.
3. **R4-3: move the persistent deny cue from the label *text* to the label *plate border*** — a `1px dashed` border on route plates, reusing the system's existing "not real" grammar (`.draft` line 43, `.card .ev` line 98) — so the claim survives grayscale at zero reading cost.
4. **Cut R4-4's sentence and replace it with the 42 × 12 px texture swatch already built inside `HS.grammarLegend`** (overlay.js line 17), inline in the route plate: it is shorter than the label it supplements, teaches by showing, is the actual grayscale cue, and needs no per-session latch — if that is too invasive, cut R4-4 entirely per the plan's own §8 ranking.
5. **Delete R4-2's "cut a hotspot label at body level" fallback** and replace it with "move the ghost label into `HS.getLabels` as the first `out.push`, and if the audit reports 9, shorten the string" — never delete an organ name to pay for a UI hint.
6. **Add ▶ Play (pulse in flight) to the R4-7 audit matrix — this is the highest-priority test gap in the plan**, because `stress:slow` at body level already reaches 8 labels during play, the pulse label (engine.js line 115) is the specific line that does it, and `v4-quality-bar.mjs` as written never presses ▶, so the plan would ship a 9th label while reporting 83/83 green.
7. **R4-1: drop the `.trig.continue` treatment** (selected-state vocabulary, collides with the real `.continue` row on returning-learner first paint) and use either a `2px` `--warm` `#F0C27E` left border (attention, not selection) or weight alone; and if the tip stays, drop the accent so the first screen gives one instruction, not four.
8. **R4-4 spec fix: do not give `.lab.carrierhint` the `.lab.sig` type register** (both would be `#7CCBFF` mono at 12 px on the same plate) — use sans `.lab.one` weight if the hint survives at all, so prose never wears the data typeface.
9. **R4-6: do not open a 400 px `#sheet` for `thyroid` and `dopa`** (their `connEdges` diagram is one node, zero edges) — render the "nearest built thing" as a `.gobtn` inside the tree row's own group and reserve the sheet for `glucoseSys`, which has real pathways and real edges to fill it.
10. **R4-7: add two explicit assertions** — (a) that the `clockPineal` double is de-duplicated, so the 313 px `schematic nerve signals · schematic route` plate can never be produced by a missed scene-file edit; and (b) that no `feedback`-carrier label ever contains the word "schematic", since `HS.routeWord` as specified has no carrier guard and would prefix `melatonin · acts on the clock` the moment the dark gate is revealed.
11. **R4-3 spec fix: build the carrier guard into `HS.routeWord` itself**, not as a note in the prose — `HS.carrierOf(id)==='feedback' ? HS.routeText(id) : 'schematic '+HS.routeText(id)` — because the plan's own line 111 asserts `fbMel` is not prefixed while line 97's helper, and line 98's call-site substitution, guarantee that it is.
12. **Note for §4 of the plan:** `#reflCard`'s computed `animation-name` is already `none` — drop the `.rm #reflCard{animation:none}` line as unnecessary, and keep the "new keyframes must be added to the line-260 list by hand" standing rule.
13. **Correct §5's line 276 and line 133 reasoning:** `stress:slow`'s 7 paused body-level labels contain **zero** route labels (`engine.js` line 116), and `dark:night`'s 7 are at **organ** level and *are* route labels — so R4-3 costs ~nothing at body level and everything at organ level, and the ban on R4-4 at body level is right for `stress:slow` but wrongly justified for `dark:night`.

---

*No repository files were modified by this review. Temp probe scripts (`scripts/.tmp-*.mjs`) and their screenshots were removed.*
