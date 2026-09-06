import { useLayoutEffect, useRef, useState } from "react";
import type { Line } from "../types";
import {
  SIDEBAR_ICON_BORDER_BY_ZOOM,
  SIDEBAR_ICON_OVERHANG_PX,
  SIDEBAR_ICON_SIZE_BY_ZOOM,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_PILL_GAP_PX,
} from "../lib/timeline";

/**
 * Zoom level the probe below is built at. Deliberately the widest one:
 * `sidebarWidth` is a single zoom-independent number (the grid lines, the
 * sticky axis header and the Add Line button all align to the column it
 * produces, and having that column jump on every zoom step would be worse
 * than carrying a little slack), so it has to be sized for whichever zoom
 * level needs the most room. Level 1 is that level -- it has the largest
 * icon, and the icon is the only zoom-scaled part of the measurement.
 *
 * Zoomed-out levels then have a few px of slack in the column rather than
 * clipping their labels, which is the right way round.
 */
const PROBE_ZOOM_LEVEL = 1;

/**
 * Measures how wide the sidebar pill needs to be to show every line's full
 * name without truncating.
 *
 * The probe mirrors LineRow's real pill: same padding and label typography
 * via the same utility classes, and -- the parts that actually vary -- the
 * icon's size, border and negative left margin taken from the very
 * constants LineRow itself renders from. It used to hardcode `h-10 w-10`
 * (40px) and omit the margin entirely while claiming to track the real
 * styling automatically, which under-measured level 1 by 4px (a 56px icon
 * pulled 12px left contributes 44px, not 40) and so truncated the longest
 * line names just short of fitting.
 *
 * Reproducing the negative margin matters as much as the size: it shrinks
 * the icon's contribution to the flex line, so a probe with the right icon
 * and no margin is wrong in the other direction.
 */
export function useSidebarWidth(lines: Line[]): number {
  const [width, setWidth] = useState(SIDEBAR_MIN_WIDTH);
  const probeRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!probeRef.current) {
      const probe = document.createElement("div");
      probe.style.position = "fixed";
      probe.style.top = "-9999px";
      probe.style.left = "-9999px";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      document.body.appendChild(probe);
      probeRef.current = probe;
    }
    const probe = probeRef.current;
    probe.innerHTML = "";

    const iconSize = SIDEBAR_ICON_SIZE_BY_ZOOM[PROBE_ZOOM_LEVEL];
    const iconBorder = SIDEBAR_ICON_BORDER_BY_ZOOM[PROBE_ZOOM_LEVEL];

    let maxWidth = 0;
    for (const line of lines) {
      const pill = document.createElement("div");
      // px-2 matches the real pill's own horizontal padding; the gap is set
      // below rather than via `gap-3` so it reads from the same constant
      // LineRow scales by labelOpacity.
      pill.className = "flex w-fit items-center rounded-md px-2";
      pill.style.gap = `${SIDEBAR_PILL_GAP_PX}px`;

      const icon = document.createElement("span");
      icon.className = "flex shrink-0 items-center justify-center rounded-full";
      icon.style.width = `${iconSize}px`;
      icon.style.height = `${iconSize}px`;
      icon.style.borderWidth = `${iconBorder}px`;
      icon.style.borderStyle = "solid";
      icon.style.marginLeft = `${-SIDEBAR_ICON_OVERHANG_PX}px`;
      // No content: the box is explicitly sized, so nothing inside it has
      // ever contributed to the measurement.

      const label = document.createElement("span");
      label.className = "whitespace-nowrap text-sm font-semibold";
      label.textContent = line.name;

      pill.appendChild(icon);
      pill.appendChild(label);
      probe.appendChild(pill);
      maxWidth = Math.max(maxWidth, pill.getBoundingClientRect().width);
    }

    setWidth(
      lines.length === 0
        ? SIDEBAR_MIN_WIDTH
        : Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.ceil(maxWidth)))
    );
  }, [lines]);

  // Torn down on unmount rather than left behind -- this hook outlives most
  // of the app, but an orphaned probe in <body> is still a leak, and one per
  // mount would accumulate under StrictMode's double-invoke.
  useLayoutEffect(() => {
    return () => {
      probeRef.current?.remove();
      probeRef.current = null;
    };
  }, []);

  return width;
}
