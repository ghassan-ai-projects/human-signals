import { describe, expect, it } from 'vitest';
import {
  MAX_ATTEMPTS,
  MAX_EXPOSED_FAMILIES,
  MAX_HISTORY,
  PROGRESS_KEY,
  ProgressSchema,
  adoptContentVersion,
  createProgressStore,
  emptyProgress,
  markExposed,
  mergeProgress,
  newAttemptId,
  recordAttempt,
  recordCompletion,
  summariseByObjective,
  type Attempt,
  type ProgressStore,
} from '../../src/platform/progress.ts';
import type { SafeStorage, StorageStatus } from '../../src/platform/storage.ts';

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    attemptId: 'attempt-1',
    contentVersion: '0.1.0',
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

function storageWith(initial: Record<string, string> = {}): SafeStorage {
  const map = new Map(Object.entries(initial));
  return {
    get available() {
      return true;
    },
    read: (key) => map.get(key) ?? null,
    write: (key, value) => {
      map.set(key, value);
      return 'ok';
    },
    remove: (key) => {
      map.delete(key);
      return 'ok';
    },
  };
}

function failingStorage(status: Extract<StorageStatus, 'unavailable' | 'write-failed'>): SafeStorage {
  return {
    get available() {
      return status !== 'unavailable';
    },
    read: () => null,
    write: () => status,
    remove: () => status,
  };
}

describe('progress store', () => {
  it('uses the document 05 key', () => {
    expect(PROGRESS_KEY).toBe('human-signals:progress:v1');
  });

  it('reads an empty record when nothing is stored', () => {
    const store = createProgressStore(storageWith());
    expect(store.read()).toEqual({ progress: emptyProgress('unknown'), reset: false });
  });

  it('reads back what was written', () => {
    const storage = storageWith();
    const store = createProgressStore(storage);
    const record = recordAttempt(emptyProgress('0.1.0'), attempt());
    expect(store.write(record)).toBe('ok');
    const read = store.read();
    expect(read.reset).toBe(false);
    expect(read.progress).toEqual(record);
  });

  it('resets with a notice on malformed JSON instead of failing', () => {
    const store = createProgressStore(storageWith({ [PROGRESS_KEY]: '{not json' }));
    const read = store.read();
    expect(read.reset).toBe(true);
    expect(read.progress).toEqual(emptyProgress('unknown'));
  });

  it('resets on a valid JSON object that violates the schema, including unknown fields', () => {
    const base = recordAttempt(emptyProgress('0.1.0'), attempt());
    const store = createProgressStore(
      storageWith({ [PROGRESS_KEY]: JSON.stringify({ ...base, attempts: [], surprise: 1 }) }),
    );
    expect(store.read().reset).toBe(true);
  });

  it('reports writes that could not happen without losing the in-memory record', () => {
    const store = createProgressStore(failingStorage('write-failed'));
    expect(store.write(recordAttempt(emptyProgress('0.1.0'), attempt()))).toBe('write-failed');
    expect(store.read().progress).toEqual(emptyProgress('unknown'));
  });

  it('reports an unavailable store and stays readable', () => {
    const store = createProgressStore(failingStorage('unavailable'));
    expect(store.available).toBe(false);
    expect(store.write(emptyProgress('0.1.0'))).toBe('unavailable');
    expect(store.clear()).toBe('unavailable');
  });

  it('clears the stored key', () => {
    const storage = storageWith();
    const store = createProgressStore(storage);
    store.write(recordAttempt(emptyProgress('0.1.0'), attempt()));
    expect(store.clear()).toBe('ok');
    expect(store.read().progress).toEqual(emptyProgress('unknown'));
  });
});

describe('content version adoption', () => {
  it('keeps the record untouched when the version matches', () => {
    const record = recordAttempt(emptyProgress('0.1.0'), attempt());
    expect(adoptContentVersion(record, '0.1.0')).toBe(record);
  });

  it('adopts a version silently when nothing was stored before', () => {
    const adopted = adoptContentVersion(emptyProgress('unknown'), '0.1.0');
    expect(adopted.contentVersion).toBe('0.1.0');
    expect(adopted.history).toEqual([]);
  });

  it('moves an older version into bounded history and starts current results empty', () => {
    let record = emptyProgress('0.1.0');
    record = recordCompletion(recordCompletion(record, 'j-one'), 'j-two');
    record = recordAttempt(record, attempt({ firstAttempt: true }));
    record = markExposed(record, ['family-fictional-sequence']);

    const adopted = adoptContentVersion(record, '0.2.0');
    expect(adopted.contentVersion).toBe('0.2.0');
    expect(adopted.completed).toEqual([]);
    expect(adopted.attempts).toEqual([]);
    // Exposure carries forward: a learner who has seen an answer has seen it.
    expect(adopted.exposedFamilyIds).toEqual(['family-fictional-sequence']);
    expect(adopted.history).toEqual([
      { contentVersion: '0.1.0', completed: ['j-one', 'j-two'], attempts: 1 },
    ]);
  });

  it('keeps at most ten historical versions, oldest dropped first', () => {
    let record = emptyProgress('0.0.1');
    record = markExposed(record, ['family-a']);
    for (let version = 1; version <= MAX_HISTORY + 2; version += 1) {
      record = adoptContentVersion(record, `0.${version}.0`);
    }
    expect(record.history.length).toBe(MAX_HISTORY);
    expect(record.history.map((entry) => entry.contentVersion)).not.toContain('0.1.0');
  });
});

