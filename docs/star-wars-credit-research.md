# Star Wars credit research — method and open gaps

Same job as the DC Finest rebuild, different sources: **Wookieepedia**
(starwars.fandom.com) for issue credits, Dark Horse and Marvel listings for the
collected editions. 54 volumes across 12 lines.

## Wookieepedia is the same MediaWiki API, and easier than DC's

`https://starwars.fandom.com/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1&titles=A%7CB`

Same batching (40 pages a request) and the same curl-not-WebFetch rule. The
templates are simpler than DC Database's:

```
{{ComicBook
|writer=[[Tom Veitch]]
|penciller=[[Chris Gossett]]
|inker=[[Mike Barreiro]]
```

Named fields rather than `Writer1_1`/`Penciler2_1` slots, because Star Wars
issues are nearly all single-story. Collected editions use `{{ComicCollection}}`,
which carries the same creator fields as a roster plus a `COLLECTING:` line —
the equivalent of DC's `IssueList`, and usable for the same cross-check.

Value formats differ from DC's and drove the parser: bulleted lists across
lines (`*[[A]]\n*B`), `<br />` separators, `{{C|inker}}` role annotations, and
role notes in parentheses. **Resolve links and strip parentheticals before
splitting**, or "(script and story)" splits its own name in two. The suffix
guard from the DC pass carries over.

## Drive off the collection page, not the contents string

The first pass parsed the seed's `issuesCollected` string and resolved each
series to a page prefix by search. That works, but it is the hard way round and
it is where every error came from. **Every volume's Wookieepedia collection page
has a `==Contents==` section that links directly to each collected article**, so
the correct page names are given rather than guessed. 53 of the 54 volumes have
one, at `Star Wars Legends Epic Collection: <Line> Vol. <N>` (Infinities drops
the `Vol.`; Original Marvel Years Vol. 7 has no page yet).

That removed the entire page-naming problem below, which is kept only as a
record of what search gets wrong if you ever do need it.

Contents entries come in three forms, and the last two are what make anthology
material tractable:

```
*[[Tales of the Jedi – Dark Lords of the Sith 1|...]]        -> whole issue
*{{Tales|23|Shadows and Light}}                              -> one story
*"The Saga of Nomi Sunrider" Part 1 of 3 -- [[Dark Horse Comics 7|...]]
```

## Anthologies: solved

*Star Wars Tales*, *Dark Horse Comics*, the UK weeklies and the rest carry
`writer=Various` and no usable infobox credits. But each story is its own
`{{ComicStory}}` article with the same field names, and the anthology issue's
`==Contents==` links to them. So a volume collecting one story out of an
anthology resolves to exactly that story's creators.

Two wrinkles. A story can be filed under a disambiguated title (`Lucky (comic
story)`), so match on the issue's contents links rather than the bare name. And
where an anthology *previewed* another book, the link goes to the previewed
issue under the story's name in the label -- Dark Horse Comics 7 lists
`[[Tales of the Jedi 3|The Saga of Nomi Sunrider, Part 1 of 3]]` -- so the
resolver matches on link label as well as target and accepts a `{{ComicBook}}`.

**Wiki quirk worth knowing:** Dark Horse Comics 7, 8 and 9 all link Parts 1, 2
and 3 to `Tales of the Jedi 3`. Parts 2 and 3 are excerpts of #4 and #5, so
those two issues' artists are under-counted in Tales of the Jedi Vol. 3. Left as
the wiki has it.

## Names

Wookieepedia does **not** redirect creator-name variants the way the DC Database
does, so the redirect trick that settled the DC sweep is unavailable here; the
470 names were grouped by accent/punctuation, middle initial, nickname and edit
distance instead. Merged: Ramon/Ramón/Ramón F. Bachs · Curtis/Curtis P. Arnold ·
Howard/Howard M. Shum · Mark/Mark G. Heike · Michael/Michael A. Stackpole ·
Dan/Daniel Kurt Thorsland · Dave/David Ross · Doug/Douglas Wheatley ·
Rob/Robert Chestney · Walt/Walter Simonson · Haden/W. Haden Blackman ·
Rich Perrota/Perrotta · Adriana Melo/Melos · Tim/Timothy Truman ·
Dave/David Land · J. W./Jonathan W. Rinzler · Pop Mahn/Mhan.

**Not merged:** C.P. Smith and Cam Smith, Gary Martin and Mark Martin — near
neighbours, different people.

Credit fields also carry annotations that had to be stripped before splitting,
or they become people: `Dave Land as Paul Alden`, `Dub with Niko Henrichon`.

## Page naming (only needed without a collection page)

There is no derivable rule. The "Star Wars:" prefix is usually dropped but
sometimes kept, a year disambiguator appears only when needed, and en-dashes
replace hyphens inconsistently:

`Star Wars (1977) 1` · `Dawn of the Jedi: Force Storm 1` · `Legacy (2006) 1` ·
`Rebellion 1` · `Tales of the Jedi – The Sith War 1` · `X-Wing Rogue Squadron 1`
(no colon) · `Star Wars: Dawn of the Jedi 0` (prefix kept)

Search resolves most series but **confidently returns the wrong one** often
enough that it can't be trusted unattended: *Republic* → an Epic Collection
page, *X-Wing: Rogue Squadron* → *Rogue Leader*, *Rebellion* → *Return of the
Jedi – The Rebellion*, *The Sith War* → *Dark Lords of the Sith*, *Chewbacca* →
*Han Solo & Chewbacca*. Verified prefixes live in `swmanual.py`; each was
confirmed by fetching the page and reading credits back.

Two more traps. `Droids 1` and `Chewbacca 1` are **disambiguation pages** — the
real articles are `Droids (1986) 1` and `Chewbacca (2000) 1`. And `Republic`
starts at **#46**, continuing the numbering from `Star Wars (1998)`.

## Anthologies have no infobox credits

*Star Wars Tales*, *Dark Horse Comics*, the UK weeklies (*Star Wars Weekly*,
*The Empire Strikes Back Monthly*), *Star Wars Kids*, *Dark Horse Extra* and
*Pizzazz* carry no `writer`/`penciller` fields at all — Tales sets an
`anthology=` flag and the magazines index their stories in the article body
instead. A volume collecting one story out of one of these can't be tallied
from the infobox, and these are exactly the "material from …" entries in the
seed's contents lists.

**Not yet handled.** These need story-section parsing from the article body, or
a second source. Affected so far: Star Wars Tales #23 and Dark Horse Comics
#7-9 in Tales of the Jedi Vol. 3.

## Done

**53 of 54 volumes** — 338 writer, 426 penciller and 299 inker credits across
all twelve Star Wars lines. Rise of the Sith was redone rather than extended,
since its old `pencillers` held a combined art credit rather than a true split.

`swomy-7` (The Original Marvel Years Vol. 7) is the one gap: no collection page
exists on Wookieepedia yet.

## Known holes

Some collected items have no infobox credits of their own and are skipped rather
than guessed: the two Force Unleashed graphic novels, the *Knights of the Old
Republic* in-universe documents (`The Taris Holofeed`, `The Admiral's List` and
the rest), a few *Star Wars Tales* entries, and several prose short stories.
Each is logged by the runner. A volume missing one of these is short by that
item's creators, not by an issue.

Volumes where no issue credits an inker (KOTOR, for instance) store no `inkers`
field at all, so the detail panel reads "Art by" rather than showing an empty
line — the right result for full-art work, though it is indistinguishable from
"not researched" in the data.
