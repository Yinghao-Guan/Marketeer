"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import type {
  LyricLine as AMLLLyricLine,
  LyricWord as AMLLLyricWord,
} from "@applemusic-like-lyrics/core";
import type { LyricsData } from "@/types/campaign";
import "@applemusic-like-lyrics/core/style.css";

const LyricPlayer = dynamic(
  () =>
    import("@applemusic-like-lyrics/react").then((m) => {
      const Comp = m.LyricPlayer;
      return { default: Comp } as { default: typeof Comp };
    }),
  { ssr: false }
);

interface LyricsPlayerProps {
  src: string;
  lyrics?: LyricsData;
}

function inferAudioMime(base64: string): string {
  if (base64.startsWith("UklGR")) return "audio/wav";
  if (base64.startsWith("SUQz") || base64.startsWith("//uQ"))
    return "audio/mpeg";
  return "audio/mpeg";
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Bokeh particle ──────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const BOKEH_COLORS = [
  "rgba(130, 80, 255, 0.4)",
  "rgba(255, 60, 170, 0.35)",
  "rgba(60, 180, 255, 0.35)",
  "rgba(255, 140, 50, 0.25)",
  "rgba(100, 255, 200, 0.25)",
  "rgba(200, 80, 255, 0.3)",
  "rgba(255, 100, 130, 0.3)",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 6 + Math.random() * 28,
    duration: 5 + Math.random() * 8,
    delay: Math.random() * -10,
    color: BOKEH_COLORS[i % BOKEH_COLORS.length],
  }));
}

// ── Floating music notes ────────────────────────────────────────────────────

interface NoteParticle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  type: number; // 0 = single note, 1 = double note, 2 = beamed notes
  opacity: number;
}

function generateNotes(count: number): NoteParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    size: 14 + Math.random() * 14,
    duration: 3 + Math.random() * 4,
    delay: (i / count) * -6,
    drift: -30 + Math.random() * 60,
    type: i % 3,
    opacity: 0.15 + Math.random() * 0.25,
  }));
}

const NOTE_COLORS = [
  "#c084fc",
  "#e879f9",
  "#818cf8",
  "#f9a8d4",
  "#a78bfa",
  "#f472b6",
];

