/** Minimal GLB metadata reader used to verify semantic anchor bindings at build time. */

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

interface GlbJson {
  meshes?: unknown;
}

export function readGlbMeshNames(bytes: Uint8Array): string[] {
  if (bytes.byteLength < 12) throw new Error('GLB is shorter than its 12-byte header');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error('GLB magic is invalid');
  if (view.getUint32(4, true) !== 2) throw new Error('GLB version must be 2');

  const declaredLength = view.getUint32(8, true);
  if (declaredLength > bytes.byteLength) throw new Error('GLB declared length exceeds delivered bytes');

  let offset = 12;
  let document: GlbJson | undefined;
  while (offset + 8 <= declaredLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    offset += 8;
    if (offset + chunkLength > declaredLength) throw new Error('GLB chunk exceeds declared length');
    if (chunkType === JSON_CHUNK) {
      const jsonText = new TextDecoder().decode(bytes.subarray(offset, offset + chunkLength)).trim();
      try {
        document = JSON.parse(jsonText) as GlbJson;
      } catch {
        throw new Error('GLB JSON chunk is invalid');
      }
      break;
    }
    offset += chunkLength;
  }

  if (document === undefined || !Array.isArray(document.meshes)) {
    throw new Error('GLB does not contain a JSON mesh list');
  }
  const meshes: unknown[] = document.meshes;
  return meshes.flatMap((mesh: unknown) => {
    if (!mesh || typeof mesh !== 'object' || !('name' in mesh)) return [];
    const name = mesh.name;
    return typeof name === 'string' && name.length > 0 ? [name] : [];
  });
}
