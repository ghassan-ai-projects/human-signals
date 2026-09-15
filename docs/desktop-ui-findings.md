# Human Signals: desktop UI findings

Date: 13 September 2026. Status: documentation and live-interface audit; no application code inspected or changed.

## Verdict

Human Signals has a strong learning concept, but the visible interface does not yet express it. It presents the ingredients of a lesson as separate blocks and makes the learner connect them. A compelling physiology product should make the relationship between a source, a signal, a target, an effect, and its regulation the clearest thing on screen.

The redesign should start with information architecture and scientific visual representation. Changing colors, replacing the font, or buying a more realistic body alone would leave the central problems intact.

The recommended direction is a desktop learning workspace with a navigable system/pathway/signal tree, an explanatory visual in the center, a contextual explanation alongside it, and persistent lesson controls. The companion [desktop design plan](desktop-learning-design-plan.md) specifies the intended experience, small interaction details, quality criteria, and delivery order.

## Scope and evidence

- App: `http://localhost:5173/`, inspected on 13 September 2026.
- Desktop captures: 1440 × 1000 and 1440 × 900 CSS pixels. Smaller desktop and physical-device acceptance remain future checks.
- Inspected: Home; the invented alarm state; 3D body and structure controls; 2D exercise and feedback representation; signal selection in Explore; Why and a deeper explanation; evidence; prediction selection and incorrect-answer feedback; curated comparison; Learn; search and no-results recovery; settings.
- Product understanding came from the repository README and product, experience, curriculum, scientific-evidence, anatomy, learning, accessibility, acceptance, decisions, original-vision, and implementation-evidence documentation.
- The review used rendered pages, screenshots, visible accessibility/DOM text, and a rendered-element position measurement. It did not inspect application source, stylesheets, models, content data files, dependency manifests, or tests. No build or application test suite was run.
- The user narrowed the deliverable to desktop during the review. Phone observations are excluded from these findings and the plan.

The running app explicitly identifies itself as a draft. The [implementation evidence](../documentation/implementation-evidence/index.md) describes a fictional development curriculum and a body asset with recorded provenance, with qualified scientific review still outstanding. That distinction matters: invented signal names and absent references are preview limitations, not proof of incorrect published physiology. Conversely, a fictional fixture cannot demonstrate that the eventual anatomy and physiological teaching will be accurate.

This is an expert interface audit, not a learner study, a scientific sign-off, or an accessibility-conformance certification. Learning consequences below are hypotheses to test. No learner-performance score is claimed.

## Findings, in priority order

Priorities mean: **P0** must be resolved before presenting the experience as reviewed physiology; **P1** materially weakens the core learning flow; **P2** reduces clarity, consistency, or polish. Priority does not establish an implementation root cause.

### F01 — P1: the lesson starts too far below its introduction

**Observed.** On the alarm-state page at 1440 × 1000, the initial viewport contains a large title, three large depth choices, prerequisites, and overview material. The visual and Start journey control are below it. The rendered Start journey button was approximately **2,300 CSS pixels from the document top**; the page was approximately **4,898 pixels tall** at that observation. These measurements describe this preview and viewport, not every lesson.

**Consequence.** The introductory screen offers settings and preparation before it delivers an explanatory experience. Starting and orienting are separate tasks.

**Required change.** Put the objective, a meaningful initial visual, the current step, and the start action together in the first desktop viewport. Keep one brief scenario summary visible. Move extended prerequisites and background into reachable disclosures. Essential assumptions must remain adjacent to the claim or question they qualify.

Evidence: [lesson entry](design-review-evidence/03-state-overview-desktop.png), [model and playback](design-review-evidence/04-state-model-desktop.png).

### F02 — P1: information needed together is presented apart

**Observed.** The stage lists precede the visual. Playback follows the model. Current-track captions and timing follow playback. Why and evidence open as additional large sections further down the page. The full transcript repeats the chain below those sections.

**Consequence.** The learner must remember an organ, route, and stage while scrolling to the explanation. The app has synchronized concepts, but the layout does not keep them visually connected.

**Required change.** A stable center visual and adjacent inspector should share the current selection. Keep current caption, route type, sign, and contextual timing beside the visual. Why and evidence replace the inspector's content and retain a visible relationship header. A full reading transcript remains an explicit, complete alternative.

