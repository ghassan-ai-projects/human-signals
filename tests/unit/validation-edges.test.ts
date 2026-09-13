/**
 * The remaining invariant branches: structural mistakes an author can plausibly make that the
 * earlier suites do not reach. Each one asserts the rule code a build would report.
 */
import { describe, expect, it } from 'vitest';
import { parseBundle, validateBundle, type ValidationRule } from '../../src/content/validate.ts';
import { validateAssetProvenance } from '../../src/content/assets.ts';
import { canonicalJson } from '../../src/content/hash.ts';
import { AssetSchema } from '../../src/content/schema.ts';
import { bundleWith, timelineOf } from '../fixtures/bundle.ts';
import type { ContentBundle } from '../../src/content/schema.ts';

function rulesFor(mutate: (bundle: ContentBundle) => void, mode: 'preview' | 'production' = 'preview') {
  return validateBundle(bundleWith(mutate), { mode, now: new Date('2026-09-12T00:00:00Z') });
}

function expectRule(rule: ValidationRule, mutate: (bundle: ContentBundle) => void): void {
  expect(rulesFor(mutate).map((issue) => issue.rule)).toContain(rule);
}

describe('timeline structure', () => {
  it('VAL-009 rejects two tracks claiming the same order', () => {
    expectRule('VAL-009', (bundle) => {
      timelineOf(bundle).tracks[1]!.order = timelineOf(bundle).tracks[0]!.order;
    });
  });

  it('VAL-008 rejects a step whose timing band does not exist', () => {
    expectRule('VAL-008', (bundle) => {
      timelineOf(bundle).steps[0]!.timingBandId = 'exercise-synthetic-feedback-band-missing';
    });
  });

  it('VAL-008 rejects a step or event on a track the timeline does not define', () => {
    expectRule('VAL-008', (bundle) => {
      timelineOf(bundle).steps[0]!.trackId = 'exercise-synthetic-feedback-track-missing';
    });
    expectRule('VAL-008', (bundle) => {
      timelineOf(bundle).events[0]!.trackId = 'exercise-synthetic-feedback-track-missing';
    });
  });

  it('VAL-007 rejects an event beyond the timeline duration', () => {
    expectRule('VAL-007', (bundle) => {
      timelineOf(bundle).events[0]!.atMs = timelineOf(bundle).durationMs + 1;
    });
  });

  it('VAL-003 rejects a step with neither claim nor relationship support', () => {
    expectRule('VAL-003', (bundle) => {
      const step = timelineOf(bundle).steps[0]!;
      step.claimIds = [];
      step.relationIds = [];
    });
  });

  it('VAL-003 rejects a biological timing label with no claim behind it', () => {
    expectRule('VAL-003', (bundle) => {
      timelineOf(bundle).timingBands[0]!.claimIds = [];
    });
  });
});

describe('checkpoint placement', () => {
  it('VAL-007 rejects a reveal past the end of the lesson', () => {
    expectRule('VAL-007', (bundle) => {
      bundle.predictions[1]!.revealAtMs = timelineOf(bundle).durationMs + 500;
    });
  });

  it('VAL-013 rejects two checkpoints at one timestamp', () => {
    expectRule('VAL-013', (bundle) => {
      bundle.predictions[1]!.atMs = bundle.predictions[0]!.atMs;
      bundle.predictions[1]!.revealAtMs = bundle.predictions[0]!.revealAtMs + 1;
    });
  });

  it('VAL-013 rejects a reveal that runs past the next checkpoint', () => {
    expectRule('VAL-013', (bundle) => {
      bundle.predictions[0]!.revealAtMs = bundle.predictions[1]!.atMs + 100;
    });
  });

  it('VAL-013 rejects a revealing step that does not exist', () => {
    expectRule('VAL-013', (bundle) => {
      bundle.predictions[0]!.revealsStepIds = ['exercise-synthetic-feedback-step-nowhere'];
    });
  });

  it('VAL-012 rejects a prediction that targets a timeline without being listed on it', () => {
    expectRule('VAL-012', (bundle) => {
      timelineOf(bundle).predictionIds = [bundle.predictions[0]!.id];
    });
  });
});

describe('assessment contracts', () => {
  it('VAL-012 rejects duplicate option identifiers', () => {
    expectRule('VAL-012', (bundle) => {
      const prediction = bundle.predictions[0]!;
      prediction.options[1] = { ...prediction.options[0]! };
    });
  });

  it('VAL-012 rejects two options that say the same thing', () => {
    expectRule('VAL-012', (bundle) => {
      const prediction = bundle.predictions[0]!;
      prediction.options[1]!.text = { ...prediction.options[0]!.text };
    });
  });

  it('VAL-012 rejects an answer family with more than two matched forms', () => {
    expectRule('VAL-012', (bundle) => {
      for (const prediction of bundle.predictions) prediction.familyId = 'family-shared';
      bundle.predictions.push({
        ...structuredClone(bundle.predictions[0]!),
        id: 'pred-fictional-third',
        familyId: 'family-shared',
      });
    });
  });
});

