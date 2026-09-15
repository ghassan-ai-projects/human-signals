# Human Signals: desktop learning design plan

Date: 13 September 2026  
Status: proposed design direction for review; desktop only  
Companion audit: [desktop UI findings](desktop-ui-findings.md)

## 1. Design brief

Human Signals should make physiology understandable as a system of communication. A learner should be able to enter from an experience, a body region, a pathway, or a signal, then see the same causal model from each starting point.

The product promise is not “look at a 3D body.” It is:

> See what triggered a response, where the message came from, how it travelled, where it acted, what changed, and how the system was regulated.

The core desktop experience must keep five things together:

1. the learner’s current question;
2. the selected system, pathway, or signal;
3. a visual representation of the relationship;
4. a short explanation with context and limits; and
5. the next useful action, usually inspect, predict, or continue.

The current interface has these capabilities, but distributes them down a long page. This plan makes the causal relationship the organizing unit of the desktop UI.

### What “best learning app” means

“Best” is an observable product standard, not a claim that the app is visually impressive.

| Quality | What the learner should experience | Proof before release |
|---|---|---|
| Comprehension | A first-time learner can state the current source, signal, target, effect, and regulation in plain language. | Five formative sessions; no critical confusion in the flagship lesson. |
| Causality | Arrows, bars, route styles, captions, Why, and evidence all describe the same scoped relationship. | Cross-renderer semantic review; no unresolved causal mismatch. |
| Spatial understanding | The body or brain view answers where a relationship is located and why that location matters. | Qualified anatomy/physiology review plus learner task observation. |
| Time understanding | The learner can tell what happens first, later, or in parallel without reading presentation time as a biological measurement. | Stress lesson task and review; no numerical overclaim. |
| Transfer | The learner can use a learned pattern on a structurally related unfamiliar problem. | Reviewed transfer prompts and a separately reported learning study. |
| Trust | Support, context, uncertainty, and review status are visible at the claim level. | No draft, fabricated source, or unsupported edge can appear as released content. |
| Curiosity | Each answer offers a meaningful next question without losing the current trail. | Why, glossary, related-pathway, and return tests. |
| Agency | Learners control pacing, depth, view, and interruptions. | Keyboard and pointer paths complete the same lesson; no forced autoplay or assessment. |
| Clarity | The learner knows where they are, what changed, and what to do next at every point. | Usability review at 1440, 1280, and 1024 CSS pixels. |
| Restraint | Every motion, label, panel, and control has a teaching or orientation purpose. | Flagship rubric: at least 18/20, with causality, time, scientific honesty, and progressive depth each scoring 2. |

The North Star remains unassisted transfer accuracy on a previously unseen causal problem, with delayed retention reported separately. Page views, time spent, and completion are diagnostic signals, not evidence of learning.

## 2. The target desktop experience

At first load, the learner should see a real question and a useful explanation immediately. For example:

```text
What happens when the body detects a threat?

  [ Stress response ]                 [ HPA axis ]
  Two systems respond in parallel.    Follow the slower hormonal route.

  ┌──────────────────────────────────────────────────────────────┐
  │     reviewed visual: source → signal → target → feedback     │
  │     current step is highlighted; the visual is paused       │
  └──────────────────────────────────────────────────────────────┘

  [Start lesson]  [Explore the pathway]  [Why?]  [Evidence]
```

