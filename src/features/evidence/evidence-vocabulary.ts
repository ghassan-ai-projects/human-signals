/**
 * The visual evidence vocabulary from document 04.
 *
 * Badges are reviewer-assigned categorical summaries, never a citation-count score, and never a
 * confidence percentage. Support strength and context dependence are independent, so they are
 * displayed as two separate facts.
 */
import type { Claim } from '../../content/schema.ts';

export interface EvidenceVocabulary {
  label: string;
  /** A shape cue that survives grayscale and colour blindness. */
  glyph: string;
  outline: 'solid' | 'dashed';
  meaning: string;
}

export const SUPPORT_VOCABULARY: Record<Claim['support'], EvidenceVocabulary> = {
  established: {
    label: 'Established',
    glyph: '●',
    outline: 'solid',
    meaning: 'A reviewer found convergent, mature support for this scoped statement.',
  },
  supported: {
    label: 'Supported',
    glyph: '◐',
    outline: 'solid',
    meaning: 'Credible support with meaningful limits.',
  },
  emerging: {
    label: 'Emerging',
    glyph: '○',
    outline: 'dashed',
    meaning: 'Early or narrow evidence that still needs replication or generalisation.',
  },
  contested: {
    label: 'Contested',
    glyph: '◑',
    outline: 'dashed',
    meaning: 'Relevant sources disagree, or the interpretation is disputed.',
  },
  unresolved: {
    label: 'Unresolved',
    glyph: '?',
    outline: 'dashed',
    meaning: 'There is not enough support to teach a definite relation, so it cannot drive a causal event.',
  },
};

export const RELATION_KIND_LABEL: Record<Claim['relationKind'], string> = {
  causal: 'Causal claim',
  associative: 'Association, not a cause',
  descriptive: 'Description',
};

export const BASIS_LABEL: Record<Claim['basis'][number], string> = {
  human: 'human studies',
  animal: 'animal studies',
  'in-vitro': 'in-vitro work',
  'computational-model': 'computational models',
  'authoritative-synthesis': 'authoritative synthesis',
  'educational-consensus': 'educational consensus',
};

/** The weakest support among the claims behind one statement; that is what a badge must show. */
export function weakestSupport(claims: readonly Claim[]): Claim['support'] | null {
  const order: Claim['support'][] = ['unresolved', 'contested', 'emerging', 'supported', 'established'];
  let weakest: Claim['support'] | null = null;
  for (const claim of claims) {
    if (weakest === null || order.indexOf(claim.support) < order.indexOf(weakest)) {
      weakest = claim.support;
    }
  }
  return weakest;
}

export function describeSupport(claims: readonly Claim[]): string {
  const support = weakestSupport(claims);
  if (support === null) return 'No claim is attached to this statement.';
  const contextDependent = claims.some((claim) => claim.contextDependent);
  return `${SUPPORT_VOCABULARY[support].label}${contextDependent ? ' · context-dependent' : ''}`;
}

/** Draft content is not publishable, and the interface must say so rather than imply review. */
export function reviewStatusNote(claims: readonly Claim[]): string | null {
  if (claims.length === 0) return null;
  if (claims.every((claim) => claim.status === 'approved')) return null;
  if (claims.some((claim) => claim.status === 'withdrawn')) {
    return 'Withdrawn: this statement has been retracted pending correction.';
  }
  return 'Draft: not yet checked by a qualified reviewer, and not yet sourced.';
}
