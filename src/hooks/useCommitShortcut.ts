import { useEffect, useRef } from "react";

/**
 * Cmd/Ctrl+Enter submits the form drawer you're in, from anywhere inside it
 * -- same as clicking Add/Update. VolumeFormDrawer and LineFormDrawer used
 * to each reimplement this identical listener individually.
 *
 * Deliberately not gated on a typing-target check like the app's bare-key
 * shortcuts (see useGlobalShortcuts): the modifier already makes this
 * impossible to trigger by accident while typing, and the whole point is
 * that it works while a field has focus.
 *
 * `onCommit` is read through a ref so callers can pass an inline closure
 * over live state without the listener being torn down and re-added on
 * every render.
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
