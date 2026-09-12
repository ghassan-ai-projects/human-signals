# Verification and acceptance

## Test strategy

Test the risks that can undermine the learning model: incorrect causal representation, nondeterministic playback, unsupported claims, answer exposure, lost state, inaccessible interactions and unmaintainable asset coupling. Tests must assert behavior and contracts, not private component structure or exact implementation snapshots.

Use fictional fixtures for engine and infrastructure tests. Real reviewed content gets separate inventory, consistency, scientific and visual validation. Local development tests require no network, external accounts, adjacent repositories or private data. Browser dependencies are installed during environment setup; normal tests do not fetch changing scientific websites.

## Automated layers

| Suite | Mandatory cases |
|---|---|
| Schema/graph | Every VAL rule; missing/wrong-kind IDs; duplicate IDs; Why cycle; anatomy parent cycle; unsupported causal link; malformed source URL |
| Scientific publishing | Draft/withdrawn claim; stale/mismatched approval; changed asset hash; synthetic bundle; invalid source locator; unreachable required content |
| Engine unit | Projection at boundaries; out-of-range cursor; same-time order; conflicting writes; feedback; independent tracks; replay/seek equivalence |
| Controller unit | Long frame checkpoint crossing; pause/resume/speed; hidden tab; seek bypass/exposure; restart; skip; feedback continuation; reduced motion |
| Learning unit | One best answer; one record per submit; assisted vs unassisted; repeat attempts; exposure families; version invalidation; no coercive assessment |
| Storage integration | Disabled/full storage; malformed version; migration; clearing; multi-tab dedup/merge; bounded retention; write notice accuracy |
| Content-loader integration | Wrong hash/schema/version; missing bundle; timeout/cancel; stale response; retry; atomic content version |
| Renderer integration | Same frame gives same visible semantic IDs in 3D, 2D and transcript; inhibition and association cues; brain/body anchor mapping |
| Component accessibility | Dialog focus, search selection, keyboard anatomy tree, slider labels, comparison headers, announcements and feedback |
| Browser journeys | Home → Stress → Why → evidence → prediction → complete; search → signal → journey; compare; reload shared step; 3D failure fallback |
| Performance | Transfer sizes; interaction/projection timing; frame time; idle render suspension; memory retention |

Use property-based testing for projection idempotence and seek equivalence over bounded valid generated timelines. It is acceptable to use a small deterministic generator instead of another dependency. When testing scientific-content failures, assert meaningful error codes and source paths.

## Requirement traceability

| Requirement | Acceptance scenario(s) | Owner artifact |
|---|---|---|
| REQ-001 | AC-01, AC-02 | Navigation browser tests |
| REQ-002 | AC-02, AC-12 | Picking/tree parity and manual 3D review |
| REQ-003 | AC-02, AC-13 | View transition tests and screenshots |
| REQ-004 | AC-03 | Search fixture tests |
| REQ-005 | AC-04, AC-11 | Timeline/graph tests and content review |
| REQ-006 | AC-05 | Controller tests |
| REQ-007 | AC-04 | State storyboard and browser run |
| REQ-008 | AC-04, AC-11 | Caption/timing review |
| REQ-009 | AC-06 | Explanation graph and focus tests |
| REQ-010 | AC-06, AC-13 | Depth coverage and content review |
| REQ-011 | AC-07 | Evidence component and review |
| REQ-012 | AC-07 | Source integrity and panel tests |
| REQ-013 | AC-08 | Comparison tests |
| REQ-014 | AC-09 | Prediction controller/browser tests |
| REQ-015 | AC-09, AC-17 | Exposure tests and study protocol |
| REQ-016 | AC-10 | Storage integration tests |
| REQ-017 | AC-13 | Static-host deep-link tests |
| REQ-018 | AC-06 | Glossary/back-navigation test |
| REQ-019 | AC-14 | Injected-failure browser runs |
| REQ-020 | AC-11 | Failing publication fixtures and review ledger |
| REQ-021 | AC-12 | Keyboard and screen-reader report |
| REQ-022 | AC-12, AC-13 | Reduced-motion/mobile QA |
| REQ-023 | AC-15 | Measured performance report |
| REQ-024 | AC-10, AC-16 | Network/storage/privacy inspection |
| REQ-025 | AC-05 | Determinism properties and content hashes |
| REQ-026 | AC-04, AC-12 | Cross-renderer semantic assertions |
| REQ-027 | AC-17 | Scored flagship review |
| REQ-028 | AC-18 | Release and rollback evidence |
| REQ-029 | AC-07, AC-11 | Editorial/scientific review |
| REQ-030 | AC-11 | Exact inventory validation |
| REQ-031 | AC-16 | Static-only architecture/dependency check |

