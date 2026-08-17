import { useEffect, useState } from "react";
import { COLLECTIONS } from "../data/collections";
import { COLLECTION_DATA_UPDATED_AT } from "../lib/collectionUpdatedAt";
import { resetLineData, type TimelineScope } from "../lib/resetLineData";
import { CheckRow } from "./CheckRow";
import { SettingsModal } from "./SettingsModal";

const TIMELINE_SCOPES: { id: TimelineScope; label: string }[] = [
  { id: "main", label: "Main Timeline" },
  { id: "speculative", label: "Speculative Timeline" },
];

/**
 * Wipes local overrides/additions back to the shipped seed data, scoped to
 * whichever collections and timeline layers the user checks -- e.g.
 * Ultimate + Licensed + Main Timeline only resets those two collections'
 * official line/volume/ownership data, leaving every other collection and
 * any speculative data alone. See resetLineData for the scoping logic.
 * Controlled by `open`/`onClose`, same as ExportDataButton/ImportDataButton
 * -- the trigger lives in the nav's gear dropdown.
 */
export function ResetLineDataButton({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [selectedScopes, setSelectedScopes] = useState<Set<TimelineScope>>(new Set());
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedCollections(new Set());
    setSelectedScopes(new Set());
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
    resetLineData({ collectionIds: [...selectedCollections], scopes: [...selectedScopes] });
    window.location.reload();
  };

  return (
    <SettingsModal
      title="Reset line data"
      onClose={onClose}
      maxWidthClassName="max-w-md"
      scrollable={false}
    >
      {confirming ? (
        <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 p-4">
          <p className="text-sm text-red-200">
            This will permanently reset {selectedCollectionNames.join(", ")} (
            {scopeLabel}) to the default seed data, deleting any lines or volumes you've
            added or edited there. This can't be undone.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Yes, reset
            </button>
          </div>
        </div>
      ) : (
        <>
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

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canReset}
              onClick={() => setConfirming(true)}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:enabled:bg-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              Reset data
            </button>
          </div>
        </>
      )}
    </SettingsModal>
  );
}
