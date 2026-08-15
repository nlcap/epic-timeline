import { SettingsModal } from "./SettingsModal";

const GLOBAL_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "/", label: "Focus the search box" },
  { keys: "F", label: "Open filters" },
  { keys: "N", label: "Add a line" },
  { keys: "1 – 5", label: "Jump to a collection tab" },
  { keys: "+ / -", label: "Zoom in / out" },
  { keys: "S", label: "Toggle Speculation Mode" },
  { keys: "?", label: "Show this cheat sheet" },
];

const PANEL_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "Esc", label: "Close the open panel" },
  { keys: "⌘/Ctrl Enter", label: "Save, or apply filters" },
  { keys: "E", label: "Edit the open volume" },
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
      maxWidthClassName="max-w-sm"
      scrollable={false}
    >
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Anywhere
        </h3>
        <div className="mt-1 divide-y divide-neutral-800">
          {GLOBAL_SHORTCUTS.map((s) => (
            <ShortcutRow key={s.label} {...s} />
          ))}
        </div>

        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          With a panel open
        </h3>
        <div className="mt-1 divide-y divide-neutral-800">
          {PANEL_SHORTCUTS.map((s) => (
            <ShortcutRow key={s.label} {...s} />
          ))}
        </div>
      </div>
    </SettingsModal>
  );
}