Evidence: [Why](design-review-evidence/08-why-desktop.png), [evidence](design-review-evidence/07-evidence-desktop.png), [prediction feedback](design-review-evidence/06-prediction-feedback-desktop.png).

### F03 — P1: hormone discovery lacks a meaningful organizing structure

**Observed.** Explore presents a flat list of Alpha, Beta, and Gamma, a body-region tree, a separate model-control/structure-selection area, and a detail panel. There is no visible system → pathway → signal hierarchy for the signal catalog.

**Consequence.** The navigation does not show how a signal fits into a larger physiological story. Several regions of the screen offer selection controls, while the learner's next useful action is comparatively weak.

**Required change.** Introduce one coherent explorer sidebar: **Signals / Anatomy**, with **By system / A–Z** within Signals. The system tree groups pathways and their signals. Every group opens a useful overview. A signal may appear under multiple pathways, opening the same canonical signal with that pathway's context. Tree indentation must never imply a physiological causal relationship.

Evidence: [Explore](design-review-evidence/09-explore-desktop.png), [selected signal](design-review-evidence/10-signal-detail-desktop.png).

### F04 — P0 for scientific readiness, P1 for design: 2D does not explain the mechanism clearly enough

**Observed.** The inspected 2D exercise uses a stick-figure body, generic structure labels, and thin routes that converge or cross. A long adjacent legend and repeated Why buttons carry much of the meaning. The fixture is explicitly invented.

**Consequence.** A simplified body outline does not itself explain the chain. The learner must decode labels and crossings to understand direction and feedback. The preview cannot substantiate accurate anatomy.

**Required change.** Make 2D an authored causal map: organized source and target nodes, explicit signal/transport labels, directional connectors, a separate legible feedback return, and a nearby current-step explanation. Add a small, reviewed anatomical locator where spatial context is relevant. Label schematic distances and routes honestly. Do not position fictional exercise structures on a human body in a way that implies real locations.

Evidence: [2D feedback view](design-review-evidence/22-diagram-feedback-desktop.png).

### F05 — P0 for scientific readiness, P1 for design: a body mesh with markers is insufficient anatomy

**Observed.** The 3D view shows a gray external body with generic spherical markers and invented structure labels. Several markers sit around or outside the body silhouette. The inspected preview does not show reviewed glands, organ subdivisions, or a usable brain detail view.

**Consequence.** The body looks like a display object with annotations. It does not yet teach credible source/target anatomy. An asset's license and provenance do not establish anatomical correctness, anchor correctness, or useful learning value.

**Required change.** Establish an anatomical visual specification before replacing assets: correct organ forms and locations, anatomical laterality, explicit source subdivisions, meaningful transparency/cutaways, relevant contextual structures, clear labels, and reviewable source/target anchors. Review the rendered views with a qualified physiology/anatomy reviewer. Use 3D to answer spatial questions and preserve a complete 2D route through the lesson.

Evidence: [body in the lesson](design-review-evidence/04-state-model-desktop.png), [body in Explore](design-review-evidence/09-explore-desktop.png).

### F06 — P1: model controls receive too much space relative to the explanation

**Observed.** Front, Back, Reset, rotate, tilt, zoom, and a second structure list occupy a large adjacent control area. In Explore, this competes with both the catalog and the signal inspector, leaving a relatively small body within the central area.

**Consequence.** Operating the viewer is more prominent than understanding the selected relationship.

**Required change.** Keep a small, labeled orientation toolbar close to the visual. Group extended camera actions under an accessible View controls disclosure. Keep an obvious reset and complete keyboard alternatives. Consolidate structure navigation into the sidebar; retain direct picking and contextual selection without another large duplicate list.

Evidence: [Explore control allocation](design-review-evidence/09-explore-desktop.png).

### F07 — P1: the same interface treatment is used for unlike information

**Observed.** Large rounded white containers surround prerequisites, overviews, legends, playback, questions, current tracks, explanations, and progress. Heavy headings and blue emphasis recur across these different roles. “Visual explanation,” “Follow the authored pathway,” and “Interactive view” occupy space without explaining the current event.

**Consequence.** Functional, scientific, instructional, and navigational information compete at similar prominence. The visual language feels generic and dated because it lacks a clear hierarchy, not because rounded corners or light backgrounds are inherently outdated.

