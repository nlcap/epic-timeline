import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOverlay } from "../hooks/useOverlay";
import type { TourStep } from "../data/tourSteps";

const CALLOUT_WIDTH = 320;
const CALLOUT_MARGIN = 12;
const TARGET_PADDING = 8;

interface CalloutPosition {
  top: number;
  left: number;
}

/** Below the target by default, flipped above if that would overflow the
 * viewport bottom, then clamped on both axes -- the six targets are
 * scattered across the whole screen (top nav, bottom-left corner,
 * vertical-center-right), so a fixed "always below" position would clip
 * off-screen for more than one of them. */
function calloutPosition(rect: DOMRect, cardHeight: number): CalloutPosition {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let top = rect.bottom + CALLOUT_MARGIN;
  if (top + cardHeight > viewportH - CALLOUT_MARGIN) {
    top = rect.top - CALLOUT_MARGIN - cardHeight;
  }
  top = Math.min(Math.max(top, CALLOUT_MARGIN), Math.max(CALLOUT_MARGIN, viewportH - cardHeight - CALLOUT_MARGIN));

  let left = rect.left + rect.width / 2 - CALLOUT_WIDTH / 2;
  left = Math.min(Math.max(left, CALLOUT_MARGIN), Math.max(CALLOUT_MARGIN, viewportW - CALLOUT_WIDTH - CALLOUT_MARGIN));

  return { top, left };
}

/**
 * Full-screen guided tour: dims everything except the current step's real,
 * already-rendered target element (matched via its `data-tour-target`
 * attribute -- see tourSteps.ts for why targets are limited to
 * always-visible, `position: fixed` chrome), with a callout card explaining
 * it. Part of OnboardingFlow, opened after WelcomeModal.
 *
 * Not built on SettingsModal (this isn't a centered dialog), so it
 * registers with useOverlay itself -- same effect as every SettingsModal-
 * based dialog: useGlobalShortcuts stands down for the duration, so the
 * tour's own arrow-key/Enter/Escape handling can't collide with e.g. "s"
 * toggling Speculation Mode underneath it.
 */
export function SpotlightTour({
  steps,
  onFinish,
  onSkip,
}: {
  steps: TourStep[];
  onFinish: () => void;
  onSkip: () => void;
}) {
  useOverlay();

  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(140);

  const step = steps[stepIndex];

  // Re-reads the target's rect on step change and on resize -- every step's
  // target is `position: fixed` (see tourSteps.ts), so page/timeline scroll
  // never moves it; only the viewport itself changing size can. The missing-
  // target skip lives in this SAME effect, not a second one keyed off
  // `targetRect` -- splitting them raced: on mount both effects fire off the
  // same commit, so a "skip if targetRect === null" effect would still see
  // the pre-update (null) value from its own stale closure even though this
  // effect's setTargetRect(rect) had already run moments earlier in the same
  // pass, auto-skipping every step regardless of whether its target was
  // actually found.
  useEffect(() => {
    function measure() {
      const el = document.querySelector(step.targetSelector);
      const rect = el ? el.getBoundingClientRect() : null;
      if (rect === null) {
        if (stepIndex < steps.length - 1) {
          setStepIndex((i) => i + 1);
        } else {
          onFinish();
        }
        return;
      }
      setTargetRect(rect);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [step]);

  // Escape skips, Right/Enter advances, Left goes back. The handlers are
  // read through a ref rather than listed as dependencies -- goNext/goBack
  // are redeclared on every render, so naming them would tear the listener
  // down and re-add it each time, and the old `[stepIndex]` workaround was
  // only correct by coincidence: it happened to re-run often enough to keep
  // the closures fresh. Same pattern as useGlobalShortcuts and
  // useCommitShortcut, which hit this first.
  const keyHandlersRef = useRef({ onSkip, goNext, goBack });
  keyHandlersRef.current = { onSkip, goNext, goBack };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = keyHandlersRef.current;
      if (e.key === "Escape") {
        h.onSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        h.goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        h.goBack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function goNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onFinish();
    }
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (!targetRect) return null;

  const spotlightTop = targetRect.top - TARGET_PADDING;
  const spotlightLeft = targetRect.left - TARGET_PADDING;
  const spotlightWidth = targetRect.width + TARGET_PADDING * 2;
  const spotlightHeight = targetRect.height + TARGET_PADDING * 2;
  const { top: calloutTop, left: calloutLeft } = calloutPosition(targetRect, cardHeight);
  const isLast = stepIndex === steps.length - 1;

  return createPortal(
    // z-[90]: sits above StorageErrorToast's z-[80], the current documented
    // ceiling ("clears every modal in the app") -- this becomes the new one.
    // No background of its own; the cutout div's box-shadow below paints
    // the full-viewport dim. Its only job is to block clicks to the real
    // page everywhere except the callout's own controls, so a stray click
    // during the tour can't land on the real element underneath.
    <div className="fixed inset-0 z-[90]">
      <div
        className="fixed rounded-lg ring-2 ring-white/80 transition-[top,left,width,height] duration-200 ease-out"
        style={{
          top: spotlightTop,
          left: spotlightLeft,
          width: spotlightWidth,
          height: spotlightHeight,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
        }}
      />
      <div
        ref={cardRef}
        className="fixed flex flex-col gap-3 rounded-md border border-neutral-700 bg-neutral-900 p-4 shadow-xl"
        style={{ top: calloutTop, left: calloutLeft, width: CALLOUT_WIDTH }}
      >
        <div>
          <p className="text-xs text-neutral-500">
            {stepIndex + 1} of {steps.length}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">{step.title}</h3>
          <p className="mt-1 text-sm text-neutral-300">{step.body}</p>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-500 hover:text-white"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-200"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