describe('relationship vocabulary', () => {
  it('VAL-005 rejects associated-with on a causal edge', () => {
    expectRule('VAL-005', (bundle) => {
      bundle.relationships[0]!.effect = 'associated-with';
    });
  });

  it('VAL-005 rejects describes on a causal edge', () => {
    expectRule('VAL-005', (bundle) => {
      bundle.relationships[0]!.effect = 'describes';
    });
  });
});

describe('comparison and anatomy', () => {
  it('VAL-014 rejects a duplicated comparison dimension', () => {
    expectRule('VAL-014', (bundle) => {
      const signal = bundle.signals[0]!;
      signal.comparison[1] = { ...signal.comparison[0]! };
    });
  });

  it('VAL-014 rejects a curated pair that names one signal twice', () => {
    expectRule('VAL-014', (bundle) => {
      bundle.comparisons.push({
        id: 'pair-self',
        signalIds: ['sig-alpha', 'sig-alpha'],
        title: 'Alpha against itself',
        explanation: { intro: 'a', standard: 'a', mechanism: 'a' },
        claimIds: ['claim-fictional-overview'],
      });
    });
  });

  it('VAL-019 rejects an anatomy graph with no root region', () => {
    expectRule('VAL-019', (bundle) => {
      for (const record of bundle.anatomy) record.parentId = 'anat-fictional-source';
    });
  });

  it('VAL-011 rejects a route drawn in a view its anchors do not belong to', () => {
    expectRule('VAL-011', (bundle) => {
      bundle.routes[0]!.view = 'brain';
    });
  });
});

describe('bounds and paths', () => {
  it('VAL-017 rejects an over-long identifier, label or text once parsed', () => {
    const withLongId = bundleWith((bundle) => {
      bundle.concepts[0]!.id = `concept-${'x'.repeat(200)}`;
    });
    expect(validateBundle(withLongId, { mode: 'preview' }).map((issue) => issue.rule)).toContain(
      'VAL-017',
    );
    const withLongLabel = bundleWith((bundle) => {
      bundle.concepts[0]!.label = 'y'.repeat(200);
    });
    expect(validateBundle(withLongLabel, { mode: 'preview' }).map((issue) => issue.rule)).toContain(
      'VAL-017',
    );
    const withLongText = bundleWith((bundle) => {
      bundle.concepts[0]!.definition.intro = 'z'.repeat(10_001);
    });
    expect(validateBundle(withLongText, { mode: 'preview' }).map((issue) => issue.rule)).toContain(
      'VAL-017',
    );
  });

  it('VAL-018 rejects every shape of unsafe asset path', () => {
    for (const path of ['/models/body.glb', '//evil.example/body.glb', 'https://evil.example/body.glb']) {
      expect(
        AssetSchema.safeParse({
          id: 'asset-body',
          path,
          sha256: 'a'.repeat(64),
          bytes: 1,
          kind: 'body-model',
          source: 'project-authored',
          sourceRevision: 'fixture',
          license: 'CC0-1.0',
          licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
          attribution: 'Fixture asset; no third-party attribution required.',
          modified: false,
          modificationNote: 'Synthetic test metadata.',
        }).success,
      ).toBe(false);
    }
  });

  it('VAL-018 rejects an unsafe asset path or citation link that reaches the validator', () => {
    const bundle = bundleWith((b) => {
      b.assets.push({
        id: 'asset-unsafe',
        path: 'ok.glb',
        sha256: 'a'.repeat(64),
        bytes: 1,
        kind: 'body-model',
        source: 'project-authored',
        sourceRevision: 'fixture',
        license: 'CC0-1.0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        attribution: 'Fixture asset; no third-party attribution required.',
        modified: false,
        modificationNote: 'Synthetic test metadata.',
      });
      b.references.push({
        id: 'ref-unsafe',
        title: 'Fixture entry',
        authors: ['Fixture'],
        year: 2026,
        kind: 'other',
        url: 'https://example.invalid/x',
        checkedOn: '2026-01-01',
      });
    });
    // Values that the schema would have rejected are forced past it to prove the semantic check.
    bundle.assets[0]!.path = '/models/body.glb';
    bundle.references[0]!.url = 'http://example.invalid/x';
    const rules = validateBundle(bundle, { mode: 'preview' }).map((issue) => issue.rule);
    expect(rules.filter((rule) => rule === 'VAL-018')).toHaveLength(2);
  });
});

