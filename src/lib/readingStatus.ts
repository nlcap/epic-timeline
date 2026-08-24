import type { ReadingStatus } from "../types";

export interface ReadingStatusMeta {
  label: string;
  /** Reading status has no bespoke icon set like ownership's -- a small
   * solid-color dot (see VolumeTile's read-only preview and FilterPanel)
   * stands in for the icon image there. */
  dotClassName: string;
  /** Same colour as dotClassName, as a `text-*` class instead of `bg-*` --
   * feeds FlagIcon's `currentColor` fill for the reading status
   * StatusDropdown in VolumeDetailPanel, which uses the flag shape instead
   * of the plain dot. Kept as its own field rather than derived from
   * dotClassName by string surgery, since that would silently break if the
   * `bg-`/`text-` naming convention ever diverged. */
  flagClassName: string;
}

export const READING_STATUS_META: Record<ReadingStatus, ReadingStatusMeta> = {
  not_started: { label: "Not Started", dotClassName: "bg-neutral-500", flagClassName: "text-neutral-500" },
  reading: { label: "Reading", dotClassName: "bg-blue-400", flagClassName: "text-blue-400" },
  finished: { label: "Finished", dotClassName: "bg-green-400", flagClassName: "text-green-400" },
  paused: { label: "Paused", dotClassName: "bg-amber-400", flagClassName: "text-amber-400" },
  dropped: { label: "Dropped", dotClassName: "bg-red-400", flagClassName: "text-red-400" },
};

export const READING_STATUS_ORDER: ReadingStatus[] = [
  "not_started",
  "reading",
  "finished",
  "paused",
  "dropped",
];

export const DEFAULT_READING_STATUS: ReadingStatus = "not_started";
