/**
 * Quality bar B3: every invariant in the document 05 table has at least one invalid case that
 * fails with its own stable code. The final test asserts that the whole rule set is covered, so
 * adding a rule without a matching fixture fails the suite.
 */
import { describe, expect, it } from 'vitest';
import {
  VALIDATION_RULES,
  parseBundle,
  validateBundle,
  validateManifest,
  type ValidationRule,
} from '../../src/content/validate.ts';
import { serialiseBundle, sha256Hex, sortBundleRecords } from '../../src/content/hash.ts';
import { bundleWith, timelineOf, validBundle } from '../fixtures/bundle.ts';
import type { ContentBundle, ContentManifest } from '../../src/content/schema.ts';

const exercised = new Set<ValidationRule>();

/** Asserts that a mutation produces the expected rule failure, and records the coverage. */
function expectRule(rule: ValidationRule, bundle: ContentBundle, mode: 'preview' | 'production' = 'preview'): void {
  const issues = validateBundle(bundle, { mode, now: new Date('2026-09-12T00:00:00Z') });
  expect(
    issues.map((issue) => `${issue.rule} ${issue.path} ${issue.message}`).join('\n'),
  ).toContain(rule);
  exercised.add(rule);
}

/** Schema-level rules are reported by the parser rather than the semantic validator. */
function expectSchemaRule(rule: ValidationRule, mutate: (bundle: ContentBundle) => void): void {
  const raw = bundleWith(mutate) as unknown as Record<string, unknown>;
  const parsed = parseBundle(raw);
  expect(parsed.bundle).toBeUndefined();
  expect(parsed.issues.map((issue) => issue.rule)).toContain(rule);
  exercised.add(rule);
}

