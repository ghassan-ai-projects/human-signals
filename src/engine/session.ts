/**
 * Session controller: the impure half of playback, expressed as a pure reducer.
 *
 * The reducer owns status, cursor, checkpoints and exposure. It never touches storage; instead
 * it returns effects that the platform layer performs, so the whole transition table in
 * document 06 is testable without React, a DOM or a clock.
 */
import type { Prediction, Timeline } from '../content/schema.ts';
import { clampCursor, nextStepTime, previousStepTime } from './frame.ts';

export type PlaybackStatus =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'question'
  | 'feedback'
  | 'completed'
  | 'error';

export type Speed = 0.5 | 1 | 2;
export const SPEEDS: Speed[] = [0.5, 1, 2];

export interface Session {
  timelineId: string;
  contentVersion: string;
  status: PlaybackStatus;
  cursorMs: number;
  speed: Speed;
  activePredictionId?: string;
  selectedOptionId?: string;
  handledCheckpointIds: string[];
  exposedFamilyIds: string[];
  predictionsEnabled: boolean;
  /**
   * Checkpoints whose explanation or evidence was opened while the question was unanswered.
   * Document 06 requires such an answer to be recorded as assisted rather than unassisted; the
   * specification's illustrative Session type does not name the field, so it is added here.
   */
  assistedPredictionIds: string[];
  errorCode?: string;
}

export interface AttemptDraft {
  questionId: string;
  familyId: string;
  objectiveId: string;
  /** The chosen option, or `null` when the learner skipped. */
  selectedOptionId: string | null;
  correct: boolean;
  firstAttempt: boolean;
  assisted: boolean;
  exposedBefore: boolean;
}

export type SessionEffect =
  | { type: 'record-attempt'; attempt: AttemptDraft }
  | { type: 'mark-exposed'; familyIds: string[] }
  | { type: 'record-completion'; timelineId: string };

