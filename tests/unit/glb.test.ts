import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readGlbMeshNames } from '../../src/content/glb.ts';

const ROOT = join(import.meta.dirname, '..', '..');

describe('GLB metadata', () => {
  it('reads mesh names from the tracked preview body', () => {
    const bytes = readFileSync(join(ROOT, 'content', 'fixtures', 'assets', 'makehuman-preview-body.glb'));
    expect(readGlbMeshNames(bytes)).toEqual(['makehuman-base-body']);
  });

  it('rejects malformed GLB bytes before a mapping can be accepted', () => {
    expect(() => readGlbMeshNames(new Uint8Array(12))).toThrow('GLB magic is invalid');
  });
});
