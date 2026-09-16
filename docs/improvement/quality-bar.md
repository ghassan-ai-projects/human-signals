# Human Signals V4 improvement quality bar

Status: active — Round 2 open
Date: 16 September 2026 (Round 1 bar defined 15 September 2026)
Scope: `prototypes/v4/` and its browser checks

This is the bar for improving V4 as a learning experience. It measures what a
learner can see, do, and understand in the browser. It does not turn the
prototype's illustrative physiology into approved science: anatomy, physiology,
asset provenance, and publication readiness remain separate review gates.

## Product boundary

The bar applies to the supported desktop surface at 1024, 1280, 1440, and 1920
CSS pixels, with Guided mode as the default. Each round also checks keyboard
navigation, reduced motion, Hints on and off, a clean local state, and a learner
returning through a copied link. The prototype remains static and browser-local:
no account, backend, database, remote analytics, or quantitative simulator is
introduced by an improvement.

## The three pillars

The overall level is the lowest pillar level. A high average cannot hide a weak
learning or interaction experience.

### Visual quality

| Level | Observable bar |
| --- | --- |
| 1 · blocked | The model, controls, or text are missing, misleading, or unusable. |
| 2 · readable | The surface loads without console errors; supported widths keep primary controls, labels, and the pathway bar visible; no measured label/UI collisions; text remains usable at 200% base size. |
| 3 · coherent | The body/model is the visual focus; hierarchy is quiet and legible; active, faint, and unrevealed routes survive grayscale; 2D/text alternatives agree with the stage; decoration never competes with the causal mark. |
| 4 · explanatory | The visual form teaches the causal grammar at the moment it matters: route, carrier, direction, timing, anatomical location, and feedback are distinguishable without guesswork; progressive disclosure keeps the stage clear. |
| 5 · resilient craft | The explanatory composition stays coherent across all five pathways, four supported widths, zoom levels, text scaling, reduced motion, and open panels, with independent visual review and no unresolved P0/P1 issue. |

### Interactivity

| Level | Observable bar |
| --- | --- |
| 1 · blocked | A primary action is dead, ambiguous, traps focus, or leaves the learner without an honest next state. |
| 2 · functional | Every advertised trigger, pathway control, hotspot, sheet, close action, and exit path works; actions have visible or announced feedback; no uncaught browser errors. |
| 3 · discoverable | A first-time learner can find an entry action; keyboard focus, tree navigation, target size, Escape/close behavior, and focus restoration are coherent; reduced motion preserves the task rather than merely stopping animation. |
| 4 · meaningful | Interactions expose cause and consequence: deliberate prediction before feedback, reversible exploration, route comparison, self-explanation, and clear hand-offs between steps. No score, streak, correctness theater, or hidden state is required to understand the model. |
| 5 · resilient interaction | Interrupting, repeating, scrubbing, switching pathways, reopening sheets, copying/restoring a link, toggling preferences, and using fallback modes leave no stale, contradictory, or inaccessible state. Each critical behavior has an automated regression probe plus browser evidence. |

### Learning experience

| Level | Observable bar |
| --- | --- |
| 1 · opaque | The learner cannot tell what the scene is about, what changed, or what to do next. |
| 2 · oriented | Each scene names an everyday trigger, a clear objective, the current step, and a next action; draft status and scope are visible; text is plain and qualitative. |
| 3 · causal | The learner can follow Trigger → Source → Signal → Target → Effect → Feedback; time words describe order and rough timescale rather than measurements; the visual, route card, text alternative, and evidence status do not contradict one another. |
| 4 · teachable | The experience supports retrieval, prediction, mechanism-based feedback, progressive disclosure, self-explanation, comparison, and at least one transfer/What if? moment without giving away the answer too early or fabricating mastery. |
| 5 · evidence-backed | Independent browser review and bounded learner observation show that the intended tasks are reachable and understandable; claims are reviewable at the point of use; unanswered scientific/anatomy gates are explicitly marked rather than implied to pass. |

## What “two levels up” means

