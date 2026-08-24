import { useState } from "react";
import { safeSetItem } from "../lib/storage";

const ONBOARDING_SEEN_STORAGE_KEY = "epic-timeline:onboarding-seen";

function loadSeen(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}

/**
 * Drives the first-time welcome/tour/closing-modal flow (see
 * OnboardingFlow) -- same "fires once, dismiss writes to localStorage"
 * idiom as useWhatsNew's own last-seen tracking.
 *
 * Shown to every visitor who hasn't dismissed it yet, not just genuinely
 * brand-new ones: a returning visitor with real shelf data predates this
 * feature just as much as a first-timer does and never had a chance to see
 * it, so they get the same one-time introduction rather than being
 * silently skipped -- the same "show it once, then respect them as
 * returning" contract useWhatsNew already applies to a pre-existing
 * visitor's changelog backlog (see its hasPriorActivity case). Unlike that
 * case, there's no different content to show here (no "backlog" version of
 * the tour) -- everyone who hasn't seen it gets the exact same flow, only
 * the underlying `seen` flag differs in when it starts false. App.tsx holds
 * this behind any unseen changelog releases so the two one-time popups
 * can't both try to show at once.
 */
export function useOnboarding(): { shouldShow: boolean; markSeen: () => void } {
  const [seen, setSeen] = useState(loadSeen);

  function markSeen() {
    safeSetItem(ONBOARDING_SEEN_STORAGE_KEY, "true");
    setSeen(true);
  }

  return { shouldShow: !seen, markSeen };
}
