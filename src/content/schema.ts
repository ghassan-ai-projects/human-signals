/**
 * Runtime content schemas.
 *
 * `documentation/contracts/content-contract.ts` is normative for field names and shapes. These
 * schemas are the executable version of that contract: unknown fields are rejected, lengths are
 * bounded (VAL-017) and published text may not contain markup (VAL-002). Application types are
 * inferred from here so the runtime check and the compile-time type cannot drift; a contract
 * conformance test compares them with the normative file.
 */
import { z } from 'zod';
import { ID_PREFIXES, MAX_ID_LENGTH, MAX_LABEL_LENGTH, MAX_TEXT_LENGTH, idPattern } from './ids.ts';
import type { EntityKind } from './ids.ts';

const MARKUP = /<\s*\/?\s*[a-zA-Z!]/;
// Control characters are exactly what this pattern must match, so the rule is waived here.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function id(kind: EntityKind): z.ZodString {
  return z
    .string()
    .max(MAX_ID_LENGTH)
    .regex(idPattern(ID_PREFIXES[kind]), `expected a ${ID_PREFIXES[kind]}- identifier`);
}

const timelineId = z
  .string()
  .max(MAX_ID_LENGTH)
  .regex(/^(?:j|state|exercise)-[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a timeline identifier');

/** A child identifier is globally unique by carrying its timeline prefix (document 05). */
const childId = z
  .string()
  .max(MAX_ID_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a lowercase kebab-case identifier');

const label = z
  .string()
  .min(1)
  .max(MAX_LABEL_LENGTH)
  .refine((value) => !CONTROL.test(value), 'control characters are not allowed');

const plainText = z
  .string()
  .min(1)
  .max(MAX_TEXT_LENGTH)
  .refine((value) => !MARKUP.test(value), 'published text may not contain markup')
  .refine((value) => !CONTROL.test(value), 'control characters are not allowed');

/** All three depths are mandatory and nonempty on every DepthText field (VAL-002). */
const depthText = z.strictObject({
  intro: plainText,
  standard: plainText,
  mechanism: plainText,
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a YYYY-MM-DD date');

/** Document 10: external citation links permit HTTPS only (VAL-018). */
const httpsUrl = z
  .string()
  .max(2048)
  .refine((value) => value.startsWith('https://'), 'external references must use https');

/** Same-origin relative build path with no traversal or protocol prefix (VAL-018). */
const assetPath = z
  .string()
  .max(512)
  .refine(
    (value) =>
      !value.startsWith('/') &&
      !value.startsWith('//') &&
      !value.includes('..') &&
      !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value),
    'asset paths must be same-origin relative paths without traversal',
  );

const sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'expected a lowercase sha-256 hex digest');

export const depthValues = ['intro', 'standard', 'mechanism'] as const;
export const DepthSchema = z.enum(depthValues);
export const trendValues = [
  'baseline',
  'increasing',
  'decreasing',
  'sustained',
  'variable',
  'not-shown',
] as const;
export const TrendSchema = z.enum(trendValues);
export const highlightValues = ['none', 'source', 'target', 'active'] as const;
export const HighlightSchema = z.enum(highlightValues);

export const NodeRefSchema = z.strictObject({
  kind: z.enum(['anatomy', 'signal', 'concept']),
  id: z.string().max(MAX_ID_LENGTH),
});

export const ContextSchema = z.strictObject({
  id: id('context'),
  label,
  description: depthText,
  assumptions: z.array(plainText).max(20),
  exclusions: z.array(plainText).max(20),
  variability: plainText,
  claimIds: z.array(id('claim')).max(50),
});

export const ReferenceSchema = z.strictObject({
  id: id('reference'),
  title: z.string().min(1).max(400),
  authors: z.array(z.string().min(1).max(200)).min(1).max(50),
  year: z.int().min(1800).max(2200),
  kind: z.enum(['primary-study', 'review', 'textbook', 'guideline', 'other']),
  doi: z.string().max(200).optional(),
  url: httpsUrl,
  checkedOn: isoDate,
});

export const ClaimReferenceSchema = z.strictObject({
  referenceId: id('reference'),
  locator: z.string().min(1).max(200),
  stance: z.enum(['supports', 'challenges', 'context']),
  note: plainText,
});

export const ClaimSchema = z.strictObject({
  id: id('claim'),
  statement: plainText,
  contextIds: z.array(id('context')).min(1).max(20),
  relationKind: z.enum(['causal', 'associative', 'descriptive']),
  support: z.enum(['established', 'supported', 'emerging', 'contested', 'unresolved']),
  contextDependent: z.boolean(),
  basis: z
    .array(
      z.enum([
        'human',
        'animal',
        'in-vitro',
        'computational-model',
        'authoritative-synthesis',
        'educational-consensus',
      ]),
    )
    .min(1)
    .max(6),
  applicability: plainText,
  limitations: z.array(plainText).max(20),
  references: z.array(ClaimReferenceSchema).max(20),
  status: z.enum(['draft', 'approved', 'withdrawn']),
});

export const AnatomySchema = z.strictObject({
  id: id('anatomy'),
  label,
  aliases: z.array(label).max(20),
  parentId: id('anatomy').optional(),
  view: z.enum(['body', 'brain', 'inset', 'distributed']),
  laterality: z.enum(['left', 'right', 'midline', 'bilateral', 'not-applicable']),
  description: depthText,
  anchorId: id('anchor'),
  claimIds: z.array(id('claim')).max(50),
});

export const comparisonDimensions = [
  'type',
  'sources',
  'transport',
  'targets',
  'effects',
  'timing',
  'regulation',
  'misconception',
] as const;
export const ComparisonDimensionSchema = z.enum(comparisonDimensions);

export const ComparisonCellSchema = z.strictObject({
  dimension: ComparisonDimensionSchema,
  contextIds: z.array(id('context')).max(20),
  text: depthText,
  applicability: z.enum(['applicable', 'not-comparable']),
  claimIds: z.array(id('claim')).max(20),
});

export const SignalSchema = z.strictObject({
  id: id('signal'),
  label,
  aliases: z.array(label).max(20),
  description: depthText,
  roles: z
    .array(
      z.strictObject({
        kind: z.enum(['hormone', 'neurotransmitter', 'other-signal']),
        contextIds: z.array(id('context')).min(1).max(20),
        sourceAnatomyIds: z.array(id('anatomy')).min(1).max(20),
        claimIds: z.array(id('claim')).min(1).max(20),
      }),
    )
    .min(1)
    .max(8),
  misconception: depthText,
  claimIds: z.array(id('claim')).max(50),
  comparison: z.array(ComparisonCellSchema).max(16),
  journeyIds: z.array(timelineId).max(20),
});

export const ConceptSchema = z.strictObject({
  id: id('concept'),
  label,
  aliases: z.array(label).max(20),
  definition: depthText,
  relatedConceptIds: z.array(id('concept')).max(10),
  claimIds: z.array(id('claim')).max(50),
});

export const RelationshipSchema = z.strictObject({
  id: id('relationship'),
  source: NodeRefSchema,
  target: NodeRefSchema,
  label,
  kind: z.enum(['causal', 'associative', 'descriptive']),
  effect: z.enum([
    'stimulates',
    'inhibits',
    'modulates',
    'transports',
    'associated-with',
    'describes',
  ]),
  transport: z.enum(['circulation', 'portal', 'synaptic', 'local', 'schematic', 'not-applicable']),
  feedback: z.boolean(),
  contextIds: z.array(id('context')).min(1).max(20),
  mechanism: depthText,
  claimIds: z.array(id('claim')).min(1).max(20),
  whyRootId: id('explanation'),
  routeId: id('route').optional(),
});

export const ExplanationSchema = z.strictObject({
  id: id('explanation'),
  question: plainText,
  answer: depthText,
  contextIds: z.array(id('context')).max(20),
  claimIds: z.array(id('claim')).min(1).max(20),
  deeperIds: z.array(id('explanation')).max(3),
  relatedConceptIds: z.array(id('concept')).max(10),
});

export const ObjectiveSchema = z.strictObject({
  id: id('objective'),
  statement: plainText,
  pattern: z.enum(['sequence', 'feedback', 'parallel-timing', 'context', 'transport']),
  prerequisiteConceptIds: z.array(id('concept')).max(10),
});

export const TimingBandSchema = z.strictObject({
  id: childId,
  label,
  note: plainText,
  claimIds: z.array(id('claim')).min(1).max(20),
});

export const TrackSchema = z.strictObject({
  id: childId,
  label,
  order: z.int().min(0).max(3),
  contextIds: z.array(id('context')).min(1).max(20),
});

export const StepSchema = z.strictObject({
  id: childId,
  atMs: z.int().min(0).max(600000),
  trackId: childId,
  stage: z.enum(['trigger', 'source', 'signal', 'target', 'effect', 'feedback', 'regulation']),
  label,
  caption: depthText,
  relationIds: z.array(id('relationship')).max(20),
  claimIds: z.array(id('claim')).max(20),
  timingBandId: childId,
});

export const VisualCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('set-highlight'),
    anatomyId: id('anatomy'),
    value: HighlightSchema,
  }),
  z.strictObject({
    type: z.literal('set-relation'),
    relationshipId: id('relationship'),
    visible: z.boolean(),
  }),
  z.strictObject({ type: z.literal('set-trend'), signalId: id('signal'), value: TrendSchema }),
]);

