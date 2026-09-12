/**
 * Document 05: the normative TypeScript contract is authoritative for field names, and the
 * runtime schemas must not drift from it. This reads the specification file and compares each
 * interface's field names with the corresponding runtime schema shape.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'zod';
import * as schema from '../../src/content/schema.ts';

const CONTRACT = readFileSync(
  join(import.meta.dirname, '..', '..', 'documentation', 'contracts', 'content-contract.ts'),
  'utf8',
);

/** Extracts the top-level field names of one interface from the normative contract. */
function contractFields(name: string): string[] {
  const match = new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`).exec(CONTRACT);
  if (!match) throw new Error(`interface ${name} not found in the normative contract`);
  const fields: string[] = [];
  let depth = 0;
  for (const line of match[1]!.split('\n')) {
    const trimmed = line.trim();
    if (depth === 0) {
      const field = /^([A-Za-z0-9_]+)\??:/.exec(trimmed);
      if (field) fields.push(field[1]!);
    }
    depth += (line.match(/[{[(]/g) ?? []).length - (line.match(/[}\])]/g) ?? []).length;
  }
  return fields.sort();
}

function schemaFields(object: z.ZodObject): string[] {
  return Object.keys(object.shape).sort();
}

const PAIRS: Array<[string, z.ZodObject]> = [
  ['Context', schema.ContextSchema],
  ['Reference', schema.ReferenceSchema],
  ['Claim', schema.ClaimSchema],
  ['Anatomy', schema.AnatomySchema],
  ['ComparisonCell', schema.ComparisonCellSchema],
  ['Signal', schema.SignalSchema],
  ['Concept', schema.ConceptSchema],
  ['Relationship', schema.RelationshipSchema],
  ['Explanation', schema.ExplanationSchema],
  ['Objective', schema.ObjectiveSchema],
  ['TimingBand', schema.TimingBandSchema],
  ['Track', schema.TrackSchema],
  ['Step', schema.StepSchema],
  ['TimelineEvent', schema.TimelineEventSchema],
  ['PredictionOption', schema.PredictionOptionSchema],
  ['Prediction', schema.PredictionSchema],
  ['Timeline', schema.TimelineSchema],
  ['CuratedComparison', schema.CuratedComparisonSchema],
  ['Anchor', schema.AnchorSchema],
  ['Route', schema.RouteSchema],
  ['Asset', schema.AssetSchema],
  ['Review', schema.ReviewSchema],
  ['ContentBundle', schema.ContentBundleSchema],
  ['ContentManifest', schema.ContentManifestSchema],
];

describe('runtime schemas match the normative contract', () => {
  it.each(PAIRS)('%s has exactly the contract fields', (name, object) => {
    expect(schemaFields(object)).toEqual(contractFields(name));
  });

  it('uses the contract vocabulary for the enumerations the renderers depend on', () => {
    expect(schema.trendValues).toEqual([
      'baseline',
      'increasing',
      'decreasing',
      'sustained',
      'variable',
      'not-shown',
    ]);
    expect(schema.highlightValues).toEqual(['none', 'source', 'target', 'active']);
    expect(schema.comparisonDimensions).toHaveLength(8);
  });

  it('rejects unknown fields rather than stripping them', () => {
    const result = schema.ObjectiveSchema.safeParse({
      id: 'obj-x',
      statement: 'A statement.',
      pattern: 'sequence',
      prerequisiteConceptIds: [],
      extra: 1,
    });
    expect(result.success).toBe(false);
  });
});
