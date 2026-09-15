# Round 4 plan: a learning / pedagogy review

Date: 15 September 2026
Reviewing: [`docs/v4-round4-plan.md`](v4-round4-plan.md) on `design/v4-quality-round4`
Lens: **learning only.** Does this plan teach? Where does it teach the wrong thing? What is the evidence-based better move?
Evidence: read the plan in full (including §8), `relay-design-direction.md` §2.5/§4.3/§4.5/§4.7/§5.3/§5.4/§10/§13, `v4-prototype-review.md` (including the scientific review list), `v4-round3-ideas.md` (B3, Theme F, the round-4 baseline), all five `pathway` blocks plus every `reflect`/`gate`/`whatIf`/`try`/`signs`/`read` in `stress.js`, `meal.js`, `dark.js`, and `engine.js`'s `gate`/`checkTry`/`afterPlay`/`openReflect`/`playAll`. Ran the build at `http://localhost:8765/v4/` at 1440 × 900 and measured label sets, label counts, the route card, the ghost's stroke, and the sheet's fold.

---

## 1. Verdict

**Partly.** The plan improves learning, but unevenly, and one of its seven items is aimed at the wrong lever.

The plan's own §8 is honest about the shape of the problem — "two red, two hollow" — and two of its items (R4-2 and R4-5) are genuinely the right moves at the right moment: they take an answer that already exists and put it where the learner's attention already is, and neither of them adds a single new concept. That is exactly what a round-4 on a mature prototype should look like.

**Highest-value item: R4-5.** Self-explanation is the strongest evidence-based move available in this build, the affordance is already constructed and inert (`pathway.reflect` on all five pathways, `openReflect` in `engine.js:229`), and the plan's diagnosis of *why* it is inert is correct and I confirmed it behaviourally: calling `HS.openReflect()` today is the only manual path, and it is not exported in a usable way (I measured `typeof HS.openReflectNow === 'undefined'`), while the automatic path fires only after a full play-through *with* the gate already revealed (`engine.js:225`). Making the "Route explored" chip a button is a two-line change that converts an existing, well-built surface from decoration into a retrieval event. That is the cheapest large comprehension win in the plan.

**Most doubtful item: R4-3**, and specifically the `'schematic ' + HS.routeText(id)` prefix. It is the item that looks the most like teaching and is the least likely to teach. It converts six route names into six repetitions of a word the learner will have pre-attentively filtered out by the second exposure, and it does so *permanently on the stage*, which is the most expensive place to spend a word. The one genuinely excellent half of R4-3 — the permanent deny line on the route card — is buried under that prefix, and the plan lists them at the same priority. R4-3 should ship the card line and the `read()` normalisation and drop the prefix. See §3.

The two items I would cut if the round must shrink are **R4-3's prefix** (not R4-3 entirely) and **R4-4**, in that order — which is close to the plan's own §8.3 ranking, but the plan ranks R4-4 first and the prefix last, and I think the prefix is the weaker of the two.

---

## 2. Task 5 — will the wording prevent the "association" misconception?

**Partly, and the plan is solving the wrong half of the problem.**

### What the plan does

R4-2 pushes one always-on label, `'Not revealed yet · tap ? to try it'`, anchored at `HS.ptOn(g.at[0], g.at[1])` — the ghost's midpoint — at body level, when the gate is unrevealed. It also adds the same string as `gate.unrevealed` scene data and makes `showRouteCard` say `Nothing has been shown here yet.` for a ghost route.

### Why the label alone is not enough

Two documented facts make this a *shape* problem, not a *wording* problem.

First, the direction already knows this. §5.3 commits the design to the position that "**Never literal:** no route resembles a vessel, nerve or duct in shape, texture, colour or branching" and D10 (`relay-design-direction.md:599`) explicitly resolves the ambiguity: "**Connector grammar:** association changes from dashed to **dotted grey**; **dashed faint amber + `?`** now means 'not yet revealed'". The `documentation/07-anatomy-and-visual-system.md:55` sentence the plan cites — "Association is nondirectional dashed context, with no traveling pulse" — is the convention *this product's own documentation fixes* for a dashed connector. So the plan is correct that the mark teaches "association". But the plan's response is to leave the mark exactly as it is and add a caption. That is the definition of a label fighting a shape.

Second, I measured what a learner actually sees at the moment task 5 is asked. At `stress:slow`, body level, nothing hovered, the label set is:

