import defaultLineIcon from "../assets/line_icon_default.png";

/**
 * Line icons are opaque square images (not transparent PNGs), so they're
 * cropped to the circle via the parent badge's `overflow-hidden rounded-full`
 * rather than relying on alpha. Falls back to a shared default until a line
 * gets its own `iconUrl`.
 */
export function LineIcon({ iconUrl, className }: { iconUrl?: string; className?: string }) {
  return (
    <img
      src={iconUrl ?? defaultLineIcon}
      alt=""
      className={className ?? "h-full w-full object-cover"}
    />
  );
}
