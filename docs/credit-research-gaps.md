# Credit research — open gaps and questions

Running list of things the issue-by-issue credit rebuild couldn't settle. Everything here is
either a source I couldn't reach, or a judgment call worth a second opinion. Nothing in this
list is blocking; the affected volumes have credits, they're just incomplete or inferred.

Method notes live in the session scratchpad; the short version is: contents come from each
book's `(Collected)` page on DC Fandom, credits from the individual issue pages, reprints are
detected via the `{{AppearanceGrab}}` template, and names are ordered by how many stories each
person worked on.

---

## 1. Sources I could not reach

| Volume | Source | Why |
|---|---|---|
| The Question: Zen and Violence | **Americomics Special #1** | AC Comics publication — DC Fandom has no page for it and never will. |
| Catwoman: To Catch a Thief | **Catwoman Plus #1** | Page exists on DC Fandom but is a 48-byte stub with no story or credit data. |
| Batman: A Lonely Place of Dying | **Batman Villains Secret Files 2005 #1** | Only the *1998* issue (`Batman Villains Secret Files and Origins Vol 1 1`) exists on the wiki. The 2005 book appears to be absent. |
| The Question: Zen and Violence | **Who's Who #19** and **Who's Who Update '87 #4** | Both issues exist, and both confirm a Question entry, but Who's Who credits dozens of artists per issue without mapping them to individual entries — the Question page's artist can't be isolated. |

| Supergirl: Body & Soul | **Supergirl Plus #1** | No page on DC Fandom. |
| Supergirl: Die and Let Live | **Supergirl/Prysm Double-Shot #1**, **Team Superman Secret Files #1**, **Supergirl #1 (Million/ML)** | No pages found under the obvious names. |

| Teen Titans: The Judas Contract | **The Vigilante #3** | No page under that name. |
| Teen Titans: Terra in the Night! | **New Teen Titans (Drug Awareness) #1-3** | Promotional giveaways; no obvious page names. |

| Peacemaker: Kill for Peace | **Fightin' Five #40-41** | No page under that name; the Charlton series may be filed differently. |

| Harley Quinn: Birth of the Mirth | **The Batman Adventures: Mad Love #1** | No page under any obvious name. |

**comics.org (Grand Comics Database)** would likely resolve most of these — it records per-story
credits and reprint data. It is behind a Cloudflare bot-verification wall, and I won't work
around bot detection, so it needs a human. It's the single best next step for this whole list.

---

## 2. Judgment calls worth checking

- **"Green Lantern Annual #3"** (Green Lantern: Setting Up Shop) — I matched this to
  *Tales of the Green Lantern Corps Annual #3*. The seed lists "Tales of the Green Lantern Corps
  Annual #2" and "Green Lantern Annual #3" as separate items, and that annual series only ran
  #1-3, so it's the likely referent — but it is an inference, not a confirmed identification.
  It pulled in a lot of names (Alan Moore, Kurt Busiek, José Luis García-López, P. Craig
  Russell, Kevin Nowlan, Terry Austin), so it's worth being right about.

- **Batman Secret Files #1** (Catwoman: Creatures of the Night) — the issue's "Profile Pages"
  feature credits ten pencillers for ten different characters. Only Catwoman's page counts.
  I took Scott Beatty (writer) and Jim Balent (the Catwoman artist of that era). Reasonable,
  but the wiki doesn't say which artist drew which profile.

- **Jon L. Blummer** (both JSA volumes) — the Hop Harrigan backups have blank credits on most
  issue pages. Blummer is confirmed on All-Star #7's and appears in both collected rosters with
  no other story that could account for him, so I credited him for the rest.

