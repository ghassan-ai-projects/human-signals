/**
 * Content validation.
 *
 * Every rule in the document 05 invariant table is implemented here with its own stable code so
 * that a failure names the rule, the record, the JSON path and a plain-language reason
 * (document 05, "Validation errors"). Nothing is repaired silently: an invalid bundle is
 * rejected whole rather than pruned and published as a partial pathway.
 */
import {
  ContentBundleSchema,
  ContentManifestSchema,
  comparisonDimensions,
  type Claim,
  type ContentBundle,
  type ContentManifest,
  type Explanation,
  type Timeline,
} from './schema.ts';
import {
  MAX_ID_LENGTH,
  MAX_LABEL_LENGTH,
  MAX_TEXT_LENGTH,
  timelineKindForId,
  type EntityKind,
} from './ids.ts';
import {
  MIN_CHECKPOINT_PREDICTIONS,
  MIN_PREDICTIONS_PER_TIMELINE,
  R1_COMPARISON_IDS,
  R1_JOURNEY_IDS,
  R1_SIGNAL_IDS,
  R1_STATE_IDS,
  REQUIRED_TRANSFER_PROMPTS,
} from './inventory.ts';

export const VALIDATION_RULES = [
  'VAL-001',
  'VAL-002',
  'VAL-003',
  'VAL-004',
  'VAL-005',
  'VAL-006',
  'VAL-007',
  'VAL-008',
  'VAL-009',
  'VAL-010',
  'VAL-011',
  'VAL-012',
  'VAL-013',
  'VAL-014',
  'VAL-015',
  'VAL-016',
  'VAL-017',
  'VAL-018',
  'VAL-019',
  'VAL-020',
  'VAL-SCHEMA',
] as const;

export type ValidationRule = (typeof VALIDATION_RULES)[number];

export interface ValidationIssue {
  rule: ValidationRule;
  /** The record the problem belongs to, when one can be identified. */
  recordId?: string;
  /** A JSON path into the bundle. */
  path: string;
  message: string;
}

export interface ValidateOptions {
  /** Production applies the publication gate and the R1 inventory closure. */
  mode: 'preview' | 'production';
  /** Injected so review staleness is testable without touching the clock. */
  now?: Date;
  /** Supplied by the compiler after canonical scientific hashing. */
  scientificSha256?: string;
}

export const MAX_GRAPH_RECORDS = 10_000;
export const MAX_WHY_TRAVERSAL = 100;
export const REVIEW_MAX_AGE_DAYS = 365;

interface Ctx {
  bundle: ContentBundle;
  issues: ValidationIssue[];
  mode: 'preview' | 'production';
  now: Date;
  scientificSha256?: string;
  ids: Map<string, EntityKind | 'timeline'>;
  claims: Map<string, Claim>;
  explanations: Map<string, Explanation>;
}

function add(ctx: Ctx, rule: ValidationRule, path: string, message: string, recordId?: string): void {
  ctx.issues.push(recordId === undefined ? { rule, path, message } : { rule, path, message, recordId });
}

/** Maps a schema failure onto the invariant it belongs to, so error codes stay stable. */
function classifySchemaIssue(issue: { code: string; message: string; path: PropertyKey[] }): ValidationRule {
  const message = issue.message.toLowerCase();
  if (message.includes('markup') || message.includes('control characters')) return 'VAL-002';
  if (message.includes('https') || message.includes('asset paths')) return 'VAL-018';
  if (issue.code === 'too_big') return 'VAL-017';
  const leaf = String(issue.path.at(-1) ?? '');
  if (
    (issue.code === 'too_small' || issue.code === 'invalid_type') &&
    (leaf === 'intro' || leaf === 'standard' || leaf === 'mechanism')
  ) {
    return 'VAL-002';
  }
  if (issue.code === 'invalid_format' && leaf.toLowerCase().endsWith('id')) return 'VAL-001';
  return 'VAL-SCHEMA';
}

export interface ParseResult {
  bundle?: ContentBundle;
  issues: ValidationIssue[];
}

/** Parses unknown data against the runtime schema, rejecting unknown fields. */
export function parseBundle(data: unknown): ParseResult {
  const parsed = ContentBundleSchema.safeParse(data);
  if (parsed.success) return { bundle: parsed.data, issues: [] };
  return {
    issues: parsed.error.issues.map((issue) => ({
      rule: classifySchemaIssue(issue),
      path: `$.${issue.path.map(String).join('.')}`,
      message: issue.message,
    })),
  };
}

export function parseManifest(data: unknown): { manifest?: ContentManifest; issues: ValidationIssue[] } {
  const parsed = ContentManifestSchema.safeParse(data);
  if (parsed.success) return { manifest: parsed.data, issues: [] };
  return {
    issues: parsed.error.issues.map((issue) => ({
      rule: classifySchemaIssue(issue),
      path: `$.${issue.path.map(String).join('.')}`,
      message: issue.message,
    })),
  };
}

/** Validates an already-parsed bundle against every semantic invariant. */
export function validateBundle(bundle: ContentBundle, options: ValidateOptions): ValidationIssue[] {
  const ctx: Ctx = {
    bundle,
    issues: [],
    mode: options.mode,
    now: options.now ?? new Date(),
    ...(options.scientificSha256 === undefined ? {} : { scientificSha256: options.scientificSha256 }),
    ids: new Map(),
    claims: new Map(bundle.claims.map((claim) => [claim.id, claim])),
    explanations: new Map(bundle.explanations.map((item) => [item.id, item])),
  };

  checkIdentity(ctx);
  checkDepthText(ctx);
  checkClaimSupport(ctx);
  checkRelationships(ctx);
  checkExplanationGraph(ctx);
  checkTimelines(ctx);
  checkAnatomyAndRoutes(ctx);
  checkPredictions(ctx);
  checkComparisons(ctx);
  checkSizeLimits(ctx);
  checkPaths(ctx);
  if (ctx.mode === 'production') {
    checkPublicationGate(ctx);
    checkInventory(ctx);
  }
  return ctx.issues;
}

