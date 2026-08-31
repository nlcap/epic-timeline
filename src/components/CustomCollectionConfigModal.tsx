import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { Collection } from "../types";
import type { CustomCollectionConfig } from "../hooks/useCustomCollectionConfig";
import type { CustomEraDef } from "../lib/era";
import { compressImageFile, getPastedImageFile } from "../lib/imageCompression";
import { hexToRgba } from "../lib/color";
import {
  DEFAULT_FONT_ID,
  DEFAULT_FONT_WEIGHT,
  ensureGoogleFontLoaded,
  findFontOption,
  FONT_OPTIONS,
  nearestWeight,
  WEIGHT_LABELS,
} from "../lib/fonts";
import { useArmedConfirm } from "../hooks/useArmedConfirm";
import {
  deleteSandboxSnapshot,
  getActiveSandboxSnapshotId,
  listSandboxSnapshots,
  loadSandboxSnapshot,
  saveSandboxSnapshot,
  startNewSandbox,
  type SandboxSnapshot,
} from "../lib/sandboxSnapshots";
import { SettingsModal } from "./SettingsModal";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import {
  BUTTON_DESTRUCTIVE,
  BUTTON_DESTRUCTIVE_GHOST,
  BUTTON_PRIMARY_LIGHT,
  BUTTON_SECONDARY,
  BUTTON_SECONDARY_DISABLEABLE,
} from "./buttonStyles";
import { FIELD, FIELD_PLACEHOLDER, SELECT } from "./formStyles";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "./icons";
import { SelectField } from "./SelectField";

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const DEFAULT_ERA_HEX = "#7B4FE0";
/** Sentinel <option> value for "no snapshot active" in the saved-sandboxes
 * picker -- distinct from any real id, since those are crypto.randomUUID(). */
const NEW_SANDBOX_VALUE = "__new__";
const MIN_RULE_THICKNESS = 0;
const MAX_RULE_THICKNESS = 16;
/** Shown as the slider's starting position while ruleThicknessPx is
 * undefined ("follow the responsive default") -- 3px is that default's own
 * full-size (desktop) value, so the slider starts wherever the rule already
 * visually sits rather than at an arbitrary/misleading spot. */
const DEFAULT_RULE_THICKNESS_PX = 3;
const MIN_OPACITY = 0;
const MAX_OPACITY = 100;
/** Unlike ruleThicknessPx's "undefined = follow the responsive default"
 * convention, 100 and undefined mean exactly the same thing here (fully
 * opaque, i.e. today's look) -- there's no second, dynamic default this
 * needs to keep tracking -- so it's fine to always show/store a real
 * number and just skip persisting it when it's still this default. */
const DEFAULT_OPACITY = 100;

function newEra(): CustomEraDef {
  return {
    id: crypto.randomUUID(),
    label: "",
    letter: "",
    colorHex: DEFAULT_ERA_HEX,
    startYear: new Date().getFullYear(),
  };
}

/** Hover-revealed reset control for the uploaded logo -- same forgiving
 * arm-then-confirm shape as ImageResetOverlay (VolumeFormDrawer) and
 * IconResetOverlay (LineFormDrawer), just not shared with either since each
 * is sized and cropped differently (a cover fills a tall card, a line icon
 * is a small circle, this is a short wide strip). */
function LogoResetOverlay({ onReset }: { onReset: () => void }) {
  const { confirming, arm, disarm } = useArmedConfirm(4000);

  if (confirming) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-2 text-center">
        <p className="text-xs font-medium text-white">Remove this logo?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={disarm}
            className="rounded border border-neutral-600 px-2.5 py-1 text-xs text-neutral-200 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={arm}
      aria-label="Remove logo"
      className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium text-white opacity-0 transition-opacity hover:opacity-100"
    >
      Remove
    </button>
  );
}

