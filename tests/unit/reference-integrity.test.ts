/**
 * VAL-001 in full: every typed reference field in the bundle must resolve to a record of the
 * expected kind. Rather than trust one example, this breaks each reference field in turn.
 */
import { describe, expect, it } from 'vitest';
import { validateBundle } from '../../src/content/validate.ts';
import { bundleWith, timelineOf } from '../fixtures/bundle.ts';
import type { ContentBundle } from '../../src/content/schema.ts';

const MISSING = {
  claim: 'claim-does-not-exist',
  context: 'ctx-does-not-exist',
  concept: 'concept-does-not-exist',
  relationship: 'rel-does-not-exist',
  explanation: 'why-does-not-exist',
  anatomy: 'anat-does-not-exist',
  anchor: 'anchor-does-not-exist',
  signal: 'sig-does-not-exist',
  objective: 'obj-does-not-exist',
  prediction: 'pred-does-not-exist',
  reference: 'ref-does-not-exist',
  route: 'route-does-not-exist',
  timeline: 'j-does-not-exist',
} as const;

const BREAKS: Array<[string, (bundle: ContentBundle) => void]> = [
  ['context claim link', (b) => void (b.contexts[0]!.claimIds = [MISSING.claim])],
  ['claim context link', (b) => void (b.claims[0]!.contextIds = [MISSING.context])],
  [
    'claim reference link',
    (b) =>
      void b.claims[0]!.references.push({
        referenceId: MISSING.reference,
        locator: 'section 1',
        stance: 'supports',
        note: 'fixture',
      }),
  ],
  ['anatomy parent', (b) => void (b.anatomy[1]!.parentId = MISSING.anatomy)],
  ['anatomy anchor', (b) => void (b.anatomy[0]!.anchorId = MISSING.anchor)],
  ['anatomy claim link', (b) => void (b.anatomy[0]!.claimIds = [MISSING.claim])],
  ['signal claim link', (b) => void (b.signals[0]!.claimIds = [MISSING.claim])],
  ['signal journey link', (b) => void (b.signals[0]!.journeyIds = [MISSING.timeline])],
  ['signal role context', (b) => void (b.signals[0]!.roles[0]!.contextIds = [MISSING.context])],
  ['signal role source', (b) => void (b.signals[0]!.roles[0]!.sourceAnatomyIds = [MISSING.anatomy])],
  ['signal role claim', (b) => void (b.signals[0]!.roles[0]!.claimIds = [MISSING.claim])],
  ['comparison cell claim', (b) => void (b.signals[0]!.comparison[0]!.claimIds = [MISSING.claim])],
  ['comparison cell context', (b) => void (b.signals[0]!.comparison[0]!.contextIds = [MISSING.context])],
  ['concept relation', (b) => void (b.concepts[0]!.relatedConceptIds = [MISSING.concept])],
  ['concept claim link', (b) => void (b.concepts[0]!.claimIds = [MISSING.claim])],
  ['relationship context', (b) => void (b.relationships[0]!.contextIds = [MISSING.context])],
  ['relationship claim', (b) => void (b.relationships[0]!.claimIds = [MISSING.claim])],
  ['relationship why root', (b) => void (b.relationships[0]!.whyRootId = MISSING.explanation)],
  ['relationship route', (b) => void (b.relationships[0]!.routeId = MISSING.route)],
  ['relationship target', (b) => void (b.relationships[0]!.target = { kind: 'anatomy', id: MISSING.anatomy })],
  ['explanation claim', (b) => void (b.explanations[0]!.claimIds = [MISSING.claim])],
  ['explanation context', (b) => void (b.explanations[0]!.contextIds = [MISSING.context])],
  ['explanation deeper link', (b) => void (b.explanations[0]!.deeperIds = [MISSING.explanation])],
  ['explanation concept', (b) => void (b.explanations[0]!.relatedConceptIds = [MISSING.concept])],
  ['objective prerequisite', (b) => void (b.objectives[0]!.prerequisiteConceptIds = [MISSING.concept])],
  ['timeline objective', (b) => void (timelineOf(b).objectiveIds = [MISSING.objective])],
  ['timeline context', (b) => void (timelineOf(b).contextIds = [MISSING.context])],
  ['timeline overview claim', (b) => void (timelineOf(b).overviewClaimIds = [MISSING.claim])],
  ['timeline summary claim', (b) => void (timelineOf(b).summaryClaimIds = [MISSING.claim])],
  ['timeline prerequisite', (b) => void (timelineOf(b).prerequisiteConceptIds = [MISSING.concept])],
  ['timeline prediction list', (b) => void (timelineOf(b).predictionIds = [MISSING.prediction])],
  ['timeline related lesson', (b) => void (timelineOf(b).relatedTimelineIds = [MISSING.timeline])],
  [
    'timeline feedback coverage',
    (b) =>
      void (timelineOf(b).feedbackCoverage = {
        kind: 'depicted',
        relationshipIds: [MISSING.relationship],
      }),
  ],
  [
    'timeline feedback not depicted',
    (b) =>
      void (timelineOf(b).feedbackCoverage = {
        kind: 'not-depicted',
        reason: { intro: 'a', standard: 'a', mechanism: 'a' },
        claimIds: [MISSING.claim],
      }),
  ],
  ['step relation', (b) => void (timelineOf(b).steps[0]!.relationIds = [MISSING.relationship])],
  ['step claim', (b) => void (timelineOf(b).steps[0]!.claimIds = [MISSING.claim])],
  [
    'event highlight target',
    (b) =>
      void (timelineOf(b).events[0]!.command = {
        type: 'set-highlight',
        anatomyId: MISSING.anatomy,
        value: 'source',
      }),
  ],
  [
    'event relation target',
    (b) =>
      void (timelineOf(b).events[0]!.command = {
        type: 'set-relation',
        relationshipId: MISSING.relationship,
        visible: true,
      }),
  ],
  [
    'event trend target',
    (b) =>
      void (timelineOf(b).events[0]!.command = {
        type: 'set-trend',
        signalId: MISSING.signal,
        value: 'increasing',
      }),
  ],
  ['prediction timeline', (b) => void (b.predictions[0]!.timelineId = MISSING.timeline)],
  ['prediction objective', (b) => void (b.predictions[0]!.objectiveId = MISSING.objective)],
  ['prediction context', (b) => void (b.predictions[0]!.contextIds = [MISSING.context])],
  ['prediction claim', (b) => void (b.predictions[0]!.claimIds = [MISSING.claim])],
  ['prediction explanation', (b) => void (b.predictions[0]!.explanationIds = [MISSING.explanation])],
  ['prediction exposure timeline', (b) => void (b.predictions[0]!.exposureTimelineIds = [MISSING.timeline])],
  [
    'prediction exposure relationship',
    (b) => void (b.predictions[0]!.exposureRelationshipIds = [MISSING.relationship]),
  ],
  [
    'prediction exposure explanation',
    (b) => void (b.predictions[0]!.exposureExplanationIds = [MISSING.explanation]),
  ],
  ['route from anchor', (b) => void (b.routes[0]!.fromAnchorId = MISSING.anchor)],
  ['route to anchor', (b) => void (b.routes[0]!.toAnchorId = MISSING.anchor)],
  ['route claim', (b) => void (b.routes[0]!.claimIds = [MISSING.claim])],
];

