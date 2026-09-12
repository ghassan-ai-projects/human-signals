# Product requirements

## Problem and outcome

People often learn names of hormones and neurotransmitters without understanding how sources, transport, targets, context and feedback form a system. Static text separates spatial anatomy from mechanism; decorative animation may hide the same conceptual gaps behind attractive graphics.

Human Signals must let a learner answer six questions about a signaling relationship: what triggered it, where it originated, how it was communicated, where it acted, what changed, and what regulated the response. Its learning outcome is the ability to predict a consequence in an unfamiliar but structurally related system.

The first release is an English-language, browser-based educational application. It uses simplified anatomy and authored qualitative scenarios. It is not a patient model, clinical simulator, diagnostic tool, treatment recommender or quantitative predictor of an individual's physiology.

## Audience and jobs

| Audience | Primary job | Design consequence |
|---|---|---|
| Curious adult or secondary-school learner | Understand a familiar experience without technical vocabulary | State-based entry; plain-language explanations; glossary |
| University learner in biology, nursing, psychology or medicine | Connect pathways, timing and feedback | Standard depth; comparison; active prediction |
| Educator | Demonstrate and share a particular relationship | Stable deep links; explicit citations; controllable animation; 2D view |
| Advanced learner or clinician refreshing a topic | Inspect mechanism and limits | Mechanism depth with receptor/context distinctions and evidence |

Depth is learner-selected, not inferred from age or credentials. R1 has no accounts, classroom management or health-data collection. An advanced explanation is not a substitute for an authoritative clinical reference.

## Experience principles

- The body is navigable explanatory space. Selecting an anatomical region must lead to relevant signaling relationships.
- Movement must encode communication, sequence or feedback. Decorative particle motion cannot imply concentration, vascular anatomy or measured timing.
- Every major claim must be inspectable. A causal claim and an association must look and behave differently.
- Depth changes explanation and optional detail, never the underlying facts or evidence strength.
- Reading, keyboard exploration and 2D navigation must teach the same core relationships as 3D.
- Learners control pacing, motion, depth, interruptions and resets.

## Release boundary

**R1 must include:** whole-body schematic anatomy and a brain detail view; search and anatomy navigation; all 14 signal pages, 9 journeys, 3 states and 3 curated comparisons in the curriculum; three explanation depths; recursive Why; relationship-level evidence; qualitative multi-track playback; in-context predictions; local learning progress; shareable links; reduced-motion and non-WebGL operation.

**R2 candidates:** serotonin pathways and dopamine/serotonin comparison; exercise and sexual-response states; reproductive axes; broader brain regions and receptors; additional state/context variations; localization; educator curation.

**Explicitly outside R1:** quantitative concentration simulation, free-form intervention sliders, disease/patient models, drugs/doses, advice based on symptoms, biosensor integrations, natural-language AI tutor, generative scientific content, accounts/sync, commerce, custom lesson authoring UI, multiplayer, full anatomy atlas, VR/AR, photorealistic tissue, cellular/molecular 3D navigation. R1 mechanisms use text and small diagrams, not arbitrary continuous zoom down to molecules.

## Functional requirements

