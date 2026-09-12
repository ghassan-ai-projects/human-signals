/**
 * The document 06 transition table, exercised against the fictional development bundle.
 * Nothing here depends on React, a DOM, a clock or WebGL.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSession,
  reduce,
  reduceAll,
  type Session,
  type SessionContext,
} from '../../src/engine/session.ts';
import { project } from '../../src/engine/frame.ts';
import { FIXTURE_TIMELINE_ID, timelineOf, validBundle } from '../fixtures/bundle.ts';

const bundle = validBundle();
const timeline = timelineOf(bundle);
const predictions = bundle.predictions;
const FIRST = predictions.find((item) => item.id === 'pred-fictional-next')!;
const SECOND = predictions.find((item) => item.id === 'pred-fictional-feedback')!;

function context(overrides: Partial<SessionContext> = {}): SessionContext {
  return { timeline, predictions, reducedMotion: false, ...overrides };
}

let session: Session;
beforeEach(() => {
  session = createSession(FIXTURE_TIMELINE_ID, bundle.contentVersion);
});

describe('load and play', () => {
  it('loads paused at cursor zero with no active question', () => {
    expect(session.status).toBe('idle');
    expect(session.cursorMs).toBe(0);
    expect(session.activePredictionId).toBeUndefined();
  });

  it('plays from idle when motion is allowed', () => {
    expect(reduce(session, { type: 'PLAY' }, context()).session.status).toBe('playing');
  });

  it('stays paused under reduced motion so the learner steps manually', () => {
    const result = reduce(session, { type: 'PLAY' }, context({ reducedMotion: true }));
    expect(result.session.status).toBe('paused');
  });

  it('advances the cursor by elapsed time multiplied by speed', () => {
    const playing = reduce(session, { type: 'PLAY' }, context()).session;
    const fast = reduce({ ...playing, speed: 2 }, { type: 'TICK', elapsedMs: 500 }, context());
    expect(fast.session.cursorMs).toBe(1000);
    const slow = reduce({ ...playing, speed: 0.5 }, { type: 'TICK', elapsedMs: 500 }, context());
    expect(slow.session.cursorMs).toBe(250);
  });

  it('ignores a tick while paused, and pauses when the tab is hidden', () => {
    const playing = reduce(session, { type: 'PLAY' }, context()).session;
    const hidden = reduce(playing, { type: 'HIDE_TAB' }, context()).session;
    expect(hidden.status).toBe('paused');
    // Returning to the tab must not catch up using background wall time.
    expect(reduce(hidden, { type: 'TICK', elapsedMs: 30_000 }, context()).session.cursorMs).toBe(0);
  });

  it('records completion once when the end is reached', () => {
    const playing = { ...session, status: 'playing' as const, cursorMs: timeline.durationMs - 10 };
    const result = reduce(
      { ...playing, predictionsEnabled: false },
      { type: 'TICK', elapsedMs: 100 },
      context(),
    );
    expect(result.session.status).toBe('completed');
    expect(result.effects).toContainEqual({ type: 'record-completion', timelineId: timeline.id });
    // Playing again from completed does not silently clear the completion.
    expect(reduce(result.session, { type: 'PLAY' }, context()).session.status).toBe('completed');
  });
});

describe('checkpoints', () => {
  it('stops exactly at the authored checkpoint even when a frame is long', () => {
    const playing = { ...session, status: 'playing' as const, cursorMs: 0 };
    const result = reduce(playing, { type: 'TICK', elapsedMs: 60_000 }, context());
    expect(result.session.status).toBe('question');
    expect(result.session.cursorMs).toBe(FIRST.atMs);
  });

  it('does not reveal the answer while the question is open', () => {
    const playing = { ...session, status: 'playing' as const, cursorMs: 2700 };
    const { session: asked } = reduce(playing, { type: 'TICK', elapsedMs: 1000 }, context());
    const frame = project(timeline, asked.cursorMs);
    expect(frame.visibleRelationshipIds).not.toContain('rel-beta-gamma');
  });

  it('checks for a checkpoint at the current cursor before starting the clock', () => {
    const atCheckpoint = { ...session, status: 'paused' as const, cursorMs: FIRST.atMs };
    const result = reduce(atCheckpoint, { type: 'PLAY' }, context());
    expect(result.session.status).toBe('question');
    expect(result.session.activePredictionId).toBe(FIRST.id);
  });

  it('never interrupts on a seek, and treats a checkpoint at the destination as bypassed', () => {
    const result = reduce(session, { type: 'SEEK', cursorMs: FIRST.atMs }, context());
    expect(result.session.status).toBe('paused');
    expect(result.session.handledCheckpointIds).toContain(FIRST.id);
    // Playing on from there does not reopen the bypassed question.
    expect(reduce(result.session, { type: 'PLAY' }, context()).session.status).toBe('playing');
  });

  it('bypasses but does not expose a checkpoint when seeking into the reveal gap', () => {
    const gap = Math.floor((FIRST.atMs + FIRST.revealAtMs) / 2);
    const result = reduce(session, { type: 'SEEK', cursorMs: gap }, context());
    expect(result.session.handledCheckpointIds).toContain(FIRST.id);
    expect(result.session.exposedFamilyIds).not.toContain(FIRST.familyId);
    expect(result.effects).toEqual([]);
  });

  it('exposes the family once the seek target crosses the reveal boundary', () => {
    const result = reduce(session, { type: 'SEEK', cursorMs: FIRST.revealAtMs }, context());
    expect(result.session.exposedFamilyIds).toContain(FIRST.familyId);
    expect(result.effects).toContainEqual({ type: 'mark-exposed', familyIds: [FIRST.familyId] });
  });

  it('seeking backwards never clears exposure or handled state', () => {
    const forward = reduce(session, { type: 'SEEK', cursorMs: FIRST.revealAtMs }, context()).session;
    const back = reduce(forward, { type: 'SEEK', cursorMs: 0 }, context()).session;
    expect(back.exposedFamilyIds).toContain(FIRST.familyId);
    expect(back.handledCheckpointIds).toContain(FIRST.id);
  });

  it('records exposure even when interruptions are disabled', () => {
    const quiet = { ...session, predictionsEnabled: false };
    const result = reduce(quiet, { type: 'SEEK', cursorMs: timeline.durationMs }, context());
    expect(result.session.exposedFamilyIds).toEqual(
      expect.arrayContaining([FIRST.familyId, SECOND.familyId]),
    );
  });

  it('records exposure while playing past a reveal with interruptions disabled', () => {
    const quiet = { ...session, predictionsEnabled: false, status: 'playing' as const };
    const result = reduce(quiet, { type: 'TICK', elapsedMs: 3100 }, context());
    expect(result.session.cursorMs).toBe(3100);
    expect(result.session.exposedFamilyIds).toContain(FIRST.familyId);
    expect(result.effects).toEqual([
      { type: 'mark-exposed', familyIds: [FIRST.familyId] },
    ]);
  });

  it('finishing playback by ticking to the end exposes every family, like the summary', () => {
    const quiet = { ...session, predictionsEnabled: false, status: 'playing' as const };
    const result = reduce(quiet, { type: 'TICK', elapsedMs: 7000 }, context());
    expect(result.session.status).toBe('completed');
    expect(result.effects.map((effect) => effect.type)).toEqual(
      expect.arrayContaining(['record-completion', 'mark-exposed']),
    );
    expect(result.session.exposedFamilyIds).toEqual(
      expect.arrayContaining([FIRST.familyId, SECOND.familyId]),
    );
  });

  it('restart makes checkpoints available again but keeps exposure history', () => {
    const seen = reduce(session, { type: 'SEEK', cursorMs: timeline.durationMs }, context()).session;
    const restarted = reduce(seen, { type: 'RESTART' }, context()).session;
    expect(restarted.cursorMs).toBe(0);
    expect(restarted.status).toBe('idle');
    expect(restarted.handledCheckpointIds).toEqual([]);
    expect(restarted.exposedFamilyIds).toContain(FIRST.familyId);
  });

  it('a deep link to a later step applies the same exposure rules as seeking there', () => {
    const loaded = reduce(
      session,
      {
        type: 'LOAD',
        timelineId: FIXTURE_TIMELINE_ID,
        contentVersion: bundle.contentVersion,
        cursorMs: FIRST.revealAtMs,
      },
      context(),
    );
    expect(loaded.session.status).toBe('paused');
    expect(loaded.session.exposedFamilyIds).toContain(FIRST.familyId);
  });
});

describe('answering', () => {
  function askFirst(overrides: Partial<SessionContext> = {}): Session {
    const playing = { ...session, status: 'playing' as const };
    return reduce(playing, { type: 'TICK', elapsedMs: 60_000 }, context(overrides)).session;
  }

  it('selecting an option does not submit it', () => {
    const asked = askFirst();
    const chosen = reduce(asked, { type: 'CHOOSE', optionId: FIRST.correctOptionId }, context());
    expect(chosen.session.status).toBe('question');
    expect(chosen.effects).toEqual([]);
  });

  it('records exactly one attempt per submission', () => {
    const asked = askFirst();
    const result = reduceAll(
      asked,
      [{ type: 'CHOOSE', optionId: FIRST.correctOptionId }, { type: 'SUBMIT' }],
      context(),
    );
    const attempts = result.effects.filter((effect) => effect.type === 'record-attempt');
    expect(attempts).toHaveLength(1);
    expect(result.session.status).toBe('feedback');
    // A second submit in the feedback state cannot record a duplicate.
    expect(reduce(result.session, { type: 'SUBMIT' }, context()).effects).toEqual([]);
  });

  it('marks a first unassisted attempt as such and grades against the authored key', () => {
    const asked = askFirst();
    const wrongOption = FIRST.options.find((option) => option.id !== FIRST.correctOptionId)!;
    const result = reduceAll(
      asked,
      [{ type: 'CHOOSE', optionId: wrongOption.id }, { type: 'SUBMIT' }],
      context(),
    );
    const attempt = result.effects.find((effect) => effect.type === 'record-attempt')!;
    expect(attempt.attempt).toMatchObject({
      questionId: FIRST.id,
      familyId: FIRST.familyId,
      correct: false,
      firstAttempt: true,
      assisted: false,
      exposedBefore: false,
    });
  });

  it('classifies an answer as assisted after Why was opened on the open question', () => {
    const asked = askFirst();
    const helped = reduce(asked, { type: 'OPEN_EXPLANATION' }, context());
    expect(helped.session.exposedFamilyIds).toContain(FIRST.familyId);
    const result = reduceAll(
      helped.session,
      [{ type: 'CHOOSE', optionId: FIRST.correctOptionId }, { type: 'SUBMIT' }],
      context(),
    );
    const attempt = result.effects.find((effect) => effect.type === 'record-attempt')!;
    expect(attempt.attempt.assisted).toBe(true);
    expect(attempt.attempt.firstAttempt).toBe(false);
  });

  it('never counts a previously answered question as an unassisted first attempt', () => {
    const asked = askFirst();
    const result = reduceAll(
      asked,
      [{ type: 'CHOOSE', optionId: FIRST.correctOptionId }, { type: 'SUBMIT' }],
      context({ priorAnsweredQuestionIds: [FIRST.id] }),
    );
    const attempt = result.effects.find((effect) => effect.type === 'record-attempt')!;
    expect(attempt.attempt.firstAttempt).toBe(false);
  });

  it('skipping advances to the reveal, records a skip and exposes the family', () => {
    const asked = askFirst();
    const result = reduce(asked, { type: 'SKIP' }, context());
    expect(result.session.status).toBe('paused');
    expect(result.session.cursorMs).toBe(FIRST.revealAtMs);
    expect(result.session.handledCheckpointIds).toContain(FIRST.id);
    const attempt = result.effects.find((effect) => effect.type === 'record-attempt')!;
    expect(attempt.attempt.selectedOptionId).toBeNull();
    expect(attempt.attempt.firstAttempt).toBe(false);
  });

  it('continue resumes only when motion is allowed', () => {
    const asked = askFirst();
    const answered = reduceAll(
      asked,
      [{ type: 'CHOOSE', optionId: FIRST.correctOptionId }, { type: 'SUBMIT' }],
      context(),
    ).session;
    expect(reduce(answered, { type: 'CONTINUE' }, context()).session.status).toBe('playing');
    expect(
      reduce(answered, { type: 'CONTINUE' }, context({ reducedMotion: true })).session.status,
    ).toBe('paused');
    expect(reduce(answered, { type: 'CONTINUE' }, context()).session.cursorMs).toBe(FIRST.revealAtMs);
  });

  it('disabling interruptions closes an open question without recording an attempt', () => {
    const asked = askFirst();
    const result = reduce(asked, { type: 'SET_PREDICTIONS_ENABLED', enabled: false }, context());
    expect(result.session.status).toBe('paused');
    expect(result.effects).toEqual([]);
  });

  it('stops the clock when an explanation is opened during playback', () => {
    const playing = reduce(session, { type: 'PLAY' }, context()).session;
    expect(reduce(playing, { type: 'OPEN_EXPLANATION' }, context()).session.status).toBe('paused');
  });
});

describe('guards against out-of-order actions', () => {
  it('ignores actions that do not belong to the current status', () => {
    const ctx = context();
    expect(reduce(session, { type: 'PAUSE' }, ctx).session.status).toBe('idle');
    expect(reduce(session, { type: 'CHOOSE', optionId: 'x' }, ctx).session.selectedOptionId).toBeUndefined();
    expect(reduce(session, { type: 'SUBMIT' }, ctx).effects).toEqual([]);
    expect(reduce(session, { type: 'SKIP' }, ctx).effects).toEqual([]);
    expect(reduce(session, { type: 'CONTINUE' }, ctx).effects).toEqual([]);
    expect(reduce(session, { type: 'PREV_STEP' }, ctx).session.cursorMs).toBe(0);
    expect(reduce(session, { type: 'OPEN_EXPLANATION' }, ctx).session.status).toBe('idle');
  });

  it('will not play past the end of the lesson', () => {
    const atEnd = { ...session, status: 'paused' as const, cursorMs: timeline.durationMs };
    expect(reduce(atEnd, { type: 'PLAY' }, context()).session.status).toBe('paused');
    expect(reduce(atEnd, { type: 'NEXT_STEP' }, context()).session.cursorMs).toBe(timeline.durationMs);
  });

  it('does not submit a question with nothing selected', () => {
    const asked = reduce(
      { ...session, status: 'playing' as const },
      { type: 'TICK', elapsedMs: 60_000 },
      context(),
    ).session;
    const result = reduce(asked, { type: 'SUBMIT' }, context());
    expect(result.session.status).toBe('question');
    expect(result.effects).toEqual([]);
  });

  it('ignores a question that refers to a prediction the bundle does not contain', () => {
    const orphan = {
      ...session,
      status: 'question' as const,
      activePredictionId: 'pred-missing',
      selectedOptionId: 'x',
    };
    expect(reduce(orphan, { type: 'SUBMIT' }, context()).effects).toEqual([]);
    expect(reduce(orphan, { type: 'SKIP' }, context()).effects).toEqual([]);
    expect(reduce(orphan, { type: 'OPEN_EXPLANATION' }, context()).session.assistedPredictionIds).toContain(
      'pred-missing',
    );
    const feedback = { ...orphan, status: 'feedback' as const };
    expect(reduce(feedback, { type: 'CONTINUE' }, context()).session.status).toBe('feedback');
  });

  it('completes when continuing from a checkpoint whose reveal is the end of the lesson', () => {
    const lastPrediction = { ...SECOND, revealAtMs: timeline.durationMs };
    const ctx = context({ predictions: [FIRST, lastPrediction] });
    const answered = {
      ...session,
      status: 'feedback' as const,
      activePredictionId: lastPrediction.id,
      cursorMs: lastPrediction.atMs,
    };
    const result = reduce(answered, { type: 'CONTINUE' }, ctx);
    expect(result.session.status).toBe('completed');
    expect(result.effects).toContainEqual({ type: 'record-completion', timelineId: timeline.id });
  });

  it('changes speed without moving the cursor or restarting', () => {
    const playing = reduce(session, { type: 'PLAY' }, context()).session;
    const moved = reduce(playing, { type: 'TICK', elapsedMs: 400 }, context()).session;
    const faster = reduce(moved, { type: 'SET_SPEED', speed: 2 }, context()).session;
    expect(faster.cursorMs).toBe(moved.cursorMs);
    expect(faster.status).toBe('playing');
    expect(faster.speed).toBe(2);
  });

  it('re-enabling interruptions leaves the cursor and status alone', () => {
    const quiet = reduce(session, { type: 'SET_PREDICTIONS_ENABLED', enabled: false }, context()).session;
    const loud = reduce(quiet, { type: 'SET_PREDICTIONS_ENABLED', enabled: true }, context()).session;
    expect(loud.predictionsEnabled).toBe(true);
    expect(loud.status).toBe('idle');
  });

  it('carries exposure history from local progress into a newly loaded lesson', () => {
    const loaded = reduce(
      session,
      { type: 'LOAD', timelineId: FIXTURE_TIMELINE_ID, contentVersion: bundle.contentVersion },
      context({ priorExposedFamilyIds: [FIRST.familyId] }),
    ).session;
    expect(loaded.exposedFamilyIds).toEqual([FIRST.familyId]);
    expect(loaded.status).toBe('idle');
  });

  it('exposes every remaining family when the completed summary is reached', () => {
    const result = reduce(session, { type: 'SEEK', cursorMs: timeline.durationMs }, context());
    expect(result.session.status).toBe('completed');
    expect(result.session.exposedFamilyIds).toEqual(
      expect.arrayContaining([FIRST.familyId, SECOND.familyId]),
    );
  });
});

describe('failure handling', () => {
  it('enters the error state and ignores further playback actions', () => {
    const failed = reduce(session, { type: 'ERROR', code: 'CONTENT_SCHEMA' }, context()).session;
    expect(failed.status).toBe('error');
    expect(failed.errorCode).toBe('CONTENT_SCHEMA');
    expect(reduce(failed, { type: 'PLAY' }, context()).session.status).toBe('error');
    // Loading a new lesson recovers.
    const reloaded = reduce(
      failed,
      { type: 'LOAD', timelineId: FIXTURE_TIMELINE_ID, contentVersion: bundle.contentVersion },
      context(),
    );
    expect(reloaded.session.status).toBe('idle');
  });

  it('ignores a negative or non-finite tick', () => {
    const playing = reduce(session, { type: 'PLAY' }, context()).session;
    expect(reduce(playing, { type: 'TICK', elapsedMs: -100 }, context()).session.cursorMs).toBe(0);
    expect(reduce(playing, { type: 'TICK', elapsedMs: Number.NaN }, context()).session.cursorMs).toBe(0);
  });
});
