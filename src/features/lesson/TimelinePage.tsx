/**
 * The route wrapper around the lesson player, shared by journeys, states and exercises.
 *
 * Document 02: an unknown identifier shows a recovery page and never a similarly named
 * substitute. Document 08: opening a link never autoplays, and the canonical share link is built
 * from the current active step.
 */
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useRepository } from '../../app/ContentProvider.tsx';
import { usePreferences } from '../../app/PreferencesProvider.tsx';
import { useDepth } from '../../app/useDepth.ts';
import { DepthControl } from '../settings/DepthControl.tsx';
import { timelineUrl } from '../../app/urls.ts';
import { LessonPlayer } from './LessonPlayer.tsx';
import styles from './TimelinePage.module.css';

const KIND_NOUN: Record<'journey' | 'state' | 'exercise', string> = {
  journey: 'Signal journey',
  state: 'Human state',
  exercise: 'Abstract exercise',
};

export function TimelinePage({ kind }: { kind: 'journey' | 'state' | 'exercise' }): React.JSX.Element {
  const { id = '' } = useParams();
  const repository = useRepository();
  const [depth, setDepth] = useDepth();
  const { preferences, reducedMotion } = usePreferences();
  const [copied, setCopied] = useState(false);

  const timeline = repository.getTimeline(id);

  if (!timeline || timeline.kind !== kind) {
    return (
      <main id="main" tabIndex={-1} className={styles.page}>
        <h1>That lesson is not available</h1>
        <p>
          Human Signals could not find a {KIND_NOUN[kind].toLowerCase()} with that address. It may
          have been withdrawn for review, or the link may be mistyped. Nothing similar has been
          opened in its place.
        </p>
        <ul>
          <li>
            <Link to="/explore">Browse what is published</Link>
          </li>
          <li>
            <Link to="/">Go to the home page</Link>
          </li>
        </ul>
      </main>
    );
  }

  const prerequisites = timeline.prerequisiteConceptIds
    .map((conceptId) => repository.getConcept(conceptId))
    .filter((concept): concept is NonNullable<typeof concept> => concept !== undefined);

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kind}>{KIND_NOUN[kind]}</p>
        <h1>{timeline.label}</h1>
        <div className={styles.headerControls}>
          <DepthControl depth={depth} onChange={setDepth} />
          <button
            type="button"
            onClick={() => {
              const link = `${globalThis.location.origin}${globalThis.location.pathname}#${timelineUrl(timeline.id, kind, { depth })}`;
              void navigator.clipboard?.writeText(link).then(
                () => {
                  setCopied(true);
                },
                () => {
                  setCopied(false);
                },
              );
            }}
          >
            Copy link to this lesson
          </button>
          {copied && (
            <span role="status" className={styles.copied}>
              Link copied.
            </span>
          )}
        </div>
      </header>

      {prerequisites.length > 0 && (
        <section className={styles.prerequisites} aria-labelledby="hs-prerequisites">
          <h2 id="hs-prerequisites">Helpful before you start</h2>
          <dl>
            {prerequisites.map((concept) => (
              <div key={concept.id}>
                <dt>{concept.label}</dt>
                <dd>{concept.definition[depth]}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.prerequisiteNote}>
            These are links, not locks. You can start the lesson whenever you want.
          </p>
        </section>
      )}

      <LessonPlayer
        repository={repository}
        timeline={timeline}
        depth={depth}
        reducedMotion={reducedMotion}
        predictionsEnabled={preferences.predictionsEnabled}
        prefers3D={preferences.view === '3d'}
      />

      {timeline.relatedTimelineIds.length > 0 && (
        <section aria-labelledby="hs-related">
          <h2 id="hs-related">Related lessons</h2>
          <ul>
            {timeline.relatedTimelineIds.map((relatedId) => {
              const related = repository.getTimeline(relatedId);
              return related === undefined ? null : (
                <li key={relatedId}>
                  <Link to={timelineUrl(related.id, related.kind, { depth })}>{related.label}</Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
