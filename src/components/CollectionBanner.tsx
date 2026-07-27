import type { Collection } from "../types";
import marvelLogo from "../assets/logo_marvel.svg";
import dcLogo from "../assets/logo_dc.svg";
import dcFinestWordmark from "../assets/logo_dc_finest_wordmark.svg";
import classicEpicTaglineLogo from "../assets/logo_classic_epic_tagline.svg";
import modernTaglineLogo from "../assets/logo_modern_tagline.svg";
import ultimateTaglineLogo from "../assets/logo_ultimate_tagline.svg";
import licensedTaglineLogo from "../assets/logo_licensed_tagline.svg";

const PUBLISHER_LOGOS: Record<string, string> = {
  MARVEL: marvelLogo,
  DC: dcLogo,
};

// DC Finest's own reference mockup: two rules (gold, not the Marvel-style
// accent color) with the roundel logo straddling both, and the "FINEST"
// glow wordmark centered in the gap between them.
const DC_RULE_GOLD = "#C9A227";

const TAGLINE_LOGOS: Record<string, string> = {
  "classic-marvel-epic": classicEpicTaglineLogo,
  "modern-marvel-epic": modernTaglineLogo,
  ultimate: ultimateTaglineLogo,
  "marvel-licensed-epic": licensedTaglineLogo,
};

// Most tagline logos are exported with the glyph nearly filling their SVG
// viewBox, so a shared CSS height renders them at a consistent visual size.
// The licensed logo's viewBox has extra vertical padding baked in, so it
// needs a taller box to match the others' glyph height.
const TAGLINE_LOGO_HEIGHT: Record<string, string> = {
  "marvel-licensed-epic": "h-10",
};
const DEFAULT_TAGLINE_LOGO_HEIGHT = "h-7";

export function CollectionBanner({ collection }: { collection: Collection }) {
  const logo = PUBLISHER_LOGOS[collection.publisherWordmark];
  const taglineLogo = TAGLINE_LOGOS[collection.id];

  if (collection.id === "dc-finest") {
    // Scaled to 2/3 of the original mockup size (every dimension below,
    // including the outer padding) so the banner's total rendered height
    // -- 144px before this pass -- lands at 96px, matching the Marvel
    // banners' logo-driven height (h-12) below instead of towering over it.
    return (
      <div className="px-4 py-[27px]">
        <div className="relative flex items-center" style={{ height: 43 }}>
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ backgroundColor: DC_RULE_GOLD }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[2px]"
            style={{ backgroundColor: DC_RULE_GOLD }}
          />
          <img
            src={dcLogo}
            alt="DC"
            className="relative z-10 ml-[21px] h-16 w-16 shrink-0"
          />
          <img
            src={dcFinestWordmark}
            alt={collection.tagline}
            className="relative z-10 ml-2 h-[37px] w-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center px-4 py-6 ${taglineLogo ? "gap-0" : "gap-6"}`}>
      {taglineLogo && (
        <div className="h-[3px] w-8 shrink-0" style={{ backgroundColor: collection.accentHex }} />
      )}
      {logo ? (
        <img
          src={logo}
          alt={collection.publisherWordmark}
          className="h-12 w-auto shrink-0"
        />
      ) : (
        <div
          className="px-4 py-2 font-display font-black text-2xl tracking-wide text-white shrink-0"
          style={{ backgroundColor: collection.accentHex }}
        >
          {collection.publisherWordmark}
        </div>
      )}
      <div
        className={`h-[3px] ${taglineLogo ? "w-8 shrink-0" : "flex-1"}`}
        style={{ backgroundColor: collection.accentHex }}
      />
      {taglineLogo ? (
        <img
          src={taglineLogo}
          alt={collection.tagline}
          className={`w-auto shrink-0 ${TAGLINE_LOGO_HEIGHT[collection.id] ?? DEFAULT_TAGLINE_LOGO_HEIGHT}`}
        />
      ) : (
        <h1
          className="font-display font-extrabold text-3xl tracking-wide uppercase whitespace-nowrap"
          style={{ color: collection.accentHex }}
        >
          {collection.tagline}
        </h1>
      )}
      <div className="h-[3px] flex-1" style={{ backgroundColor: collection.accentHex }} />
    </div>
  );
}
