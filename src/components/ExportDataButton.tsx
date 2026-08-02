import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EXPORT_KEYS } from "../lib/overrideKeys";

/**
 * Dumps every local-storage-backed correction and speculation-mode
 * scenario as JSON, for two different downstream uses: (1) hand the real
 * corrections (line/volume edits, ownership) off to Claude to merge into
 * the shipped seed data in src/data/*.ts as new defaults, or (2)
 * download/re-import it as a personal backup when switching browsers.
 * Speculation-mode data rides along for #2 but should never be baked into
 * #1 -- see OVERRIDE_KEYS vs SPECULATIVE_KEYS in lib/overrideKeys.ts.
 * Shows the JSON in a readonly textarea (auto-selected, so a plain
 * Cmd/Ctrl+C works immediately) rather than relying solely on the
 * Clipboard API, which can silently fail depending on browser/permissions.
 *
 * Controlled by `open`/`onClose` -- the trigger lives in the nav's gear
 * dropdown, so this component only renders the modal itself.
 */
export function ExportDataButton({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [json, setJson] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const payload: Record<string, unknown> = {};
    for (const key of EXPORT_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        payload[key] = JSON.parse(raw);
      } catch {
        payload[key] = raw;
      }
    }
    setJson(JSON.stringify(payload, null, 2));
    setCopyState("idle");
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
    a.download = `epic-timeline-corrections-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking immediately can race with the download actually starting in
    // some browsers, silently dropping it -- give it a beat first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    if (open) textareaRef.current?.select();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-6" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center">
        <div
          className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-md border border-neutral-700 bg-neutral-900 p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Your corrections &amp; speculation data (JSON)
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-neutral-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>
          <textarea
            ref={textareaRef}
            readOnly
            value={json}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 h-[40rem] min-h-0 w-full shrink resize-none rounded-md border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs text-neutral-300"
          />
          <div className="mt-3 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleCopyClick}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Copy to clipboard
            </button>
            <button
              type="button"
              onClick={handleDownloadClick}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
