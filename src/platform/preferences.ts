/**
 * Local preferences.
 *
 * Document 05 names the key and the fields. Unknown or malformed storage is ignored with a
 * nonblocking reset notice rather than crashing or silently reinterpreting old data.
 */
import { z } from 'zod';
import { createSafeStorage, type SafeStorage, type StorageStatus } from './storage.ts';
import { DepthSchema, type Depth } from '../content/schema.ts';

export const PREFERENCES_KEY = 'human-signals:preferences:v1';

export const MotionOverrideSchema = z.enum(['system', 'reduce', 'full']);
export type MotionOverride = z.infer<typeof MotionOverrideSchema>;

export const PreferencesSchema = z.strictObject({
  version: z.literal(1),
  depth: DepthSchema,
  view: z.enum(['3d', '2d']),
  motion: MotionOverrideSchema,
  contrast: z.enum(['system', 'more']),
  speed: z.union([z.literal(0.5), z.literal(1), z.literal(2)]),
  predictionsEnabled: z.boolean(),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  // Document 08: depth defaults to explicit URL, then a valid stored preference, then Intro.
  depth: 'intro',
  view: '3d',
  motion: 'system',
  contrast: 'system',
  speed: 1,
  predictionsEnabled: true,
};

export interface PreferencesReadResult {
  preferences: Preferences;
  /** True when stored data existed but could not be understood and was ignored. */
  reset: boolean;
}

export interface PreferencesStore {
  read(): PreferencesReadResult;
  write(preferences: Preferences): StorageStatus;
  clear(): StorageStatus;
  readonly available: boolean;
}

export function createPreferencesStore(storage: SafeStorage = createSafeStorage()): PreferencesStore {
  return {
    get available() {
      return storage.available;
    },
    read() {
      const raw = storage.read(PREFERENCES_KEY);
      if (raw === null) return { preferences: DEFAULT_PREFERENCES, reset: false };
      try {
        const parsed = PreferencesSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return { preferences: DEFAULT_PREFERENCES, reset: true };
        return { preferences: parsed.data, reset: false };
      } catch {
        return { preferences: DEFAULT_PREFERENCES, reset: true };
      }
    },
    write(preferences) {
      return storage.write(PREFERENCES_KEY, JSON.stringify(preferences));
    },
    clear() {
      return storage.remove(PREFERENCES_KEY);
    },
  };
}

/**
 * The effective motion setting. The browser preference is the initial default; an explicit user
 * override can ask for more or less motion (document 02).
 */
export function motionIsReduced(override: MotionOverride, systemPrefersReduce: boolean): boolean {
  if (override === 'reduce') return true;
  if (override === 'full') return false;
  return systemPrefersReduce;
}

/** Depth resolution order from document 08: explicit URL, then stored preference, then Intro. */
export function resolveDepth(urlDepth: string | null, stored: Depth): Depth {
  const parsed = DepthSchema.safeParse(urlDepth);
  return parsed.success ? parsed.data : stored;
}
