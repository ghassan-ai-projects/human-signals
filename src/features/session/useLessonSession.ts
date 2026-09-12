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

  const [session, rawDispatch] = useReducer(
    (current: Session, action: SessionAction): Session => {
      const result = reduce(current, action, contextRef.current);
      for (const effect of result.effects) effectSink.current?.(effect);
      return result.session;
    },
    undefined,
    () =>
      createSession(timeline.id, contentVersion, {
        predictionsEnabled,
        ...(priorExposedFamilyIds ? { exposedFamilyIds: priorExposedFamilyIds } : {}),
      }),
  );

  const dispatch = useCallback((action: SessionAction) => {
    rawDispatch(action);
  }, []);

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