## Acceptance scenarios

### AC-01 — Three useful entry points

Given a first-time user with empty storage, Home presents state, signal and anatomy entry. Starting with Stress, searching cortisol or selecting an adrenal region reaches an appropriate journey in no more than three deliberate selections. No sign-in, onboarding gate or account creation appears.

### AC-02 — Anatomy is navigation

Select an organ in 3D and confirm the same entity is selected in the anatomy tree and panel. Select it through the tree and confirm the reverse. Enter brain detail, select a region, return to body and restore the prior orientation. Tiny structures have usable alternative hit/list targets. Anatomical left remains correct in front and back views.

### AC-03 — Search is deterministic and useful

Search mixed-case `EPINEPHRINE` and resolve adrenaline. Prefix queries rank name/alias matches before other tokens. Empty input shows initial suggestions; zero matches provides clear recovery. All results are published entities. Typing in an input does not trigger global shortcut actions. Unknown selection IDs cannot produce arbitrary network paths.

### AC-04 — Stress tells a coherent causal story

Load the reviewed Stress state and play through both principal pathways. Inspect their context, transport distinction, earlier/later labels, selected target effects and regulation. Pause on feedback and confirm source/target/sign match across text, 3D and 2D. No numeric physiological axis is generated from presentation time. Qualitative trends persist/clear only at authored events.

### AC-05 — All routes to a cursor agree

For every synthetic fixture check, compare direct projection, continuous playback, next-step selection, seeking backward then forward and replay. Frames match exactly after normalization of set ordering. A dropped frame stops at an intervening checkpoint. Tab hide pauses without catch-up. Speed changes do not change order, question correctness or biological labels.

### AC-06 — Curiosity preserves context

Open Why, follow deeper explanations to a terminal answer, open a glossary prerequisite and return. The cursor and selected relationship remain fixed. Breadcrumbs work, focus returns and no Why traversal loops. Change depth and confirm meaning/context are preserved. Closing the panel leaves playback paused.

### AC-07 — Evidence is understandable

For causal, associative and context-dependent examples, inspect label, support category, study basis, limitations, references and review date. An association is never rendered as a causal pulse. Each cited locator has actual authoring verification and scientific approval. Browser view-source/bundle inspection reveals no fake references or testimonial claims.

### AC-08 — Comparison is a learning tool

Open adrenaline/cortisol, switch one selection, inspect all eight comparison dimensions and their claims, then load the shared URL on a 390 px viewport. Values remain aligned by row; no universal strength or timing metric is introduced. Same-signal selection is rejected politely; a non-comparable value is explicitly labeled with a reason.

### AC-09 — Predictions do not leak or misclassify

Reach a checkpoint and confirm playback stops before the revealing event. Choose without submitting; no answer appears. Submit once; exactly one attempt is stored. Check wrong-option correction, Why, continue and skip. Seek beyond the answer, return and verify the attempt is practice/exposed. Repeat with predictions disabled and direct-link to a revealing step. An assisted answer never contributes to unassisted transfer results.

### AC-10 — Local progress is optional and erasable

Complete a lesson and reload; local progress and preferences restore. Block storage and repeat; all teaching actions still work. Corrupt storage; recover without breaking the app. Merge two tabs without losing exposure or duplicating an attempt. Reset local progress and verify the progress key and current session's progress/exposure state clear. A separately labeled preference reset clears the preferences key; an explicit “Reset all local data” clears both. No learner data leaves the device.

### AC-11 — Invalid publication fails closed

For each critical validation class, introduce a representative invalid fixture and confirm the production build fails with the expected code. Then build the approved R1 inventory: 14 signals, 9 journeys, 3 states, 3 curated comparisons, ≥24 checkpoint predictions and 6 transfer prompts. Every required item has all depths, Why, citations, context and accessibility text. Extra unreviewed content is excluded from the manifest dependency closure.

### AC-12 — Equivalent access without 3D

Disable WebGL and complete a journey, Why/evidence, comparison and prediction. Repeat keyboard-only and with screen reader. Match every essential semantic relationship against the 3D view. With reduced motion enabled, no traveling pulses, autoplay or automatic camera transitions occur. At 200% zoom and 320 px width all required actions remain reachable.

