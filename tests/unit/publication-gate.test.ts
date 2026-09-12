/**
 * Quality bar C2 and acceptance scenario AC-11: publication fails closed.
 *
 * These tests use the fictional bundle with `fixture` cleared, so they exercise the gate itself
 * rather than the separate rule that fixtures may never be published.
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_WHY_TRAVERSAL,
  REVIEW_MAX_AGE_DAYS,
  formatIssues,
  parseManifest,
  validateBundle,
  validateManifest,
} from '../../src/content/validate.ts';
import { isValidId, timelineKindForId } from '../../src/content/ids.ts';
import { bundleWith } from '../fixtures/bundle.ts';
import type { ContentBundle } from '../../src/content/schema.ts';

const NOW = new Date('2026-09-12T00:00:00Z');

/** A bundle that is no longer marked as a fixture, so only the remaining gates can fail. */
function releaseCandidate(mutate: (bundle: ContentBundle) => void = () => undefined): ContentBundle {
  return bundleWith((bundle) => {
    bundle.fixture = false;
    mutate(bundle);
  });
}

function rules(bundle: ContentBundle): string[] {
  return validateBundle(bundle, { mode: 'production', now: NOW }).map((issue) => issue.rule);
}

function messages(bundle: ContentBundle): string[] {
  return validateBundle(bundle, { mode: 'production', now: NOW }).map((issue) => issue.message);
}

