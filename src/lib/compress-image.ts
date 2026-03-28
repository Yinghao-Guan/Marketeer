/**
 * Compresses and resizes any image data URL to fit within maxSize dimensions.
 * Large phone camera photos (4-12MB+) get shrunk to ~50-150KB, keeping them
 * well under Vercel's 4.5MB request body limit.
 *
 * - SVGs are rasterized to PNG (they may have transparency)
 * - PNGs stay as PNG (to preserve transparency)
 * - Everything else becomes JPEG at 0.85 quality (smaller file size)
 */
export function compressImage(
  dataUrl: string,
  maxSize = 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let w = img.naturalWidth || maxSize;
        let h = img.naturalHeight || maxSize;

        // Scale down if larger than maxSize, preserving aspect ratio
        const scale = Math.min(maxSize / w, maxSize / h, 1);
        w = Math.round(w * scale);
        h = Math.round(h * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("failed to get canvas context"));
          return;
        }

        // Use PNG for formats that may have transparency (SVG, PNG, WebP)
        // Use JPEG for everything else (much smaller file size)
        const hasAlpha =
          dataUrl.startsWith("data:image/svg+xml") ||
          dataUrl.startsWith("data:image/png") ||
          dataUrl.startsWith("data:image/webp");

        ctx.drawImage(img, 0, 0, w, h);

        if (hasAlpha) {
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        }
      } catch {
        reject(
          new Error(
            "could not process this image — try uploading a PNG instead."
          )
        );
      }
    };

    img.onerror = () => reject(new Error("failed to load image"));

    img.src = dataUrl;
  });
}

/**
 * Kept for backwards compatibility — same as compressImage but only
 * accepts SVG data URLs. Existing callers can switch to compressImage directly.
 */
export function rasterizeSvgDataUrl(
  svgDataUrl: string,
  maxSize = 1024
): Promise<string> {
  return compressImage(svgDataUrl, maxSize);
}
