import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Era, Line } from "../types";
import { earliestEraWithIcon, ERA_META, ERA_ORDER } from "../lib/era";
import { getPastedImageFile, readFileAsDataUrl } from "../lib/imageCompression";
import { MONTH_NAMES } from "../lib/timeline";
import { LineIcon } from "./LineIcon";
import { ImageCropModal } from "./ImageCropModal";
import { TagInput } from "./TagInput";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { useSlidePanel } from "../hooks/useSlidePanel";
import { useEscapeToClose } from "../hooks/useEscapeToClose";
import { useCommitShortcut } from "../hooks/useCommitShortcut";
import { useArmedConfirm } from "../hooks/useArmedConfirm";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "./icons";
import { FIELD, FIELD_DISABLED, FIELD_PLACEHOLDER, SELECT } from "./formStyles";

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const DEFAULT_HEX = "#FF00D9";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Hover-revealed reset control for an uploaded icon (used for both the
 * single-icon path and each per-era icon) -- darkened scrim + trash icon
 * over the icon itself. The circle's too small (48-64px) for a text
 * confirmation, so the first click arms it instead of resetting immediately:
 * the scrim turns red and the icon swaps to a checkmark, and a second click
 * within a few seconds is what actually resets to the default fallback.
 * Left alone, it quietly disarms itself rather than staying a trap for a
 * later, unrelated click. A sibling of `LineIcon` inside its own `relative`
 * wrapper (see call sites), not a descendant of the upload `<label>`, so
 * clicking it doesn't also open the file picker.
 */
function IconResetOverlay({ onReset }: { onReset: () => void }) {
  const { confirming, arm, disarm } = useArmedConfirm(3000);

  const handleClick = () => {
    if (confirming) {
      disarm();
      onReset();
      return;
    }
    arm();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={confirming ? "Click again to confirm removing this icon" : "Reset icon to default"}
      className={`absolute inset-0 flex items-center justify-center text-white transition-opacity ${
        confirming
          ? "bg-red-900/90 opacity-100"
          : "bg-black/60 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
      }`}
    >
      {confirming ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <TrashIcon className="h-5 w-5" />
      )}
    </button>
  );
}

