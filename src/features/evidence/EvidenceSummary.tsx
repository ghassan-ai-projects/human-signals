/**
 * The compact evidence badge that sits beside a statement.
 *
 * Document 04 and REQ-011: the category is always spelled out in words and carries a shape cue,
 * so it never depends on colour. Opening it leads to the full evidence panel.
 */
import type { Claim } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import {
  SUPPORT_VOCABULARY,
  describeSupport,
  reviewStatusNote,
  weakestSupport,
} from './evidence-vocabulary.ts';
import styles from './EvidenceSummary.module.css';

export interface EvidenceSummaryProps {
  repository: ContentRepository;
  claimIds: readonly string[];
  onOpenEvidence: () => void;
}

export function EvidenceSummary({
  repository,
  claimIds,
  onOpenEvidence,
}: EvidenceSummaryProps): React.JSX.Element | null {
  const claims = claimIds
    .map((id) => repository.getClaim(id))
    .filter((claim): claim is Claim => claim !== undefined);
  if (claims.length === 0) return null;

  const support = weakestSupport(claims);
  if (support === null) return null;
  const vocabulary = SUPPORT_VOCABULARY[support];
  const note = reviewStatusNote(claims);

  return (
    <div className={styles.summary}>
      <span
        className={vocabulary.outline === 'dashed' ? styles.badgeDashed : styles.badge}
        data-support={support}
      >
        <span aria-hidden="true" className={styles.glyph}>
          {vocabulary.glyph}
        </span>
        {describeSupport(claims)}
      </span>
      <button type="button" className={styles.link} onClick={onOpenEvidence}>
        Evidence and limits
      </button>
      {note !== null && <span className={styles.draftNote}>{note}</span>}
    </div>
  );
}
