import type { Line, TimelineEntry } from "../types";

// Seed data for the "Marvel Ultimate Line" collection, transcribed from the
// reference timeline image. Quarter-level positions are approximate (real
// solicitation dates should replace these once compiled, same as the ASM
// Epic Collection pilot). Colors: Fantastic Four's #00ADEF is confirmed
// against real trade dress; the other three are placeholders -- TODO verify
// against actual cover colors before this ships.

export const ULTIMATE_LINES: Line[] = [
  {
    id: "ultimate-spider-man",
    collectionId: "ultimate",
    name: "Ultimate Spider-Man",
    colorHex: "#8B1E2F", // TODO verify against trade dress
    // Ultimate Spider-Man #1 cover-dated October 2000.
    debutDate: { year: 2000, month: 10 },
  },
  {
    id: "ultimate-x-men",
    collectionId: "ultimate",
    name: "Ultimate X-Men",
    colorHex: "#C9A227", // TODO verify against trade dress
    // Ultimate X-Men #1 cover-dated February 2001.
    debutDate: { year: 2001, month: 2 },
  },
  {
    id: "the-ultimates",
    collectionId: "ultimate",
    name: "The Ultimates",
    colorHex: "#6B7280", // TODO verify against trade dress
    // The Ultimates #1 cover-dated March 2002.
    debutDate: { year: 2002, month: 3 },
  },
  {
    id: "ultimate-fantastic-four",
    collectionId: "ultimate",
    name: "Ultimate Fantastic Four",
    colorHex: "#00ADEF", // confirmed
    // Ultimate Fantastic Four #1 cover-dated February 2004.
    debutDate: { year: 2004, month: 2 },
  },
];

export const ULTIMATE_ENTRIES: TimelineEntry[] = [
  // --- Ultimate Spider-Man ---
  {
    kind: "volume",
    id: "usm-1",
    lineId: "ultimate-spider-man",
    number: "1",
    title: "Learning Curve",
    start: { year: 2000, quarter: 4 },
    end: { year: 2001, quarter: 3 },
    issuesCollected: "Ultimate Spider-Man (2000) #1-13",
    yearsCovered: "2000-2001",
    creators: "Bendis, Bagley",
    description:
      "The Ultimate line's flagship launch, retelling Peter Parker's origin for a new era.",
    ownershipStatus: "shelved",
  },
  {
    kind: "volume",
    id: "usm-2",
    lineId: "ultimate-spider-man",
    number: "2",
    title: "Hunted",
    start: { year: 2001, quarter: 4 },
    end: { year: 2002, quarter: 3 },
    issuesCollected: "Ultimate Spider-Man #14-27",
    yearsCovered: "2001-2002",
    creators: "Bendis, Bagley",
    description: "The Kingpin closes in as Peter's double life grows harder to hide.",
    ownershipStatus: "ordered",
  },
  {
    kind: "volume",
    id: "usm-3",
    lineId: "ultimate-spider-man",
    number: "3",
    title: "Venom",
    start: { year: 2002, quarter: 4 },
    end: { year: 2003, quarter: 2 },
    issuesCollected: "Ultimate Spider-Man #28-39, #1/2",
    yearsCovered: "2002-2003",
    creators: "Bendis, Bagley",
    description: "Eddie Brock's symbiote origin, reimagined.",
    ownershipStatus: "announced",
  },

  // --- Ultimate X-Men ---
  {
    kind: "volume",
    id: "uxm-1",
    lineId: "ultimate-x-men",
    number: "1",
    title: "The Tomorrow People",
    start: { year: 2001, quarter: 1 },
    end: { year: 2001, quarter: 4 },
    issuesCollected: "Ultimate X-Men (2001) #1-12, #1/2",
    yearsCovered: "2001",
    creators: "Millar, Kubert",
    description: "A new take on Xavier's students, and the world's fear of them.",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "uxm-2",
    lineId: "ultimate-x-men",
    number: "2",
    title: "World Tour",
    start: { year: 2002, quarter: 1 },
    end: { year: 2002, quarter: 3 },
    issuesCollected: "Ultimate X-Men #13-25",
    yearsCovered: "2002",
    creators: "Millar, Kubert",
    description: "The team goes global chasing the Brotherhood.",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "uxm-3",
    lineId: "ultimate-x-men",
    number: "3",
    title: "World Tour",
    start: { year: 2002, quarter: 4 },
    end: { year: 2003, quarter: 2 },
    issuesCollected: "Ultimate X-Men #26-33, Ultimate War",
    yearsCovered: "2002-2003",
    creators: "Millar, Kubert",
    description: "The world tour concludes, crossing into Ultimates territory.",
    ownershipStatus: "announced",
  },

  // --- The Ultimates ---
  {
    kind: "volume",
    id: "ult-1",
    lineId: "the-ultimates",
    number: "1",
    title: "Super-Human",
    start: { year: 2002, quarter: 1 },
    end: { year: 2002, quarter: 4 },
    issuesCollected: "Ultimates (2002) #1-13",
    yearsCovered: "2002",
    creators: "Millar, Hitch",
    description: "The Avengers, rebuilt as a modern black-ops super-team.",
    ownershipStatus: "out_of_print",
  },
  // Publication gap: The Ultimates had no issues released between the two
  // volumes below -- this is a real-world hiatus, not an uncollected span.
  // No volume will ever fill this in.
  {
    kind: "gap",
    id: "ult-gap-1",
    lineId: "the-ultimates",
    gapType: "publication",
    start: { year: 2003, quarter: 1 },
    end: { year: 2004, quarter: 1 },
    label: "No issues published in this window",
  },
  {
    kind: "volume",
    id: "ult-2",
    lineId: "the-ultimates",
    number: "2",
    title: "Gods and Monsters",
    start: { year: 2004, quarter: 2 },
    end: { year: 2005, quarter: 1 },
    issuesCollected: "Ultimates (2004) #1-13",
    yearsCovered: "2004-2005",
    creators: "Millar, Hitch",
    description: "Volume 2 of the ongoing, collected under the same Epic Collection number.",
    ownershipStatus: "announced",
  },

  // --- Ultimate Fantastic Four ---
  {
    kind: "volume",
    id: "uff-1",
    lineId: "ultimate-fantastic-four",
    number: "1",
    title: "The Fantastic",
    start: { year: 2004, quarter: 1 },
    end: { year: 2004, quarter: 4 },
    issuesCollected: "Ultimate Fantastic Four #1-18",
    yearsCovered: "2004",
    creators: "Bendis, Millar, Land",
    description: "Reed Richards and friends, reimagined as teenage prodigies.",
    ownershipStatus: "alt_format",
  },
  {
    kind: "volume",
    id: "uff-2",
    lineId: "ultimate-fantastic-four",
    number: "2",
    title: "Frightful",
    start: { year: 2005, quarter: 1 },
    end: { year: 2005, quarter: 3 },
    issuesCollected: "Ultimate Fantastic Four #19-32, Annual #1",
    yearsCovered: "2005",
    creators: "Bendis, Millar, Land",
    description: "The Frightful Four assemble to take down Marvel's newest heroes.",
    ownershipStatus: "announced",
  },
];
