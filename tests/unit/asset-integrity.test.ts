import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyAssetBytes } from '../../src/content/assets.ts';
import { validBundle } from '../fixtures/bundle.ts';

const ROOT = join(import.meta.dirname, '..', '..');

describe('asset integrity', () => {
  it('accepts the tracked preview model when its ledger matches the bytes', async () => {
    const asset = validBundle().assets[0]!;
    const bytes = readFileSync(join(ROOT, 'content', 'fixtures', 'assets', 'makehuman-preview-body.glb'));

    await expect(verifyAssetBytes(asset, bytes)).resolves.toEqual({ ok: true });
  });

  it('rejects a changed model even when the byte count is unchanged', async () => {
    const asset = validBundle().assets[0]!;
    const bytes = readFileSync(join(ROOT, 'content', 'fixtures', 'assets', 'makehuman-preview-body.glb'));
    bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 0xff;

    const result = await verifyAssetBytes(asset, bytes);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain('hashes to');
  });

  it('rejects truncated bytes before hashing', async () => {
    const asset = validBundle().assets[0]!;
    const bytes = readFileSync(join(ROOT, 'content', 'fixtures', 'assets', 'makehuman-preview-body.glb'));

    const result = await verifyAssetBytes(asset, bytes.subarray(0, bytes.length - 1));
    expect(result).toEqual({
      ok: false,
      detail: `asset ${asset.id} is ${asset.bytes - 1} bytes; metadata records ${asset.bytes}`,
    });
  });
});
