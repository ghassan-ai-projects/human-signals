/**
 * Transport controls.
 *
 * Document 06: the scrubber is explicitly labelled "Lesson position" and shows presentation time
 * only; biological timing is described beside the tracks and never derived from it. Document 10:
 * a visible pause control is always available, and the slider has a label, keyboard increments
 * and human-readable value text.
 */
import type { Session, Speed } from '../../engine/session.ts';
import { SPEEDS } from '../../engine/session.ts';
import styles from './PlaybackControls.module.css';

export interface PlaybackControlsProps {
  session: Session;
  durationMs: number;
  reducedMotion: boolean;
  stepTimes: number[];
  currentStepLabel: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (cursorMs: number) => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onRestart: () => void;
  onSpeed: (speed: Speed) => void;
}

function formatSeconds(ms: number): string {
  const total = Math.round(ms / 100) / 10;
  return `${total.toFixed(1)} s`;
}

export function PlaybackControls({
  session,
  durationMs,
  reducedMotion,
  stepTimes,
  currentStepLabel,
  onPlay,
  onPause,
  onSeek,
  onPreviousStep,
  onNextStep,
  onRestart,
  onSpeed,
}: PlaybackControlsProps): React.JSX.Element {
  const playing = session.status === 'playing';
  const atEnd = session.cursorMs >= durationMs;
  const index = stepTimes.filter((time) => time <= session.cursorMs).length;

  return (
    <section className={styles.controls} aria-label="Lesson playback">
      <div className={styles.row}>
        {playing ? (
          <button type="button" onClick={onPause} className={styles.primary}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={atEnd ? onRestart : onPlay}
            className={styles.primary}
            disabled={session.status === 'question' || session.status === 'feedback'}
          >
            {atEnd ? 'Replay' : session.status === 'idle' ? 'Start journey' : 'Play'}
          </button>
        )}
        <button type="button" onClick={onPreviousStep} disabled={session.cursorMs <= 0}>
          Previous step
        </button>
        <button type="button" onClick={onNextStep} disabled={atEnd}>
          Next step
        </button>
        <button type="button" onClick={onRestart}>
          Restart
        </button>
        <label className={styles.speed}>
          <span>Speed</span>
          <select
            value={session.speed}
            onChange={(event) => {
              onSpeed(Number(event.target.value) as Speed);
            }}
          >
            {SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}&times;
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.scrubber} htmlFor="hs-lesson-position">
          Lesson position
        </label>
        <input
          id="hs-lesson-position"
          type="range"
          min={0}
          max={durationMs}
          step={100}
          value={Math.round(session.cursorMs)}
          onChange={(event) => {
            onSeek(Number(event.target.value));
          }}
          aria-valuetext={`${formatSeconds(session.cursorMs)} of ${formatSeconds(durationMs)} of lesson presentation. Step ${index} of ${stepTimes.length}: ${currentStepLabel}`}
        />
        <output className={styles.readout} htmlFor="hs-lesson-position">
          {formatSeconds(session.cursorMs)} / {formatSeconds(durationMs)}
        </output>
      </div>

      <p className={styles.note}>
        This slider measures presentation time in the lesson, not time in the body. Biological
        timing is described beside each track.
        {reducedMotion
          ? ' Reduced motion is on, so the lesson advances only when you choose the next step.'
          : ''}
      </p>
    </section>
  );
}
