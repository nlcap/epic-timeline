import { useEffect, useState } from "react";
import { COLLECTIONS } from "../data/collections";
import type { DataKind } from "../lib/collectionScope";
import { COLLECTION_DATA_UPDATED_AT } from "../lib/collectionUpdatedAt";
import { resetLineData, type TimelineScope } from "../lib/resetLineData";
import { CheckRow } from "./CheckRow";
import { RadioRow } from "./RadioRow";
import { SettingsModal } from "./SettingsModal";
import { BUTTON_DESTRUCTIVE, BUTTON_PRIMARY_LIGHT, BUTTON_SECONDARY } from "./buttonStyles";

const TIMELINE_SCOPES: { id: TimelineScope; label: string }[] = [
  { id: "main", label: "Main Timeline" },
  { id: "speculative", label: "Speculative Timeline" },
];

/** What a reset touches, as one mutually-exclusive choice rather than the
 * four independent DataKind checkboxes export/import offer -- "which of my
 * four store types" isn't the question a user resetting data is asking;
 * "did I mess up the data, or just my shelf" is. Each maps to the kinds
 * defined in lib/collectionScope.ts:
 *   metadata -> edits + notes    (line/volume overrides, speculative content)
 *   status   -> ownership + reading + rating (the shelving/reading dropdowns
 *               and the star rating widget)
 *   both     -> every kind, the old wholesale-reset behavior
 * Notes travel with metadata rather than status: a note is user-authored
 * content hung off a volume, same as an edit, and it only exists on
 * Speculative Timeline anyway -- it was never something the shelving/reading/
 * rating controls touched. */
type ResetKindGroup = "metadata" | "status" | "both";

const KIND_GROUPS: { id: ResetKindGroup; label: string; description: string }[] = [
  {
    id: "metadata",
    label: "Volume metadata",
    description: "Titles, credits, dates, and any custom lines or volumes you've added.",
  },
  {
    id: "status",
    label: "Shelving & reading status",
    description: "Just the Owned/Wishlist and reading-progress dropdowns, plus your star ratings.",
  },
  { id: "both", label: "Both", description: "Everything above, for a full reset." },
];

const KINDS_FOR_GROUP: Record<ResetKindGroup, DataKind[]> = {
  metadata: ["edits", "notes"],
  status: ["ownership", "reading", "rating"],
  both: ["edits", "notes", "ownership", "reading", "rating"],
};

const GROUP_LABEL: Record<ResetKindGroup, string> = {
  metadata: "volume metadata",
  status: "shelving/reading status and star ratings",
  both: "volume metadata, shelving/reading status, and star ratings",
};

/**
 * Wipes local overrides/additions back to the shipped seed data, scoped to
 * whichever collections, timeline layers, and kind of data (see
 * ResetKindGroup above) the user picks -- e.g. Ultimate + Licensed + Main
 * Timeline + "Volume metadata" resets only those two collections' line and
 * volume overrides, leaving shelving/reading status, every other
 * collection, and any speculative data alone. See resetLineData for the
 * scoping logic. Controlled by `open`/`onClose`, same as
 * ExportDataButton/ImportDataButton -- the trigger lives in the nav's gear
 * dropdown.
 */
export function ResetLineDataButton({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [selectedScopes, setSelectedScopes] = useState<Set<TimelineScope>>(new Set());
  const [kindGroup, setKindGroup] = useState<ResetKindGroup>("metadata");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedCollections(new Set());
    setSelectedScopes(new Set());
    setKindGroup("metadata");
    setConfirming(false);
  }, [open]);

  if (!open) return null;

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleScope = (scope: TimelineScope) => {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  const canReset = selectedCollections.size > 0 && selectedScopes.size > 0;

  const selectedCollectionNames = COLLECTIONS.filter((c) => selectedCollections.has(c.id)).map(
    (c) => c.name
  );
  const scopeLabel =
    selectedScopes.size === 2
      ? "main and speculative timeline data"
      : selectedScopes.has("main")
        ? "main timeline data"
        : "speculative timeline data";

  const handleConfirmReset = () => {
    resetLineData({
      collectionIds: [...selectedCollections],
      scopes: [...selectedScopes],
      kinds: KINDS_FOR_GROUP[kindGroup],
    });
    window.location.reload();
  };

  return (
    <SettingsModal title="Reset line data" onClose={onClose} maxWidthClassName="max-w-md">
      {confirming ? (
        <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 p-4">
          <p className="text-sm text-red-200">
            This will permanently reset {selectedCollectionNames.join(", ")} (
            {scopeLabel}) back to the default seed data for {GROUP_LABEL[kindGroup]}
            {kindGroup !== "status" && ", deleting any lines or volumes you've added or edited there"}
            . This can't be undone.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={`flex-1 ${BUTTON_SECONDARY}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className={`flex-1 ${BUTTON_DESTRUCTIVE}`}
            >
              Yes, reset
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-0 shrink overflow-y-auto">
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Collections
              </p>
              <div className="flex flex-col">
                {COLLECTIONS.map((c) => (
                  <CheckRow
                    key={c.id}
                    label={c.name}
                    subtitle={
                      COLLECTION_DATA_UPDATED_AT[c.id]
                        ? `Last updated: ${COLLECTION_DATA_UPDATED_AT[c.id]}`
                        : undefined
                    }
                    checked={selectedCollections.has(c.id)}
                    onToggle={() => toggleCollection(c.id)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Timeline
              </p>
              <div className="flex flex-col">
                {TIMELINE_SCOPES.map((s) => (
                  <CheckRow
                    key={s.id}
                    label={s.label}
                    checked={selectedScopes.has(s.id)}
                    onToggle={() => toggleScope(s.id)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                What to reset
              </p>
              <div className="flex flex-col gap-1">
                {KIND_GROUPS.map((g) => (
                  <RadioRow
                    key={g.id}
                    label={g.label}
                    description={g.description}
                    checked={kindGroup === g.id}
                    onSelect={() => setKindGroup(g.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex shrink-0 gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${BUTTON_SECONDARY}`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canReset}
              onClick={() => setConfirming(true)}
              className={`flex-1 ${BUTTON_PRIMARY_LIGHT}`}
            >
              Reset data
            </button>
          </div>
        </>
      )}
    </SettingsModal>
  );
}
