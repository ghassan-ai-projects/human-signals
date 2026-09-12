/**
 * Frame helpers and the defaults document 06 specifies: nothing highlighted, no relation
 * visible, no trend shown until an authored event says otherwise.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HIGHLIGHT,
  DEFAULT_TREND,
  activeStep,
  distinctStepTimes,
  framesEqual,
  highlightOf,
  nextStepTime,
  previousStepTime,
  project,
  trendOf,
} from '../../src/engine/frame.ts';
import { createManualClock } from '../../src/engine/clock.ts';
import { SPEEDS } from '../../src/engine/session.ts';
import { timelineOf, validBundle } from '../fixtures/bundle.ts';

const bundle = validBundle();
const timeline = timelineOf(bundle);

describe('frame defaults', () => {
  it('reports the implicit defaults for anything no event has written', () => {
    const frame = project(timeline, 0);
    expect(highlightOf(frame, 'anat-not-mentioned')).toBe(DEFAULT_HIGHLIGHT);
    expect(trendOf(frame, 'sig-not-mentioned')).toBe(DEFAULT_TREND);
    expect(frame.visibleRelationshipIds).toEqual([]);
  });

  it('keeps a written value until another event overwrites it', () => {
    // The source highlight is written once at 0 ms and never cleared by the fixture.
    expect(highlightOf(project(timeline, timeline.durationMs), 'anat-fictional-source')).toBe('source');
  });

  it('exposes the active step and its timing band per track', () => {
    const frame = project(timeline, 2000);
    const main = timeline.tracks[0]!;
    expect(frame.activeStepByTrack[main.id]).toBe('exercise-synthetic-feedback-step-intermediary');
    expect(frame.timingBandByTrack[main.id]).toBe('exercise-synthetic-feedback-band-earlier');
    expect(activeStep(timeline, frame, main.id)?.stage).toBe('target');
    expect(activeStep(timeline, frame, 'track-that-does-not-exist')).toBeUndefined();
  });
});

describe('step navigation', () => {
  it('lists distinct step timestamps across every track', () => {
    expect(distinctStepTimes(timeline)).toEqual([0, 1000, 2000, 3000, 5000]);
  });

  it('finds the next and previous distinct timestamps, and stops at the ends', () => {
    expect(nextStepTime(timeline, 0)).toBe(1000);
    expect(nextStepTime(timeline, 4999)).toBe(5000);
    expect(nextStepTime(timeline, 5000)).toBeUndefined();
    expect(previousStepTime(timeline, 5000)).toBe(3000);
    expect(previousStepTime(timeline, 0)).toBeUndefined();
  });
});

describe('frame comparison', () => {
  it('distinguishes frames that differ in any dimension', () => {
    const base = project(timeline, 1000);
    expect(framesEqual(base, project(timeline, 1000))).toBe(true);
    expect(framesEqual(base, project(timeline, 2000))).toBe(false);
    expect(framesEqual(base, { ...base, cursorMs: 999 })).toBe(false);
    expect(framesEqual(base, { ...base, highlights: {} })).toBe(false);
    expect(framesEqual(base, { ...base, visibleRelationshipIds: [] })).toBe(false);
    expect(framesEqual(base, { ...base, trends: {} })).toBe(false);
    expect(framesEqual(base, { ...base, activeStepByTrack: {} })).toBe(false);
    expect(framesEqual(base, { ...base, timingBandByTrack: {} })).toBe(false);
  });
});

describe('clock adapter', () => {
  it('advances only when told to, so tests never depend on wall time', () => {
    const clock = createManualClock(1000);
    expect(clock.now()).toBe(1000);
    clock.advance(250);
    expect(clock.now()).toBe(1250);
  });

  it('offers exactly the three speeds document 06 allows', () => {
    expect(SPEEDS).toEqual([0.5, 1, 2]);
  });
});
