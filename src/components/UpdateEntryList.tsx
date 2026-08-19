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
 * The date-grouped, sticky-header changelog list -- shared by UpdatesModal
 * (the full history) and WhatsNewModal (just what's landed since a
 * visitor's last visit), so the two agree on how an entry looks.
 */
export function UpdateEntryList({ releases }: { releases: UpdateRelease[] }) {
  return (
    <>
      {releases.map((release) => (
        <section key={release.date}>
          {/* Sticky so the date stays readable while scrolling a long
           * day like 16 August. Opaque rather than translucent -- entry
           * text scrolling visibly under it reads as a rendering bug. */}
          <h3 className="sticky top-0 z-10 bg-neutral-900 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {formatUpdateDate(release.date)}
          </h3>
          <ul className="divide-y divide-neutral-800 border-t border-neutral-800">
            {release.entries.map((entry) => (
              <Entry key={entry.title} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
