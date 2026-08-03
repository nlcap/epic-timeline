import { useEffect, useState } from "react";
import { onStorageError } from "../lib/storage";

/**
 * safeSetItem catches storage-write failures so they can't crash the app,
 * but that means a failed save otherwise looks identical to a successful
 * one -- the edit renders fine in the current session and then silently
 * isn't there after a reload. This is the only place that discrepancy gets
 * surfaced. z-[80] clears every modal in the app (highest existing is
 * z-[70]) since a write can fail from underneath any of them.
 */
export function StorageErrorToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => onStorageError(setMessage), []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 8000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-4">
      <div className="flex max-w-lg items-start gap-3 rounded-md border border-red-900 bg-red-950/95 px-4 py-3 text-sm text-red-200 shadow-xl backdrop-blur-sm">
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          aria-label="Dismiss"
          className="shrink-0 text-red-300 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
