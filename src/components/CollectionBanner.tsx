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

/**
 * Every clamp-driven size below is applied via inline `style`, not a
 * Tailwind `h-[...]`/`max-w-[...]` class, even where that means repeating
 * `style={{maxWidth: SOME_CONSTANT}}` instead of a one-line class -- the
 * moment a clamp string is built from another constant (`` `calc(${X} *
 * 0.5)` ``) rather than typed out in full, Tailwind's static scanner can no
 * longer find the literal class text in the source to generate CSS for it
 * (it scans raw file text, not evaluated JS -- see Tailwind's own docs on
 * dynamic class names). Every size here is DERIVED from another one
 * (thickness from a logo's own width, a gap from a rule's own width), so
 * inline style is what lets them share a single source of truth safely.
 *
 * The underlying design, all still true: these are wordmark SVGs spelling
 * out a full phrase in one line, not compact glyphs -- the tagline logos
 * run 15-18x wider than they are tall (e.g. the Licensed wordmark's own
 * viewBox is 444x28), so capping only HEIGHT still let a narrow viewport's
 * WIDTH run straight off the screen -- shorter, but not narrower. Bounding
 * width directly (with height following the image's own intrinsic ratio)
 * is what actually guarantees the whole graphic stays on screen. Each
 * max-width clamp's max is that image's exact natural width at the height
 * this banner used before any of this, so nothing changes on an
 * already-roomy screen; each min is roughly 35% of that.
 *
 * The vw term in every clamp below shares one reference viewport width --
 * the width at which the preferred (vw) value crosses the max and the logo
 * hits its full native size. That reference used to be ~1025px, sized
 * around the Licensed wordmark's old 719px-wide art (the widest of the
 * four taglines by a wide margin) needing that much viewport before it had
 * room to reach full size without looking cramped. Now that the Licensed
 * logo is 444px wide -- narrower than Classic's own 505px -- that reference
 * was oversized for every logo including Licensed itself: on an ordinary
 * desktop window (900-1400px, short of 1025px) all four tagline logos and
 * the publisher roundel were rendering visibly under their own max size
 * for no reason. Recomputed at max*100/720 instead, so 720px is the new
 * shared reference -- comfortably above the widest row's actual content
 * width (~690px, Classic's row) with margin to spare, but far below the
 * old 1025px, so logos now reach full size on any normal browser width
 * instead of only the widest ones. Each min floor is unchanged, so
 * nothing gets smaller than before at any viewport -- this only ever
 * scales logos up, never down.
 */
const PUBLISHER_LOGO_WIDTH = "clamp(41px,16.4vw,118px)";

const TAGLINE_LOGO_WIDTH: Record<string, string> = {
  "classic-marvel-epic": "clamp(177px,70.1vw,505px)",
  "modern-marvel-epic": "clamp(148px,58.9vw,424px)",
  ultimate: "clamp(153px,60.6vw,436px)",
  "marvel-licensed-epic": "clamp(156px,61.7vw,444px)",
};

// The connector rule between the publisher logo and the tagline wordmark --
// kept as one named string so the tagline's own right-side gap (see
// TAGLINE_RIGHT_GAP) can stay locked to the exact same curve instead of
// drifting out of sync with a second, independently-tuned clamp.
const CONNECTOR_RULE_WIDTH = "clamp(8px,2vw,32px)";
// 0.1875 (3/16) is exactly what makes this equal the flat 6px the right
// gap used to be, at that rule's own 32px max -- so at full size nothing
// changes, and below that the two gaps shrink in lockstep as the whole
// masthead scales down, rather than the connector rule scaling down while
// this stayed frozen at 6px regardless of viewport.
const TAGLINE_RIGHT_GAP = `calc(${CONNECTOR_RULE_WIDTH} * 0.1875)`;

// All three Marvel-row rules (the two short ones plus the trailing
// flex-1) were a flat 3px regardless of viewport -- a hairline that stayed
// full-weight even once the logos on either side of it had shrunk to a
// third of their size read as too heavy/disconnected from the now-smaller
// graphic. 0.025 is what makes this equal 3px at the publisher logo's own
// 118px max (tied to that clamp specifically, not the tagline's, since the
// publisher logo -- unlike a tagline wordmark -- is present in every row
// regardless of collection). The outer clamp's 1px floor is a hard
// minimum -- Nick's own call -- so a hairline never renders as less than
// what a display can still draw as a crisp, fully-opaque line.
const RULE_THICKNESS = `clamp(1px,calc(${PUBLISHER_LOGO_WIDTH} * 0.025),3px)`;
// Same idea for DC Finest's two gold rules, tied to the DC roundel's own
// clamp instead (that row has no publisher-logo clamp to share). Same 1px
// floor.
//
// Both DC clamps below shared the same ~1024px vw reference the Marvel
// taglines used to (see the big comment above PUBLISHER_LOGO_WIDTH) even
// though DC Finest has always had its own fixed-size mockup, not the old
// 719px Licensed wordmark -- so it was getting throttled by a reference
// tuned for a completely different row. Recomputed at max*100/720 to
// match the same new shared reference, for the same reason: full size on
// any normal browser width instead of only the widest ones. Mins
// unchanged, so this only scales up, never down.
const DC_LOGO_WIDTH = "clamp(28px,8.9vw,64px)";
const DC_WORDMARK_WIDTH = "clamp(133px,46.3vw,333px)";
const DC_RULE_THICKNESS = `clamp(1px,calc(${DC_LOGO_WIDTH} * 0.03125),2px)`;
// The gap between the two rules -- i.e. this row's own height, since each
// rule sits flush against one edge of it (`inset-x-0 top-0`/`bottom-0`
// below) -- was a flat 43px, independent of the logo. That was fine while
// the logo was ALSO flat-fixed (64px, the same 43px gap the original
// mockup paired it with), but once the logo started shrinking on its own
// curve, a fixed 43px gap stopped shrinking with it: at the logo's ~28px
// mobile floor, 43px of gap is already taller than the logo itself, so it
// sits entirely between the two rules instead of straddling them the way
// the desktop version does. 0.671875 is 43/64 -- tying this row's height to
// the SAME clamp the logo uses at that exact ratio keeps the straddle (how
// much of the logo pokes past each rule) visually identical at every size,
// not just at the one width this was originally tuned for.
const DC_ROW_HEIGHT = `calc(${DC_LOGO_WIDTH} * 0.671875)`;

