"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  /** base64-encoded MP4 string */
  src: string;
  /** base64-encoded PNG for the poster/thumbnail (optional) */
  poster?: string;
  label?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function base64ToObjectUrl(base64: string, mimeType: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export default function VideoPlayer({ src, poster, label }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // base64 → object URL for video
  useEffect(() => {
    if (!src) return;
    const url = base64ToObjectUrl(src, "video/mp4");
    setVideoUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    return () => URL.revokeObjectURL(url);
  }, [src]);

  // base64 → object URL for poster
  useEffect(() => {
    if (!poster) return;
    const url = base64ToObjectUrl(poster, "image/png");
    setPosterUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [poster]);

  // Wire video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoaded = () => setDuration(video.duration);
    const onEnded = () => setIsPlaying(false);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const t = Number(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
  }

  function handleFullscreen() {
    videoRef.current?.requestFullscreen().catch(() => {});
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl overflow-hidden bg-black/40 border border-white/10">
      {label && (
        <span className="px-4 pt-3 text-xs font-medium text-white/50 uppercase tracking-wider">
          {label}
        </span>
      )}

      {/* Video element */}
      <div
        className="relative cursor-pointer group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying && setShowControls(true)}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          poster={posterUrl ?? undefined}
          className="w-full max-h-72 object-contain bg-black"
          preload="metadata"
        />

        {/* Play overlay shown when paused */}
        {!isPlaying && showControls && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-3 px-3 pb-3">
        <button
          onClick={togglePlay}
          disabled={!videoUrl}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-purple hover:bg-[#6B3FFF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-white translate-x-px" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!videoUrl}
            className="w-full h-1.5 rounded-full accent-[#5227FF] disabled:opacity-40 cursor-pointer"
            style={{
              background: `linear-gradient(to right, #5227FF ${progress * 100}%, rgba(255,255,255,0.15) ${progress * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[11px] text-white/40 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Fullscreen button */}
        <button
          onClick={handleFullscreen}
          disabled={!videoUrl}
          aria-label="Fullscreen"
          className="flex-shrink-0 text-white/40 hover:text-white/80 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
