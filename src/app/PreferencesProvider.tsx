/**
 * Preferences and the effective motion setting.
 *
 * Document 02: the browser motion preference is the initial default and a user override can ask
 * for more or less motion, with a clear reset to the system setting. Document 02 also requires
 * "Saved on this device" to appear only after a successful write, and a single nonblocking
 * notice when writes fail.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_PREFERENCES,
  createPreferencesStore,
  motionIsReduced,
  type Preferences,
  type PreferencesStore,
} from '../platform/preferences.ts';
import { recordDiagnostic } from '../platform/diagnostics.ts';

interface PreferencesState {
  preferences: Preferences;
  update: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;
  /** The system setting combined with any explicit override. */
  reducedMotion: boolean;
  systemPrefersReduce: boolean;
  /** Set once if a write failed or storage is unavailable; shown once per session. */
  storageNotice: string | null;
  dismissStorageNotice: () => void;
  savedOnThisDevice: boolean;
}

const PreferencesContext = createContext<PreferencesState | null>(null);

function subscribeToMotionPreference(onChange: (value: boolean) => void): () => void {
  if (typeof globalThis.matchMedia !== 'function') return () => undefined;
  const query = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
  onChange(query.matches);
  const listener = (event: MediaQueryListEvent): void => {
    onChange(event.matches);
  };
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
}

export function PreferencesProvider({
  children,
  store = createPreferencesStore(),
}: {
  children: ReactNode;
  store?: PreferencesStore;
}): React.JSX.Element {
  const initial = useMemo(() => store.read(), [store]);
  const [preferences, setPreferences] = useState<Preferences>(initial.preferences);
  const [systemPrefersReduce, setSystemPrefersReduce] = useState(false);
  const [savedOnThisDevice, setSavedOnThisDevice] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(
    initial.reset ? 'Saved settings could not be read and have been reset on this device.' : null,
  );

  useEffect(() => subscribeToMotionPreference(setSystemPrefersReduce), []);

  const persist = useCallback(
    (next: Preferences) => {
      const status = store.write(next);
      if (status === 'ok') {
        setSavedOnThisDevice(true);
        return;
      }
      setSavedOnThisDevice(false);
      recordDiagnostic('STORAGE_UNAVAILABLE', 'unknown');
      setStorageNotice((current) => current ?? 'Settings cannot be saved in this browser.');
    },
    [store],
  );

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      setPreferences((current) => {
        const next = { ...current, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    store.clear();
    setSavedOnThisDevice(false);
  }, [store]);

  const value = useMemo<PreferencesState>(
    () => ({
      preferences,
      update,
      resetPreferences,
      reducedMotion: motionIsReduced(preferences.motion, systemPrefersReduce),
      systemPrefersReduce,
      storageNotice,
      dismissStorageNotice: () => {
        setStorageNotice(null);
      },
      savedOnThisDevice,
    }),
    [preferences, update, resetPreferences, systemPrefersReduce, storageNotice, savedOnThisDevice],
  );

  useEffect(() => {
    document.documentElement.dataset['contrast'] = preferences.contrast;
  }, [preferences.contrast]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesState {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
