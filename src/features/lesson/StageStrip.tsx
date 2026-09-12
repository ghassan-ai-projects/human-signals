/**
 * The stage strip.
 *
 * Document 02: every step exposes the named relationship independent of animation, feedback
 * stages appear in the strip, and selecting a stage seeks to its authored cursor and leaves the
 * lesson paused. Stages can repeat; the strip shows the authored sequence rather than forcing a
 * six-node template.
 */
import type { Depth, Timeline } from '../../content/schema.ts';
import type { Frame } from '../../engine/frame.ts';
import styles from './StageStrip.module.css';

const STAGE_LABELS: Record<Timeline['steps'][number]['stage'], string> = {
  trigger: 'Trigger',
  source: 'Source',
  signal: 'Signal',
  target: 'Target',
  effect: 'Effect',
  feedback: 'Feedback',
  regulation: 'Regulation',
};

export interface StageStripProps {
  timeline: Timeline;
  frame: Frame;
  depth: Depth;
  onSelectStep: (stepId: string) => void;
}

export function StageStrip({ timeline, frame, onSelectStep }: StageStripProps): React.JSX.Element {
  const activeIds = new Set(Object.values(frame.activeStepByTrack));

  return (
    <nav className={styles.strip} aria-label="Lesson stages">
      {timeline.tracks
        .toSorted((a, b) => a.order - b.order)
        .map((track) => {
          const steps = timeline.steps
            .filter((step) => step.trackId === track.id)
            .toSorted((a, b) => a.atMs - b.atMs);
          return (
            <div key={track.id} className={styles.track}>
              {timeline.tracks.length > 1 && (
                <h3 className={styles.trackLabel}>
                  <span className={styles.trackMarker} aria-hidden="true">
                    {track.order + 1}
                  </span>
                  {track.label}
                </h3>
              )}
              <ol className={styles.steps}>
                {steps.map((step) => {
                  const current = activeIds.has(step.id);
                  const passed = step.atMs <= frame.cursorMs;
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        className={current ? styles.stepCurrent : styles.step}
                        aria-current={current ? 'step' : undefined}
                        onClick={() => {
                          onSelectStep(step.id);
                        }}
                      >
                        <span className={styles.stage}>
                          {STAGE_LABELS[step.stage]}
                          {passed ? '' : ' (not yet shown)'}
                        </span>
                        <span className={styles.label}>{step.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
    </nav>
  );
}
