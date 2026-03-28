"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import RatingCard from "@/components/RatingCard";
import { buildStyleLock } from "@/lib/style-lock";
import type { LogoRating, StyleLock } from "@/types/campaign";

type Phase = "loading" | "generating-logo" | "analyzing" | "improving" | "ready" | "error";

interface LogoHistoryEntry {
  logoBase64: string;
  rating: LogoRating;
  improvement?: string;
}

export default function RatingPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [rating, setRating] = useState<LogoRating | null>(null);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [logoHistory, setLogoHistory] = useState<LogoHistoryEntry[]>([]);

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

  // ── Initial load ──────────────────────────────────────
  useEffect(() => {
    const campaign = getCampaignData();
    if (!campaign) {
      setError("No campaign data found. Please start from the beginning.");
      setPhase("error");
      return;
    }

    // Load history if available
    if (campaign.logoHistory) {
      setLogoHistory(campaign.logoHistory);
    }

    // Use cached rating if available
    if (campaign.logoRating && campaign.userLogo) {
      setLogoBase64(campaign.userLogo);
      setRating(campaign.logoRating);
      setPhase("ready");
      return;
    }

    const run = async () => {
      try {
        let logo = campaign.userLogo;

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

        // Save initial logo to history
        const initialEntry: LogoHistoryEntry = { logoBase64: logo, rating: ratingData };
        setLogoHistory([initialEntry]);
        saveCampaignData({ logoHistory: [initialEntry] });

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

  // ── Apply improvement ─────────────────────────────────
  const handleApplyImprovement = async (index: number) => {
    if (!rating || !logoBase64) return;
    setApplyingIndex(index);
    setPhase("improving");

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

      // Re-analyze
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

      // Add to history
      const entry: LogoHistoryEntry = {
        logoBase64: newLogo,
        rating: newRating,
        improvement: improvement.suggestion,
      };
      const updatedHistory = [...logoHistory, entry];
      setLogoHistory(updatedHistory);
      saveCampaignData({ logoHistory: updatedHistory });

      setPhase("ready");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Improvement failed");
      setPhase("error");
    } finally {
      setApplyingIndex(null);
    }
  };

  // ── Revert to previous logo ───────────────────────────
  const handleRevert = (historyIndex: number) => {
    const entry = logoHistory[historyIndex];
    setLogoBase64(entry.logoBase64);
    setRating(entry.rating);
    saveCampaignData({
      userLogo: entry.logoBase64,
      logoRating: entry.rating,
    });
  };

  // ── Approve & continue ────────────────────────────────
  const handleApprove = () => {
    saveCampaignData({ approvedLogo: logoBase64 });

    buildStyleLock(logoBase64)
      .then((styleLock: StyleLock) => saveCampaignData({ styleLock }))
      .catch(() =>
        saveCampaignData({
          styleLock: { colors: ["#808080"], style: "modern, clean" },
        })
      );

    router.push("/proposal");
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Loading states */}
        {(phase === "loading" ||
          phase === "generating-logo" ||
          phase === "analyzing" ||
          phase === "improving") && (
          <div className="flex flex-col items-center gap-6 py-24">
            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-2xl font-semibold text-white text-center">
              {phase === "generating-logo"
                ? "Creating your logo..."
                : phase === "improving"
                  ? "Applying improvement..."
                  : "Analyzing your logo..."}
            </p>
            <p className="text-white/50 text-sm">
              {phase === "generating-logo"
                ? "Designing something unique for your brand"
                : phase === "improving"
                  ? "Refining your logo based on feedback"
                  : "Running marketing analysis across formats"}
            </p>
          </div>
        )}

        {phase === "ready" && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Logo Rating</h1>
            <p className="text-white/50 text-center mb-8">
              Here&apos;s how your logo performs across formats
            </p>
          </>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-lg bg-white text-black font-medium hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Ready */}
        {phase === "ready" && rating && (
          <>
            {/* Logo preview */}
            <div className="flex justify-center mb-8">
              <div className="w-48 h-48 rounded-[32px] border border-white/10 bg-white p-5 flex items-center justify-center shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${logoBase64}`}
                  alt="Your logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Rating */}
            <RatingCard
              rating={rating}
              onApplyImprovement={handleApplyImprovement}
              applyingIndex={applyingIndex}
            />

            {/* Logo History */}
            {logoHistory.length > 1 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Generation History
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {logoHistory.map((entry, i) => {
                    const isActive = entry.logoBase64 === logoBase64;
                    return (
                      <button
                        key={i}
                        onClick={() => handleRevert(i)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                          isActive
                            ? "ring-2 ring-white bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <div className="w-16 h-16 rounded-xl bg-white p-1.5 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${entry.logoBase64}`}
                            alt={`Version ${i + 1}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <span className="text-xs text-white/50">
                          v{i + 1}
                        </span>
                        <span className="text-xs font-semibold text-green-500">
                          {entry.rating.overallRating.toFixed(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approve button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleApprove}
                className="px-8 py-3 rounded-xl bg-white text-black font-semibold text-lg
                  hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-colors"
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
