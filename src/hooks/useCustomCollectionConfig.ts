import { useCallback, useState } from "react";
import type { CustomEraDef } from "../lib/era";
import { safeSetItem } from "../lib/storage";

const STORAGE_KEY = "epic-timeline:custom-collection-config";

export interface CustomCollectionConfig {
  title?: string;
  /** "Timeline color" in the Configure form -- the badge and title's own
   * color. Independent of ruleColorHex below (which defaults to this when
   * unset), so changing one doesn't silently drag the other along. */
  accentHex?: string;
  /** 0-100, defaults to 100 (fully opaque) when unset -- the badge/title
   * color's own alpha, applied on top of accentHex. */
  titleOpacity?: number;
  /** The masthead's rule lines' own color. Defaults to accentHex when unset
   * -- see CollectionBanner's effectiveRuleColor. */
  ruleColorHex?: string;
  /** 0-100, defaults to 100 (fully opaque) when unset -- independent of
   * titleOpacity above, same "own knob, own default" relationship
   * ruleColorHex itself has with accentHex. */
  ruleOpacity?: number;
  /** The masthead's rule lines' own thickness in px, 0-16. Defaults to the
   * standard responsive clamp every other collection's rules use when unset
   * -- see CollectionBanner's effectiveRuleThickness. */
  ruleThicknessPx?: number;
  logoUrl?: string;
  /** Google Fonts family id (see lib/fonts.ts's FONT_OPTIONS) -- defaults to
   * the app's own DM Sans when unset. */
  fontFamily?: string;
  /** Must be one of the chosen font's own FontOption.weights -- see
   * lib/fonts.ts for why an arbitrary 400-900 value isn't safe to store
   * here regardless of which font it was picked for. */
  fontWeight?: number;
  /** Only meaningful when the chosen font's own FontOption.hasItalic is
   * true -- see lib/fonts.ts. */
  fontItalic?: boolean;
  /** DC Finest-style: lines can carry a different icon per era, and
   * volumes/notes carry an era + era-relative number ("G1"). Independent of
   * swimLanesEnabled below -- both can be on at once. */
  erasEnabled?: boolean;
  /** Licensed-style: a line can spread its volumes across more than one
   * stacked lane, with an optional per-line description shown under its
   * title. Independent of erasEnabled above. */
  swimLanesEnabled?: boolean;
  /** Only meaningful when erasEnabled is true. Ordered oldest-first -- see
   * customEraOptions in lib/era.ts for how this becomes the same EraOption[]
   * shape DC_ERA_OPTIONS uses. */
  eras?: CustomEraDef[];
  /** 0-100, defaults to 100 (fully opaque) when unset -- applies uniformly
   * to every era's own color (see customEraOptions), not a per-era knob. */
  eraOpacity?: number;
}

function load(): CustomCollectionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomCollectionConfig) : {};
  } catch {
    return {};
  }
}

/**
 * The Custom tab's own configuration -- masthead branding (title, timeline
 * color, rule color and thickness, logo image) plus which of DC Finest's
 * eras / Licensed's swim lanes it borrows, editable from CollectionBanner's
 * configure button (see
 * CustomCollectionConfigModal). Kept separate from the Line/Volume override
 * stores in overrideKeys.ts: this is a setting for the tab itself, not
 * timeline data, so it sits outside Export/Import/Reset the same way the
 * active-tab and last-seen-changelog keys already do.
 */
export function useCustomCollectionConfig() {
  const [config, setConfig] = useState<CustomCollectionConfig>(load);

  const update = useCallback((patch: Partial<CustomCollectionConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      safeSetItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { config, update };
}
