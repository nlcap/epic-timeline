/**
 * Marks the space on a line's row before its debut quarter -- not user
 * data, purely derived each render from the line's own debutDate against
 * the visible timeline's start (see LineRow.tsx). Same soft blurred-pill
 * treatment as a "publication" GapSegment, but a flat low-opacity black
 * instead of pulling the line's own color, and non-interactive (no click,
 * no pointer events) so it never blocks a real tile someone adds over the
 * same span later.
 */
export function PreDebutFiller() {
  return (
    <div
      className="pointer-events-none h-full w-full blur-[4px]"
      style={{ backgroundColor: "rgba(12, 12, 12, .15)" }}
    />
  );
}
