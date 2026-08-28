/**
 * The Custom tab's own title font -- a short, curated list of Google Fonts
 * rather than every font Google Fonts has (a couple thousand, most of them
 * wrong for a masthead) or fonts bundled into the project (this app has
 * never shipped a font file of its own -- see index.html's DM Sans <link>,
 * loaded from Google's CDN at build time the same way every font here loads
 * at *pick* time, just eagerly instead of lazily).
 *
 * Each entry's `weights` is that specific family's own real static weight
 * list -- several of the display faces here (Bangers, Anton, Bebas Neue,
 * Righteous, Archivo Black) only ship one weight, because they're already
 * drawn bold/condensed by design, not because of an oversight. Offering a
 * weight picker with options a font doesn't have would just silently fall
 * back to whatever weight the font DOES have, which reads as the control
 * doing nothing -- so the weight <select> has to be driven by this list,
 * never a flat 400-900 range assumed to apply everywhere.
 *
 * Same reasoning for `hasItalic`: not every family here has a drawn italic
 * (the single-weight display faces don't -- an emoji-plus-slant fake italic
 * is worse than no control at all), so the Italic checkbox in
 * CustomCollectionConfigModal is driven by this too, not offered
 * unconditionally.
 */
export interface FontOption {
  /** Also the literal font-family value used in CSS/style props. */
  id: string;
  label: string;
  weights: number[];
  hasItalic: boolean;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "DM Sans", label: "DM Sans (Default)", weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
  { id: "Bangers", label: "Bangers", weights: [400], hasItalic: false },
  { id: "Anton", label: "Anton", weights: [400], hasItalic: false },
  { id: "Bebas Neue", label: "Bebas Neue", weights: [400], hasItalic: false },
  { id: "Righteous", label: "Righteous", weights: [400], hasItalic: false },
  { id: "Archivo Black", label: "Archivo Black", weights: [400], hasItalic: false },
  { id: "Oswald", label: "Oswald", weights: [300, 400, 500, 600, 700], hasItalic: false },
  { id: "Rubik", label: "Rubik", weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
  { id: "Poppins", label: "Poppins", weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
  { id: "Montserrat", label: "Montserrat", weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
  // Serif faces.
  { id: "Playfair Display", label: "Playfair Display", weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
  { id: "Merriweather", label: "Merriweather", weights: [300, 400, 700, 900], hasItalic: true },
  { id: "Lora", label: "Lora", weights: [400, 500, 600, 700], hasItalic: true },
  { id: "Libre Baskerville", label: "Libre Baskerville", weights: [400, 700], hasItalic: true },
  { id: "Crimson Pro", label: "Crimson Pro", weights: [300, 400, 500, 600, 700], hasItalic: true },
  { id: "Bitter", label: "Bitter", weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
];

export const DEFAULT_FONT_ID = "DM Sans";
export const DEFAULT_FONT_WEIGHT = 800;

/** Standard CSS numeric-weight naming -- shown in the weight picker instead
 * of bare numbers so "which one's bolder, 600 or 700" isn't left to the
 * reader to know offhand. */
export const WEIGHT_LABELS: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold",
  800: "Extrabold",
  900: "Black",
};

export function findFontOption(id: string | undefined): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}

/** The weight closest to `target` among a font's own real weights -- used
 * when switching fonts to keep roughly the same boldness instead of
 * snapping to whatever that font's first listed weight happens to be. */
export function nearestWeight(weights: number[], target: number): number {
  return weights.reduce((best, w) =>
    Math.abs(w - target) < Math.abs(best - target) ? w : best
  );
}

/** Builds the `family=` segment of a Google Fonts CSS2 API URL
 * (https://fonts.googleapis.com/css2?family=...&display=swap) from a
 * FontOption -- computed rather than hand-written per entry, since the
 * `ital,wght@0,400;0,700;1,400;1,700`-style syntax for a font with italic
 * is easy to get subtly wrong by hand (wrong separator, axes out of order)
 * across sixteen entries. Requests every weight at both italic and upright
 * in one go for a hasItalic font, so switching the Italic checkbox after
 * the font's already loaded never needs a second fetch. */
function googleFontsFamilyParam(font: FontOption): string {
  const name = font.id.replace(/ /g, "+");
  if (!font.hasItalic) {
    // A single-weight display face with no italic (Bangers, Anton, ...)
    // needs no axis at all -- some of these reject an explicit :wght@400
    // for a weight they don't actually vary, where the bare family name
    // always works.
    return font.weights.length === 1 ? name : `${name}:wght@${font.weights.join(";")}`;
  }
  const pairs = font.weights.flatMap((w) => [`0,${w}`, `1,${w}`]);
  return `${name}:ital,wght@${pairs.join(";")}`;
}

// Pre-seeded with DEFAULT_FONT_ID -- DM Sans is already loaded via the
// static <link> in index.html (the app's own body/display typeface, with a
// wider weight+italic range than any Custom-tab title needs), so
// ensureGoogleFontLoaded treating it as "already loaded" from the start
// avoids fetching a second, redundant stylesheet for it the first time a
// reader opens Configure or lands on a tab already set to the default font.
const loadedFontIds = new Set<string>([DEFAULT_FONT_ID]);

/**
 * Injects a <link> for one font's Google Fonts stylesheet, once per font id
 * per page load (a Set, not a DOM query, since a font already queued by a
 * previous call is still mid-flight the next time this runs and a DOM
 * query wouldn't see it yet). Safe to call on every render that needs a
 * given font -- callers don't need their own "have I loaded this already"
 * bookkeeping.
 */
export function ensureGoogleFontLoaded(fontId: string): void {
  if (loadedFontIds.has(fontId)) return;
  const option = FONT_OPTIONS.find((f) => f.id === fontId);
  if (!option) return;
  loadedFontIds.add(fontId);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleFontsFamilyParam(option)}&display=swap`;
  document.head.appendChild(link);
}