type RecordGroup = { key: keyof ContentBundle; kind: EntityKind | 'timeline' };

const GROUPS: RecordGroup[] = [
  { key: 'contexts', kind: 'context' },
  { key: 'references', kind: 'reference' },
  { key: 'claims', kind: 'claim' },
  { key: 'anatomy', kind: 'anatomy' },
  { key: 'signals', kind: 'signal' },
  { key: 'concepts', kind: 'concept' },
  { key: 'relationships', kind: 'relationship' },
  { key: 'explanations', kind: 'explanation' },
  { key: 'objectives', kind: 'objective' },
  { key: 'timelines', kind: 'timeline' },
  { key: 'predictions', kind: 'prediction' },
  { key: 'comparisons', kind: 'comparison' },
  { key: 'anchors', kind: 'anchor' },
  { key: 'routes', kind: 'route' },
  { key: 'assets', kind: 'asset' },
  { key: 'reviews', kind: 'review' },
];

/** VAL-001: IDs are unique bundle-wide and every typed reference resolves to its entity kind. */
function checkIdentity(ctx: Ctx): void {
  for (const group of GROUPS) {
    const records = ctx.bundle[group.key] as ReadonlyArray<{ id: string }>;
    records.forEach((record, index) => {
      if (ctx.ids.has(record.id)) {
        add(ctx, 'VAL-001', `$.${group.key}[${index}].id`, `duplicate identifier ${record.id}`, record.id);
      }
      ctx.ids.set(record.id, group.kind);
    });
  }

  const expect = (
    id: string | undefined,
    kind: EntityKind | 'timeline',
    path: string,
    recordId: string,
  ): void => {
    if (id === undefined) return;
    const actual = ctx.ids.get(id);
    if (actual === undefined) {
      add(ctx, 'VAL-001', path, `reference to unknown record ${id}`, recordId);
    } else if (actual !== kind) {
      add(ctx, 'VAL-001', path, `${id} is a ${actual}, but a ${kind} is required here`, recordId);
    }
  };

  const expectMany = (
    ids: readonly string[],
    kind: EntityKind | 'timeline',
    path: string,
    recordId: string,
  ): void => {
    ids.forEach((id, index) => {
      expect(id, kind, `${path}[${index}]`, recordId);
    });
  };

  for (const context of ctx.bundle.contexts) {
    expectMany(context.claimIds, 'claim', `$.contexts.${context.id}.claimIds`, context.id);
  }
  for (const claim of ctx.bundle.claims) {
    expectMany(claim.contextIds, 'context', `$.claims.${claim.id}.contextIds`, claim.id);
    claim.references.forEach((reference, index) => {
      expect(
        reference.referenceId,
        'reference',
        `$.claims.${claim.id}.references[${index}].referenceId`,
        claim.id,
      );
    });
  }
  for (const anatomy of ctx.bundle.anatomy) {
    expect(anatomy.parentId, 'anatomy', `$.anatomy.${anatomy.id}.parentId`, anatomy.id);
    expect(anatomy.anchorId, 'anchor', `$.anatomy.${anatomy.id}.anchorId`, anatomy.id);
    expectMany(anatomy.claimIds, 'claim', `$.anatomy.${anatomy.id}.claimIds`, anatomy.id);
  }
  for (const signal of ctx.bundle.signals) {
    expectMany(signal.claimIds, 'claim', `$.signals.${signal.id}.claimIds`, signal.id);
    expectMany(signal.journeyIds, 'timeline', `$.signals.${signal.id}.journeyIds`, signal.id);
    signal.roles.forEach((role, index) => {
      expectMany(role.contextIds, 'context', `$.signals.${signal.id}.roles[${index}].contextIds`, signal.id);
      expectMany(
        role.sourceAnatomyIds,
        'anatomy',
        `$.signals.${signal.id}.roles[${index}].sourceAnatomyIds`,
        signal.id,
      );
      expectMany(role.claimIds, 'claim', `$.signals.${signal.id}.roles[${index}].claimIds`, signal.id);
    });
    signal.comparison.forEach((cell, index) => {
      expectMany(cell.claimIds, 'claim', `$.signals.${signal.id}.comparison[${index}].claimIds`, signal.id);
      expectMany(
        cell.contextIds,
        'context',
        `$.signals.${signal.id}.comparison[${index}].contextIds`,
        signal.id,
      );
    });
  }
  for (const concept of ctx.bundle.concepts) {
    expectMany(concept.relatedConceptIds, 'concept', `$.concepts.${concept.id}.relatedConceptIds`, concept.id);
    expectMany(concept.claimIds, 'claim', `$.concepts.${concept.id}.claimIds`, concept.id);
  }
  for (const relationship of ctx.bundle.relationships) {
    const endpointKind = { anatomy: 'anatomy', signal: 'signal', concept: 'concept' } as const;
    expect(
      relationship.source.id,
      endpointKind[relationship.source.kind],
      `$.relationships.${relationship.id}.source`,
      relationship.id,
    );
    expect(
      relationship.target.id,
      endpointKind[relationship.target.kind],
      `$.relationships.${relationship.id}.target`,
      relationship.id,
    );
    expectMany(relationship.contextIds, 'context', `$.relationships.${relationship.id}.contextIds`, relationship.id);
    expectMany(relationship.claimIds, 'claim', `$.relationships.${relationship.id}.claimIds`, relationship.id);
    expect(relationship.whyRootId, 'explanation', `$.relationships.${relationship.id}.whyRootId`, relationship.id);
    expect(relationship.routeId, 'route', `$.relationships.${relationship.id}.routeId`, relationship.id);
  }
  for (const explanation of ctx.bundle.explanations) {
    expectMany(explanation.claimIds, 'claim', `$.explanations.${explanation.id}.claimIds`, explanation.id);
    expectMany(explanation.contextIds, 'context', `$.explanations.${explanation.id}.contextIds`, explanation.id);
    expectMany(explanation.deeperIds, 'explanation', `$.explanations.${explanation.id}.deeperIds`, explanation.id);
    expectMany(
      explanation.relatedConceptIds,
      'concept',
      `$.explanations.${explanation.id}.relatedConceptIds`,
      explanation.id,
    );
  }
  for (const objective of ctx.bundle.objectives) {
    expectMany(
      objective.prerequisiteConceptIds,
      'concept',
      `$.objectives.${objective.id}.prerequisiteConceptIds`,
      objective.id,
    );
  }
  for (const timeline of ctx.bundle.timelines) {
    expectMany(timeline.objectiveIds, 'objective', `$.timelines.${timeline.id}.objectiveIds`, timeline.id);
    expectMany(timeline.contextIds, 'context', `$.timelines.${timeline.id}.contextIds`, timeline.id);
    expectMany(timeline.overviewClaimIds, 'claim', `$.timelines.${timeline.id}.overviewClaimIds`, timeline.id);
    expectMany(timeline.summaryClaimIds, 'claim', `$.timelines.${timeline.id}.summaryClaimIds`, timeline.id);
    expectMany(
      timeline.prerequisiteConceptIds,
      'concept',
      `$.timelines.${timeline.id}.prerequisiteConceptIds`,
      timeline.id,
    );
    expectMany(timeline.predictionIds, 'prediction', `$.timelines.${timeline.id}.predictionIds`, timeline.id);
    expectMany(
      timeline.relatedTimelineIds,
      'timeline',
      `$.timelines.${timeline.id}.relatedTimelineIds`,
      timeline.id,
    );
    if (timeline.feedbackCoverage.kind === 'depicted') {
      expectMany(
        timeline.feedbackCoverage.relationshipIds,
        'relationship',
        `$.timelines.${timeline.id}.feedbackCoverage.relationshipIds`,
        timeline.id,
      );
    } else {
      expectMany(
        timeline.feedbackCoverage.claimIds,
        'claim',
        `$.timelines.${timeline.id}.feedbackCoverage.claimIds`,
        timeline.id,
      );
    }
    for (const step of timeline.steps) {
      expectMany(step.relationIds, 'relationship', `$.timelines.${timeline.id}.steps.${step.id}.relationIds`, timeline.id);
      expectMany(step.claimIds, 'claim', `$.timelines.${timeline.id}.steps.${step.id}.claimIds`, timeline.id);
    }
    for (const event of timeline.events) {
      const path = `$.timelines.${timeline.id}.events.${event.id}.command`;
      if (event.command.type === 'set-highlight') expect(event.command.anatomyId, 'anatomy', path, timeline.id);
      if (event.command.type === 'set-relation') {
        expect(event.command.relationshipId, 'relationship', path, timeline.id);
      }
      if (event.command.type === 'set-trend') expect(event.command.signalId, 'signal', path, timeline.id);
    }
    if (timelineKindForId(timeline.id) !== timeline.kind) {
      add(
        ctx,
        'VAL-001',
        `$.timelines.${timeline.id}.kind`,
        `a ${timeline.kind} timeline must use the matching identifier prefix`,
        timeline.id,
      );
    }
  }
  for (const prediction of ctx.bundle.predictions) {
    expect(prediction.timelineId, 'timeline', `$.predictions.${prediction.id}.timelineId`, prediction.id);
    expect(prediction.objectiveId, 'objective', `$.predictions.${prediction.id}.objectiveId`, prediction.id);
    expectMany(prediction.contextIds, 'context', `$.predictions.${prediction.id}.contextIds`, prediction.id);
    expectMany(prediction.claimIds, 'claim', `$.predictions.${prediction.id}.claimIds`, prediction.id);
    expectMany(
      prediction.explanationIds,
      'explanation',
      `$.predictions.${prediction.id}.explanationIds`,
      prediction.id,
    );
    expectMany(
      prediction.exposureTimelineIds,
      'timeline',
      `$.predictions.${prediction.id}.exposureTimelineIds`,
      prediction.id,
    );
    expectMany(
      prediction.exposureRelationshipIds,
      'relationship',
      `$.predictions.${prediction.id}.exposureRelationshipIds`,
      prediction.id,
    );
    expectMany(
      prediction.exposureExplanationIds,
      'explanation',
      `$.predictions.${prediction.id}.exposureExplanationIds`,
      prediction.id,
    );
  }
  for (const comparison of ctx.bundle.comparisons) {
    expectMany(comparison.signalIds, 'signal', `$.comparisons.${comparison.id}.signalIds`, comparison.id);
    expectMany(comparison.claimIds, 'claim', `$.comparisons.${comparison.id}.claimIds`, comparison.id);
  }
  for (const route of ctx.bundle.routes) {
    expect(route.fromAnchorId, 'anchor', `$.routes.${route.id}.fromAnchorId`, route.id);
    expect(route.toAnchorId, 'anchor', `$.routes.${route.id}.toAnchorId`, route.id);
    expectMany(route.claimIds, 'claim', `$.routes.${route.id}.claimIds`, route.id);
  }
}

