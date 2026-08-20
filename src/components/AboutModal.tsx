import { SettingsModal } from "./SettingsModal";

/**
 * Copyright/affiliation disclaimer, reached from the settings menu on
 * desktop and mobile alike (see TopNav's settingsItems). Built on the same
 * SettingsModal shell as the other dialogs -- see UpdatesModal for the
 * sibling example.
 */
export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <SettingsModal title="About Epic Timeline" onClose={onClose}>
      <div className="mt-3 space-y-3 text-sm text-neutral-300">
        <p>
          Epic Timeline is an unofficial, non-commercial fan project for
          tracking Marvel Epic Collection and DC Finest trade paperback
          lines. It is not affiliated with, endorsed by, or sponsored by
          Marvel Entertainment, DC Comics, or their respective parent
          companies.
        </p>
        <p>
          All character names, titles, cover art, and related content shown
          here are trademarks and copyrights of their respective owners,
          used for reference and cataloging purposes only.
        </p>
        <p>
          The app's original source code and design are open for personal
          and other noncommercial use under the{" "}
          <a
            href="https://github.com/polyformproject/polyform-licenses/blob/master/PolyForm-Noncommercial-1.0.0.md"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            PolyForm Noncommercial License
          </a>
          . Commercial use is not permitted.
        </p>
        <p>
          Questions or comments? Email:{" "}
          <a
            href="mailto:epictimeline.io@gmail.com"
            className="text-blue-400 underline hover:text-blue-300"
          >
            epictimeline.io@gmail.com
          </a>
        </p>
      </div>
    </SettingsModal>
  );
}
