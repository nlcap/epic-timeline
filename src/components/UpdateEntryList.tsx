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
           * The h3's own box (position, size, padding) is completely
           * unchanged -- the absolutely-positioned span below is a pure
           * add-on cover strip, anchored to the h3 itself (already a
           * positioned element via `sticky`, so no extra `relative` is
           * needed) and extending 2px above its top edge. That covers
           * the seam a fast wheel/trackpad fling can leave between this
           * element's compositor layer and the content layer scrolling
           * behind it (a static check -- set scrollTop, read
           * getBoundingClientRect -- won't reproduce this; both settle
           * pixel-perfect once scrolling actually stops).
           *
           * Deliberately NOT a negative margin or a transform: a first
           * attempt used -mt/pt (negative margin compensated by extra
           * padding), which shipped, was verified in Chromium, but still
           * showed the gap for Nick in Firefox -- a negative top margin
           * on a section's first child can collapse with the section's
           * own margin in browser-inconsistent ways, which a margin-free
           * absolute overlay sidesteps entirely. A translateY alternative
           * was considered too, but it only relocates the box (2px more
           * coverage above costs 2px less below) rather than genuinely
           * extending it -- this absolute span adds coverage without
           * taking any away. */}
          <h3 className="sticky top-0 z-10 bg-neutral-900 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <span aria-hidden="true" className="absolute inset-x-0 -top-0.5 h-0.5 bg-neutral-900" />
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
