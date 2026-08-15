import { useEffect, useRef, useState, type RefObject } from "react";
import type { Collection } from "../types";
import epicTimelineLogo from "../assets/logo_epic_timeline.svg";
import { ExportDataButton } from "./ExportDataButton";
import { ImportDataButton } from "./ImportDataButton";
import { ResetLineDataButton } from "./ResetLineDataButton";
import { StorageDebugPanel } from "./StorageDebugPanel";

const NAV_HEIGHT = 48;
export { NAV_HEIGHT };

/** Filter-slider icon, always visible at the search box's right edge --
 * the small blue dot overlays it once any filter facet is applied (see
 * App.tsx's filtersActive). Sits just right of the clear-X (when that's
 * showing too), so both live inside the same box rather than as separate
 * nav-bar buttons. */
function FilterIconButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Filters"
      aria-haspopup="dialog"
      aria-pressed={active}
      title="Filters"
      className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-neutral-500 hover:text-white"
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
        <line x1="3" y1="6" x2="6" y2="6" />
        <line x1="10" y1="6" x2="21" y2="6" />
        <line x1="8" y1="3.5" x2="8" y2="8.5" />
        <line x1="3" y1="12" x2="14" y2="12" />
        <line x1="18" y1="12" x2="21" y2="12" />
        <line x1="16" y1="9.5" x2="16" y2="14.5" />
        <line x1="3" y1="18" x2="10" y2="18" />
        <line x1="14" y1="18" x2="21" y2="18" />
        <line x1="12" y1="15.5" x2="12" y2="20.5" />
      </svg>
      {active && <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-blue-500" />}
    </button>
  );
}

function SearchBox({
  value,
  onChange,
  filtersActive,
  onOpenFilters,
  onClearFilters,
  inputRef,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
  /** Clears whatever filters are currently applied -- fired alongside
   * onChange("") when the clear-X is clicked, so one click clears both a
   * text search and any active status filters. */
  onClearFilters: () => void;
  /** Imperative focus target for the "/" global shortcut (see App.tsx) --
   * optional since only one of this component's two call sites (the
   * always-mounted desktop nav, not the mobile menu's copy) needs to be
   * reachable that way. */
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
}) {
  // The clear-X used to only show once there was text to clear; now it
  // also does double duty clearing filters, so it shows whenever there's
  // either to clear -- the filter icon alone stays visible always.
  const showClear = value.length > 0 || filtersActive;
  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter lines..."
        aria-label="Filter lines"
        className="h-9 w-full rounded-md border border-neutral-700 bg-transparent px-3 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:bg-neutral-900 focus:outline-none"
        style={{ paddingRight: showClear ? "3.25rem" : "1.75rem" }}
      />
      {showClear && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            if (filtersActive) onClearFilters();
          }}
          aria-label="Clear search and filters"
          className="absolute right-8 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-neutral-500 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-3.5 w-3.5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
      <FilterIconButton active={filtersActive} onClick={onOpenFilters} />
    </div>
  );
}

/**
 * Just the dropdown trigger + menu -- the four dialogs it opens
 * (Export/Import/Reset/Storage debug) are owned and rendered by the parent
 * (TopNav), not here, since the mobile hamburger menu below needs to open
 * the exact same dialogs. Owning a second copy of that open/close state and
 * a second set of dialog instances here (as this component used to) meant
 * every edit to those dialogs had to be made twice, and doubled how many of
 * them were mounted at once.
 */
function SettingsMenu({
  className = "",
  onOpenExport,
  onOpenImport,
  onOpenReset,
  onOpenStorageDebug,
  onOpenShortcuts,
}: {
  className?: string;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenReset: () => void;
  onOpenStorageDebug: () => void;
  onOpenShortcuts: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <div className={`relative shrink-0 ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="Settings"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition-colors hover:text-white"
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15 1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenExport();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            Export data
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenImport();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            Import data
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenReset();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            Reset line data
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenStorageDebug();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            Storage debug
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenShortcuts();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            Keyboard shortcuts
          </button>
        </div>
      )}
    </div>
  );
}

export function TopNav({
  collections,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  filtersActive,
  onOpenFilters,
  onClearFilters,
  onOpenShortcuts,
  searchInputRef,
}: {
  collections: Collection[];
  activeId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
  onClearFilters: () => void;
  onOpenShortcuts: () => void;
  /** Forwarded to the desktop nav's SearchBox only -- see SearchBox's own
   * inputRef prop. */
  searchInputRef?: RefObject<HTMLInputElement>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [storageDebugOpen, setStorageDebugOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed inset-x-0 top-0 z-[55] flex items-center justify-between gap-4 border-b border-neutral-700/40 bg-[#1E1E1E]/30 px-6 backdrop-blur-xl"
        style={{ height: NAV_HEIGHT }}
      >
        <div className="flex min-w-0 items-center gap-6">
          <img src={epicTimelineLogo} alt="Epic Timeline" className="h-6 w-auto shrink-0" />
          <div className="hidden flex-wrap items-center gap-5 md:flex">
            {collections.map((c) => {
              const active = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`whitespace-nowrap border-b-2 pb-1 pt-1 text-sm font-medium transition-colors ${
                    active
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <SearchBox
            value={searchQuery}
            onChange={onSearchChange}
            filtersActive={filtersActive}
            onOpenFilters={onOpenFilters}
            onClearFilters={onClearFilters}
            inputRef={searchInputRef}
            className="w-48"
          />
          <SettingsMenu
            onOpenExport={() => setExportOpen(true)}
            onOpenImport={() => setImportOpen(true)}
            onOpenReset={() => setResetOpen(true)}
            onOpenStorageDebug={() => setStorageDebugOpen(true)}
            onOpenShortcuts={onOpenShortcuts}
          />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-300 transition-colors hover:text-white md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-6 w-6"
          >
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-l border-neutral-800 bg-[#252526]/50 px-5 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <img src={epicTimelineLogo} alt="Epic Timeline" className="h-5 w-auto" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-300 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <SearchBox
              value={searchQuery}
              onChange={onSearchChange}
              filtersActive={filtersActive}
              onOpenFilters={onOpenFilters}
              onClearFilters={onClearFilters}
              className="mt-4"
            />

            <div className="mt-6 flex flex-col gap-1">
              {collections.map((c) => {
                const active = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c.id);
                      setMenuOpen(false);
                    }}
                    className={`rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col gap-1 border-t border-neutral-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setExportOpen(true);
                  setMenuOpen(false);
                }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Export data
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportOpen(true);
                  setMenuOpen(false);
                }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Import data
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetOpen(true);
                  setMenuOpen(false);
                }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Reset line data
              </button>
              <button
                type="button"
                onClick={() => {
                  setStorageDebugOpen(true);
                  setMenuOpen(false);
                }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Storage debug
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenShortcuts();
                  setMenuOpen(false);
                }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Keyboard shortcuts
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportDataButton open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportDataButton open={importOpen} onClose={() => setImportOpen(false)} />
      <ResetLineDataButton open={resetOpen} onClose={() => setResetOpen(false)} />
      <StorageDebugPanel open={storageDebugOpen} onClose={() => setStorageDebugOpen(false)} />
    </>
  );
}
