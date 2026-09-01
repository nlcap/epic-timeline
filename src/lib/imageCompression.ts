import type { TimelineEntry } from "../types";

/**
 * Cover images are stored as data URLs inside a single JSON blob per
 * localStorage key (see useVolumeOverrides/useSpeculativeVolumes) -- an
 * uncompressed phone photo can be several MB, and Firefox's ~5-10MB
 * per-origin localStorage quota is easy to blow past. localStorage.setItem
 * throws synchronously when that happens, with nothing catching it, which
 * crashes the whole app. Re-encoding through a canvas keeps covers small
 * enough that a single upload (or the whole stored collection) stays well
 * under quota.
 */
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.82;

/** Below this, re-encoding isn't worth the size/quality tradeoff. */
const RECOMPRESS_THRESHOLD_BYTES = 150_000;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = dataUrl;
  });
}

/** True if any pixel in the canvas isn't fully opaque. Checked after
 * drawImage, once every pixel has actually been painted, so an all-opaque
 * source never trips this just for having an alpha channel. */
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true;
  }
  return false;
}

/**
 * Re-encodes a data URL as a downscaled JPEG, or PNG when the source has
 * any transparent pixels -- JPEG has no alpha channel, so the canvas
 * encoder flattens a transparent image (a logo, say) onto solid black
 * instead. Falls back to the original on any failure (unsupported format,
 * canvas errors) rather than blocking the save -- a large-but-working
 * image beats none at all.
 */
async function compressDataUrl(dataUrl: string): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    ctx.drawImage(img, 0, 0, width, height);
    const compressed = hasTransparency(ctx, width, height)
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return compressed.length < dataUrl.length ? compressed : dataUrl;
  } catch {
    return dataUrl;
  }
}

export async function compressImageFile(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  return compressDataUrl(dataUrl);
}

/**
 * Pulls an image out of a paste event's clipboard data, if there is one --
 * lets cover/icon paste-from-clipboard feed the same File-based pipeline
 * the file `<input>`s already use. Returns null (leaving the event, and
 * whatever default paste behavior it has, alone) when the clipboard holds
 * anything else, e.g. copied text pasted into a nearby field.
 */
export function getPastedImageFile(e: { clipboardData: DataTransfer | null }): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  return null;
}

type EntryChange = TimelineEntry | "deleted";
type OverrideMap = Record<string, EntryChange>;

/**
 * One-time-per-load migration for covers that were saved before compression
 * existed (or saved from a browser with a looser quota than Firefox's).
 * Only re-encodes entries over the threshold, so once a cover has been
 * compressed this is a no-op for it on future loads.
 */
export async function recompressStoredCovers(
  overrides: OverrideMap
): Promise<{ changed: boolean; next: OverrideMap }> {
  let changed = false;
  const next: OverrideMap = { ...overrides };

  for (const [id, entry] of Object.entries(overrides)) {
    if (entry === "deleted" || entry.kind === "gap" || !entry.coverUrl) continue;
    if (entry.coverUrl.length <= RECOMPRESS_THRESHOLD_BYTES) continue;

    const compressed = await compressDataUrl(entry.coverUrl);
    if (compressed.length < entry.coverUrl.length) {
      next[id] = { ...entry, coverUrl: compressed };
      changed = true;
    }
  }

  return { changed, next };
}
