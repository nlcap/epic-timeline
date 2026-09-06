import { useRef } from "react";
import { hasChanges } from "../lib/dirty";

/**
 * Whether any value differs from what it was on this component's first
 * render -- the "has the user actually edited anything" question behind
 * every unsaved-changes prompt (see useUnsavedChangesGuard).
 *
 * Takes one object of current values rather than a field list, because the
 * hand-written version of this named every field *three* times: once in the
 * snapshot, once in the comparison chain, and once in a useMemo dep array.
 * VolumeFormDrawer's eighteen fields meant fifty-four mentions of the same
 * list, and adding a field meant updating all three with nothing to catch a
 * miss -- exactly the drift useFilterState's own docblock says it was
 * extracted to prevent. Now the object literal at the call site is the only
 * list there is.
 *
 * No memo: the comparison is a shallow walk of a couple of dozen keys (see
 * hasChanges), and `values` is a fresh literal on every render anyway, so a
 * memo could never bail out and would only add bookkeeping.
 */
export function useDirtyTracker(values: Record<string, unknown>): boolean {
  // The initializer expression re-runs on every render and React discards
  // all but the first result, so this captures the mount-time values
  // without needing an effect to "capture once".
  const initial = useRef(values);
  return hasChanges(values, initial.current);
}
