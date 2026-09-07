import { useEffect, useMemo, useRef, useState } from "react";
import { fullSelection, readBundleFromStorage, type StoreBundle } from "../lib/collectionScope";
import { buildExportPayload } from "../lib/exportPayload";
import {
  CUSTOM_COLLECTION_CONFIG_KEY,
  stripIconsFromPayload,
} from "../lib/overrideKeys";
import {
  SANDBOX_SNAPSHOTS_KEY,
  stripIconsFromSnapshots,
  type SandboxSnapshot,
} from "../lib/sandboxSnapshots";
import { safeGetJson } from "../lib/storage";
import { BUTTON_PRIMARY_LIGHT, BUTTON_SECONDARY_DISABLEABLE } from "./buttonStyles";

/**
 * Downloads (or copies) everything localStorage holds -- corrections,
 * personal shelving/reading/ratings, and every Speculation Mode scenario,
 * across every collection -- as one JSON backup, for re-importing when
 * switching browsers.
 *
 * Used to offer a three-axis picker (see DataSelectionPicker) to narrow
 * what went in, which existed almost entirely to serve a second job this
 * dialog no longer does -- handing a single collection's corrections to
 * Claude for a seed merge (see CopyCorrectionsButton). With that job gone,
 * a personal backup has one obviously right answer -- everything -- so
 * this is a one-click action rather than the same thirteen checkboxes
 * every time to get to that answer.
 *
 * Restoring a *partial* backup is still a real choice, so it's still
 * offered -- just at import time, not here. ImportDataPanel keeps its own
 * picker because that's where the choice actually has something to go on:
 * real per-slice record counts read from the file, which a picker shown
 * before the file even exists never could show.
 *
 * Shows the JSON in a readonly textarea (auto-selected, so a plain
 * Cmd/Ctrl+C works immediately) rather than relying solely on the
 * Clipboard API, which can silently fail depending on browser/permissions.
 *
 * One tab of ManageDataButton's Export/Import/Reset modal -- it only
 * mounts while its tab is selected, which is what re-snapshots localStorage
 * below on every visit rather than a manual reset-on-reopen effect: there's
 * no `open` prop left to key one off, and there doesn't need to be.
 */
export function ExportDataPanel() {
  const [bundle, setBundle] = useState<StoreBundle>({});
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Snapshot localStorage once per mount -- there's no picker left to
  // re-slice it against, but the snapshot still matters: nothing should
  // change what's shown mid-dialog if a background write happens to land
  // (e.g. an in-flight image compression finishing) while it's open.
  useEffect(() => {
    setBundle(readBundleFromStorage());
    setCopyState("idle");
  }, []);

  const { json, recordCount, carriedLines } = useMemo(() => {
    const { payload, recordCount, carriedLines } = buildExportPayload(bundle, fullSelection());

    // The Sandbox tab's own configuration, plus its library of saved
    // snapshots, always ride along -- neither is a sliceable store (see
    // CUSTOM_COLLECTION_CONFIG_KEY and SANDBOX_SNAPSHOTS_KEY), so both are
    // carried whole rather than partitioned by scope/kind. A full backup
    // always covers the Sandbox tab, so unlike before there's no selection
    // left to check before including them.
    // safeGetJson, not a bare getItem with the try wrapped around the
    // parse alone: getItem itself throws where storage is blocked, and this
    // runs inside a useMemo during render, so an uncaught one took the whole
    // tree down to the ErrorBoundary. A null fallback keeps the existing
    // behaviour for both "nothing stored" and "stored but unparseable" --
    // skip the key rather than write a string where every reader expects an
    // object.
    const config = safeGetJson<Record<string, unknown> | null>(
      CUSTOM_COLLECTION_CONFIG_KEY,
      null
    );
    if (config) payload[CUSTOM_COLLECTION_CONFIG_KEY] = config;

    // Icons are stripped a level deeper here than for the stores above --
    // each snapshot carries its own nested bundle, which stripIconsFromPayload
    // below can't see into. See stripIconsFromSnapshots.
    const snapshots = safeGetJson<Record<string, SandboxSnapshot> | null>(
      SANDBOX_SNAPSHOTS_KEY,
      null
    );
    if (snapshots) {
      payload[SANDBOX_SNAPSHOTS_KEY] = stripIconsFromSnapshots(snapshots);
    }

    return {
      json: JSON.stringify(stripIconsFromPayload(payload), null, 2),
      recordCount,
      carriedLines,
    };
  }, [bundle]);

  useEffect(() => {
    setCopyState("idle");
  }, [json]);

  useEffect(() => {
    textareaRef.current?.select();
  }, []);

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
    a.download = `epic-timeline-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking immediately can race with the download actually starting in
    // some browsers, silently dropping it -- give it a beat first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const summary =
    recordCount === 0
      ? "Nothing to back up yet -- your changes will show up here once you've made some."
      : `${recordCount} record${recordCount === 1 ? "" : "s"}.${
          carriedLines > 0
            ? ` Plus ${carriedLines} line${carriedLines === 1 ? "" : "s"} they hang off, so this imports cleanly elsewhere.`
            : ""
        }`;

  return (
    <>
      <p className="mt-3 shrink-0 text-sm text-neutral-400">
        Everything localStorage holds for every collection -- corrections, shelving, reading
        progress, star ratings, and any Speculation Mode scenarios.
      </p>
      <p className="mt-1 shrink-0 text-xs text-neutral-500">{summary}</p>

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
          className={`flex-1 ${BUTTON_PRIMARY_LIGHT}`}
        >
          Download backup
        </button>
      </div>
    </>
  );
}
