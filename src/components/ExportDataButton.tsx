import { useEffect, useMemo, useRef, useState } from "react";
import { COLLECTIONS } from "../data/collections";
import {
  ALL_COLLECTION_IDS,
  countRecords,
  fullSelection,
  isFullSelection,
  partitionBundle,
  readBundleFromStorage,
  withReferencedLines,
  type Selection,
  type StoreBundle,
} from "../lib/collectionScope";
import {
  CUSTOM_COLLECTION_CONFIG_KEY,
  CUSTOM_COLLECTION_ID,
  EXPORT_FORMAT_VERSION,
  EXPORT_KEYS,
  EXPORT_META_KEY,
  stripIconsFromPayload,
} from "../lib/overrideKeys";
import { DataSelectionPicker } from "./DataSelectionPicker";
import { SettingsModal } from "./SettingsModal";
import { BUTTON_SECONDARY_DISABLEABLE } from "./buttonStyles";

/** "ultimate-main", "dc-finest", etc -- a short hint in the download
 * filename so a drawer full of partial exports is still tellable apart. */
function filenameSlice(selection: Selection): string {
  const parts: string[] = [];
  if (selection.collectionIds.length === ALL_COLLECTION_IDS.length) parts.push("all");
  else parts.push(...selection.collectionIds);
  if (selection.scopes.length === 1) parts.push(selection.scopes[0]);
  if (selection.kinds.length < 3) parts.push(...selection.kinds);
  return parts.join("-");
}

/**
 * Dumps local-storage-backed corrections and speculation-mode scenarios as
 * JSON, for two different downstream uses: (1) hand the real corrections
 * (line/volume edits, ownership) off to Claude to merge into the shipped
 * seed data in src/data/*.ts as new defaults, or (2) download/re-import it
 * as a personal backup when switching browsers. Speculation-mode data
 * rides along for #2 but should never be baked into #1 -- see
 * OVERRIDE_KEYS vs SPECULATIVE_KEYS in lib/overrideKeys.ts.
 *
 * What goes in is scoped by the same three-axis picker the import dialog
 * uses (see DataSelectionPicker), which is largely what makes use #1
 * practical: export one collection's line/volume edits without dragging
 * along personal ownership and reading progress, rather than exporting
 * everything and hand-trimming it. Everything starts checked, so the
 * default action is still a complete backup.
 *
 * Shows the JSON in a readonly textarea (auto-selected, so a plain
 * Cmd/Ctrl+C works immediately) rather than relying solely on the
 * Clipboard API, which can silently fail depending on browser/permissions.
 *
 * Controlled by `open`/`onClose` -- the trigger lives in the nav's gear
 * dropdown, so this component only renders the modal itself.
 */
export function ExportDataButton({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selection, setSelection] = useState<Selection>(fullSelection);
  const [bundle, setBundle] = useState<StoreBundle>({});
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Snapshot localStorage once per opening; the selection then slices that
  // snapshot without re-reading, so dragging through checkboxes doesn't
  // re-parse every store each time.
  useEffect(() => {
    if (!open) return;
    setBundle(readBundleFromStorage());
    setSelection(fullSelection());
    setCopyState("idle");
  }, [open]);

  const { json, recordCount, carriedLines } = useMemo(() => {
    const { inside: selected } = partitionBundle(bundle, selection);
    // Entries need the lines they hang off to be readable anywhere else --
    // most visibly for a notes-only export, whose notes are otherwise
    // orphaned on the way back in. See withReferencedLines.
    const inside = withReferencedLines(selected, bundle);
    const everything = isFullSelection(selection);

    const payload: Record<string, unknown> = {
      [EXPORT_META_KEY]: {
        version: EXPORT_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        collections: selection.collectionIds,
        scopes: selection.scopes,
        kinds: selection.kinds,
      },
    };
    for (const key of EXPORT_KEYS) {
      const store = inside[key];
      if (!store) continue;
      // A narrowed export drops stores that ended up with nothing in them,
      // so the file only contains what was actually asked for. A full
      // export keeps whatever localStorage held, empty stores included, so
      // a whole backup round-trips exactly.
      if (!everything && Object.keys(store).length === 0) continue;
      payload[key] = store;
    }

    // The Sandbox tab's own configuration rides along whenever that tab is
    // part of the selection -- it isn't a sliceable store (see
    // CUSTOM_COLLECTION_CONFIG_KEY), so it's carried whole rather than
    // partitioned by scope/kind, and an export narrowed to other
    // collections leaves it out entirely.
    if (selection.collectionIds.includes(CUSTOM_COLLECTION_ID)) {
      const raw = localStorage.getItem(CUSTOM_COLLECTION_CONFIG_KEY);
      if (raw) {
        try {
          payload[CUSTOM_COLLECTION_CONFIG_KEY] = JSON.parse(raw);
        } catch {
          // Unparseable local config -- skip it rather than writing a
          // string where every reader expects an object.
        }
      }
    }

    return {
      json: JSON.stringify(stripIconsFromPayload(payload), null, 2),
      recordCount: countRecords(selected),
      carriedLines: countRecords(inside) - countRecords(selected),
    };
  }, [bundle, selection]);

  useEffect(() => {
    setCopyState("idle");
  }, [json]);

  useEffect(() => {
    if (open) textareaRef.current?.select();
  }, [open]);

  const handleCopyClick = () => {
    navigator.clipboard?.writeText(json).then(
      () => setCopyState("copied"),
      () => setCopyState("failed")
    );
    textareaRef.current?.select();
  };

  const handleDownloadClick = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = isFullSelection(selection)
      ? `epic-timeline-corrections-${date}.json`
      : `epic-timeline-${filenameSlice(selection)}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking immediately can race with the download actually starting in
    // some browsers, silently dropping it -- give it a beat first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!open) return null;

  const collectionCount = selection.collectionIds.length;
  const summary =
    recordCount === 0
      ? "Nothing to export in this selection."
      : `${recordCount} record${recordCount === 1 ? "" : "s"} across ${collectionCount} collection${
          collectionCount === 1 ? "" : "s"
        }${
          isFullSelection(selection)
            ? ""
            : ` (${COLLECTIONS.filter((c) => selection.collectionIds.includes(c.id))
                .map((c) => c.name)
                .join(", ")})`
        }.${
          carriedLines > 0
            ? ` Plus ${carriedLines} line${carriedLines === 1 ? "" : "s"} they hang off, so this imports cleanly elsewhere.`
            : ""
        }`;

  return (
    <SettingsModal
      title="Your corrections & speculation data (JSON)"
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
    >
      <div className="shrink-0">
        <DataSelectionPicker value={selection} onChange={setSelection} />
      </div>

      <p className="mt-3 shrink-0 text-xs text-neutral-500">{summary}</p>

      <textarea
        ref={textareaRef}
        readOnly
        value={json}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-2 h-64 min-h-0 w-full shrink resize-none rounded-md border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs text-neutral-300"
      />
      <div className="mt-3 flex shrink-0 gap-2">
        <button
          type="button"
          disabled={recordCount === 0}
          onClick={handleCopyClick}
          className={`flex-1 ${BUTTON_SECONDARY_DISABLEABLE}`}
        >
          {copyState === "copied"
            ? "Copied!"
            : copyState === "failed"
            ? "Copy failed"
            : "Copy to clipboard"}
        </button>
        <button
          type="button"
          disabled={recordCount === 0}
          onClick={handleDownloadClick}
          className={`flex-1 ${BUTTON_SECONDARY_DISABLEABLE}`}
        >
          Download JSON
        </button>
      </div>
    </SettingsModal>
  );
}
