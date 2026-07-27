/** Converts a "#RRGGBB" hex string + opacity (0-1) into an rgba() string. */
export function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * The five-tier opacity system: one hex per Line, reused everywhere.
 *   - ring/badge: always 100%
 *   - tile background: 10% (unowned/rest) / 35% (owned/rest)
 *   - focused tile or detail panel: 15% (unowned) / 65% (owned)
 */
export const TILE_OPACITY = {
  unownedRest: 0.1,
  ownedRest: 0.35,
  unownedFocused: 0.15,
  ownedFocused: 0.65,
} as const;

export function tileBackground(
  colorHex: string,
  owned: boolean,
  focused: boolean
): string {
  const opacity = owned
    ? focused
      ? TILE_OPACITY.ownedFocused
      : TILE_OPACITY.ownedRest
    : focused
    ? TILE_OPACITY.unownedFocused
    : TILE_OPACITY.unownedRest;
  return hexToRgba(colorHex, opacity);
}

/**
 * Speculative volume tile fill: the line color darkened toward black rather
 * than made transparent, so it stays fully opaque (distinct from the
 * opacity-based tileBackground system above, which speculative tiles don't
 * use at all).
 */
export function speculativeTileBackground(colorHex: string): string {
  return `color-mix(in srgb, black 75%, ${colorHex} 25%)`;
}

/** Speculative title text (line pill and volume tile alike): the line color
 * lightened toward white (an even 50/50 mix), so it reads on the dark
 * speculative background without being plain white. */
export function speculativeTextColor(colorHex: string): string {
  return `color-mix(in srgb, white 50%, ${colorHex} 50%)`;
}

/**
 * Speculation Mode's single accent color (Tailwind fuchsia-700, matching
 * the toggle's old bg-fuchsia-700/80) -- the one place this hex lives, so
 * every Speculation Mode-tinted UI (the toggle switch, the viewport vignette
 * in App.tsx, anything added later) stays in lockstep when it's adjusted.
 */
export const SPECULATION_ACCENT_HEX = "#A21CAF";