/**
 * Custom tab's configuration form, opened from CollectionBanner's gear
 * button: masthead branding (title/rule color/logo), plus which of DC
 * Finest's eras and Licensed's swim lanes to borrow -- both independent
 * checkboxes, not an exclusive choice, so they can be combined. Every field
 * here is optional -- an empty/default value simply falls back to the
 * built-in "custom" Collection entry (see collections.ts and
 * CollectionBanner's effectiveTagline/effectiveAccent/effectiveLogo), the
 * same "absolute override, not a diff" convention every other override
 * store in this app uses.
 *
 * `eras` is kept in the saved config regardless of erasEnabled -- unchecking
 * the box just stops using the list, it doesn't discard it, so re-checking
 * it later brings the same eras back.
 *
 * Also hosts the Sandbox tab's saved-timelines library (see
 * lib/sandboxSnapshots.ts): the live tab only ever holds one timeline at a
 * time, so saving captures its current lines/volumes/status/notes and
 * appearance together under a name, and loading (or starting a blank one)
 * swaps that whole set back in and reloads the page.
 */
export function CustomCollectionConfigModal({
  collection,
  config,
  onSave,
  onClose,
}: {
  collection: Collection;
  config: CustomCollectionConfig;
  onSave: (patch: CustomCollectionConfig) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(config.title || collection.tagline);
  const [fontId, setFontId] = useState(config.fontFamily || DEFAULT_FONT_ID);
  const [fontWeight, setFontWeight] = useState(config.fontWeight ?? DEFAULT_FONT_WEIGHT);
  const [fontItalic, setFontItalic] = useState(config.fontItalic ?? false);
  const [hex, setHex] = useState(config.accentHex || collection.accentHex);
  const [titleOpacity, setTitleOpacity] = useState(config.titleOpacity ?? DEFAULT_OPACITY);
  // undefined means "not customized -- follow the timeline color above",
  // same convention ruleThicknessPx below uses for "follow the responsive
  // default". Kept as its own optional value (not seeded from `hex` once at
  // mount) specifically so it keeps tracking `hex` live if the user changes
  // the timeline color without ever having touched the rule color -- a
  // one-time snapshot would otherwise freeze at whatever `hex` happened to
  // be when the modal opened and quietly stop following it.
  const [ruleHex, setRuleHex] = useState<string | undefined>(config.ruleColorHex);
  const [ruleOpacity, setRuleOpacity] = useState(config.ruleOpacity ?? DEFAULT_OPACITY);
  const [ruleThicknessPx, setRuleThicknessPx] = useState<number | undefined>(
    config.ruleThicknessPx
  );
  const [logoUrl, setLogoUrl] = useState(config.logoUrl);
  const [erasEnabled, setErasEnabled] = useState(config.erasEnabled ?? false);
  const [swimLanesEnabled, setSwimLanesEnabled] = useState(config.swimLanesEnabled ?? false);
  const [eras, setEras] = useState<CustomEraDef[]>(config.eras ?? []);
  const [eraOpacity, setEraOpacity] = useState(config.eraOpacity ?? DEFAULT_OPACITY);

  // Every field above, snapshotted once at mount, so dismissing this form
  // by accident can't silently bin a half-built configuration -- the same
  // guard LineFormDrawer/VolumeFormDrawer already have, which this form
  // (14 fields, including a whole hand-authored era list) wanted more than
  // either of them. `eras` compares by value: it's an array of objects
  // rebuilt on every edit, so identity always differs.
  const initialSnapshot = useRef({
    title,
    fontId,
    fontWeight,
    fontItalic,
    hex,
    titleOpacity,
    ruleHex,
    ruleOpacity,
    ruleThicknessPx,
    logoUrl,
    erasEnabled,
    swimLanesEnabled,
    eras: JSON.stringify(eras),
    eraOpacity,
  });
  const isDirty = useMemo(() => {
    const s = initialSnapshot.current;
    return (
      title !== s.title ||
      fontId !== s.fontId ||
      fontWeight !== s.fontWeight ||
      fontItalic !== s.fontItalic ||
      hex !== s.hex ||
      titleOpacity !== s.titleOpacity ||
      ruleHex !== s.ruleHex ||
      ruleOpacity !== s.ruleOpacity ||
      ruleThicknessPx !== s.ruleThicknessPx ||
      logoUrl !== s.logoUrl ||
      erasEnabled !== s.erasEnabled ||
      swimLanesEnabled !== s.swimLanesEnabled ||
      JSON.stringify(eras) !== s.eras ||
      eraOpacity !== s.eraOpacity
    );
  }, [
    title,
    fontId,
    fontWeight,
    fontItalic,
    hex,
    titleOpacity,
    ruleHex,
    ruleOpacity,
    ruleThicknessPx,
    logoUrl,
    erasEnabled,
    swimLanesEnabled,
    eras,
    eraOpacity,
  ]);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // SettingsModal routes the backdrop click, Close ✕ and Escape all through
  // its single onClose, so intercepting there covers all three at once --
  // simpler than the form drawers, which need a separate Escape path
  // because closeThen commits to an exit animation the moment it's called.
  //
  // The explicit Cancel button deliberately skips this and keeps
  // discarding immediately (see UnsavedChangesModal's docblock) -- a button
  // labelled "Cancel" is already a deliberate "throw this away".
  //
  // Bails outright while the prompt is up: that prompt is itself a
  // SettingsModal with its own window-level Escape handler, and both fire
  // for the same keypress. Ignoring it here lets the prompt's own
  // "keep editing" win, leaving this form open underneath, rather than the
  // two racing to interpret one Escape.
  const requestClose = () => {
    if (showUnsavedPrompt) return;
    if (isDirty) setShowUnsavedPrompt(true);
    else onClose();
  };

  // Builds the same "only the fields that differ from default" patch both
  // the form's own Save (below) and "Save to library" (in the saved-
  // sandboxes section) need -- the latter snapshots these in-progress field
  // values directly rather than re-reading storage, so it captures edits
  // made here even before the form's own Save has committed them.
  const buildConfigSnapshot = (): CustomCollectionConfig => {
    const trimmedTitle = title.trim();
    const effectiveTimelineHex = HEX_PATTERN.test(hex) ? hex : collection.accentHex;
    return {
      title: trimmedTitle && trimmedTitle !== collection.tagline ? trimmedTitle : undefined,
      fontFamily: fontId !== DEFAULT_FONT_ID ? fontId : undefined,
      fontWeight: fontWeight !== DEFAULT_FONT_WEIGHT ? fontWeight : undefined,
      fontItalic: fontItalic && findFontOption(fontId).hasItalic ? true : undefined,
      accentHex:
        effectiveTimelineHex.toUpperCase() !== collection.accentHex.toUpperCase()
          ? effectiveTimelineHex
          : undefined,
      titleOpacity: titleOpacity !== DEFAULT_OPACITY ? titleOpacity : undefined,
      ruleColorHex:
        ruleHex && HEX_PATTERN.test(ruleHex) && ruleHex.toUpperCase() !== effectiveTimelineHex.toUpperCase()
          ? ruleHex
          : undefined,
      ruleOpacity: ruleOpacity !== DEFAULT_OPACITY ? ruleOpacity : undefined,
      ruleThicknessPx,
      logoUrl,
      erasEnabled,
      swimLanesEnabled,
      eras,
      eraOpacity: eraOpacity !== DEFAULT_OPACITY ? eraOpacity : undefined,
    };
  };

  // The Sandbox tab's library of saved timelines -- separate from isDirty
  // above, which only tracks this form's own appearance fields. Switching
  // or starting new here replaces the tab's actual lines/volumes too, and
  // only takes effect after a reload (see loadSandboxSnapshot/
  // startNewSandbox), so it's confirmed explicitly below rather than routed
  // through requestClose's guard.
  const [snapshots, setSnapshots] = useState<SandboxSnapshot[]>(listSandboxSnapshots);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(
    getActiveSandboxSnapshotId
  );
  const [snapshotName, setSnapshotName] = useState(
    () => snapshots.find((s) => s.id === activeSnapshotId)?.name ?? ""
  );
  const [pendingSwitch, setPendingSwitch] = useState<
    { type: "new" } | { type: "load"; id: string; name: string } | null
  >(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const {
    confirming: deleteConfirming,
    arm: armDelete,
    disarm: disarmDelete,
  } = useArmedConfirm(4000);

  // Typing over a just-shown "Saved!" makes it stale -- same "reset on the
  // next relevant change" idiom ExportDataButton/StorageDebugPanel use for
  // their own copyState, rather than a timer.
  useEffect(() => setSaveState("idle"), [snapshotName]);

  const handleSwitchRequest = (value: string) => {
    if (value === (activeSnapshotId ?? NEW_SANDBOX_VALUE)) return;
    if (value === NEW_SANDBOX_VALUE) {
      setPendingSwitch({ type: "new" });
      return;
    }
    const target = snapshots.find((s) => s.id === value);
    if (target) setPendingSwitch({ type: "load", id: target.id, name: target.name });
  };

  const cancelSwitch = () => setPendingSwitch(null);

  const confirmSwitch = () => {
    if (!pendingSwitch) return;
    if (pendingSwitch.type === "new") startNewSandbox();
    else loadSandboxSnapshot(pendingSwitch.id);
    window.location.reload();
  };

  const handleSaveSnapshot = () => {
    const name = snapshotName.trim();
    if (!name) return;
    const saved = saveSandboxSnapshot(name, buildConfigSnapshot(), activeSnapshotId ?? undefined);
    setSnapshots(listSandboxSnapshots());
    setActiveSnapshotId(saved.id);
    setSaveState("saved");
  };

  const handleDeleteConfirmed = () => {
    if (!activeSnapshotId) return;
    deleteSandboxSnapshot(activeSnapshotId);
    setSnapshots(listSandboxSnapshots());
    setActiveSnapshotId(null);
    setSnapshotName("");
    disarmDelete();
  };

  // Eagerly loads every curated font up front, unlike CollectionBanner
  // (which only ever fetches the one actually in use) -- this modal's own
  // Font <select> renders each option in its own face, and the picker would
  // be useless for judging a font without that, so the one-time cost of
  // loading the whole curated list is worth it here specifically.
  useEffect(() => {
    for (const font of FONT_OPTIONS) ensureGoogleFontLoaded(font.id);
  }, []);

  // Snaps to the nearest weight the new font actually has rather than
  // leaving fontWeight pointing at one it doesn't -- see WEIGHT_LABELS'
  // sibling comment in lib/fonts.ts for why an unsupported weight can't
  // just be left as-is. Un-checks Italic outright for a font with none,
  // rather than leaving it checked-but-inert (CollectionBanner already
  // guards against rendering italic a font doesn't have, but the checkbox
  // itself should show the reader the truth instead of a stale checked
  // state that no longer does anything).
  const handleFontChange = (id: string) => {
    setFontId(id);
    const font = findFontOption(id);
    setFontWeight((prev) => (font.weights.includes(prev) ? prev : nearestWeight(font.weights, prev)));
    if (!font.hasItalic) setFontItalic(false);
  };

  // See LineFormDrawer's identical paste listener for why this is on
  // `document` rather than a form-scoped onPaste: right after the modal
  // opens, focus can still be on <body>, which a form-scoped handler never
  // sees a paste on.
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const file = getPastedImageFile(e);
      if (!file) return;
      e.preventDefault();
      setLogoUrl(await compressImageFile(file));
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoUrl(await compressImageFile(file));
  };

  const addEra = () => setEras((prev) => [...prev, newEra()]);
  const updateEra = (id: string, patch: Partial<CustomEraDef>) =>
    setEras((prev) => prev.map((era) => (era.id === id ? { ...era, ...patch } : era)));
  const removeEra = (id: string) => setEras((prev) => prev.filter((era) => era.id !== id));
  const moveEra = (index: number, direction: -1 | 1) =>
    setEras((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleReset = () => {
    setTitle(collection.tagline);
    setFontId(DEFAULT_FONT_ID);
    setFontWeight(DEFAULT_FONT_WEIGHT);
    setFontItalic(false);
    setHex(collection.accentHex);
    setTitleOpacity(DEFAULT_OPACITY);
    setRuleHex(undefined);
    setRuleOpacity(DEFAULT_OPACITY);
    setRuleThicknessPx(undefined);
    setLogoUrl(undefined);
    setErasEnabled(false);
    setSwimLanesEnabled(false);
    setEras([]);
    setEraOpacity(DEFAULT_OPACITY);
  };

  const handleSave = () => {
    onSave(buildConfigSnapshot());
    onClose();
  };

  return (
    <>
    <SettingsModal title="Configure Sandbox Timeline" onClose={requestClose} maxWidthClassName="max-w-lg">
      <div className="mt-4 flex flex-col gap-4">
        <div className="rounded-md border border-neutral-800 p-3">
          <span className="block text-sm font-medium text-neutral-300">Saved sandboxes</span>
          <p className="mt-0.5 text-xs text-neutral-500">
            Save this timeline to come back to it later, switch to one you've already saved, or
            start a new one.
          </p>

          <div className="mt-2">
            <SelectField
              value={activeSnapshotId ?? NEW_SANDBOX_VALUE}
              onChange={(e) => handleSwitchRequest(e.target.value)}
            >
              <option value={NEW_SANDBOX_VALUE}>New Sandbox</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </div>

          {pendingSwitch && (
            <div className="mt-2 rounded-md border border-amber-900 bg-amber-950/40 p-3">
              <p className="text-xs text-amber-100">
                {pendingSwitch.type === "new"
                  ? "This clears the current timeline and appearance -- including any unsaved changes above -- back to a blank Sandbox."
                  : `This replaces the current timeline and appearance -- including any unsaved changes above -- with "${pendingSwitch.name}".`}{" "}
                Save first if you want to keep what's here now. The page reloads afterward.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={cancelSwitch}
                  className={`flex-1 ${BUTTON_SECONDARY}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSwitch}
                  className={`flex-1 ${BUTTON_PRIMARY_LIGHT}`}
                >
                  {pendingSwitch.type === "new" ? "Start new" : "Load"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Name this sandbox"
              className={`min-w-0 flex-1 ${FIELD} ${FIELD_PLACEHOLDER}`}
            />
            <button
              type="button"
              disabled={snapshotName.trim().length === 0}
              onClick={handleSaveSnapshot}
              className={`shrink-0 ${BUTTON_SECONDARY_DISABLEABLE}`}
            >
              {saveState === "saved" ? "Saved!" : "Save"}
            </button>
            {activeSnapshotId && (
              <button
                type="button"
                onClick={deleteConfirming ? handleDeleteConfirmed : armDelete}
                className={`shrink-0 ${deleteConfirming ? BUTTON_DESTRUCTIVE : BUTTON_DESTRUCTIVE_GHOST}`}
              >
                {deleteConfirming ? "Confirm delete" : "Delete"}
              </button>
            )}
          </div>
        </div>

        <label className="block text-sm font-medium text-neutral-300">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={collection.tagline}
            className={`mt-1 w-full ${FIELD} ${FIELD_PLACEHOLDER}`}
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1 text-sm font-medium text-neutral-300">
            Font
            <div className="relative mt-1">
              <select
                value={fontId}
                onChange={(e) => handleFontChange(e.target.value)}
                className={`w-full ${FIELD} ${SELECT}`}
                style={{ fontFamily: `'${fontId}', system-ui, sans-serif` }}
              >
                {FONT_OPTIONS.map((font) => (
                  <option
                    key={font.id}
                    value={font.id}
                    style={{ fontFamily: `'${font.id}', system-ui, sans-serif` }}
                  >
                    {font.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </div>
          </label>
          <label className="block w-36 text-sm font-medium text-neutral-300">
            Weight
            <SelectField
              value={fontWeight}
              onChange={(e) => setFontWeight(Number(e.target.value))}
              wrapperClassName="mt-1"
            >
                {findFontOption(fontId).weights.map((weight) => (
                  <option key={weight} value={weight}>
                    {WEIGHT_LABELS[weight] ?? weight}
                  </option>
                ))}
            </SelectField>
          </label>
          <label
            className={`block w-16 text-sm font-medium ${
              findFontOption(fontId).hasItalic ? "text-neutral-300" : "text-neutral-600"
            }`}
            title={
              findFontOption(fontId).hasItalic ? undefined : `${fontId} doesn't have an italic style`
            }
          >
            Italic
            <div className={`mt-1 flex h-9 items-center ${FIELD}`}>
              <input
                type="checkbox"
                checked={fontItalic}
                disabled={!findFontOption(fontId).hasItalic}
                onChange={(e) => setFontItalic(e.target.checked)}
                className="disabled:opacity-30"
              />
            </div>
          </label>
        </div>

        <div
          className="flex h-16 items-center overflow-hidden rounded-md border border-neutral-800 bg-[#1E1E1E] px-4"
          aria-hidden="true"
        >
          <span
            className="truncate text-2xl"
            style={{
              fontFamily: `'${fontId}', system-ui, sans-serif`,
              fontWeight,
              fontStyle: fontItalic && findFontOption(fontId).hasItalic ? "italic" : "normal",
              color: hexToRgba(
                HEX_PATTERN.test(hex) ? hex : collection.accentHex,
                titleOpacity / 100
              ),
            }}
          >
            {title.trim() || collection.tagline}
          </span>
        </div>

        <div className="flex gap-3">
          <label
            className="block shrink-0 text-sm font-medium text-neutral-300"
            title="The badge and title's own color"
          >
            Timeline color
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={HEX_PATTERN.test(hex) ? hex : collection.accentHex}
                onChange={(e) => setHex(e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-neutral-700 bg-neutral-900 p-1"
              />
              {/* w-28, not flex-1 -- a hex value is always exactly 7
               * characters ("#RRGGBB"), so this never needs to grow with
               * the row; leaving the growing to the opacity slider next to
               * it is what keeps that slider's own "100%" readout from
               * getting crowded into clipping at the row's far edge. */}
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder={collection.accentHex}
                className={`w-28 ${FIELD} ${FIELD_PLACEHOLDER}`}
              />
            </div>
          </label>
          <label
            className="block flex-1 text-sm font-medium text-neutral-300"
            title="How solid the badge and title's color is"
          >
            Title opacity
            <div className="mt-1 flex h-9 items-center gap-2">
              <input
                type="range"
                min={MIN_OPACITY}
                max={MAX_OPACITY}
                step={1}
                value={titleOpacity}
                onChange={(e) => setTitleOpacity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-neutral-300">
                {titleOpacity}%
              </span>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <label
            className="block shrink-0 text-sm font-medium text-neutral-300"
            title="Independent of the timeline color above -- defaults to matching it"
          >
            Rule color
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={
                  HEX_PATTERN.test(ruleHex ?? hex)
                    ? (ruleHex ?? hex)
                    : collection.accentHex
                }
                onChange={(e) => setRuleHex(e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-neutral-700 bg-neutral-900 p-1"
              />
              <input
                type="text"
                value={ruleHex ?? hex}
                onChange={(e) => setRuleHex(e.target.value)}
                placeholder={hex}
                className={`w-28 ${FIELD} ${FIELD_PLACEHOLDER}`}
              />
            </div>
          </label>
          <label
            className="block flex-1 text-sm font-medium text-neutral-300"
            title="How solid the rule lines are, independent of the title opacity above"
          >
            Rule opacity
            <div className="mt-1 flex h-9 items-center gap-2">
              <input
                type="range"
                min={MIN_OPACITY}
                max={MAX_OPACITY}
                step={1}
                value={ruleOpacity}
                onChange={(e) => setRuleOpacity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-neutral-300">
                {ruleOpacity}%
              </span>
            </div>
          </label>
        </div>

        <label className="block text-sm font-medium text-neutral-300">
          Rule thickness
          <p className="mt-0.5 text-xs font-normal text-neutral-500">
            How thick the masthead's rule lines are. Defaults to a size that
            scales with the window when left alone.
          </p>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="range"
              min={MIN_RULE_THICKNESS}
              max={MAX_RULE_THICKNESS}
              step={1}
              value={ruleThicknessPx ?? DEFAULT_RULE_THICKNESS_PX}
              onChange={(e) => setRuleThicknessPx(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 shrink-0 text-right text-sm tabular-nums text-neutral-300">
              {ruleThicknessPx ?? DEFAULT_RULE_THICKNESS_PX}px
            </span>
          </div>
        </label>

        <div>
          <span className="block text-sm font-medium text-neutral-300">Logo image</span>
          {logoUrl ? (
            <div className="group relative mt-1 flex h-16 w-full items-center overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 px-4">
              <img src={logoUrl} alt="" className="max-h-10 w-auto" />
              <LogoResetOverlay onReset={() => setLogoUrl(undefined)} />
            </div>
          ) : (
            <label className="mt-1 block cursor-pointer">
              <span className="flex h-16 w-full flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-neutral-700 bg-neutral-900 text-sm text-neutral-500 hover:border-neutral-500">
                <span>Upload logo image</span>
                <span className="text-xs text-neutral-600">or paste from clipboard</span>
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
            </label>
          )}
        </div>

        <div className="border-t border-neutral-800 pt-4">
          <span className="block text-sm font-medium text-neutral-300">Features</span>
          <p className="mt-0.5 text-xs text-neutral-500">
            Borrow DC Finest's eras and/or Licensed's swim lanes for this tab -- turn on
            either, both, or neither.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              checked={erasEnabled}
              onChange={(e) => setErasEnabled(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Eras
              <span className="block text-xs text-neutral-500">
                Per-era line icons, and era-relative volume numbering (e.g. "M1").
              </span>
            </span>
          </label>
          <label className="mt-2 flex items-start gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              checked={swimLanesEnabled}
              onChange={(e) => setSwimLanesEnabled(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Swim lanes
              <span className="block text-xs text-neutral-500">
                Let a line spread its volumes across multiple stacked lanes when dates
                overlap.
              </span>
            </span>
          </label>
        </div>

        {erasEnabled && (
          <div>
            <span className="block text-sm font-medium text-neutral-300">Eras</span>
            <p className="mt-0.5 text-xs text-neutral-500">
              Oldest first -- each era runs until the next one begins.
            </p>

            <label className="mt-3 block text-sm font-medium text-neutral-300">
              Era color opacity
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                How solid every era's own color is on the era bar -- one dial for
                all of them, not per era.
              </p>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min={MIN_OPACITY}
                  max={MAX_OPACITY}
                  step={1}
                  value={eraOpacity}
                  onChange={(e) => setEraOpacity(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 shrink-0 text-right text-sm tabular-nums text-neutral-300">
                  {eraOpacity}%
                </span>
              </div>
            </label>

            <div className="mt-3 flex flex-col gap-2">
              {eras.map((era, index) => (
                <div key={era.id} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={HEX_PATTERN.test(era.colorHex) ? era.colorHex : DEFAULT_ERA_HEX}
                    onChange={(e) => updateEra(era.id, { colorHex: e.target.value })}
                    className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-neutral-700 bg-neutral-900 p-1"
                  />
                  <input
                    type="text"
                    value={era.label}
                    onChange={(e) => updateEra(era.id, { label: e.target.value })}
                    placeholder="e.g. Modern Age"
                    className={`min-w-0 flex-1 ${FIELD} ${FIELD_PLACEHOLDER}`}
                  />
                  <input
                    type="text"
                    value={era.letter}
                    onChange={(e) => updateEra(era.id, { letter: e.target.value.slice(0, 2) })}
                    placeholder="M"
                    maxLength={2}
                    title='Badge letter, e.g. "M" for "M1"'
                    className={`w-11 shrink-0 text-center ${FIELD} ${FIELD_PLACEHOLDER}`}
                  />
                  {index === 0 ? (
                    <span className="w-20 shrink-0 text-center text-xs text-neutral-500">
                      From the start
                    </span>
                  ) : (
                    <input
                      type="number"
                      value={era.startYear}
                      onChange={(e) => updateEra(era.id, { startYear: Number(e.target.value) })}
                      placeholder="1985"
                      className={`w-20 shrink-0 ${FIELD} ${FIELD_PLACEHOLDER}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => moveEra(index, -1)}
                    disabled={index === 0}
                    aria-label="Move era earlier"
                    className="shrink-0 text-neutral-400 hover:text-white disabled:opacity-20"
                  >
                    <ChevronDownIcon className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEra(index, 1)}
                    disabled={index === eras.length - 1}
                    aria-label="Move era later"
                    className="shrink-0 text-neutral-400 hover:text-white disabled:opacity-20"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEra(era.id)}
                    aria-label="Remove era"
                    className="shrink-0 text-neutral-400 hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEra}
              className="mt-2 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
            >
              <PlusIcon className="h-4 w-4" />
              Add era
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Reset to defaults
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
          >
            Save
          </button>
        </div>
      </div>
    </SettingsModal>
    {showUnsavedPrompt && (
      <UnsavedChangesModal
        entityLabel="timeline configuration"
        onSave={handleSave}
        onDiscard={onClose}
        onKeepEditing={() => setShowUnsavedPrompt(false)}
      />
    )}
    </>
  );
}
