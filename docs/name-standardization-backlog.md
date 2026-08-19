# Creator-name standardization — deferred until all the data is in

Held deliberately: standardizing before the last collection is researched would
mean doing it twice, and the Modern Marvel Epic line (96 volumes) still carries
its original seed credits. This file records what's known so the pass can be
mechanical when it happens.

1,983 distinct names across the five data files as of the Classic Marvel rebuild.

## 1. Same person, different spelling across files — 13 known

The only ones that differ purely by accent, punctuation or case. Each needs one
canonical form picked and applied everywhere.

| forms | where |
|---|---|
| Carlos Garzon / Carlos **Garzón** | classic / licensed |
| David Lopez / David **López** | modern (both) |
| Ethan **Van** Sciver / Ethan **van** Sciver | classic, modern |
| Ivan Velez Jr / Ivan Velez **Jr.** | classic, dc-finest |
| J. M. DeMatteis / **J.M.** DeMatteis | licensed / classic, dc-finest |
| John Romita Jr / John Romita **Jr.** | modern / classic, modern |
| Leandro Fernandez / Leandro **Fernández** | licensed / modern |
| Mike Deodato Jr / Mike Deodato **Jr.** | modern / four files |
| Ronnie **Del** Carmen / Ronnie **del** Carmen | dc-finest / licensed |
| Sam **De La** Rosa / Sam **de la** Rosa | dc-finest / classic, licensed |
| Jim McCann / Jim **Mccann** | modern (both) |

**Two are outright data bugs, not variants:** `Jim Cheung,` and `Olivier Coipel,`
carry a trailing comma in `modern-marvel-epic.ts`. They come from the original
seed, and researching that line will clear them.

## 2. The rule that made the within-file merges safe

A wiki redirect proves two spellings are one person, but it points at the wiki's
**article title**, which is frequently the formal name. Recording credits *as
published* means the redirect should decide only *who is the same person* — the
form to keep is whichever the credits themselves use most. Applying redirects
blindly turns Walt Simonson into Walter Simonson and Mike Ploog into Michael
Ploog.

Wookieepedia does **not** redirect creator names, so Star Wars was grouped by
accent, middle initial, nickname and edit distance instead.

## 3. Decisions already made, to keep or revisit

- **Never merge John Romita Sr. and Jr.** Different people. The bare "John
  Romita" was folded into Sr. because nine Classic volumes carried both.
- **Names stored without an internal comma** — `Ivan Velez Jr.`, `José Marzan
  Jr.`, `Mike Deodato Jr.` — because a comma splits the field into two people.
  This constraint is structural and any standardization must preserve it.
- **Held back deliberately:** creators who changed their name are recorded as
  published — Jim Owsley (annotated with Christopher Priest at your direction),
  Tony Isabella, Andrew Pepoy, Dennis Cramer, Barbara Randall, Joyce Murchison.
  This is an editorial choice, not an oversight.
- **`Dennis "Denny" O'Neil`** is the one name given a bespoke form.
- **Studio credits are people-shaped but are not people** and are kept as-is:
  `Crusty Bunkers`, `The Tribe`, `Shuster Shop`. Comic Vine additionally
  mis-tags lettering studios as inkers (`Comicraft`), which is filtered.

## 4. Near-neighbours that are NOT the same person

Verified and deliberately left apart, so a future fuzzy pass doesn't merge them:
C.P. Smith / Cam Smith · Gary Martin / Mark Martin · Alan Davis / Dan Davis ·
Bob Haney / Bob Kane · Bob Smith / Tod Smith · Don Kraar / Don Kramer ·
Joe Giella / Joe Gill · John Wagner / John Warner / Ron Wagner ·
Mike Roy / Mike Royer · Chris Gardner / Chris Warner · Dave Cooper / Dave Hoover.

Also: Sheldon Moldoff's page lists "Bob Kane" as a pseudonym, but that records
**ghosting for** a separate real person. "Charles Nicholas" is a shared house
name. Neither is an identity.
