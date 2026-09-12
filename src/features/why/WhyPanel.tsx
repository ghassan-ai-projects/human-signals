/**
 * The Why panel: one relationship, then a finite trail of deeper explanations.
 *
 * Document 02: the header names source, relationship and target; up to three deeper questions
 * appear at each level; breadcrumbs preserve the path and Back returns within the panel; after
 * four nested levels deeper links are offered as new trails rather than continuing to nest. The
 * panel is persistent, so it does not trap focus, and closing it restores the invoking control.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Depth } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import { presentEdge } from '../../renderers/shared/edge-presentation.ts';
import { EvidenceSummary } from '../evidence/EvidenceSummary.tsx';
import styles from './WhyPanel.module.css';

export const MAX_TRAIL_DEPTH = 4;

export interface WhyPanelProps {
  repository: ContentRepository;
  relationshipId: string;
  depth: Depth;
  onClose: () => void;
  onOpenEvidence: (claimIds: string[], title: string) => void;
  onOpenRelationship: (relationshipId: string) => void;
  /** The explanation currently on screen; the exposure map may mark its families as seen. */
  onExplanationOpened?: (explanationId: string) => void;
}

export function WhyPanel({
  repository,
  relationshipId,
  depth,
  onClose,
  onOpenEvidence,
  onOpenRelationship,
  onExplanationOpened,
}: WhyPanelProps): React.JSX.Element | null {
  const relationship = repository.getRelationship(relationshipId);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The trail belongs to one relationship. Opening a different edge starts a new trail without
  // an effect, so there is no render where the panel shows the previous edge's questions. The
  // open glossary term is keyed the same way, so it never arrives pre-expanded on a new edge.
  const [trailState, setTrailState] = useState<{ relationshipId: string; trail: string[] }>({
    relationshipId,
    trail: relationship ? [relationship.whyRootId] : [],
  });
  const [conceptState, setConceptState] = useState<{
    relationshipId: string;
    openConceptId: string | null;
  }>({ relationshipId, openConceptId: null });
  const trail =
    trailState.relationshipId === relationshipId && trailState.trail.length > 0
      ? trailState.trail
      : relationship
        ? [relationship.whyRootId]
        : [];
  const setTrail = (next: string[]): void => {
    setTrailState({ relationshipId, trail: next });
  };
  const openConceptId =
    conceptState.relationshipId === relationshipId ? conceptState.openConceptId : null;
  const toggleConcept = (conceptId: string | null): void => {
    setConceptState({ relationshipId, openConceptId: conceptId });
  };

  useEffect(() => {
    headingRef.current?.focus();
  }, [relationshipId]);

  const current = repository.getExplanation(trail[trail.length - 1] ?? '');

  // Reading an answer-revealing explanation counts as exposure (document 06), so the panel
  // reports which explanation is on screen. The effect re-runs only when the trail moves.
  const currentId = current?.id;
  useEffect(() => {
    if (currentId !== undefined) onExplanationOpened?.(currentId);
  }, [currentId, onExplanationOpened]);

  const deeper = useMemo(() => {
    return (current?.deeperIds ?? [])
      .map((id) => repository.getExplanation(id))
      .filter((explanation): explanation is NonNullable<typeof explanation> => Boolean(explanation));
  }, [current, repository]);

  if (!relationship || !current) return null;

  const sourceLabel = repository.labelOf(relationship.source.id) ?? relationship.source.id;
  const targetLabel = repository.labelOf(relationship.target.id) ?? relationship.target.id;
  const presentation = presentEdge(relationship);
  const atTrailLimit = trail.length >= MAX_TRAIL_DEPTH;

  return (
    <aside className={styles.panel} aria-labelledby="hs-why-heading">
      <div className={styles.header}>
        <h2 id="hs-why-heading" tabIndex={-1} ref={headingRef}>
          {sourceLabel} <span className={styles.effect}>{presentation.effectLabel}</span>{' '}
          {targetLabel}
        </h2>
        <button type="button" onClick={onClose} className={styles.close}>
          Close
        </button>
      </div>

      <p className={styles.route}>
        {presentation.transportLabel}
        {presentation.feedbackLabel === null ? '' : ' · feedback'} ·{' '}
        {relationship.kind === 'causal' ? 'causal relationship' : 'association, not a cause'}
      </p>

      {trail.length > 1 && (
        <nav aria-label="Explanation trail" className={styles.breadcrumbs}>
          <ol>
            {trail.map((id, index) => {
              const explanation = repository.getExplanation(id);
              const last = index === trail.length - 1;
              return (
                <li key={id}>
                  {last ? (
                    <span aria-current="step">{explanation?.question ?? id}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTrail(trail.slice(0, index + 1));
                      }}
                    >
                      {explanation?.question ?? id}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <h3 className={styles.question}>{current.question}</h3>
      <p>{current.answer[depth]}</p>

      <EvidenceSummary
        repository={repository}
        claimIds={current.claimIds}
        onOpenEvidence={() => {
          onOpenEvidence(current.claimIds, current.question);
        }}
      />

      {deeper.length > 0 ? (
        <section aria-labelledby="hs-why-deeper">
          <h3 id="hs-why-deeper" className={styles.deeperHeading}>
            {atTrailLimit ? 'Related questions that start a new trail' : 'Go deeper'}
          </h3>
          <ul className={styles.deeper}>
            {deeper.map((explanation) => (
              <li key={explanation.id}>
                <button
                  type="button"
                  onClick={() => {
                    setTrail(atTrailLimit ? [explanation.id] : [...trail, explanation.id]);
                  }}
                >
                  {explanation.question}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className={styles.terminal}>This is the deepest explanation in this lesson.</p>
      )}

      {current.relatedConceptIds.length > 0 && (
        <section aria-labelledby="hs-why-concepts">
          <h3 id="hs-why-concepts" className={styles.deeperHeading}>
            Related ideas
          </h3>
          <p className={styles.glossaryHint}>
            Terms from the glossary of this lesson. Opening one does not move the lesson or this
            trail.
          </p>
          <ul className={styles.concepts}>
            {current.relatedConceptIds.map((conceptId) => {
              const concept = repository.getConcept(conceptId);
              if (!concept) return null;
              const open = openConceptId === conceptId;
              return (
                <li key={conceptId}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => {
                      toggleConcept(open ? null : conceptId);
                    }}
                  >
                    <strong>{concept.label}</strong>
                  </button>
                  {open && <p>{concept.definition[depth]}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {repository.relationshipsFor(relationship.target.id).length > 1 && (
        <section aria-labelledby="hs-why-next">
          <h3 id="hs-why-next" className={styles.deeperHeading}>
            Connected relationships
          </h3>
          <ul className={styles.deeper}>
            {repository
              .relationshipsFor(relationship.target.id)
              .filter((item) => item.id !== relationship.id)
              .map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenRelationship(item.id);
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
