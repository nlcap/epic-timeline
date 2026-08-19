# Aliens credit research — method and open questions

Source: **avp.fandom.com** (the Alien vs. Predator wiki). Same MediaWiki API as
the DC Database and Wookieepedia, and a **third** template model.

## Articles are per-series, not per-issue

There is no article for "Aliens #3". There is one for the *series*, with the
issues each creator worked on annotated inline:

```
{{Infobox Comic Book
|writer = [[Mark Verheiden (author)|Mark Verheiden]]
|penciller = [[Mark A. Nelson]] (#1-6)<br>[[Ron Randall]] (#6)
|inker = Mark A. Nelson
```

That annotation is the credit weight. Ordering by "number of issues worked on"
still holds: Mark A. Nelson counts 6 against Ron Randall's 1 on *Outbreak*,
which a per-series tally alone would have shown as a tie. Where a series carries
no annotation, its issue count from our own contents list is used instead.

Note `Mark Verheiden (author)` — creator pages are disambiguated against
in-universe characters, so link text must be resolved, not the target.

## Drive off our contents, not the wiki's collection pages

The wiki has `Aliens: The Original Years Volume 1-4` pages with a
`==Stories Included==` list, but **they do not match how this line is split
here** — the wiki's Volume 1 lists 26 series where ours collects three plus two
shorts. The wiki is unreliable on which Marvel collection holds what, so the
seed's `issuesCollected` is authoritative and each series is resolved
individually. The wiki's story lists are still useful as a *name pool*.

## The Dark Horse retitles

The original series were renamed for collection, and the wiki files them under
the new names. Ours → theirs:

`Aliens (vol. 1)` → **Aliens: Outbreak** · `Aliens (vol. 2)` → **Aliens:
Nightmare Asylum** · `Aliens: Earth War` → **Aliens: Female War** · `Aliens 3` →
**Alien 3 (comic)** · `Aliens Salvation` → **Aliens: Salvation**

Two more traps: `Aliens: Colonial Marines` is a **disambiguation** page (the
comic is `Aliens: Colonial Marines (comic series)`), and `Aliens: Space Marines`
is an overview page with no infobox at all — the twelve toy pack-in comics are
separate articles (*Desert Storm*, *Operation: Rescue*, *Hive War* …).

## Matching the "material from" shorts

Our contents name a venue and issue ("material from Dark Horse Presents #24,
42–43") while the wiki names the story. Neither infobox carries the other's key
— but the **article's opening prose does**, e.g. "published by Dark Horse Comics
in the anthology series *Dark Horse Presents* #24". Extracting venue and issue
number from that prose matched every short cleanly:

Theory of Alien Propagation = DHP #24 · Advent/Terminus = DHP #42-43 · Countdown
= Dark Horse Insider #14-27 · The Alien = DHP #56 · Horror Show = DHC #3-5 ·
Taste = DHC #11 · Backsplash = DHC #12-13 · Cargo = DHC #15-16 · Alien = DHC
#17-19 · Mondo Pest = DHC #22-24 · Incubation = DHP #101-102 · Lucky = A Decade
of Dark Horse #3

## Done

All five volumes. `al-4` previously carried literal **"TBC"** placeholders in
its writers and pencillers — those are gone.

## Open

- `al-5` lists `Aliens: Stronghold #104`, which looks like bad seed data; the
  wiki has *Stronghold* as a one-shot. Treated as one issue.
- Weighting is per-issue only where the wiki annotates it; otherwise the whole
  series is credited to everyone named on it, which slightly over-weights a
  creator who worked on part of a run without the wiki saying so.
