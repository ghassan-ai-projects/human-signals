/**
 * The coordinate convention from document 07, and the camera work that depends on it.
 *
 * The body is normalised to a height of two world units. The origin is the midpoint of the
 * standing body's bounding box. `+Y` is superior, `+X` is the body's own left, `+Z` is anterior.
 * The default front camera therefore looks from positive Z, which puts anatomical left on the
 * viewer's right — the same convention the labels state in words.
 *
 * Nothing here imports Three.js: it is plain vector maths, so it can be tested without WebGL.
 */
export type Vec3 = readonly [number, number, number];

export const BODY_HEIGHT = 2;
export const BODY_BOUNDS = {
  min: [-0.55, -1, -0.3] as Vec3,
  max: [0.55, 1, 0.3] as Vec3,
};

/** Orbit limits keep the body upright enough to stay oriented, and out of the geometry. */
export const ORBIT_LIMITS = {
  minPolar: 0.55,
  maxPolar: 2.3,
  minDistance: 1.6,
  maxDistance: 6,
};

export interface CameraPose {
  /** Azimuth in radians, measured from +Z towards +X. */
  azimuth: number;
  /** Polar angle in radians, measured from +Y. */
  polar: number;
  distance: number;
  target: Vec3;
}

export interface CameraPreset {
  id: string;
  label: string;
  /** Spoken orientation, so front and back are never guessed from the picture. */
  description: string;
  pose: CameraPose;
}

const HALF_PI = Math.PI / 2;

export const BODY_DEFAULT_POSE: CameraPose = {
  azimuth: 0,
  polar: HALF_PI,
  distance: 3.2,
  target: [0, 0, 0],
};

export const BRAIN_DEFAULT_POSE: CameraPose = {
  azimuth: 0,
  polar: HALF_PI,
  distance: 1.5,
  target: [0, 0.78, 0],
};

export const BODY_PRESETS: CameraPreset[] = [
  {
    id: 'front',
    label: 'Front view',
    description: 'Looking at the front of the body. Anatomical left is on your right.',
    pose: BODY_DEFAULT_POSE,
  },
  {
    id: 'back',
    label: 'Back view',
    description: 'Looking at the back of the body. Anatomical left is on your left.',
    pose: { azimuth: Math.PI, polar: HALF_PI, distance: 3.2, target: [0, 0, 0] },
  },
  {
    id: 'reset',
    label: 'Reset view',
    description: 'Back to the default framing of the whole body.',
    pose: BODY_DEFAULT_POSE,
  },
];

export const BRAIN_PRESETS: CameraPreset[] = [
  {
    id: 'default',
    label: 'Default view',
    description: 'Looking at the front of the brain, in the same orientation as the body.',
    pose: BRAIN_DEFAULT_POSE,
  },
  {
    id: 'lateral',
    label: 'Side view',
    description: "Looking at the brain from the body's left side.",
    pose: { azimuth: HALF_PI, polar: HALF_PI, distance: 1.5, target: [0, 0.78, 0] },
  },
  {
    id: 'reset',
    label: 'Reset view',
    description: 'Back to the default framing of the brain.',
    pose: BRAIN_DEFAULT_POSE,
  },
];

export function clampPose(pose: CameraPose): CameraPose {
  return {
    azimuth: normaliseAngle(pose.azimuth),
    polar: clamp(pose.polar, ORBIT_LIMITS.minPolar, ORBIT_LIMITS.maxPolar),
    distance: clamp(pose.distance, ORBIT_LIMITS.minDistance, ORBIT_LIMITS.maxDistance),
    target: pose.target,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normaliseAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/** Spherical pose to a camera position in world space. */
export function poseToPosition(pose: CameraPose): Vec3 {
  const sinPolar = Math.sin(pose.polar);
  return [
    pose.target[0] + pose.distance * sinPolar * Math.sin(pose.azimuth),
    pose.target[1] + pose.distance * Math.cos(pose.polar),
    pose.target[2] + pose.distance * sinPolar * Math.cos(pose.azimuth),
  ];
}

/**
 * Which side of the body faces the viewer. Left and right are always the body's own, so the
 * caption can say so rather than leaving the learner to infer it (document 02).
 */
export function facingDescription(azimuth: number): string {
  const angle = normaliseAngle(azimuth);
  if (angle < Math.PI / 4 || angle > (7 * Math.PI) / 4) {
    return 'Front of the body. Anatomical left is on your right.';
  }
  if (angle < (3 * Math.PI) / 4) return "The body's left side is facing you.";
  if (angle < (5 * Math.PI) / 4) {
    return 'Back of the body. Anatomical left is on your left.';
  }
  return "The body's right side is facing you.";
}

/** Frames a set of anchor positions, leaving room for the panels that overlay the viewport. */
export function fitPose(points: readonly Vec3[], base: CameraPose, padding = 1.9): CameraPose {
  if (points.length === 0) return base;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const [x, y, z] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  const target: Vec3 = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
  const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 0.4);
  return clampPose({ ...base, target, distance: extent * padding + 1 });
}

/**
 * The camera's right-hand direction in world space, with world up as +Y.
 *
 * This is what makes the laterality promise checkable: at the front preset the camera's right
 * is +X, which is the body's own left, so "anatomical left is on your right" is a fact about the
 * convention rather than a caption someone remembered to write.
 */
export function cameraRightVector(pose: CameraPose): Vec3 {
  const position = poseToPosition(pose);
  const forward: Vec3 = [
    pose.target[0] - position[0],
    pose.target[1] - position[1],
    pose.target[2] - position[2],
  ];
  const up: Vec3 = [0, 1, 0];
  const right: Vec3 = [
    forward[1] * up[2] - forward[2] * up[1],
    forward[2] * up[0] - forward[0] * up[2],
    forward[0] * up[1] - forward[1] * up[0],
  ];
  const length = Math.hypot(right[0], right[1], right[2]) || 1;
  return [right[0] / length, right[1] / length, right[2] / length];
}
