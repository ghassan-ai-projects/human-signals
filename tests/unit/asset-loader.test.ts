import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadVerifiedAsset } from '../../src/renderers/anatomy3d/asset-loader.ts';
import { validBundle } from '../fixtures/bundle.ts';

const ROOT = join(import.meta.dirname, '..', '..');

function assetBytes(): Uint8Array {
  return readFileSync(join(ROOT, 'content', 'fixtures', 'assets', 'makehuman-preview-body.glb'));
}

describe('verified model loader', () => {
  it('fetches and verifies the exact model bytes before returning them', async () => {
    const asset = validBundle().assets[0]!;
    const expected = assetBytes();
    const fetchImpl: typeof fetch = () =>
      Promise.resolve(new Response(expected as unknown as ArrayBuffer, { status: 200 }));

    const loaded = await loadVerifiedAsset(asset, { fetchImpl });
    expect(Array.from(new Uint8Array(loaded))).toEqual(Array.from(expected));
  });

  it('rejects an HTTP failure without treating the response as a model', async () => {
    const asset = validBundle().assets[0]!;
    const fetchImpl: typeof fetch = () => Promise.resolve(new Response('missing', { status: 404 }));

    await expect(loadVerifiedAsset(asset, { fetchImpl })).rejects.toThrow('model responded 404');
  });

  it('rejects a successful response whose bytes do not match the ledger', async () => {
    const asset = validBundle().assets[0]!;
    const bytes = assetBytes();
    bytes[0] = bytes[0]! ^ 0xff;
    const fetchImpl: typeof fetch = () =>
      Promise.resolve(new Response(bytes as unknown as ArrayBuffer, { status: 200 }));

    await expect(loadVerifiedAsset(asset, { fetchImpl })).rejects.toThrow('hashes to');
  });

  it('aborts a pending request when the caller cancels it', async () => {
    const asset = validBundle().assets[0]!;
    const controller = new AbortController();
    const fetchImpl: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      });

    const pending = loadVerifiedAsset(asset, { fetchImpl, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow('aborted');
  });
});
