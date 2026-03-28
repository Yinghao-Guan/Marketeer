"use client";

// Dev-only page to seed sessionStorage and jump straight to any Person 3 page.
// Visit: http://localhost:3000/dev

import { useRouter } from "next/navigation";

const TINY_PNG =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const MOCK_CAMPAIGN = {
    hasLogo: true,
    userLogo: TINY_PNG,
    competitorLogos: [],
    location: "San Francisco, CA",
    industry: "Tech / Software",
    brandName: "Marketeer",
    approvedLogo: TINY_PNG,
    logoDescription: "A minimalist geometric logo with indigo and white tones",
    styleLock: {
        colors: ["#4F46E5", "#818CF8", "#F9FAFB"],
        style: "minimalist, geometric, cool tones, professional",
    },
    competitorAnalysis: {
        colorOverlap: "Competitor uses similar blue tones",
        differentiation: "Consider warmer accent colors to stand apart",
    },
    logoRating: {
        overallRating: 8,
        formatRatings: {
            banner: { score: 8, reasoning: "Bold and clean" },
            video: { score: 7, reasoning: "Reads well in motion" },
            social: { score: 9, reasoning: "Highly recognizable" },
        },
        improvements: [],
        competitorAnalysis: {
            colorOverlap: "Similar blue tones",
            differentiation: "Use warmer accent",
        },
    },
    jingleMood: "upbeat",
};

export default function DevPage() {
    const router = useRouter();

    const seed = (destination: string) => {
        sessionStorage.setItem("marketeer-campaign", JSON.stringify(MOCK_CAMPAIGN));
        router.push(destination);
    };

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="w-full max-w-sm px-4 space-y-4">
                <h1 className="text-xl font-bold text-center mb-6">Dev Shortcuts</h1>
                <p className="text-white/40 text-sm text-center mb-8">
                    Seeds sessionStorage with mock data and jumps to the target page.
                </p>

                <button
                    onClick={() => seed("/proposal")}
                    className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                >
                    → Test Proposal Page
                </button>
                <button
                    onClick={() => {
                        const withProposal = {
                            ...MOCK_CAMPAIGN,
                            proposal: {
                                tagline: "Your brand, amplified.",
                                bannerConcept: "Clean gradient with bold typography and logo lockup",
                                jingleMood: "upbeat indie pop, 120 BPM",
                                videoScene: "Aerial shot of a modern city at golden hour, smooth camera push, logo reveal",
                                voiceoverScript: "Your brand deserves to be heard. Marketeer makes it happen.",
                                voiceTone: "warm",
                            },
                        };
                        sessionStorage.setItem("marketeer-campaign", JSON.stringify(withProposal));
                        router.push("/generating");
                    }}
                    className="w-full py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                >
                    → Test Generating Page
                </button>
            </div>
        </main>
    );
}
