/**
 * The exposure reverse index.
 *
 * Document 05: every prediction lists the timelines, relationships and explanations that give
 * its answer away, and the compiler's job is to turn those lists around: which families become
 * exposed when a learner inspects a piece of source material. A question's own timeline is not
 * an exposure source unless it is listed explicitly.
 */
import type { ContentBundle } from './schema.ts';

export type ExposureSourceKind = 'timeline' | 'relationship' | 'explanation';

export interface ExposureIndex {
  familiesFor(kind: ExposureSourceKind, id: string): string[];
}

export function createExposureIndex(bundle: ContentBundle): ExposureIndex {
  const bySource = new Map<string, Set<string>>();
  const keyOf = (kind: ExposureSourceKind, id: string): string => `${kind}:${id}`;

  const add = (kind: ExposureSourceKind, id: string, familyId: string): void => {
    const key = keyOf(kind, id);
    const families = bySource.get(key) ?? new Set<string>();
    families.add(familyId);
    bySource.set(key, families);
  };

  for (const prediction of bundle.predictions) {
    for (const timelineId of prediction.exposureTimelineIds) {
      add('timeline', timelineId, prediction.familyId);
    }
    for (const relationshipId of prediction.exposureRelationshipIds) {
      add('relationship', relationshipId, prediction.familyId);
    }
    for (const explanationId of prediction.exposureExplanationIds) {
      add('explanation', explanationId, prediction.familyId);
    }
  }

  return {
    familiesFor(kind, id) {
      return [...(bySource.get(keyOf(kind, id)) ?? [])].sort();
    },
  };
}
