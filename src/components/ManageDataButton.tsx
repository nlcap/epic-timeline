import { useEffect, useState } from "react";
import { ExportDataPanel } from "./ExportDataPanel";
import { ImportDataPanel } from "./ImportDataPanel";
import { ResetLineDataPanel } from "./ResetLineDataPanel";
import { SettingsModal } from "./SettingsModal";

type ManageDataTab = "export" | "import" | "reset";

const TABS: { id: ManageDataTab; label: string }[] = [
  { id: "export", label: "Export" },
  { id: "import", label: "Import" },
  { id: "reset", label: "Reset" },
];

/**
 * One settings-menu row -- "Manage Data" -- for the three local-data tools
 * that used to each be their own row (Export data / Import data / Reset
 * line data), switched between with the same Any/All-style segmented
 * control FilterPanel uses for its filter mode. Export is the default tab
 * every time this reopens (see the effect below), not whichever tab was
 * last open -- these are three unrelated tools sharing a modal purely for
 * menu real estate, not a wizard with a remembered position.
 *
 * Each tab's panel (ExportDataPanel/ImportDataPanel/ResetLineDataPanel)
 * mounts only while its tab is selected, which is what gives every visit a
 * clean slate -- neither this component nor its children need the
 * reset-on-reopen effects the three original dialogs each had, since a
 * fresh mount already starts every field at its initial value. Only Reset
 * still takes `onClose`: its own Cancel button dismisses the whole modal,
 * where Export and Import have no such button of their own -- both only
 * ever closed via the shared header/Escape/backdrop that SettingsModal
 * already provides.
 *
 * Controlled by `open`/`onClose`, same as the three dialogs it replaces --
 * the trigger lives in the nav's gear dropdown.
 */
export function ManageDataButton({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<ManageDataTab>("export");

  useEffect(() => {
    if (open) setTab("export");
  }, [open]);

  if (!open) return null;

  return (
    <SettingsModal title="Manage Data" onClose={onClose} maxWidthClassName="max-w-3xl">
      <div className="flex shrink-0 gap-1 rounded-md border border-neutral-700 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`flex-1 rounded px-3 py-1 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "export" && <ExportDataPanel />}
      {tab === "import" && <ImportDataPanel />}
      {tab === "reset" && <ResetLineDataPanel onClose={onClose} />}
    </SettingsModal>
  );
}
