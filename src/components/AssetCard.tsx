"use client";

interface AssetCardProps {
  title: string;
  children: React.ReactNode;
  onRegenerate?: () => void;
  onDownload?: () => void;
  isRegenerating?: boolean;
}

export default function AssetCard({
  title,
  children,
  onRegenerate,
  onDownload,
  isRegenerating = false,
}: AssetCardProps) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white/80">{title}</span>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              onClick={onDownload}
              aria-label="Download"
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              aria-label="Regenerate"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white/70 hover:text-white"
            >
              <svg
                className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRegenerating ? "Regenerating…" : "Regenerate"}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>

      {/* Regenerating overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-8 h-8 text-indigo-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm text-white/70">Regenerating…</span>
          </div>
        </div>
      )}
    </div>
  );
}
