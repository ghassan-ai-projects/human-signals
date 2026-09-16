# Human Signals V4 — independent browser re-review after the Round-2 fixes (post-fix)

Date: 16 September 2026
Reviewer: independent browser-review agent (Playwright/Chromium, review only — no application code modified)
App under review: `http://localhost:8765/v4/` (static server on :8765), HEAD `030ba25`
Evidence: probe scripts written for this review under `coverage/v4-r2-rr/` (gitignored), run fresh — no prior run's output trusted; screenshots under `docs/improvement/validation-v4-r2rr-*.png` as cited per finding.

This review verifies the seven Round-2 fixes (commits `2ed0418`, `ca9c42c`, `f1226a3`,
`778d3c4`, `f2966c7`, `12e7f62`, `8bea84f`), sweeps adversarially for new issues the
fixes may have introduced or left behind, and re-scores the three pillars against
`quality-bar.md` as written.

---

## 1. Per-fix verification — all seven PASS in their verified scope

| Finding | Fix commit | Verdict | Independent measurement (fresh contexts, own probes) |
| --- | --- | --- | --- |
| V4-R2-01 popover Escape | `2ed0418` | **PASS** | Layers popover on `#s=meal&p=between`: Escape → popover hidden, `HS.E.route` stays `between`, focus `#bLayers`, `aria-expanded=false`; toast content unchanged (no fall-through to pathway semantics). Settings popover on stress:fast: same result. Keyboard-opened popover (focus button + Enter, both popovers): Escape → popover hidden, focus back on the toolbar BUTTON, next Tab lands on `bHints` (no trap). Home level with popover open: Escape closes it, state stays `idle`. Zero console errors in all five cases. |
| V4-R2-02 card Escape focus | `ca9c42c` | **PASS** | Try via ? dot: focus after Escape = the `hdot q` opener, `tryMode` false. Try via T key: focus `#bRead`. What if? after reveal on stress:slow: card gone, `whatIf` null, focus `#bWhat`. Rebuild: card gone, `RB.active` false, route kept, focus `#bAdv`. Say it back: focus `#bRead`. Cell inset: focus `#bRead`. `document.activeElement` is never BODY in any of the six flows. (One member of this card family was missed — see V4-R2-RR-01.) |
| V4-R2-05 ribbon Home/End | `f1226a3` | **PASS** | Fresh context, handle focused at `aria-valuenow` 0 on meal:between: End → **3** with the gate toast ("Glucose can't settle until something turns glucagon down. Open Try it? on the dashed line."), Home → **0**, ArrowRight after → 1 (arrows unbroken). stress:fast (ungated): End → **4** (the last stop), Home → 0. dark:night (gate `blocksEnd:false`): End → **4** even unrevealed — matches the scene's authored semantics. 4× End spam: stays clamped at 3, exactly one toast element, no stacking. During playback: End stops playback, then applies (deliberate interruption, no fight). During What if? the ribbon cannot take focus — the modal card captures keys (one-active-surface contract, correct). |
| V4-R2-07 honest T/W | `778d3c4` | **PASS** | stress:fast: `t` → no card, toast "Try it? is not part of this route: no feedback loop acts back here."; `w` → no card, toast "What if? is not part of this route." (both diffed against the pre-existing restore announcement). meal:between unrevealed: `w` → "What if? opens once the feedback loop is revealed — use Try it? first." meal:after (gate, no whatIf): `t` opens the gate Try; `w` → honest no-whatif toast. dark:night: `t` opens Try. Happy paths intact: ? dot opens Try, ghost route click opens Try, W after reveal opens What if?. No toast contradicts its route's content. |
| V4-R2-03 200% mid-session | `f2966c7` | **PASS** | 1024×768, root font set to 32px AFTER pathway entry (user-stylesheet path, no resize event): `html.bigtext` applied, `#panel` ∩ `#caption` = **0 px²** (opening review: 302×93 px). Restoring 16px re-evaluates. The flag survives Settings-switch toggles and leave→re-enter pathway at 200% (`validation-v4-r2rr-text200-midsession-1024.png`). Reader-focus at 1024 with 200%: sheet at 210–1010 × 74–578 — fully inside the viewport, close button reachable. No ResizeObserver loop errors across rapid font flips. (One more 200% surface was missed — see V4-R2-RR-03.) |
| V4-R2-06 Blood visible | `12e7f62` | **PASS (within a scene)** | meal:between 1440×900: `#o-heart` computed opacity **0.32 → 1**; blood routes `r-glucagon`/`r-glucose` **2.6px → 4.6px**; the feedback ghost `r-fbGlu` correctly NOT thickened (2.6px, ghost break preserved); honest toast. Before/on screenshots (`validation-v4-r2rr-blood-before-1440.png` / `-on-1440.png`) show an unmistakable difference a learner could name. Toggle off reverts (heart back to dim). Nervous toggle unaffected (opacity 1 / 0.35). Blood + Endocrine coexist without conflict. Stress:fast nerve routes never thicken (carrierOf = nerve). Dark scene carriers correct: rht/clockPineal = nerve (not thickened), melatonin = blood, fbMel = feedback (ghost family never bloodlit). (The emphasis does not survive a scene load — see V4-R2-RR-02.) |
| V4-R2-04 search body signs | `8bea84f` | **PASS** | "pupil" and "pupils" → single result "Pupils widen · Body sign"; Enter lands on `stress:fast` (`validation-v4-r2rr-search-pupil-1440.png`). "insulin" → meal:after; "cortisol" → signal node with panel opened. Collision check: "heart" → "Heart beats faster · Body sign" + "Heart · Organ" (distinct kinds, no duplicate title); "breathing" → "Breathing quickens · Body sign" + "Lungs · Organ" via synonym. Highlighting a Body sign result lights the fast pathway's organs (brain, adr, heart, lungs, liver) — sensible. Four clean repeat runs, zero console errors. |

