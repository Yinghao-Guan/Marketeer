"use client";

import type { StyleLock } from "@/types/campaign";

/**
 * Extract dominant colors from an image by drawing it onto a canvas
 * and sampling pixel data. Returns the top `count` hex colors.
 */
export async function extractColors(
  imageBase64: string,
  count = 5
): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 64; // downsample for speed
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      // Count color occurrences (quantized to nearest 32 per channel)
      const colorMap = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const a = data[i + 3];

        // Skip near-white, near-black, and transparent pixels
        if (a < 128) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 16 && g < 16 && b < 16) continue;

        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }

      // Sort by frequency, take top N
      const sorted = [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([hex]) => hex);

      resolve(sorted.length > 0 ? sorted : ["#808080"]);
    };
    img.src = `data:image/png;base64,${imageBase64}`;
  });
}

/**
 * Get a Gemini Vision style description for a logo image.
 * This runs server-side via an API call from the client.
 */
export async function describeStyle(logoBase64: string): Promise<string> {
  const res = await fetch("/api/analyze-logo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logoBase64, describeStyleOnly: true }),
  });
  const data = await res.json();
  return data.style || "modern, clean, professional";
}

/**
 * Build a complete StyleLock from a logo image.
 * Extracts colors client-side and gets a style description from Gemini Vision.
 */
export async function buildStyleLock(
  logoBase64: string
): Promise<StyleLock> {
  const [colors, style] = await Promise.all([
    extractColors(logoBase64),
    describeStyle(logoBase64),
  ]);
  return { colors, style };
}