Inside a lesson, the desktop workspace should behave like a focused instrument rather than a document assembled from cards:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Human Signals   Explore  States  Compare  Learn  Search              Settings │
├───────────────┬───────────────────────────────────────┬─────────────────────┤
│ SIGNALS       │ HPA axis                               │ NOW                 │
│ By system     │ What happens during a stress response?│ Cortisol reaches…   │
│               │                                        │                     │
│ Stress        │  1 Trigger → 2 CRH → 3 ACTH →         │ SOURCE              │
│  HPA axis     │  4 cortisol → 5 target → 6 feedback   │ Hypothalamus        │
│   CRH         │                                        │                     │
│   ACTH        │       [2D / 3D / transcript]           │ SIGNAL              │
│   Cortisol    │                                        │ Cortisol · blood    │
│               │       current route and organs          │ TARGET              │
│ Thyroid       │                                        │ selected tissue     │
│  HPT axis     │       ─────────────────────────────    │                     │
│               │  ◀ Why?   Evidence   Glossary          │ [Why] [Evidence]    │
│ A–Z           │                                        │                     │
├───────────────┴───────────────────────────────────────┴─────────────────────┤
│  Previous   Play/Pause   Next        lesson position       1×      Restart    │
└─────────────────────────────────────────────────────────────────────────────┘
```

This is a layout model, not a visual mockup. The exact visual style follows the design tokens below. The important rule is that the tree, visual, inspector, and controls stay in the same working set.

## 3. Information architecture

### Primary navigation

Keep the documented top-level destinations:

- **Explore**: system, pathway, signal, and anatomy discovery.
- **Human States**: authored scenario lessons such as stress, sleep, and meal/fasting.
- **Compare**: two-signal comparisons with an authored learning takeaway.
- **Learn**: resume, suggested sequence, practice, transfer, and local progress.
- **About & sources**: scope, scientific review, licenses, accessibility, and local-data controls.

Search remains available from every desktop screen. It searches signal names and aliases, pathway names, anatomical structures, states, glossary concepts, and lessons. Results show the entity type and its context before navigation.

### The hormone and pathway tree

The tree is the primary answer to the user’s request for a better hormone structure. It is a navigation hierarchy, not a claim that the body is a single tree and not a causal graph.

```text
Signals
├─ By system
│  ├─ Stress response
│  │  ├─ HPA axis
│  │  │  ├─ CRH
│  │  │  ├─ ACTH
│  │  │  └─ Cortisol
│  │  └─ Sympathetic–adrenal response
│  │     ├─ Adrenaline
│  │     └─ Noradrenaline
│  ├─ Thyroid axis
│  │  ├─ TRH
│  │  ├─ TSH
│  │  ├─ T3
│  │  └─ T4
│  ├─ Fed-state regulation
│  │  └─ Insulin
│  ├─ Fasting regulation
│  │  └─ Glucagon
│  ├─ Dopamine pathways
│  │  ├─ Dopamine · endocrine regulation
│  │  ├─ Dopamine · movement
│  │  └─ Dopamine · learning and motivation
│  ├─ Circadian timing
│  │  └─ Melatonin
│  └─ A–Z signal list
└─ Anatomy
   ├─ Whole body
   ├─ Brain and timing regions
   ├─ Endocrine organs
   ├─ Pancreas and target tissues
   └─ Distributed systems