**Required change.** Give each role a consistent treatment: quiet shell, compact navigation, generous explanatory canvas, readable inspector, distinct assessment surface, and restrained status messages. Replace generic implementation-oriented headings with specific learning questions and current relationships.

Evidence: [lesson introduction](design-review-evidence/03-state-overview-desktop.png), [Explore](design-review-evidence/09-explore-desktop.png), [Learn](design-review-evidence/17-learn-desktop.png).

### F08 — P2: typography, alignment, and page framing are inconsistent

**Observed.** The state title is very large and deeply inset. Explore has a different title scale and edge spacing. Compare and Learn begin close to the left window edge and use different apparent content widths. Depth selection occupies three explanatory cards even when the reader is already in a lesson.

**Consequence.** Pages feel assembled from separate screens rather than belonging to one product. Basic orientation controls take attention from teaching.

**Required change.** Define shared desktop frame widths, gutters, a type scale, control heights, spacing rules, and density. Use compact labeled depth choices with brief help on request. Preserve clear heading levels, full text at zoom, and visible selection/focus states.

Evidence: [Compare](design-review-evidence/11-compare-desktop.png), [Learn](design-review-evidence/17-learn-desktop.png), [state title](design-review-evidence/03-state-overview-desktop.png).

### F09 — P1: Home describes the concept without demonstrating it

**Observed.** Home contains a promise, explanatory paragraph, starter link, three text cards, and a scope section. There is no visible signaling relationship or anatomical teaching example on this entry screen.

**Consequence.** The first impression does not communicate the distinctive visual learning experience. A new learner must imagine what following a signal will mean.

**Required change.** Show a clear, paused visual example beside an everyday question and one primary start action. Keep state, signal, and anatomy entries available. A returning learner gets a specific resume action. The private preview must remain visibly fictional; future reviewed lesson titles must not masquerade as available content now.

Evidence: [desktop Home](design-review-evidence/02-home-desktop-1440.png).

### F10 — P1: assessment is useful, but visually detached from its causal context

**Observed.** At the 20-second checkpoint in the alarm state, playback paused. Selecting an answer did not submit it. After an incorrect answer, the interface identified the selected and best answers and provided mechanism feedback. The large question region appeared below playback; reading the full feedback put the model outside the viewport.

**Consequence.** The question interaction supports deliberate thinking, but it can become a separate form rather than reasoning with the pathway.

**Required change.** Keep the unrevealed visual beside the question, using the existing inspector or a deliberate assessment layout. Provide immediate local feedback and a user-controlled visual explanation after submission. No automatic progression while reading. Preserve skip, exposure classification, and the absence of score shaming.

Evidence: [checkpoint](design-review-evidence/05-state-prediction-desktop.png), [incorrect-answer feedback](design-review-evidence/06-prediction-feedback-desktop.png).

### F11 — P1: comparison is presented as a dense reference table

**Observed.** The comparison screen has a large selection/depth area, a pair introduction, and a long table. Context text and Evidence buttons repeat in individual cells. The pair introduction is helpful, but the main contrast receives little visual emphasis within the rows.

**Consequence.** Finding the important distinction requires scanning repeated material. Table completion is more apparent than the lesson the comparison should teach.

**Required change.** Keep aligned, accessible rows and claim-level evidence. Add an authored comparison question and a short summary of the most consequential distinctions. Group rows into Source & route, Timing & effects, and Regulation & limits. Keep selected signal names visible while reading. Collapse shared context only when genuinely identical; cell-specific qualifications stay with their cells.

Evidence: [desktop comparison](design-review-evidence/11-compare-desktop.png).

### F12 — P1: Learn explains bookkeeping more strongly than the next learning action

**Observed.** In the available fixture, Learn leads with local-storage information, counts, attempt-classification rules, and an abstract exercise link. No prominent resume card or concept-based next step was visible.

**Consequence.** The page answers how results are recorded more clearly than what the learner should do next. The exact future curriculum cannot be judged from this fixture.

**Required change.** Lead with Continue learning, followed by a suggested path through communication, feedback, parallel timing, and context. Present progress as completed lessons and practice history. Explain local storage and assisted attempts concisely beside the relevant information, with full rules available on demand.

