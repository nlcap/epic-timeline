import { useMemo, useRef, useState } from "react";
import { COLLECTIONS } from "../data/collections";
import {
  ALL_PARTS,
  countBySlice,
  countRecords,
  keysForSelection,
  mergeBundles,
  partitionBundle,
  readBundleFromStorage,
  SELECTION_PART_META,
  withReferencedLines,
  type Selection,
  type SliceCounts,
  type StoreBundle,
} from "../lib/collectionScope";
import {
  CUSTOM_COLLECTION_CONFIG_KEY,
  CUSTOM_COLLECTION_ID,
  EXPORT_KEYS,
  stripIconsFromPayload,
  type ExportKey,
} from "../lib/overrideKeys";
import {
  mergeSandboxSnapshots,
  SANDBOX_SNAPSHOTS_KEY,
  stripIconsFromSnapshots,
  type SandboxSnapshot,
} from "../lib/sandboxSnapshots";
import { safeSetItem } from "../lib/storage";
import { DataSelectionPicker } from "./DataSelectionPicker";
import { RadioRow } from "./RadioRow";
import { BUTTON_PRIMARY_LIGHT, BUTTON_SECONDARY } from "./buttonStyles";

type ImportMode = "replace" | "merge";

/** A keyed map of records, or null for anything that can't be one -- a
 * primitive, an array, or an absent key. Both the sliceable stores and the
 * two whole-blob payload keys have to pass this before anything trusts
 * them into localStorage. */
function asRecordMap(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Everything an import file can carry. Each piece is independently
 * optional: a Sandbox tab configured but never populated exports a config
 * and no stores, and a file sharing only a saved-sandbox library has
 * neither. */
interface ParsedImport {
  /** The sliceable stores, icon data stripped -- see below. */
  bundle: StoreBundle | null;
  /** The Sandbox tab's own configuration: a single blob rather than a
   * sliceable store, so it's read straight off the payload rather than
   * through the bundle machinery (see CUSTOM_COLLECTION_CONFIG_KEY). */
  customConfig: Record<string, unknown> | null;
  /** The user's library of saved Sandbox timelines -- itself a whole
   * Record<id, SandboxSnapshot> rather than one blob (see
   * SANDBOX_SNAPSHOTS_KEY). */
  sandboxSnapshots: Record<string, SandboxSnapshot> | null;
}

/**
 * Reads an export file once and pulls out all three of the things it can
 * carry. Returns null only when the text isn't a JSON object at all --
 * individual pieces come back null when the file simply predates them,
 * which is every export made before each was added, hence no error.
 *
 * One parse, not three: this used to be three functions each calling
 * JSON.parse on the same (potentially multi-megabyte) text, with the two
 * later ones silently swallowing a syntax error on the grounds that the
 * first had already reported it.
 *
 * Any top-level key not named here -- notably the "__meta" block newer
 * exports carry -- is ignored, which is what keeps the format readable in
 * both directions. Icon image data is stripped on the way in as well as
 * out, so files written before the export side stripped it can't
 * reintroduce broken icons.
 */
function parseImportFile(text: string): ParsedImport | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const root = asRecordMap(parsed);
  if (!root) return null;

  const bundle: StoreBundle = {};
  for (const key of EXPORT_KEYS) {
    const store = asRecordMap(root[key]);
    if (store) bundle[key] = store;
  }

  const snapshots = asRecordMap(root[SANDBOX_SNAPSHOTS_KEY]);

  return {
    bundle: Object.keys(bundle).length > 0 ? stripIconsFromPayload(bundle) : null,
    customConfig: asRecordMap(root[CUSTOM_COLLECTION_CONFIG_KEY]),
    // Stripped a level deeper than the stores above: each snapshot carries
    // its own nested bundle, which stripIconsFromPayload can't see into.
    sandboxSnapshots: snapshots
      ? stripIconsFromSnapshots(snapshots as Record<string, SandboxSnapshot>)
      : null,
  };
}

/** Everything the file actually holds, checked and ready to import --
 * the sensible default, since a slice with nothing in it can't be
 * selected anyway (DataSelectionPicker greys those rows out). */
function selectionFromCounts(counts: SliceCounts): Selection {
  return {
    collectionIds: COLLECTIONS.filter((c) => (counts.byCollection[c.id] ?? 0) > 0).map((c) => c.id),
    parts: ALL_PARTS.filter((p) => counts.byPart[p] > 0),
  };
}

/** e.g. "lines & volumes, ownership" -- what used to be a separate
 * "main timeline"/"speculative timeline" phrase plus a list of kinds is
 * now just the part labels themselves, since a part like "Speculative
 * lines & volumes" already says which timeline layer it's on. */