```

The final grouping must follow the reviewed R1 curriculum. The labels above illustrate the intended information shape; they do not authorize a new scientific taxonomy or unreviewed brain structures.

A signal can occur in multiple pathway branches. Selecting a repeated signal opens one canonical signal record with a visible **context lens**, for example `Dopamine · endocrine regulation` or `Dopamine · movement`. The signal’s identity stays stable; the source, target, effect, evidence, and lesson links change only when the selected context changes. A small “also appears in” list lets the learner move between contexts.

The R1 signal inventory should be visible through this model as follows. This is a navigation mapping, not a claim that each row is a complete biological pathway:

| Tree branch | Signals surfaced | Context shown on selection |
|---|---|---|
| Stress response / HPA axis | CRH, ACTH, Cortisol | upstream trigger, pituitary/adrenal route, selected target effects, and feedback |
| Stress response / sympathetic–adrenal response | Adrenaline, Noradrenaline | neural versus circulating route and selected stress context |
| Thyroid axis | TRH, TSH, T3, T4 | axis order, output/conversion context, and feedback |
| Fed-state regulation | Insulin | authored fed-state source, target, and regulation context |
| Fasting regulation | Glucagon | authored between-meals context, target, and regulation limits |
| Dopamine / endocrine regulation | Dopamine, Prolactin | inhibitory endocrine relationship and its scoped context |
| Dopamine / movement | Dopamine | reviewed motor source/target context |
| Dopamine / learning and motivation | Dopamine | reviewed learning context, with association/causality distinctions |
| Circadian timing | Melatonin | light/dark input and timing context, without reducing sleep to one signal |

The same signal name may therefore appear more than once in the tree. The row must expose its lens in a badge or second line so a learner never mistakes two scoped contexts for two different molecules. A signal page also lists every released context, its related lessons, and a `View this pathway` action. Prolactin belongs under the endocrine regulation branch even though its relationship is explained through dopamine; the tree should make that relationship discoverable without making Prolactin a subtype of Dopamine.

Each tree row contains:

- a disclosure chevron only when children exist;
- a type icon or short label (`system`, `pathway`, `signal`, `anatomy`);
- the name and, for signals, a short alias or role;
- an optional count of released lessons;
- a selected state distinct from keyboard focus;
- a tooltip or adjacent description for unfamiliar terms.

Do not use color alone to distinguish a system or signal. Do not use branch indentation to imply that CRH “contains” ACTH or that every branch is a causal chain. The lesson’s stage strip and causal map carry causal order.

### Tree behavior on desktop

- The default open state shows the system branches needed for the current page, plus one level of nearby context. Do not open every branch on first load.
- Clicking a parent row opens or closes it. Clicking its label opens a pathway overview when one exists.
- Clicking a signal selects it and updates the visual and inspector without starting playback.
- “Show all contexts” reveals repeated signal placements without duplicating the underlying content.
- A–Z is a flat lookup view with aliases and pathway badges. It is not a second source of truth.
- The tree has a visible label, a bounded scroll region, and a clear “collapse all” action. Keep tree position when opening Why or Evidence.
- Arrow keys move through visible nodes; Right opens or enters; Left closes or returns to the parent; Up/Down move; Home/End jump; Enter activates; type-ahead finds a node. These behaviors follow the [WAI-ARIA tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).
- Focus must not silently select a different signal. Selection changes on activation, not while the learner merely explores with the arrow keys.

### Pathway overview

Selecting a system or pathway opens a compact overview before any detail page:

1. **Question** — what the pathway explains.
2. **Map** — the reviewed sequence and any parallel route.
3. **Key signals** — source, message, target, and feedback roles.
4. **Context and limits** — where the lesson applies and what it omits.
5. **Start** — one primary lesson action and links to individual signals.

This gives every tree branch a useful destination and prevents the tree from becoming an index of dead ends.

## 4. Desktop shell and layout

### Shared frame

Use one desktop frame across Home, Explore, lesson, Compare, and Learn:

- Preview ribbon: 32–40 px high while draft content is present; text states exactly that it is fictional/unreviewed.
- Primary header: 64 px, with brand, five destinations, Search, and Settings. The active destination has a clear background and text cue.
- Content frame: maximum 1360 px, centered, with 24 px outer gutters at 1440 px.
- Base spacing: a 4 px rhythm with 8 px as the normal unit; section gaps 24–32 px.
- Body copy: 16 px minimum, approximately 1.5 line height; reading measure 60–75 characters.
- Main headings: 36–44 px for a page title, 24–28 px for a section, 18–20 px for a local heading. Avoid all-caps sentences as primary headings.

### Full desktop, 1440 px and above

Use a three-pane workspace for Explore and lessons:

| Pane | Width | Purpose |
|---|---:|---|
| Navigation tree | 264–288 px | Signals/Anatomy tree, filters, current context. |
| Learning canvas | Flexible, minimum 620 px | 2D or 3D view, stage map, timeline lanes. |
| Inspector | 344–384 px | Current relationship, Why, Evidence, Glossary, next action. |

Use 20–24 px gutters. The canvas must remain the visual center; the tree and inspector may scroll independently when their content is long. The page itself should not require repeated trips between unrelated vertical sections during a lesson.

### Small desktop, 1024–1279 px

Keep the tree visible at 224–248 px. The inspector becomes a docked panel with a minimum 320 px width. If the remaining canvas would fall below 520 px, allow the inspector to collapse into a labeled drawer; its open/closed state is explicit and keyboard reachable. Never hide the current relationship without a visible “Open explanation” control.

### Desktop behavior that should not change with width

- The current stage, selected entity, route sign, transport type, and context remain visible.
- 2D and 3D controls keep their labels and keyboard alternatives.
- Stage selection always leaves the lesson paused.
- The page never puts the primary Start, Play/Pause, Why, or Evidence actions thousands of pixels away from the visual they control.
- A long transcript and a comparison table may have their own scroll container, but ordinary prose and controls reflow without page-level horizontal scrolling. The [WCAG reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) is the baseline.

## 5. Screen-by-screen plan

### Home

The first viewport should demonstrate the product’s distinctive learning model.

**Left column**

- Eyebrow: `A visual causal model of physiology`.
- Headline: `See why the body responds.`
- One sentence explaining Trigger → Source → Signal → Target → Effect → Feedback in plain language.
- Primary action: `Start with stress` (or the first reviewed Human State).
- Secondary action: `Browse pathways`.

**Right column**

- A paused, small interactive preview of one reviewed route. It may be 2D by default for speed and certainty.
- A short caption that changes only when the learner selects a stage.
- A `Why this step?` action that opens the same inspector used in lessons.

Below the first viewport:

- three equal entry choices: `Start with an experience`, `Follow a pathway`, and `Explore the body`;
- a returning-learner `Continue learning` card only when local progress exists;
- one concise scope statement and an About link;
- no large list of implementation terms, draft fixture names, or duplicated calls to action.

The preview must never autoplay or imply a measured physiological response. In an unreviewed build, it must be visibly fictional and use the same draft treatment as the rest of the app.

### Explore

Use the three-pane frame:

- **Left:** Signals/Anatomy tabs, By system/A–Z tabs, tree, and a small search/filter row.
- **Center:** pathway map or anatomical view. The view header names what the learner is looking at and the current context.
- **Right:** selected system, pathway, signal, or region. The first lines answer `What is it?`, `Where does it fit?`, and `What can I learn next?`.

The right inspector should offer, in this order:

1. short definition;
2. context lens and role;
3. source/transport/target/effect summary;
4. evidence status and limits;
5. related lessons and `Start this lesson`;
6. `Compare with another signal`.

Do not make the learner choose a structure in both a large viewer list and a separate catalog list. The tree is the primary list; the visual supplies direct picking and synchronizes to it.

### Human State and Signal Journey lessons

The lesson workspace is the central redesign priority.

**Header row**

- Breadcrumb: `Human States / Stress response` or `Signals / HPA axis`.
- Lesson title and a one-line objective.
- Compact depth switch: `Intro`, `Standard`, `Mechanism`. Use a short label and an on-demand explanation rather than three large cards.
- Secondary actions: `Copy link`, `About this lesson`, and a visible `Exit lesson` path.

**Stage strip**

Place the authored steps directly above the visual as a horizontal sequence. For a standard pathway it reads:

`Trigger → Source → Signal → Target → Effect → Feedback`.

For parallel states, use one row per track with a shared left edge and aligned event positions. The strip shows completed, current, and upcoming stages; it never hides a required relationship. Selecting a stage seeks to its authored cursor and pauses.

**Learning canvas**

- View switch: `2D map`, `3D body`, `Transcript`.
- One short sentence: `What this view explains`.
- Visual region with a stable height and no layout jump when labels or routes appear.
- Small orientation toolbar near the visual; extended camera actions are behind `View controls`.
- A compact legend uses icons, line patterns, and words for stimulates, inhibits, modulates, association, source, target, and transport.

**Inspector**

The inspector is a contextual teaching surface, not a duplicate page. Its default `Now` view contains:

- current stage label;
- source → relationship → target header;
- one 40–90 word explanation at Intro, with deeper text available at Standard/Mechanism;
- transport and timing wording;
- a `Why?` action and evidence badge;
- `Next step` as the primary continuation.

When Why or Evidence opens, the same inspector replaces its body while keeping the relationship header and a clear close/back action. The learner should not lose sight of which route the explanation concerns.

**Playback bar**

Keep one persistent bar under the visual and above secondary reading content:

`Previous` · `Play/Pause` · `Next` · `Restart` · lesson-position slider · speed · `Practice questions` status.

The slider label must say `Lesson position`; its value must say `presentation time`. Biological timing stays in the track caption and never appears as an unlabeled number.

**Track lanes**

For Human States, show 2–4 compact lanes below the canvas. Each lane contains a short current caption, qualitative timing label, and `Focus this track`. Focusing is a visual filter only; the transcript and explanation retain all tracks. Use a single shared cursor.

**Transcript**

Keep the complete causal transcript as an explicit tab or drawer. It is an equivalent reading route, not an automatically repeated wall of content below the lesson. Each entry has `Go to this step`, `Why`, route type, sign, and evidence.

**End state**

At completion, replace the playback prompt with:

- `Lesson complete`;
- a three-sentence causal summary;
- one optional transfer prompt;
- related pathway links;
- `Review this lesson` and `Return to Learn`.

Do not use mastery language, a confetti effect, or a score that the learning contract does not support.

### Compare

Keep the accessible aligned table, but make its teaching purpose visible first:

- title and a one-sentence comparison question;
- two signal selectors with names, aliases, and context;
- one authored takeaway, such as `Both signals participate in regulation, but their source, route, and timing differ in this context.`;
- a short `What to notice` list of the three most important distinctions;
- grouped rows: `Source and route`, `Timing and effects`, `Regulation and limits`, `Evidence`;
- per-cell evidence access and context labels.

The table remains a table because alignment is meaningful. Give it a bounded scroll container if necessary, keep row labels sticky, and keep the selected signal names visible. Add one `Test your prediction` action after the takeaway; do not turn comparison into a scorecard or rank signals by strength.

### Learn

Lead with action:

1. `Continue learning` with the last lesson and current stage;
2. `Suggested next` based on the fixed curriculum sequence, not a hidden algorithm;
3. progress by lesson and learning objective, always with denominators and exposure rules;
4. practice and transfer exercises;
5. a concise local-storage explanation and a link to full data controls.

Move attempt-classification details into a disclosure titled `How practice is counted`. Keep the distinction between unassisted, assisted, exposed, and repeat attempts. Never present a proprietary mastery score, percentile, or badge.

## 6. Visual representation plan

### 2D: the canonical explanatory map

The 2D view should be the reference representation for meaning. It must work when 3D is unavailable and remain useful for every lesson.

Use two coordinated layers:

1. **Causal map:** a clean, authored map of nodes and routes.
2. **Anatomical locator:** a small reviewed body/brain inset showing where the named source and target live.

The causal map should use swimlanes or columns:

```text
TRIGGER       SOURCE             SIGNAL / ROUTE          TARGET / EFFECT
┌───────┐     ┌──────────┐       ───────────────▶         ┌──────────────┐
│ event │ ──▶ │ source   │  signal · blood-borne          │ target       │
└───────┘     └──────────┘                               └──────┬───────┘
                                                               │ effect
                                                               ▼
                                                        ┌──────────────┐
                                                        │ output       │
                                                        └──────┬───────┘
                                                               │ feedback
                                                               └─ ─ ─ ─ ──┤
                                                                         ▼
                                                                      SOURCE
