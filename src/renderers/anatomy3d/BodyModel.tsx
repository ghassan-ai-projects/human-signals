import { useEffect, useState } from 'react';
import { DoubleSide, type Group, type Material, type Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Asset } from '../../content/schema.ts';
import { loadVerifiedAsset } from './asset-loader.ts';

export type BodyModelState = 'loading' | 'ready' | 'failed';

interface BodyModelProps {
  asset: Asset;
  onStateChange: (state: BodyModelState) => void;
  onFailure: () => void;
}

function styleBodyMaterial(material: Material): void {
  if (!('transparent' in material)) return;
  const bodyMaterial = material as Material & {
    transparent: boolean;
    opacity: number;
    depthWrite: boolean;
    side: number;
  };
  bodyMaterial.transparent = true;
  bodyMaterial.opacity = 0.38;
  bodyMaterial.depthWrite = false;
  bodyMaterial.side = DoubleSide;
}

function disposeScene(scene: Group): void {
  scene.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) material.dispose();
  });
}

export function BodyModel({ asset, onStateChange, onFailure }: BodyModelProps): React.JSX.Element | null {
  const [scene, setScene] = useState<Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedScene: Group | null = null;
    const controller = new AbortController();
    onStateChange('loading');

    const loader = new GLTFLoader();
    loadVerifiedAsset(asset, { signal: controller.signal })
      .then(
        (bytes) =>
          new Promise<Group>((resolve, reject) => {
            loader.parse(
              bytes,
              '',
              (result) => {
                resolve(result.scene);
              },
              (error) => {
                reject(error instanceof Error ? error : new Error('model could not be decoded'));
              },
            );
          }),
      )
      .then((nextScene) => {
        if (cancelled) {
          disposeScene(nextScene);
          return;
        }
        nextScene.traverse((child) => {
          const mesh = child as Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) styleBodyMaterial(material);
        });
        loadedScene = nextScene;
        setScene(nextScene);
        onStateChange('ready');
      })
      .catch(() => {
        if (cancelled) return;
        onStateChange('failed');
        onFailure();
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (loadedScene !== null) disposeScene(loadedScene);
    };
  }, [asset, onFailure, onStateChange]);

  if (scene === null) return null;
  return <primitive object={scene} />;
}
