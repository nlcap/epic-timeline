# Classic Marvel Epic Collections — 383 of 386 volumes

Source: **marvel.fandom.com**. This turned out to be the best source of the five
used across this project, and the method is the simplest.

## The Epic Collection page states its own contents exactly

Every Epic Collection has a Marvel Database page whose infobox lists each
collected item as a pair:

```
| ReprintOf2      = Amazing Spider-Man Vol 1 1
| ReprintOfStory2 = 1
| ReprintOf3      = Amazing Spider-Man Vol 1 2
| ReprintOfStory3 = 2
```

That is the **exact issue page and story slot** for every item. No title
matching (DC), no venue-from-prose join (Aliens), no story-name resolution
(Wookieepedia), and no character-relevance filter anywhere — the collection
states precisely what is in it, including which story out of an anthology
issue. The same `reprint_sources()` written for the Planet of the Apes reprint
problem parses it unchanged.

Page names derive mechanically: `Epic Collection: <Line> Vol 1 <N>`, dropping a
leading "The". **379 of 386 resolved on the first try.** Two need a name fix —
`Ant-Man/Giant Man` (no hyphen on "Giant") and `Morbius the Living Vampire` —
and three have no page at all, being past the wiki's latest: Captain America
Vol. 24, Ghost Rider Vol. 4, Master of Kung Fu Vol. 3. Those three keep their
original seed credits.

## Names: 1,143 down to 1,053

Marvel's wiki redirects creator-name variants the way the DC Database does, so
the redirect test works here: two spellings resolving to one page is the wiki
asserting one person. 143 redirects were found among the names in use.

**But the redirect points at the wiki's article title, which is often the formal
name — and the house rule is to record the credit as published.** Merging
blindly turned Walt Simonson into Walter Simonson and Vinnie Colletta into
Vince Colletta. So the merge target is chosen by **frequency in the credits
themselves**: whichever spelling the source actually uses most wins, and the
redirect only decides *which names are the same person*. That keeps Mike Ploog
and Bob Brown as published rather than formalising them.

Three cases needed deciding by hand:

- **John Romita Sr. and Jr. are different people** and must never merge. Nine
  volumes carried both "John Romita" and "John Romita Sr." as if they were two
  men; the bare form is merged into Sr., since his son is in this data too.
- `Ivan Velez, Jr.` is stored **without** the comma, which would otherwise split
  it into two people in a comma-separated field — the same reason José Marzan Jr.
  is stored that way.
- `Tony Isabella` and `Jim Owsley` redirect to later names. Held back, matching
  the decision made in the DC pass: the published credit stands.

An explicit override must beat the frequency choice *and* have its reverse
removed, or the two mappings swap the names back and forth — that bug shipped
into a first pass and was caught by seeing both Romita forms survive. The map
is now asserted acyclic before it is applied.

## Gotchas

- A handful of collection pages list plain titles (`Fantastic Four #5`) where
  the rest give page names (`Fantastic Four Vol 1 5`). Normalised on read; Doctor
  Doom Vol. 1 was silently empty until this was handled.
- A transient fetch failure once killed a whole batch before anything was saved.
  The runner now saves after each volume and isolates per-volume errors.
- Items with no story credits — treasury editions, FOOM, Marvel Vision, some
  Super Specials — are logged and skipped rather than guessed at.
