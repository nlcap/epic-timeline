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
  unownedRest: 0.15,
  ownedRest: 0.35,
  unownedFocused: 0.2,
  ownedFocused: 0.6,
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
  // Unshelved (unowned) tiles mix in a touch of white before the opacity
  // fade, the same "blend then fade" shape as ownedTileBorderColor below --
  // a straight opacity fade of the raw line color reads a little flat/dark
  // at these low opacities, especially for darker line colors.
  if (!owned) {
    const tint = `color-mix(in srgb, ${colorHex} 90%, white 10%)`;
    return `color-mix(in srgb, ${tint} ${opacity * 100}%, transparent)`;
  }
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
 * Owned-tile border ring (see VolumeTile.tsx): tinted with the line's own
 * color instead of flat white, so it reads as "this line's owned volume"
 * rather than a generic highlight -- and rendered on the tile's actual CSS
 * border (not a separate inset box-shadow), so it sits flush with the
 * tile's true outer edge instead of 1px inside it. Kept translucent (40%
 * transparent) to stay a subtle accent, not a bold outline.
 *
 * `color-mix()` only takes two colors per call, so the color+white blend
 * and the opacity fade are two nested calls, not one three-way mix (an
 * earlier version tried a single three-argument call -- invalid CSS, which
 * the browser silently drops in favor of the border's default, so it
 * rendered as plain Tailwind gray instead of erroring).
 */
export function ownedTileBorderColor(colorHex: string): string {
  const tint = `color-mix(in srgb, ${colorHex} 75%, white 25%)`;
  return `color-mix(in srgb, ${tint} 25%, transparent)`;
}

/**
 * Speculation Mode's single accent color (Tailwind fuchsia-700, matching
 * the toggle's old bg-fuchsia-700/80) -- the one place this hex lives, so
 * every Speculation Mode-tinted UI (the toggle switch, the viewport vignette
 * in App.tsx, anything added later) stays in lockstep when it's adjusted.
 */
export const SPECULATION_ACCENT_HEX = "#A21CAF";
