/**
 * The parts of the 3D renderer that can and should be checked without a GPU: the coordinate
 * convention, the camera bounds, label placement and quality adaptation.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  BODY_PRESETS,
  BRAIN_PRESETS,
  ORBIT_LIMITS,
  cameraRightVector,
  clampPose,
  facingDescription,
  fitPose,
  normaliseAngle,
  poseToPosition,
  type CameraPose,
} from '../../src/renderers/anatomy3d/coordinates.ts';
import {
  MAX_VISIBLE_LABELS,
  layoutLabels,
  toScreen,
  type LabelCandidate,
} from '../../src/renderers/anatomy3d/labels.ts';
import {
  QUALITY,
  QualityWatchdog,
  detectWebgl2,
  pixelRatioFor,
} from '../../src/renderers/anatomy3d/webgl.ts';

const FRONT = BODY_PRESETS[0]!.pose;

describe('coordinate convention', () => {
  it('places the default camera in front of the body, on the positive Z side', () => {
    const [x, y, z] = poseToPosition(FRONT);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeGreaterThan(0);
  });

  it("puts the body's own left on the viewer's right in the front view", () => {
    const right = cameraRightVector(FRONT);
    expect(right[0]).toBeCloseTo(1);
    expect(right[2]).toBeCloseTo(0);
    expect(facingDescription(FRONT.azimuth)).toContain('Anatomical left is on your right');
  });

  it("puts the body's own left on the viewer's left in the back view", () => {
    const back = BODY_PRESETS[1]!.pose;
    expect(cameraRightVector(back)[0]).toBeCloseTo(-1);
    expect(facingDescription(back.azimuth)).toContain('Anatomical left is on your left');
  });

  it('names the side that is facing the viewer for intermediate angles', () => {
    expect(facingDescription(Math.PI / 2)).toContain("body's left side");
    expect(facingDescription((3 * Math.PI) / 2)).toContain("body's right side");
  });

  it('frames the brain at the head, using the same orientation as the body', () => {
    expect(BRAIN_PRESETS[0]!.pose.target[1]).toBeGreaterThan(0.5);
    expect(cameraRightVector(BRAIN_PRESETS[0]!.pose)[0]).toBeCloseTo(1);
  });
});

describe('camera bounds', () => {
  it('keeps the body upright enough to stay oriented', () => {
    expect(clampPose({ ...FRONT, polar: -5 }).polar).toBe(ORBIT_LIMITS.minPolar);
    expect(clampPose({ ...FRONT, polar: 99 }).polar).toBe(ORBIT_LIMITS.maxPolar);
  });

  it('cannot zoom inside the nearest geometry or fly away from the body', () => {
    expect(clampPose({ ...FRONT, distance: 0.01 }).distance).toBe(ORBIT_LIMITS.minDistance);
    expect(clampPose({ ...FRONT, distance: 500 }).distance).toBe(ORBIT_LIMITS.maxDistance);
  });

  it('wraps the azimuth instead of drifting without bound', () => {
    expect(normaliseAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
    expect(clampPose({ ...FRONT, azimuth: 9 * Math.PI }).azimuth).toBeCloseTo(Math.PI);
  });

  it('fits a set of anchors without leaving the allowed distance range', () => {
    const pose: CameraPose = fitPose(
      [
        [0, 0.7, 0],
        [0.3, -0.3, 0],
      ],
      FRONT,
    );
    expect(pose.target[1]).toBeCloseTo(0.2);
    expect(pose.distance).toBeGreaterThanOrEqual(ORBIT_LIMITS.minDistance);
    expect(pose.distance).toBeLessThanOrEqual(ORBIT_LIMITS.maxDistance);
    expect(fitPose([], FRONT)).toEqual(FRONT);
  });
});

describe('label placement', () => {
  function candidate(overrides: Partial<LabelCandidate> & { id: string }): LabelCandidate {
    return {
      text: overrides.id,
      x: 0,
      y: 0,
      offscreen: false,
      role: 'none',
      ...overrides,
    };
  }

  it('draws at most eight labels and collapses the rest into the list', () => {
    const many = Array.from({ length: 14 }, (_, index) =>
      candidate({ id: `anat-${String(index)}`, y: index * 60 }),
    );
    const layout = layoutLabels(many);
    expect(layout.visible).toHaveLength(MAX_VISIBLE_LABELS);
    expect(layout.collapsed).toHaveLength(6);
  });

  it('prefers the selected region, then source, then target, then feedback', () => {
    const layout = layoutLabels([
      candidate({ id: 'anat-plain', role: 'none' }),
      candidate({ id: 'anat-target', role: 'target' }),
      candidate({ id: 'anat-selected', role: 'selected' }),
      candidate({ id: 'anat-source', role: 'source' }),
    ]);
    // They all sit on the same point, so only the highest priority survives the collision.
    expect(layout.visible.map((label) => label.id)).toEqual(['anat-selected']);
    expect(layout.collapsed.map((label) => label.id)).toEqual([
      'anat-source',
      'anat-target',
      'anat-plain',
    ]);
  });

  it('collapses a label whose region is behind the camera', () => {
    const layout = layoutLabels([candidate({ id: 'anat-behind', offscreen: true })]);
    expect(layout.visible).toHaveLength(0);
    expect(layout.collapsed.map((label) => label.id)).toEqual(['anat-behind']);
  });

  it('keeps labels that are far enough apart', () => {
    const layout = layoutLabels([
      candidate({ id: 'anat-a', x: 0, y: 0 }),
      candidate({ id: 'anat-b', x: 400, y: 300 }),
    ]);
    expect(layout.visible).toHaveLength(2);
  });

  it('converts normalised device coordinates into CSS pixels', () => {
    const projected = toScreen(() => ({ x: 0, y: 0, z: 0.5 }), [0, 0, 0], 800, 600);
    expect(projected).toEqual({ x: 400, y: 300, offscreen: false });

    const behind = toScreen(() => ({ x: 0, y: 0, z: 1.4 }), [0, 0, 0], 800, 600);
    expect(behind.offscreen).toBe(true);
  });
});

describe('quality adaptation', () => {
  it('caps the device pixel ratio', () => {
    expect(pixelRatioFor('normal', 3)).toBe(2);
    expect(pixelRatioFor('low', 3)).toBe(1.5);
    expect(pixelRatioFor('normal', 1)).toBe(1);
  });

  it('downgrades once after sustained slow frames, and never flips back', () => {
    const onDowngrade = vi.fn();
    const watchdog = new QualityWatchdog(onDowngrade);

    watchdog.observe(QUALITY.slowFrameMs + 10, 0);
    watchdog.observe(QUALITY.slowFrameMs + 10, QUALITY.slowWindowMs - 1);
    expect(onDowngrade).not.toHaveBeenCalled();

    watchdog.observe(QUALITY.slowFrameMs + 10, QUALITY.slowWindowMs);
    expect(onDowngrade).toHaveBeenCalledTimes(1);
    expect(watchdog.hasDowngraded).toBe(true);

    watchdog.observe(QUALITY.slowFrameMs + 50, QUALITY.slowWindowMs * 4);
    expect(onDowngrade).toHaveBeenCalledTimes(1);
  });

  it('forgets a slow patch that recovers', () => {
    const onDowngrade = vi.fn();
    const watchdog = new QualityWatchdog(onDowngrade);
    watchdog.observe(80, 0);
    watchdog.observe(10, 1000);
    watchdog.observe(80, 2000);
    watchdog.observe(80, 6500);
    expect(onDowngrade).not.toHaveBeenCalled();
  });
});

describe('webgl detection', () => {
  it('reports unsupported when no context can be created', () => {
    expect(
      detectWebgl2(() => ({ getContext: () => null }) as unknown as HTMLCanvasElement),
    ).toBe('unsupported');
  });

  it('reports webgl2 when a context is available', () => {
    expect(
      detectWebgl2(() => ({ getContext: () => ({}) }) as unknown as HTMLCanvasElement),
    ).toBe('webgl2');
  });

  it('treats a throwing canvas as unsupported rather than crashing the lesson', () => {
    expect(
      detectWebgl2(() => {
        throw new Error('blocked');
      }),
    ).toBe('unsupported');
  });
});
