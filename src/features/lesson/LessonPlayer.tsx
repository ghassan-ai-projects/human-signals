/**
 * The lesson player, shared by journeys, human states and exercises.
 *
 * One cursor owner, one semantic frame, and every renderer downstream of it. The overview opens
 * paused with the whole stage sequence visible; opening Why or evidence pauses; completion shows
 * a causal summary rather than a claim of mastery (document 02).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Depth, Timeline } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import type { SessionEffect, Speed } from '../../engine/session.ts';
import { distinctStepTimes } from '../../engine/frame.ts';
import { Diagram2D } from '../../renderers/diagram2d/Diagram2D.tsx';
import { WhyPanel } from '../why/WhyPanel.tsx';
import { EvidencePanel } from '../evidence/EvidencePanel.tsx';
import { useAnnouncer } from '../../components/Announcer.tsx';
import { useLessonSession } from '../session/useLessonSession.ts';
import { PlaybackControls } from './PlaybackControls.tsx';
import { StageStrip } from './StageStrip.tsx';
import { TrackPanel } from './TrackPanel.tsx';
import { Transcript } from './Transcript.tsx';
import styles from './LessonPlayer.module.css';

export interface LessonPlayerProps {
  repository: ContentRepository;
  timeline: Timeline;
  depth: Depth;
  reducedMotion: boolean;
  predictionsEnabled: boolean;
  onEffect?: (effect: SessionEffect) => void;
  priorExposedFamilyIds?: readonly string[];
  priorAnsweredQuestionIds?: readonly string[];
  /** Rendered above the diagram; the 3D renderer is supplied by the page in work package 4. */
  renderScene?: (props: {
    frame: ReturnType<typeof useLessonSession>['frame'];
    selectedId: string | null;
    onSelect: (anatomyId: string) => void;
  }) => React.JSX.Element | null;
}

