# Human Signals V4 final browser review — 2026-09-16

Review target: local preview at `http://127.0.0.1:8765/v4/` after the three committed rounds identified by the user: `4361296`, `0d650f2`, and `cf74d14`. Review was browser-only. No source code, tests, or other files were inspected or changed. Viewports exercised: 1440×900, 1280×800, and 1024×768.

## Quality-bar scores

Scale: 1 = blocked, 3 = usable with material friction, 5 = strong and evidence-ready.

| Pillar | Score | Basis |
| --- | ---: | --- |
| Visual | 3/5 | The model-first canvas, restrained palette, route lines, and step markers are coherent at 1440×900. The reader-focus composition still clips or reflows the workspace at 1280×800 and 1024×768. |
| Interactivity | 4/5 | Guided selection, route playback, prediction checking, transfer, keyboard help, Escape, reduced motion, and local progress behave coherently. Dialog/background behavior now passes the reviewed cases. |
| Learning | 4/5 | The guided route gives a current objective and step, prediction produces causal feedback, “What if?” supports transfer, and evidence status is adjacent to explanatory content. Scientific/anatomical correctness remains intentionally unverified. |

## Prior P1 verification

### Single active dialog, focus restoration, and inert background — PASS

- Route/view: `/v4/#s=meal&p=between&t=3&h=2&c=297,365,1.27&r=1`
- Viewport: 1440×900 and default desktop view
- Evidence: Advanced signal passport, Settings, Keyboard shortcuts, and Say it back were opened in separate sequences. Only the active surface remained visible. With Say it back open, clicking the visible Systems control did not change the underlying workspace. Escape closed the active surface and returned focus to its opener (`Say it back` or `Settings`). Closing the route reader returned focus to `Read the route`.
- Result: The previous stacking/focus P1 is not reproducible in this final build.

### Narrow reader focus — FAIL; one remaining P1

- Finding ID: `V4-FINAL-01`
- Pillars: Visual, Interactivity, Learning
- Route/view: `/v4/#s=meal&p=between&t=4&h=2&c=195,484,0.95&r=1`, Read the route open
- Viewports: 1280×800 and 1024×768 desktop
- Observed behavior/evidence: At 1280×800, the left systems panel is clipped off the viewport, the bottom pathway controls extend beyond the left edge, and the reader occupies the right side while the central model is compressed. At 1024×768, the systems panel is absent without an obvious restore affordance, the objective/subtitle is partially hidden behind the reader, the central model is reduced to a small cluster, and the pathway controls wrap into a partial second row. The reader’s top context and evidence strip remain visible, but only the opening route content is visible above the fold.
- Learner/user consequence: The learner cannot reliably keep the objective, current step, whole-body model, route detail, and controls in view together. Some controls appear visually unavailable even though the accessibility surface still exposes them.
- Suggested bounded change: Make narrow reader focus a deliberate, fully reflowed state. At or below 1280×800, either collapse the systems panel with an explicit restore affordance or replace it with a compact current-step rail; keep the reader, objective, model context, timeline, and pathway controls inside the viewport.
- Acceptance criteria: At both 1280×800 and 1024×768, no primary panel or control is clipped horizontally; the current objective and step remain readable; the reader’s evidence strip and close control are visible; the timeline does not cover the active anatomy; all pathway controls are reachable without browser zoom or horizontal scrolling; closing the reader restores the full workspace.
- Confidence: High. Unverified gate: the visual anatomy and causal meaning remain illustrative and require qualified scientific/anatomical review.

### Adjacent truthful illustrative/no-source status — PASS

- Route/view: Read the route and Advanced signal passport for the between-meals route
- Viewport: 1440×900
- Evidence: The route reader presents an adjacent `Evidence status` block: `Illustrative draft; not scientifically reviewed` and `Source: no source assigned`. The Glucagon passport presents the same status next to its detailed claims. The What-if result explicitly says it is “A thought experiment, not a real patient, a disease or a treatment.”
- Result: The previous provenance-boundary P1 is addressed for the reviewed explanatory surfaces. No claim should be treated as scientifically validated until the explicit review gate is completed.

## Journey evidence

- Default guided path: selecting “You skip a meal” produces the between-meals objective, a three-step route, a timeline, and visible causal markers for pancreas → liver → brain.
- Prediction: “Try it” allows an organ prediction, enables Check only after selection, and returns mechanism-based feedback: rising glucose acts back on the pancreas, so it releases less glucagon.
- Feedback and transfer: “Watch glucose settle” reveals the feedback state. “What if?” requires a prediction and returns a bounded thought-experiment explanation.
- Reflection: “Say it back” provides a private free-text recall prompt and shows the model explanation for comparison; it is not presented as scored mastery.
- Route reader: includes a route-at-a-glance diagram, ordered prose, line semantics, and adjacent evidence status.
- Advanced passport: exposes signal class, receptor, timing, and provenance status without implying scientific review.
- Keyboard/Escape: shortcut help is discoverable from Settings; Escape closes the active sheet and restores focus to its opener in the tested cases.

## Final verdict

No P0 issues were observed. One P1 remains: `V4-FINAL-01`, the narrow reader-focus composition at 1280×800 and 1024×768. The app is otherwise materially stronger across all three pillars, with the prediction → causal feedback → transfer loop and the evidence boundary preserved. Anatomy and physiology remain illustrative, qualitative, and not scientifically reviewed; this review does not validate their correctness.

