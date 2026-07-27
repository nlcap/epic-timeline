import { useLayoutEffect, useRef, useState } from "react";
import type { Line } from "../types";
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH } from "../lib/timeline";

/**
 * Measures how wide the sidebar pill needs to be to show every line's full
 * name without truncating. Clones the pill's icon/gap/padding/label markup
 * offscreen so the measurement tracks the real styling automatically.
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

    let maxWidth = 0;
    for (const line of lines) {
      const pill = document.createElement("div");
      pill.className = "flex w-fit items-center gap-3 rounded-md px-2";

      const icon = document.createElement("span");
      icon.className =
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] text-xs font-bold";
      icon.textContent = line.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("");

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

  return width;
}
