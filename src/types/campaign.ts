// ── Logo Rating ──────────────────────────────────────────

export interface FormatRating {
  score: number;
  reasoning: string;
}

export interface Improvement {
  suggestion: string;
  marketingReason: string;
  priority: "high" | "medium" | "low";
}

export interface CompetitorAnalysis {
  colorOverlap: string;
  differentiation: string;
}

export interface LogoRating {
  overallRating: number;
  formatRatings: {
    banner: FormatRating;
    video: FormatRating;
    social: FormatRating;
  };
  improvements: Improvement[];
  competitorAnalysis: CompetitorAnalysis;
}

// ── Style Lock ───────────────────────────────────────────

export interface StyleLock {
  colors: string[];
  style: string;
}

// ── Campaign Proposal ────────────────────────────────────

export interface CampaignProposal {
  tagline: string;
  bannerConcept: string;
  jingleMood: string;
  videoScene: string;
  voiceoverScript: string;
  voiceTone: string;
}

// ── Lyrics ───────────────────────────────────────────────

export interface LyricWord {
  word: string;
  startTime: number; // milliseconds
  endTime: number;   // milliseconds
}

export interface LyricLine {
  words: LyricWord[];
  startTime: number; // milliseconds
  endTime: number;   // milliseconds
}

export interface LyricsData {
  lines: LyricLine[];
}

// ── Assets ───────────────────────────────────────────────

export interface Banner {
  format: "1:1" | "16:9" | "9:16";
  imageBase64: string;
}

// ── Campaign (full state) ────────────────────────────────

export interface Campaign {
  id: string;
  createdAt: Date;

  // Inputs
  hasLogo: boolean;
  userLogo: string | null;
  competitorLogos: string[];
  location: string;
  industry: string;
  brandName: string;
  description: string;

  // Logo phase
  approvedLogo?: string;
  logoRating?: LogoRating | null;
  styleLock?: StyleLock;

  // Proposal phase
  proposal?: CampaignProposal;
  jingleMood?: string;

  // Generated assets
  banners?: Banner[];
  jingle?: string;
  lyrics?: LyricsData;
  video?: string;
  voiceover?: string;
  finalVideo?: string;
  finalVideoVersion?: number;

  // State
  currentStep:
    | "onboarding"
    | "rating"
    | "proposal"
    | "generating"
    | "dashboard";
}