export function LineFormDrawer({
  collectionId,
  supportsEra = false,
  editingLine,
  speculative = false,
  fieldsLocked = false,
  allTags,
  onSave,
  onDelete,
  onAddVolume,
  onClose,
}: {
  collectionId: string;
  /** DC Finest: one icon upload per era instead of a single icon. */
  supportsEra?: boolean;
  /** Omit to add a new line; pass an existing line to edit it. */
  editingLine?: Line;
  /** Speculation Mode: swaps the "Add Line" heading for "Add Speculative
   * Line" when adding (editing an existing speculative line still just
   * reads "Edit Line"). Field set is identical either way. */
  speculative?: boolean;
  /** Speculation Mode: this is an official line -- every field and Delete
   * are disabled, but "Add Volume" stays live, since speculating a new
   * volume onto an existing official line is still allowed. */
  fieldsLocked?: boolean;
  /** Every tag known anywhere in the app, for the Tags field's
   * autocomplete -- see App.tsx's allTags. */
  allTags: string[];
  onSave: (line: Line) => void;
  onDelete?: (lineId: string) => void;
  onAddVolume?: () => void;
  onClose: () => void;
}) {
  const isEditing = !!editingLine;

  const [name, setName] = useState(editingLine?.name ?? "");
  const [iconUrl, setIconUrl] = useState<string | undefined>(editingLine?.iconUrl);
  const [eraIconUrls, setEraIconUrls] = useState<Partial<Record<Era, string>>>(
    editingLine?.eraIconUrls ?? {}
  );
  const [defaultIconEra, setDefaultIconEra] = useState<Era | undefined>(
    editingLine?.defaultIconEra
  );
  // Once the user explicitly picks a default via radio, stop auto-recomputing
  // it from "earliest uploaded" on every new upload.
  const [defaultPinned, setDefaultPinned] = useState(!!editingLine?.defaultIconEra);
  const [year, setYear] = useState(editingLine ? String(editingLine.debutDate.year) : "");
  const [month, setMonth] = useState(String(editingLine?.debutDate.month ?? 1));
  const [hex, setHex] = useState(editingLine?.colorHex ?? DEFAULT_HEX);
  // Licensed-collection-only for now -- see swimLanes on the Line type and
  // assignLanes/lineHeight in lib/timeline.ts for the layout it drives.
  const [swimLanes, setSwimLanes] = useState(editingLine?.swimLanes ?? 1);
  const supportsSwimLanes = collectionId === "marvel-licensed-epic";
  // Same Licensed-only gate as swimLanes -- only shown under the title when
  // a line actually has 2+ lanes (see LineRow.tsx), but stored regardless.
  const [description, setDescription] = useState(editingLine?.description ?? "");
  const [tags, setTags] = useState<string[]>(editingLine?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { visible, closeThen } = useSlidePanel();

  // Snapshot of every field's value as of the first render -- used below to
  // detect unsaved edits so the drawer can prompt instead of silently
  // discarding them. useRef's initializer expression re-runs every render
  // (React just discards the result after mount), so this stays cheap and
  // never needs its own effect to "capture once".
  const initialSnapshot = useRef({
    name,
    iconUrl,
    eraIconUrls,
    defaultIconEra,
    year,
    month,
    hex,
    swimLanes,
    description,
    tags,
  });
  const isDirty = useMemo(() => {
    const s = initialSnapshot.current;
    return (
      name !== s.name ||
      iconUrl !== s.iconUrl ||
      JSON.stringify(eraIconUrls) !== JSON.stringify(s.eraIconUrls) ||
      defaultIconEra !== s.defaultIconEra ||
      year !== s.year ||
      month !== s.month ||
      hex !== s.hex ||
      swimLanes !== s.swimLanes ||
      description !== s.description ||
      JSON.stringify(tags) !== JSON.stringify(s.tags)
    );
  }, [name, iconUrl, eraIconUrls, defaultIconEra, year, month, hex, swimLanes, description, tags]);
  // Whether the unsaved-changes prompt (see UnsavedChangesModal) is up --
  // only reachable in edit mode with unsaved edits, never for a fresh Add.
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Focuses the title field when opening in edit mode, so Cmd+V works
  // immediately instead of needing a click into the drawer first.
  //
  // It has to be a genuinely editable element: the browser only generates a
  // `paste` event at all when focus is in an editable context (input,
  // textarea, contenteditable). Focusing the form wrapper instead, even
  // with tabIndex={-1} to make it focusable, produces no paste event for
  // any listener to catch -- don't "simplify" this to that.
  //
  // Add mode is already covered by the title field's own autoFocus below.
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditing) titleRef.current?.focus();
  }, [isEditing]);

  // A freshly-picked file doesn't become the icon directly -- it's routed
  // through ImageCropModal first (see that file for why), and only applied
  // to iconUrl/eraIconUrls once the user confirms a crop. `target` records
  // which field the crop is for, since both the single-icon and per-era
  // uploads share this same interstitial step. `era` is only a hint for
  // ImageCropModal's era picker (era mode) -- which button was clicked for
  // a file upload, or the first era still missing an icon for a paste --
  // the user can still change it there before confirming.
  const [pendingCrop, setPendingCrop] = useState<
    { src: string; target: "icon" } | { src: string; target: "era"; era?: Era } | null
  >(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Backdrop click and Close ✕ (below) both route through this rather than
  // calling closeThen(onClose) directly -- an editing drawer with unsaved
  // edits opens the confirm prompt instead of discarding them outright. The
  // explicit Cancel button deliberately skips this and keeps discarding
  // immediately (see UnsavedChangesModal's own docblock for why).
  const requestClose = () => {
    if (isEditing && isDirty) setShowUnsavedPrompt(true);
    else closeThen(onClose);
  };

  // Suppressed while ImageCropModal is up top of this drawer -- otherwise
  // Escape would skip past it and close the whole form (losing whatever's
  // typed) instead of just cancelling the crop. Also suppressed once
  // there's something unsaved to lose, or once the prompt for it is
  // already up -- Escape's own dirty-aware routing lives in the effect
  // just below instead, since closeThen commits to the exit animation the
  // instant it's called and there's no way to redirect that into "open a
  // modal, leave the drawer alone" after the fact.
  useEscapeToClose(closeThen, onClose, !pendingCrop && !(isEditing && isDirty) && !showUnsavedPrompt);

  // The half of requestClose's dirty-aware routing useEscapeToClose above
  // can't do on its own -- picked up only once there's something unsaved
  // and no prompt already showing (both handled by useEscapeToClose itself
  // once either flips). Mirrors how pendingCrop's own Escape handling
  // (ImageCropModal) already covers the crop-in-progress interstitial the
  // same way.
  useEffect(() => {
    if (pendingCrop || !isEditing || !isDirty || showUnsavedPrompt) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowUnsavedPrompt(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingCrop, isEditing, isDirty, showUnsavedPrompt]);

  // requestSubmit (not calling handleSubmit directly) so it goes through
  // the browser's normal submit path.
  useCommitShortcut(() => formRef.current?.requestSubmit());

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingCrop({ src: await readFileAsDataUrl(file), target: "icon" });
  };

  const handleEraFileChange = async (era: Era, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingCrop({ src: await readFileAsDataUrl(file), target: "era", era });
  };

  // Listens on `document` rather than via onPaste on the form, because a
  // paste event is delivered to whatever currently has focus -- and that
  // isn't reliably inside this form. Notably, right after the drawer opens
  // focus can still be on <body>, and a paste targeting <body> never
  // bubbles through the form, so a form-scoped handler simply never runs.
  //
  // Applies in both modes: single-icon mode has exactly one slot, so it's
  // unambiguous. Era mode has four, but rather than requiring a specific
  // slot to be picked first, this just guesses a starting era (the first
  // one still missing an icon) and lets ImageCropModal's era picker sort
  // out the rest.
  useEffect(() => {
    if (fieldsLocked) return;
    const onPaste = async (e: globalThis.ClipboardEvent) => {
      const file = getPastedImageFile(e);
      if (!file) return;
      e.preventDefault();
      const src = await readFileAsDataUrl(file);
      if (supportsEra) {
        setPendingCrop({ src, target: "era", era: ERA_ORDER.find((era) => !eraIconUrls[era]) });
      } else {
        setPendingCrop({ src, target: "icon" });
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [fieldsLocked, supportsEra, eraIconUrls]);

  const handleCropConfirm = (croppedDataUrl: string, era?: Era) => {
    if (!pendingCrop) return;
    if (pendingCrop.target === "icon") {
      setIconUrl(croppedDataUrl);
    } else if (era) {
      const next = { ...eraIconUrls, [era]: croppedDataUrl };
      setEraIconUrls(next);
      if (!defaultPinned) {
        setDefaultIconEra(earliestEraWithIcon(next));
      }
    }
    setPendingCrop(null);
  };

  const handleEraIconReset = (era: Era) => {
    const next = { ...eraIconUrls };
    delete next[era];
    setEraIconUrls(next);
    // The removed icon was either the auto-picked default (recompute from
    // whatever's left) or the user's own pinned choice (which no longer
    // has an icon to point at -- fall back to auto instead of leaving it
    // pinned to an era with nothing uploaded).
    if (!defaultPinned || defaultIconEra === era) {
      setDefaultIconEra(earliestEraWithIcon(next));
      setDefaultPinned(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (fieldsLocked) return;

    const trimmedName = name.trim();
    const yearNum = Number(year);

    if (!trimmedName) {
      setError("Line title is required.");
      return;
    }
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError("Enter a valid debut year.");
      return;
    }
    if (!HEX_PATTERN.test(hex)) {
      setError("Enter a valid hex color, e.g. #8B1E2F.");
      return;
    }

    closeThen(() =>
      onSave({
        id: editingLine?.id ?? `${collectionId}-${slugify(trimmedName)}-${Date.now().toString(36)}`,
        collectionId,
        iconUrl: supportsEra ? undefined : iconUrl,
        eraIconUrls: supportsEra ? eraIconUrls : undefined,
        defaultIconEra: supportsEra ? defaultIconEra : undefined,
        name: trimmedName,
        colorHex: hex,
        debutDate: { year: yearNum, month: Number(month) },
        swimLanes: supportsSwimLanes && swimLanes !== 1 ? swimLanes : undefined,
        description: supportsSwimLanes && description.trim() ? description.trim() : undefined,
        tags: tags.length > 0 ? tags : undefined,
      })
    );
  };

  return (
    <>
    <div
      className={`fixed inset-0 z-[65] flex justify-end bg-black/60 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={requestClose}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-neutral-800 bg-[#252526]/50 p-6 backdrop-blur-sm transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? "Edit Line" : speculative ? "Add Speculative Line" : "Add Line"}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Close ✕
          </button>
        </div>

        {supportsEra ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-neutral-300">
              Era icons
            </legend>
            <p className="mt-1 text-xs text-neutral-500">
              Upload an icon for any era the line has -- not all four are required.
              Pick which one shows on the sidebar. You can also paste an image
              anywhere in this form; you'll choose which era it's for next.
            </p>
            <div className="mt-3 space-y-3">
              {ERA_ORDER.map((era) => {
                const hasIcon = !!eraIconUrls[era];
                return (
                  <div key={era} className="flex items-center gap-4">
                    <span className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-neutral-700">
                      <LineIcon iconUrl={eraIconUrls[era]} />
                      {hasIcon && !fieldsLocked && (
                        <IconResetOverlay onReset={() => handleEraIconReset(era)} />
                      )}
                    </span>
                    <label
                      className={`flex-1 ${fieldsLocked ? "" : "cursor-pointer"}`}
                    >
                      <span
                        className={`block rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-white ${
                          fieldsLocked ? "opacity-40" : "hover:border-neutral-500"
                        }`}
                      >
                        {hasIcon ? "Replace" : "Upload"} {ERA_META[era].label}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={fieldsLocked}
                        onChange={(e) => handleEraFileChange(era, e)}
                        className="sr-only"
                      />
                    </label>
                    <label className="flex shrink-0 items-center gap-2 text-sm text-neutral-300">
                      <input
                        type="radio"
                        name="defaultIconEra"
                        checked={defaultIconEra === era}
                        disabled={!hasIcon || fieldsLocked}
                        onChange={() => {
                          setDefaultIconEra(era);
                          setDefaultPinned(true);
                        }}
                        className="disabled:opacity-30"
                      />
                      Default
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <div className="mt-6 flex items-center gap-4">
            <span className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-neutral-700">
              <LineIcon iconUrl={iconUrl} />
              {iconUrl && !fieldsLocked && (
                <IconResetOverlay onReset={() => setIconUrl(undefined)} />
              )}
            </span>
            <div>
              <label className={fieldsLocked ? "" : "cursor-pointer"}>
                <span
                  className={`block rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-white ${
                    fieldsLocked ? "opacity-40" : "hover:border-neutral-500"
                  }`}
                >
                  Upload icon
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={fieldsLocked}
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {!fieldsLocked && (
                <p className="mt-1 text-xs text-neutral-500">or paste from clipboard</p>
              )}
            </div>
          </div>
        )}

        <label className="mt-6 block text-sm font-medium text-neutral-300">
          Line title
          <input
            ref={titleRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Green Arrow"
            disabled={fieldsLocked}
            // Adding focuses here outright; editing focuses the same field
            // via titleRef's effect above (caret only, nothing selected) so
            // the drawer is paste-ready on open. Locked (official line in
            // Speculation Mode) it's disabled and unfocusable -- which
            // matches handlePaste refusing to paste in that mode anyway.
            autoFocus={!isEditing}
            className={`mt-1 w-full ${FIELD} ${FIELD_PLACEHOLDER} ${FIELD_DISABLED}`}
          />
        </label>

        <div className="mt-4 flex gap-3">
          <label className="block flex-1 text-sm font-medium text-neutral-300">
            Debut month
            {/* appearance-none + a manual chevron -- an unstyled <select>
             * relies on the OS's native control chrome, which some browsers
             * (Safari in particular) size to the selected option's text
             * instead of filling the box the way a plain <input> does. */}
            <div className="relative mt-1">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={fieldsLocked}
                className={`w-full ${FIELD} ${SELECT} ${FIELD_DISABLED}`}
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </div>
          </label>
          <label className="block w-28 text-sm font-medium text-neutral-300">
            Debut year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="1941"
              disabled={fieldsLocked}
              className={`mt-1 w-full ${FIELD} ${FIELD_PLACEHOLDER} ${FIELD_DISABLED}`}
            />
          </label>
        </div>

        {supportsSwimLanes && (
          <label className="mt-4 block text-sm font-medium text-neutral-300">
            Swim lanes
            <p className="mt-0.5 text-xs font-normal text-neutral-500">
              How many stacked lanes this line's volumes can spread across when
              their dates overlap.
            </p>
            <div className="relative mt-1">
              <select
                value={swimLanes}
                onChange={(e) => setSwimLanes(Number(e.target.value))}
                disabled={fieldsLocked}
                className={`w-full ${FIELD} ${SELECT} ${FIELD_DISABLED}`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </div>
          </label>
        )}

        {supportsSwimLanes && (
          <label className="mt-4 block text-sm font-medium text-neutral-300">
            Description
            <p className="mt-0.5 text-xs font-normal text-neutral-500">
              Short era/timeframe blurb, e.g. "4000–1000 years before Yavin".
              Only shown when Swim lanes is 2 or more. Paste "&lt;br&gt;" for
              a line break.
            </p>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 4000-1000 years before Yavin"
              disabled={fieldsLocked}
              className={`mt-1 w-full ${FIELD} ${FIELD_PLACEHOLDER} ${FIELD_DISABLED}`}
            />
          </label>
        )}

        <label className="mt-4 block text-sm font-medium text-neutral-300">
          Base hex color
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={HEX_PATTERN.test(hex) ? hex : DEFAULT_HEX}
              onChange={(e) => setHex(e.target.value)}
              disabled={fieldsLocked}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-neutral-700 bg-neutral-900 p-1 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <input
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#8B1E2F"
              disabled={fieldsLocked}
              className={`w-full ${FIELD} ${FIELD_PLACEHOLDER} ${FIELD_DISABLED}`}
            />
          </div>
        </label>

        <div className="mt-4">
          <TagInput tags={tags} onChange={setTags} allTags={allTags} disabled={fieldsLocked} />
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-auto pt-6">
          {confirmingDelete ? (
            <div className="rounded-md border border-red-900 bg-red-950/40 p-4">
              <p className="text-sm text-red-200">
                Are you sure you want to delete "{editingLine?.name}"? This can't be undone.
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
                  onClick={() => editingLine && closeThen(() => onDelete?.(editingLine.id))}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => closeThen(onClose)}
                  className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fieldsLocked}
                  className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:enabled:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isEditing ? "Update Line" : speculative ? "Add Speculative Line" : "Add Line"}
                </button>
              </div>
              {isEditing && onAddVolume && (
                <button
                  type="button"
                  onClick={() => closeThen(onAddVolume)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:border-neutral-500 hover:text-white"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Volume
                </button>
              )}
              {isEditing && onDelete && !fieldsLocked && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="mt-3 w-full rounded-md border border-transparent px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300"
                >
                  Delete Line
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
    {pendingCrop && (
      <ImageCropModal
        imageSrc={pendingCrop.src}
        eraOptions={
          pendingCrop.target === "era"
            ? ERA_ORDER.map((era) => ({ era, label: ERA_META[era].label }))
            : undefined
        }
        initialEra={pendingCrop.target === "era" ? pendingCrop.era : undefined}
        onConfirm={handleCropConfirm}
        onCancel={() => setPendingCrop(null)}
      />
    )}
    {showUnsavedPrompt && (
      <UnsavedChangesModal
        entityLabel="line"
        onSave={() => {
          setShowUnsavedPrompt(false);
          formRef.current?.requestSubmit();
        }}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          closeThen(onClose);
        }}
        onKeepEditing={() => setShowUnsavedPrompt(false)}
      />
    )}
    </>
  );
}
