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

## Page naming is the real work

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

- **Tales of the Jedi 1-3** — 16, 18 and 17 issues tallied. Vol. 1 is the whole
  Dawn of the Jedi run by one team (Ostrander/Duursema/Parsons); Vols. 2-3 open
  up to five pencillers and seven inkers against two writers.

## Still to do

51 volumes. Rise of the Sith (2) has writers and pencillers from the earlier
pass but no inkers, and its `pencillers` still holds a combined art credit — it
needs redoing against the issues, not just extending.
