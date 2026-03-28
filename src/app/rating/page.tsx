"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import RatingCard from "@/components/RatingCard";
import { buildStyleLock } from "@/lib/style-lock";
import type { LogoRating, StyleLock } from "@/types/campaign";

type Phase = "loading" | "generating-logo" | "analyzing" | "ready" | "error";

export default function RatingPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [rating, setRating] = useState<LogoRating | null>(null);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  // Pull campaign state from sessionStorage (set by onboarding pages)
  const getCampaignData = useCallback(() => {
    const data = sessionStorage.getItem("marketeer-campaign");
    return data ? JSON.parse(data) : null;
  }, []);

  const saveCampaignData = useCallback(
    (updates: Record<string, unknown>) => {
      const current = getCampaignData() || {};
      sessionStorage.setItem(
        "marketeer-campaign",
        JSON.stringify({ ...current, ...updates })
      );
    },
    [getCampaignData]
  );

  // ── Initial load: generate or analyze logo ─────────────
  useEffect(() => {
    const campaign = getCampaignData();
    if (!campaign) {
      setError("No campaign data found. Please start from the beginning.");
      setPhase("error");
      return;
    }

    const run = async () => {
      try {
        let logo = campaign.userLogo;

        // Path B: no logo — generate one first
        if (!logo) {
          setPhase("generating-logo");
          const genRes = await fetch("/api/generate-logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              industry: campaign.industry,
              location: campaign.location,
              competitorAnalysis: "",
              brandDescription: campaign.brandName || "",
            }),
          });
          if (!genRes.ok) throw new Error("Logo generation failed");
          const genData = await genRes.json();
          logo = genData.imageBase64;
          saveCampaignData({ userLogo: logo, generatedLogo: true });
        }

        setLogoBase64(logo);

        // Analyze the logo
        setPhase("analyzing");
        const analyzeRes = await fetch("/api/analyze-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logoBase64: logo,
            competitorLogosBase64: campaign.competitorLogos || [],
            industry: campaign.industry || "general",
            location: campaign.location || "",
          }),
        });
        if (!analyzeRes.ok) throw new Error("Logo analysis failed");
        const ratingData: LogoRating = await analyzeRes.json();

        setRating(ratingData);
        saveCampaignData({ logoRating: ratingData });
        setPhase("ready");
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Something went wrong");
        setPhase("error");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply improvement ──────────────────────────────────
  const handleApplyImprovement = async (index: number) => {
    if (!rating || !logoBase64) return;
    setApplyingIndex(index);

    try {
      const improvement = rating.improvements[index];
      const res = await fetch("/api/improve-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoBase64,
          improvement: improvement.suggestion,
        }),
      });
      if (!res.ok) throw new Error("Improvement failed");
      const data = await res.json();

      const newLogo = data.imageBase64;
      setLogoBase64(newLogo);
      saveCampaignData({ userLogo: newLogo });

      // Re-analyze with the improved logo
      setPhase("analyzing");
      const campaign = getCampaignData();
      const analyzeRes = await fetch("/api/analyze-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoBase64: newLogo,
          competitorLogosBase64: campaign?.competitorLogos || [],
          industry: campaign?.industry || "general",
          location: campaign?.location || "",
        }),
      });
      if (!analyzeRes.ok) throw new Error("Re-analysis failed");
      const newRating: LogoRating = await analyzeRes.json();

      setRating(newRating);
      saveCampaignData({ logoRating: newRating });
      setPhase("ready");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Improvement failed");
    } finally {
      setApplyingIndex(null);
    }
  };

  // ── Approve & continue ─────────────────────────────────
  const handleApprove = async () => {
    saveCampaignData({ approvedLogo: logoBase64 });

    // Build Style Lock from the approved logo
    try {
      const styleLock: StyleLock = await buildStyleLock(logoBase64);
      saveCampaignData({ styleLock });
    } catch (e) {
      console.error("Style lock extraction failed, continuing anyway", e);
      saveCampaignData({
        styleLock: { colors: ["#808080"], style: "modern, clean" },
      });
    }

    router.push("/proposal");
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-2">Logo Rating</h1>
        <p className="text-neutral-400 text-center mb-8">
          {phase === "generating-logo"
            ? "Generating your logo..."
            : phase === "analyzing"
              ? "Analyzing your logo with AI..."
              : phase === "ready"
                ? "Here's how your logo performs across formats"
                : ""}
        </p>

        {/* Loading / generating states */}
        {(phase === "loading" ||
          phase === "generating-logo" ||
          phase === "analyzing") && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-400 text-sm">
              {phase === "generating-logo"
                ? "Creating a logo for your brand..."
                : "Running marketing analysis..."}
            </p>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Ready: show logo + ratings */}
        {phase === "ready" && rating && (
          <>
            {/* Logo preview */}
            <div className="flex justify-center mb-8">
              <div className="w-48 h-48 rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${logoBase64}`}
                  alt="Your logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Rating details */}
            <RatingCard
              rating={rating}
              onApplyImprovement={handleApplyImprovement}
              applyingIndex={applyingIndex}
            />

            {/* Approve button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleApprove}
                className="px-8 py-3 rounded-xl bg-white text-black font-semibold text-lg
                  hover:bg-neutral-200 transition-colors"
              >
                Approve &amp; Continue
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
