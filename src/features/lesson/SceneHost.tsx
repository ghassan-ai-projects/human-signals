/**
 * Chooses the renderer and guarantees the lesson survives losing it.
 *
 * Document 08: the accessible 2D summary is usable before the 3D code is downloaded, and 3D only
 * starts loading when the visible view asks for it. Document 10: WebGL unavailable or a lost
 * context falls back to 2D automatically, preserving the cursor and the selection, with an
 * explicit Retry 3D — and no retry loop.
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import type { ContentRepository } from '../../content/repository.ts';
import type { Frame } from '../../engine/frame.ts';
import { Diagram2D } from '../../renderers/diagram2d/Diagram2D.tsx';
import { detectWebgl2 } from '../../platform/webgl.ts';
import { ErrorBoundary } from '../../app/ErrorBoundary.tsx';
import { recordDiagnostic } from '../../platform/diagnostics.ts';
import styles from './SceneHost.module.css';

const Anatomy3D = lazy(() => import('../../renderers/anatomy3d/Anatomy3D.tsx'));

export interface SceneHostProps {
  repository: ContentRepository;
  frame: Frame;
  selectedId: string | null;
  reducedMotion: boolean;
  playing: boolean;
  prefers3D: boolean;
  onSelect: (anatomyId: string) => void;
  onOpenRelationship: (relationshipId: string) => void;
}

type SceneState =
  | { kind: 'three-d' }
  | { kind: 'two-d'; reason: 'preference' | 'unsupported' | 'failed' | 'context-lost' };

export function SceneHost({
  repository,
  frame,
  selectedId,
  reducedMotion,
  playing,
  prefers3D,
  onSelect,
  onOpenRelationship,
}: SceneHostProps): React.JSX.Element {
  const [view, setView] = useState<'body' | 'brain'>('body');
  // Feature detection runs once per mount; it is a fact about the browser, not lesson state.
  const supportsWebgl = useMemo(() => detectWebgl2() === 'webgl2', []);
  const [override, setOverride] = useState<SceneState | null>(null);

  const state: SceneState = override ?? {
    ...(prefers3D
      ? supportsWebgl
        ? ({ kind: 'three-d' } as const)
        : ({ kind: 'two-d', reason: 'unsupported' } as const)
      : ({ kind: 'two-d', reason: 'preference' } as const)),
  };

  useEffect(() => {
    if (prefers3D && !supportsWebgl) recordDiagnostic('WEBGL_UNAVAILABLE', 'journey');
  }, [prefers3D, supportsWebgl]);

  const fallBackTo2D = useCallback((reason: 'failed' | 'context-lost') => {
    recordDiagnostic(reason === 'context-lost' ? 'WEBGL_CONTEXT_LOST' : 'ASSET_LOAD', 'journey');
    setOverride({ kind: 'two-d', reason });
  }, []);
  const fallBackForAsset = useCallback(() => {
    fallBackTo2D('failed');
  }, [fallBackTo2D]);

  const hasBrainContent = repository.bundle.anatomy.some((record) => record.view === 'brain');

  const diagram = (
    <Diagram2D
      repository={repository}
      frame={frame}
      view={view === 'brain' && hasBrainContent ? 'brain' : 'body'}
      selectedId={selectedId}
      reducedMotion={reducedMotion}
      onSelect={onSelect}
      onOpenRelationship={onOpenRelationship}
    />
  );

  if (state.kind === 'two-d') {
    return (
      <div className={styles.host}>
        {state.reason !== 'preference' && (
          <p className={styles.notice} role="status">
            {state.reason === 'unsupported'
              ? 'This browser cannot show the 3D body, so the lesson is using the 2D diagram. It teaches the same relationships.'
              : state.reason === 'context-lost'
                ? 'The 3D view stopped responding, so the lesson continued in the 2D diagram. Your place in the lesson is unchanged.'
                : 'The 3D view could not be loaded, so the lesson is using the 2D diagram.'}
            {state.reason !== 'unsupported' && (
              <button
                type="button"
                className={styles.retry}
                onClick={() => {
                  setOverride({ kind: 'three-d' });
                }}
              >
                Retry 3D
              </button>
            )}
          </p>
        )}
        {diagram}
      </div>
    );
  }

  return (
    <div className={styles.host}>
      <div className={styles.viewSwitch}>
        <button
          type="button"
          aria-pressed={view === 'body'}
          onClick={() => {
            setView('body');
          }}
        >
          Whole body
        </button>
        <button
          type="button"
          aria-pressed={view === 'brain'}
          disabled={!hasBrainContent}
          onClick={() => {
            setView('brain');
          }}
        >
          Brain detail
        </button>
        {!hasBrainContent && (
          <span className={styles.switchNote}>
            No brain structure is released in this content version.
          </span>
        )}
      </div>
      <ErrorBoundary
        scope="renderer"
        code="WEBGL_CONTEXT_LOST"
        fallback={() => (
          <div className={styles.host}>
            <p className={styles.notice} role="status">
              The 3D view could not be shown, so the lesson is using the 2D diagram.
              <button
                type="button"
                className={styles.retry}
                onClick={() => {
                  setOverride({ kind: 'three-d' });
                }}
              >
                Retry 3D
              </button>
            </p>
            {diagram}
          </div>
        )}
      >
        {/* The 2D diagram is what the learner sees while the 3D chunk downloads. */}
        <Suspense fallback={diagram}>
          <Anatomy3D
            repository={repository}
            frame={frame}
            view={view}
            selectedId={selectedId}
            reducedMotion={reducedMotion}
            playing={playing}
            onSelect={onSelect}
            onOpenRelationship={onOpenRelationship}
            onContextLost={() => {
              fallBackTo2D('context-lost');
            }}
            onAssetLoadFailure={fallBackForAsset}
            {...(hasBrainContent ? { onChangeView: setView } : {})}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