```

For real anatomy, the locator carries reviewed anchors; it does not pretend that an abstract route is a literal vessel. For an abstract exercise, use abstract nodes off the body or a clearly labeled abstract canvas. Never place invented organs or signals on a human silhouette in a way that suggests real anatomy.

Rules for the causal map:

- one direction per connector;
- no accidental crossings; route lines use lanes, bends, or numbered joins;
- feedback returns around the outside of the map and is labeled `feedback`;
- route type is explicit: blood-borne, portal, synaptic, local, schematic, or not applicable;
- effect sign is explicit: arrowhead and `stimulates`, terminal bar and `inhibits`, diamond and scoped `modulates`, or nondirectional dashed `association`;
- node labels contain role and name, not only color;
- the current step uses a quiet halo and a bold label, not a glowing body or high-speed particle stream;
- the map has a short description and ordered HTML equivalent adjacent to it;
- the view remains legible in grayscale and when motion is reduced.

Do not encode concentration, effect magnitude, certainty, or biological duration with route width, pulse count, glow strength, distance, or animation speed.

### 3D: the reviewed spatial view

3D should answer a spatial question that the causal map cannot answer as well: where are the source and target, how are they separated, and which broad route connects them?

Required qualities:

- a reviewed, simplified body shell with actual relevant organs and brain regions;
- clear layers or cutaways for the structures needed by the selected lesson;
- correct anatomical left/right convention and front/back presets;
- source/target anchors attached to reviewed semantic structures, never arbitrary mesh positions;
- distinct organ subdivisions where the lesson needs them, such as adrenal cortex/medulla or pancreatic cell classes;
- labels with opaque backplates, collision handling, and a persistent list for omitted labels;
- a restrained route overlay that is visibly schematic where it is schematic;
- a separate brain view with a reviewed mapping from the body anchor;
- direct picking plus the same tree/list alternative;
- a reliable 2D fallback with the same frame, selection, stage, and explanation.

The current gray body with floating spheres fails this purpose. A licensed model can still fail if its anchor placement, proportions, tissue layers, or route interpretation are not reviewed. Asset provenance, anatomy review, and learning usefulness are separate gates.

### Shared frame rule

2D, 3D, and transcript receive the same semantic frame:

`content version + lesson + cursor + selected stage + selected relationship + depth + context lens`.

Changing renderer must never change the claimed source, target, sign, route, timing label, or evidence. If a 3D view cannot show a structure, the UI names the limitation and offers the 2D map or transcript.

## 7. Information presentation and copy

### Progressive disclosure

Use depth to change explanatory detail, not to move the learner between different facts:

- **Intro:** what happened, where, and the one main reason;
- **Standard:** pathway names, transport, feedback, selected tissues;
- **Mechanism:** reviewed receptor, cell, or circuit mechanism and evidence distinctions.

Keep uncertainty and context available at every depth. A depth switch should be a compact segmented control with a short description available on hover, focus, or help. It should not occupy the visual prominence of the lesson objective.

### Relationship inspector template

Every selected relationship should answer in this order:

1. `What is the claim?`
2. `Where does it apply?`
3. `What travels, and by which route?`
4. `What changes at the target?`
5. `Why does this happen in this context?`
6. `What regulates it or remains uncertain?`
7. `What should I inspect or predict next?`

The page should use learner language in ordinary views. Terms such as fixture, bundle, build, manifest, and content version belong in About or diagnostics unless they are necessary to explain a limitation.

### Evidence and draft treatment

Evidence is attached to the claim or comparison cell, not an entire hormone. Show separately:

- relation kind: causal, associative, or descriptive;
- support category: established, supported, emerging, contested, or unresolved;
- context dependence;
- evidence basis;
- references and exact scope;
- what remains uncertain;
- review date and publication status.

In a fictional preview, the first label must be `Fictional example · not scientific evidence`. A support-style badge in a draft must not visually outrank that statement. In a reviewed build, publication status and support category remain separate.

### Labels and microcopy

Prefer:

- `Follow the HPA axis` over `Follow the authored pathway`;
- `What happens now` over `What is happening now` when space is tight;
- `Lesson position` plus `Presentation time` over an unlabeled timeline;
- `Open the explanation` over a generic `Why?` when the relationship is not visible nearby;
- `Continue learning` over a raw route link;
- `This example is fictional` over repeated implementation caveats.

Use short sentences, one concept per paragraph, and a visible explanation of every specialized term at first use. Avoid “happiness chemical,” “love hormone,” universal effect claims, and personalized physiology language.

## 8. Interaction contracts and small details

### Selection and focus

- Clicking a signal, stage, organ, or tree row selects it; selection does not start playback.
- Keyboard focus is visually distinct from selected state.
- Selection updates the tree, visual, inspector heading, URL, and transcript location together.
- Escape closes the topmost inspector, dialog, or search overlay before changing page selection.
- Closing Why or Evidence restores focus to the invoking control and leaves playback paused.
- A selected relationship remains selected while the learner changes depth or switches renderer.

### Playback and stages

- Start opens the first stage paused when reduced motion is active and plays only when full motion is allowed.
- Play/Pause is always visible in the lesson workspace.
- Previous, Next, Restart, and the slider use authored positions; seeking never invents biology.
- Selecting any stage pauses at its authored cursor.
- A checkpoint pauses before its revealing event. Selecting an answer never submits it.
- `Check answer`, `Skip and continue`, `Continue`, `Show Why`, and `Show evidence` are separate actions with clear order.
- Feedback never auto-advances while being read.
- A hidden tab pauses and does not catch up with a time jump.

### Why and Evidence

- The inspector header always reads `source → relationship → target`.
- Why offers up to three deeper questions and a terminal explanation. After four levels, related concepts start a new trail.
- Evidence opens at the claim currently selected, with context and review status above references.
- The current cursor, tree expansion, stage selection, and focus survive opening and closing panels.
- A reference that is unavailable retains bibliographic text and states that it could not be opened; it is not silently replaced.

### Search

- Search opens from a visible button and `/` when focus is not in an editable field.
- One clear affordance is enough; the input’s clear icon can replace the separate Clear button.
- Results group by `Signals`, `Pathways`, `Anatomy`, `States`, `Lessons`, and `Ideas`.
- Exact name and alias matches precede prefix and token matches. Case and diacritics are folded for matching; displayed spelling is preserved.
- Each result shows its context and destination type.
- No-results provides `Browse pathways` and `Explore the body` actions directly.

### Compare

- Changing one signal updates only its column and pauses any lesson that is being left.
- The URL contains the pair, context, and depth. Unknown or identical selections produce a clear recovery state.
- Evidence buttons are labeled with their row and signal when announced to assistive technology.
- `Not comparable` is a meaningful authored result with a reason, never a blank cell.

### Settings and status

- Keep quick view controls in the workspace; settings contains motion, preferred renderer, practice interruptions, and local data.
- The settings popover has a clear heading, bounded size, focus behavior, and a link to a full settings page if the groups grow.
- A renderer fallback message appears once, explains that meaning is preserved, and offers `Retry 3D`.
- Storage failure leaves learning usable and gives one nonblocking notice. `Saved on this device` appears only after a successful write.
- Reset actions name exactly what is erased and require confirmation for the all-data action.

### Loading and error states

Every primary pane has a purposeful state for loading, no selection, unavailable content, and failure:

- loading shows the page frame, title, and what is being loaded;
- no selection tells the learner how to choose a system, pathway, signal, or region;
- unavailable content names the requested item and offers Home, Search, or Explore;
- failed content retains navigation and offers retry; it never shows a partial chain as complete;
- invalid or retired links never substitute a similarly named signal.

## 9. Visual system

### Surface hierarchy

Use fewer but more meaningful surfaces:

1. quiet page background;
2. navigation rail with a slightly raised tree surface;
3. central visual canvas with a distinct frame;
4. inspector surface with strong reading contrast;
5. assessment surface reserved for a prediction or transfer prompt;
6. lightweight dividers for transcript and comparison rows.

Not every paragraph needs a rounded card. Reserve prominent borders and shadows for current state, assessment, and actionable panels. Use a 12–16 px radius consistently where a surface needs it; use spacing and typography to separate ordinary sections.

### Type and density

Suggested desktop tokens:

| Token | Size / line height | Use |
|---|---|---|
| Display | 44 / 50 px | Home headline only. |
| Page title | 36 / 42 px | Lesson, Explore, Compare, Learn titles. |
| Section title | 24 / 30 px | Main explanatory sections. |
| Local title | 18 / 24 px | Inspector, tree group, track. |
| Body | 16 / 24 px | Explanations and captions. |
| Supporting | 14 / 20 px | Context, route, evidence metadata. |
| Eyebrow | 12 / 16 px | Section category; never the only label. |

Use one type family, sentence case, consistent weight, and a maximum text measure. Keep line breaks intentional in headings so the title does not create a tall empty introduction.

### Meaningful color and non-color cues

Use a calm neutral foundation. Suggested semantic roles:

- active route: blue;
- source: violet;
- target: teal;
- inhibition/feedback: amber;
- uncertainty/context: slate;
- selected/focus: a high-contrast outline and subtle fill.

Each role also has text, a line pattern, an icon, or a connector shape. Grayscale must still communicate direction, sign, selected state, and evidence category. Contrast targets follow the project’s WCAG 2.2 AA requirement.

### Motion

Motion is a teaching cue:

- a route transition may ease into place once;
- a current step may pulse once when selected;
- camera movement is bounded and user-triggered;
- no ambient particles, decorative glow, automatic camera chase, or speed-as-strength metaphor;
- reduced motion removes autoplay and traveling routes while preserving manual stepping and the full map.

## 10. Desktop validation plan

### Task-based formative review

Run formative sessions with novice and university-level learners using the same desktop prototype. Do not ask whether the interface is “modern”; observe whether it supports the intended work.

Tasks:

1. From Home, find a lesson about stress and start it.
2. Use the Signals tree to find cortisol under its system and open the relevant context.
3. Identify the current source, route, target, and feedback from the visual and inspector.
4. Switch from 3D to 2D and explain what changed and what remained the same.
5. Open Why, go one level deeper, open Evidence, and return without losing the step.
6. Answer a checkpoint before the revealing event; submit once; explain the feedback.
7. Compare adrenaline and cortisol and state the most important difference in source, route, timing, or regulation.
8. Resume from Learn after leaving a lesson.

Record task completion, wrong turns, hesitation, unprompted explanations, and whether the learner relied on the transcript. Do not interpret a successful click path as proof of learning.

### Desktop visual review matrix

Capture the same flagship lesson at 1440 × 900, 1440 × 1000, 1280 × 800, and 1024 × 768. Review:

- Home first viewport;
- tree open at system, pathway, repeated-signal, and A–Z states;
- selected source, target, inhibition, association, and parallel tracks;
- 2D map with no route ambiguity;
- 3D front/back/brain framing and label occlusion;
- Why and Evidence open beside the current visual;
- prediction before and after submission;
- comparison groups and bounded table scrolling;
- loading, no-content, 2D fallback, and draft banner;
- keyboard focus and grayscale meaning.

The screenshot set is evidence for review, not a substitute for scientific or learner validation.

### Acceptance bar

The redesign is ready to propagate beyond the flagship lesson only when all of the following are true:

- Home offers a meaningful visual and a one-click first lesson.
- A learner can locate a released signal through the system tree in two deliberate actions after opening Explore.
- The selected signal’s context is visible in the tree, canvas, inspector, URL, and transcript.
- At least one complete lesson fits the visual, inspector, stage strip, and primary controls in one desktop working set.
- 2D and 3D show identical semantic frames; 2D remains complete when 3D fails.
- Every visible route has an explicit direction/sign/transport treatment and no accidental crossing.
- Why, Evidence, Glossary, prediction, and transcript preserve the current context and return focus correctly.
- Compare teaches an authored takeaway before presenting the complete table.
- Learn makes the next action more prominent than storage bookkeeping.
- All mandatory keyboard and reduced-motion paths are usable at the supported desktop widths.
- The flagship lesson scores at least 18/20, with causality, time, scientific honesty, and progressive depth at 2.
- Qualified scientific review, asset-anchor review, license records, accessibility review, and learning-validation status are reported separately and honestly.

## 11. Delivery sequence

This sequence keeps information architecture and meaning ahead of decorative polish.

### Phase 0 — Establish the design baseline

Deliver:

- this plan and the findings audit accepted as the design brief;
- a single flagship lesson selected from the reviewed R1 curriculum;
- a content/relationship inventory for its sources, targets, routes, stages, timing labels, Why roots, and evidence;
- a desktop screenshot baseline at the four widths above;
- unresolved scientific and asset dependencies listed with owners.

Gate: the team can describe the flagship lesson’s learner question and causal frame without referring to implementation details.

### Phase 1 — Information architecture and content hierarchy

Deliver:

- Signals/Anatomy navigation model;
- system/pathway/signal tree with repeated-signal context lenses;
- A–Z and search behavior;
- pathway overview template;
- Home, Explore, lesson, Compare, and Learn wireframes using the shared frame;
- copy inventory replacing internal fixture/build language in learner-facing surfaces.

Gate: five people can predict where to find a system, pathway, signal, and anatomy region from the wireframes; no tree branch is mistaken for a causal edge.

### Phase 2 — Flagship lesson workspace

Deliver:

- header, stage strip, canvas, inspector, playback bar, track lanes, transcript drawer, and assessment surface;
- selection/focus/depth/Why/Evidence contracts;
- first-viewport lesson entry;
- shared semantic frame definition for every renderer;
- desktop keyboard and URL behavior.

Gate: the complete lesson can be followed from Home through prediction, Why, Evidence, and completion without page-level scavenger hunts.

### Phase 3 — Canonical 2D causal map

Deliver:

- authored map layout for single and parallel pathways;
- connector vocabulary, node roles, feedback routing, transport labels, and anatomical locator;
- ordered transcript equivalence;
- grayscale and reduced-motion treatment;
- no-crossing visual review for the flagship lesson.

Gate: a learner can point to the source, message, target, effect, and feedback in 2D without relying on color or a long legend.

### Phase 4 — Reviewed 3D spatial view

Deliver:

- reviewed model or original simplified geometry;
- semantic source/target anchors and laterality checks;
- body/brain framing, layer behavior, labels, occlusion, and camera controls;
- route overlays that remain schematic where appropriate;
- 2D fallback and renderer parity.

Gate: a qualified reviewer approves the depicted anatomy and anchors for the flagship lesson; asset license/provenance and performance budgets also pass. If this gate is not ready, the complete 2D lesson remains the primary release path.

### Phase 5 — Shared discovery and study surfaces

Deliver:

- Home demonstration and Continue learning;
- Explore tree, pathway overview, selected-entity inspector;
- Compare takeaway and grouped rows;
- Learn next-action hierarchy;
- search and no-results recovery;
- settings and local-data wording.

Gate: the same signal and context can be reached from Home, Search, Explore, a pathway, a body region, and a lesson without duplicate or contradictory detail pages.

### Phase 6 — Validation and propagation

Deliver:

- desktop visual review matrix;
- keyboard, screen-reader, focus, contrast, reflow, and reduced-motion review;
- performance, fallback, and memory evidence;
- formative learner findings and fixes;
- scientific review and publication readiness records;
- an updated acceptance map and explicit open risks.

Gate: the flagship lesson clears the acceptance bar. Only then should the pattern be applied to the remaining R1 journeys, states, comparisons, and signal pages.

## 12. Decisions that remain explicit

This plan preserves the documented product boundaries:

- browser-only, static, no authentication, database, backend, remote analytics, or health-data collection;
- authored qualitative physiology, not a quantitative simulator or personalized model;
- no generative scientific explanations or invented citations;
- 2D equivalent access remains mandatory even when 3D is available;
- scientific review and asset review are release gates, not visual polish tasks;
- local progress stays optional, device-specific, and erasable;
- the R1 curriculum remains bounded until the flagship experience is coherent.

The following choices still require project-owner or qualified-reviewer decisions before implementation can claim a finished product: final reviewed signal taxonomy, final organ/brain asset and anchors, source bibliography, qualified scientific reviewer, hosting/release target, and learner-study protocol.

## 13. References and governing documents

Internal requirements and boundaries:

- [Product requirements](../documentation/01-product-requirements.md)
- [Experience and interaction specification](../documentation/02-experience-and-interaction.md)
- [Curriculum and content inventory](../documentation/03-curriculum-and-content.md)
- [Scientific content and evidence](../documentation/04-scientific-content-and-evidence.md)
- [Anatomy and visual system](../documentation/07-anatomy-and-visual-system.md)
- [Learning and assessment](../documentation/09-learning-and-assessment.md)
- [Accessibility, performance, reliability, and privacy](../documentation/10-accessibility-performance-and-security.md)
- [Verification and acceptance](../documentation/11-verification-and-acceptance.md)
- [Implementation quality bar](../documentation/implementation-evidence/quality-bar.md)
- [Desktop UI findings](desktop-ui-findings.md)

External standards and learning-design references used to shape this plan:

- [WAI-ARIA Authoring Practices: Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
- [WCAG 2.2 Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [What Works Clearinghouse: Organizing Instruction and Study to Improve Student Learning](https://ies.ed.gov/ncee/wwc/practiceguide/1)

This document is a design plan. It does not claim that the current app has been redesigned, that the fictional preview is scientifically accurate, that a model asset is anatomically approved, or that learners have already demonstrated the intended outcomes.
