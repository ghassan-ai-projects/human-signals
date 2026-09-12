# Experience and interaction specification

## Application structure

Primary navigation contains **Explore**, **Human States**, **Compare**, **Learn** and **About & sources**. A persistent search opens a result panel. Home gives equal entry to “Start with an experience,” “Find a signal” and “Explore the body.” First entry is useful without completing onboarding.

Global controls: explanation depth (Intro, Standard, Mechanism), 3D/2D view, reduced-motion preference, help/legend, settings and a local-progress reset action. Browser motion preference is the initial default; a user override can enable more or less motion, with a clear reset to system setting.

## Screen contracts

| Screen | Required content and actions | Empty/error behavior |
|---|---|---|
| Home | Product promise; Stress starter; three entry paths; honest educational scope | If manifest fails, retry and About remain available in the application shell |
| Explore | Search/filter rail, anatomy/diagram canvas, selected item panel, related journeys | Initial “Choose a region or signal”; region with no released lesson says so and lists nearest relevant released items |
| Signal detail | Definition, roles by pathway, source/target relations, related states, evidence, comparisons | Unknown ID shows a recovery page, never a similarly named substitute |
| Journey | Objective, prerequisites, context, stage strip, scene/diagram, transport legend, playback, Why and evidence | Failed content load retains navigation and offers retry; no partial causal chain presented as complete |
| Human State | Scenario assumptions, parallel tracks, qualitative timeline, effects and limits | Unsupported scenario is absent from the picker; an old link reports unavailable content |
| Compare | Two selectors, curated starting pairs, aligned dimensions, context and references | First choice prompts second; identical signal is disallowed; unsupported comparison dimension is explicit |
| Learn | Suggested sequence, local completion, practice and transfer exercises | First-use view explains local-only storage; no fabricated mastery percentage |
| About & sources | Educational scope, simplification policy, content version, source index, licenses, accessibility, local-data controls | Available without the 3D model |

## Desktop, tablet and phone layouts

- At widths of 1200 CSS px and above: navigation rail about 240 px, flexible center with minimum 420 px, detail panel about 360 px. Panels may be resized only within limits that preserve controls.
- At 768–1199 px: collapsed rail; canvas and one detail panel; a visible control opens the catalog. No hover-only labels.
- Below 768 px: one main column; scene preview above content; controls immediately below scene; catalog and details open as full-height sheets. Comparison rows show both selected values together rather than requiring horizontal page scrolling.
- At 320 px and at 200% zoom all essential controls and text reflow. The 2D diagram can pan inside a labeled region and must have an equivalent ordered list. The page itself must not scroll horizontally.
- Sticky playback must not cover focused controls, explanations or mobile browser safe areas. UI touch targets are at least 44 × 44 CSS px, including anatomy controls.

## Selection and anatomy

Hover offers a short label on devices that support hover. Click/tap selects; it does not start playback. Selection highlights the mesh, the corresponding list entry and the panel heading. A second click keeps selection; deselect via explicit “Clear selection.” Escape closes the top overlay before it affects selection.

When multiple nested regions are under the pointer, select the most specific visible pickable region. A selected obscured region gets a label and a show-region action; do not force learners to guess through translucent tissue. Left/right labels are the body's anatomical left/right, never camera-relative.

The keyboard anatomy tree groups body regions and brain structures. Enter selects. Up/down move through visible items; left collapses/returns to parent and right expands. The tree is the primary accessible navigation equivalent of the scene. Region selection lists all published relations involving that region; “View journey” opens a relevant authored sequence.

Orbit is drag; pinch/wheel zoom is limited; keyboard and labeled buttons offer rotate left/right/up/down, zoom and reset. Camera changes are bounded to prevent entering clipping geometry. Selecting a journey may frame the relevant region once if motion is allowed. Subsequent playback highlights do not repeatedly steal the camera. “Follow pathway” is an explicit optional toggle, off by default.

## Signal Journey flow

1. Open paused on an overview showing objective, biological context and the entire stage sequence.
2. “Start journey” enters step 1 and plays unless reduced motion is on; in reduced motion it enters step 1 paused.
3. A caption describes the current relationship and distinguishes source, transport and effect. The route legend stays reachable.
4. Selecting a stage or using previous/next seeks to its authored cursor. It is always paused afterward.
5. Selecting an active edge opens Why. Both Why and evidence automatically pause; closing them leaves playback paused. The learner chooses to resume.
6. At completion, show “Journey completed,” a causal summary, an optional transfer exercise and related journeys. Completion means reaching the end, not mastery.

