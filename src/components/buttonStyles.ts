/**
 * The shared look of the app's dialog and drawer buttons -- the companion
 * to formStyles.ts, which does the same for form fields.
 *
 * The secondary/Cancel treatment alone was spelled out fourteen times
 * across six files, so restyling it meant finding every copy. Same split
 * as formStyles: these carry the button's *look*, while layout -- `flex-1`,
 * `w-full`, `mt-3` -- stays at the call site, where what a button does to
 * its container is a property of that layout rather than of the button.
 *
 * Each constant already includes BASE, so a call site is
 * `` className={`flex-1 ${BUTTON_SECONDARY}`} ``.
 *
 * Deliberately NOT unified: the onboarding modals' own primary button is
 * `font-medium text-neutral-900` where every other primary in the app is
 * `font-semibold text-neutral-950`. That's a real (if small) visual
 * difference, so collapsing the two here would be a design change wearing
 * a refactor's clothes -- it's left alone and called out instead.
 */

/** Shape, padding and text size. Every button below starts here. */
const BASE = "rounded-md px-4 py-2 text-sm";

/** Cancel, Close, "Choose another file" -- the quiet option in a pair. */
export const BUTTON_SECONDARY = `${BASE} border border-neutral-700 font-medium text-neutral-300 hover:text-white`;

/** Secondary, for the places where it can also be disabled. Note
 * `hover:enabled:` rather than plain `hover:` -- a disabled button
 * shouldn't light up under the cursor. */
export const BUTTON_SECONDARY_DISABLEABLE = `${BASE} border border-neutral-700 font-medium text-neutral-300 transition-colors hover:enabled:text-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600`;

/** The confirming action in a pair -- Save, Update, Use this crop. */
export const BUTTON_PRIMARY = `${BASE} bg-white font-semibold text-neutral-950 hover:bg-neutral-200`;

/** Primary, for the places where it can also be disabled. */
export const BUTTON_PRIMARY_DISABLEABLE = `${BASE} bg-white font-semibold text-neutral-950 hover:enabled:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40`;

/** The settings dialogs' own confirming action -- a softer off-white with
 * a border, used where the button sits on the dialog's darker card rather
 * than in a drawer footer. */
export const BUTTON_PRIMARY_LIGHT = `${BASE} border border-neutral-700 bg-neutral-100 font-medium text-neutral-900 transition-colors hover:enabled:bg-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-800 disabled:text-neutral-600`;

/** Solid red -- the irreversible one, for a confirmed delete or reset. */
export const BUTTON_DESTRUCTIVE = `${BASE} bg-red-600 font-semibold text-white hover:bg-red-500`;

/** Borderless red -- opens a delete confirmation rather than performing
 * one, so it reads as available without shouting. */
export const BUTTON_DESTRUCTIVE_GHOST = `${BASE} border border-transparent font-medium text-red-400 hover:text-red-300`;