/** VAL-002: every depth variant carries real text. */
function checkDepthText(ctx: Ctx): void {
  const fields: Array<[string, { intro: string; standard: string; mechanism: string }]> = [];
  for (const record of ctx.bundle.contexts) fields.push([`$.contexts.${record.id}.description`, record.description]);
  for (const record of ctx.bundle.anatomy) fields.push([`$.anatomy.${record.id}.description`, record.description]);
  for (const record of ctx.bundle.signals) {
    fields.push([`$.signals.${record.id}.description`, record.description]);
    fields.push([`$.signals.${record.id}.misconception`, record.misconception]);
    record.comparison.forEach((cell, index) =>
      fields.push([`$.signals.${record.id}.comparison[${index}].text`, cell.text]),
    );
  }
  for (const record of ctx.bundle.concepts) fields.push([`$.concepts.${record.id}.definition`, record.definition]);
  for (const record of ctx.bundle.relationships) {
    fields.push([`$.relationships.${record.id}.mechanism`, record.mechanism]);
  }
  for (const record of ctx.bundle.explanations) fields.push([`$.explanations.${record.id}.answer`, record.answer]);
  for (const record of ctx.bundle.timelines) {
    fields.push([`$.timelines.${record.id}.description`, record.description]);
    fields.push([`$.timelines.${record.id}.limitations`, record.limitations]);
    fields.push([`$.timelines.${record.id}.summary`, record.summary]);
    for (const step of record.steps) {
      fields.push([`$.timelines.${record.id}.steps.${step.id}.caption`, step.caption]);
    }
  }
  for (const record of ctx.bundle.predictions) {
    fields.push([`$.predictions.${record.id}.prompt`, record.prompt]);
    fields.push([`$.predictions.${record.id}.explanation`, record.explanation]);
    for (const option of record.options) {
      fields.push([`$.predictions.${record.id}.options.${option.id}.text`, option.text]);
      fields.push([`$.predictions.${record.id}.options.${option.id}.feedback`, option.feedback]);
    }
  }
  for (const [path, value] of fields) {
    for (const depth of ['intro', 'standard', 'mechanism'] as const) {
      if (value[depth].trim().length === 0) {
        add(ctx, 'VAL-002', `${path}.${depth}`, 'a depth variant may not be blank');
      }
    }
  }
}

