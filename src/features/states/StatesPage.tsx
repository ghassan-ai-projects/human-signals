/**
 * The Human States catalog.
 *
 * Document 03: an unsupported scenario is simply absent from the picker — never a "coming soon"
 * entry — and each card states the scenario it depicts before the learner opens it.
 */
import { Link } from 'react-router-dom';
import { useRepository } from '../../app/ContentProvider.tsx';
import { useDepth } from '../../app/useDepth.ts';
import { DepthControl } from '../settings/DepthControl.tsx';
import { stateUrl } from '../../app/urls.ts';
import styles from './StatesPage.module.css';

export function StatesPage(): React.JSX.Element {
  const repository = useRepository();
  const [depth, setDepth] = useDepth();
  const states = repository.bundle.timelines.filter((timeline) => timeline.kind === 'state');

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <div className={styles.header}>
        <h1>Human states</h1>
        <DepthControl depth={depth} onChange={setDepth} />
      </div>
      <p className={styles.lede}>
        A human state shows several systems responding to one scenario at the same time, with each
        track labelled and its own biological timing described in words.
      </p>

      {states.length === 0 ? (
        <p className={styles.empty}>
          No human state has been released in this content version. Human states depend on
          scientific review, and none has been recorded yet.
        </p>
      ) : (
        <ul className={styles.cards}>
          {states.map((state) => (
            <li key={state.id}>
              <h2>
                <Link to={stateUrl(state.id, { depth })}>{state.label}</Link>
              </h2>
              <p>{state.description[depth]}</p>
              <p className={styles.tracks}>
                {state.tracks.length} parallel tracks:{' '}
                {state.tracks
                  .toSorted((a, b) => a.order - b.order)
                  .map((track) => track.label)
                  .join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
