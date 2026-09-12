/**
 * Content compiler.
 *
 * Document 05 pipeline: parse -> schema validate -> cross-reference validate -> timeline/graph
 * validate -> scientific hash -> review check -> deterministic bundle -> delivered-byte hash ->
 * manifest and search catalog -> static build inputs.
 *
 *   node scripts/content-cli.ts validate [--mode=preview|production] [--include-fixtures]
 *   node scripts/content-cli.ts build    [--mode=preview|production] [--include-fixtures]
 *                                        [--verify-deterministic]
 *
 * There is no environment variable that skips review. Production is fail-closed by construction:
 * the same validator runs, with the publication gate switched on.
 */
import { readdirSync, readFileSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  parseBundle,
  validateBundle,
  validateManifest,
  formatIssues,
  type ValidationIssue,
} from '../src/content/validate.ts';
import { scientificHash, serialiseBundle, sha256Hex, sortBundleRecords } from '../src/content/hash.ts';
import type { ContentBundle, ContentManifest } from '../src/content/schema.ts';

const ROOT = join(import.meta.dirname, '..');
const RECORDS_DIR = join(ROOT, 'content', 'records');
const FIXTURES_DIR = join(ROOT, 'content', 'fixtures');
const META_PATH = join(ROOT, 'content', 'meta.json');
const OUT_DIR = join(ROOT, 'public', 'content');

const EMPTY: Omit<ContentBundle, 'schemaVersion' | 'contentVersion' | 'fixture'> = {
  contexts: [],
  references: [],
  claims: [],
  anatomy: [],
  signals: [],
  concepts: [],
  relationships: [],
  explanations: [],
  objectives: [],
  timelines: [],
  predictions: [],
  comparisons: [],
  anchors: [],
  routes: [],
  assets: [],
  reviews: [],
};

type GroupKey = keyof typeof EMPTY;
const GROUP_KEYS = Object.keys(EMPTY) as GroupKey[];

interface Args {
  command: 'validate' | 'build';
  mode: 'preview' | 'production';
  includeFixtures: boolean;
  verifyDeterministic: boolean;
}

function parseArgs(argv: string[]): Args {
  const command = argv[0];
  if (command !== 'validate' && command !== 'build') {
    throw new Error(`Usage: content-cli.ts <validate|build> [--mode=preview|production]`);
  }
  const modeArg = argv.find((value) => value.startsWith('--mode='))?.slice('--mode='.length);
  if (modeArg !== undefined && modeArg !== 'preview' && modeArg !== 'production') {
    throw new Error(`Unknown mode "${modeArg}"`);
  }
  return {
    command,
    mode: modeArg ?? 'preview',
    includeFixtures: argv.includes('--include-fixtures'),
    verifyDeterministic: argv.includes('--verify-deterministic'),
  };
}

function* jsonFiles(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(full);
    else if (entry.name.endsWith('.json')) yield full;
  }
}

interface LoadResult {
  raw: Record<string, unknown>;
  fileOf: Map<string, string>;
  issues: ValidationIssue[];
}

/** Merges every authoring file into one candidate bundle and remembers each record's file. */
function loadRecords(dirs: string[], fixture: boolean): LoadResult {
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8')) as { contentVersion: string };
  const raw: Record<string, unknown> = {
    schemaVersion: 1,
    contentVersion: meta.contentVersion,
    fixture,
  };
  for (const key of GROUP_KEYS) raw[key] = [];
  const fileOf = new Map<string, string>();
  const issues: ValidationIssue[] = [];

  for (const dir of dirs) {
    for (const file of jsonFiles(dir)) {
      const relativePath = relative(ROOT, file);
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
      } catch (error) {
        issues.push({
          rule: 'VAL-SCHEMA',
          path: relativePath,
          message: `file is not valid JSON: ${String(error)}`,
        });
        continue;
      }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        issues.push({
          rule: 'VAL-SCHEMA',
          path: relativePath,
          message: 'an authoring file must be an object keyed by record group',
        });
        continue;
      }
      for (const [key, value] of Object.entries(parsed)) {
        if (!GROUP_KEYS.includes(key as GroupKey)) {
          issues.push({
            rule: 'VAL-SCHEMA',
            path: `${relativePath}#${key}`,
            message: `unknown record group "${key}"`,
          });
          continue;
        }
        if (!Array.isArray(value)) {
          issues.push({
            rule: 'VAL-SCHEMA',
            path: `${relativePath}#${key}`,
            message: 'a record group must be an array',
          });
          continue;
        }
        (raw[key] as unknown[]).push(...(value as unknown[]));
        for (const record of value) {
          const id = (record as { id?: unknown }).id;
          if (typeof id === 'string') fileOf.set(id, relativePath);
        }
      }
    }
  }
  return { raw, fileOf, issues };
}