export function LessonPlayer({
  repository,
  timeline,
  depth,
  reducedMotion,
  predictionsEnabled,
  onEffect,
  priorExposedFamilyIds,
  priorAnsweredQuestionIds,
  renderScene,
}: LessonPlayerProps): React.JSX.Element {
  const [params, setParams] = useSearchParams();
  const { announce } = useAnnouncer();
  const predictions = useMemo(
    () => repository.predictionsFor(timeline.id),
    [repository, timeline.id],
  );

  const requestedStepId = params.get('step');
  const initialCursorMs = useMemo(() => {
    const step = timeline.steps.find((item) => item.id === requestedStepId);
    return step?.atMs;
  }, [timeline.steps, requestedStepId]);
  const unknownStep = requestedStepId !== null && initialCursorMs === undefined;

  const { session, frame, dispatch } = useLessonSession({
    timeline,
    predictions,
    contentVersion: repository.manifest.contentVersion,
    reducedMotion,
    predictionsEnabled,
    ...(initialCursorMs !== undefined ? { initialCursorMs } : {}),
    ...(priorExposedFamilyIds ? { priorExposedFamilyIds } : {}),
    ...(priorAnsweredQuestionIds ? { priorAnsweredQuestionIds } : {}),
    ...(onEffect ? { onEffect } : {}),
  });

  const [openRelationshipId, setOpenRelationshipId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<{ claimIds: string[]; title: string } | null>(null);
  const [selectedAnatomyId, setSelectedAnatomyId] = useState<string | null>(null);
  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(null);
  const lastInvoker = useRef<HTMLElement | null>(null);

  const stepTimes = useMemo(() => distinctStepTimes(timeline), [timeline]);

  const activeStepLabels = useMemo(() => {
    return timeline.tracks
      .map((track) => {
        const stepId = frame.activeStepByTrack[track.id];
        return timeline.steps.find((step) => step.id === stepId)?.label;
      })
      .filter((label): label is string => label !== undefined);
  }, [timeline, frame.activeStepByTrack]);

  const currentStepLabel = activeStepLabels.join('; ') || 'Lesson overview';

  // Announce meaningful step changes only, throttled while the lesson is playing.
  const announcedRef = useRef('');
  useEffect(() => {
    if (currentStepLabel === announcedRef.current) return;
    announcedRef.current = currentStepLabel;
    announce(currentStepLabel, { throttleMs: session.status === 'playing' ? 2000 : 0 });
  }, [currentStepLabel, session.status, announce]);

  const writeStepToUrl = useCallback(
    (stepId: string | null) => {
      const next = new URLSearchParams(params);
      if (stepId === null) next.delete('step');
      else next.set('step', stepId);
      // Replacement, so the Back stack is not filled with playback events.
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const seekToStep = useCallback(
    (stepId: string) => {
      const step = timeline.steps.find((item) => item.id === stepId);
      if (!step) return;
      dispatch({ type: 'SEEK', cursorMs: step.atMs });
      writeStepToUrl(stepId);
    },
    [timeline.steps, dispatch, writeStepToUrl],
  );

  const openRelationship = useCallback(
    (relationshipId: string) => {
      lastInvoker.current = document.activeElement as HTMLElement | null;
      dispatch({ type: 'OPEN_EXPLANATION' });
      setOpenRelationshipId(relationshipId);
    },
    [dispatch],
  );

  const closePanels = useCallback(() => {
    setOpenRelationshipId(null);
    setEvidence(null);
    lastInvoker.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      if (evidence !== null) {
        setEvidence(null);
        return;
      }
      if (openRelationshipId !== null) closePanels();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [evidence, openRelationshipId, closePanels]);

  const completed = session.status === 'completed';

  return (
    <div className={styles.player}>
      {unknownStep && (
        <p role="status" className={styles.notice}>
          That step is not part of this lesson, so it has opened at the overview instead.
        </p>
      )}

      <section className={styles.overview} aria-labelledby="hs-lesson-overview">
        <h2 id="hs-lesson-overview">What this lesson covers</h2>
        <p>{timeline.description[depth]}</p>
        <ul className={styles.objectives}>
          {timeline.objectiveIds.map((objectiveId) => {
            const objective = repository.getObjective(objectiveId);
            return objective === undefined ? null : (
              <li key={objectiveId}>
                {objective.statement}
                <span className={styles.pattern}> ({objective.pattern})</span>
              </li>
            );
          })}
        </ul>
        {timeline.contextIds.map((contextId) => {
          const context = repository.getContext(contextId);
          if (!context) return null;
          return (
            <details key={contextId} className={styles.context}>
              <summary>Scenario assumptions: {context.label}</summary>
              <p>{context.description[depth]}</p>
              {context.assumptions.length > 0 && (
                <>
                  <h3>Assumptions</h3>
                  <ul>
                    {context.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </>
              )}
              {context.exclusions.length > 0 && (
                <>
                  <h3>Not covered here</h3>
                  <ul>
                    {context.exclusions.map((exclusion) => (
                      <li key={exclusion}>{exclusion}</li>
                    ))}
                  </ul>
                </>
              )}
              <p>
                <strong>Variability:</strong> {context.variability}
              </p>
            </details>
          );
        })}
      </section>

      <StageStrip timeline={timeline} frame={frame} depth={depth} onSelectStep={seekToStep} />

      <div className={styles.stage}>
        {renderScene?.({ frame, selectedId: selectedAnatomyId, onSelect: setSelectedAnatomyId }) ?? (
          <Diagram2D
            repository={repository}
            frame={frame}
            view="body"
            selectedId={selectedAnatomyId}
            reducedMotion={reducedMotion}
            onSelect={setSelectedAnatomyId}
            onOpenRelationship={openRelationship}
          />
        )}
      </div>

      <PlaybackControls
        session={session}
        durationMs={timeline.durationMs}
        reducedMotion={reducedMotion}
        stepTimes={stepTimes}
        currentStepLabel={currentStepLabel}
        onPlay={() => {
          dispatch({ type: 'PLAY' });
        }}
        onPause={() => {
          dispatch({ type: 'PAUSE' });
        }}
        onSeek={(cursorMs) => {
          dispatch({ type: 'SEEK', cursorMs });
        }}
        onPreviousStep={() => {
          dispatch({ type: 'PREV_STEP' });
        }}
        onNextStep={() => {
          dispatch({ type: 'NEXT_STEP' });
        }}
        onRestart={() => {
          dispatch({ type: 'RESTART' });
          writeStepToUrl(null);
        }}
        onSpeed={(speed: Speed) => {
          dispatch({ type: 'SET_SPEED', speed });
        }}
      />

      <TrackPanel
        repository={repository}
        timeline={timeline}
        frame={frame}
        depth={depth}
        focusedTrackId={focusedTrackId}
        onFocusTrack={setFocusedTrackId}
      />

      {openRelationshipId !== null && (
        <WhyPanel
          repository={repository}
          relationshipId={openRelationshipId}
          depth={depth}
          onClose={closePanels}
          onOpenEvidence={(claimIds, title) => {
            setEvidence({ claimIds, title });
          }}
          onOpenRelationship={setOpenRelationshipId}
        />
      )}

      {evidence !== null && (
        <EvidencePanel
          repository={repository}
          claimIds={evidence.claimIds}
          title={evidence.title}
          onClose={() => {
            setEvidence(null);
          }}
        />
      )}

      {completed && (
        <section className={styles.completion} aria-labelledby="hs-lesson-complete">
          <h2 id="hs-lesson-complete">Journey completed</h2>
          <p>{timeline.summary[depth]}</p>
          <p className={styles.completionNote}>
            Completing a lesson means you reached the end of it. It is not a measure of mastery.
          </p>
        </section>
      )}

      <section className={styles.limitations} aria-labelledby="hs-lesson-limits">
        <h2 id="hs-lesson-limits">What this lesson simplifies</h2>
        <p>{timeline.limitations[depth]}</p>
        {timeline.feedbackCoverage.kind === 'not-depicted' && (
          <p>
            <strong>Feedback is not depicted here.</strong> {timeline.feedbackCoverage.reason[depth]}
          </p>
        )}
      </section>

      <Transcript
        repository={repository}
        timeline={timeline}
        depth={depth}
        cursorMs={frame.cursorMs}
        onSelectStep={seekToStep}
        onOpenRelationship={openRelationship}
      />
    </div>
  );
}
