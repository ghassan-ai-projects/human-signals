#!/usr/bin/env node
/**
 * Convert the body group from a pinned MakeHuman OBJ export into a small, deterministic GLB.
 *
 * This is an import-time tool, not a runtime dependency. It intentionally keeps the body as a
 * single translucent surface: Human Signals' semantic anchors and routes remain authored data,
 * never mesh-name guesses. The input is expected to be the official MakeHuman base mesh.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/convert-makehuman-obj.mjs <input.obj> <output.glb>');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const source = readFileSync(inputPath, 'utf8');

const positions = [];
const faces = [];
let group = '';
for (const line of source.split(/\r?\n/u)) {
  if (line.startsWith('v ')) {
    const [, x, y, z] = line.trim().split(/\s+/u);
    positions.push([Number(x), Number(y), Number(z)]);
    continue;
  }
  if (line.startsWith('g ')) {
    group = line.trim().slice(2);
    continue;
  }
  if (!line.startsWith('f ') || group !== 'body') continue;

  const indices = line
    .trim()
    .split(/\s+/u)
    .slice(1)
    .map((token) => {
      const raw = Number(token.split('/')[0]);
      return raw < 0 ? positions.length + raw : raw - 1;
    });
  for (let index = 1; index < indices.length - 1; index += 1) {
    faces.push([indices[0], indices[index], indices[index + 1]]);
  }
}

if (faces.length === 0) throw new Error('The input OBJ has no g body faces.');

const used = new Map();
const remappedFaces = faces.map((face) =>
  face.map((sourceIndex) => {
    const existing = used.get(sourceIndex);
    if (existing !== undefined) return existing;
    const next = used.size;
    used.set(sourceIndex, next);
    return next;
  }),
);

const bodyPositions = [...used.entries()]
  .sort((a, b) => a[1] - b[1])
  .map(([sourceIndex]) => positions[sourceIndex]);
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (const point of bodyPositions) {
  for (let axis = 0; axis < 3; axis += 1) {
    min[axis] = Math.min(min[axis], point[axis]);
    max[axis] = Math.max(max[axis], point[axis]);
  }
}
const height = max[1] - min[1];
const scale = 2 / height;
const center = min.map((value, axis) => (value + max[axis]) / 2);
const normalised = bodyPositions.map((point) =>
  point.map((value, axis) => (value - center[axis]) * scale),
);

const normals = normalised.map(() => [0, 0, 0]);
for (const [aIndex, bIndex, cIndex] of remappedFaces) {
  const a = normalised[aIndex];
  const b = normalised[bIndex];
  const c = normalised[cIndex];
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const faceNormal = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];
  for (const index of [aIndex, bIndex, cIndex]) {
    normals[index][0] += faceNormal[0];
    normals[index][1] += faceNormal[1];
    normals[index][2] += faceNormal[2];
  }
}
for (const normal of normals) {
  const length = Math.hypot(normal[0], normal[1], normal[2]) || 1;
  normal[0] /= length;
  normal[1] /= length;
  normal[2] /= length;
}

const positionBuffer = Buffer.from(new Float32Array(normalised.flat()).buffer);
const normalBuffer = Buffer.from(new Float32Array(normals.flat()).buffer);
const indexBuffer = Buffer.from(Uint32Array.from(remappedFaces.flat()).buffer);
const align = (bytes) => (bytes + 3) & ~3;
const positionOffset = 0;
const normalOffset = align(positionBuffer.byteLength);
const indexOffset = normalOffset + align(normalBuffer.byteLength);
const binLength = indexOffset + align(indexBuffer.byteLength);
const binary = Buffer.alloc(binLength);
positionBuffer.copy(binary, positionOffset);
normalBuffer.copy(binary, normalOffset);
indexBuffer.copy(binary, indexOffset);

const bounds = [0, 1, 2].map((axis) => [Math.min(...normalised.map((point) => point[axis])), Math.max(...normalised.map((point) => point[axis]))]);
const json = JSON.stringify({
  asset: { version: '2.0', generator: 'Human Signals MakeHuman import tool' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'makehuman-base-body' }],
  meshes: [{
    name: 'makehuman-base-body',
    primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }],
  }],
  materials: [{
    name: 'Human Signals translucent body',
    doubleSided: true,
    alphaMode: 'BLEND',
    pbrMetallicRoughness: {
      // Opacity is controlled by the renderer so the model does not become doubly transparent.
      baseColorFactor: [0.52, 0.68, 0.88, 1],
      metallicFactor: 0,
      roughnessFactor: 0.65,
    },
  }],
  buffers: [{ byteLength: binLength }],
  bufferViews: [
    { buffer: 0, byteOffset: positionOffset, byteLength: positionBuffer.byteLength, target: 34962 },
    { buffer: 0, byteOffset: normalOffset, byteLength: normalBuffer.byteLength, target: 34962 },
    { buffer: 0, byteOffset: indexOffset, byteLength: indexBuffer.byteLength, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: normalised.length, type: 'VEC3', min: bounds.map((range) => range[0]), max: bounds.map((range) => range[1]) },
    { bufferView: 1, componentType: 5126, count: normals.length, type: 'VEC3' },
    { bufferView: 2, componentType: 5125, count: remappedFaces.length * 3, type: 'SCALAR', min: [0], max: [normalised.length - 1] },
  ],
}, null, 2);
const jsonBuffer = Buffer.from(json, 'utf8');
const jsonPaddedLength = align(jsonBuffer.byteLength);
const jsonChunk = Buffer.alloc(jsonPaddedLength, 0x20);
jsonBuffer.copy(jsonChunk);
const totalLength = 12 + 8 + jsonChunk.byteLength + 8 + binary.byteLength;
const glb = Buffer.alloc(totalLength);
glb.writeUInt32LE(0x46546c67, 0);
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(totalLength, 8);
let offset = 12;
glb.writeUInt32LE(jsonChunk.byteLength, offset);
glb.writeUInt32LE(0x4e4f534a, offset + 4);
jsonChunk.copy(glb, offset + 8);
offset += 8 + jsonChunk.byteLength;
glb.writeUInt32LE(binary.byteLength, offset);
glb.writeUInt32LE(0x004e4942, offset + 4);
binary.copy(glb, offset + 8);

writeFileSync(outputPath, glb);
console.log(`Wrote ${outputPath}`);
console.log(`  vertices=${normalised.length} triangles=${remappedFaces.length}`);
console.log(`  bytes=${glb.byteLength}`);
