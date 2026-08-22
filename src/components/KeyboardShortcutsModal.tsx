import { SettingsModal } from "./SettingsModal";
import { COLLECTIONS } from "../data/collections";
import { globalShortcutHelp } from "../hooks/useGlobalShortcuts";

const GLOBAL_SHORTCUTS = globalShortcutHelp(COLLECTIONS.length);

/** Unlike the global list above, these aren't one hook's doing -- Escape
 * comes from useEscapeToClose, Cmd/Ctrl+Enter from each form drawer's and
 * FilterPanel's own submit listener, and "E"/"S"/"R"/the stepper keys/Space
 * are each their own listener inside VolumeDetailPanel -- so there's no
 * single definition to derive them from. */
const PANEL_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "Esc", label: "Close the open panel" },
  { keys: "⌘/Ctrl Enter", label: "Save, or apply filters" },
  { keys: "E", label: "Edit the open volume" },
  { keys: "S", label: "Open the shelving status picker" },
  { keys: "R", label: "Open the reading status picker" },
  { keys: "← → , .", label: "Step to the previous/next volume" },
  { keys: "↑ ↓", label: "Jump to the nearest volume on the line above/below" },
  { keys: "Space", label: "Page down; wraps to the top at the end" },
];

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-neutral-300">{label}</span>
      <kbd className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 font-mono text-xs text-neutral-200">
        {keys}
      </kbd>
    </div>
  );
}

/**
 * Cheat-sheet for the app's keyboard shortcuts. Two ways in: the "?" global
 * shortcut (see useGlobalShortcuts) and the settings menu's "Keyboard
 * shortcuts" item (see TopNav.tsx) -- both routed through App.tsx's
 * shortcutsOpen state, since both need to be able to open it.
 */
export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <SettingsModal
      title="Keyboard shortcuts"
      onClose={onClose}
      // Widened from the old single-column max-w-sm to fit two columns
      // side by side -- see the grid below. sm:grid-cols-2 (not md:)
      // matches DataSelectionPicker's own responsive grid, the one other
      // place in the app doing this same "columns down to a breakpoint"
      // layout, so the two don't collapse at different points for no
      // reason.
      maxWidthClassName="max-w-2xl"
      scrollable={false}
    >
      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Anywhere
          </h3>
          <div className="mt-1 divide-y divide-neutral-800">
            {GLOBAL_SHORTCUTS.map((s) => (
              <ShortcutRow key={s.label} {...s} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            With a panel open
          </h3>
          <div className="mt-1 divide-y divide-neutral-800">
            {PANEL_SHORTCUTS.map((s) => (
              <ShortcutRow key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>
    </SettingsModal>
  );
}
