# Conan (Marvel era), Rom, Micronauts and Planet of the Apes

Source: **marvel.fandom.com**, the Marvel Database. Same MediaWiki family as the
DC Database and the same numbered story slots (`Writer1_1`, `Penciler2_1`), so
the original DC method applies directly — this is the closest of the four wikis
to that first one.

## Whole-issue reprints, and why they count here

Some issues carry no credits at all. Their page records only where the material
came from:

```
| ReprintOf1      = Savage Tales Vol 1 1
| ReprintOfStory1 = 1
```

**Adventures on the Planet of the Apes is entirely this** — all eleven issues
reprint the black-and-white magazine strips in colour. The standing rule is that
reprinted stories don't count, but applying it here would have left the book
with *no creators at all*, when Doug Moench, George Tuska, Alfredo Alcala and
Mike Ploog are exactly who made the comics in it. So where an issue has no
credits of its own, the `ReprintOf` pointer is followed to the original story.
Where an issue has its own credits, reprints are still skipped as before.

That also recovered Conan the Barbarian #16, #22, #64 and #78, which are
reprint issues inside an otherwise original run.

## Anthologies: slots verified by reading the issue

- `Chamber of Darkness 4` → story **3**, the Starr the Slayer proto-Conan (and
  what Conan the Barbarian 16 reprints — the pointer confirms the slot)
- `Savage Sword of Conan 1` → story **1**, "Curse of the Undead-Man"; the issue
  also carries Red Sonja and Blackmark, which are not collected
- `Marvel Preview 4` → story **2**, and `Marvel Preview 7` → story **4**: Bill
  Mantlo's *The Sword in the Star*, his proto-Micronauts serial. That is why
  two Star-Lord anthologies sit in a Micronauts collection, and it is not
  guessable from the contents line alone.

## Page-name traps

`Micronauts: The New Voyages` is filed as **Micronauts Vol 2**. The Rom
crossover issues are ordinary single-story books collected whole (Power Man and
Iron Fist 73, Marvel Two-In-One 99, Incredible Hulk 296) and need no filtering.

## Names

Merged: Barry Smith → **Barry Windsor-Smith** · Ernie Chua → **Ernie Chan**
(the same clerical-error alias found in the DC pass) · Butch Guice → **Jackson
Guice** · Dan Bulanadi → **Danny Bulanadi** · Josef Rubinstein → **Joe
Rubinstein**.

`Crusty Bunkers` and `The Tribe` are studio credits rather than people, and are
kept deliberately — same treatment as `Shuster Shop` in the DC data.

## Not in this wiki

**Conan Chronicles (8 volumes) and King Conan Chronicles (1) are Dark Horse**,
not Marvel, and none of their series resolve here — `Conan Vol 2`, `Conan the
Cimmerian`, `Conan the Avenger`, `Conan: Road of Kings` and `Conan the Slayer`
are all absent. They need conan.fandom.com or another source.

---

# The Dark Horse Conan run — Comic Vine

**Conan Chronicles (8 volumes) and King Conan Chronicles (1)** are Dark Horse,
and no wiki covers them. The Marvel Database is Marvel-published only, so
`Conan Vol 2`, `Conan the Cimmerian`, `Conan the Avenger`, `Conan: Road of
Kings` and `Conan the Slayer` are all simply absent. conan.fandom.com exists but
is oriented to the Howard prose and the Lancer paperbacks — its "Conan the
Avenger" is a 1968 novel, not the 2014 comic, and there are no per-issue pages
for this era at all.

**Comic Vine** is the fallback and has per-issue `person_credits`. Volume ids
were verified on name, start year *and* Dark Horse as publisher, since several
series share a name across publishers and eras:

| series | id | note |
|---|---|---|
| Conan (2004) | 10612 | #0 is a separate volume, "Conan: The Legend" (19634) |
| Conan the Cimmerian (2008) | 21896 | |
| Conan: Road of Kings (2010) | 37497 | a 2012 one-shot shares the name |
| Conan the Barbarian (2012) | 44351 | Dark Horse, not the Marvel run |
| Conan the Avenger (2014) | 73235 | |
| Conan the Slayer (2016) | 92175 | |
| Conan and the Midnight God (2006) | 18939 | seed says 2007 |
| King Conan: The Scarlet Citadel (2011) | 39124 | |
| King Conan: The Phoenix on the Sword (2012) | 45383 | |
| Conan: The Phantoms of the Black Coast (2012) | 53601 | |

Nearly every one of these has a second Comic Vine volume with the same name and
a later year holding the collected edition, so filtering on start year matters.

**Comic Vine's role strings are user-maintained and sometimes wrong** — lettering
studios come back tagged as inkers. `Comicraft` was being counted as an inker on
King Conan; studios are filtered by name rather than trusted.

**No inkers on several volumes is correct, not missing.** Cary Nord's Conan run
was painted over pencils with no separate inker, and Comic Vine reflects that.

## Open

- `kcc-1` also lists "material from Age of Conan: Hyborian Adventures (2006) #1",
  which is not counted — it's a promotional tie-in and hasn't been resolved.
- The API key used for this lives outside the repository and is read from a file
  at run time; it must never be committed, as this repo is public.
