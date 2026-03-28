import { openDB, IDBPDatabase, DBSchema } from "idb";

// TODO: replace with import type { Campaign } from "@/types/campaign" when Person 2 merges
export interface Banner {
  format: "1:1" | "16:9" | "9:16";
  imageBase64: string;
}

export interface StyleLock {
  colors: string[];
  style: string;
}

export interface CampaignProposal {
  tagline: string;
  bannerConcept: string;
  jingleMood: string;
  videoScene: string;
  voiceoverScript: string;
  voiceTone: string;
}

export interface LogoRating {
  overallRating: number;
  formatRatings: {
    banner: { score: number; reasoning: string };
    video: { score: number; reasoning: string };
    social: { score: number; reasoning: string };
  };
  improvements: {
    suggestion: string;
    marketingReason: string;
    priority: "high" | "medium" | "low";
  }[];
  competitorAnalysis: {
    colorOverlap: string;
    differentiation: string;
  };
}

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

  // Logo phase
  approvedLogo: string;
  logoRating: LogoRating;
  styleLock: StyleLock;

  // Proposal phase
  proposal: CampaignProposal;
  jingleMood: string;

  // Generated assets
  banners: Banner[];
  jingle: string;
  video: string;
  voiceover: string;
  finalVideo: string;
  finalVideoVersion?: number;

  // State
  currentStep:
    | "onboarding"
    | "rating"
    | "proposal"
    | "generating"
    | "dashboard";
}

interface MarketeerDB extends DBSchema {
  campaigns: {
    key: string;
    value: Campaign;
    indexes: { createdAt: Date };
  };
}

const DB_NAME = "marketeer-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MarketeerDB>> | null = null;

export function initDB(): Promise<IDBPDatabase<MarketeerDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB<MarketeerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("campaigns", { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  const db = await initDB();
  await db.put("campaigns", campaign);
}

export async function getCampaign(id: string): Promise<Campaign | undefined> {
  const db = await initDB();
  return db.get("campaigns", id);
}

export async function getLatestCampaign(): Promise<Campaign | undefined> {
  const db = await initDB();
  const all = await db.getAll("campaigns");
  if (all.length === 0) return undefined;
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

export async function updateCampaign(
  id: string,
  partial: Partial<Campaign>
): Promise<void> {
  const db = await initDB();
  const existing = await db.get("campaigns", id);
  if (!existing) throw new Error(`Campaign ${id} not found`);
  await db.put("campaigns", { ...existing, ...partial });
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  const db = await initDB();
  const all = await db.getAll("campaigns");
  return all
    .filter((c) => c.currentStep === "dashboard")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function deleteCampaign(id: string): Promise<void> {
  const db = await initDB();
  await db.delete("campaigns", id);
}

// Dev-only seed helper — call window.seedCampaign() in the browser console
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const TINY_PNG =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  const TINY_WAV =
    "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  (window as Window & { seedCampaign?: () => Promise<void> }).seedCampaign =
    async () => {
      const fixture: Campaign = {
        id: "fixture-campaign-1",
        createdAt: new Date(),
        hasLogo: true,
        userLogo: TINY_PNG,
        competitorLogos: [],
        location: "San Francisco",
        industry: "Tech / Software",
        brandName: "Marketeer",
        approvedLogo: TINY_PNG,
        logoRating: {
          overallRating: 8,
          formatRatings: {
            banner: { score: 8, reasoning: "Bold and clean" },
            video: { score: 7, reasoning: "Reads well in motion" },
            social: { score: 9, reasoning: "Highly recognizable" },
          },
          improvements: [
            {
              suggestion: "Increase contrast",
              marketingReason: "Better visibility at small sizes",
              priority: "medium",
            },
          ],
          competitorAnalysis: {
            colorOverlap: "Similar blue tones to competitor",
            differentiation: "Consider warmer accent",
          },
        },
        styleLock: {
          colors: ["#4F46E5", "#818CF8", "#F9FAFB"],
          style: "minimalist, geometric, cool tones",
        },
        proposal: {
          tagline: "Your brand, amplified.",
          bannerConcept: "Clean gradient with bold typography and logo lockup",
          jingleMood: "upbeat, indie pop, 120 BPM",
          videoScene: "Aerial shot of city at golden hour, logo reveal",
          voiceoverScript:
            "Your brand deserves to be heard. Marketeer makes it happen.",
          voiceTone: "warm",
        },
        jingleMood: "upbeat",
        banners: [
          { format: "1:1", imageBase64: TINY_PNG },
          { format: "16:9", imageBase64: TINY_PNG },
          { format: "9:16", imageBase64: TINY_PNG },
        ],
        jingle: TINY_WAV,
        video: TINY_WAV,
        voiceover: TINY_WAV,
        finalVideo: TINY_WAV,
        finalVideoVersion: 3,
        currentStep: "dashboard",
      };
      await saveCampaign(fixture);
      console.log("✓ Fixture campaign seeded — navigate to /dashboard");
    };
}
