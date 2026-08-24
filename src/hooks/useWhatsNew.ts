import { useEffect, useState } from "react";
import { PUBLIC_RELEASES, type UpdateRelease } from "../data/updates";
import { safeSetItem } from "../lib/storage";
import { hasStoredUserData } from "../lib/overrideKeys";

const LAST_SEEN_STORAGE_KEY = "epic-timeline:updates-last-seen";

function loadLastSeen(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Drives the one-time "what's new" popup (see WhatsNewModal): which public
 * releases, if any, the current visitor hasn't seen yet, and the means to
 * mark them seen.
 *
 * Three cases on a visit with nothing stored yet:
 * - Genuinely first-ever visitor (no other app data either): nothing to
 *   miss. Silently records the latest release as seen; no popup.
 * - Already using the app before this feature existed (other app data is
 *   present, e.g. overrides or a chosen collection tab): every public
 *   release is "new" to them, so the popup shows the *entire* changelog
 *   once. Dismissing it (or opening the full Updates page) catches them
 *   up like anyone else, and this case can never fire again for them.
 * - Returning visitor with a real "last seen" date: normal cadence --
 *   only releases newer than that date.
 */
export function useWhatsNew(): { newReleases: UpdateRelease[]; markSeen: () => void } {
  const [lastSeen, setLastSeen] = useState(loadLastSeen);
  // Snapshotted once at mount, not recomputed -- this only needs to tell
  // apart the two possible pasts a visitor with no stored date could have,
  // and the popup fires immediately on load anyway, before anything the
  // current session does could change the answer.
  const [hasPriorActivity] = useState(hasStoredUserData);
  const latestDate = PUBLIC_RELEASES[0]?.date ?? null;

  useEffect(() => {
    // The silent catch-up only applies to a visitor with no history to
    // miss. A pre-existing visitor's "no stored date" state persists
    // until they actually see (and dismiss) the one-time full backlog.
    if (lastSeen === null && latestDate !== null && !hasPriorActivity) {
      safeSetItem(LAST_SEEN_STORAGE_KEY, latestDate);
      setLastSeen(latestDate);
    }
  }, [lastSeen, latestDate, hasPriorActivity]);

  const newReleases =
    lastSeen !== null
      ? PUBLIC_RELEASES.filter((release) => release.date > lastSeen)
      : hasPriorActivity
        ? PUBLIC_RELEASES
        : [];

  /** Catches the visitor up to the latest known release -- called on
   * popup dismissal, and also when the full Updates page (reached from
   * the settings menu) is opened, since reading it there counts as
   * having seen everything too. */
  function markSeen() {
    if (latestDate === null) return;
    safeSetItem(LAST_SEEN_STORAGE_KEY, latestDate);
    setLastSeen(latestDate);
  }

  return { newReleases, markSeen };
}