function buildManifest(
  bundle: ContentBundle,
  bundlePath: string,
  bundleSha: string,
  scientificSha: string,
): ContentManifest {
  const catalog: ContentManifest['catalog'] = [
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
      aliases: [] as string[],
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
  ].sort((a, b) => (a.id < b.id ? -1 : 1));

  return {
    schemaVersion: 1,
    contentVersion: bundle.contentVersion,
    bundlePath,
    bundleSha256: bundleSha,
    scientificSha256: scientificSha,
    // Derived from the content bytes, so an identical input produces an identical build id.
    buildId: bundleSha.slice(0, 12),
    catalog,
    retired: [],
  };
}

function report(issues: readonly ValidationIssue[], fileOf: Map<string, string>): void {
  const located = issues.map((issue) => {
    const file = issue.recordId === undefined ? undefined : fileOf.get(issue.recordId);
    return file === undefined ? issue : { ...issue, path: `${file}  ${issue.path}` };
  });
  console.error(formatIssues(located));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dirs = args.includeFixtures ? [RECORDS_DIR, FIXTURES_DIR] : [RECORDS_DIR];
  const { raw, fileOf, issues: loadIssues } = loadRecords(dirs, args.includeFixtures);

  if (loadIssues.length > 0) {
    report(loadIssues, fileOf);
    console.error(`\ncontent: ${loadIssues.length} authoring file error(s).`);
    process.exit(1);
  }

  const parsed = parseBundle(raw);
  if (!parsed.bundle) {
    report(parsed.issues, fileOf);
    console.error(`\ncontent: ${parsed.issues.length} schema error(s).`);
    process.exit(1);
  }

  const semantic = validateBundle(parsed.bundle, { mode: args.mode });
  if (semantic.length > 0) {
    report(semantic, fileOf);
    console.error(`\ncontent: ${semantic.length} validation error(s) in ${args.mode} mode.`);
    process.exit(1);
  }

  const sorted = sortBundleRecords(parsed.bundle);
  const bytes = serialiseBundle(sorted);
  const bundleSha = await sha256Hex(bytes);
  const scientificSha = await scientificHash(sorted);
  const bundleFile = `bundle.${bundleSha.slice(0, 16)}.json`;
  const manifest = buildManifest(sorted, `content/${bundleFile}`, bundleSha, scientificSha);

  const manifestIssues = validateManifest(manifest, sorted, bundleSha);
  if (manifestIssues.length > 0) {
    report(manifestIssues, fileOf);
    process.exit(1);
  }

  const counts = GROUP_KEYS.map((key) => `${key}=${sorted[key].length}`).join(' ');
  if (args.command === 'validate') {
    console.log(`content: valid in ${args.mode} mode.\n  ${counts}`);
    console.log(`  bundle sha256     ${bundleSha}`);
    console.log(`  scientific sha256 ${scientificSha}`);
    return;
  }

  if (args.verifyDeterministic) {
    const second = serialiseBundle(sortBundleRecords(parseBundle(raw).bundle!));
    const secondSha = await sha256Hex(second);
    if (second !== bytes || secondSha !== bundleSha) {
      console.error('content: build is not deterministic; identical input produced different bytes.');
      process.exit(1);
    }
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, bundleFile), bytes, 'utf8');
  writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(OUT_DIR, 'build-meta.json'),
    `${JSON.stringify(
      { manifestPath: 'content/manifest.json', contentVersion: manifest.contentVersion, buildId: manifest.buildId },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`content: built ${args.mode} bundle.\n  ${counts}`);
  console.log(`  ${relative(ROOT, join(OUT_DIR, bundleFile))}  ${(bytes.length / 1024).toFixed(1)} KB`);
  console.log(`  bundle sha256     ${bundleSha}`);
  console.log(`  scientific sha256 ${scientificSha}`);
}

await main();
