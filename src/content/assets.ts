/**
 * Asset integrity helpers shared by the static compiler and the runtime loader.
 *
 * Content metadata is not evidence by itself. The bytes served to a learner must match the
 * recorded length and SHA-256, and the same check must run before a GLB enters the scene.
 */
import type { Asset } from './schema.ts';
import { sha256Hex } from './hash.ts';

export interface AssetIntegrityResult {
  ok: boolean;
  detail?: string;
}

export async function verifyAssetBytes(asset: Asset, bytes: Uint8Array): Promise<AssetIntegrityResult> {
  if (bytes.byteLength !== asset.bytes) {
    return {
      ok: false,
      detail: `asset ${asset.id} is ${bytes.byteLength} bytes; metadata records ${asset.bytes}`,
    };
  }
  const deliveredHash = await sha256Hex(bytes);
  if (deliveredHash !== asset.sha256) {
    return {
      ok: false,
      detail: `asset ${asset.id} hashes to ${deliveredHash}; metadata records ${asset.sha256}`,
    };
  }
  return { ok: true };
}

/** Asset paths are rooted at the static app, just like the content manifest path. */
export function assetUrl(path: string): string {
  return path;
}