describe('publication gate', () => {
  it('blocks a bundle that declares itself a fixture', () => {
    expect(messages(bundleWith(() => undefined))).toContain('fixture content cannot be published');
  });

  it('blocks draft claims and claims with no checked reference', () => {
    const found = messages(releaseCandidate());
    expect(found.some((message) => message.includes('claim is draft'))).toBe(true);
    expect(found.some((message) => message.includes('at least one checked reference'))).toBe(true);
  });

  it('blocks a release with no recorded approval', () => {
    expect(messages(releaseCandidate())).toContain(
      'publication requires a recorded scientific approval',
    );
  });

  it('blocks an approval older than the review window', () => {
    const stale = releaseCandidate((bundle) => {
      bundle.reviews.push({
        id: 'review-stale',
        bundleSha256: 'a'.repeat(64),
        reviewerId: 'reviewer-fixture',
        reviewerRole: 'fixture',
        qualification: 'fixture record, not a real reviewer',
        reviewedOn: '2024-01-01',
        disposition: 'approved',
        visualReviewBuildId: 'fixture',
        notes: '',
      });
    });
    expect(messages(stale).some((message) => message.includes(String(REVIEW_MAX_AGE_DAYS)))).toBe(true);
  });

  it('blocks an approval whose hash does not cover the current scientific bundle', () => {
    const candidate = releaseCandidate((bundle) => {
      bundle.reviews.push({
        id: 'review-mismatched-hash',
        bundleSha256: 'a'.repeat(64),
        reviewerId: 'reviewer-fixture',
        reviewerRole: 'fixture',
        qualification: 'fixture record, not a real reviewer',
        reviewedOn: '2026-09-01',
        disposition: 'approved',
        visualReviewBuildId: 'fixture',
        notes: '',
      });
    });
    const found = validateBundle(candidate, {
      mode: 'production',
      now: NOW,
      scientificSha256: 'b'.repeat(64),
    });
    expect(found.map((issue) => issue.message)).toContain(
      'approval hash does not match the current scientific bundle hash',
    );
  });

  it('rejects an unreadable review date rather than treating it as current', () => {
    const broken = releaseCandidate((bundle) => {
      bundle.reviews.push({
        id: 'review-broken',
        bundleSha256: 'a'.repeat(64),
        reviewerId: 'reviewer-fixture',
        reviewerRole: 'fixture',
        qualification: 'fixture record, not a real reviewer',
        reviewedOn: '2026-13-45',
        disposition: 'approved',
        visualReviewBuildId: 'fixture',
        notes: '',
      });
    });
    expect(messages(broken)).toContain('unreadable review date');
  });

  it('blocks an asset with no licence', () => {
    const unlicensed = releaseCandidate((bundle) => {
      bundle.assets.push({
        id: 'asset-body',
        path: 'models/body.glb',
        sha256: 'c'.repeat(64),
        bytes: 1024,
        kind: 'body-model',
        source: 'project-authored',
        sourceRevision: 'fixture',
        license: '   ',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        attribution: 'Fixture asset; no third-party attribution required.',
        modified: false,
        modificationNote: 'Synthetic test metadata.',
      });
    });
    expect(messages(unlicensed)).toContain('assets need an explicit licence');
  });

  it('requires an approved causal claim behind every causal edge', () => {
    expect(messages(releaseCandidate())).toContain(
      'publication requires an approved causal claim for this edge',
    );
  });

  it('requires the R1 inventory, prediction minimums and reachable journeys', () => {
    const found = messages(releaseCandidate());
    expect(found.some((message) => message.includes('R1 requires sig-cortisol'))).toBe(true);
    expect(found.some((message) => message.includes('R1 requires j-hpa'))).toBe(true);
    expect(found.some((message) => message.includes('state-stress'))).toBe(true);
    expect(found.some((message) => message.includes('pair-adrenaline-cortisol'))).toBe(true);
    expect(found.some((message) => message.includes('24 checkpoint predictions'))).toBe(true);
    expect(found.some((message) => message.includes('6 transfer prompts'))).toBe(true);
  });

  it('names a signal that participates in no released relationship', () => {
    const orphan = releaseCandidate((bundle) => {
      bundle.signals.push({
        ...bundle.signals[1]!,
        id: 'sig-orphan',
        comparison: [],
      });
    });
    expect(messages(orphan)).toContain(
      'every signal must participate in a released relationship',
    );
  });

  it('names a journey with no entry point', () => {
    const unreachable = releaseCandidate((bundle) => {
      const journey = structuredClone(bundle.timelines[0]!);
      journey.id = 'j-unreachable';
      journey.kind = 'journey';
      journey.tracks = journey.tracks.map((track) => ({
        ...track,
        id: track.id.replace('exercise-synthetic-feedback', 'j-unreachable'),
      }));
      journey.timingBands = journey.timingBands.map((band) => ({
        ...band,
        id: band.id.replace('exercise-synthetic-feedback', 'j-unreachable'),
      }));
      journey.steps = journey.steps.map((step) => ({
        ...step,
        id: step.id.replace('exercise-synthetic-feedback', 'j-unreachable'),
        trackId: step.trackId.replace('exercise-synthetic-feedback', 'j-unreachable'),
        timingBandId: step.timingBandId.replace('exercise-synthetic-feedback', 'j-unreachable'),
      }));
      journey.events = journey.events.map((event) => ({
        ...event,
        id: event.id.replace('exercise-synthetic-feedback', 'j-unreachable'),
        trackId: event.trackId.replace('exercise-synthetic-feedback', 'j-unreachable'),
      }));
      journey.predictionIds = [];
      bundle.timelines.push(journey);
    });
    expect(messages(unreachable)).toContain(
      'every journey needs an entry from at least one signal or state',
    );
  });

  it('rejects a graph larger than the R1 record budget', () => {
    const huge = bundleWith((bundle) => {
      for (let index = 0; index < 10_001; index += 1) {
        bundle.contexts.push({ ...bundle.contexts[0]!, id: `ctx-filler-${index}` });
      }
    });
    expect(rules(huge)).toContain('VAL-017');
  });

  it('rejects a Why trail longer than the traversal budget', () => {
    const deep = bundleWith((bundle) => {
      const template = bundle.explanations[0]!;
      let previousId = 'why-fictional-alpha-root';
      for (let index = 0; index < MAX_WHY_TRAVERSAL + 5; index += 1) {
        const id = `why-filler-${index}`;
        bundle.explanations.push({ ...structuredClone(template), id, deeperIds: [] });
        const previous = bundle.explanations.find((item) => item.id === previousId)!;
        previous.deeperIds = [id];
        previousId = id;
      }
    });
    expect(
      validateBundle(deep, { mode: 'preview' }).some(
        (issue) => issue.rule === 'VAL-017' && issue.message.includes('Why traversal'),
      ),
    ).toBe(true);
  });
});

