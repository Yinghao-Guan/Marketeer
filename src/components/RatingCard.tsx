"use client";

import type { LogoRating, Improvement } from "@/types/campaign";

// ── Score Ring ────────────────────────────────────────────

export function ScoreRing({
  score,
  size = 80,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 10) * circumference;

  const color =
    score >= 8
      ? "text-green-500 stroke-green-500"
      : score >= 5
        ? "text-yellow-500 stroke-yellow-500"
        : "text-red-500 stroke-red-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-white/10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - filled}
            strokeLinecap="round"
            className={`${color} transition-all duration-700`}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}
        >
          {score.toFixed(1)}
        </span>
      </div>
      {label && (
        <span className="text-xs text-white/50 uppercase tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}

// ── Format Rating Row ────────────────────────────────────

function FormatRow({
  label,
  score,
  reasoning,
  prevScore,
}: {
  label: string;
  score: number;
  reasoning: string;
  prevScore?: number;
}) {
  const delta = prevScore != null ? score - prevScore : null;
  return (
    <div className="flex items-start gap-3 sm:gap-4 py-3 border-b border-white/10 last:border-0">
      <ScoreRing score={score} size={56} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-white">{label}</h4>
          {delta != null && delta !== 0 && (
            <span className={`text-xs font-medium ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
              {delta > 0 ? "+" : ""}{delta.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-white/50 mt-0.5">{reasoning}</p>
      </div>
    </div>
  );
}

// ── Improvement Card ─────────────────────────────────────

function ImprovementCard({
  improvement,
  onApply,
  applying,
}: {
  improvement: Improvement;
  onApply: () => void;
  applying: boolean;
}) {
  const priorityColors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priorityColors[improvement.priority]}`}
        >
          {improvement.priority}
        </span>
      </div>
      <p className="text-sm text-white font-medium">
        {improvement.suggestion}
      </p>
      <p className="text-xs text-white/50 mt-1">
        {improvement.marketingReason}
      </p>
      <button
        onClick={onApply}
        disabled={applying}
        className="mt-3 w-full py-2 px-4 rounded-full bg-white text-black text-sm font-medium
          hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {applying ? "applying..." : "apply this improvement"}
      </button>
    </div>
  );
}

// ── Competitor Analysis ──────────────────────────────────

function CompetitorSection({
  colorOverlap,
  differentiation,
}: {
  colorOverlap: string;
  differentiation: string;
}) {
  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">
        competitor analysis
      </h3>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
          Color Overlap
        </p>
        <p className="text-sm text-white/60">{colorOverlap}</p>
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
          Differentiation
        </p>
        <p className="text-sm text-white/60">{differentiation}</p>
      </div>
    </div>
  );
}

// ── Main RatingCard ──────────────────────────────────────

export default function RatingCard({
  rating,
  previousRating,
  onApplyImprovement,
  applyingIndex,
  hideOverallScore = false,
}: {
  rating: LogoRating;
  previousRating?: LogoRating | null;
  onApplyImprovement: (index: number) => void;
  applyingIndex: number | null;
  hideOverallScore?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      {!hideOverallScore && (
        <div className="flex flex-col items-center py-4">
          <ScoreRing score={rating.overallRating} size={120} />
          <p className="text-white/50 text-sm mt-2">overall rating</p>
        </div>
      )}

      {/* Per-format Ratings + Competitor Analysis — side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            format effectiveness
          </h3>
          <FormatRow
            label="banner"
            score={rating.formatRatings.banner.score}
            reasoning={rating.formatRatings.banner.reasoning}
            prevScore={previousRating?.formatRatings.banner.score}
          />
          <FormatRow
            label="video ad"
            score={rating.formatRatings.video.score}
            reasoning={rating.formatRatings.video.reasoning}
            prevScore={previousRating?.formatRatings.video.score}
          />
          <FormatRow
            label="social media"
            score={rating.formatRatings.social.score}
            reasoning={rating.formatRatings.social.reasoning}
            prevScore={previousRating?.formatRatings.social.score}
          />
        </div>

        {/* Competitor Analysis */}
        {rating.competitorAnalysis && (
          <CompetitorSection
            colorOverlap={rating.competitorAnalysis.colorOverlap}
            differentiation={rating.competitorAnalysis.differentiation}
          />
        )}
      </div>

      {/* Improvements */}
      {rating.improvements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            suggested improvements
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {rating.improvements.map((imp, i) => (
              <ImprovementCard
                key={i}
                improvement={imp}
                onApply={() => onApplyImprovement(i)}
                applying={applyingIndex === i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
