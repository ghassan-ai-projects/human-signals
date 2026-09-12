# Quality bar

This bar is the pass/fail contract for the Human Signals implementation. It is derived from
documents 10 and 11 of the specification and is intentionally machine-checkable wherever a
machine can check it. Anything that a machine cannot check is listed as an explicit human gate
and is never reported as passing on the strength of an automated run.

`npm run verify` runs every automated item in sections A–F. A work package is not "done" until
`npm run verify` passes at that commit.

## A. Types, lint and structure

| # | Criterion | Check |
|---|---|---|
| A1 | TypeScript strict, no errors, including scripts and tests | `npm run typecheck` |
| A2 | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax` enabled | `tsconfig` review + A1 |
| A3 | Lint clean at zero warnings (`--max-warnings 0`), including `jsx-a11y` | `npm run lint` |
| A4 | Prohibited patterns absent: `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `any` casts in `src/engine` and `src/content`, remote `fetch` to non-same-origin hosts | `npm run lint` (custom rule set) |
| A5 | The engine imports no React, no DOM and no WebGL | `scripts/check-boundaries.mjs` in `lint` |

## B. Tests

| # | Criterion | Check |
|---|---|---|
| B1 | All unit/integration suites pass | `npm test` |
| B2 | `src/engine/**` and `src/content/**` at >= 90% statements, branches, functions, lines | Vitest coverage thresholds |
| B3 | Every `VAL-001`..`VAL-020` rule has at least one invalid fixture that fails with the expected stable error code | `tests/unit/validation-rules.test.ts` asserts full rule coverage |
| B4 | Every acceptance scenario `AC-01`..`AC-18` maps to at least one named test, or is recorded as a human gate with a reason | `tests/acceptance-map.test.ts` |
| B5 | Engine determinism is property-tested: direct projection == playback == seek-back-and-forward == replay, over generated bounded timelines | `tests/unit/engine-properties.test.ts` |
| B6 | The synthetic fixture's eight required assertions from document 06 all pass | `tests/unit/fixture-checks.test.ts` |

## C. Content pipeline and scientific honesty

| # | Criterion | Check |
|---|---|---|
| C1 | Content build is byte-deterministic: two builds of identical inputs produce identical bundle bytes and identical scientific hash | `npm run content:build -- --verify-deterministic` |
| C2 | Production build fails closed on draft claims, missing review, stale review, hash mismatch, fixture content and unlicensed assets | `tests/unit/publication-gate.test.ts` + `npm run build` exit code |
| C3 | Zero fabricated references and zero fabricated reviewer approvals exist in the repository | `scripts/check-no-fabrication.mjs` in `content:validate` |
| C4 | The preview build carries a persistent draft banner and `noindex` | `tests/e2e/preview-banner.spec.ts` |
| C5 | The manifest catalog exactly equals the released inventory; retired IDs are disjoint | VAL-016, VAL-020 tests |

## D. Accessibility

| # | Criterion | Check |
|---|---|---|
| D1 | axe reports zero `serious` or `critical` violations on every route, in both renderers | `tests/e2e/a11y.spec.ts` |
| D2 | A complete journey — open, step, Why, evidence, prediction, submit, complete — is finishable keyboard-only | `tests/e2e/keyboard-journey.spec.ts` |
| D3 | The same journey is finishable with WebGL unavailable | `tests/e2e/no-webgl.spec.ts` |
| D4 | With reduced motion effective: no autoplay, no traveling pulse, no automatic camera motion; manual stepping remains complete | `tests/e2e/reduced-motion.spec.ts` |
| D5 | No horizontal page scroll and all required controls reachable at 320 CSS px and at 200% zoom | `tests/e2e/reflow.spec.ts` |
| D6 | Colour is never the only cue for effect sign, evidence category, answer feedback or track membership | grayscale e2e assertion + human visual review |

## E. Performance and size budgets

| # | Criterion | Threshold | Check |
|---|---|---|---|
| E1 | Initial shell transfer | <= 350 KB gzip | `npm run test:budgets` |
| E2 | Lazy 3D chunk transfer | <= 500 KB gzip | `npm run test:budgets` |
| E3 | Manifest + search index | <= 100 KB gzip | `npm run test:budgets` |
| E4 | Content bundle | <= 1.5 MB gzip | `npm run test:budgets` |
| E5 | Full frame projection at 2000 events / 4 tracks | <= 8 ms p95 | `npm run test:budgets` |
| E6 | No continuous render loop while paused and idle | asserted | `tests/e2e/idle-render.spec.ts` |

## F. Security and scope

| # | Criterion | Check |
|---|---|---|
| F1 | No authentication, database, backend API or remote analytics in source or network trace | `tests/e2e/network-scope.spec.ts` |
| F2 | All runtime requests are same-origin and static | `tests/e2e/network-scope.spec.ts` |
| F3 | Content Security Policy present with no `unsafe-eval`; external citation links are HTTPS with `rel="noopener noreferrer"` | `tests/unit/security.test.ts` + e2e |
| F4 | URL parameters are parsed against known enums/IDs with length bounds; unknown IDs produce recovery, never a network path | `tests/unit/routing.test.ts` |

## G. Human gates — never auto-reported as passing

| Gate | Owner | Status is reported as |
|---|---|---|
| G4 scientific and asset readiness | Qualified physiology reviewer + licence owner | `blocked` until a real review record exists |
| G5 physical-device performance, visual QA, flagship rubric | Project owner | `not run` until executed on real devices |
| G5 screen-reader verification (VoiceOver/Safari + one other) | Project owner | `not run` |
| G6 deployment, headers, rollback rehearsal | Release owner | `not run` until a host is chosen and authorised |
| G7 learning validation | Researcher | `not evidenced` |

## Reporting rules

1. A gate is reported `pass` only when its named check was actually executed at that commit.
2. A check that was not run is reported `not run`, never omitted and never implied to pass.
3. A known failure is recorded with severity, requirement ID, reproduction and next action.
4. No physiological claim, citation, reviewer identity or licence is ever invented to clear a gate.
