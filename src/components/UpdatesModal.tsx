import { SettingsModal } from "./SettingsModal";
import { UpdateEntryList } from "./UpdateEntryList";
import { PUBLIC_RELEASES } from "../data/updates";

const ENTRY_COUNT = PUBLIC_RELEASES.reduce((total, release) => total + release.entries.length, 0);

/**
 * The full changelog, read from data/updates.ts. Reached from the settings
 * menu on desktop and mobile alike (see TopNav's settingsItems), and built
 * on the same SettingsModal shell as the other dialogs.
 *
 * Wider than the rest of them (max-w-2xl vs. the default xl) because this
 * is the only one whose content is prose -- a paragraph set to the width
 * that suits Reset's checklist runs to too many short lines to read
 * comfortably.
 *
 * Opening this counts as reading everything in it -- TopNav calls
 * useWhatsNew's markSeen alongside setUpdatesOpen(true), so the one-time
 * WhatsNewModal popup doesn't re-announce entries a visitor already saw
 * here.
 */
export function UpdatesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <SettingsModal title="Updates" onClose={onClose} maxWidthClassName="max-w-2xl">
      <p className="mt-1 shrink-0 text-xs text-neutral-500">
        {ENTRY_COUNT} changes across {PUBLIC_RELEASES.length} days, newest first.
      </p>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <UpdateEntryList releases={PUBLIC_RELEASES} />
      </div>
    </SettingsModal>
  );
}
