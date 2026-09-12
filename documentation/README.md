# Human Signals — implementation specification

Status: **proposed product baseline, ready for engineering implementation**. Scientific content and external assets still require the release checks below. Version: **1.0**, 12 September 2026.

Human Signals helps people understand how the body communicates through an interactive, spatial, causal learning experience. The public promise is **“Explore how your body communicates.”** The core teaching sequence is **Trigger → Source → Signal → Target → Effect → Feedback**.

This specification turns the supplied working-backwards vision into a bounded product and an executable engineering plan. It specifies intended behavior; it does not claim that software, scientific review, user research, or testing has already been completed.

## Start here

| Read | Document | Purpose |
|---|---|---|
| 1 | [Product requirements](01-product-requirements.md) | Outcome, audience, scope, numbered requirements |
| 2 | [Experience specification](02-experience-and-interaction.md) | Screens, navigation, controls, all user-visible states |
| 3 | [Curriculum and content inventory](03-curriculum-and-content.md) | Exact first-release coverage and authoring obligations |
| 4 | [Scientific governance](04-scientific-content-and-evidence.md) | Claims, evidence, uncertainty, publication review |
| 5 | [Data contracts](05-domain-and-data-contracts.md) | Content graph, IDs, schemas, validation rules |
| 6 | [Playback engine](06-playback-and-state-engine.md) | Timing, concurrency, prediction, deterministic state |
| 7 | [3D and visual design](07-anatomy-and-visual-system.md) | Assets, anatomy mapping, camera, rendering and fallbacks |
| 8 | [Architecture](08-technical-architecture.md) | Stack, module boundaries, routes, persistence, build |
| 9 | [Learning and assessment](09-learning-and-assessment.md) | Objectives, prediction prompts, transfer evaluation |
| 10 | [Accessibility and quality](10-accessibility-performance-and-security.md) | Measurable accessibility, performance, privacy requirements |
| 11 | [Verification and acceptance](11-verification-and-acceptance.md) | Requirement coverage, scenarios, release gates |
| 12 | [Delivery plan](12-autonomous-implementation-plan.md) | Dependency-ordered work packages and completion evidence |
| 13 | [Operations and release](13-operations-and-release.md) | Deployment, rollback, diagnostics and content maintenance |
| 14 | [Decisions and risks](14-decisions-assumptions-and-risks.md) | Explicit defaults, limits, risks and future expansion |

Supporting material:

- [Normative TypeScript content contract](contracts/content-contract.ts): field names, unions, object shapes. This is a specification artifact, not an installed runtime package.
- [Synthetic engine fixture](examples/synthetic-feedback.json): deliberately fictional content for implementing and testing playback without publishing unreviewed physiology.
- [Original supplied vision](source/product-vision.txt): preserved verbatim. Its award story, testimonials and learning claims are aspirational, not evidence or production marketing copy.
- [Specification checker](check_spec.py): standard-library checks for local links, requirement/acceptance coverage, inventory and fictional fixture frames. Run `python3 documentation/check_spec.py` from the project root. These checks do not validate physiology or replace future application tests.

## Authority and implementation rules

1. The user's subsequent explicit decisions override this baseline.
2. Numbered `REQ-*` requirements and release gates are mandatory for release 1 (R1).
3. The contract file is authoritative for field names and types. Prose adds semantic constraints that TypeScript cannot enforce. The engine document governs playback behavior.
4. The original brief supplies the product intent. This specification resolves ambiguity and deliberately limits initial content breadth. Deferred items are identified, not silently omitted.
5. Do not silently resolve a contradiction by shipping weaker behavior. Record the conflict and decision in a project issue or implementation decision record; continue independent work. Block the affected release gate if unresolved.
6. Build the complete R1 experience before expanding the catalog. No placeholders, fake citations, fabricated testimonials, or “coming soon” entries in the public catalog.

The coding agent may make routine implementation choices within these contracts. It must not invent physiological evidence, credentials, commercial licenses, or reviewer approvals. It can implement, test and preview all features using the synthetic fixture while scientific review remains pending.

## Definition of complete

**Engineering complete:** all R1 features, fixtures, automated checks, 3D and 2D paths, and documented operational procedures pass. This can be demonstrated privately before real content is approved.

**Release complete:** engineering complete plus the exact R1 curriculum is approved, assets are licensed, accessibility and performance checks pass, and deployment/rollback are exercised. A private preview with draft content is not a public release.

**Learning validated:** the separately specified learner study demonstrates transfer. A public release does not by itself establish educational efficacy.

## Repository scope

Only the project README, project metadata and the user-supplied attachment were consulted to prepare this package. No external scientific sources, dependency versions, anatomical assets or prior-project documents were read. Choices below are proposed design decisions. Citation verification and dependency compatibility checks are explicit implementation work, not completed research.
