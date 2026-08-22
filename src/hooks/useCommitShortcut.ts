import { useEffect, useRef } from "react";

/**
 * Cmd/Ctrl+Enter commits the panel you're in, from anywhere inside it --
 * submitting a form drawer (same as clicking Add/Update) or applying the
 * filter panel's draft (same as clicking Apply Filters). All three used to
 * reimplement this identical listener individually.
 *
 * Deliberately not gated on a typing-target check like the app's bare-key
 * shortcuts (see useGlobalShortcuts): the modifier already makes this
 * impossible to trigger by accident while typing, and the whole point is
 * that it works while a field has focus.
 *
 * `onCommit` is read through a ref so callers can pass an inline closure
 * over live state without the listener being torn down and re-added on
 * every render -- FilterPanel's version closes over four pieces of draft
 * state and so was re-attaching on every checkbox click.
 */
export function useCommitShortcut(onCommit: () => void) {
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onCommitRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
