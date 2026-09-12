/**
 * Local learner record.
 *
 * Document 05 fixes the key, the shape and the bounds; document 09 fixes what may be claimed
 * from it. There is no account, no database and no remote copy: everything here lives in one
 * browser, is visible to the learner, and can be deleted in one confirmed action.
 *
 * Two rules shape the merge logic. Exposure is conservative — true always wins, and an overflow
 * marks older families exposed rather than letting an old question look new. And a change of
 * content version invalidates current-version results rather than migrating a mastery claim.
 */
import { z } from 'zod';
import { createSafeStorage, type SafeStorage, type StorageStatus } from './storage.ts';

export const PROGRESS_KEY = 'human-signals:progress:v1';
export const MAX_ATTEMPTS = 500;
export const MAX_EXPOSED_FAMILIES = 500;
export const MAX_HISTORY = 10;

export const AttemptSchema = z.strictObject({
  /** Random per attempt, so two tabs can merge without duplicating or losing a record. */
  attemptId: z.string().min(1).max(64),
  contentVersion: z.string().min(1).max(40),
  timelineId: z.string().min(1).max(120),
  questionId: z.string().min(1).max(120),
  familyId: z.string().min(1).max(120),
  objectiveId: z.string().min(1).max(120),
  /** `null` means the learner skipped the question. */
  selectedOptionId: z.string().max(120).nullable(),
  correct: z.boolean(),
  firstAttempt: z.boolean(),
  assisted: z.boolean(),
  exposedBefore: z.boolean(),
  /** Local ordering only. It is not a trusted scoring authority. */
  at: z.number().int().nonnegative(),
});

export type Attempt = z.infer<typeof AttemptSchema>;

export const ProgressSchema = z.strictObject({
  version: z.literal(1),
  contentVersion: z.string().min(1).max(40),
  completed: z.array(z.string().max(120)).max(500),
  attempts: z.array(AttemptSchema).max(MAX_ATTEMPTS),
  exposedFamilyIds: z.array(z.string().max(120)).max(MAX_EXPOSED_FAMILIES),
  /** Set when older exposure history had to be dropped; results then read conservatively. */
  exposureTruncated: z.boolean(),
  history: z
    .array(
      z.strictObject({
        contentVersion: z.string().min(1).max(40),
        completed: z.array(z.string().max(120)).max(500),
        attempts: z.number().int().nonnegative(),
      }),
    )
    .max(MAX_HISTORY),
});

export type ProgressRecord = z.infer<typeof ProgressSchema>;

export interface ProgressReadResult {
  progress: ProgressRecord;
  /** True when stored data existed but could not be understood and was ignored. */
  reset: boolean;
}

export interface ProgressStore {
  read(): ProgressReadResult;
  write(progress: ProgressRecord): StorageStatus;
  clear(): StorageStatus;
  readonly available: boolean;
}

export function emptyProgress(contentVersion: string): ProgressRecord {
  return {
    version: 1,
    contentVersion,
    completed: [],
    attempts: [],
    exposedFamilyIds: [],
    exposureTruncated: false,
    history: [],
  };
}

export function createProgressStore(storage: SafeStorage = createSafeStorage()): ProgressStore {
  return {
    get available() {
      return storage.available;
    },
    read() {
      const raw = storage.read(PROGRESS_KEY);
      if (raw === null) return { progress: emptyProgress('unknown'), reset: false };
      try {
        const parsed = ProgressSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return { progress: emptyProgress('unknown'), reset: true };
        return { progress: parsed.data, reset: false };
      } catch {
        return { progress: emptyProgress('unknown'), reset: true };
      }
    },
    write(progress) {
      return storage.write(PROGRESS_KEY, JSON.stringify(progress));
    },
    clear() {
      return storage.remove(PROGRESS_KEY);
    },
  };
}

/**
 * Moves results from an older content version into the bounded history. Completion stays as
 * history; current-version results start empty, because a changed question can change what an
 * old answer meant. Exposure is carried forward: a learner who has seen an answer has seen it.
 */
