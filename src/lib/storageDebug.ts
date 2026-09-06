import { safeRemoveItem } from "./storage";

/** Also read by useWhatsNew, to tell a pre-existing visitor (any other app
 * key already on this origin) from a genuinely first-ever one. */
const APP_PREFIX = "epic-timeline:";
const PROBE_KEY = `${APP_PREFIX}__debug_quota_probe__`;

export interface StorageKeyUsage {
  key: string;
  /** key with the app's `epic-timeline:` prefix stripped, for display -- undefined for keys outside it. */
  label: string;
  bytes: number;
  isAppKey: boolean;
}

export interface StorageBreakdown {
  keys: StorageKeyUsage[];
  appBytes: number;
  otherBytes: number;
  totalBytes: number;
}

function byteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Snapshot of what's actually sitting in localStorage right now -- every
 * key on the origin, not just this app's, since a full origin (private
 * browsing extensions, other tools sharing the domain) all draw from the
 * same quota. Read-only, safe to call as often as the panel wants.
 */
export function getStorageBreakdown(): StorageBreakdown {
  const keys: StorageKeyUsage[] = [];
  let appBytes = 0;
  let otherBytes = 0;

  // Enumerating is itself a storage access, so `localStorage.length` throws
  // wherever getItem would (Safari with cookies blocked, and the like) --
  // and this panel exists precisely to be opened when storage is
  // misbehaving, so it must not be the thing that crashes. An empty
  // breakdown reads correctly in that case: there is nothing readable.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) ?? "";
      const bytes = byteLength(key) + byteLength(value);
      const isAppKey = key.startsWith(APP_PREFIX);
      keys.push({
        key,
        label: isAppKey ? key.slice(APP_PREFIX.length) : key,
        bytes,
        isAppKey,
      });
      if (isAppKey) appBytes += bytes;
      else otherBytes += bytes;
    }
  } catch {
    // Fall through with whatever was read before the throw.
  }

  keys.sort((a, b) => b.bytes - a.bytes);
  return { keys, appBytes, otherBytes, totalBytes: appBytes + otherBytes };
}

export interface CapacityProbeResult {
  bytes: number;
  /** True when `capBytes` itself still succeeded -- the search never found
   * an actual failure, so `bytes` is a floor ("at least this much"), not
   * this browser's real ceiling. Quota-generous browsers (most Chromium
   * ones, for the multi-MB caps this app cares about) hit this; Firefox's
   * much stricter default quota resolves to a precise number well under it. */
  hitCap: boolean;
}

/**
 * localStorage has no queryable "bytes remaining" API -- the only way to
 * find the real number for *this* browser is to try writing something and
 * see if it throws (the same way safeSetItem's failures happen for real).
 * Binary-searches a dedicated probe key up to `capBytes`, always cleaning
 * the key up between attempts and at the end, to find the largest single
 * write that still succeeds right now. That's the practically useful
 * number: "how big can my next cover image be before this crashes."
 *
 * Not run automatically (unlike getStorageBreakdown) -- it's a deliberate
 * action from the panel's "Check" button, since it does real writes.
 *
 * Yields to the browser between attempts, which is what makes the `async`
 * signature honest: each attempt writes a string up to `capBytes` long, and
 * running the whole search in one synchronous go blocked the main thread
 * hard enough that the panel's own "Checking..." state never got a frame to
 * paint in. A dozen-odd yields cost a few ms against work measured in tens.
 */
export async function probeRemainingCapacity(
  capBytes = 30 * 1024 * 1024
): Promise<CapacityProbeResult> {
  let lo = 0;
  let hi = capBytes;
  // ~1KB tolerance is plenty precise for a "how much headroom do I have"
  // readout, and keeps this to a handful of iterations.
  const tolerance = 1024;

  // The cleanup removes sit in `finally` blocks, so a throw from one of
  // them escapes the loop's own catch and takes the panel with it --
  // safeRemoveItem swallows that, leaving the search's real signal (whether
  // the *write* threw) as the only thing that steers it.
  try {
    while (hi - lo > tolerance) {
      const mid = Math.floor((lo + hi) / 2);
      try {
        localStorage.setItem(PROBE_KEY, "a".repeat(mid));
        lo = mid;
      } catch {
        hi = mid;
      } finally {
        safeRemoveItem(PROBE_KEY);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    safeRemoveItem(PROBE_KEY);
  }

  return { bytes: lo, hitCap: hi === capBytes };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
