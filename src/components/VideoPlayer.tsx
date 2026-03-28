"use client";

import { useEffect, useMemo } from "react";

interface VideoPlayerProps {
  /** base64-encoded MP4 string */
  src: string;
  /** base64-encoded PNG for the poster/thumbnail (optional) */
  poster?: string;
  label?: string;
}

function base64ToObjectUrl(base64: string, mimeType: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export default function VideoPlayer({ src, poster, label }: VideoPlayerProps) {
  const videoUrl = useMemo(() => {
    if (!src) return null;
    return base64ToObjectUrl(src, "video/mp4");
  }, [src]);

  const posterUrl = useMemo(() => {
    if (!poster) return null;
    return base64ToObjectUrl(poster, "image/png");
  }, [poster]);

  useEffect(() => {
    if (!videoUrl) return;
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    if (!posterUrl) return;
    return () => URL.revokeObjectURL(posterUrl);
  }, [posterUrl]);

  return (
    <div className="flex flex-col gap-2 rounded-xl overflow-hidden bg-white/5 border border-white/10 p-3">
      {label && (
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
          {label}
        </span>
      )}

      <video
        src={videoUrl ?? undefined}
        poster={posterUrl ?? undefined}
        controls
        playsInline
        preload="auto"
        className="w-full max-h-72 object-contain rounded-lg bg-black"
      />
    </div>
  );
}