describe('content validation rules', () => {
  it('accepts the fictional development bundle in preview mode', () => {
    expect(validateBundle(validBundle(), { mode: 'preview' })).toEqual([]);
  });

  it('VAL-001 rejects a duplicate identifier', () => {
    expectRule(
      'VAL-001',
      bundleWith((bundle) => {
        bundle.claims.push({ ...bundle.claims[0]! });
      }),
    );
  });

  it('VAL-001 rejects a reference to the wrong entity kind', () => {
    expectRule(
      'VAL-001',
      bundleWith((bundle) => {
        bundle.relationships[0]!.source = { kind: 'signal', id: 'anat-fictional-source' };
      }),
    );
  });

  it('VAL-002 rejects a blank depth variant', () => {
    expectRule(
      'VAL-002',
      bundleWith((bundle) => {
        bundle.signals[0]!.description.mechanism = '   ';
      }),
    );
  });

  it('VAL-002 rejects markup in published text', () => {
    expectSchemaRule('VAL-002', (bundle) => {
      bundle.signals[0]!.description.intro = 'An <em>invented</em> signal.';
    });
  });

  it('VAL-003 rejects a published comparison value with no claim support', () => {
    expectRule(
      'VAL-003',
      bundleWith((bundle) => {
        bundle.signals[0]!.comparison[0]!.claimIds = [];
      }),
    );
  });

  it('VAL-004 rejects a causal edge without causal support', () => {
    expectRule(
      'VAL-004',
      bundleWith((bundle) => {
        const claim = bundle.claims.find((item) => item.id === 'claim-fictional-alpha-release')!;
        claim.relationKind = 'associative';
        const second = bundle.claims.find((item) => item.id === 'claim-fictional-beta-response')!;
        second.relationKind = 'associative';
      }),
    );
  });

  it('VAL-004 rejects a causal edge supported only by an unresolved claim', () => {
    expectRule(
      'VAL-004',
      bundleWith((bundle) => {
        for (const id of ['claim-fictional-alpha-release', 'claim-fictional-beta-response']) {
          bundle.claims.find((item) => item.id === id)!.support = 'unresolved';
        }
      }),
    );
  });

  it('VAL-005 rejects an inhibitory effect on a non-causal edge', () => {
    expectRule(
      'VAL-005',
      bundleWith((bundle) => {
        const edge = bundle.relationships.find((item) => item.id === 'rel-peripheral-loop-association')!;
        edge.effect = 'inhibits';
      }),
    );
  });

  it('VAL-005 rejects a feedback flag on an associative edge', () => {
    expectRule(
      'VAL-005',
      bundleWith((bundle) => {
        bundle.relationships.find((item) => item.id === 'rel-peripheral-loop-association')!.feedback = true;
      }),
    );
  });

  it('VAL-006 rejects a cycle in the explanation graph', () => {
    expectRule(
      'VAL-006',
      bundleWith((bundle) => {
        const terminal = bundle.explanations.find((item) => item.id === 'why-fictional-alpha-transport')!;
        terminal.deeperIds = ['why-fictional-alpha-root'];
      }),
    );
  });

  it('VAL-007 rejects a step beyond the timeline duration', () => {
    expectRule(
      'VAL-007',
      bundleWith((bundle) => {
        timelineOf(bundle).steps[0]!.atMs = 99_000;
      }),
    );
  });

  it('VAL-007 rejects a reveal that does not follow its question', () => {
    expectRule(
      'VAL-007',
      bundleWith((bundle) => {
        const prediction = bundle.predictions.find((item) => item.id === 'pred-fictional-next')!;
        prediction.revealAtMs = prediction.atMs;
      }),
    );
  });

  it('VAL-008 rejects two commands writing one property at one timestamp', () => {
    expectRule(
      'VAL-008',
      bundleWith((bundle) => {
        const timeline = timelineOf(bundle);
        const source = timeline.events[1]!;
        timeline.events.push({ ...source, id: `${timeline.id}-e99`, order: 99 });
      }),
    );
  });

  it('VAL-008 rejects a duplicate event order', () => {
    expectRule(
      'VAL-008',
      bundleWith((bundle) => {
        const timeline = timelineOf(bundle);
        timeline.events[2]!.order = timeline.events[1]!.order;
      }),
    );
  });

  it('VAL-009 rejects a track with no step at zero', () => {
    expectRule(
      'VAL-009',
      bundleWith((bundle) => {
        const timeline = timelineOf(bundle);
        const step = timeline.steps.find((item) => item.atMs === 0)!;
        step.atMs = 500;
      }),
    );
  });

  it('VAL-009 rejects two steps on one track at one timestamp', () => {
    expectRule(
      'VAL-009',
      bundleWith((bundle) => {
        const timeline = timelineOf(bundle);
        const step = timeline.steps[2]!;
        timeline.steps.push({ ...step, id: `${timeline.id}-step-duplicate` });
      }),
    );
  });

  it('VAL-010 rejects a claim with no context in common with its lesson', () => {
    expectRule(
      'VAL-010',
      bundleWith((bundle) => {
        bundle.claims.find((item) => item.id === 'claim-fictional-alpha-release')!.contextIds = [
          'ctx-fictional-baseline',
        ];
        timelineOf(bundle).contextIds = ['ctx-fictional-episode'];
      }),
    );
  });

  it('VAL-011 rejects an anchor from another view', () => {
    expectRule(
      'VAL-011',
      bundleWith((bundle) => {
        bundle.anchors.find((item) => item.id === 'anchor-fictional-source')!.view = 'brain';
      }),
    );
  });

  it('VAL-012 rejects a correct option that is not one of the options', () => {
    expectRule(
      'VAL-012',
      bundleWith((bundle) => {
        bundle.predictions[0]!.correctOptionId = 'pred-fictional-next-missing';
      }),
    );
  });

  it('VAL-013 rejects a revealing step placed before its reveal boundary', () => {
    expectRule(
      'VAL-013',
      bundleWith((bundle) => {
        const prediction = bundle.predictions.find((item) => item.id === 'pred-fictional-next')!;
        prediction.revealsStepIds = ['exercise-synthetic-feedback-step-intermediary'];
      }),
    );
  });

  it('VAL-014 rejects an incomplete comparison row set', () => {
    expectRule(
      'VAL-014',
      bundleWith((bundle) => {
        bundle.signals[0]!.comparison.pop();
      }),
    );
  });

  it('VAL-015 blocks publication of fixture content', () => {
    expectRule('VAL-015', validBundle(), 'production');
  });

  it('VAL-015 blocks publication of a draft claim even when the bundle is not a fixture', () => {
    const issues = validateBundle(
      bundleWith((bundle) => {
        bundle.fixture = false;
      }),
      { mode: 'production' },
    );
    expect(issues.some((issue) => issue.rule === 'VAL-015' && issue.message.includes('draft'))).toBe(
      true,
    );
  });

  it('VAL-016 requires the R1 inventory in a production build', () => {
    expectRule('VAL-016', validBundle(), 'production');
  });

  it('VAL-017 rejects text beyond the length limit', () => {
    expectSchemaRule('VAL-017', (bundle) => {
      bundle.signals[0]!.description.intro = 'a'.repeat(10_001);
    });
  });

  it('VAL-018 rejects a non-HTTPS citation link', () => {
    expectSchemaRule('VAL-018', (bundle) => {
      bundle.references.push({
        id: 'ref-insecure',
        title: 'Fictional note',
        authors: ['Fixture'],
        year: 2026,
        kind: 'other',
        url: 'http://example.invalid/x',
        checkedOn: '2026-01-01',
      });
    });
  });

  it('VAL-018 rejects an asset path that escapes the origin', () => {
    expectSchemaRule('VAL-018', (bundle) => {
      bundle.assets.push({
        id: 'asset-traversal',
        path: '../secrets.glb',
        sha256: 'a'.repeat(64),
        bytes: 10,
        kind: 'body-model',
        source: 'project-authored',
        license: 'CC0-1.0',
        attribution: '',
        modified: false,
      });
    });
  });

  it('VAL-019 rejects a cycle in the anatomy parent graph', () => {
    expectRule(
      'VAL-019',
      bundleWith((bundle) => {
        bundle.anatomy.find((item) => item.id === 'anat-fictional-source')!.parentId =
          'anat-fictional-intermediary';
      }),
    );
  });

  it('VAL-019 rejects left and right structures sharing one pickable anchor', () => {
    expectRule(
      'VAL-019',
      bundleWith((bundle) => {
        const source = bundle.anatomy.find((item) => item.id === 'anat-fictional-source')!;
        source.laterality = 'left';
        const intermediary = bundle.anatomy.find((item) => item.id === 'anat-fictional-intermediary')!;
        intermediary.laterality = 'right';
        intermediary.anchorId = source.anchorId;
      }),
    );
  });

  it('VAL-020 rejects a manifest that does not match the bundle', async () => {
    const bundle = sortBundleRecords(validBundle());
    const sha = await sha256Hex(serialiseBundle(bundle));
    const manifest: ContentManifest = {
      schemaVersion: 1,
      contentVersion: bundle.contentVersion,
      bundlePath: 'content/bundle.json',
      bundleSha256: sha,
      scientificSha256: sha,
      buildId: 'test',
      catalog: [],
      retired: [],
    };
    const issues = validateManifest(manifest, bundle, sha);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]!.rule).toBe('VAL-020');
    exercised.add('VAL-020');
  });

  it('VAL-020 rejects a delivered bundle whose bytes do not match the manifest hash', async () => {
    const bundle = sortBundleRecords(validBundle());
    const sha = await sha256Hex(serialiseBundle(bundle));
    const manifest: ContentManifest = {
      schemaVersion: 1,
      contentVersion: bundle.contentVersion,
      bundlePath: 'content/bundle.json',
      bundleSha256: 'b'.repeat(64),
      scientificSha256: sha,
      buildId: 'test',
      catalog: [],
      retired: [],
    };
    expect(
      validateManifest(manifest, bundle, sha).some((issue) =>
        issue.message.includes('delivered bundle bytes'),
      ),
    ).toBe(true);
  });

  it('VAL-SCHEMA rejects an unknown field', () => {
    expectSchemaRule('VAL-SCHEMA', (bundle) => {
      (bundle.signals[0] as unknown as Record<string, unknown>)['unexpected'] = true;
    });
  });

  it('covers every declared validation rule', () => {
    const missing = VALIDATION_RULES.filter((rule) => !exercised.has(rule));
    expect(missing).toEqual([]);
  });
});
