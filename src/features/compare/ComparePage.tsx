/**
 * The two-signal comparison (work package 5, AC-08).
 *
 * Document 02: two selectors, curated starting pairs, aligned dimensions, context and
 * references. Only authored dimensions appear; a dimension without an authored value is
 * labelled, never invented, and a `not-comparable` value keeps its authored reason. Changing
 * one choice updates only that column and the URL. The table keeps both values on one row, so
 * a narrow viewport never needs horizontal scrolling.
 */
import { useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRepository } from '../../app/ContentProvider.tsx';
import { useDepth } from '../../app/useDepth.ts';
import { safeId, timelineUrl } from '../../app/urls.ts';
import { comparisonDimensions, type ComparisonDimension, type Depth, type Signal } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import { DepthControl } from '../settings/DepthControl.tsx';
import { EvidencePanel } from '../evidence/EvidencePanel.tsx';
import { useEvidenceOverlay } from '../evidence/useEvidenceOverlay.ts';
import styles from './ComparePage.module.css';

const DIMENSION_LABEL: Record<ComparisonDimension, string> = {
  type: 'Signal type',
  sources: 'Principal sources in covered contexts',
  transport: 'Transport mode',
  targets: 'Targets and context',
  effects: 'Effects',
  timing: 'Timing description',
  regulation: 'Feedback and regulation',
  misconception: 'Common misconception',
};