/** VAL-003: published statements carry claims whose references and contexts resolve. */
function checkClaimSupport(ctx: Ctx): void {
  for (const signal of ctx.bundle.signals) {
    signal.comparison.forEach((cell, index) => {
      if (cell.applicability === 'applicable' && cell.claimIds.length === 0) {
        add(
          ctx,
          'VAL-003',
          `$.signals.${signal.id}.comparison[${index}].claimIds`,
          `the ${cell.dimension} comparison value is published without claim support`,
          signal.id,
        );
      }
    });
  }
  for (const timeline of ctx.bundle.timelines) {
    for (const step of timeline.steps) {
      if (step.claimIds.length === 0 && step.relationIds.length === 0) {
        add(
          ctx,
          'VAL-003',
          `$.timelines.${timeline.id}.steps.${step.id}.claimIds`,
          'a step must cite a claim or an already-supported relationship',
          timeline.id,
        );
      }
    }
    for (const band of timeline.timingBands) {
      if (band.claimIds.length === 0) {
        add(
          ctx,
          'VAL-003',
          `$.timelines.${timeline.id}.timingBands.${band.id}.claimIds`,
          'a biological timing label is a scientific statement and needs support',
          timeline.id,
        );
      }
    }
  }
}

/** VAL-004 and VAL-005: effect vocabulary must match the kind of support behind it. */
function checkRelationships(ctx: Ctx): void {
  for (const relationship of ctx.bundle.relationships) {
    const path = `$.relationships.${relationship.id}`;
    const claims = relationship.claimIds
      .map((id) => ctx.claims.get(id))
      .filter((claim): claim is Claim => claim !== undefined);

    const causalEffect =
      relationship.effect === 'stimulates' ||
      relationship.effect === 'inhibits' ||
      relationship.effect === 'modulates' ||
      relationship.effect === 'transports';

    if (causalEffect && relationship.kind !== 'causal') {
      add(ctx, 'VAL-005', `${path}.kind`, `${relationship.effect} requires a causal relationship`, relationship.id);
    }
    if (relationship.effect === 'associated-with' && relationship.kind !== 'associative') {
      add(ctx, 'VAL-005', `${path}.kind`, 'associated-with requires an associative relationship', relationship.id);
    }
    if (relationship.effect === 'describes' && relationship.kind !== 'descriptive') {
      add(ctx, 'VAL-005', `${path}.kind`, 'describes requires a descriptive relationship', relationship.id);
    }
    if (relationship.kind === 'associative' && relationship.effect !== 'associated-with') {
      add(
        ctx,
        'VAL-005',
        `${path}.effect`,
        'an associative edge may only use associated-with, so it cannot animate a causal effect',
        relationship.id,
      );
    }
    if (relationship.feedback && relationship.kind !== 'causal') {
      add(ctx, 'VAL-005', `${path}.feedback`, 'a feedback edge requires causal support', relationship.id);
    }

    if (relationship.kind === 'causal') {
      const supporting = claims.filter(
        (claim) => claim.relationKind === 'causal' && claim.support !== 'unresolved',
      );
      if (supporting.length === 0) {
        add(
          ctx,
          'VAL-004',
          `${path}.claimIds`,
          'a causal edge needs at least one causal claim whose support is not unresolved',
          relationship.id,
        );
      }
      if (ctx.mode === 'production' && !supporting.some((claim) => claim.status === 'approved')) {
        add(
          ctx,
          'VAL-004',
          `${path}.claimIds`,
          'publication requires an approved causal claim for this edge',
          relationship.id,
        );
      }
    }
  }
}

