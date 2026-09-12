/**
 * Projection: the pure half of the playback engine.
 *
 * `project(timeline, cursorMs)` is a function of the authored script and a presentation cursor
 * and nothing else. It calculates no concentration, solves no equation, infers no graph edge and
 * estimates nobody's biology (document 06). Every renderer consumes the frame it returns, so the
 * 3D scene, the 2D diagram and the transcript cannot disagree about what is happening.
 */
import type { Highlight, Timeline, Trend, VisualCommand } from '../content/schema.ts';

/**
 * The part of a timeline projection actually reads. A published `Timeline` satisfies it, and so
 * does the specification's engineering fixture, which is deliberately not a content record.
 */
export interface ProjectableTimeline {
  durationMs: number;
  tracks: ReadonlyArray<{ id: string }>;
  steps: ReadonlyArray<{ id: string; atMs: number; trackId: string; timingBandId?: string }>;
  events: ReadonlyArray<{ atMs: number; order: number; command: VisualCommand }>;
}

export interface Frame {
  cursorMs: number;
  highlights: Record<string, Highlight>;
  visibleRelationshipIds: string[];
  trends: Record<string, Trend>;
  activeStepByTrack: Record<string, string>;
  timingBandByTrack: Record<string, string>;
}

export class EngineInvalidStateError extends Error {
  readonly code = 'ENGINE_INVALID_STATE';
  constructor(message: string) {
    super(message);
    this.name = 'EngineInvalidStateError';
  }
}

/** Implicit defaults: nothing is highlighted, no relation is visible, no trend is shown. */
export const DEFAULT_HIGHLIGHT: Highlight = 'none';
export const DEFAULT_TREND: Trend = 'not-shown';

export function highlightOf(frame: Frame, anatomyId: string): Highlight {
  return frame.highlights[anatomyId] ?? DEFAULT_HIGHLIGHT;
}

export function trendOf(frame: Frame, signalId: string): Trend {
  return frame.trends[signalId] ?? DEFAULT_TREND;
}

export function clampCursor(timeline: ProjectableTimeline, cursorMs: number): number {
  if (!Number.isFinite(cursorMs)) {
    throw new EngineInvalidStateError(`cursor must be a finite number, received ${String(cursorMs)}`);
  }
  return Math.min(Math.max(cursorMs, 0), timeline.durationMs);
}

/**
 * Replays every event at or before the cursor in `(atMs, order)` order. Commands assign absolute
 * values; there are no additive or toggle commands, so the result depends only on the cursor and
 * never on how the cursor was reached.
 */
export function project(timeline: ProjectableTimeline, cursorMs: number): Frame {
  const cursor = clampCursor(timeline, cursorMs);

  const highlights: Record<string, Highlight> = {};
  const relations = new Map<string, boolean>();
  const trends: Record<string, Trend> = {};

  const events = [...timeline.events].sort((a, b) => a.atMs - b.atMs || a.order - b.order);
  for (const event of events) {
    if (event.atMs > cursor) break;
    switch (event.command.type) {
      case 'set-highlight':
        highlights[event.command.anatomyId] = event.command.value;
        break;
      case 'set-relation':
        relations.set(event.command.relationshipId, event.command.visible);
        break;
      case 'set-trend':
        trends[event.command.signalId] = event.command.value;
        break;
    }
  }

  const activeStepByTrack: Record<string, string> = {};
  const timingBandByTrack: Record<string, string> = {};
  for (const track of timeline.tracks) {
    let active: (typeof timeline.steps)[number] | undefined;
    for (const step of timeline.steps) {
      if (step.trackId !== track.id || step.atMs > cursor) continue;
      if (!active || step.atMs > active.atMs || (step.atMs === active.atMs && step.id > active.id)) {
        active = step;
      }
    }
    if (active) {
      activeStepByTrack[track.id] = active.id;
      if (active.timingBandId !== undefined) timingBandByTrack[track.id] = active.timingBandId;
    }
  }

  return {
    cursorMs: cursor,
    highlights,
    // Sorted so that two frames reached by different routes compare exactly equal.
    visibleRelationshipIds: [...relations.entries()]
      .filter(([, visible]) => visible)
      .map(([id]) => id)
      .sort(),
    trends,
    activeStepByTrack,
    timingBandByTrack,
  };
}

/** Every distinct step timestamp across all tracks, ascending. Used by previous/next step. */
export function distinctStepTimes(timeline: ProjectableTimeline): number[] {
  return [...new Set(timeline.steps.map((step) => step.atMs))].sort((a, b) => a - b);
}

export function nextStepTime(timeline: ProjectableTimeline, cursorMs: number): number | undefined {
  return distinctStepTimes(timeline).find((time) => time > cursorMs);
}

export function previousStepTime(timeline: ProjectableTimeline, cursorMs: number): number | undefined {
  return [...distinctStepTimes(timeline)].reverse().find((time) => time < cursorMs);
}

/** The step a track is showing at the cursor, if any. */
export function activeStep(timeline: Timeline, frame: Frame, trackId: string) {
  const stepId = frame.activeStepByTrack[trackId];
  return stepId === undefined ? undefined : timeline.steps.find((step) => step.id === stepId);
}

/** Frames are compared by value in tests and in the renderer's change detection. */
export function framesEqual(a: Frame, b: Frame): boolean {
  return (
    a.cursorMs === b.cursorMs &&
    sameRecord(a.highlights, b.highlights) &&
    a.visibleRelationshipIds.join('|') === b.visibleRelationshipIds.join('|') &&
    sameRecord(a.trends, b.trends) &&
    sameRecord(a.activeStepByTrack, b.activeStepByTrack) &&
    sameRecord(a.timingBandByTrack, b.timingBandByTrack)
  );
}

function sameRecord(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
}