describe('asset provenance', () => {
  it('accepts the pinned preview asset and its canonical licence URL', () => {
    expect(validateAssetProvenance(bundleWith(() => undefined).assets[0]!, 'preview')).toEqual([]);
  });

  it('VAL-018 rejects an unsupported licence or non-canonical licence URL', () => {
    const unsupported = bundleWith((bundle) => {
      bundle.assets[0]!.license = 'Custom-1.0';
    });
    expect(validateBundle(unsupported, { mode: 'preview' }).some((issue) =>
      issue.message.includes('unsupported licence identifier'),
    )).toBe(true);

    const nonCanonical = bundleWith((bundle) => {
      bundle.assets[0]!.licenseUrl = 'https://github.com/makehumancommunity/makehuman/blob/main/LICENSE.md';
    });
    expect(validateBundle(nonCanonical, { mode: 'preview' }).some((issue) =>
      issue.message.includes('canonical URL'),
    )).toBe(true);
  });

  it('VAL-018 rejects floating and unverifiable source provenance', () => {
    const bundle = bundleWith((candidate) => {
      candidate.assets[0]!.sourceRevision = 'main';
      candidate.assets[0]!.source = 'https://example.com/body/base.obj';
    });
    const messages = validateBundle(bundle, { mode: 'preview' }).map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining([
      expect.stringContaining('40-character immutable revision'),
      expect.stringContaining('source URL must include sourceRevision'),
    ]));
  });

  it('VAL-018 rejects fixture provenance in production', () => {
    const bundle = bundleWith((candidate) => {
      candidate.assets[0]!.sourceRevision = 'fixture';
      candidate.assets[0]!.source = 'project-authored preview fixture';
    });
    expect(validateBundle(bundle, { mode: 'production' }).some((issue) =>
      issue.message.includes('fixture source revision in production'),
    )).toBe(true);
  });
});

describe('anchor asset mappings', () => {
  it('VAL-011 keeps schematic placeholders independent of model meshes', () => {
    const bundle = bundleWith((candidate) => {
      candidate.anchors[0]!.representation = 'anatomical-region';
    });
    const messages = validateBundle(bundle, { mode: 'preview' }).map((issue) => issue.message);
    expect(messages).toContain('anatomical-region anchors require an assetId');
  });

  it('VAL-011 accepts a verified body mesh binding', () => {
    const bundle = bundleWith((candidate) => {
      const anchor = candidate.anchors[0]!;
      anchor.assetId = candidate.assets[0]!.id;
      anchor.meshNames = ['makehuman-base-body'];
      anchor.representation = 'anatomical-region';
    });
    expect(
      validateBundle(bundle, {
        mode: 'preview',
        assetMeshNames: new Map([[bundle.assets[0]!.id, new Set(['makehuman-base-body'])]]),
      }).filter((issue) => issue.recordId === bundle.anchors[0]!.id),
    ).toEqual([]);
  });

  it('VAL-011 rejects the wrong model view and an unknown verified mesh', () => {
    const bundle = bundleWith((candidate) => {
      const anchor = candidate.anchors[0]!;
      anchor.assetId = candidate.assets[0]!.id;
      anchor.meshNames = ['not-in-the-glb'];
      anchor.representation = 'anatomical-region';
      anchor.view = 'brain';
    });
    const messages = validateBundle(bundle, {
      mode: 'preview',
      assetMeshNames: new Map([[bundle.assets[0]!.id, new Set(['makehuman-base-body'])]]),
    }).map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining([
      'brain anchors must use a brain-model asset',
      'mesh not-in-the-glb is not present in asset asset-makehuman-preview-body',
    ]));
  });
});

describe('schema failure classification', () => {
  it('maps a malformed identifier to VAL-001 and an unknown group member to VAL-SCHEMA', () => {
    const badId = parseBundle({
      ...bundleWith(() => undefined),
      concepts: [{ ...bundleWith(() => undefined).concepts[0]!, id: 'NOT_AN_ID' }],
    });
    expect(badId.issues.map((issue) => issue.rule)).toContain('VAL-001');

    const wrongType = parseBundle({ ...bundleWith(() => undefined), concepts: 'not-an-array' });
    expect(wrongType.issues.map((issue) => issue.rule)).toContain('VAL-SCHEMA');
  });
});

describe('canonical serialisation guards', () => {
  it('refuses a value that cannot appear in content JSON', () => {
    expect(() => canonicalJson({ a: () => undefined })).toThrow(/canonicalise/);
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson(true)).toBe('true');
  });
});
