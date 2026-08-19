import type { Line, TimelineEntry } from "../types";

// Bulk-wired from src/assets/Marvel/ultimate/<Character>.png, same glob-based
// pattern as classic-marvel-epic.ts's marvelIcon/dc-finest.ts's dcIcon --
// eagerly globbed so new files just need to match a line's name, no import
// list to maintain by hand.
const ultimateIconModules = import.meta.glob("../assets/Marvel/ultimate/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function ultimateIcon(filename: string): string {
  const key = `../assets/Marvel/ultimate/${filename}`;
  const url = ultimateIconModules[key];
  if (!url) throw new Error(`Missing Ultimate icon: ${key}`);
  return url;
}

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
    iconUrl: ultimateIcon("Ultimate Spider-Man.png"),
    colorHex: "#8B1E2F",
    debutDate: { year: 2000, month: 10 },
  },
  {
    id: "ultimate-x-men",
    collectionId: "ultimate",
    name: "Ultimate X-Men",
    iconUrl: ultimateIcon("Ultimate X-Men.png"),
    colorHex: "#C9A227",
    debutDate: { year: 2001, month: 2 },
  },
  {
    id: "the-ultimates",
    collectionId: "ultimate",
    name: "The Ultimates",
    iconUrl: ultimateIcon("The Ultimates.png"),
    colorHex: "#6B7280",
    debutDate: { year: 2002, month: 3 },
  },
  {
    id: "ultimate-fantastic-four",
    collectionId: "ultimate",
    name: "Ultimate Fantastic Four",
    iconUrl: ultimateIcon("Ultimate Fantastic Four.png"),
    colorHex: "#00ADEF",
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
    releaseDate: { year: 2025, month: 3 },
    writers: "Brian Michael Bendis, Bill Jemas",
    pencillers: "Mark Bagley",
    inkers: "Art Thibert, Dan Panosian",
    description:
      "The Ultimate line's flagship launch, retelling Peter Parker's origin for a new era.",
    coverUrl: "https://m.media-amazon.com/images/I/81wBu27FwEL._SL1500_.jpg",
    ownershipStatus: "announced",
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
    releaseDate: { year: 2026, month: 3 },
    writers: "Brian Michael Bendis",
    pencillers: "Mark Bagley",
    inkers: "Art Thibert, Erik Benson",
    description: "The Kingpin closes in as Peter's double life grows harder to hide.",
    coverUrl: "https://m.media-amazon.com/images/I/812ndNdq-nL._SL1500_.jpg",
    ownershipStatus: "announced",
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
    releaseDate: { year: 2027, month: 3 },
    writers: "Brian Michael Bendis",
    pencillers: "Mark Bagley",
    inkers: "Art Thibert, Rodney Ramos",
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
    releaseDate: { year: 2025, month: 4 },
    writers: "Mark Millar, Geoff Johns",
    pencillers: "Adam Kubert, Andy Kubert, Tom Raney, Tom Derenick, Aaron Lopresti",
    inkers: "Art Thibert, Danny Miki, Scott Hanna, Joe Weems, Joe Kubert, Lary Stucker",
    description: "A new take on Xavier's students, and the world's fear of them.",
    coverUrl: "https://m.media-amazon.com/images/I/81QeU1JVXYL._SL1500_.jpg",
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
    releaseDate: { year: 2026, month: 4 },
    writers: "Mark Millar, Chuck Austen",
    pencillers: "Adam Kubert, Esad Ribić, Chris Bachalo, Kaare Andrews",
    inkers: "Danny Miki, John Livesay, Chris Bachalo, Kaare Andrews",
    description: "The team goes global chasing the Brotherhood.",
    coverUrl: "https://m.media-amazon.com/images/I/91yyqL5nSnL._SL1500_.jpg",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "uxm-3",
    lineId: "ultimate-x-men",
    number: "3",
    title: "Return of the King",
    start: { year: 2002, quarter: 4 },
    end: { year: 2003, quarter: 2 },
    issuesCollected: "Ultimate X-Men #26-33, Ultimate War",
    yearsCovered: "2002-2003",
    releaseDate: { year: 2027, month: 4 },
    writers: "Mark Millar",
    pencillers: "Adam Kubert, Chris Bachalo, David Finch, Ben Lai",
    inkers: "Danny Miki, Tim Townsend, Art Thibert, Andy Owens, Ray Lai, Aaron Sowd",
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
    releaseDate: { year: 2025, month: 5 },
    writers: "Mark Millar",
    pencillers: "Bryan Hitch",
    inkers: "Andrew Currie, Paul Neary",
    description: "The Avengers, rebuilt as a modern black-ops super-team.",
    coverUrl: "https://m.media-amazon.com/images/I/81YjCgnPS7L._SL1500_.jpg",
    ownershipStatus: "announced",
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
    end: { year: 2005, quarter: 3 },
    issuesCollected: "Ultimates (2004) #1-13",
    yearsCovered: "2004-2005",
    releaseDate: { year: 2026, month: 9 },
    writers: "Mark Millar",
    pencillers: "Bryan Hitch",
    inkers: "Paul Neary, Bryan Hitch",
    description:
      "Volume 2 of the ongoing, collected under the same Epic Collection number.",
    coverUrl: "https://m.media-amazon.com/images/I/81XqbRPSgFL._SL1500_.jpg",
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
    releaseDate: { year: 2025, month: 6 },
    writers: "Warren Ellis, Brian Michael Bendis, Mark Millar",
    pencillers: "Adam Kubert, Stuart Immonen",
    inkers:
      "John Dell, Wade von Grawbadger, Danny Miki, Scott Hanna, Mark Morales, Nelson DeCastro, Lary Stucker",
    description: "Reed Richards and friends, reimagined as teenage prodigies.",
    coverUrl: "https://m.media-amazon.com/images/I/81gmyDbAxNL._SL1500_.jpg",
    ownershipStatus: "announced",
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
    releaseDate: { year: 2026, month: 6 },
    writers: "Mark Millar, Mike Carey",
    pencillers: "Greg Land, Mitch Breitweiser, Jae Lee",
    inkers: "Matt Ryan, Jae Lee, Mitch Breitweiser",
    description: "The Frightful Four assemble to take down Marvel's newest heroes.",
    coverUrl: "https://m.media-amazon.com/images/I/81b7p2s3aHL._SL1500_.jpg",
    ownershipStatus: "announced",
  },
];
