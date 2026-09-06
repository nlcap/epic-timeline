type StorageErrorListener = (message: string) => void;
const listeners = new Set<StorageErrorListener>();

/** Subscribes to storage-write failures reported by safeSetItem; returns an
 * unsubscribe function. Used by StorageErrorToast to surface the one thing
 * a caught write failure can't show on its own -- that it happened at all. */
export function onStorageError(listener: StorageErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * localStorage.setItem throws synchronously (QuotaExceededError when full,
 * or in browsers that disable storage in private/incognito mode). Every
 * write in this app goes through here so a full quota degrades to "this
 * edit won't survive a reload" instead of crashing the whole app -- most of
 * these calls used to sit unguarded inside useState updaters, where a throw
 * aborts the update and, with nothing catching it, unmounts the tree (see
 * ErrorBoundary for the last-resort net over what this can't catch).
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error(`Failed to save "${key}" to local storage`, err);
    const message =
      "Couldn't save your last change -- browser storage is full or unavailable. It won't survive a reload.";
    listeners.forEach((listener) => listener(message));
    return false;
  }
}

/**
 * The read counterpart to safeSetItem. `getItem` throws in exactly the same
 * situations `setItem` does -- Safari with "block all cookies" on, and
 * anywhere else the browser refuses storage access outright -- and unlike a
 * failed write, a failed read usually happens during render or a lazy
 * useState initializer, where an uncaught throw takes the whole tree down
 * to the ErrorBoundary rather than losing one edit.
 *
 * Silent by design, unlike safeSetItem: a read that comes back empty is
 * indistinguishable from a first visit, and every caller already has a
 * sensible answer for that. There is nothing to tell the user.
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Parses a JSON value out of storage, falling back to `fallback` for any
 * reason it can't -- unavailable storage, an absent key, or content that
 * isn't valid JSON (a half-written record, or something else on the origin
 * using the same key).
 *
 * Callers hand back a fallback of the right shape rather than null, so the
 * "nothing stored yet" and "stored but unreadable" paths converge on the
 * same empty-but-usable value instead of each needing its own handling.
 */
export function safeGetJson<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Removal throws under the same conditions as the two above. Nothing in
 * the app has a recovery path for "couldn't clear that key" beyond carrying
 * on, so this swallows it the same way safeGetItem does. */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable -- there was nothing stored to clear either.
  }
}
