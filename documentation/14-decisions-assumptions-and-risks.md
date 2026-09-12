# Decisions, assumptions and risks

## Accepted baseline decisions

These defaults allow engineering to proceed without repeated product questions. They are specification decisions, not claims that the user explicitly chose each technology.

| ID | Decision | Reason and consequence |
|---|---|---|
| ADR-001 | Browser web app; static hosting | Matches the user's explicit web-app direction and shareable learning use |
| ADR-002 | No authentication or database at this stage | Explicit user constraint; also excludes accounts, cloud progress and content CRUD services |
| ADR-003 | No backend service | Static lessons, browser playback and local progress satisfy R1 without operational complexity |
| ADR-004 | Authored qualitative playback | Makes reviewed causality and uncertainty tractable; no unsupported numeric physiology |
| ADR-005 | One content graph; two equivalent renderers | Maintains scientific consistency and access without WebGL |
| ADR-006 | React/TypeScript/Vite, Three/R3F, runtime schemas | Familiar browser primitives and explicit contracts; versions verified at bootstrap |
| ADR-007 | Source-controlled JSON and build-time compiler | Reviewable changes and reproducible releases; no CMS/admin UI |
| ADR-008 | Whole-body and brain detail with 2D mechanism insets | Provides useful spatial depth without building a full anatomy atlas |
| ADR-009 | Three fixed explanation depths | Consistent content review and learner control; no runtime-generated explanations |
| ADR-010 | Claim-level categorical evidence | Separates support, causality and context without false numeric precision |
| ADR-011 | One shared presentation cursor for state tracks | Prevents independent playback drift and missed interactions |
| ADR-012 | Local-only formative assessment | Enables predictions while avoiding learner accounts and sensitive-data collection |
| ADR-013 | Hash routes and immutable bundles | Portable static deployment and reliable deep links/version consistency |
| ADR-014 | Bounded curriculum, complete experiences | Nine journeys and three states demonstrate all product pillars before expanding breadth |
| ADR-015 | Qualified scientific review required for publication | Code correctness cannot certify physiology, sources or anatomical depiction |
| ADR-016 | Synthetic engineering fixtures are visibly separate | Autonomous implementation proceeds without fabricated scientific approval |

## Assumptions and how to resolve them

| Assumption | Default now | If changed |
|---|---|---|
| Audience/language | General adult/secondary and university learners; English | New localization/content review plan; avoid assuming a clinical audience |
| Commercial model | No account, payment or monetization features | Separate product requirement before any implementation |
| Brand | Human Signals; supplied tagline; restrained original visual system | Replace tokens/copy without changing learning contracts |
| Model procurement | Original simplified geometry first | Licensed asset can replace it only after anchor and budget verification |
| Scientific sources/reviewer | Not yet provided or verified | Owner arranges access/reviewer; engineering remains independent |
| Hosting | Static provider not selected | Produce deployable artifact; choose provider only when publishing is requested |
| Privacy | No remote telemetry or health input | New explicit design/privacy review if scope changes |
| Scientific precision | Qualitative, scoped, educational | Quantitative simulation requires a separate validated model and specification |

Only source access, real scientific review, external asset rights, publication target/authorization and actual learner-study participation are external dependencies. None should block building or testing the browser experience with synthetic data.

## Principal risks

| Risk | Early signal | Mitigation / release consequence |
|---|---|---|
| Beautiful animation teaches a false causal story | Source/target/sign/timing differ between caption and scene | Single semantic frame; claim validation; scientific visual review; blocks G4 |
| Biology becomes a deterministic cartoon | Exact concentration curves, universal onset or single-molecule behavior labels appear | Qualitative authored labels, contexts, association styling; remove unsupported numerical UI |
| Scientific authoring dominates schedule | Feature code is ready but claims/Why depths are sparse | Fixed inventory, templates and review workflow; report engineering complete/public blocked honestly |
| 3D does not help comprehension | Learners cannot locate source/target or use the body as navigation | Simplify and test one flagship lesson; maintain fully usable 2D |
| Device performance varies | Slow frame times, thermal pressure, context loss | Asset budgets, no postprocessing, adaptive quality and deterministic fallback |
| Explanation depth becomes inconsistent | Advanced text strengthens claims or Intro erases uncertainty | Three-depth review and shared claim IDs/context |
| Learner results overstate transfer | Exposed questions counted as unseen or repeat correctness called mastery | Family exposure maps and separate study protocol; no efficacy claims without G7 |
| Local state loss frustrates learners | Storage errors or multi-tab overwrite | In-memory fallback, bounded data, merge rules and honest local-only messaging |
| Static deployment mixes content versions | Old HTML loads mutable new bundle | Hash-named atomic artifacts; retained previous releases and fail-safe loader |
| Asset license/anatomy cannot be verified | Model has unclear origin or anchors chosen from mesh appearance | Original schematic geometry and licensed manifest; review anchors independently |
| Content review becomes stale | Old source dates, credible reported correction | Annual review gate and targeted withdrawal/correction workflow |
| Scope balloons into a medical platform | Requests for body inputs, drug sliders, diagnosis or accounts | New explicit scope decision; R1 has no supporting infrastructure |

## Open decisions that do not block coding

- Exact dependency versions after compatibility checks in the implementation environment.
- Final color tokens and original/licensed body geometry, within documented accessibility and performance constraints.
- Source bibliography, specific reviewed brain-region detail and qualified scientific reviewer.
- Static hosting provider and publisher contact/issue URL when deployment is authorized.
- Learner-study recruitment and scheduling for claims of educational effectiveness.

The coding agent should not turn these into a long pre-implementation questionnaire. Use the defaults, prepare concrete reviewable artifacts, and ask only when an external dependency is actually needed.

## Changes requiring a new specification decision

Any authentication/database/backend; quantitative simulation or intervention control; clinical/drug/personalized advice; externally generated scientific answers; learner data leaving the browser; paid assets/services; new reproductive/sexual-response content; assessment certification; offline service-worker behavior; or material reduction of R1 scientific/accessibility gates.

Routine layout refinements, component organization and equivalent implementation optimizations do not require user approval when they preserve this contract.
