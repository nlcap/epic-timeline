import { useEffect, useMemo, useRef, useState } from "react";
import { COLLECTIONS } from "../data/collections";
import {
  ALL_KINDS,
  ALL_SCOPES,
  countBySlice,
  countRecords,
  keysForSelection,
  mergeBundles,
  partitionBundle,
  readBundleFromStorage,
  withReferencedLines,
  type DataKind,
  type Selection,
  type SliceCounts,
  type StoreBundle,
  type TimelineScope,
} from "../lib/collectionScope";
import { EXPORT_KEYS, stripIconsFromPayload, type ExportKey } from "../lib/overrideKeys";
import { safeSetItem } from "../lib/storage";
import { DataSelectionPicker } from "./DataSelectionPicker";
import { RadioRow } from "./RadioRow";
import { SettingsModal } from "./SettingsModal";

type ImportMode = "replace" | "merge";

/** Parses text as JSON and pulls out whichever EXPORT_KEYS it recognizes.
 * Returns null for anything that isn't a usable export (bad JSON, an
 * object with none of the keys this app knows about, etc). Any other
 * top-level key -- notably the "__meta" block newer exports carry -- is
 * ignored here, which is what keeps the format readable in both
 * directions. Strips icon image data too, covering exports made before
 * that stripping existed on the way out, so old export files can't
 * reintroduce broken icons. */
function parseExportPayload(text: string): StoreBundle | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const bundle: StoreBundle = {};
  for (const key of EXPORT_KEYS) {
    const store = (parsed as Record<string, unknown>)[key];
    // A store has to be a map of records to be sliceable at all -- a key
    // present but holding a string or an array is treated as absent
    // rather than trusted into localStorage.
    if (typeof store === "object" && store !== null && !Array.isArray(store)) {
      bundle[key] = store as Record<string, unknown>;
    }
  }
  return Object.keys(bundle).length > 0 ? stripIconsFromPayload(bundle) : null;
}

/** Everything the file actually holds, checked and ready to import --
 * the sensible default, since a slice with nothing in it can't be
 * selected anyway (DataSelectionPicker greys those rows out). */
function selectionFromCounts(counts: SliceCounts): Selection {
  return {
    collectionIds: COLLECTIONS.filter((c) => (counts.byCollection[c.id] ?? 0) > 0).map((c) => c.id),
    scopes: ALL_SCOPES.filter((s) => counts.byScope[s] > 0),
    kinds: ALL_KINDS.filter((k) => counts.byKind[k] > 0),
  };
}

function scopeLabel(scopes: TimelineScope[]): string {
  if (scopes.length === 2) return "main and speculative timeline";
  return scopes[0] === "main" ? "main timeline" : "speculative timeline";
}

const KIND_LABELS: Record<DataKind, string> = {
  edits: "lines & volumes",
  notes: "notes",
  ownership: "ownership",
  reading: "reading progress",
  rating: "star ratings",
};

/**
 * Counterpart to ExportDataButton. Two ways in -- paste a previously
 * exported JSON blob into the textarea, or upload an exported file -- both
 * of which land on the same review step: the three-axis picker (see
 * DataSelectionPicker), showing how many records the file holds for each
 * collection, timeline layer, and data type, with anything it has nothing
 * for greyed out. So a file containing every collection can still be
 * imported one tab at a time, and someone else's speculative scenarios can
 * come in without touching your own real corrections.
 *
 * Two ways to apply it, since both are things you'd genuinely want:
 *   replace -- the selected slice is cleared out first, so the file
 *              becomes the truth for it (restoring a tab from a backup)
 *   merge   -- your records are kept and the file's are layered on top,
 *              winning only on an id collision (pulling in data from
 *              another browser without losing what's here)
 *
 * A full reload afterward is the simplest way to get every hook
 * (useLineOverrides, useVolumeOverrides, useOwnership, useReadingStatus,
 * useSpeculativeLines, useSpeculativeVolumes) to re-read from
 * localStorage, since they only load on mount.
 *
 * Controlled by `open`/`onClose` -- the trigger lives in the nav's gear
 * dropdown, so this component only renders the modal itself.
 */
