/**
 * Canonical link construction and parsing.
 *
 * Document 05: URLs carry content IDs and preferences only, never attempts or progress. Unknown
 * optional parameters are ignored, invalid enum values fall back to documented defaults, unknown
 * IDs reach a recovery page, and the whole URL is bounded.
 */
import { DepthSchema, type Depth } from '../content/schema.ts';

export const MAX_URL_LENGTH = 2048;

export type ExploreSelection =
  | { kind: 'signal'; id: string }
  | { kind: 'anatomy'; id: string }
  | { kind: 'concept'; id: string };

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ID_LENGTH = 120;

/** Accepts only a well-formed identifier, so a parameter can never become a network path. */
export function safeId(value: string | null): string | null {
  if (value === null) return null;
  if (value.length > MAX_ID_LENGTH) return null;
  return ID_PATTERN.test(value) ? value : null;
}

export function parseDepth(value: string | null, fallback: Depth): Depth {
  const parsed = DepthSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

/**
 * Explore accepts exactly one primary selection. When more than one is present the first in
 * precedence order wins and the URL is normalised (document 08).
 */
export function parseExploreSelection(params: URLSearchParams): ExploreSelection | null {
  for (const kind of ['signal', 'anatomy', 'concept'] as const) {
    const id = safeId(params.get(kind));
    if (id !== null) return { kind, id };
  }
  return null;
}

function withDepth(base: string, depth?: Depth): string {
  return depth === undefined ? base : `${base}${base.includes('?') ? '&' : '?'}depth=${depth}`;
}

export function exploreUrl(selection: ExploreSelection | null, depth?: Depth): string {
  const base = selection === null ? '/explore' : `/explore?${selection.kind}=${selection.id}`;
  return withDepth(base, depth);
}

export function journeyUrl(id: string, options: { depth?: Depth; stepId?: string } = {}): string {
  const params = new URLSearchParams();
  if (options.depth !== undefined) params.set('depth', options.depth);
  if (options.stepId !== undefined) params.set('step', options.stepId);
  const query = params.toString();
  return `/journey/${id}${query === '' ? '' : `?${query}`}`;
}

export function stateUrl(id: string, options: { depth?: Depth; stepId?: string } = {}): string {
  const params = new URLSearchParams();
  if (options.depth !== undefined) params.set('depth', options.depth);
  if (options.stepId !== undefined) params.set('step', options.stepId);
  const query = params.toString();
  return `/state/${id}${query === '' ? '' : `?${query}`}`;
}

export function timelineUrl(
  id: string,
  kind: 'journey' | 'state' | 'exercise',
  options: { depth?: Depth; stepId?: string } = {},
): string {
  if (kind === 'state') return stateUrl(id, options);
  if (kind === 'exercise') return `/exercise/${id}${options.depth ? `?depth=${options.depth}` : ''}`;
  return journeyUrl(id, options);
}

export function compareUrl(a?: string, b?: string, depth?: Depth): string {
  const params = new URLSearchParams();
  if (a !== undefined) params.set('a', a);
  if (b !== undefined) params.set('b', b);
  if (depth !== undefined) params.set('depth', depth);
  const query = params.toString();
  return `/compare${query === '' ? '' : `?${query}`}`;
}

/** Builds the shareable absolute link for the current canonical route. */
export function shareUrl(origin: string, pathname: string, hashRoute: string): string {
  const url = `${origin}${pathname}#${hashRoute}`;
  return url.length > MAX_URL_LENGTH ? url.slice(0, MAX_URL_LENGTH) : url;
}