describe('manifest checks', () => {
  it('rejects a manifest that is not valid against its own schema', () => {
    const parsed = parseManifest({ schemaVersion: 2 });
    expect(parsed.manifest).toBeUndefined();
    expect(parsed.issues.length).toBeGreaterThan(0);
  });

  it('accepts a manifest that matches its bundle and rejects a retired-and-active id', () => {
    const bundle = bundleWith(() => undefined);
    const catalog = [
      ...bundle.signals.map((signal) => ({
        id: signal.id,
        kind: 'signal' as const,
        label: signal.label,
        aliases: [...signal.aliases],
      })),
      ...bundle.timelines.map((timeline) => ({
        id: timeline.id,
        kind: timeline.kind,
        label: timeline.label,
        aliases: [],
      })),
      ...bundle.anatomy.map((anatomy) => ({
        id: anatomy.id,
        kind: 'anatomy' as const,
        label: anatomy.label,
        aliases: [...anatomy.aliases],
      })),
      ...bundle.concepts.map((concept) => ({
        id: concept.id,
        kind: 'concept' as const,
        label: concept.label,
        aliases: [...concept.aliases],
      })),
    ];
    const manifest = {
      schemaVersion: 1 as const,
      contentVersion: bundle.contentVersion,
      bundlePath: 'content/bundle.json',
      bundleSha256: 'd'.repeat(64),
      scientificSha256: 'e'.repeat(64),
      buildId: 'test',
      catalog,
      retired: [],
    };
    expect(validateManifest(manifest, bundle, 'd'.repeat(64))).toEqual([]);

    const conflicted = {
      ...manifest,
      retired: [{ id: catalog[0]!.id, reason: 'withdrawn for review' }],
    };
    expect(
      validateManifest(conflicted, bundle, 'd'.repeat(64)).some((issue) =>
        issue.message.includes('both retired and active'),
      ),
    ).toBe(true);
  });

  it('rejects a catalog entry whose label drifted from the bundle', () => {
    const bundle = bundleWith(() => undefined);
    const manifest = {
      schemaVersion: 1 as const,
      contentVersion: bundle.contentVersion,
      bundlePath: 'content/bundle.json',
      bundleSha256: 'd'.repeat(64),
      scientificSha256: 'e'.repeat(64),
      buildId: 'test',
      catalog: [{ id: bundle.signals[0]!.id, kind: 'signal' as const, label: 'Renamed', aliases: [] }],
      retired: [],
    };
    const issues = validateManifest(manifest, bundle, 'd'.repeat(64));
    expect(issues.some((issue) => issue.message.includes('does not match its bundle record'))).toBe(
      true,
    );
    expect(issues.some((issue) => issue.message.includes('missing from the catalog'))).toBe(true);
  });

  it('rejects a content version mismatch and an unknown catalog entry', () => {
    const bundle = bundleWith(() => undefined);
    const manifest = {
      schemaVersion: 1 as const,
      contentVersion: '9.9.9',
      bundlePath: 'content/bundle.json',
      bundleSha256: 'd'.repeat(64),
      scientificSha256: 'e'.repeat(64),
      buildId: 'test',
      catalog: [{ id: 'sig-not-in-bundle', kind: 'signal' as const, label: 'Ghost', aliases: [] }],
      retired: [],
    };
    const found = validateManifest(manifest, bundle, 'd'.repeat(64)).map((issue) => issue.message);
    expect(found).toContain('manifest and bundle content versions differ');
    expect(found).toContain('sig-not-in-bundle is in the catalog but not in the bundle');
  });
});

describe('reporting and identifiers', () => {
  it('formats issues with rule, path, record and reason', () => {
    const text = formatIssues([
      { rule: 'VAL-004', path: '$.relationships.rel-x', message: 'needs causal support', recordId: 'rel-x' },
      { rule: 'VAL-016', path: '$.signals', message: 'missing item' },
    ]);
    expect(text).toContain('VAL-004');
    expect(text).toContain('(rel-x)');
    expect(text).toContain('needs causal support');
    expect(text).toContain('VAL-016');
  });

  it('recognises well-formed identifiers and timeline kinds', () => {
    expect(isValidId('sig-cortisol', 'signal')).toBe(true);
    expect(isValidId('sig_cortisol', 'signal')).toBe(false);
    expect(isValidId(`sig-${'a'.repeat(200)}`, 'signal')).toBe(false);
    expect(timelineKindForId('j-hpa')).toBe('journey');
    expect(timelineKindForId('state-stress')).toBe('state');
    expect(timelineKindForId('exercise-x')).toBe('exercise');
    expect(timelineKindForId('sig-cortisol')).toBeNull();
  });
});