| ID | Requirement | Observable acceptance |
|---|---|---|
| REQ-001 | Support state, signal and anatomy entry | Each entry reaches a relevant journey in at most three deliberate selections from Home |
| REQ-002 | Provide a selectable, rotatable, zoomable whole-body model | Visible and list-based region selection share the same selected entity |
| REQ-003 | Provide body-to-brain detail navigation and depth layers | Back restores the prior camera framing; detail never changes the selected physiological context |
| REQ-004 | Search signals, synonyms, structures and states | Case-insensitive exact synonym resolves; empty and unavailable results are explained |
| REQ-005 | Render ordered Signal Journeys with sources, targets, effects and feedback | A learner can inspect every semantic stage; absent feedback is explicitly explained |
| REQ-006 | Support play, pause, restart, seek, speed and previous/next step | All entry paths render identical state at the same cursor position |
| REQ-007 | Present three multi-system Human States | Parallel tracks and biological timing context remain visible during playback |
| REQ-008 | Separate presentation time from biological time | Scrubbing never reports an invented biological measurement |
| REQ-009 | Provide recursive Why for every journey relationship | Each edge opens an explanation; deeper links terminate or reuse an identified concept without loops |
| REQ-010 | Provide Intro, Standard and Mechanism depths | All published content includes three reviewed depth variants; context and uncertainty remain accessible at every depth |
| REQ-011 | Show claim-level evidence and caveats | Established, context-dependent and uncertain claims are distinguishable without relying on color |
| REQ-012 | Expose supporting references and study scope | Sources, species, evidence type, review date and limitations are reachable from the relationship |
| REQ-013 | Provide two-signal comparison | Same comparison dimensions, independently supported values, explicit “not comparable” cases |
| REQ-014 | Offer predictions at authored journey checkpoints | Playback pauses, feedback explains the mechanism, and a learner can skip without penalty |
| REQ-015 | Support transfer exercises distinct from recall | A held-out prompt is never counted as unassisted transfer after its answer was exposed |
| REQ-016 | Persist local preferences and versioned progress | Reload restores settings and recorded completion when storage works; app works when it does not |
| REQ-017 | Share canonical content links | Direct load and refresh restore selection, depth and optional step in a paused state |
| REQ-018 | Offer glossary and prerequisite explanations | Unfamiliar terms have definitions and return to the original context |
| REQ-019 | Communicate loading, missing content and failures | Defined recovery for network failure, invalid URLs, schema mismatch and 3D failure |
| REQ-020 | Publish only reviewed and licensed content | Production build fails for reachable draft, stale-review, broken-reference or unlicensed records |
| REQ-021 | Give equivalent keyboard, screen-reader and 2D access | All mandatory lesson and assessment actions complete without a pointer or WebGL |
| REQ-022 | Honor motion, contrast and responsive requirements | Reduced motion has no traveling particles or automatic camera movement; small screens retain learning controls |
| REQ-023 | Meet measured delivery and interaction budgets | Thresholds and hardware/browser profiles in document 10 pass |
| REQ-024 | Collect no personal health data or default remote analytics | No login, health input or third-party telemetry; progress can be deleted in one action |
| REQ-025 | Produce deterministic, content-versioned behavior | Same bundle, cursor and user choices yield the same semantic frame |
| REQ-026 | Maintain scientific meaning across every renderer | Edge polarity, route type, scope and time labels match text, diagram and scene |
| REQ-027 | Meet flagship lesson quality criteria | Stress lesson scores at least 9/10 overall and clears every mandatory criterion in document 11 |
| REQ-028 | Ship a maintainable, reversible release | Build manifest, diagnostics, immutable deployment and tested rollback available |
| REQ-029 | Avoid misleading simplification and unsupported claims | No “happiness chemical,” “love hormone,” universal brain-level or personalized physiology claims |
| REQ-030 | Complete the specified curriculum | Public manifest exactly satisfies R1 minimum inventory and coverage constraints |
| REQ-031 | Run as a web app with no authentication, database or backend | Static artifact serves all product flows; progress remains optional browser-local state |

## Success measures

The North Star is **unassisted transfer accuracy on a previously unseen causal problem**, with a separate delayed-retention measure. It is a learning-study measure, not an engagement proxy. Do not claim an improvement from app usage alone.

Early product targets are hypotheses: at least 80% of study participants can start a relevant journey without help; at least 80% can locate feedback and evidence; at least 70% correctly interpret the fast/slower distinction in Stress without claiming an exact onset. Study design and thresholds are defined in document 09. These are not existing measured results.

Operational success means no published unsupported edge, no mandatory WebGL dependency, no lost-content link between synchronized views and no uncontrolled animation during explanation or assessment. Browsing time, completion and answer accuracy may help diagnose usability but cannot establish learning efficacy.