export function ComparePage(): React.JSX.Element {
  const repository = useRepository();
  const [params, setParams] = useSearchParams();
  const [depth, setDepth] = useDepth();
  const { evidence, openEvidence, closeEvidence } = useEvidenceOverlay();

  const signals = useMemo(
    () => [...repository.bundle.signals].sort((a, b) => a.label.localeCompare(b.label)),
    [repository],
  );

  const rawA = params.get('a');
  const rawB = params.get('b');
  const requestedA = safeId(rawA);
  const requestedB = safeId(rawB);
  const first = requestedA === null ? undefined : repository.getSignal(requestedA);
  const second = requestedB === null ? undefined : repository.getSignal(requestedB);
  // An empty value is treated as no value; anything else malformed recovers without a substitute.
  const malformed =
    (rawA !== null && rawA !== '' && requestedA === null) ||
    (rawB !== null && rawB !== '' && requestedB === null) ||
    (requestedA !== null && first === undefined) ||
    (requestedB !== null && second === undefined);
  const identical = requestedA !== null && requestedA === requestedB;

  const setSelection = useCallback(
    (slot: 'a' | 'b', id: string | null) => {
      const next = new URLSearchParams(params);
      if (id === null || id === '') next.delete(slot);
      else next.set(slot, id);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const curated =
    first !== undefined && second !== undefined
      ? repository.getCuratedComparison(first.id, second.id)
      : undefined;

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <header className={styles.header}>
        <h1>Compare two signals</h1>
        <p className={styles.intro}>
          Pick any two released signals to see their authored dimensions side by side. Nothing is
          scored or ranked here: a shared row never means the two signals act the same way.
        </p>
      </header>

      <section className={styles.controls} aria-label="Signal selection">
        <label className={styles.selector}>
          <span>First signal</span>
          <select
            value={requestedA ?? ''}
            onChange={(event) => {
              setSelection('a', event.target.value);
            }}
          >
            <option value="">Choose a signal…</option>
            {signals.map((signal) => (
              <option key={signal.id} value={signal.id}>
                {signal.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.selector}>
          <span>Second signal</span>
          <select
            value={requestedB ?? ''}
            onChange={(event) => {
              setSelection('b', event.target.value);
            }}
          >
            <option value="">Choose a signal…</option>
            {signals.map((signal) => (
              <option key={signal.id} value={signal.id}>
                {signal.label}
              </option>
            ))}
          </select>
        </label>
        <DepthControl depth={depth} onChange={setDepth} />
      </section>

      {malformed && (
        <section className={styles.recovery} role="status">
          <h2>That comparison is not available</h2>
          <p>
            One of the signals in this address is not part of the released content. Nothing
            similar has been opened in its place. Choose two signals above, or{' '}
            <Link to="/explore">browse what is published</Link>.
          </p>
        </section>
      )}

      {!malformed && identical && first !== undefined && (
        <p role="status" className={styles.recovery}>
          Both selectors name {first.label}. Comparison needs two different signals — choose
          another signal as the second column.
        </p>
      )}

      {repository.bundle.comparisons.length > 0 && first === undefined && (
        <section className={styles.curatedStart} aria-labelledby="hs-curated-start">
          <h2 id="hs-curated-start">Curated starting pairs</h2>
          <ul>
            {repository.bundle.comparisons.map((pair) => (
              <li key={pair.id}>
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set('a', pair.signalIds[0]);
                    next.set('b', pair.signalIds[1]);
                    setParams(next, { replace: true });
                  }}
                >
                  {pair.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {first !== undefined && second !== undefined && curated !== undefined && (
        <section className={styles.curated} aria-labelledby="hs-curated-title">
          <h2 id="hs-curated-title">{curated.title}</h2>
          <p>{curated.explanation[depth]}</p>
          <button
            type="button"
            onClick={() => {
              openEvidence(curated.claimIds, curated.title);
            }}
          >
            Evidence for this comparison
          </button>
        </section>
      )}

      {first !== undefined && second === undefined && !malformed && !identical && (
        <p role="status" className={styles.prompt}>
          {first.label} is in the first column. Choose a second signal to see the two together.
        </p>
      )}

      {second !== undefined && first === undefined && !malformed && (
        <p role="status" className={styles.prompt}>
          {second.label} is in the second column. Choose a first signal to see the two together.
        </p>
      )}

      {first !== undefined && second !== undefined && !identical && (
        <table className={styles.table}>
          <caption className={styles.caption}>
            {first.label} and {second.label}, compared on the authored dimensions at{' '}
            {depth} depth.
          </caption>
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              <th scope="col">{first.label}</th>
              <th scope="col">{second.label}</th>
            </tr>
          </thead>
          <tbody>
            {comparisonDimensions.map((dimension) => (
              <tr key={dimension}>
                <th scope="row">{DIMENSION_LABEL[dimension]}</th>
                <td>
                  <SignalCell
                    signal={first}
                    dimension={dimension}
                    depth={depth}
                    repository={repository}
                    onEvidence={openEvidence}
                  />
                </td>
                <td>
                  <SignalCell
                    signal={second}
                    dimension={dimension}
                    depth={depth}
                    repository={repository}
                    onEvidence={openEvidence}
                  />
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">Lessons that cover it</th>
              <td>
                <JourneyLinks signal={first} repository={repository} />
              </td>
              <td>
                <JourneyLinks signal={second} repository={repository} />
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {evidence !== null && (
        <EvidencePanel
          repository={repository}
          claimIds={evidence.claimIds}
          title={evidence.title}
          onClose={closeEvidence}
        />
      )}
    </main>
  );
}

function SignalCell({
  signal,
  dimension,
  depth,
  repository,
  onEvidence,
}: {
  signal: Signal;
  dimension: ComparisonDimension;
  depth: Depth;
  repository: ContentRepository;
  onEvidence: (claimIds: string[], title: string) => void;
}): React.JSX.Element {
  const cell = signal.comparison.find((item) => item.dimension === dimension);
  if (cell === undefined) {
    return (
      <p className={styles.notAuthored}>
        Not authored in this content version, so nothing is claimed here.
      </p>
    );
  }
  if (cell.applicability === 'not-comparable') {
    return (
      <div>
        <p>
          <strong>Not comparable here.</strong> {cell.text[depth]}
        </p>
        <ContextLine contextIds={cell.contextIds} repository={repository} />
      </div>
    );
  }
  return (
    <div>
      <p>{cell.text[depth]}</p>
      <ContextLine contextIds={cell.contextIds} repository={repository} />
      {cell.claimIds.length > 0 && (
        <button
          type="button"
          className={styles.evidence}
          onClick={() => {
            onEvidence(cell.claimIds, `${signal.label}: ${DIMENSION_LABEL[dimension]}`);
          }}
        >
          Evidence
        </button>
      )}
    </div>
  );
}

function ContextLine({
  contextIds,
  repository,
}: {
  contextIds: readonly string[];
  repository: ContentRepository;
}): React.JSX.Element | null {
  if (contextIds.length === 0) return null;
  const labels = contextIds
    .map((contextId) => repository.getContext(contextId)?.label)
    .filter((label): label is string => label !== undefined);
  if (labels.length === 0) return null;
  return <p className={styles.context}>Context: {labels.join('; ')}</p>;
}

function JourneyLinks({
  signal,
  repository,
}: {
  signal: Signal;
  repository: ContentRepository;
}): React.JSX.Element {
  const lessons = signal.journeyIds
    .map((timelineId) => repository.getTimeline(timelineId))
    .filter((timeline): timeline is NonNullable<typeof timeline> => timeline !== undefined);
  if (lessons.length === 0) return <p className={styles.notAuthored}>No lesson covers it yet.</p>;
  return (
    <ul className={styles.lessons}>
      {lessons.map((timeline) => (
        <li key={timeline.id}>
          <Link to={timelineUrl(timeline.id, timeline.kind)}>{timeline.label}</Link>
        </li>
      ))}
    </ul>
  );
}
