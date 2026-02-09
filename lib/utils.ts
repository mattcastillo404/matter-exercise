import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the natural dimensions of an image from a data URL or object URL.
 */
function getImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Resize an image (URL or data URL) to match the dimensions of a reference
 * image. Returns a data URL of the resized image. If the dimensions already
 * match, the source is returned as-is.
 */
export async function resizeImageToMatch(
  sourceUrl: string,
  referenceDataUrl: string
): Promise<string> {
  const [srcDims, refDims] = await Promise.all([
    getImageDimensions(sourceUrl),
    getImageDimensions(referenceDataUrl),
  ]);

  if (srcDims.width === refDims.width && srcDims.height === refDims.height) {
    return sourceUrl;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = sourceUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = refDims.width;
  canvas.height = refDims.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, refDims.width, refDims.height);

  return canvas.toDataURL("image/png");
}
