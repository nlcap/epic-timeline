// The three "real correction" override stores -- line edits, volume
// edits/resizes, and ownership status. These are the ones that make sense
// to bake into the shipped seed data in src/data/*.ts as new defaults.
export const OVERRIDE_KEYS = [
  "epic-timeline:line-overrides",
  "epic-timeline:volume-overrides",
  "epic-timeline:ownership-overrides",
] as const;

// Speculation Mode's sandbox layer -- lines/volumes that are an intentional
// what-if, not a correction to the real data. Never bake these into the
// shipped defaults, but still worth including in a user's own
// export/import so a browser-to-browser backup doesn't lose them.
export const SPECULATIVE_KEYS = [
  "epic-timeline:speculative-lines",
  "epic-timeline:speculative-volumes",
] as const;

// Everything ExportDataButton/ImportDataButton read and write.
export const EXPORT_KEYS = [...OVERRIDE_KEYS, ...SPECULATIVE_KEYS] as const;
