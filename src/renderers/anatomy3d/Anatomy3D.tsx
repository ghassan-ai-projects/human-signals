/**
 * The 3D anatomy renderer.
 *
 * It draws the same semantic frame as the 2D diagram: highlights come from the frame, routes
 * come from authored anchors and control points, and nothing here infers physiology. The scene
 * is lazy-loaded, renders on demand while paused, and hands control back to the 2D diagram if
 * WebGL is unavailable or its context is lost (documents 07 and 10).
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Vector3, type PerspectiveCamera } from 'three';
import type { Anatomy, Relationship } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import type { Frame } from '../../engine/frame.ts';
import { presentEdge } from '../shared/edge-presentation.ts';
import {
  BODY_DEFAULT_POSE,
  BODY_PRESETS,
  BRAIN_DEFAULT_POSE,
  BRAIN_PRESETS,
  ORBIT_LIMITS,
  clampPose,
  facingDescription,
  poseToPosition,
  type CameraPose,
  type Vec3,
} from './coordinates.ts';
import { layoutLabels, toScreen, type LabelCandidate } from './labels.ts';
import { pixelRatioFor, QualityWatchdog } from './webgl.ts';
import { BodyShell, BrainShell, RegionMesh, RouteMesh, type PlacedRegion } from './scene-parts.tsx';
import { BodyModel, type BodyModelState } from './BodyModel.tsx';
import styles from './Anatomy3D.module.css';

export interface Anatomy3DProps {
  repository: ContentRepository;
  frame: Frame;
  view: 'body' | 'brain';
  selectedId: string | null;
  reducedMotion: boolean;
  playing: boolean;
  onSelect: (anatomyId: string) => void;
  onOpenRelationship?: (relationshipId: string) => void;
  onContextLost: () => void;
  onAssetLoadFailure: () => void;
  onChangeView?: (view: 'body' | 'brain') => void;
}

interface LabelBinding {
  element: HTMLElement | null;
}

/** Applies the pose to the camera and turns pointer and wheel input into bounded orbiting. */
function CameraRig({
  pose,
  onPose,
}: {
  pose: CameraPose;
  onPose: (pose: CameraPose) => void;
}): null {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const domElement = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const poseRef = useRef(pose);
  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);

  useEffect(() => {
    const position = poseToPosition(pose);
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(new Vector3(...pose.target));
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, pose, invalidate]);

  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent): void => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      onPose(
        clampPose({
          ...poseRef.current,
          azimuth: poseRef.current.azimuth - dx * 0.006,
          polar: poseRef.current.polar - dy * 0.006,
        }),
      );
    };
    const endDrag = (event: PointerEvent): void => {
      dragging = false;
      if (domElement.hasPointerCapture(event.pointerId)) {
        domElement.releasePointerCapture(event.pointerId);
      }
    };
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      onPose(
        clampPose({
          ...poseRef.current,
          distance: poseRef.current.distance + Math.sign(event.deltaY) * 0.25,
        }),
      );
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', endDrag);
    domElement.addEventListener('pointercancel', endDrag);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', endDrag);
      domElement.removeEventListener('pointercancel', endDrag);
      domElement.removeEventListener('wheel', onWheel);
    };
  }, [domElement, onPose]);

  return null;
}

/**
 * Projects region positions into screen space and positions the HTML labels directly, so label
 * movement never re-renders React at frame rate.
 */
