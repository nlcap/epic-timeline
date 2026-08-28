import { useEffect } from "react";
import { SettingsModal } from "./SettingsModal";
import { isTypingTarget } from "../lib/keyboard";
import { BUTTON_PRIMARY } from "./buttonStyles";

/**
 * Confirmation shown when an edit-mode LineFormDrawer/VolumeFormDrawer is
 * dismissed via the backdrop, Escape, or Close ✕ while it has unsaved
 * edits -- those three used to just discard silently, same as the drawer's
 * own explicit Cancel button. Cancel still does (a button literally
 * labeled "Cancel" is already a deliberate "discard this" signal); this
 * only covers the three that could otherwise lose work by accident.
 *
 * Built on the same SettingsModal shell as the settings-menu dialogs, so
 * *its own* backdrop click/Escape/Close ✕ all mean "keep editing" -- they
 * dismiss just this prompt and hand control back to the still-open drawer,
 * touching nothing.
 */
export function UnsavedChangesModal({
  entityLabel,
  onSave,
  onDiscard,
  onKeepEditing,
}: {
  /** Lowercase noun for the copy, e.g. "line", "volume", "gap", "note". */
  entityLabel: string;
  onSave: () => void;
  onDiscard: () => void;
  onKeepEditing: () => void;
}) {
  // "S" saves, "D"/"C" discard -- both letters for discard since "cancel"
  // and "don't save" are both reasonable ways to think about that button,
  // and there's no clash to arbitrate between them (this modal has no
  // other letter shortcuts). Gated on isTypingTarget the same as every
  // other bare-key shortcut in the app: this modal has no text field of
  // its own, but the drawer underneath does, and Escape (unlike a click)
  // doesn't blur whatever was focused there before this opened -- without
  // the guard, typing a genuine "s" mid-edit while this happens to be up
  // would both save AND leave an "s" in the field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          onSave();
          break;
        case "d":
        case "c":
          e.preventDefault();
          onDiscard();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSave, onDiscard]);

  return (
    <SettingsModal
      title="Unsaved changes"
      onClose={onKeepEditing}
      maxWidthClassName="max-w-sm"
      scrollable={false}
    >
      <p className="mt-3 text-sm text-neutral-300">
        You have unsaved changes to this {entityLabel}. Save them before closing, or discard them?
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onDiscard}
          className="flex-1 rounded-md border border-red-900 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/40"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          className={`flex-1 ${BUTTON_PRIMARY}`}
        >
          Save changes
        </button>
      </div>
    </SettingsModal>
  );
}