export const TimelineEventSchema = z.strictObject({
  id: childId,
  atMs: z.int().min(0).max(600000),
  order: z.int().min(0).max(100000),
  trackId: childId,
  command: VisualCommandSchema,
  claimIds: z.array(id('claim')).max(20),
});

export const PredictionOptionSchema = z.strictObject({
  id: childId,
  text: depthText,
  feedback: depthText,
  claimIds: z.array(id('claim')).max(20),
});

export const PredictionSchema = z.strictObject({
  id: id('prediction'),
  timelineId,
  objectiveId: id('objective'),
  atMs: z.int().min(0).max(600000),
  revealAtMs: z.int().min(0).max(600000),
  kind: z.enum(['recall', 'mechanism', 'transfer']),
  prompt: depthText,
  assumptions: z.array(plainText).min(1).max(10),
  contextIds: z.array(id('context')).min(1).max(20),
  options: z.array(PredictionOptionSchema).min(2).max(4),
  correctOptionId: childId,
  explanation: depthText,
  claimIds: z.array(id('claim')).min(1).max(20),
  explanationIds: z.array(id('explanation')).max(10),
  revealsStepIds: z.array(childId).max(20),
  familyId: z.string().min(1).max(MAX_ID_LENGTH),
  exposureTimelineIds: z.array(timelineId).max(20),
  exposureRelationshipIds: z.array(id('relationship')).max(40),
  exposureExplanationIds: z.array(id('explanation')).max(40),
});