### AC-13 — State survives navigation and layout changes

Copy a mechanism-depth step URL, open it in a fresh browser context and refresh on a static host. It loads paused on the correct content. Invalid step IDs show the overview with a notice; invalid entity IDs show recovery. Change orientation, view, depth and window size during a question; selection and answer state remain intact. Browser Back returns paused to the previous route.

### AC-14 — Failures preserve learning when possible

Inject manifest/bundle timeout, hash mismatch, missing model, WebGL loss, stale response and storage denial. Verify the exact recovery defined in document 10. A model failure retains the lesson in 2D; a bad scientific bundle does not partially render. Retry has no duplicate controllers, event listeners or requests.

### AC-15 — Performance claims have measurements

Run the fixed lab profile and physical baseline devices against the production build. Record transfer sizes, five-run page metrics, 30-interaction p95 samples, frame/projection traces and memory transitions. All thresholds pass or the release remains blocked. Do not call an untested phone “supported at 60 fps.”

### AC-16 — Static web scope and privacy

Inspect the built artifact and network activity through all major flows. Only static same-origin files are requested except deliberate external citation navigation. No auth pages, credential prompts, database connections, API mutation endpoints, remote analytics or health-data inputs exist. Verify CSP, safe links, URL parsing, local-data reset and dependencies.

### AC-17 — Flagship quality and honest learning status

Score Stress against the ten-criterion rubric below. Attach reviewer evidence and unresolved issues. Complete formative comprehension tasks before public release; report delayed recall and transfer study as “not yet validated” unless actually measured. No marketing efficacy claims until the learning-validation protocol passes.

### AC-18 — Release can be reproduced and rolled back

From a clean checkout and locked dependencies, reproduce the content bundle hash and production build. Deploy to a test static host, exercise deep links and force a rollback to the prior coherent version. App, bundle and asset versions remain consistent. Attach exact build/version/hashes and the smoke-test results.

## Flagship quality rubric

Each criterion receives 0 (fails), 1 (usable but material weakness) or 2 (clear and evidenced). Maximum 20; the source's 9/10 ambition means **at least 18/20**, not nine unchecked opinions.

| Criterion | Evidence for 2 points |
|---|---|
| Causality | Learner can explain the selected transition and its regulation using visible relationships |
| Spatial understanding | Learner locates source and target and explains why their separation/connection matters |
| Time | Learner distinguishes lesson time and variable biological timing; correctly identifies parallel responses |
| Interaction | Observed learner uses inspection/controls to answer a question more effectively than the static overview alone |
| Progressive depth | Novice completes Intro; advanced reviewer finds useful mechanisms without changed meaning |
| Scientific honesty | Every consequential relationship has scoped support and appropriate uncertainty |
| Mental model | Learner applies a recurring pattern to a different example; pilot observation can support initial review |
| Recall | Delayed learner check retains a coherent explanation; without a delayed check score at most 1 |
| Curiosity | Related questions are relevant and reachable; observed exploration does not lose the original thread |
| Restraint | Reviewer can identify the instructional purpose of every animated element |

For public R1, causality, time, scientific honesty and progressive depth must each score 2; no criterion may score 0; total ≥18. If interaction/recall/transfer evidence is unavailable, record the lower supported score rather than inventing user research. The engineering gate does not require these human evaluations; public release does.

## Gate matrix and evidence folder

At implementation time, record evidence under `documentation/implementation-evidence/` with a concise index. Do not prepopulate pass reports.

| Gate | Required evidence | Blocks |
|---|---|---|
| G1 Contract/engine | VAL fixtures, projection/controller tests | Engineering completion |
| G2 Product flows | Browser, storage, route and comparison tests | Engineering completion |
| G3 Access and robustness | 2D parity, keyboard, reduced motion, failure injection | Engineering completion; public release adds real-device/screen-reader report |
| G4 Scientific/asset readiness | Exact approved scientific hash, references, reviewer and licenses | Public release |
| G5 Quality/performance | Budget report, visual QA, flagship rubric, physical device checks | Public release |
| G6 Operations | Immutable build, host headers, rollback and smoke tests | Public release |
| G7 Learning validation | Study methods, actual results, limits and delayed check | Educational efficacy claims |

Open failures are recorded with severity, requirement, reproduction and next action. Severity 0/1 (scientific falsehood, data exposure, unusable core flow) blocks release immediately. Any unmet mandatory requirement also blocks release even if someone labels it “minor.” A failing review is not approval.
