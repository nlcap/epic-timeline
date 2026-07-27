import { useEffect, useState } from "react";
import type { Collection } from "../types";
import epicTimelineLogo from "../assets/logo_epic_timeline.svg";

const NAV_HEIGHT = 48;
export { NAV_HEIGHT };

function AccountButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      disabled
      title="Account (coming soon)"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className="h-4 w-4"
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c1.6-3.5 4.5-5.25 7.5-5.25S17.9 16.5 19.5 20" />
      </svg>
    </button>
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
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 border-b border-neutral-700/40 bg-[#1E1E1E]/30 px-6 backdrop-blur-xl"
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

        <AccountButton className="hidden md:flex" />

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

            <div className="mt-auto flex items-center gap-3 border-t border-neutral-800 pt-4">
              <AccountButton />
              <span className="text-sm text-neutral-500">Account (coming soon)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
