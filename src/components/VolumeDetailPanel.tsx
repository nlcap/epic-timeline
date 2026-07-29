import { useRef, useState } from "react";
import type { Line, OwnershipStatus, Volume } from "../types";
import { OWNERSHIP_META, OWNERSHIP_ORDER } from "../lib/ownership";
import { volumeBadgeText } from "../lib/era";
import { useSlidePanel } from "../hooks/useSlidePanel";

// One option row is py-1.5 padding (12px) + text-sm line height (20px) =
// 32px, plus the dropdown's own py-1 (8px) container padding -- used to
// guess the picker's rendered height before it's actually mounted, so the
// open-above decision (see openAbove below) can be made in the same click
// that opens it instead of flashing open-below-then-correcting.
const OWNERSHIP_OPTION_HEIGHT = 32;
const DROPDOWN_HEIGHT_ESTIMATE = OWNERSHIP_ORDER.length * OWNERSHIP_OPTION_HEIGHT + 8;

export function VolumeDetailPanel({
  volume,
  line,
  status,
  onStatusChange,
  onEdit,
  onDelete,
  onClose,
  speculative = false,
}: {
  volume: Volume;
  line: Line;
  status: OwnershipStatus;
  onStatusChange: (status: OwnershipStatus) => void;
  onEdit?: (volume: Volume) => void;
  onDelete?: (volumeId: string) => void;
  onClose: () => void;
  /** Speculative volumes don't carry ownership state -- hides the shelf
   * status picker entirely. */
  speculative?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // Decided once, when the picker opens (not continuously re-checked while
  // it's open) -- the button's own position doesn't change while the list
  // is up, so there's nothing to react to afterward the way VolumeTile's
  // hover preview needs to for scroll.
  const [openAbove, setOpenAbove] = useState(false);
  const pickerButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = OWNERSHIP_META[status];
  const { visible, closeThen } = useSlidePanel();

  const togglePicker = () => {
    if (!pickerOpen) {
      const rect = pickerButtonRef.current?.getBoundingClientRect();
      setOpenAbove(!!rect && rect.bottom + DROPDOWN_HEIGHT_ESTIMATE > window.innerHeight);
    }
    setPickerOpen((o) => !o);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => closeThen(onClose)}
    >
      <div
        className={`flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-neutral-800 bg-[#252526]/50 p-6 backdrop-blur-sm transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          {onEdit && (
            <button
              type="button"
              onClick={() => closeThen(() => onEdit(volume))}
              className="flex items-center justify-center gap-2 rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium text-white hover:border-neutral-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit Volume
            </button>
          )}
          <button
            type="button"
            onClick={() => closeThen(onClose)}
            className="ml-auto text-sm text-neutral-400 hover:text-white"
          >
            Close ✕
          </button>
        </div>

        {volume.coverUrl ? (
          <img
            src={volume.coverUrl}
            alt=""
            className="mx-auto mt-4 h-auto w-full max-w-[75%] rounded-md"
          />
        ) : (
          <div className="mt-4 flex h-64 w-full items-center justify-center rounded-md bg-neutral-800 text-sm text-neutral-500">
            Cover image
          </div>
        )}

        <h2 className="mt-4 text-xl font-bold text-white">{volume.title}</h2>
        <p className="text-sm italic text-neutral-300">
          Vol. {volumeBadgeText(volume)}, {volume.yearsCovered} • {volume.creators}
        </p>
        <p className="mt-2 text-sm text-neutral-300">
          Collects {volume.issuesCollected}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-200">
          {volume.description}
        </p>

        {!speculative && (
          <div className="relative mt-6">
            <button
              ref={pickerButtonRef}
              type="button"
              onClick={togglePicker}
              className="flex items-center gap-2 rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-white"
            >
              <img src={meta.iconUrl} alt="" className="h-3 w-3" />
              {meta.label}
              <span className="text-neutral-500">▾</span>
            </button>

            {pickerOpen && (
              <div
                className={`absolute left-0 z-10 w-44 rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg ${
                  openAbove ? "bottom-full mb-1" : "top-full mt-1"
                }`}
              >
                {OWNERSHIP_ORDER.map((s) => {
                  const m = OWNERSHIP_META[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onStatusChange(s);
                        setPickerOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-white hover:bg-neutral-800"
                    >
                      <img src={m.iconUrl} alt="" className="h-3 w-3" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onDelete && (
          <div className="mt-6">
            {confirmingDelete ? (
              <div className="rounded-md border border-red-900 bg-red-950/40 p-4">
                <p className="text-sm text-red-200">
                  Are you sure you want to delete "{volume.title}"? This can't be undone.
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => closeThen(() => onDelete(volume.id))}
                    className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Yes, delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full rounded-md border border-transparent px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300"
              >
                Delete Volume
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
