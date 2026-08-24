import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, type ZoomLevel } from "../lib/timeline";

/** Fixed to the viewport's right edge, vertically centered -- zoom in/out
 * as a pair of buttons stacked vertically in one pill, "+" above "-",
 * matching the "+" to lower zoom levels (more zoomed in) and "-" to higher
 * ones (more zoomed out). */
export function ZoomControl({
  level,
  onZoomIn,
  onZoomOut,
}: {
  level: ZoomLevel;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const canZoomIn = level > MIN_ZOOM_LEVEL;
  const canZoomOut = level < MAX_ZOOM_LEVEL;

  return (
    <div
      data-tour-target="zoom-control"
      className="flex flex-col items-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900/90 shadow-lg backdrop-blur"
    >
      <button
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-neutral-300 transition-colors hover:enabled:bg-neutral-800 hover:enabled:text-white disabled:cursor-not-allowed disabled:text-neutral-600"
      >
        +
      </button>
      <div className="h-px w-5 bg-neutral-700" />
      <button
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-neutral-300 transition-colors hover:enabled:bg-neutral-800 hover:enabled:text-white disabled:cursor-not-allowed disabled:text-neutral-600"
      >
        &minus;
      </button>
    </div>
  );
}