export function adoptContentVersion(
  progress: ProgressRecord,
  contentVersion: string,
): ProgressRecord {
  if (progress.contentVersion === contentVersion) return progress;
  if (progress.contentVersion === 'unknown') {
    return { ...progress, contentVersion };
  }
  return {
    version: 1,
    contentVersion,
    completed: [],
    attempts: [],
    exposedFamilyIds: [...progress.exposedFamilyIds],
    exposureTruncated: progress.exposureTruncated,
    history: [
      {
        contentVersion: progress.contentVersion,
        completed: [...progress.completed],
        attempts: progress.attempts.length,
      },
      ...progress.history,
    ].slice(0, MAX_HISTORY),
  };
}

export function recordAttempt(progress: ProgressRecord, attempt: Attempt): ProgressRecord {
  // Oldest attempts are dropped first once the cap is reached.
  const attempts = [...progress.attempts, attempt].slice(-MAX_ATTEMPTS);
  return { ...progress, attempts, ...markExposedFields(progress, [attempt.familyId]) };
}

export function markExposed(progress: ProgressRecord, familyIds: readonly string[]): ProgressRecord {
  return { ...progress, ...markExposedFields(progress, familyIds) };
}

function markExposedFields(
  progress: ProgressRecord,
  familyIds: readonly string[],
): Pick<ProgressRecord, 'exposedFamilyIds' | 'exposureTruncated'> {
  const merged = [...progress.exposedFamilyIds];
  for (const familyId of familyIds) if (!merged.includes(familyId)) merged.push(familyId);
  if (merged.length <= MAX_EXPOSED_FAMILIES) {
    return { exposedFamilyIds: merged, exposureTruncated: progress.exposureTruncated };
  }
  // Overflow: keep the newest and remember that older families must be treated as exposed.
  return {
    exposedFamilyIds: merged.slice(-MAX_EXPOSED_FAMILIES),
    exposureTruncated: true,
  };
}

export function recordCompletion(progress: ProgressRecord, timelineId: string): ProgressRecord {
  if (progress.completed.includes(timelineId)) return progress;
  return { ...progress, completed: [...progress.completed, timelineId] };
}

/**
 * Merges another tab's record into this one. Completion and exposure are unions, attempts are
 * merged by their stable identifier, and the truncation flag is sticky.
 */
export function mergeProgress(mine: ProgressRecord, theirs: ProgressRecord): ProgressRecord {
  if (mine.contentVersion !== theirs.contentVersion) {
    // Different versions never mix results; exposure still carries, because it is conservative.
    return markExposed(mine, theirs.exposedFamilyIds);
  }
  const byId = new Map<string, Attempt>();
  for (const attempt of [...mine.attempts, ...theirs.attempts]) byId.set(attempt.attemptId, attempt);
  const attempts = [...byId.values()].sort((a, b) => a.at - b.at).slice(-MAX_ATTEMPTS);

  const completed = [...mine.completed];
  for (const id of theirs.completed) if (!completed.includes(id)) completed.push(id);

  const merged: ProgressRecord = {
    ...mine,
    completed,
    attempts,
    history: mine.history.length >= theirs.history.length ? mine.history : theirs.history,
    exposureTruncated: mine.exposureTruncated || theirs.exposureTruncated,
  };
  return markExposed(merged, theirs.exposedFamilyIds);
}

/** A learner-facing summary. Document 09 forbids inventing a mastery score or a percentile. */
export interface ObjectiveSummary {
  objectiveId: string;
  unassistedFirstAttempts: number;
  unassistedFirstAttemptsCorrect: number;
  practiceAttempts: number;
}

export function summariseByObjective(progress: ProgressRecord): ObjectiveSummary[] {
  const summaries = new Map<string, ObjectiveSummary>();
  for (const attempt of progress.attempts) {
    const summary = summaries.get(attempt.objectiveId) ?? {
      objectiveId: attempt.objectiveId,
      unassistedFirstAttempts: 0,
      unassistedFirstAttemptsCorrect: 0,
      practiceAttempts: 0,
    };
    // An assisted or previously exposed answer is practice, never an unassisted first attempt.
    if (attempt.firstAttempt && !attempt.assisted && !attempt.exposedBefore) {
      summary.unassistedFirstAttempts += 1;
      if (attempt.correct) summary.unassistedFirstAttemptsCorrect += 1;
    } else {
      summary.practiceAttempts += 1;
    }
    summaries.set(attempt.objectiveId, summary);
  }
  return [...summaries.values()].sort((a, b) => a.objectiveId.localeCompare(b.objectiveId));
}

/** A browser-generated identifier used only for local merge deduplication. */
export function newAttemptId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
