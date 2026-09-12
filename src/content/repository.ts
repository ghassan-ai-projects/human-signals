/**
 * Indexed queries over a validated bundle.
 *
 * Document 08: these are Maps over data already in memory, not network calls, and there is no
 * abstract repository hierarchy with unused server adapters. Search is deterministic and local
 * (document 02): no remote query, diacritics folded for matching, displayed spelling preserved.
 */
import type {
  Anatomy,
  Claim,
  Concept,
  ContentBundle,
  ContentManifest,
  CuratedComparison,
  Explanation,
  Objective,
  Prediction,
  Reference,
  Relationship,
  Route,
  Signal,
  Timeline,
  Context as ContentContext,
  Anchor,
} from './schema.ts';

export type SearchKind = 'signal' | 'journey' | 'state' | 'exercise' | 'anatomy' | 'concept';

export interface SearchResult {
  id: string;
  kind: SearchKind;
  label: string;
  /** Which text matched, so the result list can explain an alias hit. */
  matched: string;
  rank: number;
}

export interface ContentRepository {
  readonly bundle: ContentBundle;
  readonly manifest: ContentManifest;
  getSignal(id: string): Signal | undefined;
  getAnatomy(id: string): Anatomy | undefined;
  getConcept(id: string): Concept | undefined;
  getTimeline(id: string): Timeline | undefined;
  getRelationship(id: string): Relationship | undefined;
  getExplanation(id: string): Explanation | undefined;
  getClaim(id: string): Claim | undefined;
  getReference(id: string): Reference | undefined;
  getContext(id: string): ContentContext | undefined;
  getObjective(id: string): Objective | undefined;
  getPrediction(id: string): Prediction | undefined;
  getAnchor(id: string): Anchor | undefined;
  getRoute(id: string): Route | undefined;
  getCuratedComparison(a: string, b: string): CuratedComparison | undefined;
  /** Every prediction authored against one timeline, in checkpoint order. */
  predictionsFor(timelineId: string): Prediction[];
  /** Relationships whose source or target is this entity, in authored order. */
  relationshipsFor(entityId: string): Relationship[];
  /** Timelines that step through a relationship involving this entity. */
  timelinesFor(entityId: string): Timeline[];
  /** Child regions of an anatomy record, for the keyboard tree. */
  childrenOf(anatomyId: string | undefined): Anatomy[];
  search(query: string, limit?: number): SearchResult[];
  labelOf(id: string): string | undefined;
}

/** Folds diacritics and case for matching only; the stored spelling is what gets displayed. */
export function foldForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .trim();
}

interface IndexEntry {
  id: string;
  kind: SearchKind;
  label: string;
  terms: Array<{ text: string; folded: string; isName: boolean }>;
}

const KIND_ORDER: SearchKind[] = ['signal', 'journey', 'state', 'anatomy', 'concept', 'exercise'];

