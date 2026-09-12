/**
 * Label placement rules from document 07.
 *
 * No more than eight labels are drawn at once. When they collide, the selected region wins,
 * then the current source and target, then active feedback; everything else collapses into a
 * list that is always present, so a hidden label never hides a relationship.
 *
 * This is pure screen-space maths so it can be tested without a renderer.
 */
export interface LabelCandidate {
  id: string;
  text: string;
  /** Screen position in CSS pixels. */
  x: number;
  y: number;
  /** True when the region is behind the camera or clipped. */
  offscreen: boolean;
  role: 'selected' | 'source' | 'target' | 'active' | 'feedback' | 'none';
}

export interface PlacedLabel extends LabelCandidate {
  priority: number;
}

export const MAX_VISIBLE_LABELS = 8;
export const LABEL_WIDTH = 132;
export const LABEL_HEIGHT = 26;

const ROLE_PRIORITY: Record<LabelCandidate['role'], number> = {
  selected: 0,
  source: 1,
  target: 2,
  feedback: 3,
  active: 4,
  none: 5,
};

function overlaps(a: LabelCandidate, b: LabelCandidate): boolean {
  return (
    Math.abs(a.x - b.x) < LABEL_WIDTH * 0.85 && Math.abs(a.y - b.y) < LABEL_HEIGHT * 1.1
  );
}

export interface LabelLayout {
  visible: PlacedLabel[];
  /** Everything that could not be drawn. The list beside the scene always shows these. */
  collapsed: PlacedLabel[];
}

export function layoutLabels(candidates: readonly LabelCandidate[]): LabelLayout {
  const ranked: PlacedLabel[] = candidates
    .map((candidate) => ({ ...candidate, priority: ROLE_PRIORITY[candidate.role] }))
    .sort((a, b) => a.priority - b.priority || a.y - b.y || a.id.localeCompare(b.id));

  const visible: PlacedLabel[] = [];
  const collapsed: PlacedLabel[] = [];

  for (const label of ranked) {
    if (label.offscreen) {
      collapsed.push(label);
      continue;
    }
    if (visible.length >= MAX_VISIBLE_LABELS) {
      collapsed.push(label);
      continue;
    }
    if (visible.some((placed) => overlaps(placed, label))) {
      collapsed.push(label);
      continue;
    }
    visible.push(label);
  }

  return { visible, collapsed };
}

/**
 * Projects a world point into CSS pixels. `project` is supplied by the caller so this stays free
 * of Three.js; it returns normalised device coordinates plus a depth.
 */
export function toScreen(
  project: (point: readonly [number, number, number]) => { x: number; y: number; z: number },
  point: readonly [number, number, number],
  width: number,
  height: number,
): { x: number; y: number; offscreen: boolean } {
  const ndc = project(point);
  return {
    x: (ndc.x * 0.5 + 0.5) * width,
    y: (-ndc.y * 0.5 + 0.5) * height,
    offscreen: ndc.z > 1 || ndc.z < -1 || Math.abs(ndc.x) > 1.05 || Math.abs(ndc.y) > 1.05,
  };
}
