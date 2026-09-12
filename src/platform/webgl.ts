/** Browser-only capability detection kept out of the lazy 3D renderer boundary. */
export type WebglSupport = 'webgl2' | 'unsupported';

export function detectWebgl2(
  createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
): WebglSupport {
  try {
    const canvas = createCanvas();
    const context = canvas.getContext('webgl2');
    return context === null ? 'unsupported' : 'webgl2';
  } catch {
    return 'unsupported';
  }
}
