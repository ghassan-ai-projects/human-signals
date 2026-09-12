/**
 * The full evidence panel.
 *
 * Document 02 fixes the sections: what is claimed, where it applies, support, the kind of
 * evidence behind it, references, what remains uncertain, and when it was reviewed. Categories
 * are words, not five-dot scores, and a causal claim and an association are labelled differently.
 */
import { useEffect, useRef } from 'react';
import type { Claim } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import {
  BASIS_LABEL,
  RELATION_KIND_LABEL,
  SUPPORT_VOCABULARY,
  reviewStatusNote,
} from './evidence-vocabulary.ts';
import styles from './EvidencePanel.module.css';

export interface EvidencePanelProps {
  repository: ContentRepository;
  claimIds: readonly string[];
  title: string;
  onClose: () => void;
}

export function EvidencePanel({
  repository,
  claimIds,
  title,
  onClose,
}: EvidencePanelProps): React.JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const claims = claimIds
    .map((id) => repository.getClaim(id))
    .filter((claim): claim is Claim => claim !== undefined);

  return (
    <aside className={styles.panel} aria-labelledby="hs-evidence-heading">
      <div className={styles.header}>
        <h2 id="hs-evidence-heading" tabIndex={-1} ref={headingRef}>
          Evidence: {title}
        </h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {claims.length === 0 && <p>No claim is attached to this statement.</p>}

      {claims.map((claim) => {
        const vocabulary = SUPPORT_VOCABULARY[claim.support];
        const note = reviewStatusNote([claim]);
        return (
          <article key={claim.id} className={styles.claim}>
            <h3>What is claimed</h3>
            <p>{claim.statement}</p>

            <h3>Where it applies</h3>
            <p>{claim.applicability}</p>
            <ul className={styles.contexts}>
              {claim.contextIds.map((contextId) => {
                const context = repository.getContext(contextId);
                return context === undefined ? null : <li key={contextId}>{context.label}</li>;
              })}
            </ul>

            <h3>Support</h3>
            <p className={styles.support}>
              <span
                className={vocabulary.outline === 'dashed' ? styles.badgeDashed : styles.badge}
                data-support={claim.support}
              >
                <span aria-hidden="true">{vocabulary.glyph}</span> {vocabulary.label}
              </span>
              <span className={styles.kind}>{RELATION_KIND_LABEL[claim.relationKind]}</span>
              {claim.contextDependent && <span className={styles.kind}>Context-dependent</span>}
            </p>
            <p>{vocabulary.meaning}</p>

            <h3>Kind of evidence</h3>
            <p>Based on {claim.basis.map((basis) => BASIS_LABEL[basis]).join(', ')}.</p>

            <h3>References</h3>
            {claim.references.length === 0 ? (
              <p className={styles.missing}>
                No reference has been recorded for this claim yet. Until a person has read and
                logged a source, this statement cannot be published.
              </p>
            ) : (
              <ul>
                {claim.references.map((link) => {
                  const reference = repository.getReference(link.referenceId);
                  if (!reference) {
                    return (
                      <li key={link.referenceId} className={styles.missing}>
                        A cited source is missing from this bundle ({link.referenceId}).
                      </li>
                    );
                  }
                  return (
                    <li key={link.referenceId}>
                      <cite>{reference.title}</cite> — {reference.authors.join(', ')} (
                      {reference.year}, {reference.kind}). {link.locator}. {link.note}
                      <br />
                      <a href={reference.url} target="_blank" rel="noopener noreferrer">
                        Open source
                        <span className="hs-visually-hidden"> (opens in a new tab)</span>
                      </a>
                      <span className={styles.checked}> Checked on {reference.checkedOn}.</span>
                      <span className={styles.stance}> This source {link.stance} the claim.</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <h3>What remains uncertain</h3>
            {claim.limitations.length === 0 ? (
              <p>No limitation has been recorded for this claim.</p>
            ) : (
              <ul>
                {claim.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            )}

            <h3>Reviewed on</h3>
            <p className={note === null ? undefined : styles.missing}>
              {note ?? 'Approved by the recorded scientific reviewer for this content version.'}
            </p>
          </article>
        );
      })}
    </aside>
  );
}
