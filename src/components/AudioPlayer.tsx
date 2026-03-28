"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface AudioPlayerProps {
  /** base64-encoded audio string (wav/mp3) */
  src: string;
  label?: string;
}

function inferAudioMime(base64: string): string {
  if (base64.startsWith("UklGR")) return "audio/wav"; // RIFF
  if (base64.startsWith("SUQz") || base64.startsWith("//uQ")) return "audio/mpeg"; // ID3 / MP3 frame sync
  return "audio/mpeg";
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, label }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const objectUrl = useMemo(() => {
    if (!src) return null;
    // Data URLs already include MIME type — use directly
    if (src.startsWith("data:")) return src;
    const bytes = Uint8Array.from(atob(src), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: inferAudioMime(src) });
    return URL.createObjectURL(blob);
  }, [src]);

  // Revoke object URL when source changes/unmounts (no-op for data URLs)
  useEffect(() => {
    if (!objectUrl || objectUrl.startsWith("data:")) return;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Wire audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
      {label && (
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
          {label}
        </span>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} src={objectUrl ?? undefined} preload="auto" />

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={togglePlay}
          disabled={!objectUrl}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-accent-purple hover:bg-[#6B3FFF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            /* Pause icon */
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            /* Play icon */
            <svg className="w-4 h-4 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress bar + times */}
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!objectUrl}
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
      </div>
    </div>
  );
}