export function CollectionBanner({ collection }: { collection: Collection }) {
  const logo = PUBLISHER_LOGOS[collection.publisherWordmark];
  const taglineLogo = TAGLINE_LOGOS[collection.id];

  if (collection.id === "dc-finest") {
    // Scaled to 2/3 of the original mockup size (every dimension below,
    // including the outer padding) so the banner's total rendered height
    // -- 144px before this pass -- lands at 96px, matching the Marvel
    // banners' logo-driven height (h-12) below instead of towering over it.
    // That 43px is now DC_ROW_HEIGHT rather than a flat number -- see its
    // own comment for why it has to track the logo's clamp to keep the
    // roundel straddling both rules at every size, not just this one.
    return (
      <div className="overflow-hidden px-4 py-[27px]">
        <div className="relative flex items-center" style={{ height: DC_ROW_HEIGHT }}>
          <div
            className="absolute inset-x-0 top-0"
            style={{ height: DC_RULE_THICKNESS, backgroundColor: DC_RULE_GOLD }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: DC_RULE_THICKNESS, backgroundColor: DC_RULE_GOLD }}
          />
          {/* Square (91x91), so width-driven scaling with h-auto keeps it
           * square at every size same as the wordmark's own ratio-driven
           * scaling below -- no separate height clamp needed either. */}
          <img
            src={dcLogo}
            alt="DC"
            className="relative z-10 ml-[21px] h-auto shrink-0"
            style={{ maxWidth: DC_LOGO_WIDTH }}
          />
          <img
            src={dcFinestWordmark}
            alt={collection.tagline}
            className="relative z-10 ml-2 h-auto shrink-0"
            style={{ maxWidth: DC_WORDMARK_WIDTH }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center overflow-hidden px-4 py-6 ${taglineLogo ? "gap-0" : "gap-6"}`}
    >
      {taglineLogo && (
        <div
          className="shrink-0"
          style={{ height: RULE_THICKNESS, width: CONNECTOR_RULE_WIDTH, backgroundColor: collection.accentHex }}
        />
      )}
      {logo ? (
        <img
          src={logo}
          alt={collection.publisherWordmark}
          className="h-auto shrink-0"
          style={{ maxWidth: PUBLISHER_LOGO_WIDTH }}
        />
      ) : (
        <div
          className="max-w-[45vw] shrink-0 truncate px-4 py-2 font-display font-black text-[clamp(12px,3.75vw,24px)] tracking-wide text-white"
          style={{ backgroundColor: collection.accentHex }}
        >
          {collection.publisherWordmark}
        </div>
      )}
      <div
        className={taglineLogo ? "shrink-0" : "flex-1"}
        style={{
          height: RULE_THICKNESS,
          width: taglineLogo ? CONNECTOR_RULE_WIDTH : undefined,
          backgroundColor: collection.accentHex,
        }}
      />
      {taglineLogo ? (
        <img
          src={taglineLogo}
          alt={collection.tagline}
          // A little breathing room before the trailing rule below, so the
          // wordmark doesn't butt straight up against it -- see
          // TAGLINE_RIGHT_GAP for why this is a calc() tied to the
          // connector rule's own clamp rather than a flat margin.
          style={{ maxWidth: TAGLINE_LOGO_WIDTH[collection.id], marginRight: TAGLINE_RIGHT_GAP }}
          className="h-auto shrink-0"
        />
      ) : (
        <h1
          className="max-w-[55vw] truncate font-display font-extrabold text-[clamp(15px,4.75vw,30px)] tracking-wide uppercase"
          style={{ color: collection.accentHex, marginRight: TAGLINE_RIGHT_GAP }}
        >
          {collection.tagline}
        </h1>
      )}
      {/* flex-1 already claims whatever width the (now width-capped) logos
       * to its left don't need, so this stays visible rather than being
       * squeezed toward 0 the way a `shrink-0`-at-a-fixed-size row would --
       * the marginRight above is what keeps it from starting flush against
       * the wordmark's own edge, and the row's own overflow-hidden (above)
       * is the backstop below the 375px floor these clamps target. */}
      <div className="flex-1" style={{ height: RULE_THICKNESS, backgroundColor: collection.accentHex }} />
    </div>
  );
}
