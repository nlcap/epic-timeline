import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EXPORT_KEYS } from "../lib/overrideKeys";

type ExportKey = (typeof EXPORT_KEYS)[number];
type ParsedPayload = Partial<Record<ExportKey, unknown>>;

/** Parses text as JSON and pulls out whichever EXPORT_KEYS it recognizes.
 * Returns null for anything that isn't a usable export (bad JSON, an
 * object with none of the keys this app knows about, etc). */
function parseExportPayload(text: string): ParsedPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const payload: ParsedPayload = {};
  for (const key of EXPORT_KEYS) {
    if (key in parsed) payload[key] = (parsed as Record<string, unknown>)[key];
  }
  return Object.keys(payload).length > 0 ? payload : null;
}

function writePayload(payload: ParsedPayload) {
  for (const key of EXPORT_KEYS) {
    const value = payload[key];
    if (value === undefined) continue;
    localStorage.setItem(key, JSON.stringify(value));
  }
  window.location.reload();
}

/**
 * Counterpart to ExportDataButton. Two ways in: paste a previously
 * exported JSON blob into the textarea (from the clipboard or by hand),
 * or upload an exported file directly -- either overwrites the current
 * line/volume/ownership overrides and speculation-mode data. A full
 * reload afterward is the simplest way to get every hook
 * (useLineOverrides, useVolumeOverrides, useOwnership,
 * useSpeculativeLines, useSpeculativeVolumes) to re-read from
 * localStorage, since they only load on mount.
 */
export function ImportDataButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  // Uploading a file goes straight to a confirm step (its content isn't
  // something the user typed/reviewed, unlike a paste, so it gets an
  // extra "are you sure" beat); pasting into the textarea and pressing
  // "Import JSON" is itself the deliberate confirming action.
  const [pending, setPending] = useState<{ fileName: string; payload: ParsedPayload } | null>(
    null
  );
  const [error, setError] = useState("");

  const pastePayload = useMemo(() => parseExportPayload(pasteText), [pasteText]);

  const openDialog = () => {
    setPasteText("");
    setPending(null);
    setError("");
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPasteText(text);
    } catch {
      // Clipboard read can fail (permissions, empty clipboard) -- leave
      // whatever's already in the textarea alone.
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const text = await file.text();
    const payload = parseExportPayload(text);
    if (!payload) {
      setError("That file doesn't look like an Epic Timeline export -- no recognized keys found.");
      return;
    }
    setPending({ fileName: file.name, payload });
  };

  const handleImportPasteClick = () => {
    if (!pastePayload) return;
    writePayload(pastePayload);
  };

  const handleConfirmUploadClick = () => {
    if (!pending) return;
    writePayload(pending.payload);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={openDialog}
        title="Import corrections and speculation-mode data from a JSON file"
        className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full border border-neutral-700 px-3 text-sm text-neutral-300 transition-colors hover:text-white md:flex"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M12 15V3" />
          <path d="M7 8l5-5 5 5" />
          <path d="M4 19h16" />
        </svg>
        Import
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-6"
            onClick={closeDialog}
          >
            <div className="flex min-h-full items-center justify-center">
              <div
                className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-md border border-neutral-700 bg-neutral-900 p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {error ? (
                  <>
                    <div className="flex shrink-0 items-center justify-between">
                      <h2 className="text-sm font-semibold text-white">Import failed</h2>
                      <button
                        type="button"
                        onClick={closeDialog}
                        className="text-sm text-neutral-400 hover:text-white"
                      >
                        Close ✕
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-neutral-400">{error}</p>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="mt-4 w-full rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
                    >
                      Try again
                    </button>
                  </>
                ) : pending ? (
                  <>
                    <div className="flex shrink-0 items-center justify-between">
                      <h2 className="text-sm font-semibold text-white">Import corrections?</h2>
                      <button
                        type="button"
                        onClick={closeDialog}
                        className="text-sm text-neutral-400 hover:text-white"
                      >
                        Close ✕
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-neutral-400">
                      "{pending.fileName}" has {Object.keys(pending.payload).length} correction
                      set(s). This replaces your current line/volume/ownership edits and
                      speculation-mode data, then reloads the page.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPending(null)}
                        className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmUploadClick}
                        className="flex-1 rounded-md border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                      >
                        Import &amp; reload
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex shrink-0 items-center justify-between">
                      <h2 className="text-sm font-semibold text-white">
                        Import corrections &amp; speculation data (JSON)
                      </h2>
                      <button
                        type="button"
                        onClick={closeDialog}
                        className="text-sm text-neutral-400 hover:text-white"
                      >
                        Close ✕
                      </button>
                    </div>
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
                      disabled={!pastePayload}
                      onClick={handleImportPasteClick}
                      className="mt-2 w-full shrink-0 rounded-md border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:enabled:bg-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-800 disabled:text-neutral-600"
                    >
                      Import JSON
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
