/**
 * The R1 minimum inventory from document 03. VAL-016 checks a production bundle against it
 * exactly: every listed item must exist, and nothing may be released in its place.
 */
export const R1_SIGNAL_IDS = [
  'sig-acth',
  'sig-adrenaline',
  'sig-cortisol',
  'sig-crh',
  'sig-dopamine',
  'sig-glucagon',
  'sig-insulin',
  'sig-melatonin',
  'sig-noradrenaline',
  'sig-prolactin',
  'sig-t3',
  'sig-t4',
  'sig-trh',
  'sig-tsh',
] as const;

export const R1_JOURNEY_IDS = [
  'j-dopamine-learning',
  'j-dopamine-motor',
  'j-fasting',
  'j-fed',
  'j-hpa',
  'j-prolactin',
  'j-sleep',
  'j-sympathetic',
  'j-thyroid',
] as const;

export const R1_STATE_IDS = ['state-meal-fasting', 'state-sleep', 'state-stress'] as const;

export const R1_COMPARISON_IDS = [
  'pair-adrenaline-cortisol',
  'pair-insulin-glucagon',
  'pair-t3-t4',
] as const;

/** Two checkpoint predictions per journey and per state, so at least 24 in total. */
export const MIN_PREDICTIONS_PER_TIMELINE = 2;
export const MIN_CHECKPOINT_PREDICTIONS = 24;

/** Six transfer prompts: two each on feedback, parallel timing and context-specific targets. */
export const REQUIRED_TRANSFER_PROMPTS = 6;
export const TRANSFER_FAMILY_PATTERNS = ['feedback', 'parallel-timing', 'context'] as const;

/** Presentation budgets are editorial, and document 03 allows +/-20%. */
export const PRESENTATION_BUDGET_TOLERANCE = 0.2;

export const STATE_DURATION_RANGE_MS = { min: 120_000, max: 180_000 } as const;
