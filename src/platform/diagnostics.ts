/**
 * Local, in-memory diagnostics. Document 08: at most 100 entries holding only an error code,
 * app build, content version, route kind and time. No URL queries, free text, attempts,
 * answers or fingerprints, and no automatic upload of any kind.
 */
export const ERROR_CODES = [
  'CONTENT_NETWORK',
  'CONTENT_SCHEMA',
  'CONTENT_HASH',
  'CONTENT_VERSION',
  'ROUTE_UNKNOWN',
  'ASSET_LOAD',
  'WEBGL_UNAVAILABLE',
  'WEBGL_CONTEXT_LOST',
  'STORAGE_UNAVAILABLE',
  'ENGINE_INVALID_STATE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type RouteKind =
  | 'home'
  | 'explore'
  | 'journey'
  | 'state'
  | 'compare'
  | 'learn'
  | 'exercise'
  | 'about'
  | 'unknown';

export interface DiagnosticEntry {
  code: ErrorCode;
  appBuild: string;
  contentVersion: string;
  routeKind: RouteKind;
  at: string;
}

const MAX_ENTRIES = 100;
const entries: DiagnosticEntry[] = [];
const listeners = new Set<() => void>();

let contentVersion = __CONTENT_VERSION__;

export function setDiagnosticContentVersion(version: string): void {
  contentVersion = version;
}

export function recordDiagnostic(code: ErrorCode, routeKind: RouteKind): void {
  entries.push({
    code,
    appBuild: __CONTENT_BUILD_ID__,
    contentVersion,
    routeKind,
    at: new Date().toISOString(),
  });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  for (const listener of listeners) listener();
}

export function readDiagnostics(): readonly DiagnosticEntry[] {
  return entries;
}

export function subscribeDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearDiagnostics(): void {
  entries.length = 0;
  for (const listener of listeners) listener();
}

/** Plain text the user can read before deciding to copy it. */
export function formatDiagnostics(): string {
  if (entries.length === 0) return 'Human Signals diagnostics: no recorded events.';
  const header = `Human Signals diagnostics (${entries.length} of max ${MAX_ENTRIES})`;
  const rows = entries.map(
    (entry) =>
      `${entry.at}  ${entry.code}  route=${entry.routeKind}  build=${entry.appBuild}  content=${entry.contentVersion}`,
  );
  return [header, ...rows].join('\n');
}