Evidence: [Learn](design-review-evidence/17-learn-desktop.png).

### F13 — P2: small wording and control details add avoidable friction

**Observed.** Search exposes both an input clear icon and a separate Clear button. Its no-results state says to browse Explore without offering a direct action there. Several visible phrases refer to authored dimensions, fixtures, builds, and content versions. Settings puts several substantial preference groups in a narrow scrolling popover. A transient scene-simplification notice appeared during the audit.

**Consequence.** Repetition and product-internal language increase reading effort. Routine preferences and exceptional rendering status need clearer priority.

**Required change.** Use one explicit clear affordance; provide direct recovery actions; use learner language on ordinary screens; reserve version details for About and diagnostics. Separate quick view controls from deeper preferences. Show renderer fallback messages once, without displacing the lesson or implying that scientific meaning changed. The observed adaptation message does not establish a performance failure; no physical-device benchmark was performed.

Evidence: [search results](design-review-evidence/19-search-results-desktop.png), [search recovery](design-review-evidence/20-search-empty-desktop.png), [settings](design-review-evidence/21-settings-desktop.png).

### F14 — P0 for scientific readiness: evidence presentation needs a clearer preview distinction

**Observed.** Fictional claims display a “Supported · context-dependent” treatment while adjacent text says they are draft, unsourced, and unreviewed. The global preview banner is explicit. Evidence preserves a useful breakdown into claim, context, support, evidence type, references, uncertainty, and review status.

**Consequence.** The visual weight of a support badge can imply stronger verification than the draft text permits, particularly when inspecting a cropped section or returning to a scrolled page.

**Required change.** In private fictional previews, lead with “Fictional example · not scientific evidence” and label support categories as demonstration metadata where shown. In reviewed physiology, show publication status separately from claim support and context dependence. Preserve relationship-level references and limitations. Never add approval badges or references for visual polish.

Evidence: [evidence panel](design-review-evidence/07-evidence-desktop.png), [signal detail](design-review-evidence/10-signal-detail-desktop.png).

## What should survive the redesign

These behaviors were directly observed and are worth preserving:

- The app is usable without sign-in and openly identifies the draft preview.
- Prediction selection requires a separate submission; mistakes receive explanatory feedback.
- Playback pauses for a checkpoint and stays paused while the inspected explanation is read.
- Why has a deeper trail and a defined endpoint.
- Search recognizes an alias and offers a clear no-results message. Escape closes search and returns focus to Search.
- Claim-level evidence separates several useful kinds of information and acknowledges missing sources.
- Controls offer named alternatives to manipulating the body directly.
- Local progress distinguishes practice from an unassisted attempt and does not invent a mastery percentage.

These observations do not establish full keyboard, screen-reader, storage, performance, or scientific compliance across the product.

## Root-cause analysis: five whys

This is a design-level explanation inferred from documentation and the rendered UI. It is not a claim about how the code was written or the team's intentions.

1. **Why does the app feel dated and difficult?** Important information lacks a strong visual hierarchy, and ordinary learning requires considerable scrolling.
2. **Why is it difficult to connect information?** Anatomy, pathway stages, explanations, and practice are arranged as separate sections.
3. **Why do those sections not form a coherent lesson?** The interface organizes the available features more visibly than the learner's immediate question.
4. **Why have functional checks not resolved that experience?** Documented engineering checks establish behavior, while the evidence index still leaves human visual, learning, and scientific gates outstanding. Automated coverage cannot prove those outcomes.
5. **What needs to change first?** Establish one observable desktop learning experience as the standard, then validate its information architecture, visual meaning, and interaction before expanding the design to the whole curriculum.

## Recommended first decisions

1. Adopt a system → pathway → signal tree, with A–Z lookup and a separate anatomy view of the same catalog.
2. Put the visual, selected relationship, explanation, and next action together in one desktop workspace.
3. Redesign 2D as a causal map and define scientifically reviewed 3D anatomy before selecting replacement assets.
4. Prove one complete flagship lesson, including Why, evidence, prediction, and return-to-learning behavior.
5. Use a shared desktop visual system and explicit interaction contracts before propagating the redesign.

The complete specification is in [Desktop learning design plan](desktop-learning-design-plan.md). Nothing in this audit authorizes publication of unreviewed physiology or asserts that the current software has been redesigned.
