import { useEffect, useMemo, useRef, useState } from "react";
import { COLLECTION_DATA } from "../data/collectionData";
import type { Collection } from "../types";
import { readBundleFromStorage, type Selection } from "../lib/collectionScope";
import { buildExportPayload } from "../lib/exportPayload";
import { stripIconsFromPayload } from "../lib/overrideKeys";
import { SettingsModal } from "./SettingsModal";
import { BUTTON_SECONDARY_DISABLEABLE } from "./buttonStyles";

/**
 * The one slice worth handing back for a seed merge: this collection's own
 * line and volume edits, on the main timeline.
 *
 * Everything left out is left out for a reason rather than for brevity.
 * Shelving, reading progress and star ratings are Nick's, not facts about
 * the book, so they'd be wrong as shipped defaults (see the note on
 * OVERRIDE_KEYS in lib/overrideKeys.ts). Speculation-mode content is an
 * intentional what-if and must never become seed data (see
 * SPECULATIVE_KEYS there).
 */
function correctionsSelection(collectionId: string): Selection {
  return { collectionIds: [collectionId], parts: ["edits"] };
}

/**
 * Copies the current tab's line/volume corrections as JSON, for pasting to
 * Claude to merge into the shipped seed data in src/data/*.ts.
 *
 * This was one of two jobs ExportDataPanel did, chosen by hand each time
 * out of its three-axis picker -- six collections, two timeline layers and
 * five data types, of which exactly one combination was ever the right
 * answer here. Pinning that combination (see correctionsSelection) turns a
 * thirteen-checkbox setup into an open-and-copy, and leaves the export
 * dialog free to be about backups.
 *
 * Produces the same file format as a full export, so what lands on the
 * clipboard is still a valid import file rather than a second, subtly
 * different shape.
 *
 * Controlled by `open`/`onClose` -- the trigger lives in the nav's gear
 * dropdown, so this component only renders the modal itself.
 */
export function CopyCorrectionsButton({
  open,
  onClose,
  collection,
}: {
  open: boolean;
  onClose: () => void;
  collection: Collection;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Snapshotted once per opening, same as the export dialog -- nothing
  // writes to localStorage while a settings dialog is up.
  const [bundle, setBundle] = useState(() => ({}));
  useEffect(() => {
    if (!open) return;
    setBundle(readBundleFromStorage());
    setCopyState("idle");
  }, [open]);

  const { json, recordCount } = useMemo(() => {
    const { payload, recordCount } = buildExportPayload(bundle, correctionsSelection(collection.id));
    return { json: JSON.stringify(stripIconsFromPayload(payload), null, 2), recordCount };
  }, [bundle, collection.id]);

  useEffect(() => {
    if (open) textareaRef.current?.select();
  }, [open, json]);

  const handleCopyClick = () => {
    navigator.clipboard?.writeText(json).then(
      () => setCopyState("copied"),
      () => setCopyState("failed")
    );
    textareaRef.current?.select();
  };

  if (!open) return null;

  // The Sandbox tab ships no seed data at all, so there's nothing there to
  // correct -- everything in it is already the reader's own. Worth saying
  // outright rather than showing an empty file and letting them wonder.
  const hasSeedData = collection.id in COLLECTION_DATA;

  return (
    <SettingsModal
      title={`Corrections for ${collection.name}`}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
    >
      {!hasSeedData ? (
        <p className="mt-3 text-sm text-neutral-400">
          {collection.name} doesn't ship any data of its own -- every line and volume in it is
          yours already, so there's nothing here to correct. Use Manage Data's Export tab to
          back it up instead.
        </p>
      ) : (
        <>
          <p className="mt-3 shrink-0 text-sm text-neutral-400">
            {recordCount === 0
              ? `Nothing on ${collection.name} has been changed from the shipped data yet.`
              : `${recordCount} line and volume edit${
                  recordCount === 1 ? "" : "s"
                } on ${collection.name}, ready to paste to Claude to fold into the shipped data.`}
          </p>
          <p className="mt-1 shrink-0 text-xs text-neutral-500">
            Your shelving, reading progress, star ratings and speculation are deliberately left
            out -- those are yours, not facts about the books.
          </p>

          <textarea
            ref={textareaRef}
            readOnly
            value={json}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 h-96 min-h-0 w-full shrink resize-none rounded-md border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs text-neutral-300"
          />
          <button
            type="button"
            disabled={recordCount === 0}
            onClick={handleCopyClick}
            className={`mt-3 w-full shrink-0 ${BUTTON_SECONDARY_DISABLEABLE}`}
          >
            {copyState === "copied"
              ? "Copied!"
              : copyState === "failed"
              ? "Copy failed"
              : "Copy to clipboard"}
          </button>
        </>
      )}
    </SettingsModal>
  );
}
