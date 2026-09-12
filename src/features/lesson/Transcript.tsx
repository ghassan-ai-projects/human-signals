/**
 * The ordered causal transcript.
 *
 * Document 07: an ordered HTML transcript is available with either renderer, and no
 * canvas-only information is needed to complete a lesson. Every step names its relationship,
 * sign, transport and timing band, so the lesson can be read rather than watched.
 */
import type { Depth, Timeline } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import { describeEdge, presentEdge } from '../../renderers/shared/edge-presentation.ts';
import styles from './Transcript.module.css';

export interface TranscriptProps {
  repository: ContentRepository;
  timeline: Timeline;
  depth: Depth;
  cursorMs: number;
  onSelectStep: (stepId: string) => void;
  onOpenRelationship: (relationshipId: string) => void;
}

export function Transcript({
  repository,
  timeline,
  depth,
  cursorMs,
  onSelectStep,
  onOpenRelationship,
}: TranscriptProps): React.JSX.Element {
  const steps = timeline.steps.toSorted((a, b) => a.atMs - b.atMs || a.id.localeCompare(b.id));

  return (
    <section aria-labelledby="hs-transcript-heading" className={styles.transcript}>
      <h2 id="hs-transcript-heading">Causal transcript</h2>
      <p className={styles.intro}>
        Every step of this lesson in order, with its relationship, direction and route. This is the
        same content the diagram shows.
      </p>
      <ol className={styles.list}>
        {steps.map((step) => {
          const track = timeline.tracks.find((item) => item.id === step.trackId);
          const band = timeline.timingBands.find((item) => item.id === step.timingBandId);
          const reached = step.atMs <= cursorMs;
          return (
            <li key={step.id} className={reached ? styles.itemReached : styles.item}>
              <h3 className={styles.stepHeading}>
                <span className={styles.stage}>{step.stage}</span> {step.label}
              </h3>
              <p className={styles.meta}>
                {track ? `${track.label} track` : 'Main track'}
                {band ? ` · ${band.label}` : ''}
              </p>
              <p>{step.caption[depth]}</p>
              {step.relationIds.length > 0 && (
                <ul className={styles.relations}>
                  {step.relationIds.map((relationshipId) => {
                    const relationship = repository.getRelationship(relationshipId);
                    if (!relationship) return null;
                    const presentation = presentEdge(relationship);
                    return (
                      <li key={relationshipId}>
                        <span>
                          {describeEdge(
                            relationship,
                            repository.labelOf(relationship.source.id) ?? relationship.source.id,
                            repository.labelOf(relationship.target.id) ?? relationship.target.id,
                          )}
                        </span>
                        {presentation.feedbackLabel !== null && (
                          <span className={styles.feedbackTag}>feedback</span>
                        )}
                        <button
                          type="button"
                          className={styles.whyButton}
                          // The visible word is short; the accessible name names the edge.
                          aria-label={`Why? ${relationship.label}`}
                          onClick={() => {
                            onOpenRelationship(relationshipId);
                          }}
                        >
                          Why?
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                className={styles.goButton}
                aria-label={`Go to this step: ${step.label}`}
                onClick={() => {
                  onSelectStep(step.id);
                }}
              >
                Go to this step
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
