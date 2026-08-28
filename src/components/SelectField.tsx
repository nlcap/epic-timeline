import type { ChangeEvent, ReactNode } from "react";
import { FIELD, FIELD_DISABLED, SELECT } from "./formStyles";
import { ChevronDownIcon } from "./icons";

/**
 * A `<select>` with the app's own chevron overlaid on it.
 *
 * Native select chrome is sized by the browser to the selected option's
 * text rather than filling its box (Safari especially), so every select in
 * the app drops it -- `appearance-none` plus room on the right (see SELECT
 * in formStyles) -- and draws a chevron on top. That takes a positioning
 * wrapper and an absolutely-placed icon, which meant seven copies of the
 * same three-part sandwich across the two form drawers and the Sandbox
 * configure modal, the chevron's own six-class incantation included.
 *
 * Layout stays at the call site via `wrapperClassName` (`mt-1`, `flex-1`),
 * matching how formStyles/buttonStyles already split look from placement.
 */
export function SelectField({
  value,
  onChange,
  disabled,
  wrapperClassName,
  children,
}: {
  value: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  /** Passing this at all opts the field into the disabled treatment, so a
   * lockable select can't end up styled as though it never locks. */
  disabled?: boolean;
  wrapperClassName?: string;
  /** The `<option>`s. */
  children: ReactNode;
}) {
  return (
    <div className={wrapperClassName ? `relative ${wrapperClassName}` : "relative"}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full ${FIELD} ${SELECT}${disabled === undefined ? "" : ` ${FIELD_DISABLED}`}`}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
    </div>
  );
}
