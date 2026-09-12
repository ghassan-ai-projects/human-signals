/**
 * Quality bar A5: the engine is a pure module. It must run in tests without React, the DOM or
 * WebGL, so nothing under src/engine may import a UI, browser or renderer module.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

interface Boundary {
  dir: string;
  forbidden: RegExp;
  reason: string;
}

const BOUNDARIES: Boundary[] = [
  {
    dir: 'src/engine',
    forbidden: /^(react|react-dom|react-router-dom|three|@react-three\/.*)$|^\.\.\/(app|features|components|renderers|platform)\//,
    reason: 'the engine must run without React, the DOM or WebGL',
  },
  {
    dir: 'src/content',
    forbidden: /^(react|react-dom|three|@react-three\/.*)$|^\.\.\/(app|features|components|renderers)\//,
    reason: 'content loading and queries must be testable without a UI',
  },
];

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[^'"\n]*from\s*['"]([^'"]+)['"]/g;

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(full)) yield full;
  }
}

let failures = 0;
for (const boundary of BOUNDARIES) {
  for (const file of walk(join(ROOT, boundary.dir))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(IMPORT_RE)) {
      const specifier = match[1]!;
      if (boundary.forbidden.test(specifier)) {
        failures += 1;
        console.error(
          `BOUNDARY  ${relative(ROOT, file)} imports "${specifier}" — ${boundary.reason}`,
        );
      }
    }
    if (/\bdocument\.|\bwindow\.|localStorage|WebGL/.test(source) && boundary.dir === 'src/engine') {
      failures += 1;
      console.error(`BOUNDARY  ${relative(ROOT, file)} touches a browser global`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} boundary violation(s).`);
  process.exit(1);
}
console.log('Module boundaries OK.');
