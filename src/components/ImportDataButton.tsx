import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EXPORT_KEYS } from "../lib/overrideKeys";

type ExportKey = (typeof EXPORT_KEYS)[number];
type ParsedPayload = Partial<Record<ExportKey, unknown>>;

/**
 * Counterpart to ExportDataButton: loads a previously exported/downloaded
 * JSON file back into localStorage, overwriting the current
 * line/volume/ownership overrides and speculation-mode data. A full reload
 * afterward is the simplest way to get every hook (useLineOverrides,
 * useVolumeOverrides, useOwnership, useSpeculativeLines,
 * useSpeculativeVolumes) to re-read from localStorage, since they only
 * load on mount.
 */
export function ImportDataButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ fileName: string; payload: ParsedPayload } | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("not an object");
      }
      const payload: ParsedPayload = {};
      for (const key of EXPORT_KEYS) {
        if (key in parsed) payload[key] = (parsed as Record<string, unknown>)[key];
      }
      if (Object.keys(payload).length === 0) {
        setError("That file doesn't look like an Epic Timeline export -- no recognized keys found.");
        return;
      }
      setPending({ fileName: file.name, payload });
    } catch {
      setError("Couldn't read that file as JSON.");
    }
  };

  const handleConfirm = () => {
    if (!pending) return;
    for (const key of EXPORT_KEYS) {
      const value = pending.payload[key];
      if (value === undefined) continue;
      localStorage.setItem(key, JSON.stringify(value));
    }
    window.location.reload();
  };

  const closeDialog = () => {
    setPending(null);
    setError("");
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
        onClick={() => fileInputRef.current?.click()}
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

      {(pending || error) &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-6"
            onClick={closeDialog}
          >
            <div className="flex min-h-full items-center justify-center">
              <div
                className="w-full max-w-md rounded-md border border-neutral-700 bg-neutral-900 p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {error ? (
                  <>
                    <h2 className="text-sm font-semibold text-white">Import failed</h2>
                    <p className="mt-2 text-sm text-neutral-400">{error}</p>
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="mt-4 w-full rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  pending && (
                    <>
                      <h2 className="text-sm font-semibold text-white">Import corrections?</h2>
                      <p className="mt-2 text-sm text-neutral-400">
                        "{pending.fileName}" has {Object.keys(pending.payload).length} correction
                        set(s). This replaces your current line/volume/ownership edits and
                        speculation-mode data, then reloads the page.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={closeDialog}
                          className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirm}
                          className="flex-1 rounded-md border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                        >
                          Import &amp; reload
                        </button>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
