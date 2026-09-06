/**
 * Ids for lines and timeline entries the user creates.
 *
 * These are the keys the override stores are built on (see overrideKeys.ts),
 * so a collision doesn't just look odd -- two records sharing an id means
 * the second silently overwrites the first, and neither export/import nor
 * reset can tell them apart afterwards.
 *
 * The suffix used to be `Date.now().toString(36)`, which collides outright
 * for anything created inside the same millisecond. That is hard to do by
 * hand and easy to do any other way -- a paste-and-save loop, a future
 * bulk-add, or two entries created by one click.
 *
 * Eight hex characters of `crypto.randomUUID()` rather than the whole
 * thing: these ids already carry a readable prefix and travel in every
 * export, so the extra 28 characters would be noise in a file people read.
 * Four billion values is far past what a hand-curated timeline needs.
 * `crypto.randomUUID` needs a secure context, which both GitHub Pages
 * (https) and local dev (localhost) are -- it's already relied on for
 * saved Sandbox timelines and custom era ids.
 */
export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
