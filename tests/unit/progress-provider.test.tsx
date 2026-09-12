import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { ProgressStore } from '../../src/platform/progress.ts';
import {
  PROGRESS_KEY,
  createProgressStore,
  emptyProgress,
  recordAttempt,
  type Attempt,
  type ProgressReadResult,
  type ProgressRecord,
} from '../../src/platform/progress.ts';
import { ProgressProvider, useProgress } from '../../src/app/ProgressProvider.tsx';
import type { StorageStatus } from '../../src/platform/storage.ts';

const CONTENT_VERSION = '0.1.0';

function sampleAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    attemptId: 'attempt-1',
    contentVersion: CONTENT_VERSION,
    timelineId: 'exercise-synthetic-feedback',
    questionId: 'pred-fictional-next',
    familyId: 'family-fictional-sequence',
    objectiveId: 'obj-fictional-sequence',
    selectedOptionId: 'pred-fictional-next-gamma',
    correct: true,
    firstAttempt: true,
    assisted: false,
    exposedBefore: false,
    at: 1,
    ...overrides,
  };
}

/** A controllable in-memory store whose write status the tests can set. */
function fakeStore(options: { initial?: string; writeStatus?: StorageStatus } = {}): {
  store: ProgressStore;
  storage: Map<string, string>;
} {
  const storage = new Map<string, string>();
  if (options.initial !== undefined) storage.set(PROGRESS_KEY, options.initial);
  const writeStatus = options.writeStatus ?? 'ok';
  const store: ProgressStore = {
    get available() {
      return writeStatus !== 'unavailable';
    },
    read(): ProgressReadResult {
      const raw = storage.get(PROGRESS_KEY);
      if (raw === undefined) return { progress: emptyProgress('unknown'), reset: false };
      try {
        const parsed = JSON.parse(raw) as ProgressRecord;
        return { progress: parsed, reset: false };
      } catch {
        return { progress: emptyProgress('unknown'), reset: true };
      }
    },
    write(progress: ProgressRecord): StorageStatus {
      if (writeStatus !== 'ok') return writeStatus;
      storage.set(PROGRESS_KEY, JSON.stringify(progress));
      return 'ok';
    },
    clear(): StorageStatus {
      storage.delete(PROGRESS_KEY);
      return 'ok';
    },
  };
  return { store, storage };
}

function Probe(): React.JSX.Element {
  const {
    progress,
    addAttempt,
    addExposure,
    addCompletion,
    clearProgress,
    savedOnThisDevice,
    storageNotice,
  } = useProgress();
  return (
    <div>
      {storageNotice !== null && <p role="status">{storageNotice}</p>}
      <p data-testid="attempts">{progress.attempts.length}</p>
      <p data-testid="completed">{progress.completed.join(',')}</p>
      <p data-testid="exposed">{progress.exposedFamilyIds.join(',')}</p>
      <p data-testid="version">{progress.contentVersion}</p>
      <p data-testid="saved">{savedOnThisDevice ? 'saved' : 'not-saved'}</p>
      <button
        type="button"
        onClick={() => {
          addAttempt(sampleAttempt({ attemptId: `a-${progress.attempts.length + 1}` }));
        }}
      >
        record
      </button>
      <button
        type="button"
        onClick={() => {
          addExposure(['family-x']);
        }}
      >
        expose
      </button>
      <button
        type="button"
        onClick={() => {
          addCompletion('j-nine');
        }}
      >
        complete
      </button>
      <button type="button" onClick={clearProgress}>
        clear
      </button>
    </div>
  );
}

function renderProvider(store: ProgressStore): void {
  render(
    <ProgressProvider contentVersion={CONTENT_VERSION} store={store}>
      <Probe />
    </ProgressProvider>,
  );
}

