/**
 * Identity rules from document 05: lowercase ASCII kebab case with an entity prefix, stable
 * across text corrections and independent of translated labels.
 */
export const ID_PREFIXES = {
  signal: 'sig',
  anatomy: 'anat',
  concept: 'concept',
  relationship: 'rel',
  claim: 'claim',
  reference: 'ref',
  context: 'ctx',
  explanation: 'why',
  objective: 'obj',
  journey: 'j',
  state: 'state',
  exercise: 'exercise',
  prediction: 'pred',
  comparison: 'pair',
  anchor: 'anchor',
  route: 'route',
  asset: 'asset',
  review: 'review',
} as const;

export type EntityKind = keyof typeof ID_PREFIXES;

export const MAX_ID_LENGTH = 120;
export const MAX_LABEL_LENGTH = 120;
export const MAX_TEXT_LENGTH = 10000;

const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*';

export function idPattern(prefix: string): RegExp {
  return new RegExp(`^${prefix}-${SEGMENT}$`);
}

export function isValidId(id: string, kind: EntityKind): boolean {
  return id.length <= MAX_ID_LENGTH && idPattern(ID_PREFIXES[kind]).test(id);
}

/** Timelines are one of three kinds and each kind has its own prefix. */
export function timelineKindForId(id: string): 'journey' | 'state' | 'exercise' | null {
  if (idPattern('j').test(id)) return 'journey';
  if (idPattern('state').test(id)) return 'state';
  if (idPattern('exercise').test(id)) return 'exercise';
  return null;
}