describe('bounds', () => {
  it('keeps at most 500 attempts, dropping the oldest first', () => {
    let record = emptyProgress('0.1.0');
    for (let index = 0; index < MAX_ATTEMPTS + 10; index += 1) {
      record = recordAttempt(record, attempt({ attemptId: `a-${index}`, at: index }));
    }
    expect(record.attempts.length).toBe(MAX_ATTEMPTS);
    expect(record.attempts[0]?.attemptId).toBe('a-10');
    expect(record.attempts.at(-1)?.attemptId).toBe(`a-${MAX_ATTEMPTS + 9}`);
  });

  it('keeps at most 500 exposure families and, on overflow, treats older ones as exposed', () => {
    let record = emptyProgress('0.1.0');
    const families = Array.from({ length: MAX_EXPOSED_FAMILIES + 5 }, (_, index) => `f-${index}`);
    record = markExposed(record, families);
    expect(record.exposedFamilyIds.length).toBe(MAX_EXPOSED_FAMILIES);
    expect(record.exposedFamilyIds[0]).toBe('f-5');
    expect(record.exposureTruncated).toBe(true);
  });

  it('keeps the truncation flag sticky once raised', () => {
    let record = markExposed(emptyProgress('0.1.0'), [
      ...Array.from({ length: MAX_EXPOSED_FAMILIES + 1 }, (_, index) => `f-${index}`),
    ]);
    record = markExposed(record, ['f-0']);
    expect(record.exposureTruncated).toBe(true);
  });
});

describe('merge across tabs', () => {
  it('unions completion and exposure and deduplicates attempts by their stable id', () => {
    const mine = recordAttempt(recordCompletion(emptyProgress('0.1.0'), 'j-one'), attempt({ attemptId: 'a-1', at: 1 }));
    const theirs = recordAttempt(
      recordCompletion(recordCompletion(emptyProgress('0.1.0'), 'j-two'), 'j-one'),
      attempt({ attemptId: 'a-2', at: 2 }),
    );
    const merged = mergeProgress(mine, theirs);
    expect(merged.completed).toEqual(['j-one', 'j-two']);
    expect(merged.attempts.map((item) => item.attemptId)).toEqual(['a-1', 'a-2']);
    expect(merged.exposedFamilyIds).toEqual(['family-fictional-sequence']);
  });

  it('keeps the newer attempt when both tabs recorded the same attempt id', () => {
    const mine = recordAttempt(emptyProgress('0.1.0'), attempt({ attemptId: 'a-1', correct: true }));
    const theirs = recordAttempt(emptyProgress('0.1.0'), attempt({ attemptId: 'a-1', correct: false }));
    expect(mergeProgress(mine, theirs).attempts[0]?.correct).toBe(false);
  });

  it('never mixes results across content versions, but still carries exposure', () => {
    const mine = recordCompletion(emptyProgress('0.1.0'), 'j-one');
    const theirs = recordAttempt(recordCompletion(emptyProgress('0.2.0'), 'j-two'), attempt({ contentVersion: '0.2.0' }));
    const merged = mergeProgress(mine, theirs);
    expect(merged.completed).toEqual(['j-one']);
    expect(merged.attempts).toEqual([]);
    expect(merged.exposedFamilyIds).toEqual(['family-fictional-sequence']);
  });

  it('keeps the longer history and the sticky truncation flag', () => {
    let mine = emptyProgress('0.1.0');
    mine = adoptContentVersion(mine, '0.2.0');
    const theirs = { ...emptyProgress('0.2.0'), exposureTruncated: true };
    const merged = mergeProgress(mine, theirs);
    expect(merged.history.length).toBe(1);
    expect(merged.exposureTruncated).toBe(true);
  });
});

describe('per-objective summary', () => {
  it('counts unassisted first attempts separately from practice', () => {
    let record = emptyProgress('0.1.0');
    record = recordAttempt(record, attempt({ attemptId: 'a-1', correct: true }));
    // A repeat of the same question is practice.
    record = recordAttempt(record, attempt({ attemptId: 'a-2', correct: false, firstAttempt: false }));
    // An assisted answer is practice even on a first pass.
    record = recordAttempt(
      record,
      attempt({ attemptId: 'a-3', questionId: 'q2', correct: true, assisted: true }),
    );
    // An answer whose family was exposed before is practice too.
    record = recordAttempt(
      record,
      attempt({ attemptId: 'a-4', questionId: 'q3', correct: true, exposedBefore: true }),
    );

    expect(summariseByObjective(record)).toEqual([
      {
        objectiveId: 'obj-fictional-sequence',
        unassistedFirstAttempts: 1,
        unassistedFirstAttemptsCorrect: 1,
        practiceAttempts: 3,
      },
    ]);
  });

  it('round-trips through the schema with the record bounds intact', () => {
    let record = emptyProgress('0.1.0');
    record = recordAttempt(record, attempt());
    expect(ProgressSchema.parse(JSON.parse(JSON.stringify(record)))).toEqual(record);
  });
});

describe('attempt identifiers', () => {
  it('generates unique, bounded identifiers for local merge only', () => {
    const first = newAttemptId();
    const second = newAttemptId();
    expect(first).not.toBe(second);
    expect(first.length).toBeLessThanOrEqual(64);
  });
});

describe('store shape', () => {
  it('exposes exactly the surface the provider consumes', () => {
    const store: ProgressStore = createProgressStore(storageWith());
    expect(typeof store.read).toBe('function');
    expect(typeof store.write).toBe('function');
    expect(typeof store.clear).toBe('function');
    expect(store.available).toBe(true);
  });
});