export function createRepository(bundle: ContentBundle, manifest: ContentManifest): ContentRepository {
  const signals = new Map(bundle.signals.map((record) => [record.id, record]));
  const anatomy = new Map(bundle.anatomy.map((record) => [record.id, record]));
  const concepts = new Map(bundle.concepts.map((record) => [record.id, record]));
  const timelines = new Map(bundle.timelines.map((record) => [record.id, record]));
  const relationships = new Map(bundle.relationships.map((record) => [record.id, record]));
  const explanations = new Map(bundle.explanations.map((record) => [record.id, record]));
  const claims = new Map(bundle.claims.map((record) => [record.id, record]));
  const references = new Map(bundle.references.map((record) => [record.id, record]));
  const contexts = new Map(bundle.contexts.map((record) => [record.id, record]));
  const objectives = new Map(bundle.objectives.map((record) => [record.id, record]));
  const predictions = new Map(bundle.predictions.map((record) => [record.id, record]));
  const anchors = new Map(bundle.anchors.map((record) => [record.id, record]));
  const routes = new Map(bundle.routes.map((record) => [record.id, record]));

  const index: IndexEntry[] = [
    ...bundle.signals.map((record) => toEntry(record.id, 'signal', record.label, record.aliases)),
    ...bundle.anatomy.map((record) => toEntry(record.id, 'anatomy', record.label, record.aliases)),
    ...bundle.concepts.map((record) => toEntry(record.id, 'concept', record.label, record.aliases)),
    ...bundle.timelines.map((record) => toEntry(record.id, record.kind, record.label, [])),
  ];

  function toEntry(id: string, kind: SearchKind, label: string, aliases: string[]): IndexEntry {
    return {
      id,
      kind,
      label,
      terms: [
        { text: label, folded: foldForSearch(label), isName: true },
        ...aliases.map((alias) => ({ text: alias, folded: foldForSearch(alias), isName: false })),
      ],
    };
  }

  const relationshipsByEntity = new Map<string, Relationship[]>();
  for (const relationship of bundle.relationships) {
    for (const endpoint of [relationship.source.id, relationship.target.id]) {
      relationshipsByEntity.set(endpoint, [
        ...(relationshipsByEntity.get(endpoint) ?? []),
        relationship,
      ]);
    }
  }

  const childrenByParent = new Map<string | undefined, Anatomy[]>();
  for (const record of bundle.anatomy) {
    const key = record.parentId;
    childrenByParent.set(key, [...(childrenByParent.get(key) ?? []), record]);
  }

  return {
    bundle,
    manifest,
    getSignal: (id) => signals.get(id),
    getAnatomy: (id) => anatomy.get(id),
    getConcept: (id) => concepts.get(id),
    getTimeline: (id) => timelines.get(id),
    getRelationship: (id) => relationships.get(id),
    getExplanation: (id) => explanations.get(id),
    getClaim: (id) => claims.get(id),
    getReference: (id) => references.get(id),
    getContext: (id) => contexts.get(id),
    getObjective: (id) => objectives.get(id),
    getPrediction: (id) => predictions.get(id),
    getAnchor: (id) => anchors.get(id),
    getRoute: (id) => routes.get(id),

    getCuratedComparison(a, b) {
      return bundle.comparisons.find(
        (pair) =>
          (pair.signalIds[0] === a && pair.signalIds[1] === b) ||
          (pair.signalIds[0] === b && pair.signalIds[1] === a),
      );
    },

    predictionsFor(timelineId) {
      return bundle.predictions
        .filter((prediction) => prediction.timelineId === timelineId)
        .sort((a, b) => a.atMs - b.atMs);
    },

    relationshipsFor(entityId) {
      return relationshipsByEntity.get(entityId) ?? [];
    },

    timelinesFor(entityId) {
      const related = new Set((relationshipsByEntity.get(entityId) ?? []).map((item) => item.id));
      const signal = signals.get(entityId);
      const direct = new Set(signal?.journeyIds ?? []);
      return bundle.timelines.filter(
        (timeline) =>
          direct.has(timeline.id) ||
          timeline.steps.some((step) => step.relationIds.some((id) => related.has(id))),
      );
    },

    childrenOf(anatomyId) {
      return childrenByParent.get(anatomyId) ?? [];
    },

    labelOf(id) {
      return (
        signals.get(id)?.label ??
        anatomy.get(id)?.label ??
        concepts.get(id)?.label ??
        timelines.get(id)?.label
      );
    },

    /**
     * Ranking: exact name, then exact alias, then name prefix, then alias prefix, then a token
     * match anywhere. Ties break by kind order and then alphabetically, so results are stable.
     */
    search(query, limit = 20) {
      const folded = foldForSearch(query);
      if (folded.length === 0) return [];
      const results: SearchResult[] = [];
      for (const entry of index) {
        let best: { rank: number; matched: string } | undefined;
        for (const term of entry.terms) {
          let rank: number | undefined;
          if (term.folded === folded) rank = term.isName ? 0 : 1;
          else if (term.folded.startsWith(folded)) rank = term.isName ? 2 : 3;
          else if (term.folded.split(/[\s-]+/).some((token) => token.startsWith(folded))) rank = 4;
          else if (term.folded.includes(folded)) rank = 5;
          if (rank !== undefined && (best === undefined || rank < best.rank)) {
            best = { rank, matched: term.text };
          }
        }
        if (best) results.push({ id: entry.id, kind: entry.kind, label: entry.label, ...best });
      }
      return results
        .sort(
          (a, b) =>
            a.rank - b.rank ||
            KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
            a.label.localeCompare(b.label),
        )
        .slice(0, limit);
    },
  };
}
