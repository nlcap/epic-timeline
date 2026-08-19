import { SettingsModal } from "./SettingsModal";
import {
  formatUpdateDate,
  UPDATE_KIND_META,
  UPDATES,
  type UpdateEntry,
  type UpdateKind,
} from "../data/updates";

/** This page is public-facing and feature-focused, so bug fixes, polish and
 * invisible-to-a-reader refactors/tooling sit out of it -- data/updates.ts
 * keeps every entry regardless, this is purely a display filter. A release
 * with nothing left after filtering drops out of the list rather than
 * showing an empty day. */
const HIDDEN_KINDS: ReadonlySet<UpdateKind> = new Set(["fixed", "internal", "improved"]);

const PUBLIC_RELEASES = UPDATES.map((release) => ({
  ...release,
  // `inProgress` entries -- daily slices of a still-running effort like the
  // DC Finest/Licensed credit research -- sit out too, alongside the hidden
  // kinds above; see UpdateEntry's own doc for why.
  entries: release.entries.filter((entry) => !HIDDEN_KINDS.has(entry.kind) && !entry.inProgress),
})).filter((release) => release.entries.length > 0);

const ENTRY_COUNT = PUBLIC_RELEASES.reduce((total, release) => total + release.entries.length, 0);

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
 * The changelog, read from data/updates.ts. Reached from the settings menu
 * on desktop and mobile alike (see TopNav's settingsItems), and built on
 * the same SettingsModal shell as the other dialogs.
 *
 * Wider than the rest of them (max-w-2xl vs. the default xl) because this
 * is the only one whose content is prose -- a paragraph set to the width
 * that suits Reset's checklist runs to too many short lines to read
 * comfortably.
 */
export function UpdatesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <SettingsModal title="Updates" onClose={onClose} maxWidthClassName="max-w-2xl">
      <p className="mt-1 shrink-0 text-xs text-neutral-500">
        {ENTRY_COUNT} changes across {PUBLIC_RELEASES.length} days, newest first.
      </p>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {PUBLIC_RELEASES.map((release) => (
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
      </div>
    </SettingsModal>
  );
}
