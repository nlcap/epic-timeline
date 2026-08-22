/**
 * The shared look of the form drawers' fields. Eighteen inputs and selects
 * across LineFormDrawer and VolumeFormDrawer were each carrying the full
 * class list inline -- the same forty-odd characters of border/background/
 * focus styling repeated verbatim, so restyling a field meant finding and
 * editing every one of them.
 *
 * Split into the parts that actually vary independently rather than one
 * frozen string per variant: a field is the base plus, depending on the
 * site, placeholder colouring (only fields with a placeholder), a disabled
 * treatment (only fields that can be locked), and the extra right padding a
 * select needs to clear its chevron. Layout -- width, `mt-1` -- stays at the
 * call site, where it belongs.
 */

/** Border, background, padding, text, focus ring. Every field has this. */
export const FIELD =
  "rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none";

/** For fields that show placeholder text. */
export const FIELD_PLACEHOLDER = "placeholder:text-neutral-600";

/** For fields that can be locked (Speculation Mode's read-only official
 * lines, the swim-lane picker on a single-lane line). */
export const FIELD_DISABLED = "disabled:opacity-40";

/** Drops the native select arrow and leaves room for the ChevronDownIcon
 * the drawers overlay instead -- see the `relative` wrappers at those call
 * sites. */
export const SELECT = "appearance-none pr-8";
