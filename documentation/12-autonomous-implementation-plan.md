# Autonomous implementation plan

## Instructions to the implementing coding agent

Build the R1 web app described by this package. Treat this specification as the acceptance contract. Preserve the static-only scope: no authentication, database, backend or remote analytics. Do not expand into R2 content until all R1 engineering requirements are met.

Read the documentation index and the applicable work-package documents before editing. Inspect the actual repository state and any current project instructions. Make routine implementation choices independently. When a task depends on real sources, reviewer sign-off, licenses or deployment credentials that are not available, complete independent engineering and report the exact blocked gate; do not fabricate evidence or stop all useful work.

Keep changes focused and review your own work. Add meaningful tests for new behavior and regressions. Commit only when the user's implementation instructions authorize commits; this plan does not itself authorize pushing, merging, publishing, purchasing assets or contacting reviewers.

## Dependency graph

```text
W0 Bootstrap → W1 Content contracts → W2 Engine → W3 2D vertical slice
                                      │               │
                                      │               ├→ W4 3D navigation
                                      │               ├→ W5 Why/evidence/compare
                                      │               └→ W6 Learning/progress
                                      │
                                      └──────────────→ W7 Human States
W1 → W8 Scientific content and assets ─────────────────────┐
W3..W7 → W9 Integration/accessibility/performance ──────────┤
                                                         ↓
                                                   W10 Release readiness
                                                         ↓
                                                   W11 Learning validation
```

These are workstreams and dependencies, not instructions to spawn subagents. Implement sequentially or delegate only if explicitly authorized by the user/project instructions.

## W0 — Reproducible project foundation

**Deliver:** minimal React/TypeScript/Vite web app, hash routes, CSS tokens, error boundaries, test tools, pinned runtime/package lock, npm script contract, source folder structure and implementation evidence index.

**Verify:** clean install, typecheck/lint, shell browser smoke test, static-host route refresh and initial transfer budget. Confirm no auth/database/server dependencies or external telemetry.

**Done when:** the shell runs from a static build and test setup is reproducible. Do not build generic platform services or empty feature scaffolding beyond what the next slice uses.

## W1 — Runtime content contract and compiler

**Deliver:** strict runtime schemas corresponding to the normative TypeScript file, indexed content queries, graph/timeline/reference validator, deterministic compiler, manifest hash checks and private synthetic bundle.

**Verify:** every VAL rule has at least one relevant invalid case; content compilation is deterministic; fixture mode cannot pass production publishing; loader handles bad hash/schema and missing records.

**Done when:** valid fictional data can load and invalid/unsupported production content fails closed with useful errors. The real scientific bundle may remain draft.

## W2 — Deterministic playback and session controller

**Deliver:** pure projection, reducer, monotonic clock adapter, play/pause/seek/restart/speed, checkpoint state, exposure tracking, hidden-tab handling and reduced-motion semantics.

**Verify:** synthetic fixture checks and property tests; dropped-frame checkpoint; seek/replay identity; timing conflicts; question submit/skip/continue; no background catch-up.

**Done when:** the engine works without React/WebGL and every path to the same cursor yields the same semantic frame. No numerical physiological simulator is added.

## W3 — Complete accessible 2D vertical slice

**Deliver:** Home, Explore, one fictional private lesson with stage strip, anatomy tree, SVG diagram, transcript, controls, search, depth changes, glossary, routes, loading and error states.

**Verify:** keyboard-only end-to-end lesson, deep-link refresh, 320 px/200% zoom, motion-disabled stepping, panel focus and search aliases.

**Done when:** the primary learning loop can be completed with no 3D dependency. Fictional labels and preview banner remain visible.

## W4 — 3D anatomy and spatial navigation

**Deliver:** lazy body/brain renderers, semantic anchor mapping, primitive/original or licensed meshes, hit targets, camera presets, view transitions, route styling, label collision rules and fallback.

**Verify:** 3D/tree/2D selection parity; source/target/feedback sign; anatomical left/right; brain return framing; GLB bounds/hashes; context loss; idle rendering and memory cleanup.

**Done when:** 3D adds spatial understanding, remains within budgets and failing it preserves the full 2D lesson. Do not wait for expensive assets to test the renderer.

## W5 — Why, evidence, comparisons and content navigation

**Deliver:** finite explanation trails, contextual evidence panels, references/glossary, signal detail, generic two-signal comparison, curated pair pages and relevant links.

