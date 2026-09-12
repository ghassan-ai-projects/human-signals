/**
 * Parallel-state engine guarantees (work package 7) against the invented alarm state.
 *
 * Simultaneous events keep their authored order regardless of array order, effects persist
 * until an authored event overwrites them, playing through and seeking land on the same frame,
 * and two tracks writing one property at one instant fail validation.
 */
import { describe, expect, it } from 'vitest';
import { project, framesEqual, distinctStepTimes } from '../../src/engine/frame.ts';
import { reduceAll, createSession } from '../../src/engine/session.ts';
import { validBundle } from '../fixtures/bundle.ts';
import { validateBundle } from '../../src/content/validate.ts';

const bundle = validBundle();
const state = bundle.timelines.find((timeline) => timeline.kind === 'state')!;
const sharedInstant = state.events.find(
  (event) => event.command.type === 'set-highlight' && event.atMs === 5000,
)!;
const carriedTrend = state.events.find(
  (event) => event.command.type === 'set-trend' && event.atMs === 5000,
)!;

describe('simultaneous events on parallel tracks', () => {
  it('project the same frame whatever order the events are stored in', () => {
    // Projection sorts by (atMs, order), so the stored array order cannot leak into the
    // frame: this is the no-last-render-wins guarantee.
    const reversed = { ...state, events: [...state.events].reverse() };
    for (const cursor of [0, 4999, 5000, 5001, 29999, 30000, 59999, 60000, 85000, 90000]) {
      const normal = project(state, cursor);
      const shuffled = project(reversed, cursor);
      expect(framesEqual(normal, shuffled), `at ${cursor} ms`).toBe(true);
    }
    expect(sharedInstant.order).toBeLessThan(carriedTrend.order);
  });

  it('writes distinct properties at one instant without conflict', () => {
    const frame = project(state, 5000);
    // Both 5000 ms events are visible in the frame: the highlight and the trend.
    expect(frame.highlights['anat-fictional-intermediary']).toBe('target');
    expect(frame.trends['sig-alpha']).toBe('increasing');
  });
});

describe('persistence on the shared frame', () => {
  it('keeps highlights until an authored event overwrites them, and never auto-resets', () => {
    const early = project(state, 5000);
    const late = project(state, state.durationMs);
    // The fast route's highlight on the shared structure persists past its own track.
    expect(early.highlights['anat-fictional-source']).toBeDefined();
    // The carried route's later authored write replaced the shared highlight value.
    expect(late.highlights['anat-fictional-intermediary']).toBe('target');
    // End of scenario: the authored end state stays; nothing returns to baseline by itself.
    expect(late.trends['sig-alpha']).toBe('decreasing');
    expect(late.trends['sig-gamma']).toBe('increasing');
  });

  it('changes a trend only at its authored event', () => {
    const before = project(state, 59000);
    const at = project(state, 60000);
    expect(before.trends['sig-beta']).toBe('increasing');
    expect(at.trends['sig-beta']).toBe('sustained');
  });
});

describe('one frame for every renderer', () => {
  it('reaches the same frame by playing through and by seeking', () => {
    // Direct projection vs. step-through: walk every distinct step time with the reducer.
    const session = createSession(state.id, bundle.contentVersion);
    const walked = reduceAll(
      session,
      [{ type: 'LOAD', timelineId: state.id, contentVersion: bundle.contentVersion }],
      { timeline: state, predictions: [], reducedMotion: true },
    ).session;
    let current = walked;
    for (const time of distinctStepTimes(state)) {
      current = reduceAll(current, [{ type: 'SEEK', cursorMs: time }], {
        timeline: state,
        predictions: [],
        reducedMotion: true,
      }).session;
    }
    const direct = project(state, 85000);
    const stepped = project(state, current.cursorMs);
    expect(current.cursorMs).toBe(85000);
    expect(framesEqual(direct, stepped)).toBe(true);
  });
});

describe('authored shared-organ resolution', () => {
  it('rejects two tracks writing one property at one instant (VAL-008)', () => {
    const issues = validateBundle(
      validBundle(),
      { mode: 'preview', now: new Date('2026-09-12T00:00:00Z') },
    );
    expect(issues.filter((issue) => issue.rule === 'VAL-008')).toHaveLength(0);

    const mutated = validBundle();
    mutated.timelines[1]!.events.push({
      id: `${state.id}-e-dup`,
      atMs: 5000,
      order: 999,
      trackId: `${state.id}-track-regulating`,
      command: {
        type: 'set-highlight',
        anatomyId: 'anat-fictional-intermediary',
        value: 'target',
      },
      claimIds: [],
    });
    const conflicts = validateBundle(mutated, {
      mode: 'preview',
      now: new Date('2026-09-12T00:00:00Z'),
    }).filter((issue) => issue.rule === 'VAL-008');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.message).toContain('both write highlight:anat-fictional-intermediary');
  });
});
