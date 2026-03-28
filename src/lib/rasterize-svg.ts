/**
 * Converts an SVG data URL to a PNG data URL by drawing it on a canvas.
 * The SVG is loaded into an <img> element (which blocks scripts),
 * rendered to a canvas, and returned as a PNG data URL.
 */
export function rasterizeSvgDataUrl(
  svgDataUrl: string,
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

        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        reject(
          new Error(
            "could not convert this SVG — it may reference external resources. try uploading a PNG instead."
          )
        );
      }
    };

    img.onerror = () =>
      reject(new Error("failed to load SVG image"));

    img.src = svgDataUrl;
  });
}
