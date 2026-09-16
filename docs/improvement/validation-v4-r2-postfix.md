# V4 Round 2 — main-agent verification of the fixes

Date: 16 September 2026
Verifier: main agent, per the quality-bar rule that the main agent verifies every claimed fix in the browser before the round may advance.
Method: the same probe suites that reproduced the findings were re-run against the fixed HEAD (fresh contexts, deterministic pathway waits, toast content diffed around keypresses), plus targeted visual screenshots, plus the full official floor run independently by the main agent.

## Finding → fix → verification

| Finding | Fix commit | Main-agent verification (own probes, not the implementer's) |
| --- | --- | --- |
| V4-R2-01 | `2ed0418` | Layers popover open on `#s=meal&p=between`, Escape → popover **hidden**, `HS.E.route` stays `between`, focus restored to `#bLayers`. Contradicts the pre-fix run (popover open + route `null`). |
| V4-R2-02 | `ca9c42c` | Escape from `#tryCard` → focus on the opening control (gate dot / `#bLayers` depending on opener), from `#wiCard` → `#bRead`, from `#rbCard` → a real control; `document.activeElement` is never `BODY` in any of the three flows (pre-fix: `BODY` for all three). |
| V4-R2-05 | `f1226a3` | Fresh context, handle focused at `aria-valuenow` 0: End → **3** (gated end clamps to last−1, gate toast shown), Home → **0**. On stress:fast (ungated) End reaches the last stop (4). Pre-fix: 0 → 0 → 0. Note: a probe that reuses a page where the gate was revealed sees End → 4 — correct after reveal, not a defect. |
| V4-R2-07 | `778d3c4` | stress:fast: `t` → no card, toast "Try it? is not part of this route: no feedback loop acts back here."; `w` → no card, toast "What if? is not part of this route."; meal:between unrevealed: `w` → toast "…opens once the feedback loop is revealed — use Try it? first."; gate dot still opens Try (happy path intact). Pre-fix: no card and no new toast. (A probe artefact to avoid: with focus parked on the ribbon handle, letter keys are deliberately ignored by the app; probes must reset focus first.) |
| V4-R2-03 | `f2966c7` | 1024×768, root font-size set to 32px **after** pathway entry (no resize event): `#panel` ∩ `#caption` overlap area **0** (pre-fix 302×93 px), `bigtext` class applied within ~400 ms. Screenshot `coverage/v4-r2/verify-text200-midsession-1024.png` shows the caption fully readable. |
| V4-R2-06 | `12e7f62` | Toggling Blood: `#o-heart` computed opacity 0.32 → **1**, 5 route paths gain `.bloodlit` at computed 4.6px stroke (pre-fix: nothing changed). Screenshots `coverage/v4-r2/verify-blood-before.png` / `verify-blood-on.png` show an unmistakable stage difference a learner could name. |
| V4-R2-04 | `8bea84f` | Search "pupil" → result "Pupils widen · Body sign"; Enter lands on `stress:fast`. Pre-fix: "No match". Existing searches still land correctly ("insulin" → meal:after, "cortisol" → signal node). |

## Official floor, run independently by the main agent on the fixed HEAD

- `node scripts/v4-quality-bar.mjs` → **TOTAL 106/106 pass, 0 fail**
- `node scripts/v4-comprehension-check.mjs` → **TOTAL 47/47 pass, 0 fail**
- `node scripts/v4-browser-check.mjs` → **ERRORS: none**

`npm run lint` passes (module boundaries OK; `prototypes/**` is deliberately excluded from eslint as a no-build design surface).

## Deviations the implementer documented (accepted by the main agent)

1. The ResizeObserver watches `documentElement`, `#panel` and `#caption` rather than `documentElement` + `body`: with `html,body{height:100%}` the body box never changes on a font-size change, so observing it could never fire; the two surfaces the `bigtext` flag exists to separate are observed directly.
2. `applyBloodLayer` also toggles `bloodlit` on `#o-heart`: no `.org.lit` rule raises group opacity, so without it the heart could never leave the dimmed 0.32 state; one class owner keeps the state coherent across `applyOrgs()` updates.

Both deviations are recorded in the respective commit bodies and are consistent with the findings' acceptance criteria.

## Remaining gate

The independent post-fix browser review (re-sweep for new P0/P1 + fresh pillar scoring) is the round's next required step; learner-observation and scientific/anatomy gates remain open by design.