export type SessionAction =
  | { type: 'LOAD'; timelineId: string; contentVersion: string; cursorMs?: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TICK'; elapsedMs: number }
  | { type: 'CHOOSE'; optionId: string }
  | { type: 'SUBMIT' }
  | { type: 'SKIP' }
  | { type: 'CONTINUE' }
  | { type: 'SEEK'; cursorMs: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESTART' }
  | { type: 'SET_SPEED'; speed: Speed }
  | { type: 'SET_PREDICTIONS_ENABLED'; enabled: boolean }
  | { type: 'OPEN_EXPLANATION' }
  | { type: 'HIDE_TAB' }
  | { type: 'ERROR'; code: string };

export interface SessionContext {
  timeline: Timeline;
  predictions: readonly Prediction[];
  /** The effective preference: system setting plus any explicit user override. */
  reducedMotion: boolean;
  /** Families already exposed in an earlier session, read from local progress. */
  priorExposedFamilyIds?: readonly string[];
  /** Questions already answered in an earlier session, so a repeat is practice. */
  priorAnsweredQuestionIds?: readonly string[];
}

export interface ReduceResult {
  session: Session;
  effects: SessionEffect[];
}

export function createSession(
  timelineId: string,
  contentVersion: string,
  options: { predictionsEnabled?: boolean; exposedFamilyIds?: readonly string[] } = {},
): Session {
  return {
    timelineId,
    contentVersion,
    status: 'idle',
    cursorMs: 0,
    speed: 1,
    handledCheckpointIds: [],
    exposedFamilyIds: [...(options.exposedFamilyIds ?? [])],
    predictionsEnabled: options.predictionsEnabled ?? true,
    assistedPredictionIds: [],
  };
}

function checkpointsOf(ctx: SessionContext): Prediction[] {
  return ctx.predictions
    .filter((prediction) => prediction.timelineId === ctx.timeline.id)
    .sort((a, b) => a.atMs - b.atMs);
}

/** The earliest unhandled checkpoint strictly after the cursor. */
function nextCheckpoint(session: Session, ctx: SessionContext): Prediction | undefined {
  if (!session.predictionsEnabled) return undefined;
  return checkpointsOf(ctx).find(
    (prediction) =>
      prediction.atMs > session.cursorMs && !session.handledCheckpointIds.includes(prediction.id),
  );
}

/** A checkpoint sitting exactly at the cursor, including one at zero. */
function checkpointAtCursor(session: Session, ctx: SessionContext): Prediction | undefined {
  if (!session.predictionsEnabled) return undefined;
  return checkpointsOf(ctx).find(
    (prediction) =>
      prediction.atMs === session.cursorMs && !session.handledCheckpointIds.includes(prediction.id),
  );
}

function withUnique(list: readonly string[], value: string): string[] {
  return list.includes(value) ? [...list] : [...list, value];
}

function union(list: readonly string[], values: readonly string[]): string[] {
  const out = [...list];
  for (const value of values) if (!out.includes(value)) out.push(value);
  return out;
}

/**
 * Completing a lesson shows the causal summary, which gives every answer away (document 06).
 * Returns the families that were not yet exposed, so the caller can add the effect.
 */
function completeLesson(
  session: Session,
  ctx: SessionContext,
  effects: SessionEffect[],
): Session {
  const all = checkpointsOf(ctx).map((prediction) => prediction.familyId);
  const remaining = all.filter((familyId) => !session.exposedFamilyIds.includes(familyId));
  const next: Session = { ...session, exposedFamilyIds: union(session.exposedFamilyIds, all) };
  if (remaining.length > 0) effects.push({ type: 'mark-exposed', familyIds: remaining });
  return next;
}

/**
 * Seeking never interrupts with a question. Every checkpoint at or before the destination counts
 * as bypassed, and a family becomes exposed once the destination crosses its reveal boundary.
 * Seeking backwards never clears exposure or handled state.
 */
function applySeek(
  session: Session,
  ctx: SessionContext,
  target: number,
): { session: Session; effects: SessionEffect[] } {
  const cursorMs = clampCursor(ctx.timeline, target);
  const checkpoints = checkpointsOf(ctx);
  const handled = union(
    session.handledCheckpointIds,
    checkpoints.filter((prediction) => prediction.atMs <= cursorMs).map((prediction) => prediction.id),
  );
  const newlyExposed = checkpoints
    .filter((prediction) => prediction.revealAtMs <= cursorMs)
    .map((prediction) => prediction.familyId)
    .filter((familyId) => !session.exposedFamilyIds.includes(familyId));

  const next: Session = {
    ...session,
    status: cursorMs >= ctx.timeline.durationMs ? 'completed' : 'paused',
    cursorMs,
    handledCheckpointIds: handled,
    exposedFamilyIds: union(session.exposedFamilyIds, newlyExposed),
  };
  delete next.activePredictionId;
  delete next.selectedOptionId;

  const effects: SessionEffect[] = [];
  if (newlyExposed.length > 0) effects.push({ type: 'mark-exposed', familyIds: newlyExposed });
  if (next.status === 'completed' && session.status !== 'completed') {
    effects.push({ type: 'record-completion', timelineId: ctx.timeline.id });
    next.exposedFamilyIds = completeLesson(next, ctx, effects).exposedFamilyIds;
  }
  return { session: next, effects };
}

function usable(status: PlaybackStatus): boolean {
  return status !== 'error';
}

export function reduce(session: Session, action: SessionAction, ctx: SessionContext): ReduceResult {
  const none = (next: Session = session): ReduceResult => ({ session: next, effects: [] });

  if (action.type === 'ERROR') {
    return none({ ...session, status: 'error', errorCode: action.code });
  }
  if (!usable(session.status) && action.type !== 'LOAD') return none();

  switch (action.type) {
    case 'LOAD': {
      const loaded = createSession(action.timelineId, action.contentVersion, {
        predictionsEnabled: session.predictionsEnabled,
        exposedFamilyIds: ctx.priorExposedFamilyIds ?? session.exposedFamilyIds,
      });
      loaded.speed = session.speed;
      if (action.cursorMs !== undefined && action.cursorMs > 0) {
        // A deep link to a step applies the same exposure rules as seeking there from zero.
        return applySeek(loaded, ctx, action.cursorMs);
      }
      return none(loaded);
    }

    case 'PLAY': {
      if (session.status === 'completed') return none();
      if (session.status !== 'idle' && session.status !== 'paused') return none();
      if (session.cursorMs >= ctx.timeline.durationMs) return none();
      // A checkpoint exactly at the cursor is answered before the clock starts.
      const waiting = checkpointAtCursor(session, ctx);
      if (waiting) {
        const next: Session = { ...session, status: 'question', activePredictionId: waiting.id };
        delete next.selectedOptionId;
        return none(next);
      }
      // Reduced motion never autoplays; the learner steps manually instead.
      if (ctx.reducedMotion) return none({ ...session, status: 'paused' });
      return none({ ...session, status: 'playing' });
    }

    case 'PAUSE':
      return session.status === 'playing' ? none({ ...session, status: 'paused' }) : none();

    case 'HIDE_TAB':
      return session.status === 'playing' ? none({ ...session, status: 'paused' }) : none();

    case 'TICK': {
      if (session.status !== 'playing') return none();
      if (!Number.isFinite(action.elapsedMs) || action.elapsedMs < 0) return none();
      const proposed = session.cursorMs + action.elapsedMs * session.speed;
      const checkpoint = nextCheckpoint(session, ctx);
      // A long frame must stop exactly at the authored checkpoint, not past it.
      if (checkpoint && proposed >= checkpoint.atMs) {
        const next: Session = {
          ...session,
          status: 'question',
          cursorMs: checkpoint.atMs,
          activePredictionId: checkpoint.id,
        };
        delete next.selectedOptionId;
        return none(next);
      }
      if (proposed >= ctx.timeline.durationMs) {
        const effects: SessionEffect[] = [
          { type: 'record-completion', timelineId: ctx.timeline.id },
        ];
        const finished = completeLesson(
          { ...session, status: 'completed', cursorMs: ctx.timeline.durationMs },
          ctx,
          effects,
        );
        return { session: finished, effects };
      }
      // Crossing a reveal boundary while playing records exposure. This matters when
      // interruptions are off: the setting controls interruptions, not assessment integrity.
      const newlyExposed = checkpointsOf(ctx)
        .filter(
          (prediction) =>
            prediction.revealAtMs <= proposed && !session.exposedFamilyIds.includes(prediction.familyId),
        )
        .map((prediction) => prediction.familyId);
      if (newlyExposed.length > 0) {
        return {
          session: { ...session, cursorMs: proposed, exposedFamilyIds: union(session.exposedFamilyIds, newlyExposed) },
          effects: [{ type: 'mark-exposed', familyIds: newlyExposed }],
        };
      }
      return none({ ...session, cursorMs: proposed });
    }

    case 'CHOOSE':
      if (session.status !== 'question') return none();
      return none({ ...session, selectedOptionId: action.optionId });

    case 'SUBMIT': {
      if (session.status !== 'question') return none();
      const prediction = ctx.predictions.find((item) => item.id === session.activePredictionId);
      if (!prediction || session.selectedOptionId === undefined) return none();
      const exposedBefore = session.exposedFamilyIds.includes(prediction.familyId);
      const assisted = session.assistedPredictionIds.includes(prediction.id);
      const attempt: AttemptDraft = {
        questionId: prediction.id,
        familyId: prediction.familyId,
        objectiveId: prediction.objectiveId,
        selectedOptionId: session.selectedOptionId,
        correct: session.selectedOptionId === prediction.correctOptionId,
        firstAttempt:
          !exposedBefore && !(ctx.priorAnsweredQuestionIds ?? []).includes(prediction.id) && !assisted,
        assisted,
        exposedBefore,
      };
      return {
        session: {
          ...session,
          status: 'feedback',
          exposedFamilyIds: withUnique(session.exposedFamilyIds, prediction.familyId),
        },
        effects: [
          { type: 'record-attempt', attempt },
          { type: 'mark-exposed', familyIds: [prediction.familyId] },
        ],
      };
    }

    case 'SKIP': {
      if (session.status !== 'question') return none();
      const prediction = ctx.predictions.find((item) => item.id === session.activePredictionId);
      if (!prediction) return none();
      const exposedBefore = session.exposedFamilyIds.includes(prediction.familyId);
      const next: Session = {
        ...session,
        status: 'paused',
        cursorMs: prediction.revealAtMs,
        handledCheckpointIds: withUnique(session.handledCheckpointIds, prediction.id),
        exposedFamilyIds: withUnique(session.exposedFamilyIds, prediction.familyId),
      };
      delete next.activePredictionId;
      delete next.selectedOptionId;
      return {
        session: next,
        effects: [
          {
            type: 'record-attempt',
            attempt: {
              questionId: prediction.id,
              familyId: prediction.familyId,
              objectiveId: prediction.objectiveId,
              selectedOptionId: null,
              correct: false,
              firstAttempt: false,
              assisted: session.assistedPredictionIds.includes(prediction.id),
              exposedBefore,
            },
          },
          { type: 'mark-exposed', familyIds: [prediction.familyId] },
        ],
      };
    }

    case 'CONTINUE': {
      if (session.status !== 'feedback') return none();
      const prediction = ctx.predictions.find((item) => item.id === session.activePredictionId);
      if (!prediction) return none();
      const next: Session = {
        ...session,
        status: ctx.reducedMotion ? 'paused' : 'playing',
        cursorMs: prediction.revealAtMs,
        handledCheckpointIds: withUnique(session.handledCheckpointIds, prediction.id),
      };
      delete next.activePredictionId;
      delete next.selectedOptionId;
      if (next.cursorMs >= ctx.timeline.durationMs) {
        const effects: SessionEffect[] = [
          { type: 'record-completion', timelineId: ctx.timeline.id },
        ];
        const completed = completeLesson(
          { ...next, status: 'completed', cursorMs: ctx.timeline.durationMs },
          ctx,
          effects,
        );
        return { session: completed, effects };
      }
      return none(next);
    }

    case 'SEEK':
      return applySeek(session, ctx, action.cursorMs);

    case 'NEXT_STEP': {
      const target = nextStepTime(ctx.timeline, session.cursorMs);
      return target === undefined ? none() : applySeek(session, ctx, target);
    }

    case 'PREV_STEP': {
      const target = previousStepTime(ctx.timeline, session.cursorMs);
      return target === undefined ? none() : applySeek(session, ctx, target);
    }

    case 'RESTART': {
      const next: Session = {
        ...session,
        status: 'idle',
        cursorMs: 0,
        // Checkpoints become available again; exposure and attempts are history and are kept.
        handledCheckpointIds: [],
        assistedPredictionIds: [],
      };
      delete next.activePredictionId;
      delete next.selectedOptionId;
      return none(next);
    }

    case 'SET_SPEED':
      // Changing speed re-anchors the clock in the platform layer; it never restarts the lesson.
      return none({ ...session, speed: action.speed });

    case 'SET_PREDICTIONS_ENABLED': {
      const next: Session = { ...session, predictionsEnabled: action.enabled };
      if (!action.enabled && session.status === 'question') {
        next.status = 'paused';
        delete next.activePredictionId;
        delete next.selectedOptionId;
      }
      return none(next);
    }

    case 'OPEN_EXPLANATION': {
      // Opening Why or evidence always stops the clock and preserves the cursor.
      if (session.status === 'question' && session.activePredictionId !== undefined) {
        const prediction = ctx.predictions.find((item) => item.id === session.activePredictionId);
        const next: Session = {
          ...session,
          assistedPredictionIds: withUnique(session.assistedPredictionIds, session.activePredictionId),
        };
        if (prediction) {
          next.exposedFamilyIds = withUnique(session.exposedFamilyIds, prediction.familyId);
          return {
            session: next,
            effects: [{ type: 'mark-exposed', familyIds: [prediction.familyId] }],
          };
        }
        return none(next);
      }
      if (session.status === 'playing') return none({ ...session, status: 'paused' });
      return none();
    }
  }
}

/** Applies a sequence of actions, collecting every effect. Convenience for tests and the UI. */
export function reduceAll(
  session: Session,
  actions: readonly SessionAction[],
  ctx: SessionContext,
): ReduceResult {
  let current = session;
  const effects: SessionEffect[] = [];
  for (const action of actions) {
    const result = reduce(current, action, ctx);
    current = result.session;
    effects.push(...result.effects);
  }
  return { session: current, effects };
}