- **Pierce Rice** (JSA: Psycho-Pirate) — the issue page (All-Star #18) credits him as penciller;
  the collected page lists him as an inker. He's in both fields currently.

- **Metamorpho: The Element Man / The Brave and the Bold #88** — the seed lists this issue, but
  its only story is "Batman and Wildcat: Count to Ten" with no Metamorpho anywhere in it. I
  excluded it, which means Irv Novick is not credited. Either the seed's issue list is wrong or
  Metamorpho appears uncredited in the character data.

- **The Stray Superdog** — the "stories from" sources are filtered to Superman Family characters
  (Krypto, Supergirl, Lois, Jimmy et al.), excluding Superman solo stories, per Nick's rule.
  That's a character judgment applied across ~30 issues rather than a contents list, since this
  volume has no `(Collected)` page.

---

## 3. Seed data that looks wrong (flagged, not changed)

- **`superman-b1` Kryptonite Nevermore** — `issuesCollected` says Superman "#240-246", but the
  contents jump 244 → 246. #245 is not in the book. (#239 is already correctly absent.)
- **`superman-family-sa` The Giant Turtle Man** — `issuesCollected` omits Action Comics #278,
  Superboy #87/#90/#92 and Adventure Comics #287, all of which the collection draws from.
- **`metamorpho-vol-msj6qztx` How to Make a Super-Hero** — `yearsCovered` is still "1972-2009",
  but the issue list Nick supplied ends at Justice League Europe #11-12 (1990). The 2009 endpoint
  came from Wednesday Comics material that is no longer in the list. Its `writers`/`pencillers`
  are also stale for the same reason and need a rebuild.
- **`batman-vol-mshrqobd` Night of the Stalker** — set to Batman #246-**261** per Nick. DC's own
  solicitation text (PRH, Amazon, retailers) says #246-281, which the 584-page count rules out.
  Our data deliberately differs from the published blurb.

---

## 3b. Known limit of the reprint detector

Reprints are normally identifiable because DC Fandom replaces the story's appearance list with
`{{AppearanceGrab|<original issue>|<story#>}}`. **This is not universal.** Two Seven Soldiers of
Victory reprints in the Justice League of America #111-112 hundred-pagers carry full, ordinary
appearance data and are indistinguishable from new material by that test alone. I caught them
because 1940s creators (Bill Finger, Mort Weisinger, Creig Flessel, Hal Sherman, Jack Lehti,
George Papp, Mort Meskin) turned up in a 1973-76 book, which is implausible on its face.

So the detector is a strong filter, not a complete one. Any volume containing giant-size issues
deserves a sanity check on whether the creator list makes sense for the era. Volumes rebuilt
before this was discovered were re-verified, but only against the template test.

---

## 4. Name variances and same-person candidates

Swept 2026-08-18 across all 683 distinct names in `dc-finest.ts` (2,365 credit slots). Marvel and
Licensed were excluded — those lines haven't been re-researched yet, so their names aren't stable
enough to compare. Five passes: exact-match after stripping accents/punctuation/case; match after
dropping a Jr./Sr. suffix; same first and last name with a differing middle initial; nickname vs
formal first name on a shared surname; and edit distance on the full name. Then every name was
looked up on the DC Database, because **a wiki redirect is the reliable test** — if two spellings
resolve to one page, the wiki is asserting they're one person. That last pass found everything the
string matching missed.

### Applied

- **Dennis "Denny" O'Neil** — all 21 credits, merging 20 "Dennis" and 1 "Denny".
- **Jim Owsley (Christopher Priest)** — the one Owsley-era credit (Batman: The Killing Joke vol).
  Credits published as Christopher Priest stay plain "Christopher Priest"; there are two.

Five *descriptions* still say "Denny O'Neil" or "Dennis O'Neil" in running prose. Those are DC's
marketing copy, not credit fields, and were left alone.

### Confirmed one person, both spellings present — not yet merged

Each pair below is a single wiki page, so these are duplicates in the data rather than two people.
Direction is a choice: the wiki's canonical form is on the right, but the house rule has been to
print the credit as published.

| in the data | in the data | wiki canonical |
|---|---|---|
| Bill Montez (1) | Bill Montes (1) | Bill Montes |
| Ernie Chua (1) | Ernie Chan (5) | Ernie Chan — "Chua" was a clerical error early in his DC run |
| Bruce Patterson (6) | Bruce D. Patterson (4) | Bruce D. Patterson |
| France Herron (2) | Ed Herron (1) | Ed Herron |
| J.J. Birch (1) | Joe Brozowski (3) | Joe Brozowski — Birch is his pseudonym |
| Bill Dennehy (1) | Murray Boltinoff (2) | Murray Boltinoff — Dennehy is his pseudonym |
| Barbara Randall (1) | Barbara Kesel (3) | Barbara Kesel — married name |

### One spelling present; the wiki files the person under a different name

Not duplicates — nothing to merge. Only a question of whether to print the published credit or the
name the person goes by now. **Several of these are people who changed their names, so this is not
a mechanical decision and none of it has been applied.**

Arthur Adams → Art Adams · Arthur Peddy → Arthur F. Peddy · Arthur Cazeneuve → Arturo Cazeneuve ·
Bernard Sachs → Bernie Sachs · Sy Barry → Seymour Barry · Howard Shum → Howard M. Shum ·
Raul Fernandez → Raúl Fernández · Joyce Murchison → Joye Hummel · Derec Aucoin → Derec Donovan ·
Andrew Pepoy → Margeaux Pepoy · Tony Isabella → Jenny Blake Isabella ·
Dennis Cramer → Justine Mara Andersen

`José Marzan Jr.` is deliberately *not* matched to the wiki's `José Marzan, Jr.` — the comma form
would split into two people in a comma-separated field.

**This also closes an open Events question.** Justine Mara Andersen was listed as an inker on both
Zero Hour collected pages while no story credited her; Dennis Cramer was the reverse, credited on
Legionnaires #18 but absent from DC's roster. They are the same person. DC's roster used the
current name and the issue pages the published one.

### Checked and rejected — different people despite looking alike

Sheldon Moldoff's staff page lists "Bob Kane" under Pseudonyms, but that records Moldoff
**ghosting for** Kane, who is a separate real person — merging them would be badly wrong. Likewise
"Charles Nicholas" is a shared house name, not one person. Edit-distance also paired Alan/Dan
Davis, Bob Haney/Bob Kane, Bob Smith/Tod Smith, Chris Gardner/Chris Warner, Dave Cooper/Dave
Hoover, Don Kraar/Don Kramer, Joe Giella/Joe Gill, John Wagner/John Warner, John Wagner/Ron
Wagner, and Mike Roy/Mike Royer — all genuinely different people.

Earlier merges that still stand: Arthur Cazenueve → Arthur Cazeneuve · Doug Hazelwood → Doug
Hazlewood · Rus Sever → Russ Sever · Pete Krause → Peter Krause. "Shuster Shop" is a studio
credit, not a person, and is kept deliberately.

**Page-name traps.** Several series are filed under names that don't match the seed's wording.
Worth checking before concluding a source is missing: Green Lantern #201-205 are under *Green
Lantern Corps* (post-renumbering); *New Teen Titans*, *Infinity Inc.* and *Spectre* drop
articles/punctuation the seed includes; *Batman 80-Page Giant* has no colon; *Catwoman: Defiant*
has no volume suffix; the Doom Patrol collected page is under "**The** Doom Patrol". A missing
page usually means a naming mismatch, not absent data.

---

## 5. The Events volumes (added last — the seven crossovers)

Events is the one line where a character-relevance filter is useless: every volume spans 20+
titles, and a crossover chapter told from another character's side looks irrelevant right up
until you read it. Everything below was decided from contents lists, not from character matching.

**Only three of the seven have a collected page on the wiki** — Crisis Part One, and both Zero
Hour volumes. Crisis Parts Two/Three/Four and Legends Part One have none, so for those I took
every non-reprint story in each collected issue. That is right for these books, which collect
crossover chapters whole, but it will over-count if DC actually collected only part of an issue.
Those four are the least certain of the 99.

**The IssueList is not always complete.** This is new, and it means a collected page is not by
itself sufficient:

- *Crisis Part One* — the IssueList omits the second story in All-Star Squadron #52,
  "Shanghaied into Hyperspace! – Interlude One". DC's own roster lists Gardner Fox, Sheldon
  Moldoff, Al Dellinges and Joe Kubert, who appear nowhere else in the book, which is how I
  found it. Added.
- *Zero Hour Part One* — the IssueList is missing Outsiders #11 and both Showcase '94 #8–9
  stories, all three of which the seed's contents list names. Outsiders #11 accounts for Mike W.
  Barr, Paul Pelletier and Robert Campanella. Added.

Cross-checking the per-story tally against the collected page's own Writer/Penciler/Inker roster
is what caught both. It should stay part of the method.

### Judgment calls in this line

**The "Shanghaied into Hyperspace!" interludes** (All-Star Squadron #52, #55, #56, #58, #59) are
recreated Golden Age Hawkman chapters — Gardner Fox and Sheldon Moldoff's original story, redrawn
by Al Dellinges, with new framing credited to Roy Thomas. **I counted them.** They are not marked
as reprints on the wiki, Roy Thomas has a new-writing credit, and DC lists all four creators in
the collected roster. If you'd rather treat recreations as reprints, these are the stories to pull.

**Who's Who #10 and #16–18 are excluded from Crisis Part Four.** The wiki files each Who's Who
issue as a single story slot carrying every contributor to that alphabetical range — 20 to 29
pencillers apiece, most of them drawing characters with no Crisis connection. DC Finest collects
only selected entries and the wiki gives no per-entry breakdown, so including them would have
added roughly sixty names on no evidence. Excluding them loses a handful of real credits; the
alternative corrupts the list. **Worth doing by hand from the physical book.**

**Partial issues taken.** Christmas with the Super-Heroes #2 → only the Deadman story "Should
Auld Acquaintance Be Forgot" (Alan Brennert / Dick Giordano), the Crisis epilogue; the other five
are unrelated Christmas shorts. The Omega Men #33 → only "Storm Warnings", the crossover chapter,
not the "Demon with the Healing Mind" backup. Both are inferences from content, not from a
contents list — check if you have the books.

### Unresolved

- **Justine Mara Andersen** is listed as an inker on *both* Zero Hour collected pages but is not
  credited on any story in either volume on the wiki. Not included. Likely an uncredited assist.
- **Dennis Cramer** is the reverse: credited on Legionnaires #18 on the issue page, but absent
  from DC's roster for Zero Hour Part One. Included — the issue page is the better source.

### More page-name traps

*Amethyst, Princess of Gemworld* #13 is under **Amethyst Vol 2** (the 1985 ongoing; Vol 1 is the
1983 maxi). *JLA: Incarnations* has **no colon** — "JLA Incarnations Vol 1 5". *Legends of the DC
Universe: Crisis on Infinite Earths* is a one-shot filed at the bare series name with **no issue
suffix**. The 1993 *Outsiders* is Vol 2.

`Rus Sever` redirects to **Russ Sever**, and `Pete Krause` is **Peter Krause** — both now merged.
Checking whether a name is a wiki redirect is a quick way to settle a spelling disagreement
between an issue page and a collected page.
