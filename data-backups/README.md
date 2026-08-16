# Data backups

Snapshots of data that used to live in the seed files but was personal rather
than universal. Nothing here is imported by the app — these are plain records
kept for restoring by hand.

## `ownership-snapshot-2026-08-16.json`

Nick's own shelving status for 450 volumes (397 shelved, 45 alt format, 6
ordered, 2 out of print), as it stood in the seed data before the seed was
reset to a clean slate.

The seed used to ship this collection to everyone who opened the app, which
only made sense while Nick was the only user. Volumes now all seed as
`announced`, so a new user starts from nothing and tracks their own.

The file is shaped exactly like the app's own
`epic-timeline:ownership-overrides` localStorage payload — a flat
`volumeId -> status` map, listing only the non-default statuses — so it can be
restored as personal overrides without any conversion. In the browser console
on the running app:

```js
// Merge the snapshot into whatever you've already set locally.
const snapshot = /* paste the file's contents */;
const key = "epic-timeline:ownership-overrides";
const current = JSON.parse(localStorage.getItem(key) ?? "{}");
localStorage.setItem(key, JSON.stringify({ ...snapshot, ...current }));
location.reload();
```

Spreading `current` last means anything you've already changed in the app wins
over the snapshot. Swap the order to let the snapshot overwrite instead.

Overrides are stored per browser origin, so a dev server on a new port starts
empty — restore there separately if you want your collection visible while
developing.
