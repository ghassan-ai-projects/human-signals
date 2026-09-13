# Implementation evidence

What was actually built, what was actually run, and what is still blocked. Nothing in this file
is a prediction: a check appears here only after it was executed at the recorded commit.

Quality bar: [quality-bar.md](quality-bar.md). Specification: [../README.md](../README.md).

## Status summary

| Gate | Status | Basis |
|---|---|---|
| G1 contract and engine | **pass** | VAL rule fixtures, projection properties, controller transitions |
| G2 product flows | **in progress** | 2D slice, explore, search, loading and failure paths covered |
| G3 access and robustness | **in progress** | keyboard and 2D/3D structure-selection parity covered in jsdom and desktop/390 px browser checks; screen-reader and physical-device runs remain |
| G4 scientific and asset readiness | **blocked** | the preview body asset now has verified provenance and a recorded licence, but no qualified scientific review or approved release hash exists |
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


### W5 completion — comparisons, glossary in place, source index (`165d55c`..`27b01e5`)

The remaining W5 deliverable. The fixture gains full comparison cells for Beta and Gamma
(Gamma's misconception row authored `not-comparable`) and a curated Alpha/Beta pair essay, all
fictional. The `/compare` route and primary-nav entry offer two selectors with a prompt for the
missing choice, polite rejection of identical pairs, curated starting pairs, the curated essay
with its own evidence, and all eight authored dimensions plus related lessons as aligned rows
with per-cell evidence and context labels; `not-comparable` keeps its authored reason and a
missing value is labelled rather than invented. Pair and depth travel in the URL; malformed or
unknown identifiers recover without substituting content. Why-panel glossary terms now expand in
place with focus and `aria-expanded`, preserving cursor and trail; About lists the bundle
references as a source index with an honest empty state. The evidence overlay moved into a
shared `useEvidenceOverlay` hook for lesson and compare.

Executed at `27b01e5`: `npm run verify` (typecheck, lint zero warnings, content validation,
coverage — statements 98.9%, branches 93.9%) and 460 tests including 13 compare integration
cases, the glossary-in-place case, the source-index case, and the AC-08 acceptance-map entry
moved from a blocked gate to automated coverage (390 px visual review stays a G5 note). A
12-check Playwright pass (`scripts/w5-compare-check.mjs`) against the built preview at 1280 px
and 390 px: curated flow, eight aligned rows, per-cell evidence with focus restore, column-only
switching, identical-pair rejection, shared-URL reload on a phone viewport with zero horizontal
overflow. The code review confirmed depth parity, honesty and safety claims and its findings
(a shared evidence-overlay hook, the missing prompt for a b-only URL, stacked recovery
statuses, glossary state carrying across relationships) were fixed before the final commit.

### W7 — Parallel human states (`8d24530`..`beb8991`)

The invented alarm state (`state-fictional-alarm`, fixture-only): three ordered tracks — fast
route, slower carried route, slowest regulation — on the engine's single shared cursor, with
qualitative timing bands, two state checkpoints whose reveals match authored steps, and the
authored shared-organ schedule (the intermediary is highlighted by the fast route at 5 s and
re-highlighted by the carried route at 30 s as the source of its own signal). Trends change
only at authored events and the end state never auto-resets. The track panel gains a true
focused view: non-focused tracks collapse to their step label while the transcript keeps every
track's contribution, announced with a status note. A phone-width defect found by the new
browser check was fixed: the 3D canvas holder's 4/3 aspect with a 320 px min-height forced
427 px width on a 390 px viewport; below 480 px it becomes square.

Executed at `beb8991`: `npm run verify` (typecheck, lint zero warnings, content validation,
coverage) and 473 tests, including 7 integration cases over `/states` and the state lesson
(catalog card, per-track steps at the simultaneous instant, qualitative-only timing, shared-organ
schedule, repeat-as-practice on reload, focused view), and 6 engine tests (event-array-order
invariance as the no-last-render-wins guarantee, persistence to duration with no automatic
baseline, VAL-008 rejection of same-instant same-property writes on real content). A 9-check
Playwright pass (`scripts/w7-state-check.mjs`) against the built preview at 1280 px and 390 px:
catalog flow, three tracks in authored order, focused view, state checkpoint, authored trend
change, zero horizontal overflow on both widths. The code review found and I fixed a caption
contradiction (fast track claiming the carried route still travelling after its arrival), a
never-visible carried edge, and test-honesty items. Not run here: real-device performance
(G5), screen readers (G5); real Stress biology remains G4/W8.

### W8-A — Provenance-first real 3D body model seam (`123093d`..`6ec0310`)

The renderer now loads a self-hosted MakeHuman Community base-human GLB only after verifying its
exact delivered bytes and SHA-256. The tracked preview asset is 644,084 bytes with SHA-256
`39795b09c03340e6a831a92a76243dc04bcd6dbf25e221e161e4a251211396b8`, sourced from the pinned
MakeHuman revision `1f508f6083b2f823dab15de924b3bde72e08d77c`. Its ledger records CC0-1.0,
canonical licence URL, attribution and the normalization/export modification. Mesh names do not
assert anatomy claims; the fictional bundle remains visibly labelled as draft preview content.

The runtime path is bounded and recoverable: same-origin fetch, byte/hash verification before
GLTF parsing, timeout and abort cleanup, disposal on unmount, and 2D fallback. The 3D module stays
lazy, structure selection is available through keyboard and screen-reader button controls in both
renderers, labels wrap/clamp on narrow screens, and the production resolver cannot use fixture
assets. Asset provenance is now machine-checked: canonical licence identifiers and URLs, pinned
40-character upstream revisions, source/revision binding, and preview-only project fixtures.

Executed at `6ec0310`: `npm run verify` — 488 tests; statements 98.78%, branches 94.52%, functions
98.05%, lines 98.95%. Preview build produced bundle SHA-256
`ea00c4a2e5d9c4eaa367fb01a6794cfd27fa31972aa0ebe22f7745a4b26a8fa6` and scientific SHA-256
`05f226b67c20f24d33901af5cdd94b24a589c768ee1f5a50726501e0b3a0b7b6`. The six executable budget
checks passed: initial shell 138,501 gzip bytes, lazy 3D JavaScript 250,461, manifest/search 578,
content bundle 12,719, lazy body assets 402,891, and frame projection p95 0.29 ms. The managed
Playwright check passed at desktop and 390 px; visual review passed the real GLB render, marker
contrast, narrow labels, and accessible structure selection.

This is an engineering and provenance checkpoint, not scientific approval. G4 remains blocked:
the preview content and asset have no qualified human scientific review, so production publication
continues to fail closed. Next step is W8-B: obtain and record reviewed scientific curriculum and
asset-anchor approval without weakening the 2D fallback or the provenance gate.

## Blocked, and why

**G4 — scientific and asset readiness.** The preview body asset now has a pinned source, recorded
CC0-1.0 licence, attribution, exact byte/hash verification and machine-checked provenance.
However, no physiology in this repository has been approved by a qualified reviewer and
`content/reviews/` remains an empty ledger. The fabrication guard fails any commit that adds a
citation or approval without a human entry, and `npm run build` refuses to produce a production
artifact. This is the specification's intended outcome, not an oversight. Resolving it needs a
qualified physiology reviewer and source access, which are the project owner's to arrange.

All engineering continues on the fictional development bundle in `content/fixtures/`, which is
excluded from any production build by the publication gate.