**Verify:** depth parity, Why cycle rejection, context retention/focus, evidence type distinction, safe external links, aligned mobile comparison and all eight comparison dimensions.

**Done when:** every visible relationship can be interrogated without changing playback or inventing new content. A missing scientific claim is an authoring error, not a generated fallback.

## W6 — Predictions and local learning state

**Deliver:** checkpoint question/feedback interface, optional interruptions, Learn page, exercise route, local preferences/progress, exposure map, repeat handling, storage errors and reset UI.

**Verify:** no duplicate submit; exposure on hints, seek, summary and deep links; first attempt vs practice; multi-tab merges; storage unavailable/full/corrupt; bounded records and version invalidation.

**Done when:** learning interactions work entirely in the browser, without personal data, account or database. No unverified mastery score is introduced.

## W7 — Parallel Human States

**Deliver:** multi-track state display using the same engine, shared ordinal trends, focused-track view, independent biological labels, authored shared-organ event resolution and state predictions.

**Verify:** simultaneous events; track ordering; persistent/cleared effects; state questions; no last-render-wins conflicts; same frame across renderers; no conversion to numeric biological values.

**Done when:** the private Stress-shaped synthetic scenario explains fast/slower parallel communication coherently. Real Stress release depends on W8 review.

## W8 — Scientific curriculum and reviewed assets

**Deliver:** all 14 signal pages, 9 journeys, 3 states, 3 curated comparisons, 24+ checkpoints and 6 transfer prompts; contexts/claims/Why/glossary; source verification; real anatomy anchors; licenses and qualified review record.

**Verify:** inventory closure, three depths, consistent comparisons/assessments, source locators, physiological direction/transport/timing, visual review and scientific bundle hash approval.

**Done when:** the approved inventory passes production validation with no fabricated source or sign-off. This is a human-review dependency. If sources/reviewer are unavailable, record `G4 blocked` while W0–W7/W9 continue using fixtures. Do not ask for an account/database as a workaround.

## W9 — Integration and quality hardening

**Deliver:** full browser flows, fault recovery, manual accessibility report, responsive visual QA, budget traces, privacy/network audit and optimized assets.

**Verify:** AC-01 through AC-16 on the appropriate fixture/real-content build, baseline devices, memory stress run and no extra endpoints/third-party traffic.

**Done when:** G1–G3 pass and measured G5 technical thresholds pass. Required scientific/learner checks remain explicitly separate; do not state all gates pass if they did not run.

## W10 — Production readiness and optional deployment

**Deliver:** immutable production artifact, release manifest, host configuration, cache/header policy, correction procedure, rollback rehearsal and final acceptance report. Deploy only when authorized and a target host is chosen.

**Verify:** exact content review/hash, all required content, scientific/visual QA, flagship rubric, direct-link refresh, CSP, no fixture strings, no auth/database, 3D/2D smoke test and rollback.

**Done when:** G1–G6 pass. If deployment is not authorized, report “production artifact ready; not deployed” with artifact location and commands. Never imply local tests establish a live deployment.

## W11 — Learning validation

**Deliver:** actual study protocol/results using the objectives and held-out forms, with recruitment/exposure/attrition documented and delayed follow-up if claiming retention.

**Verify:** predeclared scoring, no answer leakage, appropriate caveats and transparent failures. Additional assessment forms require review.

**Done when:** G7 is supported by actual evidence. This does not block engineering completion and cannot be manufactured by an automated UI test.

## Per-work-package review loop

1. State the behavior and requirements being changed.
2. Inspect root cause when fixing a failure; use the 5 Whys only as far as evidence supports, not as a ritual list.
3. Implement the smallest coherent change.
4. Run focused tests and relevant contract checks.
5. Review for scientific/UI consistency, simplicity, reliability, security and accessibility.
6. Fix findings and rerun affected checks.
7. Record what passed, what was not run and why, and the next dependency.

At each checkpoint update the implementation evidence index with work package, requirement IDs, files/commit if applicable, tests, current content/build hashes, unresolved gate and next action. Avoid repeated broad audits after an unchanged passing gate.

## Expected final implementation handoff

The coding agent's final report includes: implemented R1 scope; local startup/build instructions; engineering/public/learning-validation statuses; current version/hash and exact artifact path; tests with actual outcomes; accessibility/performance evidence; scientific review and asset provenance; remaining blockers; and whether anything was committed, pushed or deployed. No generic “done” when public scientific review is pending.
