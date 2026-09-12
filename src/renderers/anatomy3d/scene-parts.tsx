/**
 * The drawable parts of the 3D scene.
 *
 * Document 07: R1 starts from project-authored primitive meshes and semantic anchors, so the
 * renderer never depends on an unlicensed asset and never lets mesh names dictate anatomy. The
 * body shell is deliberately schematic and says so; it is not a claim about a particular body.
 */
import { useMemo } from 'react';
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  TubeGeometry,
  Vector3,
  type Mesh,
} from 'three';
import type { Anatomy, Highlight, Relationship } from '../../content/schema.ts';
import { presentEdge, pulseProgress } from '../shared/edge-presentation.ts';
import type { Vec3 } from './coordinates.ts';

/** Role colours mirror the 2D tokens; shape and label carry the same meaning without colour. */
export const ROLE_COLOR: Record<Highlight, string> = {
  none: '#94a0b4',
  source: '#6d28d9',
  target: '#0d6e66',
  active: '#1d4ed8',
};

export const EDGE_COLOR = {
  route: '#1d4ed8',
  inhibit: '#a1420a',
  uncertain: '#64748b',
};

export interface PlacedRegion {
  record: Anatomy;
  position: Vec3;
  highlight: Highlight;
  selected: boolean;
}

/**
 * The schematic body. Transparent shell geometry must never intercept organ selection, so every
 * shell mesh opts out of raycasting entirely (document 07, occlusion and picking).
 */
export function BodyShell(): React.JSX.Element {
  const noPick = (): null => null;
  const shell = (
    <meshStandardMaterial
      color="#c9d3e4"
      transparent
      opacity={0.18}
      depthWrite={false}
      roughness={0.9}
      side={DoubleSide}
    />
  );
  return (
    <group>
      {/* Head and neck */}
      <mesh position={[0, 0.84, 0]} raycast={noPick}>
        <sphereGeometry args={[0.135, 24, 18]} />
        {shell}
      </mesh>
      <mesh position={[0, 0.68, 0]} raycast={noPick}>
        <capsuleGeometry args={[0.055, 0.08, 4, 12]} />
        {shell}
      </mesh>
      {/* Chest and abdomen */}
      <mesh position={[0, 0.34, 0]} scale={[1, 1, 0.62]} raycast={noPick}>
        <capsuleGeometry args={[0.22, 0.32, 6, 20]} />
        {shell}
      </mesh>
      <mesh position={[0, -0.05, 0]} scale={[1, 1, 0.62]} raycast={noPick}>
        <capsuleGeometry args={[0.2, 0.24, 6, 20]} />
        {shell}
      </mesh>
      {/* Arms: anatomical left is +X, which the front camera puts on the viewer's right. */}
      {[-0.3, 0.3].map((x) => (
        <mesh
          key={x}
          position={[x, 0.28, 0]}
          rotation={[0, 0, x > 0 ? -0.14 : 0.14]}
          raycast={noPick}
        >
          <capsuleGeometry args={[0.055, 0.62, 4, 12]} />
          {shell}
        </mesh>
      ))}
      {/* Legs */}
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, -0.6, 0]} raycast={noPick}>
          <capsuleGeometry args={[0.075, 0.62, 4, 12]} />
          {shell}
        </mesh>
      ))}
    </group>
  );
}

export function BrainShell(): React.JSX.Element {
  const noPick = (): null => null;
  return (
    <group position={[0, 0.78, 0]}>
      <mesh raycast={noPick}>
        <sphereGeometry args={[0.36, 28, 20]} />
        <meshStandardMaterial color="#c9d3e4" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.32, -0.04]} raycast={noPick}>
        <capsuleGeometry args={[0.07, 0.18, 4, 10]} />
        <meshStandardMaterial color="#c9d3e4" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

export interface RegionMeshProps {
  region: PlacedRegion;
  onSelect: (anatomyId: string) => void;
  onHover: (anatomyId: string | null) => void;
}

/**
 * One region: a small visible marker plus a larger invisible hit sphere, because touch
 * exploration must not require precision picking of a structure the size of a pea.
 */
