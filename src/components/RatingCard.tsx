"use client";

import type { LogoRating, Improvement } from "@/types/campaign";

// ── Score Ring ────────────────────────────────────────────

function ScoreRing({
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
            className="text-neutral-800"
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
        <span className="text-xs text-neutral-400 uppercase tracking-wide">
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
}: {
  label: string;
  score: number;
  reasoning: string;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-neutral-800 last:border-0">
      <ScoreRing score={score} size={56} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white">{label}</h4>
        <p className="text-sm text-neutral-400 mt-0.5">{reasoning}</p>
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
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
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
      <p className="text-xs text-neutral-400 mt-1">
        {improvement.marketingReason}
      </p>
      <button
        onClick={onApply}
        disabled={applying}
        className="mt-3 w-full py-2 px-4 rounded-lg bg-white text-black text-sm font-medium
          hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {applying ? "Applying..." : "Apply this improvement"}
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
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">
        Competitor Analysis
      </h3>
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
          Color Overlap
        </p>
        <p className="text-sm text-neutral-300">{colorOverlap}</p>
      </div>
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
          Differentiation
        </p>
        <p className="text-sm text-neutral-300">{differentiation}</p>
      </div>
    </div>
  );
}

// ── Main RatingCard ──────────────────────────────────────

export default function RatingCard({
  rating,
  onApplyImprovement,
  applyingIndex,
}: {
  rating: LogoRating;
  onApplyImprovement: (index: number) => void;
  applyingIndex: number | null;
}) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex flex-col items-center py-4">
        <ScoreRing score={rating.overallRating} size={120} />
        <p className="text-neutral-400 text-sm mt-2">Overall Rating</p>
      </div>

      {/* Per-format Ratings */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          Format Effectiveness
        </h3>
        <FormatRow
          label="Banner"
          score={rating.formatRatings.banner.score}
          reasoning={rating.formatRatings.banner.reasoning}
        />
        <FormatRow
          label="Video Ad"
          score={rating.formatRatings.video.score}
          reasoning={rating.formatRatings.video.reasoning}
        />
        <FormatRow
          label="Social Media"
          score={rating.formatRatings.social.score}
          reasoning={rating.formatRatings.social.reasoning}
        />
      </div>

      {/* Competitor Analysis */}
      {rating.competitorAnalysis && (
        <CompetitorSection
          colorOverlap={rating.competitorAnalysis.colorOverlap}
          differentiation={rating.competitorAnalysis.differentiation}
        />
      )}

      {/* Improvements */}
      {rating.improvements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            Suggested Improvements
          </h3>
          {rating.improvements.map((imp, i) => (
            <ImprovementCard
              key={i}
              improvement={imp}
              onApply={() => onApplyImprovement(i)}
              applying={applyingIndex === i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
