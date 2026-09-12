/**
 * Same-origin model loading with the same byte contract as the static content compiler.
 *
 * A model is never trusted because a URL returned successfully. The response is checked for
 * status, size and SHA-256 before a GLTF parser sees it. The caller owns cancellation and decides
 * whether a failure should preserve the lesson in the 2D renderer.
 */
import type { Asset } from '../../content/schema.ts';
import { verifyAssetBytes } from '../../content/assets.ts';

export const MODEL_LOAD_TIMEOUT_MS = 15_000;

export interface AssetLoadOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function loadVerifiedAsset(
  asset: Asset,
  options: AssetLoadOptions = {},
): Promise<ArrayBuffer> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs ?? MODEL_LOAD_TIMEOUT_MS);
  const onExternalAbort = (): void => {
    controller.abort();
  };
  options.signal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetchImpl(asset.path, { signal: controller.signal });
    if (!response.ok) throw new Error(`model responded ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const integrity = await verifyAssetBytes(asset, bytes);
    if (!integrity.ok) throw new Error(integrity.detail ?? `model ${asset.id} failed integrity verification`);
    return bytes.buffer;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}
