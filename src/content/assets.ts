/**
 * Asset integrity helpers shared by the static compiler and the runtime loader.
 *
 * Content metadata is not evidence by itself. The bytes served to a learner must match the
 * recorded length and SHA-256, and the same check must run before a GLB enters the scene.
 */
import type { Asset } from './schema.ts';
import { sha256Hex } from './hash.ts';

/** Canonical licence URLs accepted by the asset ledger. Keep this list deliberately small. */
export const ASSET_LICENSE_URLS = {
  'CC0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC-BY-SA-4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
} as const;

const PINNED_SOURCE_REVISION = /^[0-9a-f]{40}$/i;

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

/**
 * Checks the machine-verifiable part of an asset's provenance record.
 *
 * A preview may use a project-authored fixture, but a production asset must point at an
 * immutable upstream revision. Scientific approval remains a separate human review gate.
 */
export function validateAssetProvenance(asset: Asset, mode: 'preview' | 'production'): string[] {
  const issues: string[] = [];
  const expectedLicenseUrl = ASSET_LICENSE_URLS[asset.license as keyof typeof ASSET_LICENSE_URLS];

  if (expectedLicenseUrl === undefined) {
    issues.push(`asset ${asset.id} uses an unsupported licence identifier: ${asset.license}`);
  } else if (asset.licenseUrl !== expectedLicenseUrl) {
    issues.push(`asset ${asset.id} must use the canonical URL for ${asset.license}`);
  }

  if (asset.sourceRevision === 'fixture') {
    if (mode === 'production') {
      issues.push(`asset ${asset.id} cannot use the fixture source revision in production`);
    }
    if (!asset.source.startsWith('project-authored')) {
      issues.push(`asset ${asset.id} must identify project-authored provenance when sourceRevision is fixture`);
    }
    return issues;
  }

  if (!PINNED_SOURCE_REVISION.test(asset.sourceRevision)) {
    issues.push(`asset ${asset.id} sourceRevision must be a 40-character immutable revision`);
  }
  if (!asset.source.startsWith('https://')) {
    issues.push(`asset ${asset.id} source must be an HTTPS origin URL`);
  }
  if (!asset.source.includes(asset.sourceRevision)) {
    issues.push(`asset ${asset.id} source URL must include sourceRevision`);
  }
  return issues;
}

/** Asset paths are rooted at the static app, just like the content manifest path. */
export function assetUrl(path: string): string {
  return path;
}