Seven of seven fixes do what their findings demanded, in the states where they were
validated. The adversarial sweep below found three real gaps the fixes did not cover.

---

## 2. New findings

### V4-R2-RR-01 — Escape from Compare view drops focus on the stage and leaves both routes drawn as active (P2)

- Severity: P2
- Pillar: Interactivity
- Route/state + viewport: any scene, Advanced mode on, Compare routes open (`#s=meal&p=between` used), 1440×900
- Observed: with the compare card open, Escape closes it and ends the layer, but focus lands on `document.activeElement` = **BODY**, and the stage keeps BOTH pathways' routes drawn `'on'` and solid (`glucagon,glucose,absorb,insL,insM`), with the A/B hollow distinction cleared and the compare legend hidden — `closeCompare(false)` skips the `enterPathway` re-render. The camera stays at the compare framing. A second Escape then exits the pathway (`E.route` → null). Root cause visible in code: `compare.js` still registers `HS.layers.start('compare',opener,()=>HS.closeCompare(false),…)`, discarding the focus flag exactly the way `ca9c42c` fixed for the try/what/cell/reflect/rebuild cards; the `if(HS.CMP.active)` branch in `app.js`'s Escape chain is unreachable for Escape because the layer branch fires first. The card's visible Close button is correct (pathway state restored to `glucagon:on,glucose:on,fbGlu:ghost,absorb/insL/insM:faint`, focus `#bAdv`). Screenshot: `coverage/v4-r2-rr/02f-compare-after-esc.png`.
- Expected: the app's one-active-layer contract and the standard the round itself just set: Escape closes the surface, restores focus to the opener/`#bAdv`, and leaves the pathway exactly as it was before Compare opened. This is the level-5 interactivity bar verbatim ("Interrupting … reopening sheets … leave no stale, contradictory, or inaccessible state").
- Consequence: a learner who presses Escape on Compare gets a merged two-route stage with no legend in a guided model that otherwise never draws both pathways active at once, and must notice the inconsistency themselves; keyboard focus is lost.
- Acceptance criteria: (1) Escape with Compare open passes the focus flag through (as the other five cards now do), restoring focus to the opener or `#bAdv`; (2) the stage is restored to the pre-compare pathway state (route states per pathway, ghost/gate intact) — assertable by comparing `HS.rstate` before open and after Escape; (3) a regression probe drives compare-open + Escape on `#s=meal&p=between` and asserts both; (4) no console errors.

