import type { Collection } from "../types";

// The five top-level pages from the original spec. "marvel-licensed-epic"
// has no dataset compiled yet and renders an empty state -- the rest
// (classic-marvel-epic, dc-finest, modern-marvel-epic, ultimate) are seeded.
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
];
