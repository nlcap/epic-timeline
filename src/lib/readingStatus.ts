import type { ReadingStatus } from "../types";

export interface ReadingStatusMeta {
  label: string;
  /** Reading status has no bespoke icon set like ownership's -- a small
   * solid-color dot (see StatusDropdown) stands in for the icon image. */
  dotClassName: string;
}

export const READING_STATUS_META: Record<ReadingStatus, ReadingStatusMeta> = {
  not_started: { label: "Not Started", dotClassName: "bg-neutral-500" },
  reading: { label: "Reading", dotClassName: "bg-blue-400" },
  finished: { label: "Finished", dotClassName: "bg-green-400" },
  paused: { label: "Paused", dotClassName: "bg-amber-400" },
  dropped: { label: "Dropped", dotClassName: "bg-red-400" },
};

export const READING_STATUS_ORDER: ReadingStatus[] = [
  "not_started",
  "reading",
  "finished",
  "paused",
  "dropped",
];

export const DEFAULT_READING_STATUS: ReadingStatus = "not_started";
