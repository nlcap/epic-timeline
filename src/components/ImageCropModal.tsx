import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_SIZE = 280;
const OUTPUT_SIZE = 512;
// Multiplier on top of the "cover fit" base scale (see baseScale below) --
// 3x didn't let the user zoom in close enough on a small detail within a
// larger source image.
const MAX_ZOOM_MULTIPLIER = 6;

/**
 * Interstitial square-crop step for line icon uploads, shown between
 * picking a file and it actually becoming the icon. Line icons always
 * render through a circular mask (LineIcon.tsx's rounded-full parent), so
 * this crops to a square that mask can safely clip from any side -- the
 * user chooses which part of the source image that square is, rather than
 * leaving it to CSS's blind center-crop.
 *
 * Portaled to document.body: LineFormDrawer's own form element always
 * carries a `transform` (its slide-in transition's translate-x-*), which
 * makes it the containing block for any descendant `position: fixed`
 * element -- the same trap that broke VolumeTile's hover preview earlier,
 * fixed there the same way.
 */
export function ImageCropModal({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  // scale = baseScale * zoom. baseScale is the "cover fit" scale computed
  // once the image loads (its smaller dimension exactly fills the square
  // viewport with zero gaps); zoom is a 1..MAX_ZOOM_MULTIPLIER slider on
  // top of that, so 1 always means "as zoomed out as the crop allows".
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originOffset: { x: number; y: number } } | null>(
    null
  );

  const scale = baseScale * zoom;

  // Keeps the image edges from ever pulling inward past the viewport --
  // without this, panning or zooming out could reveal empty space around
  // the square instead of always having image to crop.
  const clampOffset = (
    raw: { x: number; y: number },
    s: number,
    nat: { width: number; height: number }
  ) => {
    const maxX = Math.max(0, (nat.width * s - VIEWPORT_SIZE) / 2);
    const maxY = Math.max(0, (nat.height * s - VIEWPORT_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, raw.x)),
      y: Math.min(maxY, Math.max(-maxY, raw.y)),
    };
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const nat = { width: img.naturalWidth, height: img.naturalHeight };
    setNaturalSize(nat);
    setBaseScale(VIEWPORT_SIZE / Math.min(nat.width, nat.height));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originOffset: offset };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !naturalSize) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(
      clampOffset(
        { x: dragRef.current.originOffset.x + dx, y: dragRef.current.originOffset.y + dy },
        scale,
        naturalSize
      )
    );
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  // A zoom change can make the current pan invalid at the new scale (e.g.
  // zooming out from a corner can pull that corner inward past the
  // viewport) -- reclamp whenever it changes.
  useEffect(() => {
    if (!naturalSize) return;
    setOffset((prev) => clampOffset(prev, baseScale * zoom, naturalSize));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, naturalSize, baseScale]);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !naturalSize) return;
    // Same centered-plus-offset placement math the image's own inline
    // style below uses, inverted to find which natural-image rectangle the
    // viewport square currently shows -- see spanToPx-style helpers
    // elsewhere in this app for the general shape of this kind of mapping.
    const imgLeft = VIEWPORT_SIZE / 2 - (naturalSize.width * scale) / 2 + offset.x;
    const imgTop = VIEWPORT_SIZE / 2 - (naturalSize.height * scale) / 2 + offset.y;
    const cropX = -imgLeft / scale;
    const cropY = -imgTop / scale;
    const cropSize = VIEWPORT_SIZE / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    onConfirm(canvas.toDataURL("image/png"));
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-sm rounded-md border border-neutral-700 bg-[#252526] p-6">
        <h2 className="text-lg font-bold text-white">Crop icon</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Drag to reposition, use the slider to zoom. The square is exactly what becomes the icon.
        </p>

        <div
          className="relative mx-auto mt-4 touch-none select-none overflow-hidden rounded-md border border-neutral-700 bg-neutral-900"
          style={{
            width: VIEWPORT_SIZE,
            height: VIEWPORT_SIZE,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            draggable={false}
            onLoad={handleImageLoad}
            className="absolute left-1/2 top-1/2 max-w-none"
            style={
              naturalSize
                ? {
                    width: naturalSize.width * scale,
                    height: naturalSize.height * scale,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }
                // Kept in the DOM (not conditionally rendered) so onLoad
                // always fires on the actual <img> that's displayed once
                // sized -- just hidden until we know its natural size.
                : { opacity: 0 }
            }
          />
        </div>

        <label className="mt-4 flex items-center gap-3 text-xs text-neutral-400">
          Zoom
          <input
            type="range"
            min={1}
            max={MAX_ZOOM_MULTIPLIER}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            disabled={!naturalSize}
            className="flex-1 disabled:opacity-40"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!naturalSize}
            className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:enabled:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use this crop
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