export const TimelineSchema = z.strictObject({
  id: timelineId,
  kind: z.enum(['journey', 'state', 'exercise']),
  label,
  description: depthText,
  objectiveIds: z.array(id('objective')).min(1).max(10),
  contextIds: z.array(id('context')).min(1).max(20),
  overviewClaimIds: z.array(id('claim')).min(1).max(20),
  prerequisiteConceptIds: z.array(id('concept')).max(10),
  durationMs: z.int().min(1).max(600000),
  tracks: z.array(TrackSchema).min(1).max(4),
  timingBands: z.array(TimingBandSchema).min(1).max(20),
  steps: z.array(StepSchema).min(1).max(200),
  events: z.array(TimelineEventSchema).max(2000),
  predictionIds: z.array(id('prediction')).max(20),
  relatedTimelineIds: z.array(timelineId).max(20),
  feedbackCoverage: z.union([
    z.strictObject({
      kind: z.literal('depicted'),
      relationshipIds: z.array(id('relationship')).min(1).max(20),
    }),
    z.strictObject({
      kind: z.literal('not-depicted'),
      reason: depthText,
      claimIds: z.array(id('claim')).min(1).max(20),
    }),
  ]),
  limitations: depthText,
  summary: depthText,
  summaryClaimIds: z.array(id('claim')).min(1).max(20),
});

export const CuratedComparisonSchema = z.strictObject({
  id: id('comparison'),
  signalIds: z.tuple([id('signal'), id('signal')]),
  title: label,
  explanation: depthText,
  claimIds: z.array(id('claim')).min(1).max(20),
});

const coordinate = z.number().min(-10).max(10);
const unitCoordinate = z.number().min(0).max(1);

export const AnchorSchema = z.strictObject({
  id: id('anchor'),
  view: z.enum(['body', 'brain', 'inset', 'distributed']),
  position: z.tuple([coordinate, coordinate, coordinate]),
  diagramPosition: z.tuple([unitCoordinate, unitCoordinate]),
  meshNames: z.array(z.string().min(1).max(120)).max(20),
  representation: z.enum(['anatomical-region', 'schematic-inset', 'distributed-overlay']),
});

