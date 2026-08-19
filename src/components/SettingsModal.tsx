import { createPortal } from "react-dom";
import { useEffect, type ReactNode } from "react";
import { useOverlay } from "../hooks/useOverlay";

/**
 * Shared portal + backdrop + centered-card shell behind every settings-menu
 * dialog (ExportDataButton/ImportDataButton/ResetLineDataButton/
 * StorageDebugPanel) -- each independently reimplemented this same
 * structure: a fixed full-screen backdrop that closes on click, a centered
 * scrolling wrapper so a tall card scrolls the page instead of overflowing
 * it, the card itself with a stopPropagation click guard so clicking inside
 * doesn't close it, and a title + Close ✕ header row. Callers own only
 * what's actually specific to them -- the body content between the header
 * and the card's own bottom edge.
 *
 * Callers gate mounting themselves (`if (!open) return null;`) before
 * rendering this; it doesn't take an `open` prop of its own.
 */
export function SettingsModal({
  title,
  onClose,
  maxWidthClassName = "max-w-xl",
  scrollable = true,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Tailwind max-width utility for the card -- each dialog's content needs
   * a different amount of room (e.g. Reset's short checklist vs. Export's
   * full-width JSON textarea). */
  maxWidthClassName?: string;
  /** Caps the card at 85vh and lets its content scroll internally, instead
   * of letting a tall card grow past the viewport. On by default; a caller
   * that turns this off still needs to keep its content short, since the
   * card then has no internal scroll region of its own. */
  scrollable?: boolean;
  children: ReactNode;
}) {
  // Every centered settings dialog goes through this shell, so this is the
  // one place that needs to tell useGlobalShortcuts to stand down while one
  // is up -- see useOverlay.
  useOverlay();

  // Escape closes, same as the backdrop and the Close ✕. The side panels
  // have had this since useEscapeToClose (which is built around
  // useSlidePanel's closeThen, and so doesn't fit a dialog that pops rather
  // than slides), but none of the five dialogs built on this shell did --
  // including the keyboard-shortcuts cheat sheet, which listed
  // "Esc -- Close the open panel" and then ignored it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-6" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center">
        <div
          className={`flex w-full flex-col rounded-md border border-neutral-700 bg-neutral-900 p-5 shadow-xl ${
            scrollable ? "max-h-[85vh] " : ""
          }${maxWidthClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-neutral-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
