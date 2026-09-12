/**
 * Quality bar B5 and acceptance scenario AC-05: every route to a cursor must agree.
 *
 * Property-based over generated bounded timelines, using a small deterministic generator rather
 * than another dependency (document 11 permits this explicitly). A failing seed is reproducible.
 */
import { describe, expect, it } from 'vitest';
import {
  framesEqual,
  project,
  distinctStepTimes,
  type Frame,
  type ProjectableTimeline,
} from '../../src/engine/frame.ts';
import { createSession, reduce, type SessionContext } from '../../src/engine/session.ts';
import type { VisualCommand } from '../../src/content/schema.ts';

/** Deterministic 32-bit generator so a failure can be reproduced from its seed. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ANATOMY = ['anat-a', 'anat-b', 'anat-c'];
const RELATIONS = ['rel-a', 'rel-b', 'rel-c'];
const SIGNALS = ['sig-a', 'sig-b'];
const HIGHLIGHTS = ['none', 'source', 'target', 'active'] as const;
const TRENDS = ['baseline', 'increasing', 'decreasing', 'sustained', 'variable', 'not-shown'] as const;

function generateTimeline(seed: number): ProjectableTimeline {
  const random = rng(seed);
  const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;
  const durationMs = 2000 + Math.floor(random() * 20000);
  const trackCount = 1 + Math.floor(random() * 4);
  const tracks = Array.from({ length: trackCount }, (_, index) => ({ id: `track-${index}` }));

  const steps = tracks.flatMap((track, index) => [
    { id: `step-${index}-0`, atMs: 0, trackId: track.id, timingBandId: 'band-early' },
    ...Array.from({ length: Math.floor(random() * 5) }, (_, n) => ({
      id: `step-${index}-${n + 1}`,
      atMs: Math.floor(random() * durationMs),
      trackId: track.id,
      timingBandId: random() > 0.5 ? 'band-early' : 'band-late',
    })),
  ]);

  // Same-timestamp writes to one property are invalid content, so the generator avoids them.
  const taken = new Set<string>();
  const events: Array<{ atMs: number; order: number; command: VisualCommand }> = [];
  let order = 0;
  for (let i = 0; i < 40; i += 1) {
    const atMs = Math.floor(random() * durationMs);
    const kind = random();
    let command: VisualCommand;
    let key: string;
    if (kind < 0.4) {
      const anatomyId = pick(ANATOMY);
      command = { type: 'set-highlight', anatomyId, value: pick(HIGHLIGHTS) };
      key = `${atMs}|highlight:${anatomyId}`;
    } else if (kind < 0.75) {
      const relationshipId = pick(RELATIONS);
      command = { type: 'set-relation', relationshipId, visible: random() > 0.35 };
      key = `${atMs}|relation:${relationshipId}`;
    } else {
      const signalId = pick(SIGNALS);
      command = { type: 'set-trend', signalId, value: pick(TRENDS) };
      key = `${atMs}|trend:${signalId}`;
    }
    if (taken.has(key)) continue;
    taken.add(key);
    events.push({ atMs, order: order++, command });
  }
  // Authoring order is deliberately not sorted: projection must sort for itself.
  events.reverse();
  return { durationMs, tracks, steps, events };
}

function playTo(timeline: ProjectableTimeline, target: number, stepMs: number): Frame {
  const ctx: SessionContext = {
    timeline: { id: 'exercise-generated', ...timeline } as unknown as SessionContext['timeline'],
    predictions: [],
    reducedMotion: false,
  };
  let session = { ...createSession('exercise-generated', '0.0.0'), status: 'playing' as const };
  while (session.cursorMs < target) {
    const remaining = target - session.cursorMs;
    const result = reduce(session, { type: 'TICK', elapsedMs: Math.min(stepMs, remaining) }, ctx);
    if (result.session.cursorMs === session.cursorMs) break;
    session = result.session as typeof session;
  }
  return project(timeline, session.cursorMs);
}

const SEEDS = Array.from({ length: 60 }, (_, index) => index + 1);

describe('projection properties', () => {
  it.each(SEEDS)('seed %i: projection is idempotent and order-independent', (seed) => {
    const timeline = generateTimeline(seed);
    const random = rng(seed * 7919);
    for (let i = 0; i < 12; i += 1) {
      const cursor = Math.floor(random() * (timeline.durationMs + 500));
      const direct = project(timeline, cursor);
      expect(project(timeline, cursor)).toEqual(direct);

      // Seek backward then forward again.
      project(timeline, Math.floor(cursor / 3));
      expect(framesEqual(project(timeline, cursor), direct)).toBe(true);

      // A replay from zero through several intermediate cursors ends at the same frame.
      for (const fraction of [0.1, 0.4, 0.9]) {
        project(timeline, Math.floor(cursor * fraction));
      }
      expect(project(timeline, cursor)).toEqual(direct);
    }
  });

  it.each(SEEDS.slice(0, 20))('seed %i: continuous playback matches direct projection', (seed) => {
    const timeline = generateTimeline(seed);
    const target = Math.floor(timeline.durationMs * 0.75);
    const direct = project(timeline, target);
    // A slow device produces long frames; a fast one produces short ones. Neither may change
    // the semantic frame or the order events are applied in.
    expect(playTo(timeline, target, 16)).toEqual(direct);
    expect(playTo(timeline, target, 250)).toEqual(direct);
    expect(playTo(timeline, target, 1000)).toEqual(direct);
  });

  it.each(SEEDS.slice(0, 20))('seed %i: stepping visits the same frames as seeking', (seed) => {
    const timeline = generateTimeline(seed);
    const ctx: SessionContext = {
      timeline: { id: 'exercise-generated', ...timeline } as unknown as SessionContext['timeline'],
      predictions: [],
      reducedMotion: true,
    };
    let session = createSession('exercise-generated', '0.0.0');
    for (const time of distinctStepTimes(timeline)) {
      if (time === 0) continue;
      session = reduce(session, { type: 'NEXT_STEP' }, ctx).session;
      expect(session.cursorMs).toBe(time);
      expect(session.status).not.toBe('playing');
      expect(project(timeline, session.cursorMs)).toEqual(project(timeline, time));
    }
  });

  it('clamps out-of-range cursors and rejects non-finite ones', () => {
    const timeline = generateTimeline(1);
    expect(project(timeline, -5000).cursorMs).toBe(0);
    expect(project(timeline, timeline.durationMs + 5000).cursorMs).toBe(timeline.durationMs);
    expect(() => project(timeline, Number.NaN)).toThrow(/finite/);
    expect(() => project(timeline, Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });
});
