/**
 * The "has anything actually been edited" comparison behind the form
 * drawers' unsaved-changes prompts. Split out of useDirtyTracker for the
 * same reason lib/filters.ts is split out of useTimelineFilters: the rule
 * itself is a plain function over plain data, and testable as such, while
 * the hook only decides when to run it.
 */

/**
 * Whether one field's value has moved from what it started as.
 *
 * Reference inequality settles it for the primitives that make up most of a
 * form -- strings, numbers, booleans, undefined. But a field holding an
 * object or array (LineFormDrawer's `tags` and per-era icon map,
 * CustomCollectionConfigModal's `eras`) is rebuilt on every keystroke, so
 * its identity always differs whether or not the contents moved; those
 * compare by value, which is what all three call sites were doing by hand
 * with JSON.stringify before this existed.
 *
 * A value that changes *kind* -- `undefined` becoming `[]`, say -- is a
 * change, since only one side is an object and there is nothing to compare
 * by value against.
 */
export function fieldChanged(current: unknown, initial: unknown): boolean {
  if (Object.is(current, initial)) return false;
  if (isObject(current) && isObject(initial)) {
    return JSON.stringify(current) !== JSON.stringify(initial);
  }
  return true;
}

/**
 * Whether any field in `current` differs from its counterpart in
 * `initial`. Driven by `current`'s own keys: the two come from the same
 * object literal one render apart, so they always have the same shape.
 */
export function hasChanges(
  current: Record<string, unknown>,
  initial: Record<string, unknown>
): boolean {
  for (const key of Object.keys(current)) {
    if (fieldChanged(current[key], initial[key])) return true;
  }
  return false;
}

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}
