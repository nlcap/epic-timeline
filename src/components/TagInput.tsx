import { useMemo, useState, type KeyboardEvent } from "react";

function RemoveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-3 w-3"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function TagPill({
  label,
  onRemove,
  confirmed,
}: {
  label: string;
  onRemove?: () => void;
  /** True for a tag actually in the line's list; false for the live,
   * not-yet-created preview of whatever's currently typed -- lighter fill
   * so it reads as tentative next to the confirmed ones. */
  confirmed: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1.5 text-xs font-medium text-neutral-900 ${
        confirmed ? "bg-neutral-400" : "bg-neutral-100"
      }`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="flex h-4 w-4 items-center justify-center text-neutral-600 hover:text-neutral-900"
        >
          <RemoveIcon />
        </button>
      )}
    </span>
  );
}

/**
 * Letterboxd-style tag editor for the Add/Edit Line form -- type to
 * search/filter existing tags (case-insensitive, alphabetical dropdown),
 * click or Tab to accept the top match, Enter to create a new tag (or
 * reuse an existing one that case-insensitively matches exactly, so
 * "bat family" doesn't fork off a duplicate of an existing "Bat Family").
 * Selected tags render as pills below the input, each with its own × to
 * remove it -- purely local/draft state, the caller only persists `tags`
 * when the form itself saves.
 */
export function TagInput({
  tags,
  onChange,
  allTags,
  disabled = false,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  /** Every tag known anywhere in the app (see App.tsx's allTags), not
   * just ones already on this line -- the whole point is a shared,
   * global pool. */
  allTags: string[];
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const trimmed = inputValue.trim();

  const suggestions = useMemo(() => {
    if (!trimmed) return [];
    const query = trimmed.toLowerCase();
    const selected = new Set(tags.map((t) => t.toLowerCase()));
    return allTags
      .filter((t) => !selected.has(t.toLowerCase()) && t.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b));
  }, [trimmed, allTags, tags]);

  const showDropdown = open && suggestions.length > 0;
  // A live, uncommitted preview of the tag Enter would create -- shown
  // once there's text but nothing in the dropdown to pick from instead,
  // and cleared again the instant a match reappears.
  const showPreview = trimmed.length > 0 && suggestions.length === 0;

  const addTag = (value: string) => {
    // Reuse an existing tag that matches case-insensitively (preserving
    // its original casing) rather than forking off a near-duplicate --
    // the global pool only works if "bat family" and "Bat Family" don't
    // end up as two different tags.
    const canonical = allTags.find((t) => t.toLowerCase() === value.toLowerCase()) ?? value;
    const alreadyOnLine = tags.some((t) => t.toLowerCase() === canonical.toLowerCase());
    if (!alreadyOnLine) onChange([...tags, canonical]);
    setInputValue("");
    setOpen(false);
  };

  const removeTag = (value: string) => {
    onChange(tags.filter((t) => t !== value));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && suggestions.length > 0) {
      // Consumes the Tab key only when there's actually a match to
      // complete to -- otherwise it falls through to normal focus
      // navigation onto the next field.
      e.preventDefault();
      addTag(suggestions[0]);
    } else if (e.key === "Enter") {
      // Always suppressed, even with nothing typed -- this field lives
      // inside the line form's own <form>, and an unprevented Enter
      // would submit (and close) the whole drawer instead of just
      // creating a tag.
      e.preventDefault();
      if (trimmed) addTag(trimmed);
    } else if (e.key === "Escape" && open) {
      setOpen(false);
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-neutral-300">Tags</span>
        <span className="text-xs text-neutral-500">Press Tab to complete, Enter to create</span>
      </div>
      <div className="relative mt-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Bat Family"
          disabled={disabled}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none disabled:opacity-40"
        />
        {showDropdown && (
          <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                // Keeps focus (and the dropdown) alive through the click --
                // a mousedown on a button normally blurs the input first,
                // which would close this dropdown before the click handler
                // below ever runs.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                className="block w-full px-3 py-1.5 text-left text-sm text-white hover:bg-neutral-800"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {(tags.length > 0 || showPreview) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagPill
              key={tag}
              label={tag}
              confirmed
              onRemove={disabled ? undefined : () => removeTag(tag)}
            />
          ))}
          {showPreview && (
            <TagPill label={trimmed} confirmed={false} onRemove={() => setInputValue("")} />
          )}
        </div>
      )}
    </div>
  );
}
