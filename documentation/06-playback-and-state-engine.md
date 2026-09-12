# Playback and state engine

## Engine responsibility

The engine projects an authored lesson onto a presentation cursor. It does not calculate concentrations, solve differential equations, infer new graph edges or estimate a person's biology. Its output is a deterministic semantic frame consumed by the 3D scene, 2D diagram, transcript, timeline and controls.

Two layers must remain separate:

1. **Projection:** a pure function `project(timeline, cursorMs) -> Frame`.
2. **Session controller:** user actions, clock advancement, checkpoints, exposure and persistence side effects.

No renderer may invent physiological state or use particle position as the source of lesson progress.

## Frame definition

```ts
type Frame = {
  cursorMs: number;
  highlights: Record<string, 'none' | 'source' | 'target' | 'active'>;
  visibleRelationshipIds: string[];
  trends: Record<string, 'baseline' | 'increasing' | 'decreasing'
    | 'sustained' | 'variable' | 'not-shown'>;
  activeStepByTrack: Record<string, string>;
  timingBandByTrack: Record<string, string>;
};
```

Implicit defaults: all highlights `none`, all relations hidden, all trends `not-shown`. Projection clamps cursor to `[0, durationMs]`, rejects NaN/infinity and replays all events with `atMs <= cursorMs` in `(atMs, order)` order. Commands assign absolute values; there are no additive or toggle commands. Select the latest step at or before the cursor for every track; every track has a step at zero.

R1 can recompute from zero: at most 2000 events per timeline and 4 tracks. Only add a snapshot/index optimization after a measured budget failure, preserving equivalent output under property tests. Do not persist the entire Frame.

## Clock and presentation

Use a monotonic elapsed-time source. Session cursor is `anchorCursor + elapsed * speed`, clamped to the duration or next required checkpoint. Speed values are 0.5, 1 and 2. Changing speed resets the anchor; it does not restart the lesson. Persist preference, not wall-clock origin.

The requestAnimationFrame loop drives visual updates while visible and playing. On tab hide, lost renderer context or route change, pause and reset the elapsed-time anchor. Returning to the tab never catches up using background wall time. Do not use a frame counter as time; a slow device must not change event order.

At a checkpoint, use the exact authored `atMs` even if the clock crosses it in a long frame. Events at that timestamp are pre-question state. The answer-revealing event must be later at `revealAtMs`; authoring validation and review enforce this. No particle travels toward the answer target while a question is visible.

The progress scrubber is explicitly labeled **Lesson position**. Display elapsed/total presentation time only there. Biological labels such as “earlier neural response” and “later endocrine response” appear beside tracks with their caveats and citations. No automatic conversion from playback milliseconds to physiological seconds exists.

## Session state

```ts
type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'question'
  | 'feedback' | 'completed' | 'error';
type Session = {
  timelineId: string;
  contentVersion: string;
  status: PlaybackStatus;
  cursorMs: number;
  speed: 0.5 | 1 | 2;
  activePredictionId?: string;
  selectedOptionId?: string;
  handledCheckpointIds: string[];
  exposedFamilyIds: string[];
  predictionsEnabled: boolean;
};
```

Selection, camera, panels and depth are UI state alongside the session. They are not part of physiology. Persist attempts/exposures through a storage adapter after state transitions; pure engine functions never access browser storage.

## Transitions

| Action/event | Precondition | Result |
|---|---|---|
| LOAD timeline | Bundle valid | Cursor zero; idle; clear session checkpoints; use retained exposure history |
| PLAY | Idle/paused; cursor before end | Playing, unless reduced motion is effective; then keep paused and expose Next step |
| PAUSE | Playing | Freeze exact cursor; paused |
| TICK | Playing | Advance toward earliest checkpoint or end; project current frame |
| CHECKPOINT crossed | Predictions enabled and checkpoint unhandled | Stop at checkpoint; question; emit exposure metadata, never reveal answer |
| CHOOSE option | Question | Store selection, stay in question |
| SUBMIT | Question with valid selection | Record one attempt; mark family exposed; feedback; freeze frame |
| SKIP | Question | Mark checkpoint handled and family exposed; advance to revealAtMs paused; record skip |
| CONTINUE | Feedback | Mark checkpoint handled; move to revealAtMs; play if motion allowed, otherwise paused |
| SEEK | Any usable state | Close question/feedback; project requested cursor; paused; update exposure for traversed reveal boundaries |
| NEXT/PREV step | Any usable state | Seek to next/previous distinct step timestamp across all tracks; paused |
| RESTART | Any usable state | Cursor zero; idle; clear session handled checkpoints, keep attempts/exposure history |
| END reached | Playing or explicit seek to duration | Completed; record local completion once per content version |
| OPEN explanation/evidence | Any usable state | Pause; preserve cursor and answered question state if returning to it |
| SET_DEPTH | Any usable state | Replace displayed variants; no cursor/answer/semantic changes |
| HIDE tab | Playing | Pause; return to tab remains paused |
| NAVIGATE | Any | Stop clock, close transient panels, load new route paused/idle |
| ERROR | Loading/projection invalid | Stop clock and animation; safe recovery screen |