/** VAL-006: the explanation graph is finite, acyclic and bounded. */
function checkExplanationGraph(ctx: Ctx): void {
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string, trail: string[]): void => {
    const current = state.get(id);
    if (current === 'done') return;
    if (current === 'visiting') {
      add(
        ctx,
        'VAL-006',
        `$.explanations.${id}.deeperIds`,
        `explanation cycle: ${[...trail, id].join(' -> ')}`,
        id,
      );
      return;
    }
    state.set(id, 'visiting');
    const explanation = ctx.explanations.get(id);
    for (const deeper of explanation?.deeperIds ?? []) visit(deeper, [...trail, id]);
    state.set(id, 'done');
  };
  for (const explanation of ctx.bundle.explanations) visit(explanation.id, []);

  // Traversal from any Why root stays inside the R1 node budget.
  for (const relationship of ctx.bundle.relationships) {
    const seen = new Set<string>();
    const queue = [relationship.whyRootId];
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined || seen.has(id)) continue;
      seen.add(id);
      if (seen.size > MAX_WHY_TRAVERSAL) {
        add(
          ctx,
          'VAL-017',
          `$.relationships.${relationship.id}.whyRootId`,
          `Why traversal exceeds ${MAX_WHY_TRAVERSAL} nodes`,
          relationship.id,
        );
        break;
      }
      queue.push(...(ctx.explanations.get(id)?.deeperIds ?? []));
    }
  }
}

/** VAL-007 to VAL-010: timing, ordering, track structure and context applicability. */
function checkTimelines(ctx: Ctx): void {
  const predictionsByTimeline = new Map<string, typeof ctx.bundle.predictions>();
  for (const prediction of ctx.bundle.predictions) {
    const list = predictionsByTimeline.get(prediction.timelineId) ?? [];
    list.push(prediction);
    predictionsByTimeline.set(prediction.timelineId, list);
  }

  for (const timeline of ctx.bundle.timelines) {
    const path = `$.timelines.${timeline.id}`;
    const trackIds = new Set(timeline.tracks.map((track) => track.id));
    const bandIds = new Set(timeline.timingBands.map((band) => band.id));
    const orders = new Set<number>();

    for (const track of timeline.tracks) {
      if (orders.has(track.order)) {
        add(ctx, 'VAL-009', `${path}.tracks.${track.id}.order`, 'track order must be unique', timeline.id);
      }
      orders.add(track.order);
      if (!track.id.startsWith(`${timeline.id}-`)) {
        add(ctx, 'VAL-001', `${path}.tracks.${track.id}`, 'child identifiers carry the timeline prefix', timeline.id);
      }
      const initial = timeline.steps.filter((step) => step.trackId === track.id && step.atMs === 0);
      if (initial.length === 0) {
        add(ctx, 'VAL-009', `${path}.tracks.${track.id}`, 'every track needs an initial step at 0 ms', timeline.id);
      }
    }

    const stepTimesByTrack = new Map<string, Set<number>>();
    for (const step of timeline.steps) {
      const stepPath = `${path}.steps.${step.id}`;
      if (!step.id.startsWith(`${timeline.id}-`)) {
        add(ctx, 'VAL-001', stepPath, 'child identifiers carry the timeline prefix', timeline.id);
      }
      if (!trackIds.has(step.trackId)) {
        add(ctx, 'VAL-008', `${stepPath}.trackId`, `unknown track ${step.trackId}`, timeline.id);
      }
      if (!bandIds.has(step.timingBandId)) {
        add(ctx, 'VAL-008', `${stepPath}.timingBandId`, `unknown timing band ${step.timingBandId}`, timeline.id);
      }
      if (step.atMs > timeline.durationMs) {
        add(ctx, 'VAL-007', `${stepPath}.atMs`, 'a step may not sit past the timeline duration', timeline.id);
      }
      const times = stepTimesByTrack.get(step.trackId) ?? new Set<number>();
      if (times.has(step.atMs)) {
        add(ctx, 'VAL-009', `${stepPath}.atMs`, 'a track may hold at most one step per timestamp', timeline.id);
      }
      times.add(step.atMs);
      stepTimesByTrack.set(step.trackId, times);
      checkApplicability(ctx, timeline, step.claimIds, `${stepPath}.claimIds`);
      for (const relationId of step.relationIds) {
        const relationship = ctx.bundle.relationships.find((item) => item.id === relationId);
        if (relationship && !intersects(relationship.contextIds, timeline.contextIds)) {
          add(
            ctx,
            'VAL-010',
            `${stepPath}.relationIds`,
            `${relationId} has no context in common with this lesson`,
            timeline.id,
          );
        }
      }
    }

    for (const band of timeline.timingBands) {
      checkApplicability(ctx, timeline, band.claimIds, `${path}.timingBands.${band.id}.claimIds`);
    }

    const eventOrders = new Set<number>();
    const writes = new Map<string, string>();
    for (const event of timeline.events) {
      const eventPath = `${path}.events.${event.id}`;
      if (!event.id.startsWith(`${timeline.id}-`)) {
        add(ctx, 'VAL-001', eventPath, 'child identifiers carry the timeline prefix', timeline.id);
      }
      if (eventOrders.has(event.order)) {
        add(ctx, 'VAL-008', `${eventPath}.order`, 'event order must be unique within a timeline', timeline.id);
      }
      eventOrders.add(event.order);
      if (!trackIds.has(event.trackId)) {
        add(ctx, 'VAL-008', `${eventPath}.trackId`, `unknown track ${event.trackId}`, timeline.id);
      }
      if (event.atMs > timeline.durationMs) {
        add(ctx, 'VAL-007', `${eventPath}.atMs`, 'an event may not sit past the timeline duration', timeline.id);
      }
      // Two commands writing the same property of the same semantic ID at the same instant are
      // a conflict even when the values agree: the author must merge or retime them.
      const target =
        event.command.type === 'set-highlight'
          ? `highlight:${event.command.anatomyId}`
          : event.command.type === 'set-relation'
            ? `relation:${event.command.relationshipId}`
            : `trend:${event.command.signalId}`;
      const key = `${event.atMs}|${target}`;
      const existing = writes.get(key);
      if (existing !== undefined) {
        add(
          ctx,
          'VAL-008',
          `${eventPath}.command`,
          `conflicts with ${existing}: both write ${target} at ${event.atMs} ms`,
          timeline.id,
        );
      }
      writes.set(key, event.id);
      checkApplicability(ctx, timeline, event.claimIds, `${eventPath}.claimIds`);
    }

    const predictions = [...(predictionsByTimeline.get(timeline.id) ?? [])].sort((a, b) => a.atMs - b.atMs);
    const declared = new Set(timeline.predictionIds);
    for (const prediction of predictions) {
      if (!declared.has(prediction.id)) {
        add(
          ctx,
          'VAL-012',
          `${path}.predictionIds`,
          `${prediction.id} targets this timeline but is not listed on it`,
          timeline.id,
        );
      }
    }
    predictions.forEach((prediction, index) => {
      const predictionPath = `$.predictions.${prediction.id}`;
      if (prediction.atMs >= prediction.revealAtMs) {
        add(ctx, 'VAL-007', `${predictionPath}.revealAtMs`, 'the answer must be revealed after the question', prediction.id);
      }
      if (prediction.revealAtMs > timeline.durationMs) {
        add(ctx, 'VAL-007', `${predictionPath}.revealAtMs`, 'the reveal may not sit past the duration', prediction.id);
      }
      const next = predictions[index + 1];
      if (next && prediction.atMs === next.atMs) {
        add(ctx, 'VAL-013', `${predictionPath}.atMs`, 'at most one checkpoint may sit at a timestamp', prediction.id);
      }
      if (next && prediction.revealAtMs > next.atMs) {
        add(
          ctx,
          'VAL-013',
          `${predictionPath}.revealAtMs`,
          'a reveal must precede the next checkpoint',
          prediction.id,
        );
      }
      for (const stepId of prediction.revealsStepIds) {
        const step = timeline.steps.find((item) => item.id === stepId);
        if (!step) {
          add(ctx, 'VAL-013', `${predictionPath}.revealsStepIds`, `unknown step ${stepId}`, prediction.id);
        } else if (step.atMs < prediction.revealAtMs) {
          add(
            ctx,
            'VAL-013',
            `${predictionPath}.revealsStepIds`,
            `${stepId} at ${step.atMs} ms would leak the answer before the reveal`,
            prediction.id,
          );
        }
      }
    });
  }
}

