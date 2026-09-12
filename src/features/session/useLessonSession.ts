/**
 * Binds the pure session reducer to the browser: one clock, one cursor owner.
 *
 * Document 08: establish a single cursor owner; neither renderer creates its own lesson clock.
 * Document 06: pause on tab hide and drop the anchor, so returning never catches up on
 * background wall time.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Prediction, Timeline } from '../../content/schema.ts';
import { project, type Frame } from '../../engine/frame.ts';
import {
  createSession,
  reduce,
  type Session,
  type SessionAction,
  type SessionContext,
  type SessionEffect,
} from '../../engine/session.ts';
import { createAnimationFrameTicker } from '../../platform/browser-clock.ts';

export interface LessonSession {
  session: Session;
  frame: Frame;
  dispatch: (action: SessionAction) => void;
  /** Effects since the last read, for the progress store to persist. */
  activePrediction: Prediction | undefined;
}

export interface UseLessonSessionOptions {
  timeline: Timeline;
  predictions: readonly Prediction[];
  contentVersion: string;
  reducedMotion: boolean;
  predictionsEnabled: boolean;
  initialCursorMs?: number;
  priorExposedFamilyIds?: readonly string[];
  priorAnsweredQuestionIds?: readonly string[];
  onEffect?: (effect: SessionEffect) => void;
}

interface SessionState {
  session: Session;
  /** Effects produced by the latest transition, drained exactly once after commit. */
  effects: SessionEffect[];
  /** Monotonic count of applied transitions; grows when effects accumulate. */
  transitions: number;
}

export function useLessonSession(options: UseLessonSessionOptions): LessonSession {
  const {
    timeline,
    predictions,
    contentVersion,
    reducedMotion,
    predictionsEnabled,
    initialCursorMs,
    priorExposedFamilyIds,
    priorAnsweredQuestionIds,
    onEffect,
  } = options;

  const contextRef = useRef<SessionContext>({ timeline, predictions, reducedMotion });
  contextRef.current = {
    timeline,
    predictions,
    reducedMotion,
    ...(priorExposedFamilyIds ? { priorExposedFamilyIds } : {}),
    ...(priorAnsweredQuestionIds ? { priorAnsweredQuestionIds } : {}),
  };

  const effectSink = useRef(onEffect);
  effectSink.current = onEffect;

  // The reducer stays pure: effects travel with the state and are delivered after commit.
  // Firing them inside the reducer would record attempts twice whenever React re-invokes a
  // dispatch (StrictMode development, or a discarded concurrent render).
  const [state, rawDispatch] = useReducer(
    (current: SessionState, action: SessionAction): SessionState => {
      const result = reduce(current.session, action, contextRef.current);
      return {
        session: result.session,
        effects: [...current.effects, ...result.effects],
        transitions: current.transitions + 1,
      };
    },
    undefined,
    () => ({
      session: createSession(timeline.id, contentVersion, {
        predictionsEnabled,
        ...(priorExposedFamilyIds ? { exposedFamilyIds: priorExposedFamilyIds } : {}),
      }),
      effects: [],
      transitions: 0,
    }),
  );

  const deliveredRef = useRef(0);
  useEffect(() => {
    const pending = state.effects.slice(deliveredRef.current);
    deliveredRef.current = state.effects.length;
    for (const effect of pending) effectSink.current?.(effect);
  }, [state.effects]);

  const dispatch = useCallback((action: SessionAction) => {
    rawDispatch(action);
  }, []);

  const { session } = state;

  // Loading a different lesson resets the cursor and applies deep-link exposure rules.
  const loadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (loadedRef.current === timeline.id) return;
    loadedRef.current = timeline.id;
    dispatch({
      type: 'LOAD',
      timelineId: timeline.id,
      contentVersion,
      ...(initialCursorMs !== undefined ? { cursorMs: initialCursorMs } : {}),
    });
  }, [timeline.id, contentVersion, initialCursorMs, dispatch]);

  useEffect(() => {
    dispatch({ type: 'SET_PREDICTIONS_ENABLED', enabled: predictionsEnabled });
  }, [predictionsEnabled, dispatch]);

  const ticker = useMemo(() => createAnimationFrameTicker(), []);
  useEffect(() => {
    if (session.status !== 'playing') {
      ticker.stop();
      return undefined;
    }
    ticker.start((elapsedMs) => {
      dispatch({ type: 'TICK', elapsedMs });
    });
    return () => {
      ticker.stop();
    };
  }, [session.status, ticker, dispatch]);

  // Switching into reduced motion pauses immediately.
  useEffect(() => {
    if (reducedMotion && session.status === 'playing') dispatch({ type: 'PAUSE' });
  }, [reducedMotion, session.status, dispatch]);

  useEffect(() => {
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') dispatch({ type: 'HIDE_TAB' });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dispatch]);

  const frame = useMemo(() => project(timeline, session.cursorMs), [timeline, session.cursorMs]);

  const activePrediction = useMemo(
    () => predictions.find((prediction) => prediction.id === session.activePredictionId),
    [predictions, session.activePredictionId],
  );

  return { session, frame, dispatch, activePrediction };
}

/** A polite announcement throttled to at most one message every two seconds while playing. */
export function useThrottledAnnouncement(message: string, throttleMs = 2000): string {
  const [announced, setAnnounced] = useState(message);
  const last = useRef(0);
  const pending = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    const wait = Math.max(0, throttleMs - (now - last.current));
    if (wait === 0) {
      last.current = now;
      setAnnounced(message);
      return undefined;
    }
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = window.setTimeout(() => {
      last.current = Date.now();
      setAnnounced(message);
    }, wait);
    return () => {
      if (pending.current !== null) clearTimeout(pending.current);
    };
  }, [message, throttleMs]);

  return announced;
}
