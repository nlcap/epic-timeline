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