describe('progress provider', () => {
  it('persists attempts as they happen and reports the successful write', () => {
    const { store, storage } = fakeStore();
    renderProvider(store);
    act(() => {
      screen.getByRole('button', { name: 'record' }).click();
    });
    expect(screen.getByTestId('attempts')).toHaveTextContent('1');
    expect(screen.getByTestId('saved')).toHaveTextContent('saved');
    const stored = JSON.parse(storage.get(PROGRESS_KEY) ?? '{}') as ProgressRecord;
    expect(stored.attempts).toHaveLength(1);
    expect(stored.contentVersion).toBe(CONTENT_VERSION);
  });

  it('keeps every action working in memory when writes fail, with one notice', () => {
    const { store } = fakeStore({ writeStatus: 'write-failed' });
    renderProvider(store);
    act(() => {
      screen.getByRole('button', { name: 'record' }).click();
    });
    expect(screen.getByTestId('attempts')).toHaveTextContent('1');
    expect(screen.getByTestId('saved')).toHaveTextContent('not-saved');
    expect(screen.getByRole('status')).toHaveTextContent(/Progress cannot be saved/);
  });

  it('adopts a stored older content version: history kept, current results empty', () => {
    const older = recordAttempt(emptyProgress('0.0.9'), sampleAttempt({ contentVersion: '0.0.9' }));
    const { store } = fakeStore({ initial: JSON.stringify(older) });
    renderProvider(store);
    expect(screen.getByTestId('version')).toHaveTextContent(CONTENT_VERSION);
    expect(screen.getByTestId('attempts')).toHaveTextContent('0');
    expect(screen.getByTestId('exposed')).toHaveTextContent('family-fictional-sequence');
  });

  it('merges a write from another tab without duplicating attempts', () => {
    const { store } = fakeStore();
    renderProvider(store);
    act(() => {
      screen.getByRole('button', { name: 'record' }).click();
    });
    const otherTab = recordAttempt(emptyProgress(CONTENT_VERSION), sampleAttempt({ attemptId: 'a-2', at: 2 }));
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: PROGRESS_KEY, newValue: JSON.stringify(otherTab) }),
      );
    });
    expect(screen.getByTestId('attempts')).toHaveTextContent('2');
    // A repeat of the same event must not duplicate anything.
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: PROGRESS_KEY, newValue: JSON.stringify(otherTab) }),
      );
    });
    expect(screen.getByTestId('attempts')).toHaveTextContent('2');
  });

  it('ignores a malformed write from another tab', () => {
    const { store } = fakeStore();
    renderProvider(store);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: PROGRESS_KEY, newValue: '{broken' }),
      );
    });
    expect(screen.getByTestId('attempts')).toHaveTextContent('0');
  });

  it('ignores storage events for other keys', () => {
    const { store } = fakeStore();
    renderProvider(store);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other:key', newValue: '{}' }));
    });
    expect(screen.getByTestId('attempts')).toHaveTextContent('0');
  });

  it('clears the stored key and the live record with one confirmed action', () => {
    const { store, storage } = fakeStore();
    renderProvider(store);
    act(() => {
      screen.getByRole('button', { name: 'record' }).click();
      screen.getByRole('button', { name: 'complete' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'clear' }).click();
    });
    expect(screen.getByTestId('attempts')).toHaveTextContent('0');
    expect(screen.getByTestId('completed')).toHaveTextContent('');
    expect(screen.getByTestId('saved')).toHaveTextContent('not-saved');
    expect(storage.has(PROGRESS_KEY)).toBe(false);
  });

  it('reads back the record the real store wrote, unchanged', () => {
    const backing = new Map<string, string>();
    const storage = {
      get available(): boolean {
        return true;
      },
      read: (key: string) => backing.get(key) ?? null,
      write: (key: string, value: string): StorageStatus => {
        backing.set(key, value);
        return 'ok';
      },
      remove: (key: string): StorageStatus => {
        backing.delete(key);
        return 'ok';
      },
    };
    const first = createProgressStore(storage);
    const record = recordAttempt(emptyProgress(CONTENT_VERSION), sampleAttempt());
    first.write(record);
    const second = createProgressStore(storage);
    expect(second.read()).toEqual({ progress: record, reset: false });
  });
});
