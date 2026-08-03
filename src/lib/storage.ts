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
