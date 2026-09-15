# v4 round 4 — interaction / interactivity review

Reviewer scope: interaction and interactivity only (dead ends, broken state, confusing affordances,
keyboard/pointer regressions, motion without a reduced-motion twin). Nothing was implemented.

Evidence base: `docs/v4-round4-plan.md` (339 lines, cited by line number), `docs/relay-design-direction.md` §4/§10,
and the live prototype at `http://localhost:8765/v4/` driven with Playwright at 1440 × 900
(clean `localStorage`, `HS.tipsOn=false` where the layout rather than the tip was under test).
Every claim marked **[measured]** below was observed in the running build this session, not inferred.
Temp probe scripts were deleted; working tree otherwise untouched.

---

## 1. Verdict

**Yes-with-changes — two items must be repaired before they are built as written (R4-2 and R4-3),
and one must be redesigned (R4-5's chip), but the round as a whole is safe and worth building.**

The plan's interaction instincts are unusually good: it refuses permanent chrome (R4-4), refuses
gamification three separate ways (§5), refuses to touch layout that is already green (§6), and it
correctly identifies that the ghost line's problem is *explanation*, not salience (line 75) and that
the trigger rows need an *outcome*, not a badge (line 45). R4-1, R4-6 and R4-7 are safe as written.
The two hard blockers are both cases where the plan asserts a code path behaves in a way it
provably does not: R4-2's gate is on `HS.level() === 'body'` and `dark:night` opens at `organ`
**[measured]**, so the label silently never appears in one of the four pathways the plan requires it
in; and R4-2's "no double-label" claim is false — hovering the ghost renders *both* strings at once
**[measured, 9 labels]**. R4-3's `HS.routeWord` helper prefixes feedback routes that the plan's own
prose says must be left alone **[measured]**. R4-5's chip-as-button is the one place where the plan
picks a control that `renderDots` destroys on every step **[measured]**; the fix is one line, but the
plan as written specifies the broken shape.

---

## 2. State-machine risk

### 2.1 R4-5's `force` flag does **not** break the `reflectSeen` contract — but the plan describes the change in a way that would.

The contract today, read from `engine.js`:

```js
// line 225, inside afterPlay()
if(p&&p.reflect&&!reflectSeen.has(key())&&!E.playingAll&&(!p.gate||isRevealed())){
  reflectSeen.add(key()); setTimeout(openReflect,900);
}
// line 228
const reflectSeen=new Set();
// line 229
function openReflect(){
  const p=P(); if(!p||!p.reflect||E.reflectOpen||E.tryMode||E.whatIf||E.cellOpen||…) return;
```

`reflectSeen` is a **send-once latch on the automatic path**; `openReflect` itself has no
`reflectSeen` check at all. The plan's line 147 says the `force` flag "skips the `reflectSeen`
guard (line 225 already guards the automatic path)" — that is a misreading of which function owns
the guard. `openReflect` cannot skip a guard it does not have. **Nothing in `openReflect` needs to
change to make it manually callable** — it is already `HS.openReflect` (line 245) and I called it
directly and got a card **[measured: `HS.openReflect()` → `#reflCard` present]**.

So the "fire once" guarantee in the plan's §3 ("call `afterPlay` twice, assert one card") is
**safe**, because:
- `reflectSeen.add(key())` happens *before* the 900 ms `setTimeout` (line 225), so a second
  `afterPlay` within the window is already blocked;
- `E.reflectOpen` (line 230) blocks a second card while one is open;
- `key()` is `E.sceneId+':'+E.route`, so the latch is per scene+pathway, and neither `enterPathway`
  nor `leave` clears it **[measured: `reflectSeen` is not reachable from outside, and no call site
  deletes from it]**.

**The real defect the plan does not address:** if `force` is implemented as *removing* the
`E.tryMode`/`E.whatIf`/`E.cellOpen` early-return from the manual path (line 147), then
`openReflect` can open on top of an open Try it? card and an open What if? card. Those cards are
appended to `app` and `#reflCard` is also `position:absolute; right:16px; top:96px` (line 233) —
**identical coordinates to `#tryCard` (line 275) and `#wiCard` (line 374)**. Opening the reflect
card during Try it? would stack two dialogs at the same pixel position, and `HS.closeCards()` is
called at line 231 but `closeTry`/`restoreWhatIf` are not. My probe showed `openReflect` currently
returns early in all three cases; the plan removes exactly that protection.

> **Better decision.** Leave `openReflect`'s early-return list **entirely alone**. Add the manual
> entry as `HS.openReflectNow = openReflect` (an alias — no new flag), and give the *caller* the
> guard: the `Y` key handler and the chip both check `!HS.E.tryMode && !HS.E.whatIf && !HS.E.cellOpen`
> and, if one is open, close it first (`HS.closeTry()` / `HS.restoreWhatIf(false)` / `HS.closeCell()`)
> then call `openReflect`. That preserves the existing stacking invariant, needs no `force` flag at
> all, and makes the "fire once" test in §3 pass for the same reason it passes today.

### 2.2 Making the chip a `<button>` **does** change what `renderDots` rebuilds — the plan's chosen shape is the broken one.

`renderDots` (lines 147–155) writes `$('#timeChip').textContent = …` on **every** call, and
`renderDots` is called from `goHot` (line 193), `checkTry` (line 307) and `enterPathway` (line 182)
— i.e. **once per step, once per try answer, once per route switch**. I injected a `<button>` into
`#timeChip` and then called `enterPathway`: `afterContainsProbe: false` **[measured]** — the button
is destroyed. The chip is a bare `<span class="chip" id="timeChip">` **[measured]** with no
delegated click listener on `#pbar` (`hasClickListener: false` **[measured]**), so a button placed
inside it is not just re-rendered, it is thrown away and its handler with it.

Two follow-on effects the plan does not mention:

- **Focus destruction mid-playback.** A `<button>` inside a node whose `textContent` is overwritten
  is replaced on every step. If a keyboard user tabs to it and the pathway is playing, focus drops
  to `<body>` on the next step **[measured: focused node became `BODY/` after `goHot`]**. The plan's
  R4-5 keyboard story ("add `Y` … so the feature is not pointer-only") accidentally introduces a
  focus-loss path for pointer/keyboard users who *do* find the chip.
- **It breaks the `done` state's meaning.** `done` (line 152) is `v.size===p.hots.length&&(!p.gate||isRevealed())`
  — "Route explored". The plan gates the button on `!reflectSeen.has(key())`, which is a latch that
  is *set* on the automatic path at line 225. So a learner who plays to the end, gets the reflect
  card automatically, dismisses it, and returns to the pathway sees a **plain span** — the chip's
  affordance silently appears and disappears depending on whether a 900 ms timer already fired.
  The plan acknowledges the once-only rule (line 160) but frames it as a feature; interactively it
  is an **inconsistent affordance**, which is exactly the class of defect this round is supposed to
  be removing.

> **Better decision.** Do not put the control inside `#timeChip`. Keep the chip as the status
> indicator it is, and add a **sibling button in `#pbar`** rendered by `renderDots` *as part of its
> own innerHTML contract* — e.g. render `<button id="bSay" hidden>Say it back</button>` next to the
> chip and toggle `hidden` from `renderDots`. Because `renderDots` owns the markup, the button is
> stable in identity across steps (or, if it is re-created, it is re-created *with* correct
> `hidden` state and no lost handler). Gate it on `p.reflect && !E.playing && !E.tryMode && !E.whatIf`
> — a *state*, not a latch — so the affordance is predictable. `Y` remains the accelerator for it.
> This also removes the need for `renderDots` to know anything about `reflectSeen`.

### 2.3 R4-4's latch: the plan names **one** clear site; four are required.

The plan (line 123) says the `Set` is "cleared in `HS.buildRoutes` (line 30)". Tracing every path
that reaches `buildRoutes`:

| Path | Reaches `buildRoutes`? | Evidence |
|---|---|---|
| `#s=…&p=…` link restore | **Yes** | `restoreFromHash` → `openPathway` → `trigger` → `loadScene` → `buildRoutes` (line 25). Confirmed: restore of `#s=stress&p=slow&t=1&h=2` landed on `slow` with `revealed:false` **[measured]** |
| Scene switch (trigger row → different scene) | **Yes** | `loadScene` returns early only when `E.sceneId===id` (line 21); a different scene calls `buildRoutes` **[measured: latch mutated to `['blood']` survived the scene switch, because `buildRoutes` does not touch `HS.ov` today]** |
| **Rebuild** | **No** | `HS.buildRoutes` is called *only* from `loadScene` (grep: `engine.js:25`). `rebuild.js` does not call it |
| **Compare** | **No** | same — `compare.js` does not call `buildRoutes` |
| `enterPathway` within the same scene | **No** | confirmed by mutation test: latch survived `enterPathway('fast')` and `leave()` and a re-open **[measured]** |
| `leave()` | **No** | `leave` (lines 46–57) never calls `buildRoutes` |

So "cleared in `buildRoutes`" gives the plan the **link-restore** and **scene-switch** clears for
free, and **silently fails to clear on Rebuild and Compare** — both of which are surfaces that
redraw the stage and would show a stale or suppressed hint. The plan never names Rebuild or Compare.

Second, subtler problem the plan does not name: the latch is keyed "per carrier per pathway"
(line 123), but `buildRoutes` is **scene**-scoped, not pathway-scoped. Opening `stress:fast`,
then `stress:slow` (same scene → no `buildRoutes`) means the `blood` hint latched by `fast` is
already spent when `slow` shows a blood route. The plan's acceptance check (line 129: "in each of
the five pathways, exactly one `.lab.carrierhint` appears") **cannot pass under a `buildRoutes`-only
clear** — it would fail on `stress:slow`, `meal:after` and any other pathway that shares a carrier
with a previously opened pathway in the same scene.

> **Better decision.** Key the latch by `key()` (`sceneId:route`), not by carrier alone, and clear it
> in **five** places, named in the plan: `buildRoutes` (scene switch + link restore), `enterPathway`
> (per-pathway, line 167 where `E.route` is set), `HS.openRebuild` and `HS.openCompare` (or their
> close counterparts), and `leave` (line 49, beside `stopPlay()`). Then the acceptance check on line
> 129 is actually satisfiable. Add the `enterPathway` clear explicitly — it is the one the plan's own
> test needs and the one the plan does not have.

### 2.4 The autoplay / stale guard is **not** touched by this round, and that is correct.

`enterPathway`'s guard `if(autoplay&&E.route===r&&!(HS.RB&&HS.RB.active)) play();` (line 186) plus
`clickTrigger`'s `if(E.sceneId!==id||E.route) return;` (line 43) and `play()`'s
`(!p||(HS.RB&&HS.RB.active)||(HS.CMP&&HS.CMP.active))` (line 202) form a coherent three-deep guard.
R4-5's change to `afterPlay` (line 149, the after-play tip copy) sits *inside* `afterPlay`, which is
only reached at the end of `play()` (line 217) or the RM branch (line 205) — both already guarded.
**No new stale-autoplay surface.** One caution: the plan's line 149 rewrites `stress.js afterPlay.tip.text`
and mentions `meal.js` mirrors it; `afterPlay` also early-returns on `a.whenHidden&&isRevealed()`
(line 222), which is true for `stress:slow` — so the rewritten tip only ever appears on the *fast*
route, where there is no gate. That is consistent, but the plan should say so, because a reviewer
reading "the after-play tip points at the contrast" will expect it on both routes.

---

## 3. The ghost label vs. the `?` hotspot (R4-2)

### 3.1 The label never appears in `dark:night` — the plan's gate is on the wrong condition.

Plan line 70: *"When `HS.level() === 'body'` and the pathway has `p.gate` and `!HS.isRevealed()`…"*.
Measured level **immediately after `openPathway(scene,path,false)`** and after a plain trigger click:

```
stress:slow   level body   zoom 1.37   gate true   labels 7
stress:fast   level body   zoom 1.27   gate false  labels 4
meal:between  level body   zoom 1.27   gate true   labels 3
meal:after    level body   zoom 1.65   gate true   labels 5
dark:night    level ORGAN  zoom 2.75   gate true   labels 7   ← the label is gated out
clickTrigger('dark') → route night, level organ
```

`dark:night` is one of the **four** pathways the plan's §3 acceptance check names explicitly
(line 223: *"Repeat for `meal:between`, `meal:after`, `dark:night`"*). Under the stated condition the
new label is suppressed there, the check's first assertion (`a visible label matches
/not revealed|not shown yet|try it/i`) fails, and the round's headline "12/14 → 14/14" does not land.
I verified this by injecting the plan's exact item with a monkeypatched `HS.getLabels`: on `dark:night`
`ghostPresent: false` **[measured]**. The `?` hotspot *is* present at organ level (`hotspots: ['1','2','3','4','?']`
**[measured]**) — the line the label explains is on screen, the explanation is not.

> **Better decision.** Gate the label on the **gate's visibility**, not on the zoom level:
> `p.gate && !HS.isRevealed() && !E.tryMode && !E.whatIf` — with no `HS.level()` test at all. The
> `?` badge is rendered at every level (`getHotspots` line 134 has no level branch), so the label
> should be too. If the label is genuinely too heavy at `organ`/`structure`, the honest alternative
> is to shorten the string per level (`gate.unrevealed` as an object keyed by level, the way
> `gate.try.q` already is on line 270), not to drop the explanation in the one pathway whose ghost
> is the *only* thing on screen the learner can interact with.

### 3.2 "No double-label" is **false** — hover produces both strings, and it breaks the 8-label ceiling.

Plan line 223: *"Then hover the ghost route and assert the wording is still present (no double-label)."*
The hover path is unconditional (overlay.js line 151):

```js
if(hr){ const ghost=rstate[hr]==='ghost', r=ROUTES[hr];
  items.push({key:'hovroute',text:ghost?'Something acts back here · Try it?':…,cls:(ghost?'badge':'sig')+' hover',…}); }
```

There is no suppression when a label for the same route already exists — the only dedup in that loop
is `key`-based in `labEls`, and `'ghostword'` ≠ `'hovroute'`. I injected R4-2's item exactly as
specified (pushed *before* `getLabels()` items, `cls:'badge ghostword'`, `anchor:HS.ptOn(gate.at)`),
rendered, then moved the pointer along the `f1` stroke. Result **[measured]**:

```
no hover:  8 labels  … "Not revealed yet · tap ? to try it"
WITH hover: 9 labels … "Not revealed yet · tap ? to try it"
                    … "Something acts back here · Try it?"      ← both, same line, simultaneously
```

This is precisely the failure mode the plan's §5 forbids (line 276: *"`stress:slow` … R4-2's always-on
label takes them to 8 — the maximum"*) and line 83 (*"If the audit reports 9, cut a hotspot label"*).
The plan's own remedy is wrong here: 9 is not caused by a hotspot label, it is caused by R4-2's own
item coexisting with the hover item, so "cut a hotspot label" would remove an organ name and leave
the duplication.

### 3.3 The full traced sequence, and where it breaks.

| Step | What happens today | What R4-2 as written would do |
|---|---|---|
| Open `stress:slow` unrevealed | 7 labels, `?` in tab order, ghost at `.62` opacity | 8 labels — at the ceiling |
| **Hover the ghost** | hover label appears; 8 total **[measured]** | **9 labels, two labels naming the same line** — ceiling broken |
| **Focus `?` by keyboard** | `focus` handler sets `HS.ov.hoverHot` (overlay.js line 192), which fires the hotspot tip branch at line 152 — but `?` has `tip:null` when not in tryMode (line 134), so **no label**; the ghost line is not `hl`-highlighted from the `?` | same; but the new label is `aria-hidden` (plan line 248) so a keyboard user gets **no** on-screen connection between the label they can see and the control they focus |
| **Press `?`** | `Enter` on the focused `?` → `openTry` **[measured: `tryMode:true`, `#tryCard` present]** | label must disappear (`!E.tryMode`) — correct, and `HS.say` announces the gate |
| Answer → reveal | `checkTry` sets `revealed[key()]=true`, `renderDots()`, routes go `'on'` | label must disappear — correct |
| **Scrub ribbon back to `t=0`** | `minTime:1` clamps `t=0`→`1` (engine.js line 71 / line 171) **[measured: `HS.setTime(0)` → `tIdx:1`]**; `revealed` stays true, routes stay `'on'` | label stays away — **correct**, because the condition is `!isRevealed()`, not `E.tIdx`. This is the plan's strongest claim and it holds |

So: the reveal/scrub half of R4-2 is **right**; the hover half is **wrong**, and the level gate is
**wrong**.

> **Better decision (both).** (a) Suppress the hover item when the always-on item is already present:
> in `overlay.js` line 151, `if(hr && !items.some(i=>i.key==='ghostword')) {…}`. That makes
> "no double-label" true by construction instead of by assertion, and it keeps the 8-label ceiling.
> (b) If the hover string is the better one (it is shorter and action-shaped), consider making the
> always-on label the *only* string and deleting the hover variant rather than maintaining two.
> (c) For keyboard parity, do not `aria-hidden` the label *and* leave the `?` unexplained — either
> give the `?` hotspot a visible-label association (`aria-describedby` pointing at the span is not
> possible for an `aria-hidden` node; use `aria-label` already present plus leave the span
> `aria-hidden` — that is fine — but then **do not** claim keyboard parity in §4's table, which
> currently implies the label "changes nothing about focus").

---

## 4. Reduced motion (task 11)

### 4.1 The plan's description of `.rm` is **out of date and incomplete**.

Plan lines 243 and 252 describe `.rm` as `app.css` line 260 — an explicit selector list
(`.rm .beat,.rm .breathe,.rm .glyph,.rm .glow,.rm .wsh,.rm #insetRim{animation:none!important}`) plus
`.rm *{transition-duration:.12s!important}` at 262. Verified — but there are **five** `.rm` rules,
not two:

| Line | Rule |
|---|---|
| 260 | `.rm .beat,.rm .breathe,.rm .glyph,.rm .glow,.rm .wsh,.rm #insetRim{animation:none!important}` |
| 262 | `.rm *{transition-duration:.12s!important}` |
| 295 | `.rm .hs.cur::before{animation:none}` |
| 303 | `.rm .night,.rm .lid{transition:none}` |
| **386** | `.rm .lab,.rm .hs,.rm .org.arrive .halo,.rm.intro #world,.rm.intro .org{animation:none}` |
| **407** | `.rm .route.ghostin{animation:none}` |

Lines 386 and 407 were added by round 2's "feel" work and are **the ones that matter for this round**,
because R4-2 and R4-4 add `.lab` elements and R4-2/R4-3 interact with `.route.ghostin`. The plan's
standing rule (line 252) — *"any new keyframed element must be added to that selector list by hand"* —
points at the wrong list. `.lab` is already covered at 386; a new `.lab.carrierhint` or
`.lab.ghostword` **inherits that coverage automatically** (class-based selector, not id) **[measured:
`#labels .lab` under `.rm` → `animationName: 'none'`]**. So the plan's fear is misplaced for R4-2/R4-4
and its standing rule will send the next implementer to the wrong line.

### 4.2 The real reduced-motion gap in this round is `.card`, which already animates under `.rm`.

`.card` (app.css line 93) declares `animation: tipin .18s var(--ease)`, and it is **not** in any `.rm`
selector list. Measured under `HS.userRM=true`:

```
.card UNDER RM: { an: 'tipin', ad: '0.18s', td: '0.12s' }      ← still animates
.tip  non-RM:   { an: 'tipin', ad: '0.3s' }
.lab  under rm: { an: 'none' }        ← covered by line 386
.route under rm:{ an: 'none' }        ← covered by line 407
#sheet under rm:{ an: 'none', td: '0.12s' }   ← transition only, covered by line 262
.try textarea / #reflCard: { an: 'none', td: '0s' }  ← the plan's line 251 claim is CORRECT
#tryCard under rm: { an: 'none', td: '0.12s' }
```

The plan's §4 line 251 claim about `#reflCard` is **verified correct** — `.try` (line 103) declares no
`animation`, so the reflect card is genuinely motion-free and `class="try float"` (engine.js line 232)
inherits nothing. Good. And the plan's guard `animation:none` for `#reflCard` is harmless.

But **every item in this round that opens a `.card` gets a `tipin` slide-and-fade under reduced motion**:

- **R4-2** (line 72) adds a deny/blank-body line to `showRouteCard` → the route card animates.
- **R4-3** (line 100) adds a permanent footer to every route card → same.
- **R4-6** reuses `#sheet` for the overview, which is transition-only and fine — but if any overview
  content uses `showInfoCard`-style `.card`, it animates.

`.tip` also uses `tipin`, and the plan's R4-4 acceptance (`screenshot with the hint visible`) and
R4-5's after-play tip rewrite both route through `HS.tip`. Tips were already like this before round 4,
so it is pre-existing, but the round *increases* tip and card traffic.

### 4.3 `animationName === 'none'` does **not** catch a transition-based omission.

Plan line 253 proposes asserting `getComputedStyle(el).animationName === 'none'` under `.rm`. That is
the right assertion for a *keyframe* omission and the **wrong** one for a transition omission. Evidence
from the table above: `#sheet` under `.rm` reports `animationName: 'none'` while its real motion is
`transition: transform .32s, opacity .25s` (line 176) — the assertion passes on a node that is only
safe because of a *different* rule (line 262). Conversely `.card` reports `animationName: 'tipin'`
and the assertion catches it — but only if `.card` is on the probe list, which the plan does not say.

> **Better decision.** Add `.rm .card{animation:none}` (one selector, appended to line 386's list —
> not line 260's) in the R4-2 commit, and make R4-7's assertion **two-pronged**:
> `animationName === 'none'` **and** `parseFloat(transitionDuration) <= 0.12` for every new surface
> (`.lab.ghostword`, `.lab.carrierhint`, `.card`, `#sheet`), with the probe list enumerated in the
> plan rather than left to the implementer. Also correct §4's line 243/252 description to cite all
> four `.rm` blocks, so the "standing rule" points at 386/407 where new `.lab`/`.route` classes
> actually get their coverage.

---

## 5. Keyboard (task 10)

### 5.1 `Y` is free — verified, and the plan's placement is right.

`app.js`'s key handler (lines 20–58) binds, in the pathway scope (line 50): `Space`, `]`, `[`, `R`,
`T`, `W`, `F`, `G`. Anywhere scope (lines 42–49): `S`, `L`, `+`, `=`, `-`, `0`, `/`, `A`, `H`, `?`,
`Escape`, and `⌘K`/`Ctrl+K`. **`Y` is unbound.** The `KEYS` list (lines 76–77) has no `Y`. No conflict.

Two notes the plan should absorb:

- `?` is bound *anywhere* (line 25, `HS.toggleKeys()`) **before** the pathway branch, and it
  `preventDefault()`s. So the `?` **hotspot** cannot be activated by the `?` key — only by `Tab`/
  arrow-to-focus then `Enter` **[measured: focusing `?` and pressing `Enter` → `tryMode:true`]**. That
  is fine, but it means the new label's text "tap `?` to try it" is **literally false for keyboard
  users**: the key `?` opens the shortcut list. Under R4-2's own keyboard parity claim (line 248),
  the string should be pointer-neutral — "choose the `?` dot" or "open `?`" — since the plan is
  adding the string to scene data for all users.
- `if(tgt.closest('.row,.rb-handle')) return;` (line 41) short-circuits the *entire* letter-key block
  when focus is in the tree or on the ribbon handle. A `Y` binding placed after that line inherits the
  guard for free — correct.

### 5.2 `Y` inside the reflect `<textarea>` is **not** a new bug, and the plan is right not to guard it.

The handler already returns early (line 23): `if(tgt.closest('input,textarea')) return;`. I typed `y`
into a focused textarea and got `taVal:'y'`, `refl:false` **[measured]**. The reflect card's textarea
is `#reflText` (engine.js line 235) and it is focused on open (line 242). So typing "y" into a
self-explanation **cannot** re-trigger the card. **No guard needed; the plan's silence here is correct.
Do not add one** — adding an explicit guard would be noise, and worse, a guard placed inside the
pathway branch *after* line 23 could re-introduce the bug it is meant to prevent.

One genuine keyboard issue the plan misses: `openReflect` focuses `#reflText` (line 242), and
`closeReflect(true)` focuses `#bRead` (line 244) **[measured: `after: 'bRead'`]**. But when the card
was opened by the **new `Y` key** from anywhere, `#bRead` may not be where the user was — a keyboard
user who pressed `Y` while focused on a **hotspot button** gets their focus thrown to `#bRead` on
`Escape`. The plan's line 251 says "focus returns to `#bRead`, unchanged" without noting that the new
entry point changes what "return" should mean.

> **Better decision.** Have the new manual entry record `document.activeElement` and have
> `closeReflect(true)` restore *that* (falling back to `#bRead`), mirroring the `_ret` contract already
> used by `HS.toggleKeys` (app.js line 80) and `HS.openConnMap` (ui.js line 112). One line, and it
> makes `Y` a non-focus-destroying accelerator.

### 5.3 R4-6: `Enter` on a childless tree row works, but the plan's focus-return claim is only half true.

Today a childless `n.dot` row is `role="treeitem"` with **no `aria-expanded`** **[measured: `hasExpanded:false`
for `thyroid`, `dopa`]** and its click handler toasts (line 173). `Enter` on a focused `<button>` fires
`click`, so the handler runs **[measured: `Enter` on `thyroid` → toast present]**. Replacing the toast
with `HS.openOverview(id)` therefore works with **zero changes to the WAI-ARIA model** — the plan is
right (line 184).

Two things the plan must add:

- **Focus return.** The plan says "mirror `HS.openMore`'s `HS.sheetReturn` contract" (line 252).
  `openMore` does set `HS.sheetReturn` (verified: `openMoreHasSheetReturn: true`), but `HS.sheetReturn`
  is a **single shared slot** on `HS`, read by `closeRead`. `openRead` sets it to `$('#bRead')`
  (ui.js line 244) and `openPassport` sets it to a caller-supplied `ret` (advanced.js line 103). If a
  learner opens the tree overview, and *from inside it* clicks a `[data-go]` that lands on a pathway,
  then presses `R` for Read the route and `Escape`s, they will be returned to the **tree row** — which
  is arguably right — but if anything else opens a sheet in between, the slot is overwritten and the
  tree row loses its focus return. The plan asserts the contract exists but does not say the overview
  must **set** it. State it: `HS.openOverview` must do `HS.sheetReturn = theRow`.
- **`aria-expanded` on the overview-bearing rows.** Giving `thyroid`/`dopa` an `overview` object does
  not give them children, so `aria-expanded` stays absent — correct, since ARIA forbids `aria-expanded`
  on a leaf. But then the row still renders `· not in this concept` (ui.js line 147) *and* now opens a
  sheet. That string is what R4-6 exists to fix, and the plan does not say to change it (line 174 only
  adds `overview`). A row that says "not in this concept" and then opens a useful sheet is a
  self-contradicting affordance.

> **Better decision.** Change the leaf marker from `· not in this concept` to something that promises
> the destination (`· overview`) or remove it for rows that have `overview`. Keep the honest limits
> sentence **inside** the sheet, where the plan already puts it (line 175) — that is the right home.

### 5.4 The first Tab stop is not what the plan's R4-1 acceptance check assumes.

Plan line 222 asserts *"the first Tab stop in the app is inside `#panel`"*. Measured tab order from a
fresh 1440 × 900 load **[measured]**:

```
1 world|BRAIN · CUTAWAY VIEW
2 bSearch|Search ⌘K
3 bSystems|Systems
4 bLayers|Layers
5 bHints|
6 bSettings|
7 trig|Something stressful happens…
8 trig|You skip a meal…
```

**The first tab stop is `#world`, not `#panel`.** The trigger rows are 7th. The plan's own prose at
line 37 says "the first interactive element (`#triggers` button) sits at y ≈ 70 px and the body
(`#world`, `tabindex="0"`) is the next tab stop" — that is also wrong; `#world` precedes it, and the
toolbar buttons precede both. Line 52 repeats the error (*"The first tab stop after the toolbar is
still the first trigger row"* — the toolbar's six buttons come first).

This matters because **R4-1's whole acceptance check is built on that ordering** (line 222: press
`Enter` on "that first stop" and assert `HS.E.state==='triggered'`). On the real first stop
(`#world`), `Enter` triggers **body pan/zoom behaviour, not a scene** — the check fails as written.

> **Better decision.** Restate R4-1's proxy as: *the first Tab stop **inside `#panel`** is the first
> trigger row, and `Enter` on **that** stop sets `HS.E.state==='triggered'` within 400 ms.* Focus
> `#triggers button:first-child` explicitly rather than walking the global tab order. Same evidence,
> an assertion that can actually pass.

---

## 6. Affordance honesty

### 6.1 R4-1's `.first` accent on unselected rows — **honest, but the accent it borrows is not.**

The plan (line 45) says use "a single quiet accent (left border, or the existing `.trig.continue`
treatment at app.css line 328)". `.trig.continue` is `border-color:#2F5A68; background:rgba(141,176,255,.07)`
— a **blue** treatment, and it is the styling of the **Continue** row, which is a *different* control
with a *different* meaning ("resume where you were") rendered in the same `#triggers` list
(ui.js line 89). Reusing it for "all three rows, nothing chosen yet" makes the first-time trigger list
look like three Continue rows, and on a returning learner's first paint the panel would show three
`continue`-styled rows **plus** a real Continue row — four identical-looking controls, one of which
means something else. That is a genuine false affordance.

The **`.first` idea itself is sound** and should not be dropped: an orientation accent on an unselected
list, removed the moment any row is pressed (line 45), with no count and no completion semantics
(line 54), is exactly the right size for task 1. My only objection is the borrowed skin.

> **Better decision.** Give `.first` its own treatment that reads as *"this list is the way in"*
> rather than *"resume this"* — e.g. the existing neutral `.trig` border plus a **left rule in the
> accent colour** (`border-left:3px solid var(--primary)`) with no background tint, and explicitly
> **do not** reuse `.trig.continue`'s background. Also verify the combination on a returning learner's
> first paint (Continue row + three `.first` rows) — the plan's acceptance check (line 50) only tests
> a cleared `localStorage`.

### 6.2 R4-3's "schematic" prefix — right word, wrong scope, and it collides with itself *three* times, not three-strings-worth.

The plan's §R4-3 table says `HS.routeWord = id => 'schematic ' + HS.routeText(id)` (line 97) and then
(line 99) lists exactly three labels to normalise, claiming the "projected result" is a clean set. I
evaluated `HS.routeWord` against every route in every scene **[measured]**:

```
stress:nerve     → 'schematic nerve signals · schematic route'   ← double, plan knows (normalise)
stress:acth      → 'schematic ACTH · schematic route'            ← double, plan knows (normalise)
dark:clockPineal → 'schematic nerve signals · schematic route'   ← double, plan knows (normalise)
stress:f1        → 'schematic cortisol · feedback'               ← plan says f1 is NOT prefixed
meal:fbGlu       → 'schematic glucose · feedback'                ← same
meal:fbIns       → 'schematic glucose · feedback'                ← same
dark:fbMel       → 'schematic melatonin · acts on the clock'     ← plan says fbMel is NOT prefixed
stress:f2        → 'schematic '                                  ← EMPTY: f2 has no label
```

Two problems the plan's prose does not match its own helper:

1. **The plan explicitly says feedback routes must not be prefixed** (line 99: *"The feedback route
   `dark.js` `fbMel` … is deliberately **not** prefixed — it is not a carrier route and
   `HS.carrierOf` classifies it `feedback`"*). But `HS.routeWord` as specified has **no carrier
   check** — it prefixes everything. So the plan's helper contradicts the plan's sentence. Either the
   helper needs `if(HS.carrierOf(id)==='feedback') return HS.routeText(id);` or the sentence is wrong.
   Note the *editorial* reason the sentence is right: `f1`'s label is `cortisol · feedback` and its
   whole job is to say *what it does*; prefixing it `schematic cortisol · feedback` adds a
   representation disclaimer to the one line that is a mechanism claim.
2. **`f2` has no label** (stress.js line 15), so `HS.routeWord('f2')` returns the bare string
   `'schematic '` — a trailing word with nothing after it. Today `f2` is excluded by the
   `r.label` guard at engine.js line 116 and overlay.js line 151, so this is latent, not live — but
   `HS.routeWord` as specified is a public helper that returns a malformed string, and the plan
   normalises scene labels *into* it. Guard it.

The *idea* — say "schematic" on the line's own label, where the learner is looking (line 91) — is
**correct and the strongest single move in the round**. The objection is that the plan does not
notice its helper is broader than its intent.

> **Better decision.** Define `HS.routeWord = id => { const r=HS.routeDef(id); if(!r||!r.label||HS.carrierOf(id)==='feedback') return HS.routeText(id); return 'schematic '+HS.routeText(id); }`.
> That makes the helper match the prose, protects `f2`, keeps the Advanced molecule-class branch
> (line 288's `schematic cortisol · steroid · blood` combo still holds **[measured]**), and reduces
> the three-string normalisation list to exactly the three the plan already identified.

### 6.3 R4-6's `[data-go]` buttons in a "not built here" sheet — **not a bait-and-switch, if the label is honest.**

The concern is real: a sheet whose body says *"Not built in this prototype"* and then offers a button
is the classic dead-end-with-a-teaser. But the plan's shape avoids it, because the button leads to a
**real, built pathway** (`start:{scene:'stress',path:'slow'}` for thyroid, line 174) — the nearest
built thing — and the plan's fence (line 186) forbids describing thyroid/dopamine physiology. Measured:
`[data-go]` does not exist today (`0` **[measured]**), `#sheet` is `sheet float closed` and is already
reused by `openMore` and `openPassport`, and both of those set `scrollTop=0` while **`openRead` does
not** **[measured: `openRead.toString().includes('scrollTop') === false`]** — so the new `openOverview`
must copy `openMore`, not `openRead`. The plan says "reuse the `#sheet` element exactly as `HS.openMore`
and `HS.openPassport` do" (line 176) — that is the correct precedent, and it is worth stating the
`scrollTop=0` detail explicitly, because the adjacent `openRead` is the one that gets it wrong.

One addition: the acceptance check (line 182) requires a `[data-go]` to open "a real pathway" and then
`Escape` to return focus to the tree row. But `Escape` in `app.js` (line 36) checks
`if(!$('#sheet').classList.contains('closed')){ HS.closeRead(true); return; }` — it closes the sheet
**and focuses `HS.sheetReturn`**. If the `[data-go]` click has already left the sheet open while the
pathway changed underneath, Escape returns to the tree row *in a different scene's tree*. State that
`openOverview`'s `[data-go]` handler must `closeRead(false)` (no focus) **before** calling
`HS.openPathway`, so there is no stale sheet over a new scene.

---

## 7. What the plan gets interactively **right** (do not change)

1. **R4-2's reveal/scrub half is correct.** Gating on `!HS.isRevealed()` rather than `E.tIdx` means
   scrubbing the ribbon backwards past the reveal does **not** resurrect the label — verified: after
   reveal, `HS.setTime(0)` clamps to `tIdx:1` (`minTime:1`), `rstate.f1` stays `'on'`, label stays
   gone **[measured]**. This is the one place where a naive implementation would have created a
   flickering state and the plan avoids it. Keep the condition exactly as written.
2. **R4-4 is banned at body level and its ceiling reasoning is sound** (line 133, line 276). With
   `stress:slow` and `dark:night` at 7 labels each **[measured]**, anything that adds a body-level
   label at organ level on top of R4-2 breaks the cap. Confining R4-4 to `HS.level() !== 'body'` and
   `pointer-events:none` with no interactive child (line 131) is the right call, and the
   `pointer-events:none` is **necessary** — `.lab` defaults to `pointer-events:auto` **[measured]**,
   so without it a carrier hint sitting over a `.rhit` would eat a route click.
3. **R4-5's refusal of `HS.recordAttempt`** (line 160, line 270) is the correct fence and should be
   written down as the plan says. The reflect card already says "nothing is scored" (line 234) and
   adding "compare with how we'd put it when you're ready" (line 151) keeps it ungraded.
4. **`#reflCard` really has no animation** — the plan's line 251 verification is **correct**
   **[measured: `.try` under and outside `.rm` → `animationName: 'none', transitionDuration: '0s'`]**.
   The card is built as `class="try float"` and `.try` (app.css line 103) declares no keyframes.
   Keep the `animation:none` guard anyway; it is free.
5. **R4-1's "no motion, static border"** (line 52) and its refusal of badges/counts (line 45) are
   right. A pure CSS border change needs no `.rm` entry at all.
6. **R4-6's reuse of the existing tree WAI-ARIA model** (line 184) needs no model change — `Enter`
   on a childless row already fires the click handler **[measured]**. Do not add `aria-expanded` to
   leaf rows; that would be an ARIA violation to fix a problem that does not exist.
7. **§6's exclusions are interactively correct**, especially refusing the persistent
   `HS.grammarLegend()` on `#lvlChip` (line 303) — `#lvlChip` is a depth indicator and its
   `getBoundingClientRect()` is one of the three control boxes the label resolver clears
   (overlay.js line 158), so giving it a popover would move the label field on every toggle. And
   refusing a `playAll` progress indicator (line 297) keeps the ribbon as the single position display.

---

## 8. Ranked changes to the plan

1. **Fix R4-2's gate: drop the `HS.level() === 'body'` condition** and gate on
   `p.gate && !HS.isRevealed() && !E.tryMode && !E.whatIf`, because `dark:night` opens at `organ`
   **[measured]** and the label otherwise never appears in one of the four pathways the acceptance
   check requires.
2. **Suppress the hover label when the always-on one is present** (`if(hr && !items.some(i=>i.key==='ghostword'))`
   in overlay.js line 151), because hovering the ghost currently renders both strings and **9 labels**,
   breaking the plan's own §10 ceiling of 8.
3. **Do not make `#timeChip` a button**; render a sibling `<button>` in `#pbar` from `renderDots`' own
   markup and gate it on state (`p.reflect && !E.playing && !E.tryMode && !E.whatIf`), because
   `renderDots` overwrites `#timeChip.textContent` on every step and destroys any child **[measured]**.
4. **Delete the `force` flag from R4-5** and keep `openReflect`'s `E.tryMode`/`E.whatIf`/`E.cellOpen`
   early-returns intact, exposing the manual entry as a plain alias plus a caller-side close-first
   guard — `#reflCard`, `#tryCard` and `#wiCard` all sit at `right:16px; top:96px` and would stack.
5. **Restrict `HS.routeWord` to non-feedback routes with a label**, because the helper as specified
   prefixes `f1`/`fbGlu`/`fbIns`/`fbMel` that line 99 says must not be prefixed, and returns the
   malformed `'schematic '` for the label-less `f2` **[measured]**.
6. **Add `.rm .card{animation:none}` to line 386's list** (not line 260's), because `.card` still runs
   `tipin 0.18s` under `HS.userRM=true` **[measured]** and R4-2/R4-3 add card content.
7. **Clear R4-4's latch in five named places** — `buildRoutes`, `enterPathway`, `openRebuild`,
   `openCompare`, `leave` — and key it by `sceneId:route` rather than carrier alone, because
   `buildRoutes` fires only on scene switch, so Rebuild/Compare and same-scene pathway switches
   (`stress:fast`→`stress:slow`) never clear it and the §3 acceptance check cannot pass.
8. **Restate R4-1's tab-order proxy** as "first Tab stop *inside* `#panel`", because the real first
   Tab stop is `#world` **[measured]** and `Enter` there does not reach `HS.E.state==='triggered'`.
9. **Give `.first` its own skin rather than borrowing `.trig.continue`**, because that treatment is the
   blue Continue-row style and a returning learner would see four identical controls in one list.
10. **Make R4-7's reduced-motion assertion two-pronged** (`animationName === 'none'` **and**
    `transitionDuration <= 0.12s`) over an explicitly enumerated probe list, because
    `animationName === 'none'` passes on `#sheet`, whose motion is a transition, and would pass on any
    future transition-only omission.
11. **Have the new `Y` entry record and restore its own focus origin** rather than always falling back
    to `#bRead`, so pressing `Y` from a focused hotspot does not throw focus to the toolbar on `Escape`.
12. **Change `· not in this concept` to a destination-promising leaf marker** for rows that now have an
    `overview`, because a row that says "not in this concept" and then opens a useful sheet
    contradicts itself, and have `HS.openOverview` set `HS.sheetReturn` to the invoking row.
13. **Have R4-6's `[data-go]` handler call `closeRead(false)` before `HS.openPathway`**, so no stale
    sheet is left open over a newly switched scene, and copy `openMore`'s `scrollTop=0` (which
    `openRead` lacks **[measured]**).
14. **Make R4-2's label text pointer-neutral** ("open the `?` dot" rather than "tap `?`"), because the
    literal `?` key is bound to the shortcut list app-wide (app.js line 25) and the string is going
    into scene data for all users.