function NoteSVG({ type, color }: { type: number; color: string }) {
  if (type === 1) {
    // double beamed notes
    return (
      <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
        <path d="M9 3v14a3 3 0 1 1-2-2.83V5h10v10a3 3 0 1 1-2-2.83V5H9V3h10v2H9z" opacity="0.9" />
        <rect x="7" y="3" width="12" height="2" rx="1" fill={color} />
      </svg>
    );
  }
  if (type === 2) {
    // single note with flag
    return (
      <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
        <path d="M12 3v14a3 3 0 1 1-2-2.83V3h2z" opacity="0.9" />
        <path d="M12 3c3 1 4 3.5 2 6l-2-1V3z" fill={color} opacity="0.7" />
      </svg>
    );
  }
  // quarter note
  return (
    <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
      <path d="M12 3v14a3 3 0 1 1-2-2.83V3h2z" opacity="0.9" />
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function LyricsPlayer({ src, lyrics }: LyricsPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 3-band audio-reactive state
  const [bassLevel, setBassLevel] = useState(0);
  const [midLevel, setMidLevel] = useState(0);
  const [trebleLevel, setTrebleLevel] = useState(0);

  const particles = useMemo(() => generateParticles(20), []);
  const notes = useMemo(() => generateNotes(12), []);

  const objectUrl = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    const bytes = Uint8Array.from(atob(src), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: inferAudioMime(src) });
    return URL.createObjectURL(blob);
  }, [src]);

  useEffect(() => {
    if (!objectUrl || objectUrl.startsWith("data:")) return;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

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

  // ── Web Audio analyser setup ──────────────────────────────────────────────

  const initAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceRef.current) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;
      analyserRef.current = analyser;
    } catch {
      // AudioContext may fail in some environments
    }
  }, []);

  // animation loop for audio-reactive visuals
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      const len = dataArray.length;
      const third = Math.floor(len / 3);

      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      for (let i = 0; i < third; i++) bassSum += dataArray[i];
      for (let i = third; i < third * 2; i++) midSum += dataArray[i];
      for (let i = third * 2; i < len; i++) trebleSum += dataArray[i];

      setBassLevel(bassSum / third / 255);
      setMidLevel(midSum / third / 255);
      setTrebleLevel(trebleSum / (len - third * 2) / 255);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      initAnalyser();
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
  const hasLyrics = lyrics && lyrics.lines.length > 0;
  const energy = (bassLevel + midLevel + trebleLevel) / 3;

  const amllLines: AMLLLyricLine[] = useMemo(() => {
    if (!hasLyrics) return [];
    return lyrics.lines.map((line) => ({
      words: line.words.map(
        (w, i, arr): AMLLLyricWord => ({
          word: i < arr.length - 1 ? w.word + " " : w.word,
          startTime: w.startTime,
          endTime: w.endTime,
          romanWord: "",
          obscene: false,
        })
      ),
      startTime: line.startTime,
      endTime: line.endTime,
      translatedLyric: "",
      romanLyric: "",
      isBG: false,
      isDuet: false,
    }));
  }, [lyrics, hasLyrics]);

  // ── Derived visual values ─────────────────────────────────────────────────

  const glowIntensity = isPlaying ? 0.3 + bassLevel * 0.7 : 0.15;

  const borderGlow = isPlaying
    ? `0 0 ${20 + bassLevel * 45}px rgba(130, 80, 255, ${glowIntensity}),
       0 0 ${40 + bassLevel * 70}px rgba(255, 60, 170, ${glowIntensity * 0.5}),
       inset 0 0 ${30 + bassLevel * 30}px rgba(130, 80, 255, ${glowIntensity * 0.3})`
    : "0 0 10px rgba(130, 80, 255, 0.1), inset 0 0 10px rgba(130, 80, 255, 0.05)";

  const containerScale = isPlaying ? 1 + bassLevel * 0.008 : 1;

  const hueShift = Math.round(trebleLevel * 60);

  const progressGlow = isPlaying
    ? `0 0 ${6 + energy * 14}px rgba(130, 80, 255, ${0.4 + energy * 0.5}),
       0 0 ${12 + energy * 20}px rgba(255, 60, 170, ${energy * 0.3})`
    : "none";

  const pulseSpeed = isPlaying ? Math.max(0.6, 1.4 - bassLevel * 0.8) : 1.2;

  return (
    <>
    {/* ── Floating music notes across entire viewport ── */}
    {isPlaying && (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 50, overflow: "hidden" }}
      >
        {notes.map((n) => (
          <motion.div
            key={n.id}
            className="absolute"
            style={{
              left: `${n.x}%`,
              bottom: -n.size,
              width: n.size,
              height: n.size,
            }}
            animate={{
              y: [0, -(window?.innerHeight ?? 900) - n.size * 2],
              x: [0, n.drift],
              opacity: [0, n.opacity, n.opacity, 0],
              rotate: [0, n.drift > 0 ? 25 : -25],
              scale: [0.4, 1, 1, 0.5],
            }}
            transition={{
              duration: n.duration,
              repeat: Infinity,
              ease: "easeOut",
              delay: n.delay,
            }}
          >
            <NoteSVG type={n.type} color={NOTE_COLORS[n.id % NOTE_COLORS.length]} />
          </motion.div>
        ))}
      </div>
    )}
    <div
      className="relative flex flex-col gap-0 rounded-2xl overflow-hidden amll-karaoke-wrapper"
      style={{
        boxShadow: borderGlow,
        border: `1px solid rgba(130, 80, 255, ${0.15 + glowIntensity * 0.35})`,
        transform: `scale(${containerScale})`,
        transition: "box-shadow 0.15s ease-out, border-color 0.15s ease-out, transform 0.1s ease-out",
      }}
    >
      {/* ── Neon gradient text for active lyrics ── */}
      <style jsx global>{`
        .amll-karaoke-wrapper .amll-lyric-player {
          --amll-lp-color: white;
          mix-blend-mode: normal;
        }

        /* disable hover highlight on lyric lines */
        .amll-karaoke-wrapper [class*="_lyricLine_"]:has(>*):hover,
        .amll-karaoke-wrapper [class*="_lyricLine_"]:has(>*):active {
          background-color: transparent !important;
          cursor: default;
        }

        /* active lyric line — vivid gradient text, fully opaque */
        .amll-karaoke-wrapper [class*="_lyricLine_"]:not([class*="_dirty_"]) [class*="_lyricMainLine_"] span {
          background: linear-gradient(
            90deg,
            #c084fc 0%,
            #e879f9 25%,
            #f9a8d4 50%,
            #818cf8 75%,
            #c084fc 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: karaoke-shimmer 4s ease-in-out infinite;
          opacity: 1 !important;
        }

        @keyframes karaoke-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* interlude dots — match the neon palette */
        .amll-karaoke-wrapper [class*="_interludeDots_"] > * {
          background-color: #c084fc !important;
          box-shadow: 0 0 6px rgba(192, 132, 252, 0.6);
        }
      `}</style>

      {/* ── Audio-reactive gradient background ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 30% 20%,
              hsla(${265 + hueShift}, 85%, ${10 + bassLevel * 28}%, 1) 0%,
              transparent 60%
            ),
            radial-gradient(
              ellipse at 70% 80%,
              hsla(${320 + hueShift}, 75%, ${8 + trebleLevel * 22}%, 1) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse at 50% 40%,
              hsla(${240 + Math.round(midLevel * 30)}, 60%, ${6 + midLevel * 14}%, 1) 0%,
              transparent 45%
            ),
            radial-gradient(
              ellipse at 50% 50%,
              hsla(220, 50%, ${5 + bassLevel * 10}%, 1) 0%,
              hsl(240, 20%, 3%) 100%
            )
          `,
          transition: "background 0.12s ease-out",
        }}
      />

      {/* ── Pulsing vignette overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse at 50% 50%,
            transparent ${isPlaying ? 30 + bassLevel * 25 : 40}%,
            rgba(0, 0, 0, ${isPlaying ? 0.5 - bassLevel * 0.2 : 0.4}) 100%
          )`,
          transition: "background 0.15s ease-out",
        }}
      />

      {/* ── Bokeh particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size + (isPlaying ? bassLevel * 12 : 0),
              height: p.size + (isPlaying ? bassLevel * 12 : 0),
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.color,
              filter: `blur(${p.size / 3 + (isPlaying ? midLevel * 4 : 0)}px)`,
              transition: "width 0.12s, height 0.12s, filter 0.12s",
            }}
            animate={
              isPlaying
                ? {
                    y: [0, -40 - bassLevel * 30, 20, -15, 0],
                    x: [0, 15, -20, 8, 0],
                    scale: [1, 1.3 + bassLevel * 0.6, 0.85, 1.15, 1],
                    opacity: [0.5, 0.85 + bassLevel * 0.15, 0.3, 0.65, 0.5],
                  }
                : {
                    y: [0, -6, 4, -2, 0],
                    x: [0, 3, -3, 1, 0],
                    scale: [1, 1.03, 0.98, 1.01, 1],
                    opacity: [0.15, 0.22, 0.12, 0.18, 0.15],
                  }
            }
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <audio
        ref={audioRef}
        src={objectUrl ?? undefined}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* ── Lyrics display with beat-reactive glow ── */}
      {hasLyrics && (
        <div className="relative z-10 px-4 pt-5 pb-3">
          <div
            className="relative overflow-hidden rounded-lg"
            style={{
              height: 220,
              filter: isPlaying
                ? `drop-shadow(0 0 ${10 + midLevel * 18}px rgba(130, 80, 255, ${0.35 + midLevel * 0.45}))
                   drop-shadow(0 0 ${4 + trebleLevel * 10}px rgba(255, 60, 170, ${trebleLevel * 0.35}))`
                : "none",
              transition: "filter 0.12s ease-out",
            }}
          >
            <LyricPlayer
              lyricLines={amllLines}
              currentTime={Math.round(currentTime * 1000)}
              playing={isPlaying}
              enableSpring={true}
              enableBlur={true}
              enableScale={true}
              alignPosition={0.4}
              wordFadeWidth={0.5}
              style={{
                width: "100%",
                height: "100%",
                textAlign: "center",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pb-4 pt-1">
        {/* play / pause */}
        <button
          onClick={togglePlay}
          disabled={!objectUrl}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: isPlaying
              ? `radial-gradient(circle, #7c3aed, #5227FF)`
              : "#5227FF",
            boxShadow: isPlaying
              ? `0 0 ${14 + bassLevel * 25}px rgba(130, 80, 255, ${0.5 + bassLevel * 0.4}),
                 0 0 ${30 + bassLevel * 40}px rgba(255, 60, 170, ${bassLevel * 0.35})`
              : "0 0 8px rgba(82, 39, 255, 0.3)",
            transition: "box-shadow 0.1s ease-out",
          }}
        >
          {/* pulse ring when playing — speed reacts to bass */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-purple-400/40"
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{
                duration: pulseSpeed,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          )}
          {isPlaying ? (
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-white translate-x-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* progress bar */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!objectUrl}
              className="w-full h-1.5 rounded-full accent-[#5227FF] disabled:opacity-40 cursor-pointer relative z-10"
              style={{
                background: `linear-gradient(to right,
                  #7c3aed ${progress * 100}%,
                  rgba(255,255,255,0.1) ${progress * 100}%)`,
              }}
            />
            {/* glow layer under the progress bar */}
            <div
              className="absolute top-1/2 left-0 h-1.5 rounded-full -translate-y-1/2 pointer-events-none"
              style={{
                width: `${progress * 100}%`,
                boxShadow: progressGlow,
                background: "transparent",
                transition: "box-shadow 0.12s ease-out",
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/40 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