### V4-R2-RR-02 — Blood layer's route emphasis silently disappears after every scene load (P2)

- Severity: P2
- Pillar: Interactivity / Visual quality
- Route/state + viewport: Layers popover, Blood on, then any scene switch (meal:between → stress:fast and → dark:night tested), 1440×900
- Observed: Blood on at meal:between marks 5 routes `.bloodlit` (4.6px). Switching scene with the toggle still ON (`HS._bloodOn === true`, popover `aria-checked="true"`, heart still `bloodlit` at opacity 1): `#r-adrenaline` (carrier blood, state `on`) stays **2.6px with no bloodlit class**; `#r-melatonin` on dark:night likewise. Re-toggling Blood off/on repairs only the current scene — the next scene load drops it again. Root cause: `overlay.js` `buildRoutes` re-applies `HS.applyBloodLayer(true)` immediately after rebuilding the routes, but in that same function every `HS.rstate[id]` has just been set to `'hide'`, and `applyBloodLayer` gates route classes on `rstate[id]!=='hide'` — so the re-application can never mark anything, and nothing re-applies after `enterPathway` turns routes on/faint/ghost.
- Expected: the toggle's own toast ("the heart and blood-borne routes are emphasised") and the popover's persistent checked state describe a standing layer; the level-5 interactivity bar ("toggling preferences … leave no stale, contradictory, or inaccessible state") requires the stage to match the advertised state across scene switches.
- Consequence: after exploring a second scene, the learner sees a heart outlined for "Blood" but no blood-borne route emphasised — the exact "toggle reads as broken" mistrust V4-R2-06 was fixed to prevent, reintroduced by navigation. The main-agent verification stayed within meal:between, where the fix does hold.
- Acceptance criteria: (1) with Blood on, every visible (`rstate !== 'hide'`) blood-carrier route carries `.bloodlit` in every scene and pathway state, including immediately after a scene load and a pathway switch — probe asserts per scene (stress:fast → `r-adrenaline`; dark:night → `r-melatonin`; meal:between → `r-glucagon`,`r-glucose`); (2) toggle off clears all of them; (3) feedback/nerve/portal carriers never thicken; (4) no console errors.

### V4-R2-RR-03 — At 200% base text at 1024×768, the draft banner covers the toolbar and blocks mouse clicks on Layers, Hints and Settings (P2)

