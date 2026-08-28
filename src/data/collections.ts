import type { Collection } from "../types";

// The top-level pages from the original spec, plus "custom" (see below).
// "marvel-licensed-epic" has no dataset compiled yet and renders an empty
// state -- the rest (classic-marvel-epic, dc-finest, modern-marvel-epic,
// ultimate) are seeded.
export const COLLECTIONS: Collection[] = [
  {
    id: "classic-marvel-epic",
    name: "Epic Collection",
    tagline: "Classic Era Epic Collection Timeline",
    publisherWordmark: "MARVEL",
    accentHex: "#0090D7",
  },
  {
    id: "dc-finest",
    name: "DC Finest",
    tagline: "DC Finest Timeline",
    publisherWordmark: "DC",
    accentHex: "#0078F0",
  },
  {
    id: "modern-marvel-epic",
    name: "Modern Era",
    tagline: "Modern Era Epic Collection Timeline",
    publisherWordmark: "MARVEL",
    accentHex: "#D22565",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    tagline: "Ultimate Era Epic Collection Timeline",
    publisherWordmark: "MARVEL",
    accentHex: "#9C1E2B",
  },
  {
    id: "marvel-licensed-epic",
    name: "Licensed",
    tagline: "Conan / Classic Star Wars / Aliens Timeline",
    publisherWordmark: "MARVEL",
    accentHex: "#C36C27",
  },
  // Deliberately has no seed data, ever (unlike marvel-licensed-epic above,
  // which is just waiting on a dataset) -- a blank timeline the reader
  // builds entirely themselves, for lines/volumes outside every other
  // collection here. Same Line/Volume editing and Speculation Mode as any
  // other tab; see useLineOverrides/useVolumeOverrides, which already
  // support a pure user-added line/volume with no seed counterpart.
  {
    id: "custom",
    name: "Sandbox",
    tagline: "Build Your Own Timeline",
    publisherWordmark: "SANDBOX",
    accentHex: "#7B4FE0",
  },
];
