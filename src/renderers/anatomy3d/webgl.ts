/**
 * Feature detection and quality adaptation.
 *
 * Document 10: feature detection, never user-agent sniffing, selects the fallback. Document 07:
 * cap the device pixel ratio, disable shadows and postprocessing, and reduce quality once if
 * sustained frame time is poor — without changing lesson state or removing any relationship.
 */
export { detectWebgl2, type WebglSupport } from '../../platform/webgl.ts';

export const QUALITY = {
  normalMaxPixelRatio: 2,
  lowMaxPixelRatio: 1.5,
  /** Document 07: sustained frame time above this for five seconds reduces quality once. */
  slowFrameMs: 50,
  slowWindowMs: 5000,
};

export function pixelRatioFor(quality: 'normal' | 'low', devicePixelRatio: number): number {
  const cap = quality === 'low' ? QUALITY.lowMaxPixelRatio : QUALITY.normalMaxPixelRatio;
  return Math.min(devicePixelRatio, cap);
}

/**
 * Watches frame times and reports one downgrade. It never recovers automatically: repeatedly
 * switching quality would be more distracting than the frame rate it is trying to fix.
 */
export class QualityWatchdog {
  private slowSince: number | null = null;
  private downgraded = false;
  private readonly onDowngrade: () => void;

  constructor(onDowngrade: () => void) {
    this.onDowngrade = onDowngrade;
  }

  /** Call once per rendered frame with the frame duration and the current timestamp. */
  observe(frameMs: number, now: number): void {
    if (this.downgraded) return;
    if (frameMs <= QUALITY.slowFrameMs) {
      this.slowSince = null;
      return;
    }
    this.slowSince ??= now;
    if (now - this.slowSince >= QUALITY.slowWindowMs) {
      this.downgraded = true;
      this.onDowngrade();
    }
  }

  get hasDowngraded(): boolean {
    return this.downgraded;
  }
}
