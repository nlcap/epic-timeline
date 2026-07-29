import { useEffect, useRef, useState } from "react";

// The three "real correction" override stores -- line edits, volume
// edits/resizes, and ownership status. Deliberately excludes
// epic-timeline:speculative-lines/speculative-volumes: Speculation Mode is
// an intentional what-if sandbox, not a correction to the real data, so
// baking it into the shipped defaults would be wrong.
const OVERRIDE_KEYS = [
  "epic-timeline:line-overrides",
  "epic-timeline:volume-overrides",
  "epic-timeline:ownership-overrides",
] as const;

/**
 * One-off maintainer utility, not an end-user feature: dumps every
 * correction made through the app's UI as JSON so it can be handed off and
 * merged into the shipped seed data in src/data/*.ts, replacing the current
 * defaults. Shows the JSON in a readonly textarea (auto-selected, so a
 * plain Cmd/Ctrl+C works immediately) rather than relying solely on the
 * Clipboard API, which can silently fail depending on browser/permissions.
 */
export function ExportDataButton() {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExport = () => {
    const payload: Record<string, unknown> = {};
    for (const key of OVERRIDE_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        payload[key] = JSON.parse(raw);
      } catch {
        payload[key] = raw;
      }
    }
    const text = JSON.stringify(payload, null, 2);
    setJson(text);
    setCopyState("idle");
    setOpen(true);
    navigator.clipboard?.writeText(text).then(
      () => setCopyState("copied"),
      () => setCopyState("failed")
    );
  };

  const handleCopyClick = () => {
    navigator.clipboard?.writeText(json).then(
      () => setCopyState("copied"),
      () => setCopyState("failed")
    );
    textareaRef.current?.select();
  };

  useEffect(() => {
    if (open) textareaRef.current?.select();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        title="Export your corrections (line/volume edits, ownership status) as JSON"
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
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M4 19h16" />
        </svg>
        Export
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-xl flex-col rounded-md border border-neutral-700 bg-neutral-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Your corrections (JSON)</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {copyState === "copied"
                ? "Copied to your clipboard -- paste it to Claude to bake these in as the new defaults."
                : copyState === "failed"
                ? "Couldn't copy automatically -- it's already selected below, so Cmd/Ctrl+C works, or use the button."
                : "Copying to your clipboard..."}
            </p>
            <textarea
              ref={textareaRef}
              readOnly
              value={json}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 h-80 w-full resize-none rounded-md border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs text-neutral-300"
            />
            <button
              type="button"
              onClick={handleCopyClick}
              className="mt-3 w-full rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
