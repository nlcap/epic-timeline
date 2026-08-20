import type { Line, TimelineEntry } from "../types";

// One-off volume cover that predates the Amazon-hosted-URL convention most
// coverUrl fields below use -- a plain imported asset instead, same as any
// other static image in the app.
import jonahHexRequiemForAGunfighterCover from "../assets/covers/Jonah Hex - Requiem for a Gunfighter.jpg";
import hitmanRageInArkhamCover from "../assets/covers/Hitman - Rage in Arkham.jpg";
import romanceEscapeFromLonelinessCover from "../assets/covers/Romance - Escape from Loneliness.jpg";
import theAtomBirthOfTheAtomCover from "../assets/covers/The Atom - Birth of the Atom.jpg";
import theQuestionZenAndViolenceCover from "../assets/covers/The Question - Zen and Violence.jpg";
import warlordTheSavageWorldCover from "../assets/covers/Warlord - The Savage World.jpg";
import batgirlSilentKnightCover from "../assets/covers/Batgirl - Silent Knight.jpg";
import supermanFamilyStraySuperdogCover from "../assets/covers/Superman Family - The Stray Superdog.jpg";
import batmanNightOfTheStalkerCover from "../assets/covers/Batman - Night of the Stalker.jpg";
import legionGreatDarknessSagaCover from "../assets/covers/Legion of the Super-Heroes - The Great Darkness Saga.jpg";
import batmanLonelyPlaceOfDyingCover from "../assets/covers/Batman - A Lonely Place of Dying.jpg";
import eventsCrisisPartFourCover from "../assets/covers/Events - Crisis on Infinite Earths Part Four.jpg";
import wonderWomanJudgementInInfinityCover from "../assets/covers/Wonder Woman - Judgement in Infinity.jpg";
import supermanKryptonConnectionCover from "../assets/covers/Superman - The Krypton Connection.jpg";
import aquamanHauntedSeaCover from "../assets/covers/Aquaman - The Haunted Sea.jpg";
import catwomanToCatchAThiefCover from "../assets/covers/Catwoman - To Catch a Thief.jpg";
// PLACEHOLDER (added 2026-08-10) -- Nick-supplied cover for this volume,
// not yet confirmed as the final official DC Finest cover. Verify against
// the official release and swap/delete this comment once confirmed.
import theFourthWorldStormOfBattleCover from "../assets/covers/The Fourth World - The Storm of Battle.jpg";

// Bulk-wired from src/assets/DC/<era>/<Character>.png (Nick dropped in a folder
// per era: "golden age", "silver age", "bronze age", "post-crisis"). Eagerly
// globbed so new files just need to match a line's name -- no import list to
// maintain by hand.
const dcIconModules = import.meta.glob("../assets/DC/*/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function dcIcon(era: string, filename: string): string {
  const key = `../assets/DC/${era}/${filename}`;
  const url = dcIconModules[key];
  if (!url) throw new Error(`Missing DC icon: ${key}`);
  return url;
}

