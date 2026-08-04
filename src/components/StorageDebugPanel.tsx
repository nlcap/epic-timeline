import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatBytes,
  getStorageBreakdown,
  probeRemainingCapacity,
  type StorageBreakdown,
} from "../lib/storageDebug";

type CapacityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "done"; bytes: number; hitCap: boolean };

/** Below this, the next big cover-image upload is genuinely at risk of the
 * QuotaExceededError safeSetItem guards against (see lib/storage.ts). */
const DANGER_THRESHOLD_BYTES = 2 * 1024 * 1024;
/** Below this, still fine today but worth keeping an eye on. */
const CAUTION_THRESHOLD_BYTES = 5 * 1024 * 1024;

function capacityColorClass(bytes: number): string {
  if (bytes < DANGER_THRESHOLD_BYTES) return "text-red-400";
  if (bytes < CAUTION_THRESHOLD_BYTES) return "text-amber-400";
  return "text-white";
}

/**
 * Dev-facing panel for diagnosing the exact failure mode safeSetItem exists
 * to survive (see lib/storage.ts) -- a per-key + total breakdown of what's
 * actually in localStorage on this origin, plus an on-demand probe that
 * finds this browser's real remaining write headroom right now (there's no
 * queryable "bytes left" API; the only way to know is to try writing).
 *
 * Controlled by `open`/`onClose`, same as ExportDataButton/ImportDataButton
 * -- the trigger lives in the nav's gear dropdown.
 */
export function StorageDebugPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [capacity, setCapacity] = useState<CapacityState>({ status: "idle" });
  const [quotaEstimate, setQuotaEstimate] = useState<{ usage?: number; quota?: number } | null>(
    null
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const refresh = () => {
    setBreakdown(getStorageBreakdown());
    setCopyState("idle");
  };

  useEffect(() => {
    if (!open) return;
    refresh();
    setCapacity({ status: "idle" });
    // navigator.storage.estimate() covers the whole origin (localStorage,
    // IndexedDB, caches, etc combined) -- not localStorage-specific, but a
    // useful second data point where it's available (not Safari, as of
    // writing). Shown alongside the probe below, not in place of it.
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) =>
        setQuotaEstimate({ usage: est.usage, quota: est.quota })
      );
    } else {
      setQuotaEstimate(null);
    }
  }, [open]);

  const handleCheckCapacity = async () => {
    setCapacity({ status: "checking" });
    const { bytes, hitCap } = await probeRemainingCapacity();
    setCapacity({ status: "done", bytes, hitCap });
  };

  const handleCopyClick = () => {
    if (!breakdown) return;
    const lines = [
      `Epic Timeline storage debug -- ${new Date().toISOString()}`,
      `Total localStorage: ${formatBytes(breakdown.totalBytes)}`,
      `  App keys: ${formatBytes(breakdown.appBytes)}`,
      `  Other keys: ${formatBytes(breakdown.otherBytes)}`,
      ...breakdown.keys.map((k) => `    ${k.key}: ${formatBytes(k.bytes)}`),
      capacity.status === "done"
        ? `Remaining write capacity (probed): ${capacity.hitCap ? "at least " : "~"}${formatBytes(capacity.bytes)}`
        : "Remaining write capacity: not checked",
      quotaEstimate?.quota !== undefined
        ? `navigator.storage.estimate(): ${formatBytes(quotaEstimate.usage ?? 0)} / ${formatBytes(quotaEstimate.quota)} (whole origin, all storage types)`
        : null,
    ].filter((l): l is string => l !== null);
    navigator.clipboard?.writeText(lines.join("\n")).then(
      () => setCopyState("copied"),
      () => setCopyState("failed")
    );
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-6" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center">
        <div
          className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-md border border-neutral-700 bg-neutral-900 p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Local storage debug</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-neutral-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            {breakdown && (
              <>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-neutral-400">Total used</span>
                  <span className="font-mono text-white">{formatBytes(breakdown.totalBytes)}</span>
                </div>

                <div className="mt-3 divide-y divide-neutral-800 rounded-md border border-neutral-800">
                  {breakdown.keys.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-neutral-500">
                      localStorage is empty on this origin.
                    </p>
                  ) : (
                    breakdown.keys.map((k) => (
                      <div
                        key={k.key}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                      >
                        <span
                          className={`truncate font-mono ${k.isAppKey ? "text-neutral-300" : "text-neutral-500"}`}
                          title={k.key}
                        >
                          {k.label}
                          {!k.isAppKey && (
                            <span className="ml-1.5 text-neutral-600">(not this app)</span>
                          )}
                        </span>
                        <span className="shrink-0 font-mono text-neutral-400">
                          {formatBytes(k.bytes)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {quotaEstimate?.quota !== undefined && (
                  <p className="mt-3 text-xs text-neutral-500">
                    Browser-reported origin quota: {formatBytes(quotaEstimate.usage ?? 0)} of{" "}
                    {formatBytes(quotaEstimate.quota)} used, across all storage types (not just
                    localStorage) -- Safari doesn't support this check.
                  </p>
                )}

                <div className="mt-4 rounded-md border border-neutral-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Remaining write capacity</span>
                    <button
                      type="button"
                      onClick={handleCheckCapacity}
                      disabled={capacity.status === "checking"}
                      className="rounded-md border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 transition-colors hover:text-white disabled:opacity-50"
                    >
                      {capacity.status === "checking" ? "Checking..." : "Check now"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    localStorage has no API for this -- checking actually writes an
                    increasingly large test value and sees where it starts throwing,
                    cleaning up immediately after. This is this browser's real number
                    right now, not an estimate.
                  </p>
                  {capacity.status === "done" && (
                    <p className={`mt-2 text-sm font-semibold ${capacityColorClass(capacity.bytes)}`}>
                      {capacity.hitCap
                        ? `At least ${formatBytes(capacity.bytes)} of headroom -- plenty`
                        : `~${formatBytes(capacity.bytes)} before the next write would fail`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={refresh}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleCopyClick}
              className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              {copyState === "copied"
                ? "Copied!"
                : copyState === "failed"
                ? "Copy failed"
                : "Copy debug info"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
