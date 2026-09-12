/**
 * One description of how an edge reads, shared by every renderer.
 *
 * REQ-026 requires edge polarity, route type, scope and time labels to match across text, diagram
 * and scene. Both renderers derive their marks from this module, so they cannot drift; document
 * 07 also requires each role to carry a pattern or label so a grayscale view still communicates
 * direction and sign.
 */
import type { Relationship } from '../../content/schema.ts';

export type EdgeTerminal = 'arrow' | 'bar' | 'diamond' | 'none';

export interface EdgePresentation {
  /** The word shown beside the mark. Never colour alone. */
  effectLabel: string;
  terminal: EdgeTerminal;
  /** Dash pattern in SVG user units; an empty string means a solid line. */
  dash: string;
  transportLabel: string;
  /** Legend sentence explaining what the line does and does not claim. */
  transportNote: string;
  /** Only causal edges may carry a travelling pulse (document 06). */
  allowsPulse: boolean;
  feedbackLabel: string | null;
  roleToken: 'route' | 'inhibit' | 'uncertain';
}

const TRANSPORT: Record<
  Relationship['transport'],
  { label: string; note: string; dash: string }
> = {
  circulation: {
    label: 'Blood-borne',
    note: 'A schematic blood-borne route. The line shows that the signal is carried in the circulation; it is not a depiction of a particular vessel.',
    dash: '',
  },
  portal: {
    label: 'Portal route',
    note: 'A schematic portal route: a short local circulation between two structures, drawn distinctly from general circulation.',
    dash: '6 3 1 3',
  },
  synaptic: {
    label: 'Neural',
    note: 'Neural communication between cells. It is drawn as a short discrete pathway and never styled as a blood vessel.',
    dash: '2 3',
  },
  local: {
    label: 'Local action',
    note: 'The signal acts near where it is released, so no long route is drawn.',
    dash: '1 4',
  },
  schematic: {
    label: 'Schematic communication',
    note: 'A schematic connection. The path shown is a teaching abstraction, not an anatomical route.',
    dash: '8 4',
  },
  'not-applicable': {
    label: 'No transport shown',
    note: 'This relationship does not describe something travelling, so no route is drawn.',
    dash: '4 4',
  },
};

const EFFECT: Record<Relationship['effect'], { label: string; terminal: EdgeTerminal }> = {
  stimulates: { label: 'stimulates', terminal: 'arrow' },
  inhibits: { label: 'inhibits', terminal: 'bar' },
  modulates: { label: 'modulates', terminal: 'diamond' },
  transports: { label: 'transports', terminal: 'arrow' },
  'associated-with': { label: 'associated with', terminal: 'none' },
  describes: { label: 'describes', terminal: 'none' },
};

export function presentEdge(relationship: Relationship): EdgePresentation {
  const transport = TRANSPORT[relationship.transport];
  const effect = EFFECT[relationship.effect];
  const associative = relationship.kind !== 'causal';
  return {
    effectLabel: effect.label,
    terminal: effect.terminal,
    // An association is always a dashed, non-directional connector.
    dash: associative ? '3 3' : transport.dash,
    transportLabel: transport.label,
    transportNote: transport.note,
    allowsPulse: relationship.kind === 'causal' && relationship.transport !== 'not-applicable',
    feedbackLabel: relationship.feedback ? 'feedback' : null,
    roleToken:
      relationship.effect === 'inhibits' ? 'inhibit' : associative ? 'uncertain' : 'route',
  };
}

/** A complete sentence for the transcript and for assistive technology. */
export function describeEdge(
  relationship: Relationship,
  sourceLabel: string,
  targetLabel: string,
): string {
  const presentation = presentEdge(relationship);
  const feedback = presentation.feedbackLabel === null ? '' : ', shown as feedback';
  return `${sourceLabel} ${presentation.effectLabel} ${targetLabel}. ${presentation.transportLabel}${feedback}.`;
}

/**
 * Deterministic pulse position derived from the cursor and route identifier. Document 06: pulse
 * progress is cosmetic emphasis and can never determine source or target activation.
 */
export function pulseProgress(routeId: string, cursorMs: number, periodMs = 2200): number {
  let hash = 0;
  for (const character of routeId) hash = (hash * 31 + character.charCodeAt(0)) % 9973;
  const offset = (hash % periodMs) / periodMs;
  return ((cursorMs % periodMs) / periodMs + offset) % 1;
}
