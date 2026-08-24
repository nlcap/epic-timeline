import { formatUpdateDate, UPDATE_KIND_META, type UpdateEntry, type UpdateRelease } from "../data/updates";

function KindBadge({ kind }: { kind: UpdateEntry["kind"] }) {
  const { label, className } = UPDATE_KIND_META[kind];
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

/** Badge and title share one wrapping row rather than sitting in two
 * columns: "Under the hood" is three times the width of "New", so a fixed
 * badge column would either clip it or indent every other title to match
 * the widest one. */
function Entry({ entry }: { entry: UpdateEntry }) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <KindBadge kind={entry.kind} />
        <h4 className="text-sm font-semibold text-white">{entry.title}</h4>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{entry.description}</p>
    </li>
  );
}

/**
 * The scrollable, date-grouped changelog list -- shared by UpdatesModal
 * (the full history) and WhatsNewModal (just what's landed since a
 * visitor's last visit), so the two agree on how an entry looks.
 *
 * Owns its own `overflow-y-auto` scroller (callers just drop this in
 * below their own header, not a wrapping div) -- keep the real section
 * content directly inside it, in normal flow. An earlier version tried
 * moving the masking fix below into a separate `position: absolute`
 * sibling, in its own wrapper div: that broke scrolling entirely, because
 * this element's `flex-1 min-h-0` sizing depends on holding real,
 * in-flow content -- a `flex: 1 1 0%` item's hypothetical size (what an
 * auto-height flex container sums to decide its own height) is 0 for an
 * empty box, so with nothing forcing SettingsModal's `max-h-[85vh]` card
 * to actually reach that cap, the "scroller" collapsed to 0px instead of
 * filling it. Keeping real content in normal flow, exactly as before, is
 * what makes the card hit its cap and this element fill the remainder.
 */
export function UpdateEntryList({ releases }: { releases: UpdateRelease[] }) {
  return (
    <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
      {releases.map((release) => (
        <section key={release.date}>
          {/* Sticky so the date stays readable while scrolling a long
           * day like 16 August. Opaque rather than translucent -- entry
           * text scrolling visibly under it reads as a rendering bug.
           * Still locks at top:0 (unchanged), but -mt-1.5/pt-3.5 (6px
           * more than the pb-2 it's paired with) extends the painted box
           * 6px above that lock line -- a fast wheel/trackpad fling can
           * scroll several pixels between the browser compositing this
           * sticky element's layer and the content layer scrolling
           * behind it (a static check -- set scrollTop, read
           * getBoundingClientRect -- won't reproduce this; both settle
           * to a pixel-perfect match once scrolling actually stops), and
           * a 1px overlap wasn't enough margin to reliably cover that gap
           * during a real fling (reported by Nick after the first pass). */}
          <h3 className="sticky top-0 z-10 -mt-1.5 bg-neutral-900 pb-2 pt-3.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {formatUpdateDate(release.date)}
          </h3>
          <ul className="divide-y divide-neutral-800 border-t border-neutral-800">
            {release.entries.map((entry) => (
              <Entry key={entry.title} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