export const RouteSchema = z.strictObject({
  id: id('route'),
  fromAnchorId: id('anchor'),
  toAnchorId: id('anchor'),
  controlPoints: z.array(z.tuple([coordinate, coordinate, coordinate])).max(12),
  fidelity: z.literal('schematic'),
  view: z.enum(['body', 'brain', 'inset', 'distributed']),
  claimIds: z.array(id('claim')).max(20),
});

export const AssetSchema = z.strictObject({
  id: id('asset'),
  path: assetPath,
  sha256,
  bytes: z.int().min(0).max(100000000),
  kind: z.enum(['body-model', 'brain-model', 'texture', 'font', 'diagram']),
  source: z.string().min(1).max(500),
  sourceRevision: z.string().min(1).max(200),
  license: z.string().min(1).max(200),
  licenseUrl: httpsUrl,
  attribution: z.string().min(1).max(500),
  modified: z.boolean(),
  modificationNote: z.string().min(1).max(500),
});

export const ReviewSchema = z.strictObject({
  id: id('review'),
  bundleSha256: sha256,
  reviewerId: z.string().min(1).max(MAX_ID_LENGTH),
  reviewerRole: z.string().min(1).max(200),
  qualification: z.string().min(1).max(500),
  reviewedOn: isoDate,
  disposition: z.enum(['approved', 'changes-required']),
  visualReviewBuildId: z.string().min(1).max(120),
  notes: z.string().max(MAX_TEXT_LENGTH),
});

const semanticVersion = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'content version must be a semantic version');

export const ContentBundleSchema = z.strictObject({
  schemaVersion: z.literal(1),
  contentVersion: semanticVersion,
  fixture: z.boolean(),
  contexts: z.array(ContextSchema),
  references: z.array(ReferenceSchema),
  claims: z.array(ClaimSchema),
  anatomy: z.array(AnatomySchema),
  signals: z.array(SignalSchema),
  concepts: z.array(ConceptSchema),
  relationships: z.array(RelationshipSchema),
  explanations: z.array(ExplanationSchema),
  objectives: z.array(ObjectiveSchema),
  timelines: z.array(TimelineSchema),
  predictions: z.array(PredictionSchema),
  comparisons: z.array(CuratedComparisonSchema),
  anchors: z.array(AnchorSchema),
  routes: z.array(RouteSchema),
  assets: z.array(AssetSchema),
  reviews: z.array(ReviewSchema),
});

export const ContentManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  contentVersion: semanticVersion,
  bundlePath: assetPath,
  bundleSha256: sha256,
  scientificSha256: sha256,
  buildId: z.string().min(1).max(120),
  catalog: z.array(
    z.strictObject({
      id: z.string().max(MAX_ID_LENGTH),
      kind: z.enum(['signal', 'journey', 'state', 'exercise', 'anatomy', 'concept']),
      label,
      aliases: z.array(label).max(20),
    }),
  ),
  retired: z.array(
    z.strictObject({
      id: z.string().max(MAX_ID_LENGTH),
      reason: plainText,
      replacementId: z.string().max(MAX_ID_LENGTH).optional(),
    }),
  ),
});

export type Depth = z.infer<typeof DepthSchema>;
export type DepthTextValue = z.infer<typeof depthText>;
export type Trend = z.infer<typeof TrendSchema>;
export type Highlight = z.infer<typeof HighlightSchema>;
export type NodeRef = z.infer<typeof NodeRefSchema>;
export type Context = z.infer<typeof ContextSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Anatomy = z.infer<typeof AnatomySchema>;
export type ComparisonDimension = z.infer<typeof ComparisonDimensionSchema>;
export type ComparisonCell = z.infer<typeof ComparisonCellSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Explanation = z.infer<typeof ExplanationSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type TimingBand = z.infer<typeof TimingBandSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Step = z.infer<typeof StepSchema>;
export type VisualCommand = z.infer<typeof VisualCommandSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type PredictionOption = z.infer<typeof PredictionOptionSchema>;
export type Prediction = z.infer<typeof PredictionSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type CuratedComparison = z.infer<typeof CuratedComparisonSchema>;
export type Anchor = z.infer<typeof AnchorSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ContentBundle = z.infer<typeof ContentBundleSchema>;
export type ContentManifest = z.infer<typeof ContentManifestSchema>;