export function ImportDataButton({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [source, setSource] = useState<{ label: string; bundle: StoreBundle } | null>(null);
  const [selection, setSelection] = useState<Selection>({
    collectionIds: [],
    scopes: [],
    kinds: [],
  });
  const [mode, setMode] = useState<ImportMode>("replace");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setPasteText("");
    setSource(null);
    setSelection({ collectionIds: [], scopes: [], kinds: [] });
    setMode("replace");
    setConfirming(false);
    setError("");
  };

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open]);

  // An import file needn't be self-contained -- a notes-only export holds
  // notes but not the custom speculative lines they hang off. Passing the
  // local stores as resolution context lets those records still be placed
  // in the right collection instead of being quietly skipped. Snapshotted
  // once per opening, since nothing writes to localStorage while the dialog
  // is up.
  const localBundle = useMemo(() => (open ? readBundleFromStorage() : {}), [open]);

  const counts = useMemo(
    () => (source ? countBySlice(source.bundle, localBundle) : null),
    [source, localBundle]
  );

  const { incoming, incomingCount, carriedLines } = useMemo(() => {
    if (!source) return { incoming: {} as StoreBundle, incomingCount: 0, carriedLines: 0 };
    const selected = partitionBundle(source.bundle, selection, localBundle).inside;
    // Mirrors the export side: bring the lines these entries hang off, so
    // importing just the notes doesn't leave them attached to lines this
    // browser has never heard of. Sourced from the file, so it only picks
    // up lines the file actually carries.
    const withLines = withReferencedLines(selected, source.bundle);
    return {
      incoming: withLines,
      incomingCount: countRecords(selected),
      carriedLines: countRecords(withLines) - countRecords(selected),
    };
  }, [source, selection, localBundle]);

  const beginReview = (label: string, text: string) => {
    const bundle = parseExportPayload(text);
    if (!bundle) {
      setError("That file doesn't look like an Epic Timeline export -- no recognized keys found.");
      return;
    }
    setSource({ label, bundle });
    setSelection(selectionFromCounts(countBySlice(bundle, localBundle)));
    setConfirming(false);
  };

  const handlePasteFromClipboard = async () => {
    try {
      setPasteText(await navigator.clipboard.readText());
    } catch {
      // Clipboard read can fail (permissions, empty clipboard) -- leave
      // whatever's already in the textarea alone.
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    beginReview(file.name, await file.text());
  };

  const handleConfirmImport = () => {
    if (!source) return;

    // Replace clears the selected slice first by starting from the half of
    // the local data the selection *doesn't* name; merge keeps everything
    // local. Either way the file's selected records go on top, so a
    // colliding id resolves to the file in both modes. Partitioned from the
    // same snapshot the preview counts came from, so what gets written is
    // what was shown.
    const base =
      mode === "replace" ? partitionBundle(localBundle, selection).outside : localBundle;
    const result = mergeBundles(base, incoming);

    // Only stores this import actually affects get written -- the rest of
    // `result` is untouched local data, and rewriting it would risk
    // spending quota to no effect. That's the selection's own stores plus
    // whichever store the carried lines landed in, which the selection
    // doesn't name (a notes-only import still has to write the speculative
    // lines it brought along). Those writes only ever add: `base` already
    // holds every local line, since an unselected store passes through
    // partitionBundle untouched.
    const targetKeys = new Set<ExportKey>([
      ...keysForSelection(selection),
      ...(Object.keys(incoming) as ExportKey[]),
    ]);

    const failed: string[] = [];
    for (const key of targetKeys) {
      if (!safeSetItem(key, JSON.stringify(result[key] ?? {}))) failed.push(key);
    }

    // A quota failure part-way through leaves storage half-written, so say
    // so rather than reloading into a state the user didn't ask for. (The
    // StorageErrorToast fires too, but it's easy to miss behind a modal
    // that's about to disappear in a page reload.)
    if (failed.length > 0) {
      setError(
        `Ran out of browser storage part-way through -- ${failed.length} of ${targetKeys.size} stores couldn't be written, so this import is incomplete. Free up space (try Storage debug) and import again.`
      );
      setConfirming(false);
      return;
    }
    window.location.reload();
  };

  if (!open) return null;

  const canImport = selection.collectionIds.length > 0 && keysForSelection(selection).length > 0;

  const title = error
    ? "Import failed"
    : confirming
    ? "Import this data?"
    : source
    ? "Choose what to import"
    : "Import corrections & speculation data (JSON)";

  const selectedCollectionNames = COLLECTIONS.filter((c) =>
    selection.collectionIds.includes(c.id)
  ).map((c) => c.name);

  return (
    <SettingsModal title={title} onClose={onClose} maxWidthClassName="max-w-3xl">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {error ? (
        <>
          <p className="mt-2 text-sm text-neutral-400">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 w-full rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
          >
            Try again
          </button>
        </>
      ) : confirming ? (
        <div className="mt-4 rounded-md border border-amber-900 bg-amber-950/40 p-4">
          <p className="text-sm text-amber-100">
            {mode === "replace" ? (
              <>
                This will <strong>replace</strong> your {selectedCollectionNames.join(", ")}{" "}
                {scopeLabel(selection.scopes)} data (
                {selection.kinds.map((k) => KIND_LABELS[k]).join(", ")}) with the {incomingCount}{" "}
                record{incomingCount === 1 ? "" : "s"} in "{source?.label}".
                Anything you've changed there since that export is lost. This can't be undone.
              </>
            ) : (
              <>
                This will <strong>merge</strong> {incomingCount} record
                {incomingCount === 1 ? "" : "s"} from "{source?.label}" into your{" "}
                {selectedCollectionNames.join(", ")} {scopeLabel(selection.scopes)} data. Your
                records are kept; the file wins wherever the two describe the same line or volume.
              </>
            )}{" "}
            Everything outside that selection is untouched. The page reloads afterward.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-white"
            >
              Import &amp; reload
            </button>
          </div>
        </div>
      ) : source && counts ? (
        <>
          <p className="mt-2 shrink-0 text-sm text-neutral-400">
            "{source.label}" holds {counts.total} record{counts.total === 1 ? "" : "s"}. Pick what
            to bring in.
          </p>

          <div className="min-h-0 shrink overflow-y-auto">
            <DataSelectionPicker
              value={selection}
              onChange={setSelection}
              availability={counts}
            />

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                How to apply it
              </p>
              <div className="flex flex-col gap-1">
                <RadioRow
                  label="Replace selected data"
                  description="Clears the slice you picked, then loads the file's version of it."
                  checked={mode === "replace"}
                  onSelect={() => setMode("replace")}
                />
                <RadioRow
                  label="Merge into existing"
                  description="Keeps what you have; the file wins only where ids collide."
                  checked={mode === "merge"}
                  onSelect={() => setMode("merge")}
                />
              </div>
            </div>
          </div>

          <p className="mt-3 shrink-0 text-xs text-neutral-500">
            {incomingCount === 0
              ? "Nothing to import in this selection."
              : `${incomingCount} record${incomingCount === 1 ? "" : "s"} will be imported.${
                  carriedLines > 0
                    ? ` Plus ${carriedLines} line${
                        carriedLines === 1 ? "" : "s"
                      } they hang off, added if missing.`
                    : ""
                }`}
          </p>

          <div className="mt-2 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Choose another file
            </button>
            <button
              type="button"
              disabled={!canImport || incomingCount === 0}
              onClick={() => setConfirming(true)}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:enabled:bg-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              Continue
            </button>
          </div>
        </>
      ) : (
        <>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste exported JSON here..."
            className="mt-3 h-[40rem] min-h-0 w-full shrink resize-none rounded-md border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs text-neutral-300 placeholder:text-neutral-600"
          />
          <div className="mt-3 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Paste from clipboard
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Upload JSON
            </button>
          </div>
          <button
            type="button"
            disabled={pasteText.trim().length === 0}
            onClick={() => beginReview("pasted JSON", pasteText)}
            className="mt-2 w-full shrink-0 rounded-md border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:enabled:bg-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-800 disabled:text-neutral-600"
          >
            Review pasted JSON
          </button>
        </>
      )}
    </SettingsModal>
  );
}
