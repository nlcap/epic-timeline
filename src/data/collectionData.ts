import type { Line, TimelineEntry } from "../types";
import { ULTIMATE_LINES, ULTIMATE_ENTRIES } from "./ultimate-era";
import { CLASSIC_MARVEL_LINES, CLASSIC_MARVEL_ENTRIES } from "./classic-marvel-epic";
import { DC_FINEST_LINES, DC_FINEST_ENTRIES } from "./dc-finest";
import { MODERN_MARVEL_LINES, MODERN_MARVEL_ENTRIES } from "./modern-marvel-epic";
import { LICENSED_LINES, LICENSED_ENTRIES } from "./marvel-licensed-epic";

// Per-collection datasets, and the source of truth for which tabs have
// data at all. Collections not listed here render an empty state until
// their volume lists are compiled -- today that's only "custom", the
// Sandbox tab, which is deliberately never seeded.
export const COLLECTION_DATA: Record<string, { lines: Line[]; entries: TimelineEntry[] }> = {
  ultimate: { lines: ULTIMATE_LINES, entries: ULTIMATE_ENTRIES },
  "classic-marvel-epic": {
    lines: CLASSIC_MARVEL_LINES,
    entries: CLASSIC_MARVEL_ENTRIES,
  },
  "dc-finest": { lines: DC_FINEST_LINES, entries: DC_FINEST_ENTRIES },
  "modern-marvel-epic": {
    lines: MODERN_MARVEL_LINES,
    entries: MODERN_MARVEL_ENTRIES,
  },
  "marvel-licensed-epic": { lines: LICENSED_LINES, entries: LICENSED_ENTRIES },
};
