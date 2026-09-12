/**
 * Local progress, kept in memory and mirrored to this browser when storage allows it.
 *
 * Document 10: a denied, full or corrupt store must leave every teaching action working, with
 * one nonblocking notice. Two tabs merge on the storage event: completion and exposure are
 * unions, attempts merge by their stable identifier, and the question being answered right now
 * is never disturbed.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  PROGRESS_KEY,
  ProgressSchema,
  adoptContentVersion,
  createProgressStore,
  emptyProgress,
  markExposed,
  mergeProgress,
  recordAttempt,
  recordCompletion,
  type Attempt,
  type ProgressRecord,
  type ProgressStore,
} from '../platform/progress.ts';
import { recordDiagnostic } from '../platform/diagnostics.ts';

interface ProgressState {
  progress: ProgressRecord;
  addAttempt: (attempt: Attempt) => void;
  addExposure: (familyIds: readonly string[]) => void;
  addCompletion: (timelineId: string) => void;
  clearProgress: () => void;
  /**
   * Rises by one on every clear, so a lesson can drop its in-memory exposure with the stored
   * record (document 11, AC-10: the reset clears the key and the current session's state).
   */
  epoch: number;
  storageNotice: string | null;
  dismissStorageNotice: () => void;
  savedOnThisDevice: boolean;
}

const ProgressContext = createContext<ProgressState | null>(null);

export function ProgressProvider({
  children,
  contentVersion,
  store = createProgressStore(),
}: {
  children: ReactNode;
  contentVersion: string;
  store?: ProgressStore;
}): React.JSX.Element {
  const initial = useMemo(() => store.read(), [store]);
  const [progress, setProgress] = useState<ProgressRecord>(() =>
    adoptContentVersion(
      initial.progress.contentVersion === 'unknown'
        ? emptyProgress(contentVersion)
        : initial.progress,
      contentVersion,
    ),
  );
  const [savedOnThisDevice, setSavedOnThisDevice] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [storageNotice, setStorageNotice] = useState<string | null>(
    initial.reset ? 'Saved progress could not be read and has been reset on this device.' : null,
  );
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const persist = useCallback(
    (next: ProgressRecord) => {
      const status = store.write(next);
      if (status === 'ok') {
        setSavedOnThisDevice(true);
        return;
      }
      setSavedOnThisDevice(false);
      recordDiagnostic('STORAGE_UNAVAILABLE', 'learn');
      setStorageNotice((current) => current ?? 'Progress cannot be saved in this browser.');
    },
    [store],
  );

  const apply = useCallback(
    (change: (current: ProgressRecord) => ProgressRecord) => {
      setProgress((current) => {
        const next = change(current);
        if (next === current) return current;
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // Another tab wrote progress: merge rather than overwrite, and keep the active question.
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== PROGRESS_KEY || event.newValue === null) return;
      try {
        const parsed = ProgressSchema.safeParse(JSON.parse(event.newValue));
        if (!parsed.success) return;
        setProgress((current) => mergeProgress(current, parsed.data));
      } catch {
        // A malformed write from another tab is ignored; this tab keeps working.
      }
    };
    globalThis.addEventListener('storage', onStorage);
    return () => {
      globalThis.removeEventListener('storage', onStorage);
    };
  }, []);

  const value = useMemo<ProgressState>(
    () => ({
      progress,
      addAttempt: (attempt) => {
        apply((current) => recordAttempt(current, attempt));
      },
      addExposure: (familyIds) => {
        apply((current) => markExposed(current, familyIds));
      },
      addCompletion: (timelineId) => {
        apply((current) => recordCompletion(current, timelineId));
      },
      clearProgress: () => {
        const cleared = emptyProgress(contentVersion);
        setProgress(cleared);
        store.clear();
        setSavedOnThisDevice(false);
        setEpoch((current) => current + 1);
      },
      epoch,
      storageNotice,
      dismissStorageNotice: () => {
        setStorageNotice(null);
      },
      savedOnThisDevice,
    }),
    [progress, apply, store, contentVersion, epoch, storageNotice, savedOnThisDevice],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressState {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside ProgressProvider');
  return value;
}

/**
 * Progress is available only once content (and therefore the content version) is ready. Pages
 * that can render before that use this and keep working without progress.
 */
export function useOptionalProgress(): ProgressState | null {
  return useContext(ProgressContext);
}
