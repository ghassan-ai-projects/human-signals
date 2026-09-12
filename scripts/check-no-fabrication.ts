/**
 * Quality bar C3: no fabricated citation, reviewer or approval can enter the repository.
 *
 * Document 04 is explicit that an implementing agent cannot self-assign a qualification, invent
 * a reference or record a sign-off. Code cannot tell a real citation from an invented one, so
 * this check makes the ledger the authority instead: a reference or an approval may exist in the
 * content only if a human has already listed it in `content/reviews/`. An automated author that
 * invents a DOI fails here, because it cannot add itself to the ledger honestly.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CONTENT_DIRS = [join(ROOT, 'content', 'records'), join(ROOT, 'content', 'fixtures')];
const SOURCES_LEDGER = join(ROOT, 'content', 'reviews', 'sources-checked.tsv');
const APPROVALS_LEDGER = join(ROOT, 'content', 'reviews', 'approvals.tsv');

/** Reads the first column of a tab-separated ledger, ignoring comments and blank lines. */
function readLedgerIds(path: string): Set<string> {
  if (!existsSync(path)) return new Set();
  return new Set(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.split('\t')[0]!.trim()),
  );
}

function* jsonFiles(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(full);
    else if (entry.name.endsWith('.json')) yield full;
  }
}

interface Record_ {
  id?: string;
  status?: string;
  references?: Array<{ referenceId?: string }>;
  disposition?: string;
}

const checkedSources = readLedgerIds(SOURCES_LEDGER);
const approvals = readLedgerIds(APPROVALS_LEDGER);
const failures: string[] = [];

for (const dir of CONTENT_DIRS) {
  for (const file of jsonFiles(dir)) {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, Record_[]>;
    const name = file.slice(ROOT.length + 1);

    for (const reference of parsed['references'] ?? []) {
      if (reference.id !== undefined && !checkedSources.has(reference.id)) {
        failures.push(
          `${name}: reference ${reference.id} is not listed in content/reviews/sources-checked.tsv. ` +
            'A citation may only be added after a person has actually read the source and recorded it.',
        );
      }
    }

    for (const claim of parsed['claims'] ?? []) {
      for (const link of claim.references ?? []) {
        if (link.referenceId !== undefined && !checkedSources.has(link.referenceId)) {
          failures.push(
            `${name}: claim ${claim.id ?? '(unknown)'} cites ${link.referenceId}, which is not in the checked-source ledger.`,
          );
        }
      }
      if (claim.status === 'approved' && !approvals.has(claim.id ?? '')) {
        failures.push(
          `${name}: claim ${claim.id ?? '(unknown)'} is marked approved but no approval is recorded in content/reviews/approvals.tsv.`,
        );
      }
    }

    for (const review of parsed['reviews'] ?? []) {
      if (!approvals.has(review.id ?? '')) {
        failures.push(
          `${name}: review record ${review.id ?? '(unknown)'} is not in content/reviews/approvals.tsv. ` +
            'Review records are created by the project owner, never by an implementation.',
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Fabrication guard failed:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(
    `\n${failures.length} problem(s). See documentation/04-scientific-content-and-evidence.md.`,
  );
  process.exit(1);
}

console.log(
  `Fabrication guard OK: ${checkedSources.size} checked source(s), ${approvals.size} recorded approval(s).`,
);