function intersects(a: readonly string[], b: readonly string[]): boolean {
  return a.some((value) => b.includes(value));
}

/**
 * VAL-010's machine half: a claim used inside a lesson must share at least one context with it.
 * A general context can be listed explicitly on both; there is no hidden inheritance, and this
 * check catches omissions without certifying scientific applicability.
 */
function checkApplicability(ctx: Ctx, timeline: Timeline, claimIds: readonly string[], path: string): void {
  for (const claimId of claimIds) {
    const claim = ctx.claims.get(claimId);
    if (!claim) continue;
    if (!intersects(claim.contextIds, timeline.contextIds)) {
      add(ctx, 'VAL-010', path, `${claimId} has no context in common with ${timeline.id}`, timeline.id);
    }
  }
}

/** VAL-011 and VAL-019: anatomy, anchors, routes and the parent graph. */
function checkAnatomyAndRoutes(ctx: Ctx): void {
  const anchors = new Map(ctx.bundle.anchors.map((anchor) => [anchor.id, anchor]));
  const anatomyById = new Map(ctx.bundle.anatomy.map((record) => [record.id, record]));

  for (const anatomy of ctx.bundle.anatomy) {
    const anchor = anchors.get(anatomy.anchorId);
    if (!anchor) continue;
    if (anchor.view !== anatomy.view) {
      add(
        ctx,
        'VAL-011',
        `$.anatomy.${anatomy.id}.anchorId`,
        `anchor ${anchor.id} belongs to the ${anchor.view} view but the region is in ${anatomy.view}`,
        anatomy.id,
      );
    }
  }

  // Left and right structures must not share an anchor: picking would become ambiguous.
  const anchorUsers = new Map<string, string[]>();
  for (const anatomy of ctx.bundle.anatomy) {
    anchorUsers.set(anatomy.anchorId, [...(anchorUsers.get(anatomy.anchorId) ?? []), anatomy.id]);
  }
  for (const [anchorId, users] of anchorUsers) {
    if (users.length < 2) continue;
    const lateralities = new Set(users.map((id) => anatomyById.get(id)?.laterality));
    if (lateralities.has('left') || lateralities.has('right')) {
      add(ctx, 'VAL-019', `$.anchors.${anchorId}`, `${users.join(', ')} share one pickable anchor`, anchorId);
    }
  }

  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string, trail: string[]): void => {
    const current = state.get(id);
    if (current === 'done') return;
    if (current === 'visiting') {
      add(ctx, 'VAL-019', `$.anatomy.${id}.parentId`, `anatomy cycle: ${[...trail, id].join(' -> ')}`, id);
      return;
    }
    state.set(id, 'visiting');
    const parent = anatomyById.get(id)?.parentId;
    if (parent !== undefined) visit(parent, [...trail, id]);
    state.set(id, 'done');
  };
  for (const anatomy of ctx.bundle.anatomy) visit(anatomy.id, []);

  if (ctx.bundle.anatomy.length > 0 && !ctx.bundle.anatomy.some((record) => record.parentId === undefined)) {
    add(ctx, 'VAL-019', '$.anatomy', 'the anatomy graph has no root region');
  }

  for (const route of ctx.bundle.routes) {
    for (const [field, anchorId] of [
      ['fromAnchorId', route.fromAnchorId],
      ['toAnchorId', route.toAnchorId],
    ] as const) {
      const anchor = anchors.get(anchorId);
      if (anchor && anchor.view !== route.view) {
        add(
          ctx,
          'VAL-011',
          `$.routes.${route.id}.${field}`,
          `route is drawn in the ${route.view} view but ${anchorId} is a ${anchor.view} anchor`,
          route.id,
        );
      }
    }
  }
}

