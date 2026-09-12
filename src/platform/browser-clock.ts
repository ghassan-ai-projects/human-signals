/**
 * Browser clock and ticker.
 *
 * The loop runs only while the lesson is playing and the page is visible. On hide, route change
 * or renderer loss the caller pauses and the anchor is dropped, so returning to the tab never
 * replays the time that passed in the background (documents 06 and 10).
 */
import type { MonotonicClock, Ticker } from '../engine/clock.ts';

export const browserClock: MonotonicClock = {
  now: () => performance.now(),
};

export function createAnimationFrameTicker(clock: MonotonicClock = browserClock): Ticker {
  let handle: number | null = null;
  let last = 0;

  const ticker: Ticker = {
    start(onTick) {
      if (handle !== null) return;
      last = clock.now();
      const step = (): void => {
        const now = clock.now();
        const elapsed = now - last;
        last = now;
        onTick(elapsed);
        if (handle !== null) handle = requestAnimationFrame(step);
      };
      handle = requestAnimationFrame(step);
    },
    stop() {
      if (handle === null) return;
      cancelAnimationFrame(handle);
      handle = null;
    },
    get running() {
      return handle !== null;
    },
  };
  return ticker;
}
