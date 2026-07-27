import type { Collection } from "../types";

export function CollectionTabs({
  collections,
  activeId,
  onSelect,
}: {
  collections: Collection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-neutral-900 px-8 py-3">
      {collections.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active
                ? "bg-white text-black"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
