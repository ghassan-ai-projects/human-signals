/**
 * The selected-entity panel.
 *
 * Document 02: a signal page carries its definition, roles by pathway, source and target
 * relations, related states, evidence and comparisons; an anatomy selection lists all published
 * relationships involving that region and offers a relevant journey. When nothing is released for
 * a region, the panel says so and points at the nearest relevant released items.
 */
import { Link } from 'react-router-dom';
import type { Depth } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import type { ExploreSelection } from '../../app/urls.ts';
import { compareUrl, timelineUrl } from '../../app/urls.ts';
import { describeEdge, presentEdge } from '../../renderers/shared/edge-presentation.ts';
import { EvidenceSummary } from '../evidence/EvidenceSummary.tsx';
import styles from './EntityPanel.module.css';

export interface EntityPanelProps {
  repository: ContentRepository;
  selection: ExploreSelection;
  depth: Depth;
  onSelect: (kind: 'signal' | 'anatomy' | 'concept', id: string) => void;
}

export function EntityPanel({
  repository,
  selection,
  depth,
  onSelect,
}: EntityPanelProps): React.JSX.Element {
  const record =
    selection.kind === 'signal'
      ? repository.getSignal(selection.id)
      : selection.kind === 'anatomy'
        ? repository.getAnatomy(selection.id)
        : repository.getConcept(selection.id);

  if (!record) {
    return (
      <section className={styles.panel} aria-labelledby="hs-entity-heading">
        <h2 id="hs-entity-heading">That item is not in this content version</h2>
        <p>
          Nothing similar has been opened in its place. Choose an item from the catalog to carry on.
        </p>
      </section>
    );
  }

  const relationships = repository.relationshipsFor(record.id);
  const timelines = repository.timelinesFor(record.id);
  const signal = selection.kind === 'signal' ? repository.getSignal(selection.id) : undefined;
  const anatomy = selection.kind === 'anatomy' ? repository.getAnatomy(selection.id) : undefined;
  const concept = selection.kind === 'concept' ? repository.getConcept(selection.id) : undefined;

  const description =
    signal?.description[depth] ?? anatomy?.description[depth] ?? concept?.definition[depth] ?? '';

  return (
    <section className={styles.panel} aria-labelledby="hs-entity-heading">
      <h2 id="hs-entity-heading">{record.label}</h2>
      {'aliases' in record && record.aliases.length > 0 && (
        <p className={styles.aliases}>Also called: {record.aliases.join(', ')}</p>
      )}
      {anatomy && (
        <p className={styles.aliases}>
          {anatomy.view === 'body' ? 'Body view' : anatomy.view} ·{' '}
          {anatomy.laterality === 'not-applicable'
            ? 'no left or right'
            : `anatomical ${anatomy.laterality}`}
        </p>
      )}
      <p>{description}</p>
      <EvidenceSummary
        repository={repository}
        claimIds={record.claimIds}
        onOpenEvidence={() => undefined}
      />

      {signal && (
        <>
          <h3>Roles by pathway</h3>
          <ul className={styles.roles}>
            {signal.roles.map((role, index) => (
              <li key={`${role.kind}-${String(index)}`}>
                <strong>{role.kind.replace('-', ' ')}</strong> in{' '}
                {role.contextIds
                  .map((contextId) => repository.getContext(contextId)?.label ?? contextId)
                  .join(', ')}
                . Released from{' '}
                {role.sourceAnatomyIds
                  .map((anatomyId) => repository.labelOf(anatomyId) ?? anatomyId)
                  .join(', ')}
                .
              </li>
            ))}
          </ul>
          <h3>A common misunderstanding</h3>
          <p>{signal.misconception[depth]}</p>
          <p>
            <Link to={compareUrl(signal.id, undefined, depth)}>Compare this signal with another</Link>
          </p>
        </>
      )}

      <h3>Relationships</h3>
      {relationships.length === 0 ? (
        <p className={styles.empty}>
          No released relationship involves this item yet in this content version.
        </p>
      ) : (
        <ul className={styles.relationships}>
          {relationships.map((relationship) => {
            const presentation = presentEdge(relationship);
            const otherId =
              relationship.source.id === record.id
                ? relationship.target.id
                : relationship.source.id;
            const otherKind =
              relationship.source.id === record.id
                ? relationship.target.kind
                : relationship.source.kind;
            return (
              <li key={relationship.id}>
                <p className={styles.relationText}>
                  {describeEdge(
                    relationship,
                    repository.labelOf(relationship.source.id) ?? relationship.source.id,
                    repository.labelOf(relationship.target.id) ?? relationship.target.id,
                  )}
                  {presentation.feedbackLabel !== null && (
                    <span className={styles.feedbackTag}>feedback</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(otherKind, otherId);
                  }}
                >
                  Go to {repository.labelOf(otherId) ?? otherId}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <h3>Lessons that cover it</h3>
      {timelines.length === 0 ? (
        <div className={styles.empty}>
          <p>No released lesson covers this item yet.</p>
          <p>
            The nearest released lessons are listed below, so you are not left at a dead end.
          </p>
          <ul>
            {repository.bundle.timelines.slice(0, 3).map((timeline) => (
              <li key={timeline.id}>
                <Link to={timelineUrl(timeline.id, timeline.kind, { depth })}>{timeline.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul>
          {timelines.map((timeline) => (
            <li key={timeline.id}>
              <Link to={timelineUrl(timeline.id, timeline.kind, { depth })}>
                View lesson: {timeline.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