- Severity: P2
- Pillar: Visual quality
- Route/state + viewport: any state (pathway open used), root font-size 32px set mid-session, **1024×768**
- Observed: `.draft` ("Illustrative draft · not reviewed science") and `.toolbar` are both `position:absolute; z-index:20` and `.draft` comes later in the DOM; at 200% the two collide — measured overlap **11,026 px²**, covering Systems (partially), Layers, Hints and Settings. Playwright click test at the button centers: **bHints, bSettings, bLayers BLOCKED** (the draft intercepts pointer events). At 1280×800 only a corner of `#bSettings` is covered (~430 px², center still clickable); at 1440×900 and 1920×1080 there is no overlap. At default text size there is no overlap at any supported width. Screenshot: `validation-v4-r2rr-text200-draft-toolbar-1024.png`. Secondary measurement in the same scenario: the ribbon's time words overlap at 200%/1024 (word pairs 0–1 by 24px and 3–4 by 47px; zero overlaps at default size) — the `html.bigtext` handling moved the caption and panel but did not reflow the toolbar/draft pair or the ribbon words.
- Expected: visual level 2 — "text remains usable at 200% base size" — the same observable bar V4-R2-03 failed for the caption/panel pair; a covered, mouse-unclickable Settings/Layers/Hints control at the smallest supported width fails it. Keyboard access still works (Tab + Enter), which is why this is P2 and not P1.
- Consequence: a low-vision learner who enlarges their base font — the exact WCAG 1.4.4 scenario the bigtext work targets — cannot click three toolbar controls at 1024×768, and the app's own honesty marker visually sits on top of them.
- Acceptance criteria: (1) with a 200% root font at 1024×768, `#panel`-style geometry checks pass and `.draft` ∩ every `.toolbar .tb` = 0 px², with Playwright clicks landing on each button; (2) ribbon time words do not overlap at 200% at 1024×768 (or are measured and accepted explicitly); (3) a regression probe asserts both, and `v4-quality-bar.mjs` gains the toolbar/draft pair for the 200% case so this cannot silently return.

### Non-blocking observations (hardening notes, no finding)

- T/W are silently swallowed while focus sits in the systems tree (type-ahead owns single keys, per the ARIA tree pattern) or on the ribbon handle — no card, no toast. Deliberate and narrow, but the Keyboard dialog advertises T/W unconditionally; one line there ("shortcuts pause while a list or the time slider has focus") would close the last of V4-R2-07's ambiguity.
- With Blood on, leaving to the home screen keeps the heart at opacity 1 with a blue `#7CCBFF` outline over a fully undimmed body — coherent with a persistent layer preference and the toast's wording, but the only layer that stays visible with nothing explored; worth a deliberate decision rather than an accident.
- The `if(HS.CMP.active)` / `if($('#advMenu'))` branches late in `app.js`'s Escape chain are dead now that those surfaces are layers — harmless, but they invite exactly the RR-01 confusion.
- Repeated End on a gated end re-shows the same single toast (no stacking) — correct.
- No ResizeObserver loop errors, no residual `data-hs-inert` nodes and no lingering layer after a 30-action multi-state sweep, including three root-font flips.

---

## 3. Regression check results (run this session, from repo root, server on :8765)

| Script | Result |
| --- | --- |
| `node scripts/v4-quality-bar.mjs` | **TOTAL 106/106 pass, 0 fail** |
| `node scripts/v4-comprehension-check.mjs` | **TOTAL 47/47 pass, 0 fail** |
| `node scripts/v4-browser-check.mjs` | **ERRORS: none**, title "Human Signals Body Scenes" |

Additional sweep performed for this review (all console-error-free unless a finding says
otherwise): full Escape chain (reader sheet → focus `#bRead`; keys dialog → `#bSettings`;
search palette → opener; cell inset → `#bRead`; Say it back → `#bRead`; organ/structure
zoom → Escape zooms out first and keeps the route, second Escape leaves; body-level
pathway → Escape leaves); popover focus restoration via mouse AND keyboard opens; ribbon
Home/End during playback, at the gated end, at dark:night's non-blocking end, under key
spam, with arrow keys after; T/W on all five pathways and all three openTry callers;
Blood across scene switches, pathway switches, Endocrine/Nervous coexistence, ghost/faint
non-thickening, carrier correctness on dark and stress:fast; bigtext through Settings
toggles, pathway enter/leave, restore, and reader-focus at 1024/200%; search collisions
and preview lighting with four clean repeats; a 30-action multi-state console sweep with
zero errors/pageerrors and clean final layer/inert state.

---

## 4. Fresh pillar scores

