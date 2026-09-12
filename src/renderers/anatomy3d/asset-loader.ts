/**
 * Same-origin model loading with the same byte contract as the static content compiler.
 *
 * A model is never trusted because a URL returned successfully. The response is checked for
 * status, size and SHA-256 before a GLTF parser sees it. The caller owns cancellation and decides
 * whether a failure should preserve the lesson in the 2D renderer.
 */
import type { Asset } from '../../content/schema.ts';
import { assetUrl, verifyAssetBytes } from '../../content/assets.ts';

export const MODEL_LOAD_TIMEOUT_MS = 15_000;

export interface AssetLoadOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function abortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

export async function loadVerifiedAsset(
  asset: Asset,
  options: AssetLoadOptions = {},
): Promise<ArrayBuffer> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? MODEL_LOAD_TIMEOUT_MS;
  if (options.signal?.aborted) throw abortError('model load aborted before it started');

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onExternalAbort: (() => void) | undefined;
  const control = new Promise<never>((_, reject) => {
    const fail = (error: Error): void => {
      controller.abort();
      reject(error);
    };
    timeout = setTimeout(() => {
      fail(abortError(`model load timed out after ${timeoutMs} ms`));
    }, timeoutMs);
    onExternalAbort = () => {
      fail(abortError('model load aborted'));
    };
    options.signal?.addEventListener('abort', onExternalAbort, { once: true });
  });

  try {
    const response = await Promise.race([
      Promise.resolve().then(() => fetchImpl(assetUrl(asset.path), { signal: controller.signal })),
      control,
    ]);
    if (!response.ok) throw new Error(`model responded ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const integrity = await verifyAssetBytes(asset, bytes);
    if (!integrity.ok) throw new Error(integrity.detail ?? `model ${asset.id} failed integrity verification`);
    return bytes.buffer;
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    if (onExternalAbort !== undefined) options.signal?.removeEventListener('abort', onExternalAbort);
  }
}
