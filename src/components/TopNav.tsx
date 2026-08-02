import { useEffect, useRef, useState } from "react";
import type { Collection } from "../types";
import epicTimelineLogo from "../assets/logo_epic_timeline.svg";
import { ExportDataButton } from "./ExportDataButton";
import { ImportDataButton } from "./ImportDataButton";
import { ResetLineDataButton } from "./ResetLineDataButton";

const NAV_HEIGHT = 48;
export { NAV_HEIGHT };

function SettingsMenu({ className = "" }: { className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
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
              setExportOpen(true);
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
              setImportOpen(true);
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
              setResetOpen(true);
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            Reset line data
          </button>
        </div>
      )}

      <ExportDataButton open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportDataButton open={importOpen} onClose={() => setImportOpen(false)} />
      <ResetLineDataButton open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}

export function TopNav({
  collections,
  activeId,
  onSelect,
}: {
  collections: Collection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

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
          <SettingsMenu />
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
            </div>
          </div>
        </div>
      )}

      <ExportDataButton open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportDataButton open={importOpen} onClose={() => setImportOpen(false)} />
      <ResetLineDataButton open={resetOpen} onClose={() => setResetOpen(false)} />
    </>
  );
}
