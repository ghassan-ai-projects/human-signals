/**
 * Document 06 states the expected results of the specification's engineering fixture. This test
 * reads that file directly — not a copy — and asserts each of its required outcomes, so a change
 * to the specification fixture cannot silently stop matching the engine.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { project, trendOf, framesEqual, type ProjectableTimeline } from '../../src/engine/frame.ts';
import { createSession, reduce, type SessionContext } from '../../src/engine/session.ts';
import type { Prediction, VisualCommand } from '../../src/content/schema.ts';

interface SpecFixture {
  fixtureVersion: number;
  fictional: boolean;
  timeline: {
    id: string;
    durationMs: number;
    tracks: string[];
    steps: Array<{ id: string; atMs: number; trackId: string }>;
    events: Array<{ id: string; atMs: number; order: number; trackId: string; command: VisualCommand }>;
    checkpoint: { id: string; atMs: number; revealAtMs: number };
  };
  checks: Array<{
    atMs: number;
    visibleRelationshipIds: string[];
    trends: Record<string, string>;
  }>;
}

const fixture = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', 'documentation', 'examples', 'synthetic-feedback.json'),
    'utf8',
  ),
) as SpecFixture;

const timeline: ProjectableTimeline = {
  durationMs: fixture.timeline.durationMs,
  tracks: fixture.timeline.tracks.map((id) => ({ id })),
  steps: fixture.timeline.steps,
  events: fixture.timeline.events,
};

describe('specification fixture', () => {
  it('is declared fictional and carries no references', () => {
    expect(fixture.fictional).toBe(true);
    expect(fixture.fixtureVersion).toBe(1);
  });

  it('at 0 ms the source is active, no route is visible and no trend is shown', () => {
    const frame = project(timeline, 0);
    expect(frame.highlights['anat-fictional-source']).toBe('source');
    expect(frame.visibleRelationshipIds).toEqual([]);
    expect(frame.trends).toEqual({});
    expect(trendOf(frame, 'sig-alpha')).toBe('not-shown');
  });

  it('at 1000 ms the first route is visible and Alpha is increasing', () => {
    const frame = project(timeline, 1000);
    expect(frame.visibleRelationshipIds).toEqual(['rel-alpha-beta']);
    expect(trendOf(frame, 'sig-alpha')).toBe('increasing');
  });

  it('at 2000 ms both independent events are applied', () => {
    const frame = project(timeline, 2000);
    expect(frame.highlights['anat-fictional-intermediary']).toBe('target');
    expect(frame.highlights['anat-fictional-peripheral']).toBe('target');
  });

  it('at 3000 ms Gamma is increasing and the forward route is visible', () => {
    const frame = project(timeline, 3000);
    expect(trendOf(frame, 'sig-gamma')).toBe('increasing');
    expect(frame.visibleRelationshipIds).toContain('rel-beta-gamma');
  });

  it('at 5000 ms the inhibitory feedback route appears and Alpha is decreasing', () => {
    const frame = project(timeline, 5000);
    expect(frame.visibleRelationshipIds).toContain('rel-gamma-inhibits-alpha');
    expect(trendOf(frame, 'sig-alpha')).toBe('decreasing');
  });

  it('matches every declared check exactly', () => {
    for (const check of fixture.checks) {
      const frame = project(timeline, check.atMs);
      expect(frame.visibleRelationshipIds).toEqual([...check.visibleRelationshipIds].sort());
      expect(frame.trends).toEqual(check.trends);
    }
  });

  it('projecting 5000, then 1000, then 5000 equals projecting 5000 directly', () => {
    const direct = project(timeline, 5000);
    project(timeline, 5000);
    project(timeline, 1000);
    const roundTrip = project(timeline, 5000);
    expect(framesEqual(direct, roundTrip)).toBe(true);
    expect(roundTrip).toEqual(direct);
  });

  it('a clock tick from 2500 to 3500 stops at the checkpoint before the reveal', () => {
    const checkpoint: Prediction = {
      id: 'pred-fictional-next',
      timelineId: 'exercise-synthetic-feedback',
      objectiveId: 'obj-fictional-sequence',
      atMs: fixture.timeline.checkpoint.atMs,
      revealAtMs: fixture.timeline.checkpoint.revealAtMs,
      kind: 'mechanism',
      prompt: { intro: 'a', standard: 'a', mechanism: 'a' },
      assumptions: ['only the authored edges exist'],
      contextIds: ['ctx-fictional-episode'],
      options: [
        {
          id: 'pred-fictional-next-a',
          text: { intro: 'a', standard: 'a', mechanism: 'a' },
          feedback: { intro: 'a', standard: 'a', mechanism: 'a' },
          claimIds: [],
        },
        {
          id: 'pred-fictional-next-b',
          text: { intro: 'b', standard: 'b', mechanism: 'b' },
          feedback: { intro: 'b', standard: 'b', mechanism: 'b' },
          claimIds: [],
        },
      ],
      correctOptionId: 'pred-fictional-next-a',
      explanation: { intro: 'a', standard: 'a', mechanism: 'a' },
      claimIds: ['claim-fictional-gamma-output'],
      explanationIds: [],
      revealsStepIds: [],
      familyId: 'family-fictional-sequence',
      exposureTimelineIds: [],
      exposureRelationshipIds: [],
      exposureExplanationIds: [],
    };
    const ctx: SessionContext = {
      timeline: { id: fixture.timeline.id, ...timeline } as unknown as SessionContext['timeline'],
      predictions: [checkpoint],
      reducedMotion: false,
    };
    const playing = {
      ...createSession('exercise-synthetic-feedback', '0.1.0'),
      status: 'playing' as const,
      cursorMs: 2500,
    };
    const { session } = reduce(playing, { type: 'TICK', elapsedMs: 1000 }, ctx);
    expect(session.status).toBe('question');
    expect(session.cursorMs).toBe(2800);
    // The revealing events sit at 3000 ms and must not have been applied.
    const frame = project(timeline, session.cursorMs);
    expect(frame.visibleRelationshipIds).not.toContain('rel-beta-gamma');
    expect(trendOf(frame, 'sig-gamma')).toBe('not-shown');
  });

  it('reduced-motion stepping visits the same semantic states as playback', () => {
    const times = [...new Set(fixture.timeline.steps.map((step) => step.atMs))].sort((a, b) => a - b);
    for (const time of times) {
      expect(framesEqual(project(timeline, time), project(timeline, time))).toBe(true);
    }
    // Stepping through every distinct timestamp reaches the same final state as playing to the end.
    const stepped = project(timeline, times[times.length - 1]!);
    const played = project(timeline, 5000);
    expect(stepped).toEqual(played);
  });
});