/** VAL-012: assessment contracts. */
function checkPredictions(ctx: Ctx): void {
  const familyMembers = new Map<string, string[]>();
  for (const prediction of ctx.bundle.predictions) {
    const path = `$.predictions.${prediction.id}`;
    const optionIds = new Set<string>();
    for (const option of prediction.options) {
      if (optionIds.has(option.id)) {
        add(ctx, 'VAL-012', `${path}.options`, `duplicate option ${option.id}`, prediction.id);
      }
      optionIds.add(option.id);
      if (!option.id.startsWith(`${prediction.id}-`)) {
        add(ctx, 'VAL-001', `${path}.options.${option.id}`, 'option identifiers carry the prediction prefix', prediction.id);
      }
    }
    if (!optionIds.has(prediction.correctOptionId)) {
      add(ctx, 'VAL-012', `${path}.correctOptionId`, 'the correct option must be one of the options', prediction.id);
    }
    const texts = new Set(prediction.options.map((option) => option.text.standard.trim().toLowerCase()));
    if (texts.size !== prediction.options.length) {
      add(ctx, 'VAL-012', `${path}.options`, 'options must be distinct', prediction.id);
    }
    familyMembers.set(prediction.familyId, [...(familyMembers.get(prediction.familyId) ?? []), prediction.id]);
  }
  for (const [familyId, members] of familyMembers) {
    if (members.length > 2) {
      add(
        ctx,
        'VAL-012',
        `$.predictions[familyId=${familyId}]`,
        `a family groups matched forms; ${members.length} members found`,
      );
    }
  }
}

/** VAL-014: comparison coverage. */
function checkComparisons(ctx: Ctx): void {
  for (const signal of ctx.bundle.signals) {
    const seen = new Set<string>();
    for (const cell of signal.comparison) {
      if (seen.has(cell.dimension)) {
        add(
          ctx,
          'VAL-014',
          `$.signals.${signal.id}.comparison`,
          `duplicate comparison dimension ${cell.dimension}`,
          signal.id,
        );
      }
      seen.add(cell.dimension);
    }
    const missing = comparisonDimensions.filter((dimension) => !seen.has(dimension));
    if (signal.comparison.length > 0 && missing.length > 0) {
      add(
        ctx,
        'VAL-014',
        `$.signals.${signal.id}.comparison`,
        `missing comparison dimension(s): ${missing.join(', ')}`,
        signal.id,
      );
    }
  }
  for (const comparison of ctx.bundle.comparisons) {
    if (comparison.signalIds[0] === comparison.signalIds[1]) {
      add(ctx, 'VAL-014', `$.comparisons.${comparison.id}.signalIds`, 'a pair needs two distinct signals', comparison.id);
    }
  }
}

/** VAL-017: bounded records and text. */
function checkSizeLimits(ctx: Ctx): void {
  const total = GROUPS.reduce(
    (sum, group) => sum + (ctx.bundle[group.key] as readonly unknown[]).length,
    0,
  );
  if (total > MAX_GRAPH_RECORDS) {
    add(ctx, 'VAL-017', '$', `the bundle holds ${total} records, above the ${MAX_GRAPH_RECORDS} limit`);
  }
  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      if (path.endsWith('.id') && value.length > MAX_ID_LENGTH) {
        add(ctx, 'VAL-017', path, 'identifier exceeds the length limit');
      } else if (path.endsWith('.label') && value.length > MAX_LABEL_LENGTH) {
        add(ctx, 'VAL-017', path, 'label exceeds the length limit');
      } else if (value.length > MAX_TEXT_LENGTH) {
        add(ctx, 'VAL-017', path, 'text exceeds the length limit');
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, `${path}[${index}]`);
      });
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
    }
  };
  walk(ctx.bundle, '$');
}

/** VAL-018: paths and links stay same-origin or explicitly HTTPS. */
function checkPaths(ctx: Ctx): void {
  for (const asset of ctx.bundle.assets) {
    if (asset.path.startsWith('/') || asset.path.includes('..') || /^[a-z]+:/i.test(asset.path)) {
      add(ctx, 'VAL-018', `$.assets.${asset.id}.path`, 'asset paths must be relative and same-origin', asset.id);
    }
  }
  for (const reference of ctx.bundle.references) {
    if (!reference.url.startsWith('https://')) {
      add(ctx, 'VAL-018', `$.references.${reference.id}.url`, 'citation links must use https', reference.id);
    }
  }
}

/** VAL-015: the publication gate. Nothing here may be bypassed by an environment variable. */
function checkPublicationGate(ctx: Ctx): void {
  if (ctx.bundle.fixture) {
    add(ctx, 'VAL-015', '$.fixture', 'fixture content cannot be published');
  }
  for (const claim of ctx.bundle.claims) {
    if (claim.status !== 'approved') {
      add(ctx, 'VAL-015', `$.claims.${claim.id}.status`, `claim is ${claim.status}; publication needs approval`, claim.id);
    }
    if (claim.references.length === 0) {
      add(ctx, 'VAL-015', `$.claims.${claim.id}.references`, 'a published claim needs at least one checked reference', claim.id);
    }
  }
  for (const asset of ctx.bundle.assets) {
    if (asset.license.trim().length === 0) {
      add(ctx, 'VAL-015', `$.assets.${asset.id}.license`, 'assets need an explicit licence', asset.id);
    }
  }
  const approvals = ctx.bundle.reviews.filter((review) => review.disposition === 'approved');
  if (approvals.length === 0) {
    add(ctx, 'VAL-015', '$.reviews', 'publication requires a recorded scientific approval');
    return;
  }
  const maxAgeMs = REVIEW_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  for (const review of approvals) {
    if (ctx.scientificSha256 !== undefined && review.bundleSha256 !== ctx.scientificSha256) {
      add(
        ctx,
        'VAL-015',
        `$.reviews.${review.id}.bundleSha256`,
        'approval hash does not match the current scientific bundle hash',
        review.id,
      );
    }
    const reviewedOn = Date.parse(`${review.reviewedOn}T00:00:00Z`);
    if (Number.isNaN(reviewedOn)) {
      add(ctx, 'VAL-015', `$.reviews.${review.id}.reviewedOn`, 'unreadable review date', review.id);
      continue;
    }
    if (ctx.now.getTime() - reviewedOn > maxAgeMs) {
      add(
        ctx,
        'VAL-015',
        `$.reviews.${review.id}.reviewedOn`,
        `approval is older than ${REVIEW_MAX_AGE_DAYS} days`,
        review.id,
      );
    }
  }
}