```
Hypothalamus · Pituitary · Adrenal glands · Heart beats faster · Pupils widen
· Breathing quickens · Liver releases glucose           (7 labels, measured)
```
plus the five hotspot buttons `1 2 3 4 ?`. `#labels.innerText` contains **no** occurrence of `/not revealed|not shown|hidden|association/i` — confirmed. The two amber arcs are the brightest marks on the stage (`opacity:.62` + `.45` casing + `.14` glow against `.24`/`.2` for the other pathway's faint edges) and they carry exactly one symbol: a bare `?`.

Here is the specific problem with the plan's fix on that screen. The label is pushed at `HS.ptOn(g.at[0], g.at[1])` — `gate.at` for stress is `['f1',.5]`, which is the midpoint of `f1`, i.e. *the same point the `?` badge sits on*. So the new words land directly on top of / beside the badge and become the seventh thing in a column of seven labels. In the resolver (`overlay.js:162–184`) it is an ordinary `it.noLeader===false` item with a leader line, so it draws a leader to that midpoint: a caption with an arrow pointing at the ambiguity, saying "this is a thing that exists and is unexplained". That is not a misconception fix; it is a *highlight* of the misconception.

And there is a second, subtler problem the plan does not mention: **the words describe the interface, not the biology.** "Not revealed yet · tap ? to try it" is a sentence about the app's state machine. Task 5 is a question about what the mark *means*. A learner who reads "not revealed yet" can still reasonably answer "so it's an association you haven't shown me yet" — the plan's own §3 caveat #2 concedes exactly this.

### The stronger move

There are three stronger moves, and they compose. I would ship all three and demote the label to a fallback.

**(a) Make the unrevealed mark a state the learner can act on, not a connector they must interpret.** The misconception is "this dashed line is a *relationship kind*". The fix is to make it visibly not a route yet. Concretely: the plan already has the machinery in `HS.setRoute` (`overlay.js:41–51`). A ghost today has `stroke-dasharray:'6 7'` (measured) and a `?` badge — i.e. a *different dash pattern of the same kind of thing*. The `?` hotspot carries `.q` and already has its own dashed ring. Make the *line itself* render as the **`?` badge's own affordance extended**: draw the ghost as a dashed line where the dash pattern is interrupted at the midpoint by the badge plate, so the line visually terminates *into* the question mark rather than passing behind it. A learner then reads "…?…" as one object: *a question*, not *a line with a badge stuck on it*. Combined with (b) this is the whole fix, and it costs one `stroke-dashoffset` / path-splitting change in `buildRoutes`, not a new surface.

**(b) Move the reveal to the moment of confusion, not to a hover.** The plan's own §3 acceptance check for R4-2 proves the words are *next to* the ghost. The comprehension outcome is different: check whether the unmatched left-hand side (`.left` gap where the source organ is) reads as unfinished. In the current build, `f1` starts at the adrenal glands and runs *back up* to `83 200` (the pituitary) — both ends land on organs, so the ghost looks like a completed connector. That is what makes "association" the modal answer. **The single highest-value change to R4-2 is to make the ghost's upstream end visibly unfinished** — the path already stops short in authoring (`f1` ends at `[83,200]` which is near but not on the pituitary label), but nothing draws attention to it. Drawing a short, fixed "…" or a blunt unfinished end-cap at the target, with the badge at that end rather than the middle, makes the shape say *incomplete* independent of any word. Compare §5.3's own table: every *revealed* relationship type in the grammar has an **end glyph** (arrow / bar / diamond); the ghost is the only one with **no end glyph**. That asymmetry is already the design's statement of "not a relationship yet" — it is just too quiet. Amplify the asymmetry; do not caption it.

**(c) Let the reveal be what resolves the question, and make the resolution legible as a resolution.** `checkTry` already does the right thing: `g.routes.forEach(id=>HS.setRoute(id,'on',{draw:true}))` at `engine.js:307`, plus the closed-circuit travel at `309–310`. The pedagogical move is to make that transition *readable as answering the question*: at the moment `checkTry` fires, replace the tap target's `?` with a one-word state (`revealed` / a check, already the `.v` class) and let the new label be the thing that appears. The plan's R4-2 acceptance check already asks for "press the `?` and assert the label is replaced by the revealed state's wording" — good. But the plan should also state the *reverse*: the ghost's wording must be the only wording, so a learner who has never tapped it sees one sentence about the ghost and it is a question, not a description.

**Concrete alternative I would ship for R4-2:** (i) split the ghost path at the midpoint so the badge terminates it, and remove the mid-badge-on-a-continuous-line reading; (ii) keep the ghost at `.62` (the plan is right that this is the invitation) but give it the same "no end glyph" treatment the grammar already assigns it, and make that visible by drawing a short flat cap where the end glyph would be, in the ghost's own amber; (iii) shorten the label to a question in the learner's voice — `What acts back here?` with `Try it?` as the button word — anchored at the **unfinished end**, not the midpoint; (iv) keep `gate.unrevealed` as scene data but **fold the `tap ?` instruction into the label only for the first pathway in a session**, so it teaches the affordance once rather than six times. The plan's current string is an instruction manual for the UI; the learner needs the *question*, and the button already exists in the pathway bar and on the hotspot.

---

## 3. Task 6 — "schematic" as a prefix on every route name

**No. This is habituating wallpaper, and it is placed where words are most expensive.**

### The habituation argument, grounded in the count

The plan prefixes **six** route names, permanently, at organ level and closer (`HS.getLabels` `L!=='body'` branch, `engine.js:116`), plus the pulse label (`115`). I measured what those names are today at `stress:slow` organ level:

```
lab sig :: CRH i    ·    lab sig :: ACTH i    ·    lab sig :: CRH · portal
```

Note the plan's own §R4-3 table concedes the collision problem: three routes already carry `· schematic route` in their scene `label`, so the plan has to *normalise them down* (`stress.js:9`, `:12`, `dark.js:9`) before it can prefix them up. That is a smell. The plan is spending effort to remove a string that a previous round added for exactly this purpose, so it can add it back in a different position.

After the change the on-body labels read `schematic nerve signals`, `schematic ACTH · blood`, `schematic CRH · portal`, `schematic adrenaline · blood`, `schematic light signals · nerve`, `schematic melatonin · blood`. Six labels, one repeated grammatical modifier, on a stage where the label budget is already at 7 and the ceiling is 8 (§2.5: "maximum of 8 on screen"). Route names grow from ~22 to ~32 characters, which the resolver's `drop` rule (`overlay.js:179`) is explicitly allowed to resolve by *hiding the label* — `drop=!!still&&it.noLeader&&/\bsig\b/.test(it.cls||'')`. So the plan's own stated failure mode is "a route name that steps aside", and the plan calls that acceptable. Pedagogically it is not: **the fix for "the learner doesn't know what the lines are" must not be "show fewer route names."**

On habituation specifically: the word appears at the *start* of every label, so after two exposures it becomes a syntactic prefix — readers stop encoding it and begin parsing `schematic X` as the name of X. The literature this maps to is the **redundancy effect** (repeated on-screen text that duplicates other on-screen text or the visual itself depresses learning rather than reinforcing it) and **seductive-details / split-attention**: the modifier adds reading load at the exact moment the learner is trying to map a name to a line. A word that is true of *every* route in the product cannot distinguish any of them; it is a property of the *medium*, not of the thing being labelled, and medium properties belong in a legend or a first-use note, not in a per-instance label.

### What the evidence favours instead

**Pre-training** (presenting the component concepts — here, the *grammar* — before the learner has to use them) is the right frame, and it argues for exactly the opposite placement: teach the grammar **once, before/at first contact**, then let the labels be names. The direction already agrees — §5.3's own route-label rule is `ACTH · schematic route` **on first appearance, then** `ACTH · blood`. That is a pre-training-then-drop design. R4-3 *replaces a first-appearance treatment with an every-appearance one*. That is a regression against the direction's own copy rule (§7: "**Schematic:** 'ACTH · schematic route' (first appearance)").

**Where the deny line belongs.** The plan's second half of R4-3 — a permanent footer on every route card, `Schematic: not a drawing of a blood vessel or a nerve.` — is **the right move and it is strictly better placed than the prefix.** Reasons:

1. It fires **at the moment of confusion**, which is when the learner has clicked a line to ask what it is. `showRouteCard` is reached by one click on any `.rhit` (16 px stroke, wide) or by Enter on a focused hotspot. There is no knowledge prerequisite, unlike `Read the route`.
2. The card is a **card**, not the stage. It carries the cost of a longer sentence without competing for the 8-label budget or the squint test.
3. The card already carries the *only* other affordance that answers task 6 correctly: the texture swatch (`ui.js:28`, `HS.routeTexture(id)`) plus `carrLbl` — measured today as `carried in the blood` for an ACTH card. So the deny line lands *next to the visual evidence it is denying*, which is where a refutation is actually processed.
4. It is honest about its scope: "not a drawing of a blood vessel or a nerve" is a statement about the *line*, and the card is about the line. The stage label is about the signal.

**Concrete alternative for R4-3, which I would ship instead of the plan's version:**

- **Drop `HS.routeWord` entirely.** Do not touch `HS.routeText`, do not normalise the three scene labels, do not change `engine.js:115–116`.
- **Keep and strengthen the card line.** Make it the first thing on the card, not a footer — `openRead`'s paragraph is currently *below the fold*; I measured the sheet: `sheetH 636`, `sheetScrollH 1332`, and the "About routes" paragraph's top sits at **y ≈ 1053** inside the sheet, i.e. 417 px below the visible bottom. On the card, put the deny sentence *above* the glossary definition.
- **Add one genuinely first-appearance treatment on the body, and only one.** The direction's own `ACTH · schematic route` first-appearance rule is unbuilt; build it. Three routes already carry it in scene data; make the *renderer* honour it (first render of a route in a session ⇒ `· schematic route`, after that ⇒ the short name) instead of stripping it. This is pre-training done the way the direction specified it, and it is what the plan's change destroys.
- **If task 6 still fails after that**, the honest answer is not more words on the stage — it is the `Read the route` sheet's fold (the paragraph is 1053 px down a 636 px viewport) and the fact that `#gRoutes .rhit` cards are not discoverable. Fix *reachability*, which the plan itself names as the risk ("no requirement to know that `Read the route` exists") — the fix for reachability is not a prefix on every label.

---

## 4. R4-4's carrier hint

**The idea is right; the timing and the placement are wrong, and there is a real guardrail risk the plan half-notices.**

### What the plan does

`HS.carrierHint(id)` returns `{text, drawId}` for the *last* route that entered state `on`, latched in a `Set` on `HS.ov`, cleared in `HS.buildRoutes`, rendered as a persistent label only when `HS.level() !== 'body'`, once per carrier per pathway, five sentences: `smooth line = carried in the blood` / `beaded line = a nerve or light signal` / `short dashes = a portal hop` / `wide dashes = acts back`.

### Does it teach the grammar or label one line?

**It labels one line.** The plan's own framing gives it away: it fires for *the last route that entered state `on`*. At that moment the learner is looking at one line. The hint says "this line you are looking at is smooth, and smooth means blood." That is a **paired-associate** — one line, one word — not a grammar. A grammar is learned when the learner can *apply* the rule to a line they have not yet been told about. Nothing in R4-4 asks the learner to do that.

The route card already proves the better shape exists in this codebase: it shows **the texture and the word together, side by side** (`swatch` + `carrLbl`, `ui.js:26–28`). That is a two-element discrimination the learner can use. R4-4's hint is a one-element assertion.

### Is it at the right moment?

No. The plan places it at `HS.level() !== 'body'` because body level is at the 8-label ceiling — a *layout* reason, not a *learning* reason. That is the wrong constraint driving the design. The moment task 6 asks about is: **the learner is looking at a line and wondering what it is.** That moment is the route card, and in second place the `?`/hover. A one-shot hint at organ level fires while the learner is zooming toward an organ, i.e. while attention is on the organ, not on the lines.

**Better moment:** attach the hint to the *route-card open* for the **first carrier of each kind the learner encounters**, as a second line under the swatch, and — this is the part that makes it a grammar — on the *second and later* appearances of that carrier, ask rather than tell: swap the hint for the card's existing `carrLbl` phrase only, so the learner has to produce the mapping. That is retrieval practice of the grammar rather than a second reading of it.

**Better placement for an on-body version, if one is kept:** put it on the **legend**, not on a line. The plan's §6 excludes wiring `HS.grammarLegend()` to `#lvlChip` for good reasons ("the depth chip is a depth indicator and giving it a second job is the sort of scope creep this round should refuse") — but it then declines to find *any* on-body home for the legend and relies on a per-line hint instead. The legend already renders the four textures and the three end glyphs side by side (`overlay.js:14–24`) and is currently buried at the bottom of `openRead` (same 1053 px problem). A **one-time, dismissible legend appearance at first pathway entry** — the ground already has a "one tip per zoom level" mechanism (`HS.tip`, `ui.js:49`) that is one-shot, dismissible, remembered in `tipsSeen`, and switchable in Settings — reaches the same learner at zero new surface cost, teaches the whole grammar at once, and does not require inventing a latch. **The plan reinvents a latch for a hint when `HS.tip` already is one.**

### Guardrail risk: does texture imply amount?

The plan flags the risk and then under-tests it. Its mitigation is "the hint *describes a texture*, and the texture is fixed in `TEXTURE` and never varies with anything — restate that in the code comment" plus a quality-bar assertion that `stroke-dasharray` is byte-identical across pathways. That assertion is necessary but **not sufficient**, because the §5.4 risk is not "does the texture vary" — it is **"does a learner read the texture as a magnitude."** A beaded line reads as *more* than a smooth line to a naive eye: more marks, more ink. The current build has an accidental protection the plan should keep rather than erode: today the learner meets textures only after opening `Read the route` *and* scrolling to the legend, i.e. with the labels attached. R4-4 unlabels-with-a-caption at organ level, which is closer to "here are four line weights."

The plan's own best mitigation is one it half-dismisses. It says "keep `HS.grammarLegend()` as is" and separately worries about bead spacing going dynamic. The genuinely protective move: make the hint's wording **carrier-shaped, not amount-shaped**, and never use a comparative. `carried in the blood` ✓. `a nerve or light signal` ✓. `acts back` — careful: `acts back` is about *direction/sign*, already the end glyph's job, so the wide-dash hint duplicates the grammar rather than extending it. `short dashes = a portal hop` is the weakest of the four, because "short" is exactly the word that reads as magnitude. Prefer the direction's own phrase from `HOW` (`ui.js:22`): "Carried a short way in portal blood, straight to the next gland" — no size word at all.

**Concrete alternative I would ship for R4-4:** delete `HS.carrierHint` and its latch; wire `HS.grammarLegend()` into a one-shot `HS.tip` at first pathway entry (existing mechanism, existing dismissal, existing Settings switch, existing reduced-motion story); strengthen the route card's existing swatch line so the texture and its name are always adjacent; and add exactly one quality-bar assertion — that no carrier-hint or legend string contains a comparative or magnitude word (`more`, `stronger`, `bigger`, `higher`, `faster`). That delivers the grammar, at the moment the learner is asking, without inventing per-line captions or claiming a byte-equality check proves a learner did not infer amount.

---

## 5. R4-5 — is ungraded self-explanation being used well?

**Yes on the main move, mixed on (a) and (b), clean on (c).**

### (a) Does on-demand access weaken the retrieval benefit?

**Not inherently, and the plan gets the important part right — but it takes the wrong piece of the mechanism apart.**

The evidence-based shape of self-explanation is: **prompt at a moment of comprehension, before the answer is available, and require an attempt.** The plan's three changes are (i) make it reachable on demand via the explored chip, (ii) add a second manual entry point, (iii) reframe the model as "how we'd put it". Item (i) is right. Item (iii) is right. The risk sits in a fourth thing the plan does quietly: **removing the `reflectSeen` guard for the manual path.**

Today `openReflect` (`engine.js:230`) early-returns on `E.tryMode`, `E.whatIf`, `E.cellOpen`, Rebuild and Compare — and separately `afterPlay` (`225`) guards `!reflectSeen.has(key())`. The plan says: "Remove the `E.tryMode`/`E.whatIf`/`E.cellOpen` early-return *only* for the manual entry point; add `HS.openReflectNow = () => openReflect(true)` with a `force` flag that skips the `reflectSeen` guard."

Skipping `reflectSeen` is where the retrieval benefit leaks. `reflectSeen` is not a gamification counter — it is the difference between *prompted* self-explanation and *available* self-explanation. Its semantics today are "the automatic prompt fired once." After the plan, `HS.openReflectNow()` can be called any number of times, which is fine for a learner who genuinely wants to re-articulate — but it also means the card becomes a **repetition surface**, and repetition of a self-explanation with the model answer one click away is the weakest form of it. The card is built to be re-opened cheaply: `#reflShow` is a reveal button and `minimal` — measured card text, `Say it back | Why does the stress response eventually settle itself? | Put it in your own words — just for you, nothing is scored. | Close | Show how we'd put it`.

The concrete fix costs almost nothing and preserves both goals:

- **Keep `reflectSeen` as the automatic-path guard** (the plan does this — good).
- **Give the manual path its own first-attempt semantics**: the *first* manual open of a pathway's reflect card behaves exactly as today (textarea focused, model hidden); **subsequent manual opens within the same session open with the model already visible** and the prompt reworded as `Here's how we put it. Say it back differently, or close.` That converts the second visit from "retrieval with a spoiler button" into "comparison," which is honest, keeps the retrieval benefit on the visit that matters, and needs no counter, no score and no record — it is a UI-mode distinction, not a progress measurement.
- **Do not** add "attempts" of any kind. The plan fences `HS.recordAttempt` correctly (§R4-5 guardrails; today `recordAttempt` is called only from `checkTry` at `engine.js:306`, and the wrapper assertion the plan proposes in §3 is a good test).

One more thing the plan should not lose: today the automatic path fires 900 ms after `afterPlay` **only when the gate is already revealed** (`!p.gate||isRevealed()`, `225`). For the HPA axis that is exactly the right sequencing — you cannot explain negative feedback before you've met the brake — and the plan keeps it. Good. But the plan's manual entry point ("Route explored · say it back" on the chip) is available *at the same condition* (`done` requires `isRevealed()` for gated pathways, `engine.js:152`), so the manual path does not open a loophole where a learner can be asked about feedback before seeing it. Verified: `renderDots` sets `done = v.size===p.hots.length && (!p.gate||isRevealed())`. Keep that.

### (b) Does the "Watch it all" cue displace the existing fast→slow guidance?

**This is the plan's clearest pedagogical mistake, and it is a straight trade of a *sequence* cue for a *contrast* cue that the tool cannot actually deliver as a contrast.**

The plan deletes the current fast-route after-play tip — measured today as:

> `That was the fast route, within seconds. Now follow the slow route: choose Slow.`

— and replaces it with:

> `Fast route done, within seconds. Press ▶ Watch it all to see the slow route arrive while this one fades.`

Two problems.

**First, task 8 is "explain the difference between Fast and Slow."** The current tip is a *sequencing instruction*: it tells the learner which button moves them forward, at the exact moment they have just finished the fast route and have no idea what to do next. Removing it removes the thing that gets a learner from route A to route B at all. That is a **wayfinding** loss traded for a **framing** gain. The direction's §3 is explicit that the hand-off is a designed beat ("The **pathway bar** appears (§4.2) with **Fast | Slow**, and a tip suggests: 'Now follow the slow route: press ▶'") — the plan is deleting a §3 requirement to make room for a task-8 cue.

**Second, "Watch it all" does not show a contrast; it shows two sequences back to back.** Read `playAll` (`engine.js:250–265`): it iterates `S.toggle.options`, calls `enterPathway(opt[0],false)`, plays, sleeps 750 ms, and repeats. Between the two, `enterPathway` **hides the previous pathway's routes** (`179`: `else HS.setRoute(id,'faint')`) and rebuilds the ribbon when the pathway carries its own (`170`). So the learner sees: fast route plays, everything resets, slow route plays. The plan's own copy claims "see the slow route arrive **while this one fades**" — that is not what the code does, and it is the one thing that would make the timescale difference perceptible. Claiming simultaneity the build does not produce is a *new* honesty problem created by this item (see §7's cross-reference — this sentence is not currently on the plan's review list either, because it is UI copy rather than science copy, but it is a factual claim about what the screen does).

**Concrete alternative.** Keep the sequencing cue and *append* the contrast cue, and put the contrast on the shared ribbon rather than on a re-play:

- Fast after-play tip → `That was the fast route, within seconds. Now follow the slow route: choose Slow — or press ▶ Watch it all to see both across the ribbon.` This keeps the §3 beat, adds the task-8 route, and is one sentence longer.
- Fix the honest copy in `playAll`: either make the claim true (keep A's routes drawn faintly while B plays, which `enterPathway` already supports — the `faint` state exists and is exactly what the direction's §3 step 3 does at trigger time: "Every other pathway of the state is drawn as a faint route"), or say what actually happens (`see the slow route arrive after it`). **Making it true is the better move and is nearly free** — it is the same visual device the trigger already uses, and it is the only way the learner ever *sees* both timescales at once. That, not the label, is what answers task 8.
- The strongest task-8 support in the whole build is the **shared ribbon**: `stress.time` runs `now → seconds → minutes → hours → calm again` (`stress.js:74–80`) and `playAll` walks one route after another across it. The plan should name the ribbon in the tip and in the reflect model, because the ribbon *is* the fast/slow contrast made visible, and it is already built.

### (c) Anything sliding toward assessment or gamification?

**No — and the plan's fence is unusually careful.** Specifically good: `HS.recordAttempt` is explicitly not to be called (and the plan commits a *test* for that rather than a promise, §3 R4-5(d)); `reflectSeen` gating means the chip reverts to a plain `span` once said back (I measured it today as `tag: SPAN`, `chip: "Route explored"`, `chipClass: "chip done"`); the model is framed as *how we'd put it*; the plan adds one clarifying line to the card and — this is the important one — **explicitly refuses** round-3 Theme F's guided recall variant and its quiet body map, with a reason ("the single idea most likely to read as a completion reward"). That refusal is correct and should be defended, not revisited.

One residual: `Route explored · say it back` on a chip that currently has `class="chip done"` uses the word *done*. `done` is already completion-flavoured, and the direction §4.3 says "When every hotspot is visited and gated segments are revealed, the pathway bar shows 'Route explored' and offers *What if?* and the other route. **There is no celebration, score or badge.**" Appending an action to the `done` chip moves it one step toward a "you finished — now do the next thing" state. Cheap mitigation: give the button its own neutral styling rather than inheriting `.chip.done`, and phrase it as a question in the learner's voice (`Say it back?`) rather than an imperative milestone. Not a blocker; worth one line in the plan.

---

## 6. R4-6 — the overview sheets for systems that are not built

**The honest diagnosis; a wrong first fix; one part that teaches a false equivalence.**

### The honesty/expectation problem

The plan is right that five tree rows dead-end on the **first screen of the product**. Confirmed in the tree: `HS.TREE` (`ui.js:127–138`) has childless systems `thyroid`, `dopa` and non-pathway systems `stress`/`glucoseSys`/`rhythm` that toast `<system> is not part of this concept. It uses the same scene template.` The current rows also literally render `· not in this concept` inline (`ui.js:147`: `${has?'':' <small>· not in this concept</small>'}`), so the state is at least labelled before the click. That is already more honest than the plan gives it credit for.

**Does opening a sheet and reading "not built" help or damage trust?** It depends entirely on the *order of the reveal*, and the plan's field order gets it wrong. The plan's `overview` shape is `{ q, map, signals, limits, start }` with `limits:'Not built in this prototype — the thyroid axis is out of scope for these three scenes.'` If the question and a generated map come first and the limit comes fourth, the learner invests in reading a pathway that is then withdrawn. That is worse than the toast, because the toast costs nothing and the sheet costs attention.

**The treatment I would ship:** put the limit **first and unmissably** — not as a field, as the sheet's `.sub` line, the same slot every sheet in this build already uses for `illustrative draft, not reviewed science` (`openRead` `ui.js:246`; passports and More do the same). So: `Thyroid · not built in this prototype` in the sheet's existing "this is a draft / scope" slot, then *one* sentence on what the system is for, then a single primary action. That is the honest version: the learner learns the app's scope in the app's own established scope-voice, and nothing is teased.

**A second, stronger option the plan does not consider:** the tree row itself should say so *before* the click, and the plan should not spend a sheet on this at all. The row currently says `· not in this concept`, which is jargon. Change it to `· not built yet` and keep the toast, upgraded to name where the nearest built thing is. That is an S-effort, zero-new-surface fix that removes the dead end (the learner is told *before* clicking) and adds no surface that can over-promise. The plan's own §8.2 argues R4-6 is about "the first screen of the product containing a control that dead-ends" — a row that labels itself is a *better* answer to that than a sheet that has to be opened to find out.

### Does `start:{scene,path}` teach a false equivalence?

**Yes, as specified.** The plan sends `thyroid → start:{scene:'stress',path:'slow'}` with the justification "(the HPA axis is the nearest built thing)" and `dopa → start:{scene:'stress',path:'fast'}`. A learner who clicks **Thyroid** and is delivered into **the HPA axis** has been taught, by the interface, that the thyroid axis is the HPA axis — or at least that the app considers them interchangeable. That is a *false equivalence about physiology*, produced by a navigation affordance, in a product whose central honesty claim is that it does not assert unestablished relationships. It is exactly the class of error the plan spends §5 guarding against, and it slips in through a `[data-go]` button.

Note that the plan's §3 acceptance check would not catch this: it asserts "click the first `[data-go]` and assert a pathway opens (`HS.E.route !== null`)". A false equivalence passes that test.

**Recommendation — ship this:**

1. **Do not open a sheet for `thyroid` or `dopa`.** They have no content; a sheet is a promise. Keep them as dead-end-preventing *labels*: rename the row suffix to `· not built yet`, and change the toast to name what *is* adjacent, if anything honestly is: thyroid → `Not built yet. The stress and blood-glucose scenes use the same kind of axis.` — no `[data-go]`, no equivalence implied.
2. **If a sheet is genuinely wanted, it must not carry a pathway button.** A scope note with no action is honest; a scope note with "go to the HPA axis" is an inference. If the plan keeps the sheet, the only permissible action is a **non-equivalent one**: a `[data-go]` to `HS.openConnMap()` (the shipped "How these connect" map, `ui.js:103`), which shows what the app *does* cover without mapping a built pathway onto an unbuilt question.
3. **`glucoseSys` is the one legitimate case and the plan should treat it separately.** It *has* children (`betweenP`, `afterP`), so it is an *aggregate*, not a dead end — clicking it should expand it, which it already does (`ui.js:174`). §2.3's "Pathway overview" is satisfied for it by the two pathway rows already inside it. The plan's "already has children, so it gets `q`/`map`/`limits` only" gives it a sheet with no `start`, i.e. a sheet that is pure description — which is the *only* one of the three that could honestly ship as a sheet. Invert the priority: build the sheet for `glucoseSys` first, and leave `thyroid`/`dopa` as honest labels.

Also worth stating plainly: the direction's §2.3 five fields (`Question · Map · Key signals · Context and limits · Start`) were written for a system that *has* a lesson. Applying them to a system with no lesson is what creates the false-equivalence pressure in the first place. The plan should say that out loud rather than bending §2.3.

---

## 7. The science / honesty fence

### Does the plan actually list the new prose for review in the same commit?

**Yes, on paper, and comprehensively.** §5 ("Honest science is not weakened") says all five new string categories — gates' `unrevealed`, the route-card deny line, the carrier hints, the two `reflect` model additions, the three pathway overviews — go into `docs/v4-prototype-review.md`'s scientific review list **in the same commit**, and §7's per-commit table repeats it for R4-2/R4-3/R4-4/R4-5/R4-6. That is the right rule and it is applied consistently.

**Two gaps.**

**(i) The list is missing the two things that make the most substantive claims.** The plan catches the `reflect` model lines — good, and its reasoning is right ("they make a *claim about the contrast*, which needs review like any other claim"). But two new sentences assert screen behaviour rather than physiology and would therefore be treated as UI copy and skipped by a scientific reviewer:

- `Fast route done, within seconds. Press ▶ Watch it all to see the slow route arrive while this one fades.` — as shown in §5(b), this describes simultaneity the build does not produce (`playAll` fades route A on `enterPathway`). It must either be made true or reworded, and either way it belongs on **some** review list, because a learner reads it as a claim about what the body does.
- `There is no score and no wrong answer — compare with how we'd put it when you're ready.` This one is fine *and* is the load-bearing sentence that keeps R4-5 out of gamification territory. It should be listed so it is not silently softened later.

**(ii) The plan's own `gate.unrevealed` string is listed for review, which is arguably over-application.** "Not revealed yet · tap ? to try it" contains no physiology. Listing it is harmless, but it dilutes a review list whose value depends on every entry being a claim someone must actually adjudicate.

### Is `its brake is what turns it down` established, and is it correct?

This is the plan's most substantive new scientific claim, and it is **correct at textbook level, already established on screen — but the sentence as drafted has a precision problem.**

The plan appends to the stress **fast** pathway's `reflect` model: `The slow route takes over minutes and lasts hours, and its brake is what turns it down.`

- **Is it taught?** Yes, thoroughly. `stress.js:42` `slow.reflect.q` is `'Why does the stress response eventually settle itself?'` with model `'Cortisol acts back on the pituitary and the hypothalamus to slow its own release — negative feedback — so the response winds down instead of running away.'` The gate's Try it? asks `'Where does the stress hormone act back to calm the response?'`, `correct:'Cortisol acts back on the pituitary and the hypothalamus. This is negative feedback.'`, `why:'Acting at the top of a chain turns down every later step at once.'` (`stress.js:50–53`). The ribbon's `hours` and `calm again` beats say the same (`stress.js:78–79`). The cell inset's step 3 is GR/GREs switching genes. So the concept is stated at least five times.
- **Is it correct?** Yes at textbook level: cortisol exerts negative feedback on the hypothalamus (CRH) and anterior pituitary (ACTH/corticotrophs), and that is the principal brake on the HPA axis. The direction's §4.4 step 13 states it identically ("Cortisol ⊣ anterior pituitary and hypothalamus (negative feedback)"), and it is already on `v4-prototype-review.md`'s Stress claims list ("cortisol acts on the hypothalamus and anterior pituitary (both)"). No new review burden is created; only a new *sentence*.
- **The precision problem.** "its brake is what turns it down" attaches a *possessive* to the fast route's referent in a sentence whose subject is the slow route. The fast route's `reflect` model is about adrenaline, which is *not* turned down by cortisol's brake — adrenaline is cleared (`compare.off:'Adrenaline is cleared within minutes'`, `stress.js:21`). A learner reading the fast route's model can take "its brake" to mean *the fast route's brake*, which is to say that cortisol turns adrenaline down. That is **wrong**, and the reviewer's note in `v4-prototype-review.md` does not currently cover a conflation of the two clearance mechanisms — it covers each separately. The sentence must make the referent explicit: `The slow route takes over minutes and lasts hours, and cortisol's brake on the brain is what turns that slow response down.` The plan's own §R4-5 says "No new numbers — `minutes` and `hours` are the ribbon's own words" — good, and that constraint is honoured.

### Does the plan honour the other fences?

**No numbers/doses/diseases/treatments:** yes. Every new string audited above is numberless. `minutes`/`hours` are the ribbon's own words (`stress.js:77–78`), already on screen. No dose, no disease, no drug.

**Time only in words:** yes, though R4-5's tip (`within seconds`, `Watch it all`) sits right on the line — `within seconds` is the existing `fast.chip` (`stress.js:19`, `compare.time:'Within seconds'`), so it is reused, not invented. Fine.

**Quantity never encoded by brightness/speed/size/count:** mostly yes, with two honest caveats the plan should record rather than assert away:

- R4-1's `.first` accent: a left border on a list row. The plan is careful ("**Not** an animation, **not** a badge, **no count**") and I agree it carries no magnitude — but it *is* a salience accent, and the plan's argument that it lives in the panel so "it cannot compete with routes or hotspots for attention on the stage" is the right argument. Keep it.
- R4-2's ghost at `.62`: the plan rightly refuses to change it ("`.62` opacity is *correct* — it is the invitation"), and adds "Restate in the code comment that ghost opacity is a **state**, not a magnitude." That is a comment defending a decision, not a test. If the round wants this to be a *guardrail* rather than a *note*, it needs a check that no route's opacity varies with anything except `rstate` — which is structurally true today (`overlay.js:44` maps a literal string to a constant) and would be a trivially cheap assertion.
- **R4-4's textures are the one real exposure**, and §4 above covers it: the plan's `stroke-dasharray` byte-equality check proves the texture does not *encode* amount; it does not prove a learner does not *infer* it. That gap should be written down as a stated non-proxy, in the same voice the plan uses for its four honest non-proxies in §3. As written, §5 lists it as if the assertion closed it.

**`content/reviews/approvals.tsv` stays empty / no fabricated citations:** yes, and correctly reasoned (`scripts/check-no-fabrication.ts` only guards `content/`, so the rule is applied by hand). The banner and `.sub` lines are explicitly untouched. Good.

**One more fence the plan honours well and should be credited for:** §3's "Where no proxy is possible, stated plainly" is honest, unusually so, and its four items are the *correct* four. A round that claims 24/24 while writing down that none of those 24 checks establishes belief is doing the right thing.

---

## 8. What the plan gets pedagogically RIGHT

Do not change these.

1. **The core diagnosis: "an answer existing" vs "an answer being where the learner is looking."** §1's framing is the correct theory of this build's actual failure. Both measured failures (`comp-baseline.json` task 5 and task 6) are *placement* failures, and the plan says so rather than inventing new content. On a mature prototype this is exactly the right instinct — resist adding surfaces, fix the seam.

2. **Refusing to fix the ghost by brightening or dimming it.** §R4-2's "**Why not just brighten/dim.** … `.62` opacity is *correct* — it is the invitation. The defect is that the brightest mark on screen is also the least explained." This is the plan's single best paragraph. It correctly separates *salience* (working) from *comprehension* (broken) instead of trading one for the other.

3. **R4-5's fence, and specifically the refusal of round-3 Theme F's guided recall and quiet body map.** §6's exclusion table gives the right reason ("the single idea most likely to read as a completion reward") and the right substitute. Self-explanation is better-evidenced than a step-ordering exercise, does not duplicate `rebuild.js`'s state machine, and does not teach a second mode. Refusing extra assessment surface in a round about comprehension is disciplined.

4. **Making the "Route explored" chip a button instead of adding a control.** §R4-5: "It is the existing 'explored' moment, given one action. No new control, no new surface." This is the same principle as point 1 applied one level down, and it is why R4-5 is the highest-value item.

5. **Running the quality bar after each of R4-2/R4-3/R4-4 with a fixed remedy ("drop a hotspot label at body level, **not** raise the cap").** §5's ordering rule protects the §2.5 8-label ceiling as a real constraint rather than a target to negotiate, and it pre-commits to the *learning-preserving* remedy. Good.

6. **§8's "two red, two hollow" correction to the brief, and its willingness to hand back two weaker audit checks.** Naming that `route marks have luminance spread ≥ 30` and `reduced motion: next step advances one step` (`after >= before`, which cannot fail) are weaker than their names is exactly the honesty this project keeps insisting on. It is also the reason a reader should trust the plan's other claims.

7. **Deciding against wiring the legend to `#lvlChip`.** §R4-4's explicit "**Do not**: the depth chip is a depth indicator and giving it a second job is the sort of scope creep this round should refuse." The refusal is right even though I'd route the legend through `HS.tip` instead (§4 above). The chip has one job; keep it.

8. **The reduced-motion and keyboard work being per-item and specific**, including the correct observation that `.rm`'s animation kill is an explicit selector list, not a global, so any new keyframed element must be added by hand — plus a quality-bar assertion that catches omissions. §4's table is the best-engineered part of the plan.

---

## 9. Ranked changes I would make to the plan

Most important first. Each is one actionable change.

1. **Cut the `schematic` prefix from R4-3 entirely** (drop `HS.routeWord`, leave `routeText` and the three scene labels alone, do not touch `engine.js:115–116`) and ship only the route-card deny line plus the direction's own `ACTH · schematic route` **first-appearance** treatment — which is pre-training done once, as §5.3/§7 already specify, instead of wallpaper repeated six times on the most expensive real estate in the product.
2. **Make the ghost's *shape* carry "not revealed" and demote the label:** split the ghost path at the badge so the line terminates into the `?`, draw a blunt unfinished end cap where every other route type has an end glyph (§5.3 gives the ghost none — make that asymmetry loud), and shorten the always-on label to a question in the learner's voice anchored at the unfinished end (`What acts back here?` with `Try it?`), folding the `tap ?` instruction into a one-time first-pathway appearance only.
3. **Restore the fast→slow sequencing tip and append the contrast cue instead of replacing it** — `That was the fast route, within seconds. Now follow the slow route: choose Slow — or press ▶ Watch it all to see both across the ribbon.` — because task 8 needs *both* routes traversed, and the current tip is what gets the learner from A to B.
4. **Make `playAll` honest before cueing it:** keep route A drawn faint while route B plays (the `faint` state already exists and is what the direction's §3 step 3 does at trigger time), so "see the slow route arrive while this one fades" becomes true and the learner actually *sees* two timescales at once — otherwise reword the tip to what the code does.
5. **Drop R4-6's sheets for `thyroid` and `dopa` and remove their `[data-go]` pathway buttons** — send nothing, or at most link `HS.openConnMap()`; rename the tree row suffix to `· not built yet` and keep an upgraded toast, because a `start:{scene:'stress',path:'slow'}` on a Thyroid row teaches that the thyroid axis *is* the HPA axis.
6. **Replace R4-4's per-line `carrierHint` latch with a one-shot `HS.tip` rendering `HS.grammarLegend()` at first pathway entry**, keeping the existing one-shot/dismissible/Settings-switchable mechanism and adding a quality-bar assertion that no carrier string contains a comparative or magnitude word — and drop `short dashes = a portal hop` in favour of `HOW`'s existing "carried a short way in portal blood".
7. **Give the manual reflect path its own first-visit semantics rather than skipping `reflectSeen` wholesale:** first manual open behaves as today (model hidden), later opens in the same session open with the model visible and the prompt recast as comparison — preserving retrieval on the visit that matters without adding any counter.
8. **Fix the two new `reflect` model lines and the tip's claim so their referents are explicit and true:** `its brake` must become `cortisol's brake on the brain … that slow response` (adrenaline is *cleared*, `stress.js:21` — the possessive, not the physiology, is the error), and add both the `Watch it all` tip sentence and the `no score and no wrong answer` sentence to the prototype-review list alongside the five categories already listed.
9. **Put R4-6's `limits` field first, in the sheet's existing `.sub` scope line** (`Thyroid · not built in this prototype`), if any sheet survives at all, and build the genuinely honest one — `glucoseSys`, which has children — before either of the two empty systems.
10. **Add one sentence to §3's non-proxy list stating that the `stroke-dasharray` byte-equality check proves the texture is fixed but not that a learner reads it as a carrier rather than an amount**, so the §5.4 guardrail claim is written at the same honest strength as the plan's other four non-proxies.
