import { SettingsModal } from "./SettingsModal";
import { UpdateEntryList } from "./UpdateEntryList";
import type { UpdateRelease } from "../data/updates";

/**
 * One-time popup surfacing whatever's landed in the changelog since this
 * visitor was last here -- driven by useWhatsNew (see App.tsx), not the
 * settings menu, so it shows up unprompted rather than waiting to be
 * opened. Built on the same SettingsModal shell as UpdatesModal (the full
 * history), just narrower since it's only ever a handful of days: closing
 * it any of SettingsModal's three ways (✕, Escape, backdrop) counts as
 * dismissal and marks every release shown here seen, so it won't return
 * until a newer one lands.
 */
export function WhatsNewModal({
  releases,
  onDismiss,
}: {
  releases: UpdateRelease[];
  onDismiss: () => void;
}) {
  if (releases.length === 0) return null;

  const entryCount = releases.reduce((total, release) => total + release.entries.length, 0);

  return (
    <SettingsModal title="What's new" onClose={onDismiss}>
      <p className="mt-1 shrink-0 text-xs text-neutral-500">
        {entryCount} {entryCount === 1 ? "change" : "changes"} since your last visit.
      </p>

      <UpdateEntryList releases={releases} />
    </SettingsModal>
  );
}