/** VAL-016: the released inventory is exactly the R1 curriculum. */
function checkInventory(ctx: Ctx): void {
  const present = new Set(ctx.ids.keys());
  const requireAll = (ids: readonly string[], label: string): void => {
    for (const id of ids) {
      if (!present.has(id)) add(ctx, 'VAL-016', `$.${label}`, `R1 requires ${id}`);
    }
  };
  requireAll(R1_SIGNAL_IDS, 'signals');
  requireAll(R1_JOURNEY_IDS, 'timelines');
  requireAll(R1_STATE_IDS, 'timelines');
  requireAll(R1_COMPARISON_IDS, 'comparisons');

  let checkpoints = 0;
  for (const timeline of ctx.bundle.timelines) {
    if (timeline.kind === 'exercise') continue;
    const count = ctx.bundle.predictions.filter(
      (prediction) => prediction.timelineId === timeline.id,
    ).length;
    checkpoints += count;
    if (count < MIN_PREDICTIONS_PER_TIMELINE) {
      add(
        ctx,
        'VAL-016',
        `$.timelines.${timeline.id}.predictionIds`,
        `a released lesson needs at least ${MIN_PREDICTIONS_PER_TIMELINE} checkpoint predictions`,
        timeline.id,
      );
    }
  }
  if (checkpoints < MIN_CHECKPOINT_PREDICTIONS) {
    add(ctx, 'VAL-016', '$.predictions', `R1 requires at least ${MIN_CHECKPOINT_PREDICTIONS} checkpoint predictions`);
  }

  const transfer = ctx.bundle.predictions.filter((prediction) => prediction.kind === 'transfer');
  if (transfer.length < REQUIRED_TRANSFER_PROMPTS) {
    add(ctx, 'VAL-016', '$.predictions', `R1 requires ${REQUIRED_TRANSFER_PROMPTS} transfer prompts`);
  }

  // Every signal participates in a released relationship, and every journey is reachable.
  for (const signal of ctx.bundle.signals) {
    const used = ctx.bundle.relationships.some(
      (relationship) =>
        (relationship.source.kind === 'signal' && relationship.source.id === signal.id) ||
        (relationship.target.kind === 'signal' && relationship.target.id === signal.id),
    );
    if (!used) {
      add(ctx, 'VAL-016', `$.signals.${signal.id}`, 'every signal must participate in a released relationship', signal.id);
    }
  }
  for (const timeline of ctx.bundle.timelines) {
    if (timeline.kind !== 'journey') continue;
    const reachable =
      ctx.bundle.signals.some((signal) => signal.journeyIds.includes(timeline.id)) ||
      ctx.bundle.timelines.some((other) => other.relatedTimelineIds.includes(timeline.id));
    if (!reachable) {
      add(
        ctx,
        'VAL-016',
        `$.timelines.${timeline.id}`,
        'every journey needs an entry from at least one signal or state',
        timeline.id,
      );
    }
  }
}

/** VAL-020: the manifest and the bundle describe the same release. */
export function validateManifest(
  manifest: ContentManifest,
  bundle: ContentBundle,
  deliveredBundleSha256: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (path: string, message: string): void => {
    issues.push({ rule: 'VAL-020', path, message });
  };

  if (manifest.contentVersion !== bundle.contentVersion) {
    push('$.contentVersion', 'manifest and bundle content versions differ');
  }
  if (manifest.bundleSha256 !== deliveredBundleSha256) {
    push('$.bundleSha256', 'manifest hash does not match the delivered bundle bytes');
  }

  const expected = new Map<string, { kind: string; label: string; aliases: string[] }>();
  for (const signal of bundle.signals) {
    expected.set(signal.id, { kind: 'signal', label: signal.label, aliases: [...signal.aliases] });
  }
  for (const timeline of bundle.timelines) {
    expected.set(timeline.id, { kind: timeline.kind, label: timeline.label, aliases: [] });
  }
  for (const anatomy of bundle.anatomy) {
    expected.set(anatomy.id, { kind: 'anatomy', label: anatomy.label, aliases: [...anatomy.aliases] });
  }
  for (const concept of bundle.concepts) {
    expected.set(concept.id, { kind: 'concept', label: concept.label, aliases: [...concept.aliases] });
  }

  for (const entry of manifest.catalog) {
    const match = expected.get(entry.id);
    if (!match) {
      push('$.catalog', `${entry.id} is in the catalog but not in the bundle`);
      continue;
    }
    if (match.kind !== entry.kind || match.label !== entry.label) {
      push('$.catalog', `${entry.id} does not match its bundle record`);
    }
    expected.delete(entry.id);
  }
  for (const id of expected.keys()) {
    push('$.catalog', `${id} is released but missing from the catalog`);
  }

  const active = new Set(manifest.catalog.map((entry) => entry.id));
  for (const retired of manifest.retired) {
    if (active.has(retired.id)) {
      push('$.retired', `${retired.id} is both retired and active`);
    }
  }
  return issues;
}

export function formatIssues(issues: readonly ValidationIssue[]): string {
  return issues
    .map(
      (issue) =>
        `${issue.rule}  ${issue.path}${issue.recordId ? ` (${issue.recordId})` : ''}\n          ${issue.message}`,
    )
    .join('\n');
}