export function RegionMesh({ region, onSelect, onHover }: RegionMeshProps): React.JSX.Element {
  const color = ROLE_COLOR[region.highlight];
  const radius = region.highlight === 'none' ? 0.045 : 0.06;
  const [x, y, z] = region.position;
  return (
    <group position={[x, y, z]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(region.record.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(region.record.id);
        }}
        onPointerOut={() => {
          onHover(null);
        }}
      >
        <sphereGeometry args={[0.11, 12, 10]} />
        {/* Fully transparent but still pickable: a generous target for touch and mouse. */}
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[radius, 20, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={new Color(color)}
          emissiveIntensity={region.highlight === 'none' ? 0.05 : 0.35}
          roughness={0.45}
        />
      </mesh>
      {region.selected && (
        <mesh raycast={() => null}>
          <sphereGeometry args={[radius + 0.035, 20, 16]} />
          <meshBasicMaterial color="#1d4ed8" wireframe />
        </mesh>
      )}
    </group>
  );
}

export interface RouteMeshProps {
  relationship: Relationship;
  from: Vec3;
  to: Vec3;
  controlPoints: readonly Vec3[];
  cursorMs: number;
  reducedMotion: boolean;
}

/** A schematic route between two anchors, with its sign drawn at the target end. */
export function RouteMesh({
  relationship,
  from,
  to,
  controlPoints,
  cursorMs,
  reducedMotion,
}: RouteMeshProps): React.JSX.Element {
  const presentation = presentEdge(relationship);
  const color =
    presentation.roleToken === 'inhibit'
      ? EDGE_COLOR.inhibit
      : presentation.roleToken === 'uncertain'
        ? EDGE_COLOR.uncertain
        : EDGE_COLOR.route;

  const curve = useMemo(() => {
    const points = [
      new Vector3(...from),
      ...controlPoints.map((point) => new Vector3(...point)),
      new Vector3(...to),
    ];
    return new CatmullRomCurve3(points, false, 'catmullrom', 0.4);
  }, [from, to, controlPoints]);

  const geometry = useMemo(() => new TubeGeometry(curve, 40, 0.011, 6, false), [curve]);

  // Pulse position comes from the cursor and the route identifier, never from a private clock,
  // so the same cursor always shows the same picture.
  const pulse = presentation.allowsPulse && !reducedMotion ? pulseProgress(relationship.id, cursorMs) : null;
  const pulsePoint = pulse === null ? null : curve.getPointAt(Math.min(Math.max(pulse, 0), 1));
  const endPoint = curve.getPointAt(1);
  const approach = curve.getTangentAt(0.98);

  return (
    <group>
      <mesh geometry={geometry} raycast={() => null}>
        <meshStandardMaterial color={color} emissive={new Color(color)} emissiveIntensity={0.25} />
      </mesh>

      {/* The sign is a shape at the target end: a cone for stimulates, a plate for inhibits. */}
      {presentation.terminal === 'arrow' && (
        <mesh
          position={endPoint}
          quaternion={quaternionFromDirection(approach)}
          raycast={() => null}
        >
          <coneGeometry args={[0.032, 0.075, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {presentation.terminal === 'bar' && (
        <mesh
          position={endPoint}
          quaternion={quaternionFromDirection(approach)}
          raycast={() => null}
        >
          <boxGeometry args={[0.085, 0.018, 0.085]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {presentation.terminal === 'diamond' && (
        <mesh position={endPoint} raycast={() => null}>
          <octahedronGeometry args={[0.04]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}

      {pulsePoint && (
        <mesh position={pulsePoint} raycast={() => null}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

/** Points a cone or plate along the incoming direction of the route. */
function quaternionFromDirection(direction: Vector3): [number, number, number, number] {
  const up = new Vector3(0, 1, 0);
  const normalised = direction.clone().normalize();
  const dot = up.dot(normalised);
  if (dot > 0.9999) return [0, 0, 0, 1];
  if (dot < -0.9999) return [1, 0, 0, 0];
  const axis = new Vector3().crossVectors(up, normalised).normalize();
  const angle = Math.acos(dot);
  const half = Math.sin(angle / 2);
  return [axis.x * half, axis.y * half, axis.z * half, Math.cos(angle / 2)];
}

/** Disposes geometries and materials a scene created, so repeated transitions do not leak. */
export function disposeMesh(mesh: Mesh): void {
  mesh.geometry.dispose();
  const material = mesh.material;
  if (Array.isArray(material)) for (const item of material) item.dispose();
  else material.dispose();
}
