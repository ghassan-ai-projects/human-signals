# Implementation evidence

What was actually built, what was actually run, and what is still blocked. Nothing in this file
is a prediction: a check appears here only after it was executed at the recorded commit.

Quality bar: [quality-bar.md](quality-bar.md). Specification: [../README.md](../README.md).

## Status summary

| Gate | Status | Basis |
|---|---|---|
| G1 contract and engine | **pass** | VAL rule fixtures, projection properties, controller transitions |
| G2 product flows | **in progress** | 2D slice, explore, search, loading and failure paths covered |
| G3 access and robustness | **in progress** | keyboard and 2D parity covered in jsdom; browser and screen-reader runs not yet executed |
| G4 scientific and asset readiness | **blocked** | no qualified reviewer, no verified source, no licensed asset |
| G5 quality and performance | **not run** | no physical-device measurement yet |
| G6 operations | **not run** | no host chosen, no deployment authorised |
| G7 learning validation | **not evidenced** | no study has been run |

## Work packages

### W0 — Reproducible project foundation (`0cba7a5`)

Static React/TypeScript/Vite shell, hash routing, design tokens, separate shell/content/renderer
error boundaries, bounded local diagnostics, the document 08 npm script contract, and a
Content Security Policy without `unsafe-eval`. Strict TypeScript with `noUncheckedIndexedAccess`
and `exactOptionalPropertyTypes`.

Executed: `typecheck`, `lint`, 6 unit tests, production build (76 KB gzip shell).

### W1 — Content contract and compiler (`11e3b9f`)

Runtime schemas for every record in the normative contract, unknown fields rejected; the full
document 05 invariant table under stable rule codes; deterministic compiler producing a sorted
bundle, a delivered-bytes hash and a scientific hash that excludes the review ledger; a
fabrication guard that requires a human ledger entry before any citation or approval can exist.

Executed: 75 unit tests, one invalid fixture per VAL rule plus a coverage assertion over the rule
set, contract-conformance test against `documentation/contracts/content-contract.ts`, preview
build, and a production validation that exits 1 with 56 errors — the correct fail-closed result
for unreviewed content.

### W2 — Playback engine (`ac1dad6`)

Pure `project(timeline, cursorMs)`, session reducer implementing the document 06 transition
table, effects returned rather than written, clock adapter, checkpoint and exposure policy.

Executed: 326 tests. The eight expected results in document 06 are asserted against
`documentation/examples/synthetic-feedback.json` itself. Determinism property-tested over 60
generated timelines, including 16 ms, 250 ms and 1000 ms frame pacing. Engine and content
coverage 99.3% statements, 94.2% branches, 100% functions, 99.6% lines.

### W3 — Accessible 2D vertical slice (`aa67a66`)

Loader with manifest, hash-named bundle and delivered-bytes verification; indexed repository and
deterministic local search; lesson player with stage strip, SVG diagram, per-track captions and
biological timing labels, ordinal trends, transport controls, causal transcript, Why trail and
evidence panel; Explore with a keyboard anatomy tree.

Executed: 361 tests including 25 integration tests that drive the real application over a stubbed
static host. Preview shell 126 KB gzip.

Defect found and fixed during testing: nested tree items both handled one keyboard event, so
Enter on a child also selected its parent.

### W4 — 3D anatomy and spatial navigation (`ac45793`)

Lazy-loaded React Three Fiber renderer built from project-authored primitive meshes and semantic
anchors: no external asset, no licence question, and no mesh name dictating anatomy. Bounded
orbit, body and brain camera presets, per-view orientation memory, spoken orientation, route
tubes with sign shapes at the target end, deterministic pulses derived from the cursor, label
collision with an always-present overflow list, quality watchdog, and automatic fallback to the
2D diagram when WebGL is unavailable or its context is lost.

Executed: 384 tests, including 20 unit tests of the coordinate convention, camera bounds, label
placement and quality adaptation, and 3 integration tests of the fallback. Manual browser check
at `http://localhost:5173`: body renders, regions are pickable, routes show sign and transport,
labels track the camera, deep link restores the authored step paused.

Build sizes at this commit (preview build, gzip): shell 129 KB against the 350 KB budget; lazy 3D
chunk 245 KB against the 500 KB budget.

Defect found and fixed during the browser check: changing only the `step` parameter of an address
already open did not move the cursor, because the lesson only applied a step on load.

### W6 — Predictions and local learning state (`182cee8`..`8b73a9d`)

Checkpoint question/feedback interface shared by journeys, states and exercises: assumptions,
2–4 options, explicit Check answer that never submits on selection, feedback with words and an
icon, the chosen option's authored mechanism feedback, the best answer and the evidence; Skip
and continue; depth changes reword without touching the answer. Local learner record under
`human-signals:progress:v1` per document 05 — 500 attempts and 500 families with conservative
overflow, version adoption into bounded history with exposure carried forward, multi-tab merge
by stable attempt id — plus the exposure reverse index over the authored
timeline/relationship/exposure-explanation IDs, wired to lesson opens, Why relationships and the
explanation on screen. Learn page (`/learn`, primary nav) with local-only explanation, suggested
sequence, practice/transfer exercises and per-objective counts that always carry denominator and
exposure rule; no percentage, score or badge. Storage unavailable/full/corrupt leave every
teaching action working with one nonblocking notice; one confirmed reset clears the key and the
live session's exposure (epoch remount); a cross-tab reset clears this tab too.

Defects found and fixed during review and browser checks: the effect-firing reducer stored two
attempts per submit under StrictMode (effects now travel with session state and drain once after
commit); playing past a reveal with interruptions off recorded no exposure and finishing by any
route now exposes every family like the summary (document 06); the card showed the practice note
on a first answer, so repeat classification moved into the engine, decided at checkpoint open;
integrated tests waited on exact values of a moving cursor and raced the initial seek.

Executed at `8b73a9d`: `npm run verify` (typecheck, lint at zero warnings with boundary check,
content validation, coverage) and 446 tests including the checkpoint, progress and Learn
integration flows over the real app, one acceptance-map traceability test for AC-01..AC-18, and
an 11-check Playwright pass against the built preview (`scripts/w6-browser-check.mjs`):
interrupt, no auto-submit, wrong-answer correction, evidence open/close, continue, Learn counts,
reset, storage-denied teaching. Preview build at this commit: shell 129 KB gzip, lazy 3D chunk
240 KB gzip. Not run here: physical-device performance (G5), screen readers (G5), and e2e specs
beyond the Playwright smoke (tests/e2e from quality bar sections C4/D remain W9 work).

## Blocked, and why

**G4 — scientific and asset readiness.** No physiology in this repository has been reviewed, no
source has been read and recorded, and no asset licence exists. `content/reviews/` holds empty
ledgers, which is the honest state; the fabrication guard fails any commit that adds a citation
or approval without a human entry, and `npm run build` refuses to produce a production artifact.
This is the specification's intended outcome, not an oversight. Resolving it needs a qualified
physiology reviewer and source access, which are the project owner's to arrange.

All engineering continues on the fictional development bundle in `content/fixtures/`, which is
excluded from any production build by the publication gate.
