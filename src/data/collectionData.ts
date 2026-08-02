import type { Line, TimelineEntry } from "../types";
import { ULTIMATE_LINES, ULTIMATE_ENTRIES } from "./ultimate-era";
import { CLASSIC_MARVEL_LINES, CLASSIC_MARVEL_ENTRIES } from "./classic-marvel-epic";
import { DC_FINEST_LINES, DC_FINEST_ENTRIES } from "./dc-finest";
import { MODERN_MARVEL_LINES, MODERN_MARVEL_ENTRIES } from "./modern-marvel-epic";

// Per-collection datasets. Collections not listed here (e.g.
// "marvel-licensed-epic") render an empty state until their volume lists
// are compiled (same process as the ASM Epic Collection pilot spreadsheet).
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
};