Every step exposes the named relationship independent of animation. Feedback edges are in the stage strip and accessible transcript. Stages can repeat; do not force a multi-signal axis into six single nodes. “Signal” may occur several times before a terminal effect.

## Human States

Each state opens with an authored scenario description: trigger, context, exclusions and known variability. R1 state choices are fixed lessons, not user-supplied stress intensity, hormone levels or body characteristics.

The timeline has a **lesson position** scrubber and a separate **biological timing** label. Parallel tracks use named systems and pattern/icon cues. A track can be focused visually; muting a visual track never removes its contribution from the text or silently changes physiology. “Show all tracks” restores the full view.

Stress shows fast sympathetic communication and a slower endocrine cascade together. These are qualitative teaching bands, not a universal onset clock. At any time learners can inspect the caption, both track summaries, current effects and relevant evidence. Trend strips use labeled categories (e.g. “increasing in this scenario”), not quantities, percentages or measured-looking axes.

## Why, evidence and glossary

Why opens a panel for one relationship. Header: source → relationship → target, followed by the active depth explanation, context and a visible evidence badge. Up to three deeper questions appear at each level. Breadcrumbs preserve the explanation path; Back returns within the panel. A terminal explanation says “This is the deepest explanation in this lesson” and offers sources or a prerequisite concept.

The graph may reuse concepts but explanation traversal must not loop. After four nested explanation levels, present deeper links as explicit related concepts that start a new trail. This is a navigation limit, not an unsupported claim that the mechanism is fully explained.

Evidence opens a side panel on wide screens or a sheet on small screens. Sections: **What is claimed**, **Where it applies**, **Support**, **Human/animal/in-vitro/model evidence**, **References**, **What remains uncertain**, **Reviewed on**. Use category labels, not five-dot precision scores. A causal link and an association have separate labels.

Glossary terms are buttons/links with visible focus. Opening a term preserves the current playback cursor and explanation trail. Closing restores focus to the invoking control. External sources open safely in a new tab and are labeled as external; unavailable sources retain bibliographic text.

## Comparison

R1 compares signals, not arbitrary organs or entire states. The curated defaults are adrenaline/cortisol, insulin/glucagon and T3/T4. Any two released signals can be selected; only authored dimensions may be shown.

Rows: signal type, principal sources in covered contexts, transport mode, target/context, effects, timing description, feedback/regulation, common misconception, evidence and related journeys. Mixed roles are represented as lists by context. Shared terminology never implies interchangeable action. No side-by-side concentration curves or single scalar “strength.”

Changing one choice updates only that column, sets playback to paused if leaving a lesson, and updates the URL. Each cell has its own evidence access. Differences may be emphasized in bold and with a labeled marker; color is supplementary.

## Prediction interaction

At a checkpoint pause before revealing the specified next event. Show one question, scenario assumptions, answer options and “Skip and continue.” No countdown, score shaming or automatic submission. Selecting an option does not submit until “Check answer.” Before submission, keyboard and pointer selection behave identically.

After submission, show correctness with words and icon, mechanism-based feedback for the selected option, the correct explanation, Why/evidence and “Continue.” Continue resumes only if motion is allowed; otherwise it advances paused to the next authored step. Do not auto-advance while feedback is being read. Changing depth must not change the question's answer.

Practice retries are allowed and recorded separately. Forward seeking past a prediction bypasses it and records answer exposure when the revealing event becomes visible. Returning to that checkpoint can show a practice prompt, but never classify it as an unassisted first attempt. See the engine and learning specifications.

## Route and focus transitions

Navigation pauses playback, clears transient overlays and announces the new page heading. Browser Back returns to the previous route in a paused state. It restores the route's selection and depth, not an old running animation. Dialogs trap focus and support Escape; persistent panels do not trap focus. Closing a panel restores the invoking control if it still exists, otherwise the current content heading.

The search palette is available with a visible button and `/` when focus is not in an editable control. Input uses labels and a clear action. Search matches case-insensitive names, aliases and glossary terms, groups results by entity type and orders exact name/alias matches before prefix and token matches. Use deterministic local search; no remote queries. Diacritics are folded for matching, displayed spelling is preserved.

## Product copy rules

Use “in this scenario,” “schematic route,” and “biological timing varies” where applicable. Do not make every sentence cautious if the relationship is established, but keep scope visible. Use “lesson complete,” not “you mastered physiology.” Show “Saved on this device” only after a successful storage write. Show a nonblocking “Progress cannot be saved in this browser” once per session if writes fail.
