/**
 * Canonical serialisation and hashing.
 *
 * Document 04 defines the scientific fingerprint: keys are recursively sorted, array order is
 * preserved, the encoding is UTF-8 JSON with no insignificant whitespace, and the review ledger
 * and build timestamps are excluded. Document 05 additionally requires the delivered bundle
 * bytes to be hashed, so the two hashes are computed separately and mean different things.
 */
import type { ContentBundle } from './schema.ts';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Recursively sorts object keys; array order is meaningful and preserved. */
export function canonicalise(value: unknown): Json {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(canonicalise);
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, Json> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      // An absent optional field and an explicit undefined must hash identically.
      if (entry === undefined) continue;
      out[key] = canonicalise(entry);
    }
    return out;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error('Cannot canonicalise a non-finite number');
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  throw new Error(`Cannot canonicalise a value of type ${typeof value}`);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalise(value));
}

const encoder = new TextEncoder();

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * The approval scope. Excludes the review ledger itself so that recording an approval cannot
 * change the hash the approval refers to.
 */
export function scientificPayload(bundle: ContentBundle): Omit<ContentBundle, 'reviews'> {
  const { reviews: _reviews, ...rest } = bundle;
  return rest;
}

export async function scientificHash(bundle: ContentBundle): Promise<string> {
  return sha256Hex(canonicalJson(scientificPayload(bundle)));
}

/**
 * The bytes actually served. `content:build` writes exactly this string, so the browser can
 * re-hash what it received and refuse a bundle that does not match its manifest.
 */
export function serialiseBundle(bundle: ContentBundle): string {
  return canonicalJson(sortBundleRecords(bundle));
}

/** Document 05: the deterministic bundle's records are sorted by ID. */
export function sortBundleRecords(bundle: ContentBundle): ContentBundle {
  const byId = <T extends { id: string }>(records: readonly T[]): T[] =>
    [...records].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    schemaVersion: bundle.schemaVersion,
    contentVersion: bundle.contentVersion,
    fixture: bundle.fixture,
    contexts: byId(bundle.contexts),
    references: byId(bundle.references),
    claims: byId(bundle.claims),
    anatomy: byId(bundle.anatomy),
    signals: byId(bundle.signals),
    concepts: byId(bundle.concepts),
    relationships: byId(bundle.relationships),
    explanations: byId(bundle.explanations),
    objectives: byId(bundle.objectives),
    // Timeline arrays are normalised to their specified order, not sorted arbitrarily.
    timelines: byId(bundle.timelines).map((timeline) => ({
      ...timeline,
      tracks: [...timeline.tracks].sort((a, b) => a.order - b.order),
      timingBands: [...timeline.timingBands],
      steps: [...timeline.steps].sort((a, b) => a.atMs - b.atMs || (a.id < b.id ? -1 : 1)),
      events: [...timeline.events].sort((a, b) => a.atMs - b.atMs || a.order - b.order),
    })),
    predictions: byId(bundle.predictions),
    comparisons: byId(bundle.comparisons),
    anchors: byId(bundle.anchors),
    routes: byId(bundle.routes),
    assets: byId(bundle.assets),
    reviews: byId(bundle.reviews),
  };
}
