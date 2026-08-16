# Sample data

Optional payloads you can load into the app by hand. Nothing here is imported
by the build — the app never reads this folder.

## `ownership-overrides.json`

Shelving status for 450 volumes (397 shelved, 45 alt format, 6 ordered, 2 out
of print), across the Marvel Epic Collection and DC Finest lines.

Two uses:

- **Demo data.** The seed marks every volume `announced`, so a fresh install
  is an empty shelf and the owned/unowned tile treatments all look alike.
  Loading this fills the timeline in and shows the app with a real collection
  behind it.
- **Restore point.** This shelving used to live in the seed files themselves,
  which meant shipping one contributor's collection to everyone who opened the
  app. It was lifted out when the seed became a clean slate; this is that data,
  unchanged.

The file matches the app's own `epic-timeline:ownership-overrides` localStorage
format exactly — a flat `volumeId -> status` map listing only non-default
statuses — so it loads without conversion. In the browser console:

```js
// Merge into whatever is already set locally.
const snapshot = /* paste the file's contents */;
const key = "epic-timeline:ownership-overrides";
const current = JSON.parse(localStorage.getItem(key) ?? "{}");
localStorage.setItem(key, JSON.stringify({ ...snapshot, ...current }));
location.reload();
```

Spreading `current` last means anything already changed in the app wins over
the file. Swap the order to let the file overwrite instead.

Overrides are stored per browser origin, so a dev server on a new port starts
empty — load it again there if you want the collection visible while
developing.
