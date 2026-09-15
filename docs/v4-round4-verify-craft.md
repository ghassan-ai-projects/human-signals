# v4 round 4 — craft & correctness verification

Review of the shipped round-4 changes (`a2d684f..07c59fe`) on `design/v4-quality-round4`,
against `prototypes/v4/` (no-build prototype, `window.HS`, load order per `index.html`).

**Lens:** correctness and robustness only — shared state, lifecycle, null/undefined, load order,
label logic, visibility gating, the px→rem conversion, and dead code. Not visual taste.

**Method / environment**

- Server already running on `:8765` (`http://localhost:8765/v4/`, HTTP 200).
- Headless Chromium via the repo's `playwright`, 1440×900 (and 1024/1180/1280 for width runs).
- The "old" stylesheet was served by intercepting `/css/app.css` and fulfilling it with
  `git show a2d684f:prototypes/v4/css/app.css` — no files were written for the comparison.
- Probe scripts were created as `scripts/.tmp-craft-*.mjs` and **deleted** afterwards.
  No screenshots were needed; all evidence below is computed-style or serialized engine state.
- Nothing outside this document was modified. `git status --porcelain` at the end of the review
  shows only untracked `scripts/.tmp-learner-review*.mjs` probes that are **not mine**
  (a concurrent reviewer's work; see F13).

---

## Ranked findings

| # | Sev | Area | One line |
|---|-----|------|----------|
| F1 | **High** | R4-4 tips | `HS.tipRich` stores `pos: undefined`; the next `setTips(true)` throws `TypeError: Cannot convert undefined or null to object` |
| F2 | **High** | R4-5 `#bSay` | Visibility is only recomputed inside `renderDots`, which is not called on several state changes: shown during playback / Try it? / What if? / cell / Rebuild / Compare, and hidden after playback ends |
| F3 | **High** | R4-5 reflect | Stale `setTimeout(openReflect, 900)` fires after a route switch, opens the wrong card, and consumes `reflectVisits` so a *first* visit shows the model answer |
| F4 | **High** | R4-2 labels | The dedup `if` gained a condition but the `else if` did not move: at organ/structure level the suppressed route name is re-added plus two more; the always-on ghost label also pushes the body to 9 labels |
| F5 | Medium | R4-2/R4-5 gate | The on-demand Say-it-back path (button *and* `Y`) ignores the gate that `afterPlay` enforces — the unrevealed feedback-loop answer is one click away |
| F6 | Medium | R4-3 CSS | `.card p` (0,1,1) beats `.schem` (0,1,0): the route-card caveat renders 14px `--ink-2` body copy, not the intended 12px `--warm` caveat |
| F7 | Medium | R4-7 px→rem | Pure no-op at 100% (proven), but incomplete: 7 px `line-height`s beside rem fonts overlap at 200%, 13 `font:` shorthands keep px sizes, and the pathway bar overflows the viewport at 200% (new `#bSay` tips it over) |
| F8 | Medium | R4-2 ghost label | `ghostOn` does not check `RB`/`CMP`: "Not revealed yet" is drawn during Rebuild (where `getLabels()` returns `[]`) and during Compare |
| F9 | Low | R4-4 latch | `HS._grammarShown` is never reset and is set even when hints are off: Erase progress cannot bring the grammar tip back, and toggling hints on after a hints-off visit triggers F1 |
| F10 | Low | R4-1 cue | The "first-run" accent and the Enter-to-start cue come back after Leave; Enter always opens `TRIGGERS[0]` (stress) even if you were in dark/meal |
| F11 | Low | R4-4 wording | The route card's carrier line still says "a short portal hop" — the magnitude word R4-4 removed from the legend |
| F12 | Low | R4-5 | Clicking `#bSay` during Rebuild/Compare is a visible no-op (it only closes cards); during Try it? it silently discards the attempt |
| F13 | Info | leftovers | `HS.ghostCut` was never added (only `HS.GHOST_WORD`); `HS.routeWord` was never added (nothing to remove); no `scripts/*tmp*` is committed |

---

## F1 — `setTips(true)` throws after any rich tip  *(High)*

**Repro (deterministic, default page, no fixtures):**

1. Load `http://localhost:8765/v4/`.
2. `HS.openPathway('stress','fast',false)` — the R4-4 grammar tip renders (`.tip.tiprich`).
3. Press `H` (hints off), press `H` (hints on).

Observed page error: `TypeError: Cannot convert undefined or null to object`
(one per toggle). Same via the bulb (`#bHints`) or Settings › Tips.

Variant that needs no visible tip at all: press `H` **first** (hints off), then open any
pathway, then press `H` — same throw, because `HS.tipRich` records `_curTip` before the
`tipsOn` guard.

**Root cause.** `HS.tipRich` (`ui.js:62`) stores the caller's `pos` verbatim:

```js
HS._curTip={key,text,pos};         // pos is undefined for the linegrammar call
...
Object.entries(pos||{right:16,bottom:214})...   // render path defaults correctly
```

but the restore path in `HS.setTips` (`ui.js:78`) passes that raw value to `renderTip`,
whose very first statement is `Object.entries(pos)` with no default (`ui.js:49`).
The only rich call site passes no `pos` — `engine.js:218`:
`HS.tipRich('linegrammar', …, HS.grammarLegend())` — so `_curTip.pos` is `undefined` and the
restore throws. `renderTip` also does not render the legend, so even a guarded restore would
lose the "teach by showing" content.

**Minimal fix.** Default the position once, in the shared store (covers both entry points):

```js
// ui.js:53 and ui.js:62
HS._curTip={key,text,pos:pos||{right:16,bottom:214}};
```

(and/or `function renderTip(key,text,pos){ pos=pos||{right:16,bottom:214}; … }`). A complete fix
for the hints-off case also needs `HS.tipRich`/`HS.tip` to not record/consume the latch while
`HS.tipsOn` is false — see F9.

---

## F2 — `#bSay` visibility is stale in both directions  *(High)*

**Repro A — shown when useless and destructive.** Load → `HS.openPathway('stress','slow',false)`
→ `HS.openTry()`. Measured: `#bSay.hidden === false`, `getComputedStyle('#bSay').display === 'flex'`,
rect 112×36 in the viewport — even though `renderDots`' own predicate excludes `tryMode`.
Select `hyp`, then click `#bSay`:

```
before: {tryMode:true,  tryCard:true,  picks:['hyp'],  attempts:0}
after : {tryMode:false, tryCard:false, reflect:true,  attempts:0}
```

The in-progress Try it? attempt is discarded with no record; reopening starts from scratch.
Same "still visible" result measured for What if? (`E.whatIf='predict'`), the cell inset
(`E.cellOpen=true`), Rebuild (`HS.RB.active=true`) and Compare (`HS.CMP.active=true`) — all five
states the R4-5 comment says the button is gated against.

**Repro B — hidden when useful.** Load → open `stress:slow` → click `#bPlay`:

- 120 ms in: `{playing:true, hidden:false}` — exactly what the gate is supposed to prevent.
- Press `Y`: `{playing:true, reflect:true}` and playback keeps going behind the modal —
  measured `E.cur` −1 → 0 → 1 with the card open and the live region announcing
  "Step 1: Hypothalamus releases CRH" over the dialog.
- After the run ends: `{playing:false, reflect:false, bSayHidden:true}`. The last `renderDots`
  (from the final `goHot`) ran while `E.playing` was still true, and nothing recomputes it when
  playback stops, so the affordance vanishes exactly at the moment `afterPlay` wants to use it
  (and `afterPlay` will not reopen it for an already-seen reflect key).

**Root cause.** The gate lives only in `renderDots` (`engine.js:168-169`), and `renderDots` is
called from exactly three places: `enterPathway`, `goHot`, `checkTry`. It is *not* called from
`play()` (start or end — only `setPlayUI()`), `openTry`, `openWhatIf`, `openCell`,
`openRebuild`, `openCompare`, or `stopPlay`. Additionally `openReflect` (`engine.js:269`) has no
`E.playing` guard, so `Y` bypasses the intended gate regardless of button visibility.

**Minimal fix.**

```js
// engine.js — stopPlay() and the play() start/end paths
function setSayUI(){ const p=P(), s=$('#bSay'); if(!s) return;
  s.hidden=!(p&&p.reflect&&!E.playing&&!E.tryMode&&!E.whatIf&&!E.cellOpen
             &&!(HS.RB&&HS.RB.active)&&!(HS.CMP&&HS.CMP.active)); }
```

call it from `play()` (right after `E.playing=true`/`=false`), `stopPlay`, `openTry`,
`openWhatIf`, `openCell`, `openRebuild`, `openCompare` (or simply call `renderDots()` from
`setPlayUI()` plus those five openers), and add `E.playing` to `openReflect`'s guard so `Y`
cannot open the card mid-playback.

---

## F3 — stale reflect timer + `reflectVisits`  *(High)*

**Repro.** Load → open `stress:fast` → `HS.E.cur=-1; HS.play()` → wait for `E.playing===false`
→ **immediately** `HS.openPathway('stress','slow',false)` (the call is not awaited, or click
"Slow" by hand) → wait 1.4 s.

```
card after switching: { q: 'Why does the stress response eventually settle itself?', route: 'slow' }
```

The card for the HPA route (which the learner never played and whose gate is still unrevealed)
is open over the new route. Close it and reopen on demand:

```
reopening slow reflect: { intro: 'Reading it again — here is how we’d put it …', modelVisible: true }
```

`reflectVisits` was consumed by the stray timer, so the **first genuine visit** already shows the
model answer, defeating the retrieval effort R4-5 says the first visit is for.

**Root cause.** `afterPlay` schedules `setTimeout(openReflect,900)` (`engine.js:259`) with no
token and no cancellation; `enterPathway` does not clear it. `openReflect` then reads `P()` at
fire time — the *new* pathway — and `reflectVisits.add(key())` (`engine.js:276`) marks it.

**Minimal fix.** Guard the deferred open with the pathway it was scheduled for:

```js
const ref=key(); setTimeout(()=>{ if(E.route===r&&E.sceneId===id&&P()?.reflect) openReflect(); },900);
```

(or capture a `reflectOpenTok` and cancel in `enterPathway`/`leave`). This also removes the
pre-existing "card opens over another pathway" bug that R4-5's state made worse.

---

## F4 — R4-2 dedup backfires at organ/structure; body can reach 9 labels  *(High)*

**Repro (label audit via the same function the overlay uses).**
Load → `HS.openPathway('stress','slow',false)`, then run `HS.getLabels()` in these states:

| state | level | n | route labels present |
|---|---|---|---|
| `E.cur=0`, `HS.pulse={on:true,route:'crh',t:.4}` (the autoplay moment the commit cites) | body | 7 | *(none — suppressed ✔)* |
| `E.cur=1`, pulse `crh` | body | 8 | `rl-crh` (correct: step names ACTH) |
| same as row 1, Advanced on | body | 7 | *(none ✔)* |
| `E.cur=0`, pulse `crh`, zoomed to organ/structure | non-body | 7 | `rl-crh` **plus** `rl-acth`, `rl-cort` |
| `E.cur=-1`, pulse `crh` (first travel) | body | 8 | `rl-crh` (no step yet — fine) |

Row 4 is the bug: the suppressed `CRH · portal` **reappears**, and two route names that used to
be skipped during a pulse are added — 1 route label becomes 3. Before this commit the `else if`
was unreachable while a pulse with a label was on (the `if` was true whenever `pr&&pr.label`), so
this is a regression against `a2d684f`, not just a missed optimisation.

**Root cause.** `engine.js:122-124` — the condition was extended but the branch structure was not:

```js
if(pr&&pr.label&&!(E.cur>=0&&stepNames.toLowerCase().includes(routeFirst(...)))) out.push({key:'rl-'+route,…});
else if(L!=='body'){ p.draw.concat(…).forEach(id=>{ … out.push({key:'rl-'+id,…}) }); }
```

When the new `&&!(…)` is false the whole `if` is false, so the `else if` runs.

Also measured, same area: with the gate unrevealed, the always-on ghost label is `unshift`ed
onto an already-full label list, so **stress:slow renders 9 labels** (`Not revealed yet` +
`one` + 4 signs + 2 hotspot labels + `rl-crh`) in the manual-step-while-pulsing state —
over the §10 ceiling of 8 the R4-2 commit was written to respect. Without the pulse it renders 8.

**Minimal fix.**

```js
if(pr&&pr.label){
  const dup=E.cur>=0&&stepNames.toLowerCase().includes(routeFirst(HS.routeText(HS.pulse.route)));
  if(!dup) out.push({key:'rl-'+HS.pulse.route,…});
} else if(L!=='body'){ … }
```

For the 9-label case, drop the ghost label when `getLabels()` is already at the cap (or reserve a
slot by trimming `p.hots` labels first) — the current `unshift` comment only guarantees it is
*placed first*, not that the total stays ≤8.

*No false positive or false negative of the comparison itself was found.* At body level the
check is correct for stress:fast/slow, meal:between/after and dark:night (verified against each
scene's `hots`/`seg` pairs); punctuation in the step text (`CRH,`, `CRH.`) still matches because
the test is `includes`. One latent hazard: `routeFirst` returns `''` for a label whose first
token is empty (e.g. `'· blood'`), and `x.includes('')` is always true — that would suppress
unconditionally. No current label starts with a separator, so it is latent; guard it with
`const rf=routeFirst(...); … (rf && stepNames.includes(rf))`.

---

## F5 — on-demand reflect bypasses the gate  *(Medium)*

**Repro.** Load → `HS.openPathway('stress','slow',false)` → `HS.isRevealed()` is `false` →
click `#bSay` → click "Show how we'd put it".

```
model shown: 'How we’d put it  Cortisol acts back on the pituitary and the hypothalamus to slow its own re…'
reveals the gate answer? true
```

`afterPlay` deliberately withholds this prompt until the loop is revealed
(`engine.js:259`: `(!p.gate||isRevealed())`), and Try it? is the only intended way to reveal it.
The new button (and `Y`) makes the gate skippable on the first visit.

**Root cause.** `openReflect` (`engine.js:269`) checks tryMode/whatIf/cell/RB/CMP but not the
pathway gate; `renderDots` gates `#bSay` on `p.reflect` alone (`engine.js:169`).

**Minimal fix.** Mirror the `afterPlay` condition in both places:
`s.hidden = !(p.reflect && (!p.gate||isRevealed()) && …)` and, defensively, return early from
`openReflect` when `p.gate && !isRevealed()`.

---

## F6 — `.card p` defeats `.schem`  *(Medium)*

**Repro.** Load → open `stress:slow` → click the CRH route → inspect `.card .schem`:

```
computed: fontSize 14px, color rgb(162,182,186)  (= .card p: .875rem / --ink-2)
intended: fontSize 12px, color --warm  (rgb(240,194,126))
```

Only the dashed `border-left` survives (`.card p` does not set it). The same element in the sheet
is correct — `#sheet .schem{…}` (1,1,0) wins there: 12px / `rgb(240,194,126)`. So the R4-3
"not a vessel" caveat works where the learner reads it in the sheet, and fails in the route card,
which is the surface the commit was about.

**Root cause.** CSS specificity, `prototypes/v4/css/app.css:111` (`.card p`, 0-1-1) vs
`:116` (`.schem`, 0-1-0).

**Minimal fix.** `app.css`: `.card p.schem{font-size:0.75rem;color:var(--warm)}` (or move the
`.schem` rule after `.card p` with a `.card .schem` selector).

---

## F7 — px→rem: a true no-op at 100%, incomplete above it  *(Medium)*

### The no-op claim — evidence

Static, media-aware comparison of every `font-size` / `width` / `max-width` declaration that
changed from `Npx` to `Mrem` in the same at-rule context: **101 conversions, 101 exact
(`M == N/16`), 0 value changes.** The single flag from a naive selector-keyed pass
(`.caption b`) was an artifact of duplicate selectors (`20px→1.25rem` in the first block,
`22px→1.375rem` later, `18px→1.125rem` in the ≤1500px media query — all exact individually).

Browser confirmation (authoritative): the page was loaded twice under identical conditions, once
with `page.route('**/css/app.css', …)` fulfilling the file from
`git show a2d684f:prototypes/v4/css/app.css`. Every element under `html, body, #app *` was
snapshotted for `font-size, line-height, width, height, max-width, padding-*, margin-*,
border-radius, letter-spacing, gap` and keyed by a tag/index path:

```
elements compared: 673; property diffs: 0
```

So at the default root size the conversion is a pure no-op — the claim holds exactly.

### What the pass missed (measured at `html{font-size:200%}`)

- **7 rules pair a rem `font-size` with a px `line-height`** — at 200% the line box is smaller
  than the glyphs, so lines overlap. Confirmed live (state where the rule applies):
  `#app.css` `.inset ol` (148), `.gloss dd` (346), `.connlist li` (386), `.menunote` (461),
  `.lane2` (496), `.cmptable` (500), `.advtx` (514). Measured: cell-inset `span.n`
  font 22 / lh 18; Compare `th` 22–23 / lh 17, `td` 25 / lh 17; connect-map `li`/`b` 25 / lh 17.
- **13 `font:` shorthands still carry px sizes** (a `font-size:Npx` grep finds none, which is why
  they were missed): `.try textarea` 13.5px/19px, `.try .why` 12px, `.pin input` 16px, `.hs`
  13px, `.leadchip` 11.5px, `.linkbtn` 13px, `.gobtn` 13.5px, `.pop .erase` 13px,
  `.connlink` 13.5px, `.connsvg .cnode text` 12.5px, `.clspill` 12px, `.menuitem` 13.5px,
  `.cstep` 13px/18px. These are the only remaining non-scaling text surfaces.
- **The pathway bar overflows the viewport at 200%.** `stress:slow` open, root 200%:
  `#pbar` is 1479 px wide in a 1440 px viewport (`.bottom`/`#pbar` left −20), so `#bExit`
  (right 1451) is clipped by `.app{overflow:hidden}`. With Compare open it is 1610 px and
  `#bShare` (1465), `#bExit` (1516) sit outside, `#pName` (left −66) is cut.
  Hiding the new `#bSay` drops the bar to 1297 px (fits) — the R4-5 button added alongside the
  R4-7 scaling work is what tips it over. At 150% it still fits (1354). The evidence capture
  `34-text-zoom-200.png` cannot show this: it is taken on a fresh page with no pathway open and
  therefore no pathway bar.

**Minimal fix.** Convert the 7 `line-height`s to unitless ratios (`/ 12px font → 1.5`), convert
the 13 `font:` shorthands to rem, and reduce the pathway bar at text zoom — e.g. hide `.lbl`
text on `.tb` under a `@media (max-width:1500px)`-style rule that also triggers at large root
sizes, or allow `.bottom` to wrap (`flex-wrap:wrap`/`max-width:calc(100vw - 24px)`).

---

## F8 — ghost label leaks into Rebuild and Compare  *(Medium)*

**Repro.** Load → `HS.openPathway('stress','slow',false)` (gate unrevealed) → `HS.openRebuild()`:

```
Rebuild active: { ghost: true, ghostText: 'Not revealed yet', labs: 1, getLabels: 0 }
Compare active: { ghost: true, labs: 12 }
```

`HS.getLabels()` correctly returns `[]` while Rebuild is active (`engine.js:107`) and
`compareLabels()` while Compare is active — but `HS.renderOverlay` adds the ghost label *after*
that, so it appears on a body where every route has just been hidden for a challenge.
The R4-2 comment says the label is "Suppressed only while a gated card is open", which
understates the cases.

**Root cause.** `overlay.js:171-177` — `ghostOn` checks `tryMode`/`whatIf` only.

**Minimal fix.** Add `&&!(HS.RB&&HS.RB.active)&&!(HS.CMP&&HS.CMP.active)` to `ghostOn`
(the same predicate already exists one screen away in `renderDots`).

---

## F9 — `_grammarShown` is a one-way latch  *(Low)*

**Repro.** Load → open `stress:fast` (grammar tip renders, `_grammarShown=true`) → remove the
tip → `HS.eraseProgress()` (which clears `HS.tipsSeen`) → `HS.leave()` →
`HS.openPathway('meal','after',false)`:

```
after erase + re-enter: { rich: false, grammarShown: true, tipsSeen: false }
```

Every other tip returns after Erase progress (their only latch, `tipsSeen`, is cleared); only
the grammar tip stays burned, because its latch is a separate module-level flag. Second repro of
the same flag: `H` (hints off) → open a pathway → `{tipsOn:false, grammarShown:true, seen:false,
tipsInDom:0, curTip:{key:'linegrammar',pos:undefined}}` — the tip is consumed without ever being
shown, and toggling hints back on then throws F1.

**Assessment.** Per *page load*, "once" is right: hints are a once-per-session teaching device and
the tip's own record is persisted through `tipsSeen`. The bug is that `_grammarShown` duplicates
a latch that is also cleared by Erase, and that it is set before the `tipsOn` guard.

**Minimal fix.** Set it only when the tip actually rendered:
`if(HS.tipRich&&!HS._grammarShown&&!ghostTip&&HS.tipsOn){ … }`, and clear it in
`HS.eraseProgress` (e.g. `HS._grammarShown=false` from store.js) or drop the flag and let
`tipsSeen` alone decide — `HS.tipRich` already refuses a key it has seen.

---

## F10 — the "first-run" cue returns after Leave  *(Low)*

**Repro.** Fresh page → `.trig.first` count `3`, all `aria-pressed=false` → open a pathway →
`0` → press Leave → **`3` again**.

**Root cause.** Both the render-time class (`ui.js:103`, `fresh = HS.E.state!=='triggered'`) and
`HS.syncTriggers` (`ui.js:127`, `!chosen`) define "fresh" as "no scene currently active", not
"nothing chosen yet". `leave()` sets `state='idle'` and calls `syncTriggers()`, so the accent
comes back for a learner who has already explored everything. The R4-1 comment says the accent
"is gone the moment any trigger is pressed". The same predicate drives the camera Enter handler
(`camera.js:90`), so Enter after leaving the **dark** scene opens **stress** (`TRIGGERS[0]`).

**Minimal fix.** Persist the "has chosen" fact (e.g. `HS.store.last` or a module flag set in
`trigger()`) and use it for both the accent and the Enter cue; or in `camera.js` reopen
`E.sceneId || HS.TRIGGERS[0].id` so Enter resumes where the learner was.

---

## F11 — portal wording: the card still says "short hop"  *(Low)*

**Repro.** Open `stress:slow`, click the CRH route, read `.card .carr`:

```
card carr : 'a short portal hop'
legend    : ['portal', 'Portal — straight to the next gland']
HOW.portal: '… Carried a short way in portal blood, straight to the next gland.'
```

R4-4 changed `HS.CARRIERS` (`overlay.js:19`) precisely because "a short hop reads as an amount",
but `showRouteCard`'s own `carrLbl` map (`ui.js:26`) still has
`portal:'a short portal hop'` and was not updated. The card body (`HOW.portal`) is fine — that
is HOW's own line, reused as the comment intends.

**Minimal fix.** `ui.js:26` → `portal:'carried straight to the next gland'` (or drop the `.carr`
span for the portal carrier and let the legend's wording stand).

---

## F12 — `#bSay` is a no-op control in Rebuild/Compare, destructive in Try it?  *(Low)*

- Rebuild active + click `#bSay`: `{rb:true, reflect:false}` — nothing happens, but the button is
  visible, focusable and announces "Say it back". Compare identical. (`openReflectNow` runs
  `closeCards()` before calling `openReflect`, which then refuses on `RB/CMP.active`.)
- Try it? open + click `#bSay`: the Try it? card is closed and the picks discarded (F2).

**Minimal fix.** One shared predicate for `#bSay` visibility (F2) removes both symptoms; also
have `HS.openReflectNow` return early (before `closeTry`/`closeCards`) when
`HS.RB.active || HS.CMP.active`, so it can never tear down another surface on its way to a
refusal.

---

## F13 — leftovers / dead code  *(Info)*

- **`HS.ghostCut` does not exist.** R4-2 added only `HS.GHOST_WORD` (`overlay.js:40`), used at
  `overlay.js:175`. Nothing to remove; the name in the commit description/review context is
  stale.
- **`HS.routeWord` was never added** — `grep -rn "routeWord" prototypes scripts` is empty.
  Confirmed absent, nothing to remove.
- **No temp script is committed:** `git ls-files scripts/ | grep -i tmp` → empty.
  (untracked `scripts/.tmp-learner-review*.mjs` files from a concurrent reviewer, not part of this
  round and not mine — I left them in place.)
- `HS.GHOST_WORD` is a two-use constant; fine.
- `overlay.js:14` comment trimmed (`beads / short hop / dashes` → `beads / hop / dashes`); no code
  impact.
- `.rm .tip,.rm .card,.rm .try,.rm #reflCard{animation:none}` (`app.css:415`) — `#reflCard` is
  redundant (it carries `.try`), harmless.
- `scripts/v4-evidence.mjs` is correct and idempotent: `shot()` guards the extension
  (`n.endsWith('.png') ? n : \`${n}.png\``) and every call already passes `.png`, so the
  `foo.png.png` bug is gone — `git ls-files docs/design-review-evidence/v4 | grep png.png` → 0.
  `page.screenshot({path})` overwrites cleanly. Two caveats, neither a bug: it writes into the
  tracked `docs/design-review-evidence/v4` (not the gitignored `coverage/v4`) and never prunes
  stale names, so renaming a capture would orphan the old file; and because it reuses one browser
  context across `fresh()` calls, `localStorage` progress carries between captures, so the
  capture order is load-bearing (`28` must precede `29`, or the grammar tip is already seen).

---

## Checked and clean (do not change)

- **px→rem is an exact no-op at 100%.** 673 elements × 16 properties, 0 computed diffs, and
  101/101 declarations numerically exact — see F7 for the method. The conversion itself is right.
- **`[hidden]` actually hides the buttons.** `app.css:304` has `[hidden]{display:none!important}`,
  so `.tb{display:inline-flex}` cannot resurrect a hidden button. The `hidden`-attribute gating
  approach used by `#bSay`/`#bWhat`/`#bAll` is sound; the problem in F2 is *when* it is
  recomputed, not the mechanism.
- **`openRead`'s `scrollTop=0` works.** Measured 400 → 0 across close/reopen; the sheet is laid
  out while `closed` (transform, not `display:none`), so the assignment takes effect.
- **Reduced motion covers the new surfaces.** With `#tMotion` on, `HS.RM()===true` and a live tip
  and route card both compute `animation-name: none`. The explicit `.rm` selector list was the
  right call — this stylesheet does not kill animations globally.
- **`HS.tipRich`'s legend renders correctly.** 7 list items: blood / nerve / portal / feedback
  lines plus stimulates / inhibits / modulates end glyphs. R4-4's "teach by showing" content is
  present and reuses `HS.grammarLegend()` (no duplicated markup).
- **No load-order or null/undefined failure is reproducible.** `overlay.js` reads `HS.pathway`,
  `HS.isRevealed` and `HS.E.tryMode` — all from the later `engine.js` — but `HS.renderOverlay` is
  first invoked from `app.js` (`HS.camTo('body',0)`, the last script) and otherwise only from
  user-driven paths; `ui.js`'s `HS.tipRich` is defined before `engine.js` needs it; `#bSay` exists
  in `index.html` before `app.js` binds it; `renderDots` guards `if(say)` and `(HS.RB&&HS.RB.active)`
  is safe even pre-`rebuild.js`. I could not make any of these throw.
- **R4-1's camera fix works.** Focusing `#world` and pressing Enter lands in
  `{scene:'stress', route:'fast', state:'triggered'}` with the pathway opened after the 900 ms
  lead-in. The `state!=='triggered'` guard correctly leaves arrow panning intact once a scene is on.
- **The body-level dedup does what the commit claims.** `stress:slow` autoplay moment
  (`E.cur=0`, pulse `crh`): `rl-crh` absent, 7 labels. It is only the non-body fallthrough (F4)
  that regresses.
- **`HS.toast`'s length-scaled duration is safe.** Every call site passes a defined string
  (`holdToast`/`calmBlocked`/`unbuilt`/`why` all exist on the paths that reach them), so
  `String(m).length*55` cannot be `NaN`; the 2.8 s floor / 7 s cap is sensible.
- **The `#bSay` button is a sibling of `#timeChip`, not a child.** The reasoning in the comment is
  right: `renderDots` rewrites `#timeChip.textContent` on every step and would destroy a focused
  child. The DOM placement and the `title` are correct.
