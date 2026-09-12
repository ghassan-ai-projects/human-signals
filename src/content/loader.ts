/**
 * Runtime content loading.
 *
 * Document 05: load and validate the manifest, fetch the exact hash-named bundle, check the
 * delivered SHA-256, parse with the matching runtime schema, and fail safely on any mismatch
 * rather than guessing a migration. Records from two versions are never mixed.
 */
import { parseBundle, parseManifest, type ValidationIssue } from './validate.ts';
import { sha256Hex } from './hash.ts';
import type { ContentBundle, ContentManifest } from './schema.ts';

export const SUPPORTED_SCHEMA_VERSION = 1;
export const LOAD_TIMEOUT_MS = 15_000;

export interface LoadedContent {
  manifest: ContentManifest;
  bundle: ContentBundle;
}

export type ContentErrorCode =
  | 'CONTENT_NETWORK'
  | 'CONTENT_SCHEMA'
  | 'CONTENT_HASH'
  | 'CONTENT_VERSION';

export type LoadResult =
  | { ok: true; content: LoadedContent }
  | { ok: false; code: ContentErrorCode; detail: string; issues?: ValidationIssue[] };

export interface LoadOptions {
  /** Relative to the document base, e.g. `content/manifest.json`. */
  manifestPath: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** The content version this application build expects, when it was built with one. */
  expectedContentVersion?: string;
}

/** Resolves a bundle path against the manifest's own directory, staying same-origin. */
function resolveSibling(manifestPath: string, bundlePath: string): string {
  const base = manifestPath.slice(0, manifestPath.lastIndexOf('/') + 1);
  return bundlePath.startsWith(base) ? bundlePath : `${base}${bundlePath.split('/').pop() ?? ''}`;
}

async function fetchText(
  path: string,
  options: LoadOptions,
): Promise<{ ok: true; text: string } | { ok: false; detail: string }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs ?? LOAD_TIMEOUT_MS);
  const onExternalAbort = (): void => {
    controller.abort();
  };
  options.signal?.addEventListener('abort', onExternalAbort);
  try {
    const response = await fetchImpl(path, { signal: controller.signal });
    if (!response.ok) return { ok: false, detail: `${path} responded ${response.status}` };
    return { ok: true, text: await response.text() };
  } catch (error) {
    return { ok: false, detail: `${path}: ${error instanceof Error ? error.message : String(error)}` };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function loadContent(options: LoadOptions): Promise<LoadResult> {
  const manifestResponse = await fetchText(options.manifestPath, options);
  if (!manifestResponse.ok) {
    return { ok: false, code: 'CONTENT_NETWORK', detail: manifestResponse.detail };
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(manifestResponse.text);
  } catch (error) {
    return {
      ok: false,
      code: 'CONTENT_SCHEMA',
      detail: `manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // The schema pins schemaVersion to 1, so an unsupported version is detected before parsing
  // and reported as a version mismatch rather than as a malformed manifest.
  const declaredSchemaVersion = (manifestJson as { schemaVersion?: unknown }).schemaVersion;
  if (declaredSchemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return {
      ok: false,
      code: 'CONTENT_VERSION',
      detail: `manifest schema version ${String(declaredSchemaVersion)} is not supported by this application`,
    };
  }

  const manifestResult = parseManifest(manifestJson);
  if (!manifestResult.manifest) {
    return {
      ok: false,
      code: 'CONTENT_SCHEMA',
      detail: 'manifest does not match its schema',
      issues: manifestResult.issues,
    };
  }
  const manifest = manifestResult.manifest;

  if (
    options.expectedContentVersion !== undefined &&
    options.expectedContentVersion !== manifest.contentVersion
  ) {
    // An old application shell must not silently adopt whichever bundle is newest.
    return {
      ok: false,
      code: 'CONTENT_VERSION',
      detail: `this build expects content ${options.expectedContentVersion}, the host is serving ${manifest.contentVersion}`,
    };
  }

  const bundlePath = resolveSibling(options.manifestPath, manifest.bundlePath);
  const bundleResponse = await fetchText(bundlePath, options);
  if (!bundleResponse.ok) {
    return { ok: false, code: 'CONTENT_NETWORK', detail: bundleResponse.detail };
  }

  const deliveredHash = await sha256Hex(bundleResponse.text);
  if (deliveredHash !== manifest.bundleSha256) {
    return {
      ok: false,
      code: 'CONTENT_HASH',
      detail: `delivered bundle hashes to ${deliveredHash}, manifest expects ${manifest.bundleSha256}`,
    };
  }

  let bundleJson: unknown;
  try {
    bundleJson = JSON.parse(bundleResponse.text);
  } catch (error) {
    return {
      ok: false,
      code: 'CONTENT_SCHEMA',
      detail: `bundle is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const parsed = parseBundle(bundleJson);
  if (!parsed.bundle) {
    return {
      ok: false,
      code: 'CONTENT_SCHEMA',
      detail: 'bundle does not match the runtime schema',
      issues: parsed.issues,
    };
  }
  if (parsed.bundle.contentVersion !== manifest.contentVersion) {
    return {
      ok: false,
      code: 'CONTENT_VERSION',
      detail: 'manifest and bundle disagree about the content version',
    };
  }

  return { ok: true, content: { manifest, bundle: parsed.bundle } };
}
