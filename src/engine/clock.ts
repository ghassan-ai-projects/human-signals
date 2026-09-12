/**
 * Clock adapter. The engine describes what it needs from a clock; the platform layer supplies a
 * browser implementation. Document 06: use a monotonic elapsed-time source, never a frame
 * counter, and never catch up using background wall time.
 */
export interface MonotonicClock {
  /** Monotonic milliseconds. Only differences between two readings are meaningful. */
  now(): number;
}

export interface Ticker {
  /** Calls back with the elapsed milliseconds since the previous callback. */
  start(onTick: (elapsedMs: number) => void): void;
  stop(): void;
  readonly running: boolean;
}

/** A clock a test can drive by hand. */
export function createManualClock(startMs = 0): MonotonicClock & { advance(ms: number): void } {
  let current = startMs;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}