| Pillar | Score | Justification |
| --- | ---: | --- |
| Visual quality | **4** (explanatory) | The explanatory composition still teaches the causal grammar everywhere it was checked, and both Round-2 visual fixes hold in their verified scope: 200% mid-session reflow engages with no resize (overlap 0, `bigtext` applied, `validation-v4-r2rr-text200-midsession-1024.png`), and the Blood toggle is now unmistakable on stage (heart 0.32 → 1, blood routes 4.6px, `validation-v4-r2rr-blood-before/on-1440.png`). It is not a 5, and not only because V4-R2-RR-02 lets the Blood emphasis silently vanish across scene loads while the popover claims it is on: **V4-R2-RR-03 fails the level-2 bar as written — "text remains usable at 200% base size" — at 1024×768**, where the draft banner covers and mouse-blocks Layers/Hints/Settings (11,026 px² overlap, clicks blocked; ribbon time words also overlap at 24–47px). Levels are cumulative; a pillar whose level-2 floor fails in a supported state cannot be scored 5, by the same standard the opening review applied to V4-R2-03. |
| Interactivity | **4** (meaningful) | Every Round-2 interactivity fix verifies cleanly: popover Escape closes and refocuses on mouse and keyboard paths with no pathway fall-through; all five fixed cards restore focus to a real control on Escape; the ribbon slider matches the ARIA pattern (End clamps to last−1 with the honest gate toast, ungated End reaches the stop, Home → 0, arrows unbroken, playback interrupted deliberately, no toast stacking); T/W say honestly when a route has no such exercise and every openTry caller still works. The level-5 bar — "Interrupting … switching pathways … toggling preferences … leave no stale, contradictory, or inaccessible state" — is not met: **V4-R2-RR-01** leaves focus on BODY and both pathways' routes drawn as active after Escape from Compare (a state the guided model never otherwise shows), and **V4-R2-RR-02** leaves the Blood preference advertising routes it no longer emphasises after any scene load. Both are the exact defect class this round fixed elsewhere, so the bar cannot be called met while instances remain. |
| Learning experience | **4** (teachable) | Everything in the learning pillar that a browser review can reach verifies: search now finds the body signs the app itself names and lands on stress:fast (V4-R2-04 closed); honest toasts never contradict route content; Say it back stays ungraded and gated; every surface still carries "Illustrative draft; not scientifically reviewed · Source: no source assigned". It is not a 5 for the same reason the opening review recorded: level 5 requires "bounded learner observation" in addition to independent browser review, and no such observation exists in the repository — that gate stays open by design, as do the anatomy/physiology, artwork and provenance gates. No new learning finding was observed. |

Overall level = lowest pillar = **4**.

---

## 5. Verdict

**Round 2 does not close.** No P0/P1 finding remains, and all seven Round-2 fixes
verify — but the target is 5/5 on every pillar, and two pillars hold at 4 on named,
observable level bars: visual fails its own level-2 "usable at 200% base size" floor at
1024×768 (V4-R2-RR-03), and interactivity fails level 5's "no stale, contradictory
state" bar on two of the exact surfaces this round fixed (V4-R2-RR-01, V4-R2-RR-02).
All three findings are P2 with concrete acceptance criteria and are each a bounded,
single-surface change of the kind this round has already demonstrated. Learning stays
at 4 solely on the open-by-design learner-observation gate, not on any browser defect.
A narrow closing pass after RR-01/02/03 — re-running this report's probes 01/02f/05b/08
plus the official floor — should be sufficient to close the round.

Gates that stay open by design (not counted against any pillar's browser-observable
bar): bounded learner observation (learning level 5), scientific/anatomical correctness,
artwork and asset provenance, publication readiness.

## 6. Scope note

This review covers layout, state, interaction and wording in the browser only, at the
supported desktop widths with keyboard and mouse. It does not assess anatomical or
physiological correctness, artwork quality, asset provenance, or publication readiness;
the app's own "Illustrative draft · not reviewed science" banner and per-block evidence
statuses remain the correct marking of those open gates. Probe scripts: `coverage/v4-r2-rr/probe-01-escapes.mjs` through `probe-08-confirm.mjs` (gitignored), run against HEAD `030ba25`.