function LabelProjector({
  regions,
  bindings,
  onCollapsedChange,
  onQualityDowngrade,
}: {
  regions: PlacedRegion[];
  bindings: React.RefObject<Map<string, LabelBinding>>;
  onCollapsedChange: (ids: string[]) => void;
  onQualityDowngrade: () => void;
}): null {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const lastCollapsed = useRef('');
  const watchdog = useMemo(() => new QualityWatchdog(onQualityDowngrade), [onQualityDowngrade]);

  /*
   * Deliberately imperative: label positions are written straight to the DOM so that moving the
   * camera never re-renders React at frame rate. The React Compiler rules below are about React
   * state, which this loop does not touch.
   */
  /* eslint-disable react-hooks/immutability */
  useFrame((_state, delta) => {
    watchdog.observe(delta * 1000, performance.now());

    const candidates: LabelCandidate[] = regions.map((region) => {
      const projected = toScreen(
        (point) => {
          const vector = new Vector3(...point).project(camera);
          return { x: vector.x, y: vector.y, z: vector.z };
        },
        region.position,
        size.width,
        size.height,
      );
      return {
        id: region.record.id,
        text: region.record.label,
        x: projected.x,
        y: projected.y,
        offscreen: projected.offscreen,
        role: region.selected ? 'selected' : region.highlight === 'none' ? 'none' : region.highlight,
      };
    });

    const layout = layoutLabels(candidates);
    const visibleIds = new Set(layout.visible.map((label) => label.id));

    for (const [id, binding] of bindings.current) {
      const element = binding.element;
      if (!element) continue;
      const label = layout.visible.find((item) => item.id === id);
      if (!label || !visibleIds.has(id)) {
        element.hidden = true;
        continue;
      }
      element.hidden = false;
      element.style.transform = `translate3d(${String(Math.round(label.x))}px, ${String(Math.round(label.y))}px, 0)`;
    }

    const collapsedKey = layout.collapsed.map((label) => label.id).join('|');
    if (collapsedKey !== lastCollapsed.current) {
      lastCollapsed.current = collapsedKey;
      onCollapsedChange(layout.collapsed.map((label) => label.id));
    }
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}

export default function Anatomy3D({
  repository,
  frame,
  view,
  selectedId,
  reducedMotion,
  playing,
  onSelect,
  onOpenRelationship,
  onContextLost,
  onAssetLoadFailure,
  onChangeView,
}: Anatomy3DProps): React.JSX.Element {
  const presets = view === 'body' ? BODY_PRESETS : BRAIN_PRESETS;
  const defaultPose = view === 'body' ? BODY_DEFAULT_POSE : BRAIN_DEFAULT_POSE;
  const [pose, setPose] = useState<CameraPose>(defaultPose);
  const [quality, setQuality] = useState<'normal' | 'low'>('normal');
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [bodyModelState, setBodyModelState] = useState<BodyModelState>('loading');
  const bindings = useRef(new Map<string, LabelBinding>());

  const bodyAsset = repository.bundle.assets.find((asset) => asset.kind === 'body-model');

  // Each view keeps its own last orientation during a session (document 07).
  const poseByView = useRef<Record<'body' | 'brain', CameraPose>>({
    body: BODY_DEFAULT_POSE,
    brain: BRAIN_DEFAULT_POSE,
  });
  useEffect(() => {
    setPose(poseByView.current[view]);
  }, [view]);
  const updatePose = useCallback(
    (next: CameraPose) => {
      poseByView.current = { ...poseByView.current, [view]: next };
      setPose(next);
    },
    [view],
  );

  const regions = useMemo<PlacedRegion[]>(() => {
    return repository.bundle.anatomy
      .filter((record: Anatomy) => record.view === view)
      .map((record) => {
        const anchor = repository.getAnchor(record.anchorId);
        return {
          record,
          position: anchor?.position ?? ([0, 0, 0] as Vec3),
          highlight: frame.highlights[record.id] ?? 'none',
          selected: selectedId === record.id,
        };
      });
  }, [repository, view, frame.highlights, selectedId]);

  const routes = useMemo(() => {
    const positionOf = new Map(regions.map((region) => [region.record.id, region.position]));
    return frame.visibleRelationshipIds
      .map((id) => repository.getRelationship(id))
      .filter((relationship): relationship is Relationship => relationship !== undefined)
      .flatMap((relationship) => {
        const from = positionOf.get(relationship.source.id);
        const to = positionOf.get(relationship.target.id);
        if (!from || !to) return [];
        const route = relationship.routeId === undefined ? undefined : repository.getRoute(relationship.routeId);
        return [
          {
            relationship,
            from,
            to,
            controlPoints: route?.controlPoints ?? [],
          },
        ];
      });
  }, [frame.visibleRelationshipIds, regions, repository]);

  const collapsed = regions.filter((region) => collapsedIds.includes(region.record.id));

  return (
    <div className={styles.wrapper}>
      <div className={styles.canvasHolder}>
        <Canvas
          className={styles.canvas}
          frameloop={playing && !reducedMotion ? 'always' : 'demand'}
          dpr={pixelRatioFor(quality, globalThis.devicePixelRatio || 1)}
          camera={{ fov: 38, near: 0.1, far: 40 }}
          gl={{ antialias: quality === 'normal', powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              onContextLost();
            });
          }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[1.5, 2.4, 2.2]} intensity={1.1} />
          <directionalLight position={[-2, 0.5, -1.5]} intensity={0.35} />
          <CameraRig pose={pose} onPose={updatePose} />
          <LabelProjector
            regions={regions}
            bindings={bindings}
            onCollapsedChange={setCollapsedIds}
            onQualityDowngrade={() => {
              setQuality('low');
            }}
          />
          {view === 'body' && bodyAsset !== undefined && (
            <BodyModel
              asset={bodyAsset}
              onStateChange={setBodyModelState}
              onFailure={onAssetLoadFailure}
            />
          )}
          {view === 'body' && (bodyAsset === undefined || bodyModelState !== 'ready') && <BodyShell />}
          {view === 'brain' && <BrainShell />}
          {regions.map((region) => (
            <RegionMesh
              key={region.record.id}
              region={region}
              onSelect={onSelect}
              onHover={setHoveredId}
            />
          ))}
          {routes.map((route) => (
            <RouteMesh
              key={route.relationship.id}
              relationship={route.relationship}
              from={route.from}
              to={route.to}
              controlPoints={route.controlPoints}
              cursorMs={frame.cursorMs}
              reducedMotion={reducedMotion}
            />
          ))}
        </Canvas>

        <div className={styles.labelLayer} aria-hidden="true">
          {regions.map((region) => (
            <span
              key={region.record.id}
              className={styles.label}
              data-role={region.selected ? 'selected' : region.highlight}
              ref={(element) => {
                bindings.current.set(region.record.id, { element });
              }}
            >
              {region.record.label}
            </span>
          ))}
        </div>

        {view === 'body' && bodyAsset !== undefined && bodyModelState === 'loading' && (
          <p className={styles.modelNote} role="status">
            Loading the body model…
          </p>
        )}

        {hoveredId !== null && (
          <p className={styles.hover} role="status">
            {repository.labelOf(hoveredId)}
          </p>
        )}
      </div>

      <div className={styles.controls}>
        <p className={styles.orientation} role="status">
          {facingDescription(pose.azimuth)}
        </p>
        <div className={styles.buttonRow}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                updatePose(preset.pose);
              }}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
          {onChangeView && (
            <button
              type="button"
              onClick={() => {
                onChangeView(view === 'body' ? 'brain' : 'body');
              }}
            >
              {view === 'body' ? 'View the brain' : 'Back to the body'}
            </button>
          )}
        </div>
        <div className={styles.buttonRow}>
          <button
            type="button"
            onClick={() => {
              updatePose(clampPose({ ...pose, azimuth: pose.azimuth + 0.35 }));
            }}
          >
            Rotate left
          </button>
          <button
            type="button"
            onClick={() => {
              updatePose(clampPose({ ...pose, azimuth: pose.azimuth - 0.35 }));
            }}
          >
            Rotate right
          </button>
          <button
            type="button"
            onClick={() => {
              updatePose(clampPose({ ...pose, polar: pose.polar - 0.2 }));
            }}
          >
            Tilt up
          </button>
          <button
            type="button"
            onClick={() => {
              updatePose(clampPose({ ...pose, polar: pose.polar + 0.2 }));
            }}
          >
            Tilt down
          </button>
          <button
            type="button"
            onClick={() => {
              updatePose(clampPose({ ...pose, distance: pose.distance - 0.4 }));
            }}
            disabled={pose.distance <= ORBIT_LIMITS.minDistance}
          >
            Zoom in
          </button>
          <button
            type="button"
            onClick={() => {
              updatePose(clampPose({ ...pose, distance: pose.distance + 0.4 }));
            }}
            disabled={pose.distance >= ORBIT_LIMITS.maxDistance}
          >
            Zoom out
          </button>
        </div>

        {quality === 'low' && (
          <p className={styles.qualityNote} role="status">
            The scene was simplified to keep it responsive on this device. Every relationship and
            label is still shown.
          </p>
        )}

        {collapsed.length > 0 && (
          <details className={styles.collapsed}>
            <summary>{collapsed.length} more labels</summary>
            <ul>
              {collapsed.map((region) => (
                <li key={region.record.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(region.record.id);
                    }}
                  >
                    {region.record.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}

        {routes.length > 0 && (
          <ul className={styles.routeLegend}>
            {routes.map(({ relationship }) => {
              const presentation = presentEdge(relationship);
              return (
                <li key={relationship.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenRelationship?.(relationship.id);
                    }}
                    disabled={!onOpenRelationship}
                  >
                    Why: {relationship.label}
                  </button>
                  <span>
                    {presentation.effectLabel} · {presentation.transportLabel}
                    {presentation.feedbackLabel === null ? '' : ' · feedback'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
