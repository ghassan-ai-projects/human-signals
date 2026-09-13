/** Executable release budgets for the built preview artifact. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { project, type ProjectableTimeline } from '../src/engine/frame.ts';
import type { VisualCommand } from '../src/content/schema.ts';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const DIST_ASSETS = join(DIST, 'assets');
const CONTENT = join(ROOT, 'public', 'content');

interface Budget {
  name: string;
  actual: number;
  limit: number;
  unit: string;
}

function requireFile(path: string): Buffer {
  if (!existsSync(path)) throw new Error(`missing build artifact: ${path}; run npm run build:preview first`);
  return readFileSync(path);
}

function gzipSize(path: string): number {
  return gzipSync(requireFile(path), { level: 9 }).byteLength;
}

function assetFiles(): string[] {
  if (!existsSync(CONTENT)) return [];
  return readdirSync(join(CONTENT, 'assets'))
    .filter((name) => name.endsWith('.glb'))
    .sort()
    .map((name) => join(CONTENT, 'assets', name));
}

function builtAssetNames(): string[] {
  return readdirSync(DIST_ASSETS).sort();
}

function buildBudgets(): Budget[] {
  const indexHtml = requireFile(join(DIST, 'index.html')).toString('utf8');
  const initialPaths = [...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/gu)]
    .map((match) => match[1]!)
    .filter((path) => !/Anatomy3D|anatomy3d/u.test(path));
  const initialShell = initialPaths.reduce(
    (total, path) => total + gzipSize(join(DIST, path.slice(1))),
    0,
  );
  const lazy3d = builtAssetNames()
    .filter((name) => /^(?:Anatomy3D|anatomy3d).*\.js$/u.test(name))
    .reduce((total, name) => total + gzipSize(join(DIST_ASSETS, name)), 0);
  const manifestAndSearch = ['manifest.json', 'search-index.json']
    .map((name) => join(CONTENT, name))
    .filter((path) => existsSync(path))
    .reduce((total, path) => total + gzipSize(path), 0);
  const bundles = readdirSync(CONTENT)
    .filter((name) => /^bundle\..+\.json$/u.test(name))
    .map((name) => join(CONTENT, name));
  const contentBundle = bundles.reduce((total, path) => total + gzipSize(path), 0);
  const bodyAssets = assetFiles().reduce((total, path) => total + gzipSize(path), 0);

  return [
    { name: 'initial shell', actual: initialShell, limit: 350_000, unit: 'gzip bytes' },
    { name: 'lazy 3D JavaScript', actual: lazy3d, limit: 500_000, unit: 'gzip bytes' },
    { name: 'manifest + search index', actual: manifestAndSearch, limit: 100_000, unit: 'gzip bytes' },
    { name: 'content bundle', actual: contentBundle, limit: 1_500_000, unit: 'gzip bytes' },
    { name: 'lazy body assets', actual: bodyAssets, limit: 500_000, unit: 'gzip bytes' },
  ];
}

function benchmarkProjection(): Budget {
  const tracks = Array.from({ length: 4 }, (_, index) => ({ id: `track-${String(index)}` }));
  const events: ProjectableTimeline['events'] = Array.from({ length: 2000 }, (_, index) => {
    let command: VisualCommand;
    if (index % 3 === 0) {
      command = { type: 'set-highlight', anatomyId: `anat-${String(index % 80)}`, value: 'active' };
    } else if (index % 3 === 1) {
      command = {
        type: 'set-relation',
        relationshipId: `rel-${String(index % 80)}`,
        visible: index % 2 === 0,
      };
    } else {
      command = { type: 'set-trend', signalId: `sig-${String(index % 80)}`, value: 'variable' };
    }
    return {
      atMs: index * 300,
      order: index,
      trackId: tracks[index % tracks.length]!.id,
      command,
    };
  });
  const timeline: ProjectableTimeline = {
    durationMs: 600_000,
    tracks,
    steps: Array.from({ length: 2000 }, (_, index) => ({
      id: `step-${String(index)}`,
      atMs: index * 300,
      trackId: tracks[index % tracks.length]!.id,
    })),
    events,
  };
  const cursors = Array.from({ length: 30 }, (_, index) => (index * 19_997) % timeline.durationMs);
  for (const cursor of cursors.slice(0, 5)) project(timeline, cursor);
  const samples = cursors.map((cursor) => {
    const start = performance.now();
    project(timeline, cursor);
    return performance.now() - start;
  });
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.ceil(samples.length * 0.95) - 1] ?? 0;
  return { name: 'frame projection p95', actual: p95, limit: 8, unit: 'ms' };
}

const budgets = [...buildBudgets(), benchmarkProjection()];
let failed = false;
for (const budget of budgets) {
  const ok = budget.actual <= budget.limit;
  failed ||= !ok;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${budget.name}: ${budget.actual.toFixed(2)} ${budget.unit} / ${budget.limit} ${budget.unit}`,
  );
}
if (failed) process.exit(1);