“Open explanation” during feedback preserves feedback state under the panel, while ensuring the clock is stopped. During an unanswered question, hint/Why access is allowed but marks the attempt assisted and family exposed. The question can still be answered as practice.

Play at completed shows “Replay” rather than silently clearing completion. Replay is an explicit restart followed by play if motion is allowed. Changing view 3D/2D preserves status unless 3D fails; switching into reduced motion pauses immediately.

## Checkpoint policy and exposure

Auto-prompt only when normal playback crosses an unhandled checkpoint. Seeking does not force an interruption. On seek forward, mark every checkpoint whose `atMs` is crossed as handled for the current session. Mark its family exposed when the seek target crosses `revealAtMs`, or when an answer-revealing step, summary, Why answer or source lesson has already been opened.

PLAY checks for an unhandled checkpoint exactly at the current cursor before starting the clock, including a zero-time checkpoint. SEEK treats a checkpoint exactly at the destination as bypassed/handled, so an explicit seek does not immediately reopen it. During forward playback the next checkpoint is the earliest unhandled one strictly after the current cursor. Referenced exposure timeline/relationship/explanation IDs are applied through the compiled reverse index, including when content is opened outside the current lesson.

If a learner seeks into the gap between `atMs` and `revealAtMs`, the checkpoint is bypassed but not yet exposed; it can be opened manually as an unassisted prompt if no other exposure occurred. Playing from that gap advances normally. Seeking backward never clears exposure or handled state. Restart makes checkpoints available again but exposed questions are practice.

If predictions are disabled, crossing reveal boundaries still records exposure. The setting controls interruptions, not assessment integrity. Opening the completed causal summary marks all answer families in that timeline exposed. On direct deep linking to a step, apply the same exposure rules as seeking from zero to that step.

The options and solutions reside in static content and are inspectable. R1 provides formative education, not tamper-proof examinations. No attempt is a certified grade.

## Multi-track rules

All tracks share one presentation cursor. Each event belongs to a track for labeling, but writes to a shared semantic frame. An organ may be highlighted by multiple systems only through an authored shared highlight schedule. Do not let last render order determine physiology.

For same-time events targeting distinct properties, sort by explicit order for reproducible transcripts. Same-time writes to the same property fail validation. Different-time writes are allowed and represent the author's intended state. Persistent visibility continues until explicitly cleared. End-of-lesson highlights are authored; completion does not invent a “return to baseline.”

Branching R1 physiology is a displayed parallel structure, not a user-altered model. Assessment choices do not change physiology or create an alternate biological outcome. Wrong answers receive explanation, then the same canonical lesson continues.

## Animation rendering

Project semantic state at the current cursor. A visible causal route may render deterministic pulse motion derived from cursor and route ID. Pulse progress is cosmetic communication emphasis only; it cannot determine source/target activation. Schematic paths show a legend. Associations have a non-directional dashed connector and no causally traveling pulse.

Reduced motion renders discrete highlights, route labels and captions. Next step selects the next distinct timestamp. No autoplay, interpolation, parallax or automatic camera movement. Optional short opacity changes must be disabled when the system requests reduced motion.

## Synthetic fixture contract and expected results

[synthetic-feedback.json](examples/synthetic-feedback.json) is an engineering fixture with fictional Alpha/Beta/Gamma entities. Schema: `fixtureVersion: 1`, `fictional: true`, `timeline` with integer duration, sorted events carrying commands, and `checks` containing expected selected frame properties. It is intentionally not publishable content and has no scientific references.

Use it to verify source → intermediary → target → inhibitory feedback and simultaneous independent tracks. Required assertions:

- At 0 ms the source is active, all trends are absent/default and no route is visible.
- At 1000 ms the first route is visible and Alpha is increasing.
- At 2000 ms both independent events are applied; intermediary and peripheral target are highlighted.
- At 3000 ms Gamma is increasing and the forward route is visible.
- At 5000 ms the inhibitory feedback route appears and Alpha becomes decreasing.
- Projecting 5000 → 1000 → 5000 equals projecting 5000 directly.
- A clock tick from 2500 to 3500 must stop at checkpoint 2800, before reveal at 3000.
- Reduced-motion Next advances through distinct step timestamps with identical semantic state.

Also construct invalid fixtures for timestamp conflicts, graph references, unsupported causal claims, NaN cursor, out-of-range IDs and checkpoint leakage. Do not use real physiological assertions to test the algorithm itself.