At the beginning of an improvement program, record the current score for each
pillar in the round report. The target is two levels above that baseline, capped
at Level 5, for every pillar. The overall claim is valid only when the lowest
pillar reaches its target; an improved average is not enough.

For this repository, a level increase requires all of the following:

1. One or more reproducible findings are written under `docs/improvement/` with
   a route, viewport, state, consequence, and acceptance criteria.
2. The finding is reproduced locally by the main agent before implementation.
3. One bounded implementation change is made, with a focused regression test or
   browser probe where the behavior can regress.
4. The implementation is reviewed again in the browser and the relevant full
   checks pass. A screenshot is required for a visual or placement claim.
5. The change is committed separately. A failed or interrupted review is not a
   pass and does not advance the level.

## Required checks before claiming the target

The existing V4 checks remain the floor:

- `node scripts/v4-quality-bar.mjs` for layout, salience proxies, grayscale,
  reduced motion, text scaling, and console errors.
- `node scripts/v4-comprehension-check.mjs` for the reachable learning
  affordances and their honest wording.
- `node scripts/v4-browser-check.mjs` for a clean browser launch and baseline
  screenshot.

The round is complete only when the final browser-review agent reports no
unvalidated P0/P1 findings, the main agent has verified every claimed fix, all
required checks are green, the round's scorecard shows the two-level increase,
and each implementation change has its own commit.

## Evidence limits

Automated checks prove presence, state, geometry, and reachability. They do not
prove that a learner interpreted anatomy correctly, understood a causal claim,
or retained it. Those claims need qualified scientific/anatomy review or a
separately reported learner observation. The review notes must keep those gates
explicit.

## Round scorecard

| Pillar | Baseline | Target | Evidence | Status |
| --- | ---: | ---: | --- | --- |
| Visual quality | TBD — set by opening review | baseline + 2, cap 5 | pending | Open |
| Interactivity | TBD — set by opening review | baseline + 2, cap 5 | pending | Open |
| Learning experience | TBD — set by opening review | baseline + 2, cap 5 | pending | Open |

## Round 2 rules (opened 16 September 2026)

Round 1 closed with all three pillars self-reported at 5/5. A closed self-report
is not a standing entitlement: Round 2's baseline is re-established by a fresh
independent browser review that scores the app against the pillar tables above
as they are written, without assuming any previous round's claims. Two
consequences:

1. If the opening review scores a pillar below 5, that score is the baseline and
   the target is baseline + 2 (capped at 5). The loop of review → validate →
   implement → re-review repeats until every pillar meets its target.
2. If the opening review confirms 5/5 everywhere, the round may not coast: the
   review must instead name the strongest concrete gaps that remain inside the
   existing level definitions (regression risks, thin evidence, untested states),
   each treated as a finding with the same rigour. "Two levels up" then means
   the re-review at round close still independently confirms 5/5 against a
   stricter evidence set — every pillar re-proven, not merely re-asserted.

Baseline claim waits on the opening review report under `docs/improvement/`.

## Round 1 record (closed 16 September 2026)

Round 1 **closed** on 16 September 2026 at 3/5 → 5/5 on all three pillars. The final narrow-reader finding
`V4-FINAL-01` is implemented in `f8a2215`, with main-agent evidence in
`validation-v4-reader-focus-postfix.md` and independent post-fix confirmation in
`browser-review-2026-09-16-postfix-close.md`. That confirmation re-checked both
1280×800 and 1024×768 (no horizontal overflow, reader within viewport, evidence
and close control visible, workspace restored on close) and re-swept for new
issues: no P0/P1 remains. The expanded quality-bar probe covers caption
clearance, active-anatomy clearance, control reachability, and reader-close
restoration at the 1024px boundary.

Required checks are green: `v4-quality-bar.mjs` 106/106, `v4-comprehension-check.mjs`
47/47, `v4-browser-check.mjs` no errors.

Scientific and anatomical correctness of the physiology and artwork remain
separate review gates and are **not** closed by this round.
