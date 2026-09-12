/**
 * Loads the fictional development bundle for tests. Engine and infrastructure tests use
 * fictional data only (document 11): no real physiological assertion is used to test an
 * algorithm, and no test depends on unreviewed content being correct.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseBundle } from '../../src/content/validate.ts';
import type { ContentBundle } from '../../src/content/schema.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const FIXTURE_DIR = join(ROOT, 'content', 'fixtures');

export const FIXTURE_TIMELINE_ID = 'exercise-synthetic-feedback';

function readGroups(): Record<string, unknown[]> {
  const groups: Record<string, unknown[]> = {};
  for (const name of readdirSync(FIXTURE_DIR).sort()) {
    if (!name.endsWith('.json')) continue;
    const parsed = JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8')) as Record<
      string,
      unknown[]
    >;
    for (const [key, value] of Object.entries(parsed)) {
      groups[key] = [...(groups[key] ?? []), ...value];
    }
  }
  return groups;
}

/** A valid bundle. Each call returns a fresh deep copy so a test can mutate it freely. */
export function validBundle(): ContentBundle {
  const meta = JSON.parse(readFileSync(join(ROOT, 'content', 'meta.json'), 'utf8')) as {
    contentVersion: string;
  };
  const raw = { schemaVersion: 1, contentVersion: meta.contentVersion, fixture: true, ...readGroups() };
  const parsed = parseBundle(raw);
  if (!parsed.bundle) {
    throw new Error(`Fixture bundle is invalid:\n${JSON.stringify(parsed.issues, null, 2)}`);
  }
  return structuredClone(parsed.bundle);
}

/** Applies a mutation to a fresh copy of the valid bundle. */
export function bundleWith(mutate: (bundle: ContentBundle) => void): ContentBundle {
  const bundle = validBundle();
  mutate(bundle);
  return bundle;
}

export function timelineOf(bundle: ContentBundle): ContentBundle['timelines'][number] {
  const timeline = bundle.timelines.find((item) => item.id === FIXTURE_TIMELINE_ID);
  if (!timeline) throw new Error('fixture timeline missing');
  return timeline;
}
