/**
 * Current state of each track: caption, biological timing label and ordinal trends.
 *
 * Document 02: trend strips use labelled categories, never quantities, percentages or
 * measured-looking axes, and biological timing sits beside the track with its caveat. Muting a
 * visual track never removes its contribution from the text.
 */
import type { Depth, Timeline, Trend } from '../../content/schema.ts';
import type { Frame } from '../../engine/frame.ts';
import type { ContentRepository } from '../../content/repository.ts';
import styles from './TrackPanel.module.css';

const NOT_STARTED = 'This track has not started in this lesson yet.';

const TREND_TEXT: Record<Trend, { label: string; glyph: string }> = {
  baseline: { label: 'at its baseline in this scenario', glyph: '=' },
  increasing: { label: 'increasing in this scenario', glyph: '▲' },
  decreasing: { label: 'decreasing in this scenario', glyph: '▼' },
  sustained: { label: 'staying raised in this scenario', glyph: '■' },
  variable: { label: 'variable in this scenario', glyph: '~' },
  'not-shown': { label: 'not shown in this lesson', glyph: '·' },
};

export interface TrackPanelProps {
  repository: ContentRepository;
  timeline: Timeline;
  frame: Frame;
  depth: Depth;
  focusedTrackId: string | null;
  onFocusTrack: (trackId: string | null) => void;
}

export function TrackPanel({
  repository,
  timeline,
  frame,
  depth,
  focusedTrackId,
  onFocusTrack,
}: TrackPanelProps): React.JSX.Element {
  const trends = Object.entries(frame.trends).filter(([, value]) => value !== 'not-shown');

  return (
    <section className={styles.panel} aria-label="What is happening now">
      <div className={styles.tracks}>
        {timeline.tracks
          .toSorted((a, b) => a.order - b.order)
          .map((track) => {
            const stepId = frame.activeStepByTrack[track.id];
            const step = timeline.steps.find((item) => item.id === stepId);
            const band = timeline.timingBands.find(
              (item) => item.id === frame.timingBandByTrack[track.id],
            );
            const dimmed = focusedTrackId !== null && focusedTrackId !== track.id;
            return (
              <article
                key={track.id}
                className={dimmed ? styles.trackDimmed : styles.track}
                aria-label={`${track.label} track`}
              >
                <header className={styles.trackHeader}>
                  <h3>
                    <span className={styles.trackMarker} aria-hidden="true">
                      {track.order + 1}
                    </span>
                    {track.label}
                  </h3>
                  {timeline.tracks.length > 1 && (
                    <button
                      type="button"
                      className={styles.focusButton}
                      aria-pressed={focusedTrackId === track.id}
                      onClick={() => {
                        onFocusTrack(focusedTrackId === track.id ? null : track.id);
                      }}
                    >
                      {focusedTrackId === track.id ? 'Show all tracks' : 'Focus this track'}
                    </button>
                  )}
                </header>
                {dimmed ? (
                  // Focused view: other tracks collapse to a summary line. Nothing is removed
                  // from the lesson text; the transcript still carries their full contribution.
                  <p className={styles.dimmedCaption}>
                    {step ? step.label : NOT_STARTED}
                  </p>
                ) : step ? (
                  <>
                    <p className={styles.caption}>{step.caption[depth]}</p>
                    {band && (
                      <p className={styles.timing}>
                        <strong>Biological timing:</strong> {band.label}. {band.note}
                      </p>
                    )}
                  </>
                ) : (
                  <p className={styles.caption}>{NOT_STARTED}</p>
                )}
              </article>
            );
          })}
      </div>

      {focusedTrackId !== null && (
        <p className={styles.focusNote} role="status">
          Focused view: the other tracks are summarised here and remain in full in the causal
          transcript.
        </p>
      )}

      {trends.length > 0 && (
        <div className={styles.trends}>
          <h3 className={styles.trendsHeading}>Signals in this scenario</h3>
          <ul>
            {trends.map(([signalId, trend]) => (
              <li key={signalId}>
                <span aria-hidden="true" className={styles.trendGlyph}>
                  {TREND_TEXT[trend].glyph}
                </span>
                <strong>{repository.labelOf(signalId) ?? signalId}</strong> is{' '}
                {TREND_TEXT[trend].label}
              </li>
            ))}
          </ul>
          <p className={styles.trendsNote}>
            These are directions in this authored scenario, not measured amounts.
          </p>
        </div>
      )}
    </section>
  );
}