describe('every typed reference must resolve', () => {
  it.each(BREAKS)('rejects a broken %s', (_name, mutate) => {
    const issues = validateBundle(bundleWith(mutate), { mode: 'preview' });
    expect(issues.some((issue) => issue.rule === 'VAL-001')).toBe(true);
  });

  it('rejects a comparison pair that names an unknown signal', () => {
    const issues = validateBundle(
      bundleWith((bundle) => {
        bundle.comparisons.push({
          id: 'pair-broken',
          signalIds: ['sig-alpha', MISSING.signal],
          title: 'Broken pair',
          explanation: { intro: 'a', standard: 'a', mechanism: 'a' },
          claimIds: ['claim-fictional-overview'],
        });
      }),
      { mode: 'preview' },
    );
    expect(issues.some((issue) => issue.rule === 'VAL-001')).toBe(true);
  });

  it('rejects a timeline whose kind and identifier prefix disagree', () => {
    const issues = validateBundle(
      bundleWith((bundle) => {
        timelineOf(bundle).kind = 'journey';
      }),
      { mode: 'preview' },
    );
    expect(
      issues.some((issue) => issue.message.includes('matching identifier prefix')),
    ).toBe(true);
  });

  it('rejects child identifiers that do not carry their timeline prefix', () => {
    for (const mutate of [
      (b: ContentBundle) => void (timelineOf(b).tracks[0]!.id = 'track-orphan'),
      (b: ContentBundle) => void (timelineOf(b).steps[0]!.id = 'step-orphan'),
      (b: ContentBundle) => void (timelineOf(b).events[0]!.id = 'event-orphan'),
      (b: ContentBundle) => void (b.predictions[0]!.options[0]!.id = 'option-orphan'),
    ]) {
      const issues = validateBundle(bundleWith(mutate), { mode: 'preview' });
      expect(issues.some((issue) => issue.message.includes('prefix'))).toBe(true);
    }
  });
});
