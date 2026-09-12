/**
 * Local storage adapter.
 *
 * Document 10: storage is best effort and never an educational prerequisite. A denied, full or
 * corrupt store must leave every teaching action working in memory, with one nonblocking notice.
 */
export type StorageStatus = 'ok' | 'unavailable' | 'write-failed';

export interface SafeStorage {
  read(key: string): string | null;
  write(key: string, value: string): StorageStatus;
  remove(key: string): StorageStatus;
  readonly available: boolean;
}

/** Feature-detects a usable store without throwing in private or restricted modes. */
export function createSafeStorage(backing?: Storage): SafeStorage {
  let store: Storage | undefined;
  try {
    store = backing ?? globalThis.localStorage;
    const probe = '__human-signals-probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
  } catch {
    store = undefined;
  }

  return {
    get available() {
      return store !== undefined;
    },
    read(key) {
      if (!store) return null;
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value) {
      if (!store) return 'unavailable';
      try {
        store.setItem(key, value);
        return 'ok';
      } catch {
        // A quota failure is reported, never retried in a loop.
        return 'write-failed';
      }
    },
    remove(key) {
      if (!store) return 'unavailable';
      try {
        store.removeItem(key);
        return 'ok';
      } catch {
        return 'write-failed';
      }
    },
  };
}
