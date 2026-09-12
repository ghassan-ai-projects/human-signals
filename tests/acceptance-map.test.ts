/**
 * Traceability from the acceptance scenarios in document 11 to named tests (quality bar B4).
 *
 * Every AC-01..AC-18 must map to at least one named automated test, or be recorded as a human
 * gate with a reason. A human gate is never reported as passing on the strength of this map.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

interface AcceptanceEntry {
  id: string;
  title: string;
  /** Test files that must exist and contain the named scenarios. */
  automated: string[];
  /** A gate is `blocked` (a dependency is missing) or `not run` (owner action pending). */
  humanGate?: string;
}

const TEST_ROOT = join(process.cwd(), 'tests');

const ACCEPTANCE: AcceptanceEntry[] = [
  {
    id: 'AC-01',
    title: 'Three useful entry points',
    automated: ['unit/app-shell.test.tsx', 'unit/session-controller.test.ts'],
  },
  {
    id: 'AC-02',
    title: 'Anatomy is navigation',
    automated: ['integration/explore-and-search.test.tsx'],
  },
  {
    id: 'AC-03',
    title: 'Search is deterministic and useful',
    automated: ['integration/explore-and-search.test.tsx'],
  },
  {
    id: 'AC-04',
    title: 'Stress tells a coherent causal story',
    automated: ['unit/fixture-checks.test.ts', 'integration/state-flow.test.tsx', 'unit/state-engine.test.ts'],
    humanGate:
      'blocked — real Stress biology needs W8 review; the automated tests cover the invented alarm fixture only (90 s by design; released states follow the 120–180 s norm of document 03)',
  },
  {
    id: 'AC-05',
    title: 'All routes to a cursor agree',
    automated: ['unit/engine-properties.test.ts'],
  },
  {
    id: 'AC-06',
    title: 'Curiosity preserves context',
    automated: ['integration/lesson-flow.test.tsx', 'unit/session-controller.test.ts'],
  },
  {
    id: 'AC-07',
    title: 'Evidence is understandable',
    automated: ['integration/lesson-flow.test.tsx'],
  },
  {
    id: 'AC-08',
    title: 'Comparison is a learning tool',
    automated: ['integration/compare.test.tsx'],
    humanGate: 'not run — 390 px visual review of the comparison is a G5 owner action',
  },
  {
    id: 'AC-09',
    title: 'Predictions do not leak or misclassify',
    automated: [
      'integration/checkpoint-flow.test.tsx',
      'integration/progress-flow.test.tsx',
      'unit/session-controller.test.ts',
    ],
  },
  {
    id: 'AC-10',
    title: 'Local progress is optional and erasable',
    automated: [
      'integration/progress-flow.test.tsx',
      'integration/learn-page.test.tsx',
      'unit/progress-provider.test.tsx',
      'unit/progress-store.test.ts',
    ],
  },
  {
    id: 'AC-11',
    title: 'Invalid publication fails closed',
    automated: ['unit/publication-gate.test.ts'],
  },
  {
    id: 'AC-12',
    title: 'Equivalent access without 3D',
    automated: ['integration/scene-fallback.test.tsx', 'integration/checkpoint-flow.test.tsx'],
    humanGate: 'not run — screen-reader verification (VoiceOver/Safari plus one other) is a G5 owner action',
  },
  {
    id: 'AC-13',
    title: 'State survives navigation and layout changes',
    automated: ['integration/checkpoint-flow.test.tsx'],
    humanGate: 'not run — orientation and window-resize visual checks are a G5 owner action',
  },
  {
    id: 'AC-14',
    title: 'Failures preserve learning when possible',
    automated: ['integration/progress-flow.test.tsx', 'integration/content-loading.test.tsx'],
  },
  {
    id: 'AC-15',
    title: 'Performance claims have measurements',
    automated: [],
    humanGate: 'not run — physical-device measurement and budget traces are G5 owner actions',
  },
  {
    id: 'AC-16',
    title: 'Static web scope and privacy',
    automated: ['unit/publication-gate.test.ts', 'integration/progress-flow.test.tsx'],
  },
  {
    id: 'AC-17',
    title: 'Flagship quality and honest learning status',
    automated: ['unit/publication-gate.test.ts'],
    humanGate:
      'blocked — G4 scientific review and G7 learning validation are owner and researcher actions',
  },
  {
    id: 'AC-18',
    title: 'Release can be reproduced and rolled back',
    automated: ['unit/content-hash.test.ts'],
    humanGate: 'not run — deployment and rollback rehearsal are G6 owner actions',
  },
];

describe('acceptance scenario traceability', () => {
  it('maps all eighteen acceptance scenarios exactly once', () => {
    const ids = ACCEPTANCE.map((entry) => entry.id);
    expect(ids).toHaveLength(18);
    expect(new Set(ids).size).toBe(18);
    for (let index = 0; index < ids.length; index += 1) {
      expect(ids[index]).toBe(`AC-${String(index + 1).padStart(2, '0')}`);
    }
  });

  it('gives every scenario at least one automated test or a recorded human gate with a reason', () => {
    for (const entry of ACCEPTANCE) {
      const covered = entry.automated.length > 0 || entry.humanGate !== undefined;
      expect(covered, `${entry.id} must be covered`).toBe(true);
    }
  });

  it('references only test files that exist in this repository', () => {
    for (const entry of ACCEPTANCE) {
      for (const file of entry.automated) {
        expect(
          existsSync(join(TEST_ROOT, file)),
          `${entry.id} references ${file}, which does not exist`,
        ).toBe(true);
      }
    }
  });
});
