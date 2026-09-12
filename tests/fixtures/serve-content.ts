/**
 * Serves the fictional bundle over a stubbed fetch, exactly as a static host would: a mutable
 * manifest pointer and an immutable hash-named bundle. Integration tests therefore exercise the
 * real loader, including the delivered-bytes hash check.
 */
import { serialiseBundle, sha256Hex, sortBundleRecords } from '../../src/content/hash.ts';
import type { ContentBundle, ContentManifest } from '../../src/content/schema.ts';
import { validBundle } from './bundle.ts';

export interface ServedContent {
  manifest: ContentManifest;
  bundle: ContentBundle;
  bundleBytes: string;
  restore: () => void;
  /** Every path requested through the stub, in order. */
  requests: string[];
}

export interface ServeOptions {
  /** Corrupt the delivered bytes so the hash check must fail. */
  corruptBundle?: boolean;
  /** Fail the network for every request. */
  offline?: boolean;
  mutate?: (bundle: ContentBundle) => void;
}

export async function serveContent(options: ServeOptions = {}): Promise<ServedContent> {
  const bundle = sortBundleRecords(validBundle());
  options.mutate?.(bundle);
  const bundleBytes = serialiseBundle(bundle);
  const hash = await sha256Hex(bundleBytes);
  const bundlePath = `content/bundle.${hash.slice(0, 16)}.json`;

  const manifest: ContentManifest = {
    schemaVersion: 1,
    contentVersion: bundle.contentVersion,
    bundlePath,
    bundleSha256: hash,
    scientificSha256: hash,
    buildId: hash.slice(0, 12),
    catalog: [
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
        aliases: [],
      })),
      ...bundle.anatomy.map((record) => ({
        id: record.id,
        kind: 'anatomy' as const,
        label: record.label,
        aliases: [...record.aliases],
      })),
      ...bundle.concepts.map((record) => ({
        id: record.id,
        kind: 'concept' as const,
        label: record.label,
        aliases: [...record.aliases],
      })),
    ],
    retired: [],
  };

  const requests: string[] = [];
  const original = globalThis.fetch;

  const body = options.corruptBundle ? `${bundleBytes} ` : bundleBytes;

  globalThis.fetch = (input: RequestInfo | URL) => {
    const path =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    requests.push(path);
    if (options.offline) return Promise.reject(new Error('network unavailable'));
    const text =
      path.endsWith('manifest.json') ? JSON.stringify(manifest) : path.endsWith('.json') ? body : null;
    if (text === null) {
      return Promise.resolve(new Response('not found', { status: 404 }));
    }
    return Promise.resolve(new Response(text, { status: 200 }));
  };

  return {
    manifest,
    bundle,
    bundleBytes,
    requests,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}