// Seed data for the "DC Finest" collection, bulk-imported from Nick's tracking
// spreadsheet. Line colors are sampled from that sheet's per-character cell
// fill (visual read, not pixel-exact -- nudge any that look off). Debut dates
// are real-world first appearances for character lines; anthology/genre lines
// (Events, Horror, Science Fiction, Superfriends, Superman Family, Team-Ups,
// War, Western) have no single debut, so they fall back to their earliest
// collected volume's year -- see FALLBACK comments below.
//
// creators/description aren't in the source spreadsheet -- both have since
// been filled in for every volume here.
//
// releaseDate/writers/artists were bulk-backfilled from
// https://en.wikipedia.org/wiki/DC_Finest_trade_paperbacks, which carries
// Writers/Artists/Pub. date columns per volume; all 100 have all three. That
// page has no "#" column (volumes are listed in publication order, not
// numbered), so rows were matched to these entries by title within a line.
export const DC_FINEST_LINES: Line[] = [
  {
    id: "aquaman",
    collectionId: "dc-finest",
    name: "Aquaman",
    eraIconUrls: {
      golden: dcIcon("golden age", "Aquaman.png"),
      silver: dcIcon("silver age", "Aquaman.png"),
      bronze: dcIcon("bronze age", "Aquaman.png"),
      "post-crisis": dcIcon("post-crisis", "Aquaman.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#008284",
    debutDate: { year: 1941, month: 11 },
  },
  {
    id: "batman",
    collectionId: "dc-finest",
    name: "Batman",
    eraIconUrls: {
      golden: dcIcon("golden age", "Batman.png"),
      silver: dcIcon("silver age", "Batman.png"),
      bronze: dcIcon("bronze age", "Batman.png"),
      "post-crisis": dcIcon("post-crisis", "Batman.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#060201",
    debutDate: { year: 1939, month: 5 },
  },
  {
    id: "batgirl",
    collectionId: "dc-finest",
    name: "Batgirl",
    eraIconUrls: {
      silver: dcIcon("silver age", "Batgirl.png"),
      bronze: dcIcon("bronze age", "Batgirl.png"),
      "post-crisis": dcIcon("post-crisis", "Batgirl.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#000000",
    debutDate: { year: 1967, month: 1 },
  },
  {
    id: "blue-beetle",
    collectionId: "dc-finest",
    name: "Blue Beetle",
    eraIconUrls: {
      golden: dcIcon("golden age", "Blue Beetle.png"),
      silver: dcIcon("silver age", "Blue Beetle.png"),
      bronze: dcIcon("bronze age", "Blue Beetle.png"),
      "post-crisis": dcIcon("post-crisis", "Blue Beetle.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#2D66AC",
    debutDate: { year: 1939, month: 8 },
  },
  {
    id: "catwoman",
    collectionId: "dc-finest",
    name: "Catwoman",
    eraIconUrls: {
      golden: dcIcon("golden age", "Catwoman.png"),
      silver: dcIcon("silver age", "Catwoman.png"),
      bronze: dcIcon("bronze age", "Catwoman.png"),
      "post-crisis": dcIcon("post-crisis", "Catwoman.png"),
    },
    defaultIconEra: "silver",
    colorHex: "#51294C",
    debutDate: { year: 1940, month: 4 },
  },
  {
    id: "deadman",
    collectionId: "dc-finest",
    name: "Deadman",
    eraIconUrls: {
      bronze: dcIcon("bronze age", "Deadman.png"),
      "post-crisis": dcIcon("post-crisis", "Deadman.png"),
    },
    colorHex: "#64150E",
    debutDate: { year: 1967, month: 10 },
  },
  {
    id: "demon",
    collectionId: "dc-finest",
    name: "Demon",
    eraIconUrls: {
      bronze: dcIcon("bronze age", "demon.png"),
      "post-crisis": dcIcon("post-crisis", "demon.png"),
    },
    colorHex: "#BE282E",
    debutDate: { year: 1972, month: 9 },
  },
  {
    id: "doom-patrol",
    collectionId: "dc-finest",
    name: "Doom Patrol",
    eraIconUrls: {
      silver: dcIcon("silver age", "Doom Patrol.png"),
      bronze: dcIcon("bronze age", "Doom Patrol.png"),
      "post-crisis": dcIcon("post-crisis", "Doom Patrol.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#BC001B",
    debutDate: { year: 1963, month: 7 },
  },
  {
    id: "events",
    collectionId: "dc-finest",
    name: "Events",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "Events.png"),
    },
    colorHex: "#E5E5E5",
    debutDate: { year: 1985, month: 10 },
  },
  {
    id: "flash",
    collectionId: "dc-finest",
    name: "The Flash",
    eraIconUrls: {
      golden: dcIcon("golden age", "Flash.png"),
      silver: dcIcon("silver age", "Flash.png"),
      bronze: dcIcon("bronze age", "Flash.png"),
      "post-crisis": dcIcon("post-crisis", "Flash.png"),
    },
    colorHex: "#880D31",
    defaultIconEra: "bronze",
    debutDate: { year: 1940, month: 1 },
  },
  {
    id: "the-fourth-world",
    collectionId: "dc-finest",
    name: "The Fourth World",
    eraIconUrls: {
      bronze: dcIcon("bronze age", "Fourth World.png"),
      "post-crisis": dcIcon("post-crisis", "Fourth World.png"),
    },
    colorHex: "#471550",
    debutDate: { year: 1971, month: 2 },
  },
  {
    id: "green-arrow",
    collectionId: "dc-finest",
    name: "Green Arrow",
    eraIconUrls: {
      golden: dcIcon("golden age", "Green Arrow.png"),
      silver: dcIcon("silver age", "Green Arrow.png"),
      bronze: dcIcon("bronze age", "Green Arrow.png"),
      "post-crisis": dcIcon("post-crisis", "Green Arrow.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#007C30",
    debutDate: { year: 1941, month: 11 },
  },
  {
    id: "green-lantern",
    collectionId: "dc-finest",
    name: "Green Lantern",
    eraIconUrls: {
      golden: dcIcon("golden age", "Green Lantern.png"),
      silver: dcIcon("silver age", "Green Lantern.png"),
      bronze: dcIcon("bronze age", "Green Lantern.png"),
      "post-crisis": dcIcon("post-crisis", "Green Lantern.png"),
    },
    colorHex: "#4D6B39",
    debutDate: { year: 1940, month: 7 },
  },
  {
    id: "harley-quinn",
    collectionId: "dc-finest",
    name: "Harley Quinn",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "Harly Quinn.png"),
    },
    colorHex: "#0B0E12",
    debutDate: { year: 1993, month: 10 },
  },
  {
    id: "hawkman",
    collectionId: "dc-finest",
    name: "Hawkman",
    eraIconUrls: {
      golden: dcIcon("golden age", "Hawkman.png"),
      silver: dcIcon("silver age", "Hawkman.png"),
      bronze: dcIcon("bronze age", "Hawkman.png"),
      "post-crisis": dcIcon("post-crisis", "Hawkman.png"),
    },
    defaultIconEra: "golden",
    colorHex: "#861D32",
    debutDate: { year: 1940, month: 1 },
  },
  {
    id: "horror",
    collectionId: "dc-finest",
    name: "Horror",
    eraIconUrls: {
      golden: dcIcon("golden age", "House of Secrets.png"),
    },
    colorHex: "#0B1123",
    debutDate: { year: 1951, month: 12 },
  },
  {
    id: "joker",
    collectionId: "dc-finest",
    name: "Joker",
    eraIconUrls: {
      golden: dcIcon("golden age", "Joker.png"),
      silver: dcIcon("silver age", "Joker.png"),
      bronze: dcIcon("bronze age", "Joker.png"),
      "post-crisis": dcIcon("post-crisis", "Joker.png"),
    },
    colorHex: "#541565",
    debutDate: { year: 1940, month: 4 },
  },
  {
    id: "justice-league-of-america",
    collectionId: "dc-finest",
    name: "Justice League of America",
    eraIconUrls: {
      silver: dcIcon("silver age", "JLA.png"),
      bronze: dcIcon("bronze age", "JLA.png"),
      "post-crisis": dcIcon("post-crisis", "JLA.png"),
    },
    colorHex: "#BF0038",
    defaultIconEra: "bronze",
    debutDate: { year: 1960, month: 4 },
  },
  {
    id: "justice-society-of-america",
    collectionId: "dc-finest",
    name: "Justice Society of America",
    eraIconUrls: {
      golden: dcIcon("golden age", "JSA.png"),
      silver: dcIcon("silver age", "JSA.png"),
      bronze: dcIcon("bronze age", "JSA.png"),
      "post-crisis": dcIcon("post-crisis", "JSA.png"),
    },
    colorHex: "#293B7B",
    defaultIconEra: "bronze",
    debutDate: { year: 1940, month: 12 },
  },
  {
    id: "legion-of-the-super-heroes",
    collectionId: "dc-finest",
    name: "Legion of the Super-Heroes",
    eraIconUrls: {
      bronze: dcIcon("bronze age", "Legion.png"),
      "post-crisis": dcIcon("post-crisis", "Legion.png"),
    },
    colorHex: "#0769B2",
    defaultIconEra: "bronze",
    debutDate: { year: 1958, month: 4 },
  },
  {
    id: "metamorpho",
    collectionId: "dc-finest",
    name: "Metamorpho",
    eraIconUrls: {
      silver: dcIcon("silver age", "Metamorpho.png"),
      bronze: dcIcon("bronze age", "Metamorpho.png"),
      "post-crisis": dcIcon("post-crisis", "Metamorpho.png"),
    },
    defaultIconEra: "post-crisis",
    colorHex: "#BF0423",
    debutDate: { year: 1965, month: 1 },
  },
  {
    id: "peacemaker",
    collectionId: "dc-finest",
    name: "Peacemaker",
    eraIconUrls: {
      silver: dcIcon("silver age", "Peacemaker.png"),
      bronze: dcIcon("bronze age", "Peacemaker.png"),
    },
    colorHex: "#0669B2",
    debutDate: { year: 1966, month: 10 },
  },
  {
    id: "plastic-man",
    collectionId: "dc-finest",
    name: "Plastic Man",
    eraIconUrls: {
      golden: dcIcon("golden age", "Plastic Man.png"),
      silver: dcIcon("silver age", "Plastic Man.png"),
      bronze: dcIcon("bronze age", "Plastic Man.png"),
      "post-crisis": dcIcon("post-crisis", "Plastic Man.png"),
    },
    defaultIconEra: "post-crisis",
    colorHex: "#954A1C",
    debutDate: { year: 1941, month: 8 },
  },
  {
    id: "robin",
    collectionId: "dc-finest",
    name: "Robin",
    eraIconUrls: {
      golden: dcIcon("golden age", "Robin.png"),
      silver: dcIcon("silver age", "Robin.png"),
      bronze: dcIcon("bronze age", "Robin.png"),
      "post-crisis": dcIcon("post-crisis", "Robin.png"),
    },
    colorHex: "#842024",
    debutDate: { year: 1940, month: 4 },
  },
  {
    id: "science-fiction",
    collectionId: "dc-finest",
    name: "Science Fiction",
    eraIconUrls: {
      golden: dcIcon("golden age", "SciFi.png"),
    },
    colorHex: "#1E3048",
    debutDate: { year: 1950, month: 8 },
  },
  {
    id: "sgt-rock",
    collectionId: "dc-finest",
    name: "Sgt. Rock",
    eraIconUrls: {
      silver: dcIcon("silver age", "Sgt Rock.png"),
      bronze: dcIcon("bronze age", "Sgt Rock.png"),
      "post-crisis": dcIcon("post-crisis", "Sgt Rock.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#182D1C",
    debutDate: { year: 1959, month: 1 },
  },
  {
    id: "the-spectre",
    collectionId: "dc-finest",
    name: "The Spectre",
    eraIconUrls: {
      golden: dcIcon("golden age", "Spectre.png"),
      silver: dcIcon("silver age", "Spectre.png"),
      bronze: dcIcon("bronze age", "Spectre.png"),
      "post-crisis": dcIcon("post-crisis", "Spectre.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#223046",
    debutDate: { year: 1940, month: 2 },
  },
  {
    id: "static",
    collectionId: "dc-finest",
    name: "Static",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "Static.png"),
    },
    colorHex: "#3259A0",
    debutDate: { year: 1993, month: 6 },
  },
  {
    id: "swamp-thing",
    collectionId: "dc-finest",
    name: "Swamp Thing",
    eraIconUrls: {
      bronze: dcIcon("bronze age", "Swamp Thing.png"),
      "post-crisis": dcIcon("post-crisis", "Swamp Thing.png"),
    },
    defaultIconEra: "post-crisis",
    colorHex: "#83AB27",
    debutDate: { year: 1971, month: 7 },
  },
  {
    id: "superboy",
    collectionId: "dc-finest",
    name: "Superboy",
    eraIconUrls: {
      golden: dcIcon("golden age", "Superboy.png"),
      silver: dcIcon("silver age", "Superboy.png"),
      bronze: dcIcon("bronze age", "Superboy.png"),
      "post-crisis": dcIcon("post-crisis", "Superboy.png"),
    },
    defaultIconEra: "post-crisis",
    colorHex: "#314397",
    debutDate: { year: 1945, month: 1 },
  },
  {
    id: "superfriends",
    collectionId: "dc-finest",
    name: "Superfriends",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "Superfriend.png"),
    },
    colorHex: "#2D66AC",
    debutDate: { year: 1976, month: 11 },
  },
  {
    id: "supergirl",
    collectionId: "dc-finest",
    name: "Supergirl",
    eraIconUrls: {
      silver: dcIcon("silver age", "Supergirl.png"),
      bronze: dcIcon("bronze age", "Supergirl.png"),
      "post-crisis": dcIcon("post-crisis", "Supergirl.png"),
    },
    colorHex: "#0769B2",
    defaultIconEra: "bronze",
    debutDate: { year: 1959, month: 5 },
  },
  {
    id: "superman",
    collectionId: "dc-finest",
    name: "Superman",
    eraIconUrls: {
      golden: dcIcon("golden age", "g_Superman.png"),
      silver: dcIcon("silver age", "Superman.png"),
      bronze: dcIcon("bronze age", "Superman.png"),
      "post-crisis": dcIcon("post-crisis", "Superman.png"),
    },
    defaultIconEra: "post-crisis",
    colorHex: "#2E3E8A",
    debutDate: { year: 1938, month: 7 },
  },
  {
    id: "superman-family",
    collectionId: "dc-finest",
    name: "Superman Family",
    eraIconUrls: {
      silver: dcIcon("silver age", "Superman Family.png"),
      bronze: dcIcon("bronze age", "Superman Family.png"),
      "post-crisis": dcIcon("post-crisis", "Superman Family.png"),
    },
    colorHex: "#0669B2",
    debutDate: { year: 1954, month: 9 },
  },
  {
    id: "suicide-squad",
    collectionId: "dc-finest",
    name: "Suicide Squad",
    eraIconUrls: {
      silver: dcIcon("silver age", "Suicide Squad.png"),
      bronze: dcIcon("bronze age", "Suicide Squad.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#1E3048",
    debutDate: { year: 1959, month: 9 },
  },
  {
    id: "team-ups",
    collectionId: "dc-finest",
    name: "Team-Ups",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "Teamups.png"),
    },
    colorHex: "#70350D",
    debutDate: { year: 1941, month: 8 },
  },
  {
    id: "teen-titans",
    collectionId: "dc-finest",
    name: "Teen Titans",
    eraIconUrls: {
      silver: dcIcon("silver age", "Teen Titans.png"),
      bronze: dcIcon("bronze age", "Teen Titans.png"),
      "post-crisis": dcIcon("post-crisis", "Teen Titans.png"),
    },
    colorHex: "#AB5522",
    debutDate: { year: 1964, month: 7 },
  },
  {
    id: "war",
    collectionId: "dc-finest",
    name: "War",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "War.png"),
    },
    colorHex: "#2C5222",
    debutDate: { year: 1952, month: 8 },
  },
  {
    id: "western",
    collectionId: "dc-finest",
    name: "Western",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "Western.png"),
    },
    colorHex: "#7B4521",
    debutDate: { year: 1948, month: 1 },
  },
  {
    id: "wonder-woman",
    collectionId: "dc-finest",
    name: "Wonder Woman",
    eraIconUrls: {
      golden: dcIcon("golden age", "Wonder Woman.png"),
      silver: dcIcon("silver age", "Wonder Woman.png"),
      bronze: dcIcon("bronze age", "Wonder Woman.png"),
      "post-crisis": dcIcon("post-crisis", "Wonder Woman.png"),
    },
    defaultIconEra: "post-crisis",
    colorHex: "#780627",
    debutDate: { year: 1941, month: 10 },
  },
  {
    id: "dc-finest-hitman-msdw2v0w",
    collectionId: "dc-finest",
    name: "Hitman",
    eraIconUrls: {
      "post-crisis": dcIcon("post-crisis", "Hitman.png"),
    },
    defaultIconEra: "post-crisis",
    colorHex: "#54020a",
    debutDate: { year: 1993, month: 11 },
  },
  {
    id: "dc-finest-romance-msasa36s",
    collectionId: "dc-finest",
    name: "Romance",
    eraIconUrls: {
      silver: dcIcon("silver age", "Romance.png"),
      bronze: dcIcon("bronze age", "Romance.png"),
      "post-crisis": dcIcon("post-crisis", "Romance.png"),
    },
    defaultIconEra: "silver",
    colorHex: "#90086A",
    debutDate: { year: 1947, month: 9 },
  },
  {
    id: "dc-finest-the-atom-msj7gzpt",
    collectionId: "dc-finest",
    name: "The Atom",
    eraIconUrls: {
      golden: dcIcon("golden age", "Atom.png"),
      silver: dcIcon("silver age", "Atom.png"),
      bronze: dcIcon("bronze age", "Atom.png"),
      "post-crisis": dcIcon("post-crisis", "Atom.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#be0123",
    debutDate: { year: 1940, month: 10 },
  },
  {
    id: "dc-finest-the-question-msi8ihr7",
    collectionId: "dc-finest",
    name: "The Question",
    eraIconUrls: {
      silver: dcIcon("silver age", "Question.png"),
      bronze: dcIcon("bronze age", "Question.png"),
      "post-crisis": dcIcon("post-crisis", "Question.png"),
    },
    defaultIconEra: "silver",
    colorHex: "#0f1738",
    debutDate: { year: 1967, month: 6 },
  },
  {
    id: "dc-finest-warlord-msdxdi2p",
    collectionId: "dc-finest",
    name: "Warlord",
    eraIconUrls: {
      bronze: dcIcon("bronze age", "Warlord.png"),
      "post-crisis": dcIcon("post-crisis", "Warlord.png"),
    },
    defaultIconEra: "bronze",
    colorHex: "#6f4421",
    debutDate: { year: 1975, month: 11 },
  },
];

export const DC_FINEST_ENTRIES: TimelineEntry[] = [
  // --- Aquaman ---
  {
    kind: "volume",
    id: "aquaman-s1",
    lineId: "aquaman",
    number: "1",
    era: "silver",
    title: "King of Atlantis",
    start: { year: 1956, quarter: 4 },
    end: { year: 1962, quarter: 2 },
    issuesCollected: "Adventure Comics #229-280, #282, and #284: Action Comics #272; Detective Comics #293-300; World’s Finest Comics #125; Showcase #30-33; Superman’s Girl Friend Lois Lane #12; and Aquaman #1-3",
    yearsCovered: "1956-1962",
    releaseDate: { year: 2025, month: 1 },
    writers: "Robert Bernstein, Jack Miller, Otto Binder, George Kashdan, Joe Millard",
    pencillers: "Ramona Fradon, Nick Cardy, Jim Mooney, Joe Certa, Sheldon Moldoff",
    inkers: "Ramona Fradon, Nick Cardy, Charles Paris, Jim Mooney, Sheldon Moldoff",
    description:
      "The earliest Silver Age stories starring the King of the Seas, drawn by Ramona Fradon and Nick Cardy as Aquaman graduates from backup feature to headlining his own title.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779529893",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "aquaman-vol-msj8o2ts",
    lineId: "aquaman",
    number: "2",
    era: "silver",
    title: "The Haunted Sea",
    start: { year: 1962, quarter: 3 },
    end: { year: 1965, quarter: 4 },
    issuesCollected:
      "Aquaman #4-24; The Brave and the Bold #51; World's Finest Comics #126-133, #135, #137, and #139; Superman's Girl Friend, Lois Lane #29; and Superman's Pal, Jimmy Olsen #55 and #78",
    yearsCovered: "1962-1965",
    releaseDate: { year: 2027, month: 6 },
    writers: "Jack Miller, Bob Haney, Dave Wood",
    pencillers: "Nick Cardy, Ramona Fradon, Howard Purcell",
    inkers: "Nick Cardy, Ramona Fradon, Howard Purcell",
    description:
      "Part of the DC Finest line, this deep-diving collection spotlights Aquaman's early adventures!\nAs king of Atlantis and protector of the seas, Aquaman faces threats both above and below the surface-but some dangers are stranger and more unpredictable than anything he's encountered before. From cursed forces rising out of the deep to mysterious enemies that blur the line between science and sorcery, these adventures transform the ocean into a place of wonder, danger, and suspense.\nBlending action, suspense, and imaginative world-building, these stories showcase a defining era of Aquaman's legacy; where superhero storytelling meets eerie, atmospheric adventure.",
    coverUrl: aquamanHauntedSeaCover,
    ownershipStatus: "announced",
  },
  // --- Batman ---
  {
    kind: "volume",
    id: "batman-g1",
    lineId: "batman",
    number: "1",
    era: "golden",
    title: "The Case of the Chemical Syndicate",
    start: { year: 1939, quarter: 2 },
    end: { year: 1941, quarter: 2 },
    issuesCollected:
      "Detective Comics #27-51, Batman #1-5, New York World's Fair Comics #2, and World's Best Comics #1",
    yearsCovered: "1939-1941",
    releaseDate: { year: 2026, month: 1 },
    writers: "Bill Finger, Gardner Fox, Whitney Ellsworth",
    pencillers: "Bob Kane, Sheldon Moldoff, Jerry Robinson, Jack Burnley",
    inkers: "Jerry Robinson, George Roussos, Bob Kane, Sheldon Moldoff",
    description:
      "Batman's earliest Golden Age cases, including his own origin and the debut of the Joker, the Catwoman, and Robin the Boy Wonder.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799506706",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-b2",
    lineId: "batman",
    number: "2",
    era: "bronze",
    title: "The Demon Lives Again!",
    start: { year: 1971, quarter: 2 },
    end: { year: 1972, quarter: 3 },
    issuesCollected: "Batman #231-245 and Detective Comics #410-429",
    yearsCovered: "1971-1972",
    releaseDate: { year: 2026, month: 10 },
    writers: "Dennis \"Denny\" O'Neil, Frank Robbins, Bernie Wrightson, Harlan Ellison",
    pencillers: "Irv Novick, Robert \"Bob\" Brown, Neal Adams, Frank Robbins",
    inkers: "Dick Giordano, Frank Robbins, Neal Adams, Steve Englehart",
    description:
      "The debut of Ra's al Ghul and the Lazarus Pit, as Denny O'Neil, Frank Robbins, and Neal Adams pull Batman out of the campy '60s and into a darker, globe-trotting era.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510307",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-vol-mshrqobd",
    lineId: "batman",
    number: "3",
    era: "bronze",
    title: "Night of the Stalker",
    start: { year: 1972, quarter: 4 },
    end: { year: 1975, quarter: 1 },
    issuesCollected:
      "Batman #246-261, Detective Comics #430-445, and the never-before-collected five-page Batman story that was included with the Batman model kit released by Aurora in 1974",
    yearsCovered: "1972-1975",
    releaseDate: { year: 2027, month: 2 },
    // Split by hand from `creators` -- Wikipedia lists this volume's credits
    // as "TBC", so the names carried over from Nick's own sheet.
    writers:
      "Frank Robbins, Archie Goodwin, Dennis \"Denny\" O'Neil, Elliot S. Maggin, Len Wein, E. Nelson Bridwell, Bob Rozakis, Martin Pasko, Mike W. Barr, Sal Amendola, Steve Englehart, Vin Amendola",
    pencillers:
      "Irv Novick, Walter \"Walt\" Simonson, Robert \"Bob\" Brown, Dick Dillin, Dick Giordano, Jim Aparo, Don Heck, Neal Adams, Sal Amendola, Alex Toth, Ernie Chan, Frank Robbins, Howard Chaykin, Mike Grell, Murphy Anderson, Pat Broderick, Rich Buckler",
    inkers:
      "Dick Giordano, Walter \"Walt\" Simonson, Murphy Anderson, Jim Aparo, Frank McLaughlin, Alex Toth, Ernie Chan, Frank Giacoia, Frank Robbins, Howard Chaykin, Mike Grell, Neal Adams, Nick Cardy, Pat Broderick, Sal Amendola",
    description:
      "Batman faces crime, mystery, and psychological threats in a darker, more dangerous Gotham in these defining Bronze Age adventures.\nGotham City is changing—and Batman must change with it.\nAs crime grows more unpredictable and dangerous, the Dark Knight is drawn into cases that push him beyond traditional detective work. From high-stakes battles with some of his most dangerous enemies to tense investigations that uncover Gotham’s rampant corruption, every encounter tests his instincts, restraint, and resolve.\nBringing together core Batman stories with rare and unexpected material, this DC Finest volume delivers an immersive, wide-ranging collection that captures the tone and evolution of the Dark Knight Detective during this pivotal period.",
    coverUrl: batmanNightOfTheStalkerCover,
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-bb",
    lineId: "batman",
    number: "c",
    era: "bronze",
    title: "The Curse of Crime Alley",
    start: { year: 1979, quarter: 1 },
    end: { year: 1980, quarter: 2 },
    issuesCollected: "Batman #307–324; Detective Comics #482–490; DC Special Series #21; and The Brave and the Bold #159",
    yearsCovered: "1979-1980",
    releaseDate: { year: 2026, month: 11 },
    writers:
      "Len Wein, Dennis \"Denny\" O'Neil, Cary Burkett, J.M. DeMatteis, Steve Englehart, Jim Starlin",
    pencillers:
      "Irv Novick, Don Newton, John Calnan, Walter \"Walt\" Simonson, Dick Dillin, Frank Miller, Jim Aparo, Jim Starlin",
    inkers:
      "Frank McLaughlin, Dan Adkins, Dick Giordano, Bob Smith, Vince Colletta, Jim Aparo, P. Craig Russell, Steve Mitchell",
    description:
      "Denny O'Neil and Len Wein fuse crime noir and gothic horror as Batman faces a freezer-killer, an arsonist, Ra's al Ghul's assassins, and the Joker treating murder as performance art -- plus the pivotal debut of Lucius Fox.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509615",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-bc",
    lineId: "batman",
    number: "d",
    era: "bronze",
    title: "Red Skies",
    start: { year: 1985, quarter: 3 },
    end: { year: 1986, quarter: 3 },
    issuesCollected:
      "Batman #388-400, Batman Annual #10, Detective Comics #554-567, and stories from Secret Origins #6",
    yearsCovered: "1985-1986",
    releaseDate: { year: 2025, month: 9 },
    writers: "Doug Moench, Roy Thomas, Harlan Ellison",
    pencillers:
      "Gene Colan, Tom Mandrake, Paul Gulacy, Arthur Adams, Bill Sienkiewicz, Brian Bolland, Denys Cowan, George Pérez, Joe Kubert, John Byrne, Ken Steacy, Klaus Janson, Marshall Rogers, Paris Cullins, Rick Leonardi, Steve Leialoha, Steve Lightle, Tom Sutton",
    inkers:
      "Bob Smith, Tom Mandrake, Paul Gulacy, Ricardo Villagran, Terry Austin, Alfredo Alcala, Bill Sienkiewicz, Brian Bolland, Bruce Patterson, George Pérez, Jan Duursema, Joe Kubert, John Byrne, Karl Kesel, Ken Steacy, Klaus Janson, Larry Mahlstedt, Steve Leialoha",
    description:
      "From Gotham's dark alleys to the literal red skies of Crisis on Infinite Earths -- the debut of Black Mask, Hugo Strange's schemes, and showdowns with Two-Face, Catwoman, and the False Face Society.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502739",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-c1",
    lineId: "batman",
    number: "1",
    era: "post-crisis",
    title: "Year One & Two",
    start: { year: 1986, quarter: 4 },
    end: { year: 1987, quarter: 4 },
    issuesCollected: "Batman 401-412, Annual 11, Detective Comics #568-579",
    yearsCovered: "1986-1987",
    releaseDate: { year: 2024, month: 11 },
    writers:
      "Mike W. Barr, Max Allan Collins, Frank Miller, Barbara Kesel, Joey Cavalieri, Alan Moore",
    pencillers:
      "Alan Davis, David Mazzucchelli, Dave Cockrum, Todd McFarlane, Norm Breyfogle, Carmine Infantino, Chris Warner, Denys Cowan, Dick Sprang, E.R. Cruz, George Freeman, Jim Starlin, Klaus Janson, Ross Andru, Terry Beatty, Trevor von Eeden",
    inkers:
      "Paul Neary, David Mazzucchelli, Alfredo Alcala, Dick Giordano, Don Heck, Mike DeCarlo, Norm Breyfogle, Al Vey, Alan Davis, Dick Sprang, E.R. Cruz, George Freeman, Greg Brooks, Jim Starlin, Klaus Janson, Todd McFarlane, Trevor von Eeden",
    description:
      "Frank Miller and David Mazzucchelli's definitive Year One origin, followed by Mike W. Barr and Alan Davis's Year Two, chronicling Bruce Wayne's earliest days as Batman.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528353",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-c2",
    lineId: "batman",
    number: "2",
    era: "post-crisis",
    title: "The Killing Joke and Other Stories",
    start: { year: 1988, quarter: 1 },
    end: { year: 1988, quarter: 3 },
    issuesCollected: "Batman: The Killing Joke #1; Batman #413-422; Detective Comics #580-589; and Batman: Son of the Demon #1.",
    yearsCovered: "1988",
    releaseDate: { year: 2025, month: 5 },
    writers:
      "Jim Starlin, Alan Grant, John Wagner, Mike W. Barr, Jo Duffy, Alan Moore, Lewis Klahr, Steve Piersall",
    pencillers:
      "Norm Breyfogle, Jim Aparo, Jim Baikie, Brian Bolland, Dean Haspiel, Dick Giordano, Jerry Bingham, Kieron Dwyer, Mark Bright",
    inkers:
      "Mike DeCarlo, Norm Breyfogle, Jerry Bingham, Pablo Marcos, Steve Mitchell, Brian Bolland, Denis Rodier, Joe Rubinstein, Kim DeMulder, Ricardo Villagran",
    description:
      "Alan Moore and Brian Bolland's The Killing Joke, one of the most influential Batman stories ever told, alongside Mike W. Barr and Jerry Bingham's Son of the Demon, which explores Batman's relationship with Talia al Ghul.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501459",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-c3",
    lineId: "batman",
    number: "3",
    era: "post-crisis",
    title: "A Death In The Family",
    start: { year: 1988, quarter: 4 },
    end: { year: 1989, quarter: 1 },
    issuesCollected: "Batman #423-429, Batman Annual #12, Batman: The Cult #1-4, Detective Comics #590-595, Detective Comics Annual #1",
    yearsCovered: "1988-1989",
    releaseDate: { year: 2026, month: 4 },
    writers:
      "Jim Starlin, Alan Grant, John Wagner, Mike Baron, Robert Greenberger, Dennis \"Denny\" O'Neil, Jeff O'Hare",
    pencillers:
      "Norm Breyfogle, Bernie Wrightson, Jim Aparo, Mark Bright, Dave Cockrum, Irv Novick, Klaus Janson, Pablo Marcos, Roderick Delgado, Ross Andru",
    inkers:
      "Mike DeCarlo, Norm Breyfogle, Bernie Wrightson, Steve Mitchell, Denis Rodier, Jerry Acerno, Tony DeZuniga",
    description:
      "In 1988, comics readers were given the chance to decide the outcome of one of the medium's most controversial quandaries: should the Joker kill the Boy Wonder?",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508571",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-c4",
    lineId: "batman",
    number: "4",
    era: "post-crisis",
    title: "Blind Justice",
    start: { year: 1989, quarter: 2 },
    end: { year: 1989, quarter: 3 },
    issuesCollected:
      "Batman #430-435, Batman Annual #13, Detective Comics #596-603, Detective Comics Annual #2, and stories from Secret Origins #36 and #39",
    yearsCovered: "1989",
    releaseDate: { year: 2026, month: 7 },
    writers:
      "Alan Grant, Sam Hamm, Jim Owsley (Christopher Priest), John Byrne, John Wagner, Neil Gaiman, Jim Starlin, Jan Strnad, Kevin Dooley, Mark Waid, Brian Augustyn",
    pencillers:
      "Jim Aparo, Denys Cowan, Norm Breyfogle, Eduardo Barreto, Kevin Nowlan, Malcolm Jones, Mark Buckingham, Michael Bair, Val Semeiks",
    inkers:
      "Mike DeCarlo, Steve Mitchell, Dick Giordano, Frank McLaughlin, Gray Morrow, Kevin Nowlan, Malcolm Jones, Mark Buckingham, Michael Bair",
    description:
      "Bruce Wayne is accused of espionage and faces the loss of his company, reputation, and freedom, as Batman investigates a conspiracy tied to a forgotten chapter of his own past -- and meets the mysterious mentor Henri Ducard.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799513162",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batman-vol-msi8s5r8",
    lineId: "batman",
    number: "5",
    era: "post-crisis",
    title: "A Lonely Place of Dying",
    start: { year: 1989, quarter: 4 },
    end: { year: 1990, quarter: 1 },
    issuesCollected:
      "Arkham Asylum graphic novel, Batman #436-444, Detective Comics #604-609, The New Titans #60-61 and #65, Secret Origins #44, Secret Origins Special #1, and select stories from Batman Villains Secret Files 2005 #1 and Christmas with the Super-Heroes #2.",
    yearsCovered: "1989-1990",
    releaseDate: { year: 2027, month: 4 },
    writers:
      "Marv Wolfman, Alan Grant, George Pérez, Neil Gaiman, Dave Gibbons, Grant Morrison, Mike W. Barr, Mark Verheiden",
    pencillers:
      "Norm Breyfogle, Jim Aparo, Pat Broderick, Tom Grummett, George Pérez, Dave McKean, Gray Morrow, Keith Giffen, Mike Hoffman, Sam Kieth, Bernie Mireault",
    inkers:
      "Steve Mitchell, Mike DeCarlo, John Beatty, Bob McLeod, Al Gordon, Al Vey, Dave McKean, Gray Morrow, Michael Bair, Kevin Nowlan, Sam Kieth, Matt Wagner, Dick Giordano",
    description:
      "A new Robin—Tim Drake—rises as Batman faces one of the darkest chapters of his life in this essential DC Finest collection.\nBatman is at his lowest point.\nIn the aftermath of devastating loss, Bruce Wayne becomes increasingly reckless in his war on crime, pushing away allies and abandoning the balance that once made him Gotham City’s greatest hero.\nBut one young detective sees what no one else can: Batman needs a Robin.\nDetermined to help, Tim Drake sets out on a journey that will change both his life and Batman’s forever. What follows is the story of how a new Robin emerges, bringing hope back to Gotham and laying the foundation for a new era of the Bat-Family.\nCollected alongside key stories from one of the most important periods in Batman history, these adventures capture the return of Robin and the beginning of Tim Drake’s journey as one of DC’s most beloved heroes.",
    coverUrl: batmanLonelyPlaceOfDyingCover,
    ownershipStatus: "announced",
  },
  // --- Batgirl ---
  {
    kind: "volume",
    id: "batgirl-vol-msarqznb",
    lineId: "batgirl",
    number: "a",
    era: "post-crisis",
    title: "Silent Knight",
    start: { year: 1999, quarter: 2 },
    end: { year: 2000, quarter: 3 },
    issuesCollected:
      "Batgirl #1-6; Batgirl Annual #1; Batman: No Man’s Land #0; Batman #567 and #569, Detective Comics #732 and #734; Batman: Legends of the Dark Knight #120; Azrael: Agent of the Bat #56-57 and #60-61; The Batman Chronicles #18; Batman: Gotham Knights #2; and the long-out-of-print crossover series Ghost/Batgirl #1-4.",
    yearsCovered: "1999-2000",
    releaseDate: { year: 2027, month: 1 },
    writers:
      "Scott Peterson, Kelley Puckett, Mike Kennedy, Greg Rucka, Janet Harvey, Jordan B. Gorfinkel",
    pencillers:
      "Damion Scott, Ryan Benjamin, Greg Land, Mike Deodato Jr., Pablo Raimondi, Sergio Cariello",
    inkers:
      "Robert Campanella, Michael Bair, Randy Emberlin, Ryan Benjamin, Drew Geraci, Howard M. Shum, John Stanisci, Matt Ryan, Sal Regla, Walden Wong",
    description:
      "Cassandra Cain’s journey continues, as she expands her role in Gotham and beyond in a powerful story of growth, identity, and action.\nAt age 17, the teenaged assassin Cassandra Cain is literally a fighter like no other. Remorselessly trained by her mercenary father to be the ultimate human weapon, Cassandra cannot speak or write, but her uncanny ability to read body language allows her to take down opponents three times her size without batting an eye.\nBut when she rebels against her programming on the lawless streets of No Man’s Land-era Gotham City, the Dark Knight Detective sees a possible successor to the role of Batgirl. Under the tutelage of the original Batgirl, Barbara Gordon, Cassandra must now reinvent herself as a protector instead of a predator—and prove to both her newfound family and herself that even someone who was born to kill can be worthy to take up the cowl of a legend!\nWitness the origin of one of the DC Universe’s most celebrated heroes in this landmark volume showcasing Cassandra’s first appearances and foundational adventures.",
    coverUrl: batgirlSilentKnightCover,
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "batgirl-ca",
    lineId: "batgirl",
    number: "b",
    era: "post-crisis",
    title: "Nobody Dies Tonight",
    start: { year: 2000, quarter: 4 },
    end: { year: 2002, quarter: 2 },
    issuesCollected: "Batgirl #7-27, Superboy #85, and Supergirl #63",
    yearsCovered: "2000-2002",
    releaseDate: { year: 2025, month: 4 },
    writers: "Kelley Puckett, Chuck Dixon, Jonathan Peterson",
    pencillers: "Damion Scott, Coy Turnbull, Dale Eaglesham, Phil Noto, Vincent Giarrano",
    inkers: "Robert Campanella, Andrew Hennessy, Dan Davis, Jesse Delperdang, John Lowe",
    description:
      "Key early appearances of Cassandra Cain, the daughter of assassins who became a vastly different kind of Batgirl -- facing Lady Shiva in a battle to the death and teaming with Superboy and Supergirl.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501046",
    ownershipStatus: "announced",
  },
  // --- Blue Beetle ---
  {
    kind: "volume",
    id: "blue-beetle-s1",
    lineId: "blue-beetle",
    number: "1",
    era: "silver",
    title: "Blue Beetle Challenges the Red Knight",
    start: { year: 1964, quarter: 3 },
    end: { year: 1981, quarter: 2 },
    issuesCollected: "Captain Atom (1965) #83-86; Blue Beetle (1964) #1-5; Blue Beetle (1965) #1-5, #50-54, Charlton Bullseye #1",
    yearsCovered: "1964-1981",
    releaseDate: { year: 2025, month: 8 },
    writers:
      "Steve Ditko, Joe Gill, D.C. Glanzman, David Kaler, Gary Friedrich, Steve Skeates, Benjamin Smith, Roy Thomas",
    pencillers:
      "Steve Ditko, Bill Fraccio, Bill Molno, Frank McLaughlin, Rocke Mastroserio, Bill Montes, Dan Reed, Oscar Novelle, Tony Tallarico",
    inkers:
      "Tony Tallarico, Steve Ditko, Bill Molno, Rocke Mastroserio, Frank McLaughlin, Vincent Alascia, Albert Val, Bill Black, Bob McLeod, Dan Reed, Jon D'Agostino, Oscar Novelle",
    description:
      "The original Charlton Comics adventures of Ted Kord as Blue Beetle, from his earliest team-ups with Captain Atom through the character's Bronze Age revival.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502487",
    ownershipStatus: "announced",
  },
  // --- Catwoman ---
  {
    kind: "volume",
    id: "catwoman-c1",
    lineId: "catwoman",
    number: "1",
    era: "post-crisis",
    title: "Life Lines",
    start: { year: 1988, quarter: 4 },
    end: { year: 1994, quarter: 2 },
    issuesCollected: "Catwoman (1989) 1-4, Catwoman: Defiant, Catwoman (1993) 1-12, Showcase '93",
    yearsCovered: "1988-1994",
    releaseDate: { year: 2024, month: 12 },
    writers: "Jo Duffy, Doug Moench, Mindy Newell, Chuck Dixon, Peter Milligan",
    pencillers: "Jim Balent, Ed Hannigan, Joe Brozowski, J.J. Birch, Tom Grindberg",
    inkers: "Dick Giordano, Ande Parks, Michael Bair, Fred Fredericks, Ed Hannigan, Rick Burchett",
    description:
      "The early history of Catwoman as a solo protagonist in her own right, from Mindy Newell's 1989 debut miniseries through the first year of Jo Duffy and Jim Balent's ongoing series.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528469",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "catwoman-c2",
    lineId: "catwoman",
    number: "2",
    era: "post-crisis",
    title: "Vengeance and Vindication",
    start: { year: 1994, quarter: 3 },
    end: { year: 1996, quarter: 1 },
    issuesCollected: "Catwoman #0, #13-32; and Catwoman Annual #2-3",
    yearsCovered: "1994-1996",
    releaseDate: { year: 2025, month: 6 },
    writers:
      "Chuck Dixon, Deborah Pomerantz, Doug Moench, Jo Duffy, Alan Grant, Jim Balent, Joan Weis, Jordan B. Gorfinkel",
    pencillers: "Jim Balent, Dick Giordano, Brian Stelfreeze, James Hodgkins, Michal Dutkiewicz",
    inkers: "Bob Smith, James Hodgkins, Dick Giordano, Gerry Fernandez, Jim Balent",
    description:
      "Selina Kyle's ferocious and stylish mid-'90s solo adventures continue under Jo Duffy and then Chuck Dixon, with art by Jim Balent throughout.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501756",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "catwoman-c3",
    lineId: "catwoman",
    number: "3",
    era: "post-crisis",
    title: "Creatures of the Night",
    start: { year: 1996, quarter: 2 },
    end: { year: 1997, quarter: 4 },
    issuesCollected: "Catwoman #33–53; Catwoman Annual #3-4; DC Universe Holiday Bash #1; and Batman Secret Files #1",
    yearsCovered: "1996-1997",
    releaseDate: { year: 2026, month: 12 },
    writers: "Doug Moench, Chuck Dixon, Devin Grayson, Michael Jan Friedman, Scott Beatty",
    pencillers: "Jim Balent, Javier Saltares, Roger Robinson",
    inkers:
      "Bob Smith, John Stanisci, Ray McCarthy, Mark Pennington, Rob Leigh, Bob McLeod, Norm Breyfogle, Robert Campanella, Sal Buscema, Scott Hanna, Stan Woch, Phyllis Novin",
    description:
      "Doug Moench and Chuck Dixon bring sleek noir rhythms and high-velocity Gotham storytelling to Selina Kyle's ongoing series, with art from Jim Balent and Mark Pennington.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509813",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "catwoman-vol-msj8s98t",
    lineId: "catwoman",
    number: "4",
    era: "post-crisis",
    title: "To Catch a Thief",
    start: { year: 1998, quarter: 1 },
    end: { year: 1999, quarter: 3 },
    issuesCollected:
      "Catwoman #54-71, Catwoman/Wildcat #1-4, Catwoman Plus #1, Catwoman #1000000, and a 10-page story from Batman 80-Page Giant #1.",
    yearsCovered: "1998-1999",
    releaseDate: { year: 2027, month: 6 },
    writers: "Devin Grayson, Chuck Dixon, Beau Smith, Jim Balent",
    pencillers: "Jim Balent, Sergio Cariello, Brian Stelfreeze",
    inkers: "John Stanisci, Tom Palmer, Marlo Alquiza, Brian Stelfreeze",
    description:
      "A master thief is pushed to her limits in this pivotal DC Finest collection, as Catwoman faces ever-escalating danger!\nSelina Kyle knows how to steal—but will she be able to stay alive long enough to enjoy her ill-gotten gains?\nAs Catwoman's world expands beyond Gotham, the potential scores grow bigger, and the risks get more personal. From dangerous encounters with some of the city’s most unpredictable figures to high-stakes jobs that take her into dangerously unfamiliar territories, every move will test her hard-earned skills and instincts to their limits.\nBringing together a wide range of stories from one of Catwoman’s greatest eras, this volume blends crime, action, and character-driven storytelling—showcasing Catwoman at her most resourceful, cunning, and complex.",
    coverUrl: catwomanToCatchAThiefCover,
    ownershipStatus: "announced",
  },
  // --- Deadman ---
  {
    kind: "volume",
    id: "deadman-b1",
    lineId: "deadman",
    number: "1",
    era: "bronze",
    title: "How Many Times Can a Guy Die?",
    start: { year: 1967, quarter: 4 },
    end: { year: 1977, quarter: 2 },
    issuesCollected: "Strange Adventures #205–216, Aquaman #50–52, Justice League of America #94, The Brave and the Bold #79, 86, 104, 133, The Phantom Stranger #33, 39–41, World’s Finest #223, 227, The Forever People #9–10, Challengers of the Unknown #74",
    yearsCovered: "1967-1977",
    releaseDate: { year: 2026, month: 5 },
    writers:
      "Neal Adams, Jack Miller, Bob Haney, Arnold Drake, Carmine Infantino, Paul Levitz, Dennis \"Denny\" O'Neil, Robert Kanigher",
    pencillers:
      "Neal Adams, Fred Carrillo, Jim Aparo, Carmine Infantino, George Tuska, John Rosenberger, Mike Grell",
    inkers:
      "Neal Adams, Fred Carrillo, George Roussos, Jim Aparo, George Tuska, John Rosenberger, Mike Grell",
    description:
      "Boston Brand was a circus acrobat until a bullet ended his life and began his mission -- as Deadman, he possesses the living to seek justice for the murdered and the forgotten across the DC Universe.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799507710",
    ownershipStatus: "announced",
  },
  // --- Demon ---
  {
    kind: "volume",
    id: "demon-b1",
    lineId: "demon",
    number: "1",
    era: "bronze",
    title: "Birth of the Demon",
    start: { year: 1972, quarter: 3 },
    end: { year: 1980, quarter: 3 },
    issuesCollected: "The Demon #1–16 (1972–1973); The Brave and the Bold #109, #137; Batman Family (1975) #17; Detective Comics #482-485, Wonder Woman #280-282",
    yearsCovered: "1972-1980",
    releaseDate: { year: 2026, month: 2 },
    writers: "Jack Kirby, Len Wein, Gerry Conway, Bob Haney, Bob Rozakis",
    pencillers: "Jack Kirby, Jose Delbo, Steve Ditko, Michael Golden, Jim Aparo, John Calnan",
    inkers:
      "Mike Royer, Dave Hunt, Steve Ditko, Bob McLeod, Dick Giordano, Jim Aparo, Michael Golden",
    description:
      "Etrigan's explosive Jack Kirby debut through his Bronze Age evolution, exploring the cursed bond between Jason Blood and the demon across centuries of dark magic and betrayal.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799507437",
    ownershipStatus: "announced",
  },
  // --- Doom Patrol ---
  {
    kind: "volume",
    id: "doom-patrol-s1",
    lineId: "doom-patrol",
    number: "1",
    era: "silver",
    title: "The World's Strangest Heroes",
    start: { year: 1963, quarter: 3 },
    end: { year: 1966, quarter: 1 },
    issuesCollected: "The Brave and the Bold #65; Doom Patrol #86-102; Challengers of the Unknown #48; My Greatest Adventure #80-85; Teen Titans #6",
    yearsCovered: "1963-1966",
    releaseDate: { year: 2025, month: 2 },
    writers: "Arnold Drake, Bob Haney, Howard Purcell",
    pencillers: "Bruno Premiani, Robert \"Bob\" Brown, Dick Giordano, Howard Purcell",
    inkers: "Bruno Premiani, Robert \"Bob\" Brown, Howard Purcell, Sal Trapani",
    description:
      "The earliest appearances of the unconventional super-team, starting with their 1963 debut -- Robotman, Negative Man, and Elasti-Girl banding together as the world's strangest heroes.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799500353",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "doom-patrol-s2",
    lineId: "doom-patrol",
    number: "2",
    era: "silver",
    title: "The Death of the Doom Patrol!",
    start: { year: 1966, quarter: 2 },
    end: { year: 1979, quarter: 1 },
    issuesCollected: "Showcase #94-96, Superman Family #191-193, and Doom Patrol #103-121",
    yearsCovered: "1966-1979",
    releaseDate: { year: 2026, month: 1 },
    writers: "Arnold Drake, Gerry Conway, Paul Kupperberg, Scott Edelman",
    pencillers: "Bruno Premiani, Arvell Jones, Joe Staton",
    inkers: "Bruno Premiani, Romeo Tanghal, Bruce Patterson, Frank Chiaramonte, Joe Staton",
    description:
      "The conclusion of the Doom Patrol's original saga -- the team faces its deadliest enemies yet, including General Immortus and the Brotherhood of Evil, with only self-sacrifice left to save the world.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799506690",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "doom-patrol-ca",
    lineId: "doom-patrol",
    number: "a",
    era: "post-crisis",
    title: "The End Sanctifies the Means",
    start: { year: 1993, quarter: 2 },
    end: { year: 1995, quarter: 1 },
    issuesCollected: "Doom Patrol #64–87; Vertigo Jam #1; and Doom Patrol Annual #2",
    yearsCovered: "1993-1995",
    releaseDate: { year: 2026, month: 10 },
    writers: "Rachel Pollack",
    pencillers:
      "Ted McKeever, Linda Medley, Richard Case, Arnold Pander, Eric Shanower, Jamie Tolagson, Mark Wheatley, Scot Eaton",
    inkers:
      "Ted McKeever, Tom Sutton, Graham Higgins, Stan Woch, Arnold Pander, Eric Shanower, Gene Fama, Mark Wheatley, Matt Howarth",
    description:
      "Rachel Pollack's complete, boundary-pushing Vertigo run -- a fractured epic of shape-shifting magicians, sex ghosts, pirate robot brains, and a war over the very idea of identity itself.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509318",
    ownershipStatus: "announced",
  },
  // --- Events ---
  {
    kind: "volume",
    id: "events-b1",
    lineId: "events",
    number: "1",
    era: "bronze",
    title: "Crisis on Infinite Earths Part One",
    start: { year: 1985, quarter: 4 },
    end: { year: 1985, quarter: 4 },
    issuesCollected: "Swamp Thing #39; Batman #389-391; Detective Comics #555-558; Justice League of America #244; Green Lantern #194; Wonder Woman #327; DC Comics Presents #78; Infinity, Inc. #18-19; The Fury of Firestorm #41; All-Star Squadron #50-52; Crisis on Infinite Earths #1-4; The Losers Special #1",
    yearsCovered: "1985",
    releaseDate: { year: 2025, month: 10 },
    writers:
      "Doug Moench, Roy Thomas, Marv Wolfman, Dann Thomas, Robert Greenberger, Len Wein, Gerry Conway, Steve Englehart, Alan Moore, Robert Kanigher, Mindy Newell, Gardner Fox, Sheldon Moldoff",
    pencillers:
      "George Pérez, Gene Colan, Arvell Jones, Tom Mandrake, Mike Clark, Todd McFarlane, Joe Staton, Curt Swan, Rafael Kayanan, Steve Bissette, Judith Hunt, Sam Glanzman, Don Heck, Joe Kubert, Al Dellinges",
    inkers:
      "Bob Smith, Dick Giordano, Tom Mandrake, Vince Colletta, Mike DeCarlo, Dave Hunt, Tony DeZuniga, Alfredo Alcala, Ian Akin, Brian Garvey, Pablo Marcos, Bruce Patterson, Steve Montano, Mike Machlan, John Totleben, Mike Esposito, Don Heck, Al Dellinges",
    description:
      "The ultimate battle for the multiverse begins as Marv Wolfman and George Perez unite Wonder Woman, Superman, Green Lantern, and the Justice Society against a cosmic threat that erases entire universes.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799503040",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "events-b2",
    lineId: "events",
    number: "2",
    era: "bronze",
    title: "Crisis on Infinite Earths Part Two",
    start: { year: 1986, quarter: 1 },
    end: { year: 1986, quarter: 1 },
    issuesCollected: "DC Comics Presents #86 and #95, Infinity, Inc. #20-22, Infinity, Inc. Annual #1, The New Teen Titans #13-14, Swamp Thing #44-46, Wonder Woman #328-329, Legends of the DC Universe: Crisis on Infinite Earths #1, Crisis on Infinite Earths #5, All-Star Squadron #53-56, and Superman #413",
    yearsCovered: "1986",
    releaseDate: { year: 2026, month: 8 },
    writers:
      "Roy Thomas, Dann Thomas, Marv Wolfman, Alan Moore, Gardner Fox, Paul Kupperberg, Tony Isabella, Alan Gold, Mindy Newell, Gerry Conway, Cary Bates",
    pencillers:
      "Todd McFarlane, Mike Clark, Arvell Jones, Eduardo Barreto, Steve Bissette, Don Heck, Mike Harris, Rick Hoberg, Richard Howell, Michael Bair, Ron Harris, Ron Randall, Stan Woch, Pablo Marcos, Paul Ryan, George Pérez, Jerry Acerno, Tim Burgard, Curt Swan",
    inkers:
      "Tony DeZuniga, Vince Colletta, Alfredo Alcala, Steve Montano, Romeo Tanghal, John Totleben, Don Heck, Dave Hunt, Murphy Anderson, Dick Giordano, Richard Howell, Pablo Marcos, Bob McLeod, Jerry Ordway, Jerry Acerno, Tim Burgard, Al Williamson",
    description:
      "As the multiverse begins to die, every hero's story becomes part of the battle for existence -- the crossover spreads far beyond its core series, reshaping destinies and ending eras across the Bronze Age DC Universe.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510284",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "events-b3",
    lineId: "events",
    number: "3",
    era: "bronze",
    title: "Crisis on Infinite Earths Part Three",
    start: { year: 1986, quarter: 2 },
    end: { year: 1986, quarter: 2 },
    issuesCollected: "Justice League of America #245; Superman #414–415; Green Lantern #195–196; DC Comics Presents #87–88; Legion of Super-Heroes #16, #18; Infinity, Inc. #23-24; Justice League of America Annual #3; Crisis on Infinite Earths #6–9; The Vigilante #22; The Omega Men #31; and Blue Devil #17–18.",
    yearsCovered: "1986",
    releaseDate: { year: 2026, month: 11 },
    writers:
      "Marv Wolfman, Elliot S. Maggin, Steve Englehart, Dan Mishkin, Paul Levitz, Dann Thomas, Roy Thomas, Gary Cohn, Gerry Conway, Cary Bates, Paul Kupperberg, Todd Klein",
    pencillers:
      "Curt Swan, George Pérez, Joe Staton, Todd McFarlane, Alan Kupperberg, Luke McDonnell, Keith Giffen, Steve Lightle, Greg LaRocque, Ron Harris, Rick Hoberg, Tod Smith, Ernie Colon, Shawn McManus",
    inkers:
      "Al Williamson, Jerry Ordway, Mike Machlan, Bruce Patterson, Tony DeZuniga, Dick Giordano, Karl Kesel, Bob Smith, Larry Mahlstedt, Steve Montano, Leonard Starr, Mike Gustovich, Steve Mitchell, Bill Collins, Shawn McManus, Mark Farmer, Rick Magyar",
    description:
      "The DC Multiverse reaches its breaking point as heroes, legacies, and entire worlds are pushed past their limits -- hope falters and the fate of every universe hangs on choices no hero is ready to face.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510314",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "events-vol-msi8v3ff",
    lineId: "events",
    number: "4",
    era: "bronze",
    title: "Crisis on Infinite Earths Part Four",
    start: { year: 1986, quarter: 3 },
    end: { year: 1986, quarter: 3 },
    issuesCollected:
      "Crisis on Infinite Earths #10-12; All-Star Squadron #57-60; Amethyst: Princess of Gemworld #13; Blue Devil #19; Christmas with the Super-Heroes #2; DC Comics Presents #94; Green Lantern #197-198; History of the DC Universe #1-2; Infinity, Inc. #25; JLA: Incarnations #5; Secret Origins Annual #2; Starman Annual #1; The Fury of Firestorm #42; The Omega Men #33; and Who’s Who: The Definitive Directory of the DC Universe #10 and #16-18.",
    yearsCovered: "1986",
    releaseDate: { year: 2027, month: 2 },
    writers:
      "Roy Thomas, Marv Wolfman, Dan Mishkin, Gary Cohn, Dann Thomas, John Ostrander, Gardner Fox, Robert Loren Fleming, Alan Kupperberg, Steve Englehart, James Robinson, George Pérez, Keith Giffen, Alan Brennert, Robert Greenberger, Barbara Randall, William Messner-Loebs, Gerry Conway, Todd Klein",
    pencillers:
      "George Pérez, Alan Kupperberg, Arvell Jones, Mike Clark, Joe Staton, Jerry Ordway, Richard Howell, Rick Hoberg, Ron Harris, Ernie Colon, Dick Giordano, Tom Mandrake, Todd McFarlane, Val Semeiks, Norm Breyfogle, Eric Battle, Mike Collins, Carmine Infantino, Craig Hamilton, Bret Blevins, J.H. Williams III, Rafael Kayanan, Shawn McManus",
    inkers:
      "Vince Colletta, Jerry Ordway, Tony DeZuniga, Karl Kesel, Rick Magyar, Gary Martin, George Pérez, Bruce Patterson, Alfredo Alcala, Richard Howell, Rick Hoberg, Jerry Acerno, Mike Gustovich, Dick Giordano, Don Heck, Prentis Rollins, Kevin Conrad, Joe Rubinstein, Keith Champagne, Frank McLaughlin, Murphy Anderson, Ray Snyder, Bret Blevins, Mick Gray, Ian Akin, Shawn McManus",
    description:
      "Reality itself is rewritten as the Crisis reaches its epic conclusion in the final chapter of the Multiverse-shattering event.\nEverything ends here.\nAs the Crisis reaches its apocalyptic climax, the battle to save existence itself comes to a breaking point. Heroes from across worlds face impossible odds as reality collapses, and the fate of the entire Multiverse hangs in the balance.\nIn the midst of cosmic destruction, alliances are tested, sacrifices are made, and the universe is forever changed. When the dust settles, nothing will be the same—and the world that remains will reshape the future of every hero.\nBringing together the concluding chapters of Crisis on Infinite Earths alongside key tie-in stories, this volume captures the final transformation of the DC Universe in one sweeping, interconnected collection.",
    coverUrl: eventsCrisisPartFourCover,
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "events-c1",
    lineId: "events",
    number: "1",
    era: "post-crisis",
    title: "Legends Part One",
    start: { year: 1986, quarter: 4 },
    end: { year: 1986, quarter: 4 },
    issuesCollected: "Legends #1–3; Infinity Inc. #34-36; Hawkman #5-6; Secret Origins #10, Crisis on Infinite Earths #12, Batman #401; Detective Comics #568; Justice League of America #258; Green Lantern Corps #207-208; The Fury of Firestorm #55–56; Blue Beetle #9; Cosmic Boy #1–2; Booster Gold #13",
    yearsCovered: "1986",
    releaseDate: { year: 2026, month: 11 },
    writers:
      "John Ostrander, Len Wein, Dann Thomas, Roy Thomas, Paul Levitz, Tony Isabella, Steve Englehart, Mike W. Barr, Dan Mishkin, Alan Moore, George Pérez, Marv Wolfman, Barbara Kesel, Joey Cavalieri, J.M. DeMatteis, Dan Jurgens",
    pencillers:
      "John Byrne, Todd McFarlane, Richard Howell, Joe Staton, Joe Brozowski, Keith Giffen, Jim Aparo, José Luis García-López, Ernie Colon, Joe Orlando, George Pérez, Jerry Ordway, Trevor von Eeden, Klaus Janson, Luke McDonnell, Paris Cullins, Dan Jurgens",
    inkers:
      "Karl Kesel, Tony DeZuniga, Bob Smith, Don Heck, Mark Farmer, Steve Mitchell, Ernie Colon, Jim Aparo, José Luis García-López, Pablo Marcos, Joe Orlando, George Pérez, Jerry Ordway, Trevor von Eeden, Klaus Janson, Dell Barras, Gary Martin",
    description:
      "DC's first major post-Crisis crossover -- Darkseid doesn't just attack cities, he attacks faith in Superman, Batman, and every costumed legend on Earth.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509622",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "events-ca",
    lineId: "events",
    number: "a",
    era: "post-crisis",
    title: "Zero Hour: Crisis in Time Part One",
    start: { year: 1994, quarter: 1 },
    end: { year: 1994, quarter: 2 },
    issuesCollected: "Superman #93, The Flash #94, L.E.G.I.O.N. #70, Green Lantern #55, Superman: The Man of Steel #37, Team Titans #24, The Darkstars #24, Valor #23, Batman #511, Batman: Shadow of the Bat #31, Detective Comics #678, Legionnaires #18, Hawkman #13, Showcase '94 #8-9, Steel #8, Superboy #8, Outsiders #11, and Zero Hour: Crisis in Time #3-4",
    yearsCovered: "1994",
    releaseDate: { year: 2024, month: 12 },
    writers:
      "Dan Jurgens, Louise Simonson, Mark Waid, Chuck Dixon, Doug Moench, Ron Marz, Michael Jan Friedman, Tom McCraw, Kurt Busiek, Karl Kesel, William Messner-Loebs, Alan Grant, Tom Peyer, Jeff Jensen, Phil Jimenez, Mike W. Barr",
    pencillers:
      "Dan Jurgens, Derec Aucoin, Frank Fosco, Graham Nolan, Chris Batista, Carlos Pacheco, Mike Manley, Jon Bogdanove, Craig Hamilton, Darryl Banks, Mike Collins, Chris Gardner, Colleen Doran, Tom Grummett, Steve Lieber, Bret Blevins, Arnie Jorgensen, Nigel Tully, Paul Pelletier",
    inkers:
      "Ken Branch, Andrew Pepoy, Jerry Ordway, Joe Rubinstein, Dan Davis, Bob McLeod, Rich Faber, José Marzan Jr., Wayne Faucher, Dennis Janke, Craig Hamilton, Romeo Tanghal, Dennis Cramer, Dave Cooper, Doug Hazlewood, Curt Shoultz, Bret Blevins, Jim Pascoe, Russ Sever, Robert Campanella",
    description:
      "The first half of the time-bending Zero Hour event, as a mysterious figure unravels DC history itself and heroes across the universe race against the collapse of time.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528506",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "events-cb",
    lineId: "events",
    number: "b",
    era: "post-crisis",
    title: "Zero Hour: Crisis in Time Part Two",
    start: { year: 1994, quarter: 3 },
    end: { year: 1994, quarter: 4 },
    issuesCollected: "The Flash #0; Green Arrow #90; Adventures of Superman #516; Justice League America #92; Action Comics #703; Justice League International #68; Legion of Super-Heroes #61; Green Lantern #0; Superman: The Man of Steel #0; Guy Gardner: Warrior #24; Justice League Task Force #16; Catwoman #14; Robin #10; Showcase '94 #10; Damage #0, #6; Zero Hour: Crisis in Time #0-2; Anima #7",
    yearsCovered: "1994",
    releaseDate: { year: 2025, month: 5 },
    writers:
      "Dan Jurgens, Christopher Priest, Mark Waid, Tom Joyner, Karl Kesel, David Michelinie, Kevin Dooley, Beau Smith, Tom McCraw, Chuck Dixon, Jo Duffy, Elizabeth Hand, Paul Witcover, Mike McAvennie, Ron Marz, Louise Simonson",
    pencillers:
      "Dan Jurgens, Jackson Guice, Phil Jimenez, Bill Marimon, Peter Krause, Eduardo Barreto, Mitch Byrd, Howard Porter, Mike Parobeck, Stuart Immonen, Luke Ross, Greg LaRocque, Tom Grummett, Jim Balent, Brent Anderson, Jason Armstrong, Darryl Banks, Mike Wieringo, Jon Bogdanove",
    inkers:
      "Jerry Ordway, José Marzan Jr., Don Hillsman, Jackson Guice, Denis Rodier, Eduardo Barreto, Dan Davis, Ron Boyd, Matt Banning, Dennis Cramer, Wayne Faucher, Rich Rankin, John Stokes, Ray Kryssing, Bob Smith, Will Blyberg, Stan Woch, Romeo Tanghal, Dennis Janke",
    description:
      "Zero Hour concludes with major status quo changes across the DC Universe, including a legendary Green Lantern's fall, told through a wave of zero-issue tie-ins.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501305",
    ownershipStatus: "announced",
  },
  // --- Flash ---
  {
    kind: "volume",
    id: "flash-s1",
    lineId: "flash",
    number: "1",
    era: "silver",
    title: "The Human Thunderbolt",
    start: { year: 1956, quarter: 4 },
    end: { year: 1961, quarter: 3 },
    issuesCollected: "Showcase #4, 8, 13, 14; The Flash #105-123",
    yearsCovered: "1956-1961",
    releaseDate: { year: 2024, month: 11 },
    writers: "John Broome, Robert Kanigher, Gardner Fox",
    pencillers: "Carmine Infantino",
    inkers: "Joe Giella, Murphy Anderson, Frank Giacoia, Joe Kubert",
    description:
      "Barry Allen's Silver Age debut in Showcase #4 kicks off the adventures of the second Flash, introducing rogues Captain Cold, Mirror Master, and Gorilla Grodd along the way.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528360",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "flash-b1",
    lineId: "flash",
    number: "1",
    era: "bronze",
    title: "The Fastest Man Dead",
    start: { year: 1970, quarter: 4 },
    end: { year: 1974, quarter: 3 },
    issuesCollected: "World’s Finest Comics #198, The Flash #200–204, 206–212, 214–229, and The Brave and the Bold #99.",
    yearsCovered: "1970-1974",
    releaseDate: { year: 2026, month: 3 },
    writers:
      "Cary Bates, Dennis \"Denny\" O'Neil, Robert Kanigher, Steve Skeates, Len Wein, Bob Haney, Gardner Fox, Mike Friedrich",
    pencillers:
      "Irv Novick, Dick Dillin, Dick Giordano, Neal Adams, Carmine Infantino, Robert \"Bob\" Brown, Murphy Anderson",
    inkers:
      "Dick Giordano, Murphy Anderson, Frank McLaughlin, Joe Giella, Bernard Sachs, Frank Giacoia, Neal Adams, Nick Cardy, Tex Blaisdell",
    description:
      "Barry Allen races through cultists, cursed rings, alternate realities, and psychic breakdowns as the Flash's Bronze Age world expands into sci-fi weirdness and social turmoil.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799503026",
    ownershipStatus: "announced",
  },
  // --- The Fourth World ---
  {
    kind: "volume",
    id: "the-fourth-world-b1",
    lineId: "the-fourth-world",
    number: "1",
    era: "bronze",
    title: "When the Old Gods Die",
    start: { year: 1970, quarter: 4 },
    end: { year: 1971, quarter: 3 },
    issuesCollected: "Mister Miracle #1–4, The Forever People #1–5, The New Gods #1–4, Superman’s Pal Jimmy Olsen #133–141, and Superman’s Girl Friend Lois Lane #115",
    yearsCovered: "1970-1971",
    releaseDate: { year: 2026, month: 6 },
    writers: "Jack Kirby, Robert Kanigher",
    pencillers: "Jack Kirby, Al Plastino, Dick Giordano, Werner Roth",
    inkers: "Vince Colletta, Murphy Anderson, Dick Giordano",
    description:
      "Jack Kirby's cosmic saga launches, pitting the New Gods of New Genesis against the dark forces of Apokolips -- the rise of Mister Miracle, Orion, and Darkseid.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508311",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "the-fourth-world-vol-msj6j8mh",
    lineId: "the-fourth-world",
    number: "2",
    era: "bronze",
    title: "The Storm of Battle",
    start: { year: 1971, quarter: 4 },
    end: { year: 1972, quarter: 2 },
    issuesCollected:
      "Superman #244; The New Gods #4-8; The Forever People #5-8; Mister Miracle #5-8; Superman's Pal Jimmy Olsen #144-148, and Superman's Girl Friend Lois Lane #116-119",
    yearsCovered: "1971-1972",
    releaseDate: { year: 2027, month: 6 },
    writers: "Jack Kirby, Robert Kanigher, Dennis \"Denny\" O'Neil",
    pencillers: "Jack Kirby, Werner Roth, Rich Buckler, Curt Swan, Dick Giordano, Jeff Jones",
    inkers: "Mike Royer, Vince Colletta, Dick Giordano, Murphy Anderson, Jack Kirby",
    description:
      "Gods, heroes, and worlds all collide in this sweeping cosmic saga featuring an expansive collection of interconnected stories from legendary comics master Jack Kirby.\nA war is spreading—one that reaches across worlds, ideologies, and the fate of entire civilizations.\nAs powerful forces prepare for conflict, heroes are drawn into a growing struggle where survival depends on strength, strategy, and belief. Across multiple storylines, each battle reveals a larger threat, pulling together characters and stories into an expanding, high-stakes confrontation.\nFrom cosmic-scale battles to personal struggles, Jack Kirby's epic tales combine to form a sweeping narrative about power, control, and the fight for freedom—where every decision shapes the outcome of a larger war.\nCollecting interconnected stories from across several series, this volume delivers a wide-ranging, immersive reading experience that brings together action, science fiction, and mythic storytelling.",
    // PLACEHOLDER cover -- see the import comment above. TODO: confirm/replace.
    coverUrl: theFourthWorldStormOfBattleCover,
    ownershipStatus: "announced",
  },
  // --- Green Arrow ---
  {
    kind: "volume",
    id: "green-arrow-c1",
    lineId: "green-arrow",
    number: "1",
    era: "post-crisis",
    title: "The Longbow Hunters",
    start: { year: 1987, quarter: 3 },
    end: { year: 1988, quarter: 3 },
    issuesCollected: "Detective Comics Annual #1, Green Arrow #1-8, Green Arrow Annual #1, The Question #17-18, The Question Annual #1, Green Arrow: The Longbow Hunters #1-3",
    yearsCovered: "1987-1988",
    releaseDate: { year: 2025, month: 1 },
    writers: "Mike Grell, Dennis \"Denny\" O'Neil, Sharon Wright",
    pencillers:
      "Ed Hannigan, Lurene Haines, Mike Grell, Denys Cowan, Eduardo Barreto, Paris Cullins, Randy DuBurke, Tom Artis",
    inkers:
      "Dick Giordano, Mike Grell, Lurene Haines, Rick Magyar, Arne Starr, Frank McLaughlin, Gary Martin, Tim Dzon",
    description:
      "Mike Grell's acclaimed Longbow Hunters reinvents Oliver Queen as a street-level, no-trick-arrows hero -- grittier, more grounded, and paired with a reintroduced Black Canary.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779529916",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "green-arrow-c2",
    lineId: "green-arrow",
    number: "2",
    era: "post-crisis",
    title: "The Trial of Oliver Queen",
    start: { year: 1988, quarter: 4 },
    end: { year: 1989, quarter: 3 },
    issuesCollected: "Green Arrow #9–20, Green Arrow Annual #2, The Question Annual #2, Secret Origins #38, and key Black Canary material from Action Comics #609–616 and #624–635",
    yearsCovered: "1988-1989",
    releaseDate: { year: 2026, month: 2 },
    writers: "Mike Grell, Sharon Wright, Dennis \"Denny\" O'Neil, Sarah Byam, Mark Verheiden",
    pencillers:
      "Ed Hannigan, Randy DuBurke, Eduardo Barreto, Dan Jurgens, Bill Wray, Dick Giordano, Hannibal King",
    inkers:
      "Dick Giordano, Pablo Marcos, John Nyberg, Frank McLaughlin, Arne Starr, Bill Wray, Joe Rubinstein",
    description:
      "Justice has a price. After the Longbow Hunters, Oliver Queen faces black ops conspiracies, Yakuza assassins, devastating personal losses, and one fatal mistake that could destroy everything.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510246",
    ownershipStatus: "announced",
  },
  // --- Green Lantern ---
  {
    kind: "volume",
    id: "green-lantern-s2",
    lineId: "green-lantern",
    number: "2",
    era: "silver",
    title: "The Defeat of Green Lantern",
    start: { year: 1963, quarter: 2 },
    end: { year: 1965, quarter: 3 },
    issuesCollected: "Green Lantern 19-39, Flash 143, Brave & The Bold 59",
    yearsCovered: "1963-1965",
    releaseDate: { year: 2024, month: 12 },
    writers: "Gardner Fox, John Broome, Bob Haney",
    pencillers: "Gil Kane, Carmine Infantino, Ramona Fradon",
    inkers: "Sid Greene, Joe Giella, Murphy Anderson, Frank Giacoia, Charles Paris",
    description:
      "Hal Jordan faces Star Sapphire, Doctor Light, the Time Commander, and his archenemy Sinestro in these classic Silver Age tales from John Broome and Gil Kane.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528483",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "green-lantern-s3",
    lineId: "green-lantern",
    number: "3",
    era: "silver",
    title: "Earth's Other Green Lantern",
    start: { year: 1965, quarter: 4 },
    end: { year: 1968, quarter: 2 },
    issuesCollected: "The Flash #168; Green Lantern #40-61; The Brave and the Bold #69",
    yearsCovered: "1965-1968",
    releaseDate: { year: 2025, month: 11 },
    writers: "John Broome, Gardner Fox, Bob Haney, Mike Friedrich",
    pencillers: "Gil Kane, Carmine Infantino, Win Mortimer",
    inkers: "Sid Greene, Gil Kane, Win Mortimer",
    description:
      "Multiverse-spanning adventures from the origins of the Guardians of the Universe through battles with Sinestro and Major Disaster -- and the first appearance of Guy Gardner as another wielder of the Emerald Ring.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799503262",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "green-lantern-b1",
    lineId: "green-lantern",
    number: "1",
    era: "bronze",
    title: "Hard Traveling Heroes",
    start: { year: 1968, quarter: 3 },
    end: { year: 1971, quarter: 1 },
    issuesCollected: "Green Lantern #62–82, The Flash #191, and World’s Finest Comics #201",
    yearsCovered: "1968-1971",
    releaseDate: { year: 2026, month: 7 },
    writers: "Dennis \"Denny\" O'Neil, John Broome, Gardner Fox, Mike Friedrich",
    pencillers:
      "Gil Kane, Neal Adams, Dick Dillin, Mike Sekowsky, Jack Sparling, Ross Andru, Sid Greene",
    inkers:
      "Joe Giella, Dick Giordano, Frank Giacoia, Murphy Anderson, Sid Greene, Bernie Wrightson, Dan Adkins, Mike Esposito, Mike Peppe, Vince Colletta, Wally Wood",
    description:
      "Green Lantern and Green Arrow hit the road across America, confronting racism, poverty, and corruption in Dennis O'Neil and Neal Adams's landmark socially conscious run.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510277",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "green-lantern-c1",
    lineId: "green-lantern",
    number: "1",
    era: "post-crisis",
    title: "Setting Up Shop",
    start: { year: 1986, quarter: 3 },
    end: { year: 1987, quarter: 4 },
    issuesCollected: "Secret Origins #7; Action Comics #589; Green Lantern #201–205; Tales of the Green Lantern Corps Annual #2; Green Lantern Corps #206–219; and Green Lantern Annual #3.",
    yearsCovered: "1986-1987",
    releaseDate: { year: 2026, month: 9 },
    writers:
      "Steve Englehart, Alan Moore, John Byrne, Roy Thomas, Michael Carlin, Kurt Busiek, Richard Bruning, Joey Cavalieri, Mindy Newell, Paul Kupperberg",
    pencillers:
      "Joe Staton, Ian Gibson, Bill Willingham, Ernie Colon, John Byrne, Michael Bair, George Freeman, Kevin O'Neill, Trevor von Eeden, Paris Cullins, José Luis García-López, Kevin Nowlan, Greg Brooks",
    inkers:
      "Mark Farmer, Dick Giordano, Robert Campanella, Rodin Rodriguez, Steve Montano, George Freeman, Joe Rubinstein, Kevin O'Neill, Trevor von Eeden, Terry Austin, P. Craig Russell, Kevin Nowlan, Bruce Patterson, Kurt Schaffenberger",
    description:
      "The Corps becomes a true ensemble: Hal Jordan reconnects with Earth, Guy Gardner seizes the spotlight, John Stewart and Katma Tui navigate love and duty, and the team confronts villains old and new.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510291",
    ownershipStatus: "announced",
  },
  // --- Harley Quinn ---
  {
    kind: "volume",
    id: "harley-quinn-c1",
    lineId: "harley-quinn",
    number: "1",
    era: "post-crisis",
    title: "Birth of the Mirth",
    start: { year: 1993, quarter: 4 },
    end: { year: 2001, quarter: 2 },
    issuesCollected: "Action Comics #765; Batman: Legends of the Dark Knight #126; The Batman Adventures #12; Azrael: Agent of the Bat #60; Batman #570, #573-574; Batman: Shadow of the Bat #93; Detective Comics #737, #740-741; Catwoman #82-84, #89; The Batman Adventures: Mad Love #1; The Batgirl Adventures #1; Batman: Harley Quinn #1; Batman: Gotham Knights #14; Harley Quinn #1-8",
    yearsCovered: "1993-2001",
    releaseDate: { year: 2025, month: 2 },
    writers: "Karl Kesel, Paul Dini, Bronwyn Carlton, Kelley Puckett",
    pencillers:
      "Terry Dodson, Craig Rousseau, Mike Deodato Jr., Pete Woods, Rick Burchett, Ronnie Del Carmen, Staz Johnson, Tom Morgan, Yvel Guichet, Mike Parobeck",
    inkers:
      "Rachel Dodson, David Roach, Mark Lipka, Rick Burchett, Ronnie Del Carmen, Wayne Faucher, Aaron Sowd",
    description:
      "Harley's earliest comics adventures, from her Batman: The Animated Series debut into mainline DC continuity, including the Eisner Award-winning Mad Love and the first eight issues of her own ongoing series.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799500483",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "harley-quinn-c2",
    lineId: "harley-quinn",
    number: "2",
    era: "post-crisis",
    title: "The Ballad of Harley Quinn",
    start: { year: 2001, quarter: 3 },
    end: { year: 2002, quarter: 4 },
    issuesCollected: "Harley Quinn #9-25, Harley Quinn: Our Worlds at War, Harley and Ivy: Love on the Lam, and Gotham Girls #1-5",
    yearsCovered: "2001-2002",
    releaseDate: { year: 2026, month: 9 },
    writers: "Karl Kesel, Paul Storrie",
    pencillers:
      "Terry Dodson, Jennifer Graves, Craig Rousseau, Brandon Badeaux, Pete Woods, Phil Noto, Rick Burchett",
    inkers: "Rachel Dodson, Dan Davis, J. Bone, Mark Lipka, Phil Noto, Rodney Ramos",
    description:
      "Harley's journey from the Joker's wayward henchgirl to chaotic, complicated leading lady, as Karl Kesel and Terry and Rachel Dodson take over her first solo series.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509127",
    ownershipStatus: "announced",
  },
  // --- Hawkman ---
  {
    kind: "volume",
    id: "hawkman-s1",
    lineId: "hawkman",
    number: "1",
    era: "silver",
    title: "Wings Across Time",
    start: { year: 1961, quarter: 2 },
    end: { year: 1966, quarter: 3 },
    issuesCollected: "The Brave and the Bold #34-36, #42-44; Mystery in Space #87-90; The Atom #7; Hawkman #1-16",
    yearsCovered: "1961-1966",
    releaseDate: { year: 2025, month: 8 },
    writers: "Gardner Fox",
    pencillers: "Murphy Anderson, Joe Kubert, Carmine Infantino",
    inkers: "Murphy Anderson, Joe Kubert",
    description:
      "Hawkman and Hawkgirl's earliest adventures as Thanagarian warriors protecting Earth, including Zatanna's first story, battles with flying gorillas, and team-ups with the Atom.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502500",
    ownershipStatus: "announced",
  },
  // --- Horror ---
  {
    kind: "volume",
    id: "horror-ba",
    lineId: "horror",
    number: "a",
    era: "bronze",
    title: "The Devil's Doorway",
    start: { year: 1969, quarter: 4 },
    end: { year: 1970, quarter: 2 },
    issuesCollected: "House of Secrets #81-85, House of Mystery #180-185, The Phantom Stranger #5, The Witching Hour #3-7, and The Unexpected #113-117",
    yearsCovered: "1969-1970",
    releaseDate: { year: 2025, month: 9 },
    writers:
      "Gerry Conway, Marv Wolfman, Dave Wood, Steve Skeates, Robert Kanigher, Len Wein, Carl Wessler, George Kashdan, Jack Oleck, Mike Friedrich, Alan Riefe, Murray Boltinoff, D.J. Arneson, E. Nelson Bridwell, Gil Kane, Jerry Grandenetti, Joe Gill, John Costanza, Otto Binder",
    pencillers:
      "Jack Sparling, Bernie Wrightson, Jerry Grandenetti, Alex Toth, Bill Draut, Gil Kane, Pat Boyette, Art Saaf, Curt Swan, Sid Greene, Dick Dillin, Ed Robbins, Jose Delbo, Wayne Howard, Werner Roth, Al Williamson, Bruno Premiani, Dick Giordano, Don Heck, George Roussos, George Tuska, Jack Abel, John Celardo, John Costanza, Mike Roy, Mike Sekowsky, Ralph Reese, Stanley Pitt",
    inkers:
      "Bernie Wrightson, Bill Draut, Jack Sparling, Alex Toth, Pat Boyette, Vince Colletta, Wally Wood, Dick Giordano, George Roussos, Jack Abel, Jerry Grandenetti, Sid Greene, Art Saaf, Frank Giacoia, Jose Delbo, Mike Peppe, Neal Adams, Wayne Howard, Al Williamson, Bruno Premiani, Don Heck, Ed Robbins, George Tuska, John Costanza, Mike Esposito, Murphy Anderson, Nick Cardy, Ralph Reese",
    description:
      "Bone-chilling horror anthology tales from House of Secrets, House of Mystery, The Witching Hour, The Phantom Stranger, and The Unexpected, drawn by masters of the genre including Bernie Wrightson and Alex Toth.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502807",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "horror-bb",
    lineId: "horror",
    number: "b",
    era: "bronze",
    title: "Where Dead Men Walk",
    start: { year: 1970, quarter: 3 },
    end: { year: 1971, quarter: 1 },
    issuesCollected: "House of Secrets #86–90; House of Mystery #186–190; The Phantom Stranger #7; The Witching Hour #8–12; and The Unexpected #118–123",
    yearsCovered: "1970-1971",
    releaseDate: { year: 2026, month: 10 },
    writers:
      "Carl Wessler, George Kashdan, Gerry Conway, Murray Boltinoff, Robert Kanigher, Steve Skeates, Jack Oleck, Marv Wolfman, Sergio Aragonés, Alex Toth, Dave Wood, Jack Miller, Len Wein, Mike Friedrich, Neal Adams, Nick Cardy, Raymond Marais",
    pencillers:
      "George Tuska, Jerry Grandenetti, Alex Toth, Bernie Wrightson, Dick Dillin, Gray Morrow, Bill Draut, John Calnan, Neal Adams, Rich Buckler, Ross Andru, Robert \"Bob\" Brown, Don Heck, Gil Kane, Jack Sparling, Jim Aparo, John Celardo, Murphy Anderson, Nick Cardy, Ric Estrada, Sid Greene, Tom Sutton, Tony DeZuniga, Wayne Howard, Werner Roth, Win Mortimer",
    inkers:
      "George Tuska, Alex Toth, Jerry Grandenetti, Bernie Wrightson, Gray Morrow, Bill Draut, Frank Giacoia, Murphy Anderson, Vince Colletta, Wally Wood, Dick Giordano, Mike Esposito, Neal Adams, Dan Adkins, Dick Dillin, Don Heck, Jack Abel, Jack Sparling, Jim Aparo, Mike Kaluta, Mike Peppe, Nick Cardy, Rich Buckler, Tom Sutton, Tony DeZuniga",
    description:
      "More spine-tingling tales from DC's classic horror anthologies, with work from Len Wein, Bernie Wrightson, Gerry Conway, and Marv Wolfman.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509325",
    ownershipStatus: "announced",
  },
  // --- Joker ---
  {
    kind: "volume",
    id: "joker-ba",
    lineId: "joker",
    number: "1",
    era: "bronze",
    title: "The Last Ha Ha",
    start: { year: 1968, quarter: 4 },
    end: { year: 1981, quarter: 3 },
    issuesCollected: "Batman #251, #260, #286, #291–294, #321, Detective Comics #475–476, #504, Justice League of America #77, Wonder Woman #280–283, The Brave and the Bold #111, #118, #129–130, #141, and The Joker #1–10",
    yearsCovered: "1968-1981",
    releaseDate: { year: 2026, month: 4 },
    writers:
      "Dennis \"Denny\" O'Neil, Bob Haney, Elliot S. Maggin, David Vern Reed, Martin Pasko, Steve Englehart, Gerry Conway, Len Wein, Paul Kupperberg, Paul Levitz",
    pencillers:
      "Irv Novick, Jim Aparo, John Calnan, Marshall Rogers, Dick Dillin, Don Newton, Ernie Chan, Joe Staton, José Luis García-López, Neal Adams, Walter \"Walt\" Simonson",
    inkers:
      "Tex Blaisdell, Jim Aparo, Dick Giordano, José Luis García-López, Terry Austin, Vince Colletta, Bob Wiacek, Dan Adkins, Frank McLaughlin, Joe Giella, Neal Adams, Steve Mitchell",
    description:
      "Iconic Silver and Bronze Age Joker stories including 'The Joker's Five-Way Revenge,' plus the villain's own short-lived solo series, as Denny O'Neil and others redefine the Clown Prince of Crime as a serious threat.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510253",
    ownershipStatus: "announced",
  },
  // --- Justice League of America ---
  {
    kind: "volume",
    id: "justice-league-of-america-s1",
    lineId: "justice-league-of-america",
    number: "1",
    era: "silver",
    title: "Starro the Conqueror",
    start: { year: 1960, quarter: 2 },
    end: { year: 1963, quarter: 2 },
    issuesCollected: "The Brave and the Bold #28–30, Justice League of America #1–19, and Mystery in Space #75",
    yearsCovered: "1960-1963",
    releaseDate: { year: 2026, month: 3 },
    writers: "Gardner Fox",
    pencillers: "Mike Sekowsky, Carmine Infantino",
    inkers: "Bernard Sachs, Joe Giella, Murphy Anderson",
    description:
      "Starro the Conqueror forces DC's greatest champions to unite, launching the first Justice League and sparking a legacy of team-based storytelling -- with battles against Despero, Felix Faust, and Kanjar Ro.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799507734",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "justice-league-of-america-s3",
    lineId: "justice-league-of-america",
    number: "3",
    era: "silver",
    title: "The Bridge Between Earths",
    start: { year: 1966, quarter: 3 },
    end: { year: 1969, quarter: 2 },
    issuesCollected: "Justice League of America 45-72",
    yearsCovered: "1966-1969",
    releaseDate: { year: 2024, month: 11 },
    writers: "Gardner Fox, Dennis \"Denny\" O'Neil",
    pencillers: "Mike Sekowsky, Dick Dillin",
    inkers: "Sid Greene, George Roussos, Frank Giacoia, Joe Giella",
    description:
      "Gardner Fox and Dennis O'Neil continue the League's late-'60s adventures with artist Mike Sekowsky, bridging Earth-1 and Earth-2 as the team's roster and mythology expand.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528377",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "justice-league-of-america-b2",
    lineId: "justice-league-of-america",
    number: "2",
    era: "bronze",
    title: "Crisis on Earth-X",
    start: { year: 1972, quarter: 4 },
    end: { year: 1976, quarter: 2 },
    issuesCollected: "Justice League of America #103-132",
    yearsCovered: "1972-1976",
    releaseDate: { year: 2026, month: 8 },
    writers:
      "Len Wein, Cary Bates, Elliot S. Maggin, Gerry Conway, Martin Pasko, Dennis \"Denny\" O'Neil",
    pencillers: "Dick Dillin",
    inkers: "Frank McLaughlin, Dick Giordano",
    description:
      "Members of the JLA and the Earth-2 Justice Society are unexpectedly transported to Earth-X, where they must help that world's heroes defeat a Nazi regime that won World War II.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508830",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "justice-league-of-america-bb",
    lineId: "justice-league-of-america",
    number: "b",
    era: "bronze",
    title: "The Return",
    start: { year: 1985, quarter: 4 },
    end: { year: 1987, quarter: 1 },
    issuesCollected: "Justice League of America #241-261; Infinity, Inc. #19; Justice League of America Annual #3",
    yearsCovered: "1985-1987",
    releaseDate: { year: 2025, month: 8 },
    writers: "Gerry Conway, J.M. DeMatteis, Dan Mishkin, Roy Thomas, Dann Thomas",
    pencillers: "Luke McDonnell, George Tuska, Joe Staton, Rick Hoberg, Todd McFarlane",
    inkers: "Bill Wray, Mike Machlan, Bob Smith, Bob Lewis, Mike Gustovich, Steve Montano",
    description:
      "Gerry Conway's run pits a rebuilt League -- Steel, Martian Manhunter, Zatanna, Elongated Man, and Vixen -- against Amazo and the Brotherhood of Evil.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502449",
    ownershipStatus: "announced",
  },
  // --- Justice Society of America ---
  {
    kind: "volume",
    id: "justice-society-of-america-g1",
    lineId: "justice-society-of-america",
    number: "1",
    era: "golden",
    title: "For America and Democracy",
    start: { year: 1940, quarter: 4 },
    end: { year: 1942, quarter: 3 },
    issuesCollected: "All-Star Comics #3-12",
    yearsCovered: "1940-1942",
    releaseDate: { year: 2024, month: 12 },
    writers:
      "Gardner Fox, Evelyn Gaines, Jerry Siegel, Ken Fitch, Sheldon Mayer, Bill O'Connor, Charles Reizenstein",
    pencillers:
      "Everett E. Hibbard, Stan Aschmeier, Bernard Baily, Sheldon Moldoff, Ben Flinton, Jack Burnley, Cliff Young, Howard Sherman, Jon L. Blummer, Sheldon Mayer, Martin Nodell, Chad Grothkopf, Irwin Hasen, Bernard Klein, Harold Wilson Sharp, Harry G. Peter",
    inkers:
      "Everett E. Hibbard, Stan Aschmeier, Bernard Baily, Sheldon Moldoff, Ben Flinton, Jack Burnley, Cliff Young, Howard Sherman, Jon L. Blummer, Sheldon Mayer, Martin Nodell, Chad Grothkopf, Irwin Hasen, Bernard Klein, Harold Wilson Sharp, Harry G. Peter",
    description:
      "The earliest stories starring comics' first super-team, written almost entirely by Gardner Fox, who created or co-created the Flash, Hawkman, and Doctor Fate for the era.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528476",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "justice-society-of-america-g2",
    lineId: "justice-society-of-america",
    number: "2",
    era: "golden",
    title: "The Plunder of the Psycho-Pirate",
    start: { year: 1942, quarter: 4 },
    end: { year: 1945, quarter: 1 },
    issuesCollected: "All-Star Comics #13-24",
    yearsCovered: "1942-1945",
    releaseDate: { year: 2025, month: 7 },
    writers: "Gardner Fox, Jack Kirby, William Moulton Marston, Evelyn Gaines, Jack Miller",
    pencillers:
      "Joe Gallagher, Stan Aschmeier, Sheldon Moldoff, Bernard Baily, Jon L. Blummer, Howard Sherman, Jack Kirby, Jack Burnley, Ed Dobrotka, Joe Kubert, Pierce Rice, Chester Kozlak, Cliff Young, Harry G. Peter, Joe Simon, Lou Ferstadt, Martin Naydel, Paul Reinman, Sheldon Mayer",
    inkers:
      "Joe Gallagher, Stan Aschmeier, Sheldon Moldoff, Bernard Baily, Jon L. Blummer, Howard Sherman, Joe Simon, Jack Burnley, Ed Dobrotka, Joe Kubert, Arthur Cazeneuve, Chester Kozlak, Cliff Young, Harry G. Peter, Howard Ferguson, Lou Ferstadt, Martin Naydel, Pierce Rice, Sam Burlockoff, Sheldon Mayer, Steve Brodie",
    description:
      "A pivotal Golden Age arc in JSA history -- the Justice Society encounters the Psycho-Pirate, a powerful new foe with the ability to manipulate their emotions.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502074",
    ownershipStatus: "announced",
  },
  // --- Legion of the Super-Heroes ---
  {
    kind: "volume",
    id: "legion-of-the-super-heroes-ba",
    lineId: "legion-of-the-super-heroes",
    number: "1",
    era: "bronze",
    title: "Zap Goes the Legion",
    start: { year: 1968, quarter: 4 },
    end: { year: 1974, quarter: 3 },
    issuesCollected: "Action Comics #378-387 and #389-392, Adventure Comics #374-380 and #403, and Superboy #172-173, #176, #183-184, 188, 190-191, 193, 195, and #197-203",
    yearsCovered: "1968-1974",
    releaseDate: { year: 2024, month: 12 },
    writers: "Cary Bates, Jim Shooter, E. Nelson Bridwell",
    pencillers: "Win Mortimer, Dave Cockrum, Jim Shooter, George Tuska, Curt Swan, Mike Grell",
    inkers:
      "Jack Abel, Dave Cockrum, Murphy Anderson, Win Mortimer, George Tuska, Mike Grell, Mike Esposito, Vince Colletta",
    description:
      "Long out-of-print Legion tales including 'War of the Wraith-Mates,' 'The Fatal Five Who Twisted Time,' and 'The Impossible Target,' from the team's late-'60s and early-'70s adventures.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528490",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "legion-of-the-super-heroes-vol-msi8oar6",
    lineId: "legion-of-the-super-heroes",
    number: "b",
    era: "bronze",
    title: "The Great Darkness Saga",
    start: { year: 1982, quarter: 1 },
    end: { year: 1983, quarter: 2 },
    issuesCollected:
      "DC Comics Presents #43, The Legion of Super-Heroes #284-300, World’s Finest Comics #284, The Best of DC: Blue Ribbon Digest #24, The Legion of Super-Heroes Annual #1",
    yearsCovered: "1982-1983",
    releaseDate: { year: 2027, month: 3 },
    writers: "Paul Levitz, Dan Mishkin, Paul Kupperberg",
    pencillers:
      "Keith Giffen, Pat Broderick, Curt Swan, Howard Bender, Carmine Infantino, Dave Cockrum, Ernie Colon, Jim Sherman, Joe Staton, Kurt Schaffenberger",
    inkers:
      "Larry Mahlstedt, Bruce Patterson, Dave Hunt, Dan Adkins, Dave Cockrum, Dick Giordano, Ernie Colon, Frank Giacoia, Jim Sherman, Kurt Schaffenberger, Rodin Rodriguez",
    description:
      "A group of young heroes faces a mysterious force threatening the entire galaxy in this massive, future-set superhero epic.\nIn the 31st century, a team of young superheroes from across the galaxy unites to prevent Armageddon.\nWhen a powerful and unseen enemy begins manipulating events across space, the Legion of Super-Heroes races to discover the true identity behind the threat that spans worlds, timelines, and entire civilizations. As the danger escalates, the team is pushed to its limits, facing impossible odds and uncovering a force powerful enough to reshape the universe itself.\nBlending action, suspense, and expansive world-building, this landmark storyline delivers a high-stakes adventure where teamwork, sacrifice, and resilience define the fate of the future.",
    coverUrl: legionGreatDarknessSagaCover,
    ownershipStatus: "announced",
  },
  // --- Metamorpho ---
  {
    kind: "volume",
    id: "metamorpho-s1",
    lineId: "metamorpho",
    number: "1",
    era: "silver",
    title: "The Element Man",
    start: { year: 1965, quarter: 1 },
    end: { year: 1968, quarter: 2 },
    issuesCollected: "Justice League of America #42; The Brave and the Bold #57-58, #66, #68, #88, #101; Metamorpho #1-17",
    yearsCovered: "1965-1968",
    releaseDate: { year: 2025, month: 6 },
    writers: "Bob Haney, Gardner Fox",
    pencillers: "Ramona Fradon, Sal Trapani, Joe Orlando, Mike Sekowsky, Jack Sparling, Jim Aparo",
    inkers: "Charles Paris, Sal Trapani, Bernard Sachs, Mike Esposito, Jack Sparling, Jim Aparo",
    description:
      "Rex Mason is transformed by an unlikely accident into Metamorpho, the Element Man -- able to transmute his body into any natural compound at will, be it solid, liquid, or gas.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501848",
    ownershipStatus: "announced",
  },
  {
    kind: "gap",
    id: "metamorpho-gap-msj6zp08",
    lineId: "metamorpho",
    gapType: "publication",
    start: { year: 1968, quarter: 3 },
    end: { year: 1972, quarter: 2 },
  },
  {
    kind: "volume",
    id: "metamorpho-vol-msj6qztx",
    lineId: "metamorpho",
    number: "1",
    era: "bronze",
    title: "How to Make a Super-Hero",
    start: { year: 1972, quarter: 3 },
    end: { year: 2009, quarter: 3 },
    issuesCollected:
      "Action Comics #413-415; Justice League of America #101 (pages 1-9); Action Comics #416-418; World's Finest Comics #217-220, #224, #226, and #228-229; 1st Issue Special #3 (w/ the Making of Metamorpho 1-page text); The Brave and the Bold #123 and #154; DC Comics Presents #40; Batman and the Outsiders #1-2, #16-18; Batman and the Outsiders #19 (page 17); Batman and the Outsiders #24; Batman and the Outsiders #25 (pages 1-2, 4-5 w/ removed panels); Batman and the Outsiders Annual #2; The Outsiders #4 [and pinups from #6, #8]; The Outsiders #18; The Outsiders #19 (pages 2-3); The Outsiders #20 [Geo-Force and Metamorpho in \"Gross Encounters\"]; The Outsiders #21-22, #25-26; Millennium #1 (pages 12-22); The Outsiders #27; Invasion! #3 (pages 1, 54); Justice League Europe #2 (pages 17-21) and 3 pages from #4; Justice League Europe #5, #11-12",
    yearsCovered: "1972-2009",
    releaseDate: { year: 2027, month: 4 },
    // Split by hand from `creators` -- Wikipedia only says "various" for this
    // one. The sheet's "(Illustrated by)" marked where the artists started.
    writers:
      "Bob Haney, Mike W. Barr, Gerry Conway, Len Wein, Keith Giffen, J.M. DeMatteis, William Messner-Loebs, Bill Mantlo, Steve Englehart",
    pencillers:
      "Jim Aparo, John Calnan, Dick Dillin, Bart Sears, Alan Davis, Irv Novick, Ramona Fradon, David Ross, Joe Staton, Keith Giffen, Bill Wray, Brian Bolland, Curt Swan, Dan Spiegle, Erik Larsen, Howard Simpson, Joe Orlando, Jonathan Peterson, Kurt Schaffenberger",
    inkers:
      "Jim Aparo, John Calnan, Murphy Anderson, Pablo Marcos, Alan Davis, Bart Sears, Frank McLaughlin, Joe Giella, Ramona Fradon, Tex Blaisdell, Joe Rubinstein, Dan Adkins, Dick Giordano, Ian Gibson, Tom Christopher, Bill Wray, Al Vey, Bob Smith, Brian Bolland, Dan Spiegle, Erik Larsen, Joe Orlando, Joe Staton, Kurt Schaffenberger, Robert Orzechowski",
    description:
      "A shape-shifting hero pushed to new limits—Metamorpho faces bigger challenges, team-ups, and unexpected transformations.\nRex Mason is no ordinary hero—he can transform into any element on Earth.\nAs Metamorpho, his powers allow him to reshape his body into anything from steel to smoke to fire, making him one of the most unpredictable heroes in the DC Universe. But with those abilities comes a challenge: holding onto his humanity while constantly changing.\nAcross a wide range of adventures, DC's most versatile of champions takes on new challenges, teams up with other heroes, and navigates increasingly complex threats while struggling with the personal cost of his powers.\nCollecting stories from across multiple series, this volume offers a broad and energetic look at one of DC's most unusual characters—blending science fiction, superhero action, and character-driven storytelling.",
    coverUrl: "https://m.media-amazon.com/images/I/815PF+lh3pL._SL1500_.jpg",
    ownershipStatus: "announced",
  },
  // --- Peacemaker ---
  {
    kind: "volume",
    id: "peacemaker-s1",
    lineId: "peacemaker",
    number: "1",
    era: "silver",
    title: "Kill for Peace",
    start: { year: 1966, quarter: 4 },
    end: { year: 1993, quarter: 3 },
    issuesCollected: "Fightin' Five #40-41; Suicide Squad #27-30; Checkmate #16-26, #28, #32-33; Eclipso #11-13; Showcase '93 #6-11; Peacemaker #1-4; The Vigilante #36-38, #41-43; The Peacemaker #1-5",
    yearsCovered: "1966-1993",
    releaseDate: { year: 2025, month: 4 },
    writers: "Joe Gill, Mike Baron, Paul Kupperberg",
    pencillers: "Pat Boyette, Bill Montes, Tod Smith, Cary Nord, Gary Barker",
    inkers: "Pat Boyette, José Marzan Jr., Ernie Bache, Pablo Marcos",
    description:
      "The earliest days of Christopher Smith, a man who loves peace so much he's willing to kill for it -- decades before the character's TV adaptation, across his Charlton origin and DC guest appearances.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799500988",
    ownershipStatus: "announced",
  },
  // --- Plastic Man ---
  {
    kind: "volume",
    id: "plastic-man-g1",
    lineId: "plastic-man",
    number: "1",
    era: "golden",
    title: "The Origin of Plastic Man",
    start: { year: 1941, quarter: 3 },
    end: { year: 1944, quarter: 1 },
    issuesCollected: "Police Comics #1-36; Plastic Man #1-2",
    yearsCovered: "1941-1944",
    releaseDate: { year: 2025, month: 3 },
    writers: "Jack Cole",
    pencillers: "Jack Cole",
    inkers: "Jack Cole",
    description:
      "Jack Cole's original, long-out-of-print Plastic Man stories -- after an accident leaves criminal Eel O'Brian's body transformed into living rubber, Plastic Man is born.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799500650",
    ownershipStatus: "announced",
  },
  // --- Robin ---
  {
    kind: "volume",
    id: "robin-ba",
    lineId: "robin",
    number: "1",
    era: "bronze",
    title: "The Origin of Robin",
    start: { year: 1964, quarter: 3 },
    end: { year: 1975, quarter: 3 },
    issuesCollected: "Batman (1940) #184, #192, #202, #213, #227, #229-231, #234-236, #239-242, #244-245, #248-250, #252, #254, AND #259; Detective Comics (1937) #342, #386, #390, #391, #394-395, #398-403, #445, #447, and #450-451; Superman's' Pal: Jimmy Olsen (1954) #111 AND #130; World's Finest Comics (1941) #141, #147, #195, and #200",
    yearsCovered: "1964-1975",
    releaseDate: { year: 2026, month: 6 },
    writers:
      "Mike Friedrich, Elliot S. Maggin, Frank Robbins, Bob Rozakis, Gardner Fox, Dennis \"Denny\" O'Neil, E. Nelson Bridwell, John Broome",
    pencillers:
      "Irv Novick, Gil Kane, Rich Buckler, Chic Stone, Dick Dillin, Sheldon Moldoff, Al Milgrom, Robert \"Bob\" Brown, Ross Andru, A. Martinez, Mike Grell",
    inkers:
      "Dick Giordano, Joe Giella, Vince Colletta, Murphy Anderson, Frank McLaughlin, Mike Esposito, Rich Buckler, Sid Greene, Terry Austin, Frank Giacoia, Mazzaroli, Mike Grell",
    description:
      "Dick Grayson's evolution from circus acrobat to Batman's trusted partner, tracing his Silver and Bronze Age solo appearances and team-ups with Superman.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508298",
    ownershipStatus: "announced",
  },
  {
    kind: "gap",
    id: "robin-gap-mshs40ne",
    lineId: "robin",
    gapType: "publication",
    start: { year: 1975, quarter: 4 },
    end: { year: 1976, quarter: 1 },
  },
  {
    kind: "volume",
    id: "robin-vol-mshrvog7",
    lineId: "robin",
    number: "2",
    era: "bronze",
    title: "The League of Crime",
    start: { year: 1976, quarter: 2 },
    end: { year: 1983, quarter: 2 },
    issuesCollected:
      "Secret Origins #50; Batman #333-334, #337-339, and #341-343; Detective Comics #481-495; DC Comics Presents #58; and The Batman Family #4, #6-9, and #11-20",
    yearsCovered: "1976-1983",
    releaseDate: { year: 2027, month: 5 },
    writers:
      "Bob Rozakis, Jack C. Harris, Gerry Conway, Dennis \"Denny\" O'Neil, Elliot S. Maggin, Marv Wolfman, Mike W. Barr, Paul Kupperberg",
    pencillers:
      "Irv Novick, Kurt Schaffenberger, Charles Nicholas, Don Heck, Don Newton, Curt Swan, Juan Ortiz, Trevor von Eeden, Alex Saviuk, George Pérez, Jim Aparo, Jose Delbo, Lee Elias, Marshall Rogers",
    inkers:
      "Vince Colletta, Dave Hunt, John Celardo, Bob Wiacek, Bruce Patterson, Frank Chiaramonte, Joe Giella, Larry Mahlstedt, Dan Adkins, Frank McLaughlin, George Pérez, Jack Abel, Jim Aparo, John Calnan, Mike DeCarlo, Rodin Rodriguez",
    description:
      "Robin takes center stage in this DC Finest collection of classic adventures beyond the shadow of Batman!\nRobin may be Batman's partner, but some adventures belong entirely to him.\nAs Dick Grayson continues to grow into a hero in his own right, he takes on dangerous criminals, mysterious conspiracies, supernatural threats, and globe-spanning adventures that test his courage, intelligence, and leadership. Whether working alone, joining forces with Batgirl, or teaming with heroes from across the DC Universe, Robin proves that he is more than a sidekick—he is a hero capable of carrying the spotlight himself.\nFrom college campuses and traveling carnivals to hidden criminal organizations and extraordinary mysteries, these stories showcase the variety and excitement that defined Robin during the late Bronze Age. Along the way, Dick develops friendships, faces personal challenges, and gains the confidence that will help shape his future as one of DC's most enduring heroes.\nTogether, these stories capture the moment Dick Grayson begins to feel like a hero with his own world, his own instincts, and his own future beyond Batman.",
    coverUrl: "https://m.media-amazon.com/images/I/91W5aOuGyKL._SL1500_.jpg",
    ownershipStatus: "announced",
  },
  // --- Science Fiction ---
  {
    kind: "volume",
    id: "science-fiction-sa",
    lineId: "science-fiction",
    number: "a",
    era: "silver",
    title: "The Gorilla World",
    start: { year: 1953, quarter: 4 },
    end: { year: 1954, quarter: 4 },
    issuesCollected: "Action Comics #183-196; Strange Adventures #35-48; Mystery in Space #16-22",
    yearsCovered: "1953-1954",
    releaseDate: { year: 2025, month: 7 },
    writers:
      "Sid Gerson, Otto Binder, John Broome, Jack Miller, Arthur Wallace, Gardner Fox, Jerry Coleman, Manny Rubin",
    pencillers:
      "Gil Kane, Carmine Infantino, Murphy Anderson, Mort Drucker, Sy Barry, Jim Mooney, Frank Giacoia, Howard Sherman, Henry Sharp, Irwin Hasen, Jerry Grandenetti, Virgil Finlay",
    inkers:
      "Bernard Sachs, Joe Giella, Murphy Anderson, Sy Barry, Jim Mooney, Howard Sherman, Frank Giacoia, Carmine Infantino, Ray Burnley",
    description:
      "An anthology of Gorilla World, an alternate reality where great apes reign supreme, plus other classic science fiction tales from the pre-Adam Strange era.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502159",
    ownershipStatus: "announced",
  },
  // --- Sgt. Rock ---
  {
    kind: "volume",
    id: "sgt-rock-s1",
    lineId: "sgt-rock",
    number: "1",
    era: "silver",
    title: "The Rock of Easy Co.",
    start: { year: 1959, quarter: 1 },
    end: { year: 1962, quarter: 3 },
    issuesCollected: "G.I. Combat #68 and Our Army at War #81–122",
    yearsCovered: "1959-1962",
    releaseDate: { year: 2026, month: 5 },
    writers: "Robert Kanigher, Bob Haney",
    pencillers: "Joe Kubert, Jerry Grandenetti, Russ Heath, Irv Novick, Mort Drucker, Ross Andru",
    inkers: "Joe Kubert, Jerry Grandenetti, Russ Heath, Irv Novick, Mike Esposito, Mort Drucker",
    description:
      "The earliest and most iconic stories of Sgt. Frank Rock and his legendary unit, Easy Company, blending explosive WWII action with emotional depth.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508090",
    ownershipStatus: "announced",
  },
  // --- The Spectre ---
  {
    kind: "volume",
    id: "the-spectre-sa",
    lineId: "the-spectre",
    number: "a",
    era: "silver",
    title: "The Wrath of the Spectre",
    start: { year: 1966, quarter: 1 },
    end: { year: 1988, quarter: 3 },
    issuesCollected: "Adventure Comics #431-440; Showcase #60-61, #64; The Spectre #2 #1-10; The Brave and the Bold #72; All-Star Squadron #27-28; Ghosts #97-99; Wrath of the Spectre #4",
    yearsCovered: "1966-1988",
    releaseDate: { year: 2025, month: 9 },
    writers:
      "Michael Fleisher, Gardner Fox, Mike Friedrich, Neal Adams, Dennis \"Denny\" O'Neil, Russell Carley, Paul Kupperberg, Roy Thomas, Bob Haney, Mark Hanerfeld, Steve Skeates",
    pencillers:
      "Jim Aparo, Jerry Grandenetti, Neal Adams, Murphy Anderson, Ernie Chan, Frank Thorne, Bernie Wrightson, Dick Dillin, Jack Sparling, Michael Adams, Richard Howell, Carmine Infantino",
    inkers:
      "Jim Aparo, Murphy Anderson, Neal Adams, Bernie Wrightson, Bill Draut, George Roussos, Jack Sparling, Sid Greene, Mike DeCarlo, Tex Blaisdell, Chuck Cuidera, Gerald Forton, Larry Houston, Pablo Marcos, Richard Howell, Tony DeZuniga",
    description:
      "DC's grim arbiter of justice returns to enact bloody vengeance on evildoers, resurfacing in the 1960s for all-new -- and sometimes controversial -- stories that show the true scale of his wrath.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502814",
    ownershipStatus: "announced",
  },
  // --- Static ---
  {
    kind: "volume",
    id: "static-c1",
    lineId: "static",
    number: "1",
    era: "post-crisis",
    title: "Playing with Fire",
    start: { year: 1993, quarter: 2 },
    end: { year: 1994, quarter: 2 },
    issuesCollected:
      "Static #1-15, Superman: The Man of Steel #36, Superboy #7, Steel (Vol. 2) #7, and Worlds Collide #1",
    yearsCovered: "1993-1994",
    releaseDate: { year: 2025, month: 10 },
    writers:
      "Robert L. Washington III, Dwayne McDuffie, Louise Simonson, Kurt Busiek, Ivan Velez Jr., Karl Kesel, Sholly Fisch",
    pencillers:
      "John Paul Leon, Chris Batista, Denys Cowan, Tom Grummett, Wilfred Santiago, Brian O'Connell, ChrisCross, Humberto Ramos, Jon Bogdanove, Mark Bright, Neil Vokes, Shawn Martinbrough",
    inkers:
      "Prentis Rollins, Rober Quijano, Steve Mitchell, Bobby Rae, Shawn Martinbrough, Art Nichols, Dennis Janke, Doug Hazlewood, Maria Beccari, Rich Faber, Romeo Tanghal, Stan Woch",
    description:
      "Static's electrifying origin from Milestone Comics -- Virgil Hawkins gains electromagnetic powers in a gang riot gone wrong, then crosses over with Superman and Superboy in \"Worlds Collide.\"",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502944",
    ownershipStatus: "announced",
  },
  // --- Swamp Thing ---
  {
    kind: "volume",
    id: "swamp-thing-b1",
    lineId: "swamp-thing",
    number: "1",
    era: "bronze",
    title: "The Man Who Would Not Die",
    start: { year: 1971, quarter: 3 },
    end: { year: 1976, quarter: 2 },
    issuesCollected: "Swamp Thing #1–22; The House of Secrets #92, #140; The Phantom Stranger #14; The Brave and the Bold #122",
    yearsCovered: "1971-1976",
    releaseDate: { year: 2026, month: 12 },
    writers: "Len Wein, David Michelinie, Gerry Conway, Bob Haney",
    pencillers: "Bernie Wrightson, Nestor Redondo, Jim Aparo",
    inkers: "Bernie Wrightson, Nestor Redondo, Jim Aparo, Mike Kaluta",
    description:
      "The era-defining Bronze Age saga that birthed DC's most haunting monster hero, from his House of Secrets debut through Len Wein and Bernie Wrightson's slow-burn tragedy of loss, guilt, and transformation.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509837",
    ownershipStatus: "announced",
  },
  // --- Superboy ---
  {
    kind: "volume",
    id: "superboy-sa",
    lineId: "superboy",
    number: "a",
    era: "silver",
    title: "The Super-Dog from Krypton",
    start: { year: 1954, quarter: 2 },
    end: { year: 1955, quarter: 2 },
    issuesCollected: "Adventure Comics #199-216; Superboy #33-43",
    yearsCovered: "1954-1955",
    releaseDate: { year: 2025, month: 5 },
    writers:
      "Otto Binder, William Woolfolk, Bill Finger, Jerry Coleman, Edmond Hamilton, Alvin Schwartz",
    pencillers: "Curt Swan, John Sikela",
    inkers: "John Sikela, George Klein, Sy Barry, Stan Kaye, Bruno Premiani, Ray Burnley",
    description:
      "Krypto's first-ever comics appearance in \"The Super-Dog from Krypton,\" plus early Superboy adventures like \"Superboy Meets Superlad\" and \"The Super Brat of Smallville.\"",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501367",
    ownershipStatus: "announced",
  },
  // --- Superfriends ---
  {
    kind: "volume",
    id: "superfriends-b1",
    lineId: "superfriends",
    number: "1",
    era: "bronze",
    title: "The Fury of the Super Foes",
    start: { year: 1976, quarter: 1 },
    end: { year: 1979, quarter: 3 },
    issuesCollected: "Limited Collectors' Edition #41, Limited Collectors' Edition #46, and Super Friends #1-26",
    yearsCovered: "1976-1979",
    releaseDate: { year: 2025, month: 11 },
    writers: "E. Nelson Bridwell, Dennis \"Denny\" O'Neil",
    pencillers: "Ramona Fradon, Kurt Schaffenberger, Ric Estrada",
    inkers: "Bob Smith, Vince Colletta, Joe Orlando",
    description:
      "Batman, Superman, Wonder Woman, and Aquaman battle the Penguin, Poison Ivy, and time-traveling foes, including the first comic book appearances of the Wonder Twins and Gleek.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799503163",
    ownershipStatus: "announced",
  },
  // --- Supergirl ---
  {
    kind: "volume",
    id: "supergirl-s1",
    lineId: "supergirl",
    number: "1",
    era: "silver",
    title: "The Girl of Steel",
    start: { year: 1959, quarter: 2 },
    end: { year: 1962, quarter: 2 },
    issuesCollected: "Action Comics #252-288, Adventure Comics #278, Superman #139-140 and #144, Superboy #80, Superman’s Girl Friend Lois Lane #14 and #20, and Superman’s Pal, Jimmy Olsen #40, #46, #51, and #57",
    yearsCovered: "1959-1962",
    releaseDate: { year: 2025, month: 1 },
    writers: "Jerry Siegel, Otto Binder, Leo Dorfman, Robert Bernstein",
    pencillers: "Jim Mooney, Curt Swan, Al Plastino, Wayne Boring",
    inkers: "Jim Mooney, Al Plastino, John Forte, George Klein, Stan Kaye",
    description:
      "Kara Zor-El lands on Earth and discovers she shares her cousin Superman's powers -- inspired by her famous kin, she adopts a secret identity and starts using her abilities to help those in need.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779529909",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "supergirl-ca",
    lineId: "supergirl",
    number: "a",
    era: "post-crisis",
    title: "Body & Soul",
    start: { year: 1996, quarter: 3 },
    end: { year: 1998, quarter: 1 },
    issuesCollected: "Showcase ’96 #8, Supergirl #1-18, Supergirl Annual #1-2, and Supergirl Plus #1",
    yearsCovered: "1996-1998",
    releaseDate: { year: 2025, month: 10 },
    writers:
      "Peter David, Chuck Dixon, Barbara Kesel, Darren Vincenzo, Gary Frank, Joe R. Lansdale, Karl Kesel, Neal Barrett Jr., Tom Peyer",
    pencillers:
      "Gary Frank, Leonard Kirk, Greg Land, Anthony Castrillo, Dick Giordano, Robert Teranishi, Ron Wagner, Terry Dodson",
    inkers:
      "Cam Smith, Prentis Rollins, Bill Reinhold, Chuck Drost, George Pérez, Jordi Ensign, Karl Story, Stan Woch",
    description:
      "Peter David's astonishing reinvention of Supergirl begins: Matrix, the protoplasmic entity posing as Supergirl, fuses with the near-dead Linda Danvers, and together they become the new Girl of Steel.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510260",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "supergirl-cb",
    lineId: "supergirl",
    number: "b",
    era: "post-crisis",
    title: "Die and Let Live",
    start: { year: 1998, quarter: 2 },
    end: { year: 1999, quarter: 3 },
    issuesCollected: "Adventure Comics 80-Page Giant #1, Resurrection Man #16–17, Supergirl #19–35, Supergirl #1 ML, Supergirl/Prysm Double-Shot #1, Team Superman #1, and Team Superman Secret Files #1",
    yearsCovered: "1998-1999",
    releaseDate: { year: 2026, month: 5 },
    writers: "Peter David, Andy Lanning, Dan Abnett, Joan Weis, Mark Millar",
    pencillers:
      "Leonard Kirk, Georges Jeanty, Jackson Guice, Jason Orfalas, Louis Small Jr., Sean Phillips",
    inkers:
      "Robin Riggs, Cam Smith, Doug Hazlewood, Jackson Guice, Prentis Rollins, John Stanisci, Sean Phillips",
    description:
      "Kara Zor-El's resilience is put to the test as she battles powerful enemies and uncovers shocking truths about her destiny, in the continuation of Peter David's acclaimed run.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799513605",
    ownershipStatus: "announced",
  },
  // --- Superman ---
  {
    kind: "volume",
    id: "superman-g1",
    lineId: "superman",
    number: "1",
    era: "golden",
    title: "The First Superhero",
    start: { year: 1938, quarter: 3 },
    end: { year: 1940, quarter: 2 },
    issuesCollected: "Action Comics #1-25, Superman #1-5, and New York World’s Fair Comics #1",
    yearsCovered: "1938-1940",
    releaseDate: { year: 2024, month: 11 },
    writers: "Jerry Siegel",
    pencillers: "Joe Shuster, Paul Cassidy, Wayne Boring",
    inkers: "Paul Cassidy, Joe Shuster, Paul Lauretta, Wayne Boring, Dennis Neville",
    description:
      "The first two years of Superman adventures, starting with 1938's legendary Action Comics #1 -- Jerry Siegel and Joe Shuster's creation that launched the entire superhero genre.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528339",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "superman-g2",
    lineId: "superman",
    number: "2",
    era: "golden",
    title: "The Invisible Luthor",
    start: { year: 1940, quarter: 3 },
    end: { year: 1941, quarter: 3 },
    issuesCollected: "Action Comics #26-40, World’s Finest Comics #2-3, Superman #6-11, World’s Best Comics #1, and New York World’s Fair #2",
    yearsCovered: "1940-1941",
    releaseDate: { year: 2025, month: 12 },
    writers: "Jerry Siegel",
    pencillers:
      "Paul Cassidy, Wayne Boring, Leo Nowak, Jack Burnley, Joe Shuster, John Sikela, Joseph Sulman, Paul Lauretta",
    inkers:
      "Shuster Shop, Jack Burnley, Paul Cassidy, Wayne Boring, Leo Nowak, Don Komisarow, Paul Lauretta, Dennis Neville, Ed Dobrotka, John Sikela",
    description:
      "More of Superman's iconic Golden Age adventures, including major first-ever moments for his nemesis Lex Luthor.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799503323",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "superman-gc",
    lineId: "superman",
    number: "c",
    era: "golden",
    title: "The Last Days of Superman",
    start: { year: 1950, quarter: 2 },
    end: { year: 1951, quarter: 3 },
    issuesCollected: "Action Comics #144–159, Superman #64–70, and World’s Finest Comics #46–53",
    yearsCovered: "1950-1951",
    releaseDate: { year: 2026, month: 2 },
    writers: "Alvin Schwartz, William Woolfolk, Edmond Hamilton, Dorothy Woolfolk",
    pencillers: "Wayne Boring, Al Plastino, Curt Swan",
    inkers: "Stan Kaye, Al Plastino",
    description:
      "Classic Superman adventures from the dawn of the Silver Age, spanning Action Comics, Superman, and World's Finest Comics as the Man of Steel's mythology continues to expand.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799507420",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "superman-b1",
    lineId: "superman",
    number: "1",
    era: "bronze",
    title: "Kryptonite Nevermore",
    start: { year: 1970, quarter: 4 },
    end: { year: 1971, quarter: 4 },
    issuesCollected: "Action Comics #393-406; Superman #233-238, #240-246",
    yearsCovered: "1970-1971",
    releaseDate: { year: 2025, month: 6 },
    writers: "Leo Dorfman, Dennis \"Denny\" O'Neil, Cary Bates, Len Wein",
    pencillers: "Curt Swan, Ross Andru",
    inkers: "Murphy Anderson, Dick Giordano, Mike Esposito",
    description:
      "The Man of Steel's status quo turns upside down as his powers slowly fade and a doppelganger Superman arrives with strange powers of its own -- any contact between the two could destroy the planet.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501657",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "superman-vol-msj77o48",
    lineId: "superman",
    number: "3",
    era: "bronze",
    title: "The Krypton Connection",
    start: { year: 1973, quarter: 1 },
    end: { year: 1974, quarter: 2 },
    issuesCollected:
      "Collects Action Comics #421-437, Superman #261-277, Limited Collectors Edition #31, Wanted: The Worlds Most Dangerous Villains #9, Secret Origins #1, The Amazing World of Superman #1, Aurora Comics Scenes #185, and DC 100-Page Super Spectacular #18",
    yearsCovered: "1973-1974",
    releaseDate: { year: 2027, month: 5 },
    writers: "Elliot S. Maggin, Cary Bates, Martin Pasko",
    pencillers: "Curt Swan, Dick Dillin, Murphy Anderson",
    inkers:
      "Murphy Anderson, Vince Colletta, Bob Oksner, Dick Giordano, Frank Giacoia, Frank McLaughlin, Joe Giella, Kurt Schaffenberger",
    description:
      "Classic adventures from one of the most imaginative eras of Superman's history.\nSuperman's adventures could take him anywhere.\nDuring this dynamic era, the Man of Steel confronts alien threats, scientific mysteries, cosmic dangers, and challenges that test both his powers and his character.\nAlongside trusted allies and a growing cast of supporting characters, Superman faces everything from ordinary human conflicts to extraordinary adventures that stretch across the universe.\nFilled with action and optimism, these tales showcase the wide-ranging appeal of Superman during the Bronze Age, when every issue introduced new ideas, new dangers, and new opportunities for heroism.\nCollecting a substantial chapter of Superman's publishing, this volume offers readers the chance to experience the evolution of the character and his world through a broad selection of stories from across the era.",
    coverUrl: supermanKryptonConnectionCover,
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "superman-c1",
    lineId: "superman",
    number: "1",
    era: "post-crisis",
    title: "The Man of Steel",
    start: { year: 1986, quarter: 4 },
    end: { year: 1987, quarter: 2 },
    issuesCollected: "The Man of Steel #1–6; Superman #1–6; Adventures of Superman #424–429; and Action Comics #584–588",
    yearsCovered: "1986-1987",
    releaseDate: { year: 2026, month: 11 },
    writers: "John Byrne, Marv Wolfman, Jerry Ordway",
    pencillers: "John Byrne, Jerry Ordway",
    inkers: "Dick Giordano, Jerry Ordway, Karl Kesel, Terry Austin, Mike Machlan, Keith Williams",
    description:
      "John Byrne and Marv Wolfman reimagine the Last Son of Krypton for the post-Crisis era, revealing a Clark Kent rooted in humanity, a driven Lois Lane, and a Lex Luthor redefined as a ruthless corporate tyrant.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799510321",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "superman-ca",
    lineId: "superman",
    number: "b",
    era: "post-crisis",
    title: "Time and Time Again",
    start: { year: 1990, quarter: 4 },
    end: { year: 1991, quarter: 2 },
    issuesCollected: "Superman #49–56, Starman #28, Adventures of Superman #472–479, and Action Comics #659–666",
    yearsCovered: "1990-1991",
    releaseDate: { year: 2026, month: 3 },
    writers: "Roger Stern, Jerry Ordway, Dan Jurgens, James Hudnall, Karl Kesel",
    pencillers:
      "Dan Jurgens, Bob McLeod, Jerry Ordway, Ed Hannigan, Karl Kesel, Kerry Gammill, Curt Swan, Dave Hoover, John Byrne, Tom Grummett",
    inkers:
      "Brett Breeding, Dennis Janke, Art Thibert, Bob McLeod, Karl Kesel, Will Blyberg, Jerry Ordway, John Byrne, José Marzan Jr., Scott Hanna",
    description:
      "When time splinters, Superman becomes the tether holding history together -- cast from Nazi-occupied Europe to the kingdoms of Camelot by forces beyond his control, marking the start of the 'Triangle Era.'",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508106",
    ownershipStatus: "announced",
  },
  // --- Superman Family ---
  {
    kind: "volume",
    id: "superman-family-sa",
    lineId: "superman-family",
    number: "a",
    era: "silver",
    title: "The Giant Turtle Man",
    start: { year: 1960, quarter: 3 },
    end: { year: 1961, quarter: 3 },
    issuesCollected: "Action Comics #266, #277; Superman #142-143, #147; Superman's Girl Friend Lois Lane #19-28; Superman's Pal, Jimmy Olsen #47-56",
    yearsCovered: "1960-1961",
    releaseDate: { year: 2025, month: 4 },
    writers:
      "Jerry Siegel, Otto Binder, Robert Bernstein, Edmond Hamilton, Jerry Coleman, Leo Dorfman",
    pencillers: "Curt Swan, Kurt Schaffenberger, John Forte, Al Plastino, George Papp, Jim Mooney",
    inkers:
      "Kurt Schaffenberger, John Forte, Stan Kaye, Al Plastino, George Papp, Jim Mooney, Sheldon Moldoff, George Klein",
    description:
      "Some of Superman, Lois, and Jimmy's wackiest and wildest Silver Age adventures, including the debut of the infamous Giant Turtle Man.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799501107",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "superman-family-vol-msdpirc8",
    lineId: "superman-family",
    number: "a",
    era: "bronze",
    title: "The Stray Superdog",
    start: { year: 1974, quarter: 1 },
    end: { year: 1977, quarter: 4 },
    issuesCollected:
      "Superman’s Pal, Jimmy Olsen #163 and Superman’s Girl Friend, Lois Lane #136-137; and stories from Superman #271, #275, #279, #282, and #286-287; Action Comics #436, #438, #440-441, #461-462, #465, #467-468, #472, and #475; and Superman Family #164, #166-167, #169-170, #172-173, #175-176, #178-179, and #181-186",
    yearsCovered: "1974-1977",
    releaseDate: { year: 2027, month: 3 },
    writers:
      "Cary Bates, Leo Dorfman, Bob Toomey, Jack C. Harris, Paul Kupperberg, Gerry Conway, Tom DeFalco, Bill Kunkel, E. Nelson Bridwell, Elliot S. Maggin, Martin Pasko, Bill Dennehy, Bob Rozakis, Jane Aruns, John Warner",
    pencillers:
      "Kurt Schaffenberger, Curt Swan, John Rosenberger, Jose Delbo, John Calnan, Ken Landgraf, Juan Ortiz, Win Mortimer, Alan Weiss, Bill Draut, Robert \"Bob\" Brown, Carl Potts, Chic Stone, Ernie Chan, Jim Mooney, Marshall Rogers, Mike Vosburg, Pete Costanza",
    inkers:
      "Kurt Schaffenberger, Vince Colletta, Tex Blaisdell, Al Milgrom, Bob Oksner, Romeo Tanghal, Joe Giella, Steve Mitchell, Bob Layton, Bob Smith, Ernie Chan, Frank Springer, Jim Mooney, Joe Orlando, Joe Rubinstein, John Forte, John Rosenberger, Pete Costanza",
    description:
      "Heroes, friends, and one super-powered dog—adventures from across the Superman Family in a new DC Finest collection.\nSuperman isn’t the only hero in Metropolis. From Lois Lane to Jimmy Olsen to Krypto the Superdog, the Superman Family is filled with characters who each bring their own adventures, challenges, and personalities to the world of heroes.\nIn these stories, brave reporters chase dangerous leads, young heroes step into their own, and loyal companions—both human and animal—prove that heroism comes in many forms. Whether solving mysteries, facing unusual threats, or helping those in need, every member of the Superman Family has a role to play.\nFilled with imagination, humor, and heart, this collection captures a time when Superman’s world expanded beyond one hero into a full cast of unforgettable characters, including this book's titular Superdog, Krypto.",
    coverUrl: supermanFamilyStraySuperdogCover,
    ownershipStatus: "announced",
  },
  // --- Suicide Squad ---
  {
    kind: "volume",
    id: "suicide-squad-c1",
    lineId: "suicide-squad",
    number: "1",
    era: "post-crisis",
    title: "Trial by Fire",
    start: { year: 1986, quarter: 4 },
    end: { year: 1988, quarter: 1 },
    issuesCollected: "Suicide Squad #1-10; Secret Origins #14; Detective Comics #582; The Fury of Firestorm #62-64; Firestorm: The Nuclear Man Annual #5; Legends #1-6; Millennium #4",
    yearsCovered: "1986-1988",
    releaseDate: { year: 2025, month: 3 },
    writers: "John Ostrander, Len Wein, Jo Duffy, Steve Englehart",
    pencillers: "Luke McDonnell, John Byrne, Joe Brozowski, Joe Staton, Norm Breyfogle",
    inkers:
      "Karl Kesel, Bob Lewis, Dick Giordano, Dave Hunt, Dennis Janke, Ian Gibson, Pablo Marcos, Sam de la Rosa",
    description:
      "The thrilling first incarnation of Task Force X -- John Ostrander sends Deadshot, Captain Boomerang, and a rotating cast of expendable villains on black-ops missions where death is always on the table.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799500759",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "suicide-squad-c2",
    lineId: "suicide-squad",
    number: "2",
    era: "post-crisis",
    title: "The Nightshade Odyssey",
    start: { year: 1988, quarter: 2 },
    end: { year: 1988, quarter: 4 },
    issuesCollected: "Suicide Squad #11–20, Suicide Squad Annual #1, The Doom Patrol and Suicide Squad Special #1, The Flash #12, Manhunter #1 and #6, Justice League International #13, Deadshot #1–4, Checkmate #1 (1997), and Checkmate #8 (1988)",
    yearsCovered: "1988",
    releaseDate: { year: 2026, month: 7 },
    writers: "John Ostrander, Kim Yale, Paul Kupperberg",
    pencillers: "Luke McDonnell, Erik Larsen, Graham Nolan, Keith Giffen, Steve Erwin",
    inkers: "Bob Lewis, Luke McDonnell, Al Vey, Bob Oksner, Malcolm Jones, Tim Dzon",
    description:
      "The Squad faces betrayal, black ops, and a descent into the supernatural as Nightshade's past comes back to haunt them.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508595",
    ownershipStatus: "announced",
  },
  // --- Team-Ups ---
  {
    kind: "volume",
    id: "team-ups-ba",
    lineId: "team-ups",
    number: "a",
    era: "bronze",
    title: "The Impossible Escape",
    start: { year: 1973, quarter: 2 },
    end: { year: 1976, quarter: 3 },
    issuesCollected: "The Brave and the Bold (1955) #106–130; Stories From Super-Team Family #2 (the Creeper and Wildcat in “Showdown in San Lorenza” by Dennis O’Neil & Ric Estrada); And #3 (Hawkman and the Flash in “The End of the World” by Steve Skeates & Ric Estrada); Covers to Super-Team Family #1, #4–7",
    yearsCovered: "1973-1976",
    releaseDate: { year: 2026, month: 6 },
    writers: "Bob Haney, Dennis \"Denny\" O'Neil, Steve Skeates",
    pencillers: "Jim Aparo, Ric Estrada",
    inkers: "Jim Aparo, Bill Draut, John Calnan, Wally Wood",
    description:
      "Thrilling and unexpected pairings from DC's Bronze Age -- Batman teams with Mister Miracle, Green Arrow, Wonder Woman, Deadman, and even Kamandi in classic Brave and the Bold stories.",
    coverUrl: "https://m.media-amazon.com/images/I/81SaXmVh6fL._SL1500_.jpg",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "team-ups-bb",
    lineId: "team-ups",
    number: "b",
    era: "bronze",
    title: "Chase to the End of Time",
    start: { year: 1978, quarter: 3 },
    end: { year: 1979, quarter: 3 },
    issuesCollected: "DC Comics Presents #1-14; The Brave and the Bold #141-155",
    yearsCovered: "1978-1979",
    releaseDate: { year: 2025, month: 3 },
    writers:
      "Bob Haney, Paul Levitz, Len Wein, Cary Burkett, Martin Pasko, Cary Bates, Steve Englehart, David Michelinie, Jack C. Harris, Mike W. Barr",
    pencillers:
      "Jim Aparo, Joe Staton, José Luis García-López, Dick Dillin, Dick Giordano, Murphy Anderson, Curt Swan, Don Newton, Rich Buckler, Romeo Tanghal",
    inkers:
      "Jim Aparo, Dick Giordano, Frank Chiaramonte, Dan Adkins, Jack Abel, José Luis García-López, Murphy Anderson, Bob Smith, Frank McLaughlin",
    description:
      "Some of the best and most memorable team-ups of the 1970s, including an iconic race between Superman and the Flash.",
    coverUrl: "https://m.media-amazon.com/images/I/91+qXxcESLL._SL1500_.jpg",
    ownershipStatus: "announced",
  },
  // --- Teen Titans ---
  {
    kind: "volume",
    id: "teen-titans-ba",
    lineId: "teen-titans",
    number: "a",
    era: "bronze",
    title: "Terra in the Night!",
    start: { year: 1982, quarter: 3 },
    end: { year: 1983, quarter: 2 },
    issuesCollected: "The New Teen Titans #21–32; The New Teen Titans Annual #1; Tales of the New Teen Titans #1–4; The New Teen Titans (Drug Awareness) #1–3; and Action Comics #536",
    yearsCovered: "1982-1983",
    releaseDate: { year: 2026, month: 10 },
    writers: "Marv Wolfman, George Pérez, Gerry Conway, Paul Kupperberg",
    pencillers: "George Pérez, Curt Swan, Ernie Colon, Gene Colan, Romeo Tanghal, Ross Andru",
    inkers:
      "Romeo Tanghal, Bob Smith, Brett Breeding, Dave Hunt, Dick Giordano, Ernie Colon, Gene Day, Pablo Marcos",
    description:
      "Marv Wolfman and George Perez introduce Terra, a new hero who may not be everything she seems -- her arrival kicks off one of the most celebrated eras in Teen Titans history.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799509332",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "teen-titans-bb",
    lineId: "teen-titans",
    number: "b",
    era: "bronze",
    title: "The Judas Contract",
    start: { year: 1983, quarter: 3 },
    end: { year: 1984, quarter: 3 },
    issuesCollected: "Action Comics #546; World's Finest Comics #300; The New Teen Titans #33-40; The New Teen Titans Annual #2; Tales of the Teen Titans #41-47; Tales of the Teen Titans Annual #3; The Vigilante #3; and more",
    yearsCovered: "1983-1984",
    releaseDate: { year: 2025, month: 2 },
    writers: "Marv Wolfman, George Pérez, Mike W. Barr",
    pencillers: "George Pérez, Keith Pollard, Pablo Marcos",
    inkers: "Romeo Tanghal, Mike DeCarlo, Dick Giordano, Pablo Marcos",
    description:
      "The story that defined the Teen Titans for decades to come -- Terra infiltrates the team and works to unmake it for good, in one of comics' most shocking betrayals.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799500254",
    ownershipStatus: "announced",
  },
  // --- War ---
  {
    kind: "volume",
    id: "war-sa",
    lineId: "war",
    number: "a",
    era: "silver",
    title: "The Big Five Arrive",
    start: { year: 1957, quarter: 1 },
    end: { year: 1957, quarter: 1 },
    issuesCollected: "Our Army at War #54-57, Star Spangled War Stories #53-56, G.I. Combat #44-47, Blackhawk #108-111, Our Fighting Forces #17-20, and All-American Men of War #41-44",
    yearsCovered: "1957",
    releaseDate: { year: 2025, month: 11 },
    writers:
      "Robert Kanigher, Bob Haney, Bill Finger, Dave Wood, Ed Herron, Robert Bernstein, Jack Miller, France Herron",
    pencillers:
      "Ross Andru, Dick Dillin, Joe Kubert, Russ Heath, Jerry Grandenetti, Arthur Peddy, Jack Abel, Robert \"Bob\" Brown, Gene Colan, Gil Kane, Irv Novick, Mort Drucker",
    inkers:
      "Mike Esposito, Chuck Cuidera, Joe Kubert, Russ Heath, Jerry Grandenetti, Arthur Peddy, Jack Abel, Sheldon Moldoff, Robert \"Bob\" Brown, Irv Novick, Joe Giella, Mort Drucker, Robert Stuart",
    description:
      "An explosive collection spanning DC's five war titles plus Blackhawk -- trenches, aerial dogfights, perilous seas, infantry battles, and covert missions brought to life by legendary artists like Joe Kubert and Russ Heath.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799503248",
    ownershipStatus: "announced",
  },
  // --- Western ---
  {
    kind: "volume",
    id: "western-ba",
    lineId: "western",
    number: "1",
    era: "bronze",
    title: "The Hangman Never Loses",
    start: { year: 1970, quarter: 4 },
    end: { year: 1973, quarter: 2 },
    issuesCollected: "Weird Western Tales #12-17; All-Star Western #2-8, #10-11; Super DC Giant #15; Tomahawk #130-140",
    yearsCovered: "1970-1973",
    releaseDate: { year: 2026, month: 4 },
    writers:
      "Robert Kanigher, John Albano, Cary Bates, Joe Kubert, Sergio Aragonés, Dennis \"Denny\" O'Neil, Sam Glanzman, Gil Kane, John Broome, Bob Haney, Don Kraar, France Herron, George Kashdan, Jack Oleck, Jerry DeFuccio, Len Wein, Marv Wolfman, Norman Maurer",
    pencillers:
      "Frank Thorne, Tony DeZuniga, Gil Kane, Gray Morrow, Joe Kubert, Neal Adams, Nick Cardy, Sam Glanzman, Alan Weiss, Alfredo Alcala, Alex Toth, Bill Draut, Carmine Infantino, Fred Ray, Jim Aparo, Jim McArdle, John Severin, Mike Sekowsky, Norman Maurer, Sonny Trinidad",
    inkers:
      "Tony DeZuniga, Frank Thorne, Gray Morrow, Gil Kane, Joe Kubert, Sam Glanzman, Alfredo Alcala, Dick Giordano, Neal Adams, Nick Cardy, Alex Toth, Bernie Wrightson, Bill Draut, Fred Ray, Jim Aparo, Jim McArdle, John Severin, Norman Maurer, Sonny Trinidad, Sy Barry",
    description:
      "DC's Western anthologies gallop into the gray morality of America's frontier -- haunted riders like El Diablo, brutal justice-dealers like Jonah Hex, and conflicted outlaws, told with grit and reckoning.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799507727",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "western-vol-mrz21eq2",
    lineId: "western",
    number: "2",
    era: "bronze",
    title: "Requiem for a Gunfighter",
    start: { year: 1973, quarter: 3 },
    end: { year: 1977, quarter: 4 },
    issuesCollected: "Weird Western Tales #18-43, Jonah Hex #1-7, and a never-before-reprinted Jonah Hex parody story from The Amazing World of DC Comics #13.",
    yearsCovered: "1973-1977",
    releaseDate: { year: 2026, month: 12 },
    writers:
      "Michael Fleisher, John Albano, Arnold Drake, Cary Bates, E. Nelson Bridwell, Sergio Aragonés, Steve Skeates",
    pencillers:
      "Tony DeZuniga, Dick Ayers, George Moliterni, Noly Panaligan, José Luis García-López, Alfredo Alcala, Bill Draut, Doug Wildey, Gil Kane, Luis Dominguez, Rich Buckler",
    inkers:
      "George Evans, Frank Springer, Alfredo Alcala, George Moliterni, Gil Kane, José Luis García-López, Oscar Novelle",
    description:
      "Get ready to hit the trail once more with the second DC Finest: Western volume, which introduces the most steely-eyed and scar-faced stalwart of justice to ever ride the range: Jonah Hex! DC Finest: Western: Requiem for a Gunfighter features a wagon train’s worth of frontier adventures from the bygone years of 1973 through 1977—all crafted by some of comics’ most accomplished hands, including Michael Fleisher, José Luis García-López, John Albano, Tony DeZuniga, Dick Ayers, George Moliterni, Noly Panaligan, and more.",
    coverUrl: jonahHexRequiemForAGunfighterCover,
    ownershipStatus: "announced",
  },
  // --- Wonder Woman ---
  {
    kind: "volume",
    id: "wonder-woman-g1",
    lineId: "wonder-woman",
    number: "1",
    era: "golden",
    title: "Introducing Wonder Woman",
    start: { year: 1941, quarter: 4 },
    end: { year: 1943, quarter: 2 },
    issuesCollected: "Wonder Woman #1-4; All-Star Comics #8; Sensation Comics #1-18; Comic Cavalcade #1-2",
    yearsCovered: "1941-1943",
    releaseDate: { year: 2025, month: 12 },
    writers: "William Moulton Marston, Joyce Murchison",
    pencillers: "Harry G. Peter, Frank Godwin",
    inkers: "Harry G. Peter, Frank Godwin",
    description:
      "The origin of Wonder Woman: her arrival in Man's World with the wounded Steve Trevor, and her secret identity of Diana Prince.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799503361",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "wonder-woman-g2",
    lineId: "wonder-woman",
    number: "2",
    era: "golden",
    title: "Enter the Cheetah",
    start: { year: 1943, quarter: 3 },
    end: { year: 1944, quarter: 3 },
    issuesCollected: "Wonder Woman #5–9, Sensation Comics #19–34, Comic Cavalcade #3–7, and All-Star Comics #20",
    yearsCovered: "1943-1944",
    releaseDate: { year: 2026, month: 2 },
    writers: "William Moulton Marston, Gardner Fox",
    pencillers: "Harry G. Peter, Frank Godwin, Joe Gallagher",
    inkers: "Harry G. Peter, Frank Godwin, Joe Gallagher",
    description:
      "Wonder Woman faces one of her earliest and most dangerous enemies -- the Cheetah -- as Diana battles jealousy, deception, and fierce foes with courage and compassion.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799507444",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "wonder-woman-vol-msifcm5g",
    lineId: "wonder-woman",
    number: "a",
    era: "bronze",
    title: "Judgment in Infinity!",
    start: { year: 1981, quarter: 3 },
    end: { year: 1983, quarter: 3 },
    issuesCollected:
      "Wonder Woman #280-305, The New Teen Titans #11-12, the special 16-page preview story from DC Comics Presents #41, and the never-before-reprinted promotional comic Superman: The Computer Masters of Metropolis #1.",
    yearsCovered: "1981-1983",
    releaseDate: { year: 2027, month: 1 },
    // Split by hand from `creators` -- Wikipedia only says "various" here.
    writers:
      "Paul Levitz, Roy Thomas, Dan Mishkin, Joey Cavalieri, Marv Wolfman, Gerry Conway, Paul Kupperberg, Dann Thomas, Robert Kanigher",
    pencillers:
      "Gene Colan, Joe Staton, Jose Delbo, Mike DeCarlo, Don Heck, George Pérez, Curt Swan, Dick Giordano, Jan Duursema, Keith Giffen, Keith Pollard, Michael Bair, Rich Buckler, Ross Andru",
    inkers:
      "Frank McLaughlin, Romeo Tanghal, Dave Hunt, Steve Mitchell, Bob Smith, Bruce Patterson, Jerry Ordway, Larry Mahlstedt, Tony DeZuniga, Adrian Gonzales, Dick Giordano, Keith Pollard, Mike DeCarlo, Pablo Marcos, Rich Buckler, Rick Bryant, Sal Trapani, Tom Mandrake",
    description:
      "A sweeping collection of Wonder Woman adventures—mythology, action, and cosmic stakes in an expansive, accessible DC Finest collection.\nWonder Woman faces gods, monsters, and threats that stretch far beyond the mortal world.\nAs Diana’s adventures grow in scale and ambition, she is drawn into battles that test her strength, her compassion, and her role as a champion of both humanity and the divine. From mythological trials to universe-spanning conflicts, each story pushes her further as a hero and a warrior.\nSpanning a major run of stories, this volume brings together action, fantasy, and adventure in one immersive collection—offering a wide-ranging look at Wonder Woman’s world and the challenges she must overcome.",
    coverUrl: wonderWomanJudgementInInfinityCover,
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "wonder-woman-ba",
    lineId: "wonder-woman",
    number: "b",
    era: "bronze",
    title: "The Legend of Wonder Woman",
    start: { year: 1983, quarter: 4 },
    end: { year: 1986, quarter: 3 },
    issuesCollected: "Wonder Woman #306-329; DC Comics Presents #76; Blue Devil #10; The Legend of Wonder Woman #1-4",
    yearsCovered: "1983-1986",
    releaseDate: { year: 2025, month: 7 },
    writers:
      "Dan Mishkin, Joey Cavalieri, Kurt Busiek, Trina Robbins, Mindy Newell, Gary Cohn, Gerry Conway",
    pencillers:
      "Don Heck, Mark Beachum, Tim Burgard, Trina Robbins, Michael Bair, Stan Woch, Dan Spiegle, Eduardo Barreto, Irv Novick, Pablo Marcos, Rod Whigham",
    inkers:
      "Don Heck, Gary Martin, Rick Magyar, Trina Robbins, Frank Giacoia, Stan Woch, Pablo Marcos, Rodin Rodriguez, Dan Spiegle, Eduardo Barreto, Mike DeCarlo, Rick Bryant",
    description:
      "Long out-of-print Wonder Woman stories from the 1980s, from Dan Mishkin's run through Kurt Busiek and Trina Robbins's The Legend of Wonder Woman miniseries.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799502012",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "wonder-woman-ca",
    lineId: "wonder-woman",
    number: "a",
    era: "post-crisis",
    title: "Origins & Omens",
    start: { year: 2007, quarter: 1 },
    end: { year: 2009, quarter: 3 },
    issuesCollected: "Wonder Woman (2006) #14-35, Brave & Bold #7, Outsiders: Five of a Kind - Wonder Woman and Grace #1",
    yearsCovered: "2007-2009",
    releaseDate: { year: 2024, month: 11 },
    writers: "Gail Simone, Marc Andreyko, Mark Waid, Tony Bedard",
    pencillers:
      "Aaron Lopresti, Bernard Chang, Terry Dodson, Ron Randall, Cliff Richards, George Pérez",
    inkers:
      "Matt Ryan, Bernard Chang, Rachel Dodson, Ron Randall, Art Thibert, Bob Wiacek, Jon Holdredge",
    description:
      "Gail Simone's beloved run begins with 'The Circle,' continuing through 'Ends of the Earth,' 'Rise of the Olympian,' and 'Warkiller' -- Diana's most personal and mythic threats yet.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781779528346",
    ownershipStatus: "announced",
  },
  {
    kind: "volume",
    id: "wonder-woman-cb",
    lineId: "wonder-woman",
    number: "b",
    era: "post-crisis",
    title: "Dawn Before Darkness",
    start: { year: 2009, quarter: 4 },
    end: { year: 2010, quarter: 3 },
    issuesCollected: "Wonder Woman #36–44 and #600, Secret Six #10–14, Blackest Night: Wonder Woman #1–3, and DCU Halloween Special '09 #1",
    yearsCovered: "2009-2010",
    releaseDate: { year: 2026, month: 5 },
    writers:
      "Gail Simone, Greg Rucka, Amanda Conner, Geoff Johns, J. Michael Straczynski, Louise Simonson, Mandy McMurray",
    pencillers:
      "Nicola Scott, Aaron Lopresti, Fernando Dagnino, Eduardo Pansica, Amanda Conner, Bernard Chang, Chris Batista, Don Kramer, George Pérez, Scott Clark, Scott Kolins, Travis Moore",
    inkers:
      "Doug Hazlewood, Mark McKenna, Matt Ryan, BIT, Jonathan Glapion, Amanda Conner, Bernard Chang, Bob Wiacek, David Beaty, Drew Geraci, Eber Ferreira, Michael Babinski, Mike Sellers, Prentis Rollins, Raul Fernandez, Scott Clark, Scott Koblish, Scott Kolins, Walden Wong",
    description:
      "Diana's world comes under siege from enemies without and doubts within -- Paradise Island descends into strife, a celestial invasion looms, and Wonder Woman faces betrayal, rebirth, and supernatural reckoning.",
    coverUrl: "https://images.penguinrandomhouse.com/cover/9781799508113",
    ownershipStatus: "announced",
  },
  // --- Hitman ---
  {
    kind: "volume",
    id: "dc-finest-hitman-msdw2v0w-vol-msdw79r0",
    lineId: "dc-finest-hitman-msdw2v0w",
    number: "1",
    era: "post-crisis",
    title: "A Rage in Arkham",
    start: { year: 1993, quarter: 4 },
    end: { year: 1997, quarter: 2 },
    issuesCollected:
      "The Demon Annual #2, The Demon #42-45 and #52-54, Batman Chronicles #4, Hitman #1-14, and pages from JLA #5",
    yearsCovered: "1993-1997",
    releaseDate: { year: 2027, month: 4 },
    writers: "Garth Ennis",
    pencillers: "John McCrea",
    inkers: "John McCrea, D'Israeli, Luke McDonnell",
    description:
      "DC Finest spotlights the origin of Hitman, as Garth Ennis and John McCrea launch a cult-classic antihero saga in Gotham's criminal underworld.\nTommy Monaghan is a Gotham City hitman with an unusual advantage: telepathy, X-ray vision, and a talent for surviving situations that should kill him.\nWorking among organized crime, corrupt officials, supernatural threats, and costumed vigilantes, Tommy navigates a dangerous world where loyalty is rare, and every job could be his last. Armed with a sharp sense of humor and a practical view of life, he quickly discovers that superpowers create just as many problems as they solve.\nBefore starring in his own series, Tommy first appeared alongside Etrigan the Demon, becoming an unlikely ally in a series of supernatural adventures that helped establish his place within the DC Universe. These stories chart his evolution from supporting player to leading man, laying the foundation for one of DC's most acclaimed cult-classic antiheroes.\nWritten by Garth Ennis and illustrated by John McCrea, Hitman combines crime fiction, black comedy, supernatural action, and genuine emotional depth into a uniquely entertaining series that remains a fan favorite decades after its debut.",
    coverUrl: hitmanRageInArkhamCover,
    ownershipStatus: "announced",
  },
  // --- Romance ---
  {
    kind: "volume",
    id: "dc-finest-romance-msasa36s-vol-msasdnxc",
    lineId: "dc-finest-romance-msasa36s",
    number: "a",
    era: "silver",
    title: "Escape from Loneliness",
    start: { year: 1963, quarter: 2 },
    end: { year: 1963, quarter: 3 },
    issuesCollected:
      "Falling in Love #58-61, Girls’ Romances #91-94, Girls’ Love Stories #94-97, Heart Throbs #83-85, and Secret Hearts #86-89",
    yearsCovered: "1963",
    releaseDate: { year: 2027, month: 1 },
    writers: "Robert Kanigher, Phyllis Reed",
    pencillers:
      "Arthur Peddy, Bernard Sachs, John Romita Sr., Bill Draut, Werner Roth, John Rosenberger, Mike Sekowsky, Tony Abruzzo",
    inkers: "Bernard Sachs, John Romita Sr., Arthur Peddy, Jay Scott Pike, John Rosenberger",
    description:
      "Love—and heartbreak—is in the air in this new DC Finest volume!\nReturn to those moonstruck days of the Silver Age, when comics readers everywhere could find an endless supply of romantic inspiration for 12 cents an issue in the peerless pages of DC’s legendary line of love story anthologies.\nThese passionate tales of romance and intrigue—carefully crafted by a host of comics’ finest hands, including John Romita, Robert Kanigher, Mike Sekowsky, Phyllis Reed, and more—will leave you breathless and yearning for more! Known for their bold storytelling and iconic imagery, many of these panels later became touchstones in the broader art world, influencing the graphic language of pop art and artists.",
    coverUrl: romanceEscapeFromLonelinessCover,
    ownershipStatus: "announced",
  },
  // --- The Atom ---
  {
    kind: "volume",
    id: "dc-finest-the-atom-msj7gzpt-vol-msj8bqsu",
    lineId: "dc-finest-the-atom-msj7gzpt",
    number: "1",
    era: "silver",
    title: "Birth of the Atom",
    start: { year: 1961, quarter: 4 },
    end: { year: 1964, quarter: 4 },
    issuesCollected:
      "The Atom #1-15, Showcase #34-36, The Brave and the Bold #53 and #55, Strange Adventures #135 and #145, and Justice League of America #7, #14, and #18.",
    yearsCovered: "1961-1964",
    releaseDate: { year: 2027, month: 5 },
    writers: "Gardner Fox, Bob Haney, John Broome",
    pencillers: "Gil Kane, Mike Sekowsky, Alex Toth, Murphy Anderson, Ramona Fradon",
    inkers: "Murphy Anderson, Sid Greene, Bernard Sachs, Alex Toth, Charles Paris, Mike Sekowsky",
    description:
      "A microscopic hero with massive challenges—discover the origin and early adventures of the Atom, in an accessible and comprehensive DC Finest presentation.\nRay Palmer is a scientist who discovers a way to shrink himself to microscopic size-becoming a superhero unlike any other.\nAs the Atom, he uses his incredible abilities to take on threats both large and small, navigating a world where danger can exist at any scale. From high-stakes battles to scientific discoveries, each adventure pushes him to master his powers and find his place as a hero.\nAcross a wide range of stories, these early adventures introduce a character driven by curiosity, ingenuity, and determination—bringing science fiction concepts and superhero action together in a unique and engaging way.\nCollecting foundational stories and key appearances, this volume offers an accessible introduction to one of DC's most inventive and unconventional heroes.",
    coverUrl: theAtomBirthOfTheAtomCover,
    ownershipStatus: "announced",
  },
  // --- The Question ---
  {
    kind: "volume",
    id: "dc-finest-the-question-msi8ihr7-vol-msi8qcyr",
    lineId: "dc-finest-the-question-msi8ihr7",
    number: "1",
    era: "silver",
    title: "Zen and Violence",
    start: { year: 1967, quarter: 2 },
    end: { year: 1989, quarter: 1 },
    issuesCollected:
      "The Question #1-15, Blue Beetle (Charlton) #1-5, Americomics Special #1, Mysterious Suspense #1, Blue Beetle (DC) #4-7, Who’s Who Update ‘87 #4, Who’s Who: The Definitive Directory of the DC Universe #19, and The Charlton Bullseye #1 and #5",
    yearsCovered: "1967-1989",
    releaseDate: { year: 2027, month: 3 },
    writers:
      "Dennis \"Denny\" O'Neil, Steve Ditko, D.C. Glanzman, Len Wein, Steve Skeates, Roger Stern, Michael Uslan, Benjamin Smith",
    pencillers: "Denys Cowan, Steve Ditko, Paris Cullins, Alex Toth, Dan Reed",
    inkers:
      "Rick Magyar, Steve Ditko, Bruce Patterson, Albert Val, Alex Toth, Bill Black, Bob McLeod, Dan Reed, Dell Barras",
    description:
      "A dark, thought‑provoking crime saga—the Question confronts corruption, identity, and moral truth in this expansive DC Finest collection of early stories.\nIn a city where corruption runs deep, justice is anything but simple.\nVic Sage operates as the Question, a faceless investigator determined to expose the truth—no matter the cost. But in Hub City, every answer leads to another question, and every case pulls him deeper into a system built on power, fear, and control.\nAs his search for justice continues, Sage is forced to confront not only the criminals around him, but his own beliefs, identity, and what it truly means to do the right thing in a broken world.\nSpanning a major run of stories that include all the character’s original appearances in the Charlton titles from creator Steve Ditko as well as the first 15 issues of his celebrated revival by Dennis O’Neil and Denys Cowan in the 1980s, this volume offers a wide-ranging look at the Question’s evolution, blending crime storytelling, action, and philosophical depth in one immersive collection.",
    coverUrl: theQuestionZenAndViolenceCover,
    ownershipStatus: "announced",
  },
  // --- Warlord ---
  {
    kind: "volume",
    id: "dc-finest-warlord-msdxdi2p-vol-msdxgesm",
    lineId: "dc-finest-warlord-msdxdi2p",
    number: "1",
    era: "bronze",
    title: "This Savage World",
    start: { year: 1975, quarter: 4 },
    end: { year: 1980, quarter: 3 },
    issuesCollected: "Warlord #1-36 and 1st Issue Special #8",
    yearsCovered: "1975-1980",
    releaseDate: { year: 2027, month: 2 },
    writers: "Mike Grell",
    pencillers: "Mike Grell",
    inkers: "Mike Grell, Vince Colletta, Joe Rubinstein",
    description:
      "Adventure, survival, and fantasy collide in this DC Finest spotlight on a modern man lost in a dangerous, hidden world.\nTravis Morgan was a pilot—until a crash changed everything.\nAfter flying into a mysterious opening at the North Pole, he finds himself in Skartaris, a hidden world filled with ancient kingdoms, deadly creatures, powerful sorcery, and constant danger. Stranded far from home, Morgan must rely on his skill, determination, and instincts to survive.\nAs he navigates this unpredictable land, he becomes a reluctant hero, forging alliances, facing powerful enemies, and shaping the fate of a world he never knew existed.\nCombining fast-paced action with fantasy and adventure, these stories introduce a hero caught between two worlds; one familiar and one full of endless possibilities.\nThis volume collects the earliest adventures of the Warlord, offering an accessible entry point into one of DC’s most unique and beloved fantasy series.",
    coverUrl: warlordTheSavageWorldCover,
    ownershipStatus: "announced",
  },
];