function selectionDescription(selection: Selection): string {
  return selection.parts.map((p) => SELECTION_PART_META[p].label.toLowerCase()).join(", ");
}

/**
 * Counterpart to ExportDataPanel. Two ways in -- paste a previously
 * exported JSON blob into the textarea, or upload an exported file -- both
 * of which land on the same review step: the two-axis picker (see
 * DataSelectionPicker), showing how many records the file holds for each
 * collection and each of the six things it can carry, with anything it has
 * nothing for greyed out. So a file containing every collection can still
 * be imported one tab at a time, and someone else's speculative scenarios
 * can come in without touching your own real corrections.
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
 * One tab of ManageDataButton's Export/Import/Reset modal -- it only mounts
 * while its tab is selected, which is what gives every visit a clean start
 * (the `reset` below only has to handle backing out of a file mid-review,
 * not a fresh open, since a fresh mount already starts every field at its
 * initial value). No onClose either: unlike Reset's own Cancel button,
 * nothing in this flow dismisses the modal itself -- that's the shared
 * header's job.
 */
export function ImportDataPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [source, setSource] = useState<{
    label: string;
    bundle: StoreBundle;
    customConfig: Record<string, unknown> | null;
    sandboxSnapshots: Record<string, SandboxSnapshot> | null;
  } | null>(null);
  const [selection, setSelection] = useState<Selection>({ collectionIds: [], parts: [] });
  const [mode, setMode] = useState<ImportMode>("replace");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setPasteText("");
    setSource(null);
    setSelection({ collectionIds: [], parts: [] });
    setMode("replace");
    setConfirming(false);
    setError("");
  };

  // An import file needn't be self-contained -- a notes-only export holds
  // notes but not the custom speculative lines they hang off. Passing the
  // local stores as resolution context lets those records still be placed
  // in the right collection instead of being quietly skipped. Snapshotted
  // once per mount, since nothing writes to localStorage while the dialog
  // is up.
  const localBundle = useMemo(() => readBundleFromStorage(), []);

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
    const parsed = parseImportFile(text);
    // A Sandbox tab that's been configured but has no lines yet exports a
    // file with the configuration and nothing else, and a file sharing
    // just a saved-sandbox library has neither -- so a missing bundle
    // alone isn't grounds to reject it, only a file carrying none of the
    // three.
    if (!parsed || (!parsed.bundle && !parsed.customConfig && !parsed.sandboxSnapshots)) {
      setError("That file doesn't look like an Epic Timeline export -- no recognized keys found.");
      return;
    }
    const { bundle, customConfig, sandboxSnapshots } = parsed;
    const resolved = bundle ?? {};
    setSource({ label, bundle: resolved, customConfig, sandboxSnapshots });
    const counts = selectionFromCounts(countBySlice(resolved, localBundle));
    // Same reason: with no records to count, nothing would be selected and
    // neither the config nor the saved-sandbox library would have a
    // selected collection to ride in on. Select the Sandbox tab explicitly
    // so a config-only or snapshots-only file can still be applied.
    setSelection(
      (customConfig || sandboxSnapshots) && !counts.collectionIds.includes(CUSTOM_COLLECTION_ID)
        ? { ...counts, collectionIds: [...counts.collectionIds, CUSTOM_COLLECTION_ID] }
        : counts
    );
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

    // The Sandbox tab's configuration, when the file carries one and this
    // import actually covers that tab. Written outside the loop above
    // because it isn't one of the sliceable stores -- it's a single blob,
    // so the file's copy simply wins, which is the same "a collision
    // resolves to the file" rule replace and merge already share for
    // records. Its failure is folded into the same report.
    if (source?.customConfig && selection.collectionIds.includes(CUSTOM_COLLECTION_ID)) {
      if (!safeSetItem(CUSTOM_COLLECTION_CONFIG_KEY, JSON.stringify(source.customConfig))) {
        failed.push(CUSTOM_COLLECTION_CONFIG_KEY);
      }
    }

    // The user's library of saved Sandbox timelines, under the same
    // condition. Unlike the config above, this key is itself a whole keyed
    // library rather than a single blob, so it's always merged by id --
    // regardless of the replace/merge mode picked above -- instead of
    // overwritten. That mode governs the *live* Sandbox tab's content;
    // applying "replace" here too would silently delete every other saved
    // sandbox over a choice that was never about the library at all.
    if (source?.sandboxSnapshots && selection.collectionIds.includes(CUSTOM_COLLECTION_ID)) {
      if (!mergeSandboxSnapshots(source.sandboxSnapshots)) {
        failed.push(SANDBOX_SNAPSHOTS_KEY);
      }
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

  // Neither the Sandbox tab's configuration nor its saved-sandbox library
  // is a record, so neither shows up in the counts below -- but either is
  // still something to import. A file holding just one of them (a
  // configured-but-empty Sandbox tab, or someone sharing only their saved
  // sandbox designs) has zero records and would otherwise leave Continue
  // permanently disabled.
  const importsCustomConfig =
    !!source?.customConfig && selection.collectionIds.includes(CUSTOM_COLLECTION_ID);
  const importsSandboxSnapshots =
    !!source?.sandboxSnapshots && selection.collectionIds.includes(CUSTOM_COLLECTION_ID);
  const canImport =
    (selection.collectionIds.length > 0 && keysForSelection(selection).length > 0) ||
    importsCustomConfig ||
    importsSandboxSnapshots;

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
    <>
      {/* Stands in for this dialog's old per-phase modal title (see the
       * `title` derivation above), now that the modal chrome's own title is
       * the fixed "Manage Data" shared with the Export/Reset tabs. */}
      <p className="mt-3 shrink-0 text-sm font-semibold text-white">{title}</p>
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
            className={`mt-4 w-full ${BUTTON_SECONDARY}`}
          >
            Try again
          </button>
        </>
      ) : confirming ? (
        <div className="mt-4 rounded-md border border-amber-900 bg-amber-950/40 p-4">
          <p className="text-sm text-amber-100">
            {mode === "replace" ? (
              <>
                This will <strong>replace</strong> your {selectedCollectionNames.join(", ")} data (
                {selectionDescription(selection)}) with the {incomingCount}{" "}
                record{incomingCount === 1 ? "" : "s"} in "{source?.label}".
                Anything you've changed there since that export is lost. This can't be undone.
              </>
            ) : (
              <>
                This will <strong>merge</strong> {incomingCount} record
                {incomingCount === 1 ? "" : "s"} from "{source?.label}" into your{" "}
                {selectedCollectionNames.join(", ")} data ({selectionDescription(selection)}). Your
                records are kept; the file wins wherever the two describe the same line or volume.
              </>
            )}{" "}
            Everything outside that selection is untouched. The page reloads afterward.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={`flex-1 ${BUTTON_SECONDARY}`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              className={`flex-1 ${BUTTON_PRIMARY_LIGHT}`}
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
              ? importsCustomConfig && importsSandboxSnapshots
                ? "No records in this selection -- the Sandbox tab's own settings and saved sandboxes will still be imported."
                : importsCustomConfig
                ? "No records in this selection -- the Sandbox tab's own settings will still be imported."
                : importsSandboxSnapshots
                ? "No records in this selection -- your saved sandboxes will still be imported."
                : "Nothing to import in this selection."
              : `${incomingCount} record${incomingCount === 1 ? "" : "s"} will be imported.${
                  carriedLines > 0
                    ? ` Plus ${carriedLines} line${
                        carriedLines === 1 ? "" : "s"
                      } they hang off, added if missing.`
                    : ""
                }${
                  importsCustomConfig && importsSandboxSnapshots
                    ? " The Sandbox tab's own settings and saved sandboxes come too."
                    : importsCustomConfig
                    ? " The Sandbox tab's own settings come too."
                    : importsSandboxSnapshots
                    ? " Your saved sandboxes come too."
                    : ""
                }`}
          </p>

          <div className="mt-2 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={reset}
              className={`flex-1 ${BUTTON_SECONDARY}`}
            >
              Choose another file
            </button>
            <button
              type="button"
              disabled={
                !canImport ||
                (incomingCount === 0 && !importsCustomConfig && !importsSandboxSnapshots)
              }
              onClick={() => setConfirming(true)}
              className={`flex-1 ${BUTTON_PRIMARY_LIGHT}`}
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
            // h-64, matching ExportDataPanel's own JSON textarea (same
            // job, same dialog family) -- this used to be h-[40rem]
            // (640px), tall enough on its own to push the Paste/Upload/
            // Review buttons below the fold of the modal's 85vh cap on any
            // ordinary window, forcing a scroll before the dialog was even
            // usable.
            className="mt-3 h-64 min-h-0 w-full shrink resize-none rounded-md border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs text-neutral-300 placeholder:text-neutral-600"
          />
          <div className="mt-3 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className={`flex-1 ${BUTTON_SECONDARY}`}
            >
              Paste from clipboard
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 ${BUTTON_SECONDARY}`}
            >
              Upload JSON
            </button>
          </div>
          <button
            type="button"
            disabled={pasteText.trim().length === 0}
            onClick={() => beginReview("pasted JSON", pasteText)}
            className={`mt-2 w-full shrink-0 ${BUTTON_PRIMARY_LIGHT}`}
          >
            Review pasted JSON
          </button>
        </>
      )}
    </>
  );
}
