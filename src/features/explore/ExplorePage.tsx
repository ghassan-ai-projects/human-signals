/**
 * Explore: the body and the catalog as one navigable space.
 *
 * Document 02: a search and filter rail, a canvas, a panel for the selected item and its related
 * journeys. Selecting a region lists every published relationship involving it; a region with no
 * released lesson says so and offers the nearest relevant released items.
 */
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRepository } from '../../app/ContentProvider.tsx';
import { usePreferences } from '../../app/PreferencesProvider.tsx';
import { useDepth } from '../../app/useDepth.ts';
import { DepthControl } from '../settings/DepthControl.tsx';
import { SceneHost } from '../lesson/SceneHost.tsx';
import { AnatomyTree } from './AnatomyTree.tsx';
import { EntityPanel } from './EntityPanel.tsx';
import { parseExploreSelection, exploreUrl } from '../../app/urls.ts';
import type { Frame } from '../../engine/frame.ts';
import styles from './ExplorePage.module.css';

/** Explore is not playing a lesson, so the frame is the empty one. */
const EMPTY_FRAME: Frame = {
  cursorMs: 0,
  highlights: {},
  visibleRelationshipIds: [],
  trends: {},
  activeStepByTrack: {},
  timingBandByTrack: {},
};

export function ExplorePage(): React.JSX.Element {
  const repository = useRepository();
  const [params, setParams] = useSearchParams();
  const [depth, setDepth] = useDepth();
  const { preferences, reducedMotion } = usePreferences();

  const selection = parseExploreSelection(params);

  const frame = useMemo<Frame>(() => {
    if (selection === null) return EMPTY_FRAME;
    if (selection.kind === 'anatomy') {
      return { ...EMPTY_FRAME, highlights: { [selection.id]: 'active' } };
    }
    // Selecting a signal shows where it comes from, without implying a lesson is running.
    const signal = repository.getSignal(selection.id);
    const highlights: Frame['highlights'] = {};
    for (const role of signal?.roles ?? []) {
      for (const anatomyId of role.sourceAnatomyIds) highlights[anatomyId] = 'source';
    }
    return { ...EMPTY_FRAME, highlights };
  }, [selection, repository]);

  const select = (kind: 'signal' | 'anatomy' | 'concept', id: string): void => {
    const next = new URLSearchParams(params);
    next.delete('signal');
    next.delete('anatomy');
    next.delete('concept');
    next.set(kind, id);
    setParams(next);
  };

  const selectedAnatomyId = selection?.kind === 'anatomy' ? selection.id : null;

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <div className={styles.header}>
        <h1>Explore the body and its signals</h1>
        <DepthControl depth={depth} onChange={setDepth} />
      </div>

      <div className={styles.layout}>
        <aside className={styles.rail} aria-label="Catalog">
          <section>
            <h2 className={styles.railHeading}>Signals</h2>
            <ul className={styles.catalog}>
              {repository.bundle.signals.map((signal) => (
                <li key={signal.id}>
                  <button
                    type="button"
                    aria-pressed={selection?.kind === 'signal' && selection.id === signal.id}
                    onClick={() => {
                      select('signal', signal.id);
                    }}
                  >
                    {signal.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <AnatomyTree
            repository={repository}
            selectedId={selectedAnatomyId}
            highlights={frame.highlights}
            onSelect={(anatomyId) => {
              select('anatomy', anatomyId);
            }}
          />
        </aside>

        <div className={styles.canvas}>
          <SceneHost
            repository={repository}
            frame={frame}
            selectedId={selectedAnatomyId}
            reducedMotion={reducedMotion}
            playing={false}
            prefers3D={preferences.view === '3d'}
            onSelect={(anatomyId) => {
              select('anatomy', anatomyId);
            }}
            onOpenRelationship={(relationshipId) => {
              const relationship = repository.getRelationship(relationshipId);
              if (relationship) select(relationship.target.kind, relationship.target.id);
            }}
          />
        </div>

        <div className={styles.panel}>
          {selection === null ? (
            <section className={styles.empty} aria-labelledby="hs-explore-empty">
              <h2 id="hs-explore-empty">Choose a region or a signal</h2>
              <p>
                Pick a body region from the tree, or a signal from the list, and this panel will
                show what it does, which relationships involve it, and which lessons cover it.
              </p>
              <p>
                <Link to={exploreUrl(null, depth)}>Everything published in this build</Link> is in
                the catalog beside this panel.
              </p>
            </section>
          ) : (
            <EntityPanel
              repository={repository}
              selection={selection}
              depth={depth}
              onSelect={select}
            />
          )}
        </div>
      </div>
    </main>
  );
}
