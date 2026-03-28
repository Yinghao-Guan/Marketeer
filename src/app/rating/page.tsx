"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import RatingCard, { ScoreRing } from "@/components/RatingCard";
import { buildStyleLock } from "@/lib/style-lock";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { fadeBlur, staggerContainer, staggerChild } from "@/lib/motion";
import type { LogoRating, StyleLock } from "@/types/campaign";
import { getCampaign, updateCampaign } from "@/lib/store";

type Phase = "loading" | "generating-logo" | "analyzing" | "improving" | "ready" | "error";

interface LogoHistoryEntry {
  logoBase64: string;
  rating: LogoRating;
  improvement?: string;
}

function RatingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [rating, setRating] = useState<LogoRating | null>(null);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [logoHistory, setLogoHistory] = useState<LogoHistoryEntry[]>([]);
  const [hadUserLogo, setHadUserLogo] = useState(true);
  const [prevRating, setPrevRating] = useState<LogoRating | null>(null);

  // Pull campaign state from sessionStorage (set by onboarding pages)
  const getCampaignData = useCallback(() => {
    const data = sessionStorage.getItem("marketeer-campaign");
    return data ? JSON.parse(data) : null;
  }, []);

  const saveCampaignData = useCallback(
    (updates: Record<string, unknown>) => {
      const current = getCampaignData() || {};
      try {
        sessionStorage.setItem(
          "marketeer-campaign",
          JSON.stringify({ ...current, ...updates })
        );
      } catch {
        // quota exceeded - sessionStorage is a convenience cache, IndexedDB is the source of truth
      }
    },
    [getCampaignData]
  );

  // ── Initial load: generate or analyze logo ─────────────
  useEffect(() => {
    async function init() {
    let campaign = getCampaignData();

    // Load full data from IndexedDB (sessionStorage may only have the ID)
    const campaignId = campaign?.id || searchParams.get("id");
    if (campaignId) {
      const saved = await getCampaign(campaignId);
      if (saved) {
        // Merge: sessionStorage overrides for transient state, IndexedDB has images
        campaign = { ...saved, ...campaign, id: campaignId };
      }
    }

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

        // Path B: no logo — generate one first
        if (!logo) {
          setHadUserLogo(false);
          setPhase("generating-logo");
          const genRes = await fetch("/api/generate-logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              industry: campaign.industry,
              location: campaign.location,
              competitorAnalysis: "",
              brandDescription: campaign.description || "",
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
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply improvement ───���──────────────────────────────
  const handleApplyImprovement = async (index: number) => {
    if (!rating || !logoBase64) return;
    setPrevRating(rating);
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

    // Persist progress to IndexedDB
    const campaign = getCampaignData();
    if (campaign?.id) {
      updateCampaign(campaign.id, {
        approvedLogo: logoBase64,
        logoRating: rating,
        currentStep: "proposal",
      }).catch(() => {});
    }

    // Start style lock extraction in the background - don't block navigation
    buildStyleLock(logoBase64)
      .then((styleLock: StyleLock) => {
        saveCampaignData({ styleLock });
        if (campaign?.id) {
          updateCampaign(campaign.id, { styleLock }).catch(() => {});
        }
      })
      .catch(() =>
        saveCampaignData({
          styleLock: { colors: ["#808080"], style: "modern, clean" },
        })
      );

    router.push("/proposal");
  };

  // ── Render ──────��─────────────────────��────────────────
  return (
    <main className="min-h-screen text-white">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          home
        </Link>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full mx-auto px-6 sm:px-10 lg:px-16 py-12"
      >
        <motion.h1 variants={staggerChild} className="text-3xl font-bold text-center mb-2">logo rating</motion.h1>
        <motion.p variants={staggerChild} className="text-white/50 text-center mb-8">
          {phase === "generating-logo"
            ? "generating your logo..."
            : phase === "analyzing"
              ? "analyzing your logo with AI..."
              : phase === "improving"
                ? "applying improvement to your logo..."
                : phase === "ready"
                  ? "here's how your logo performs across formats"
                  : ""}
        </motion.p>

        {/* Loading / generating states */}
        {(phase === "loading" ||
          phase === "generating-logo" ||
          phase === "analyzing" ||
          phase === "improving") && (() => {
          const isImproving = phase === "improving";
          const steps = isImproving
            ? [
                { label: "applying improvement", key: "improving" },
                { label: "re-analyzing logo", key: "analyzing" },
              ]
            : hadUserLogo
              ? [{ label: "analyzing your logo", key: "analyzing" }]
              : [
                  { label: "generating your logo", key: "generating-logo" },
                  { label: "analyzing your logo", key: "analyzing" },
                ];

          const phaseOrder = isImproving
            ? ["improving", "analyzing"]
            : hadUserLogo
              ? ["analyzing"]
              : ["generating-logo", "analyzing"];
          const activeIndex = phaseOrder.indexOf(phase);

          return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-10">
              {/* Step indicators */}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                {steps.map((step, i) => {
                  const isDone = i < activeIndex;
                  const isActive = i === activeIndex;
                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-white/10 border border-white/20"
                          : isDone
                            ? "opacity-40"
                            : "opacity-20"
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {isDone ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : isActive ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-white/20" />
                        )}
                      </div>
                      <span className={`text-sm ${isActive ? "text-white font-medium" : "text-white/50"}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Description */}
              <p className="text-white/30 text-sm text-center max-w-sm">
                {phase === "generating-logo"
                  ? "Creating a unique logo for your brand..."
                  : phase === "improving"
                    ? "applying your selected improvement..."
                    : "Running AI analysis across banner, video, and social formats..."}
              </p>
            </div>
          );
        })()}

        {/* Error */}
        {phase === "error" && (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-full bg-white text-black font-medium hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Ready: show logo + ratings */}
        {phase === "ready" && rating && (
          <>
            {/* Hero row: Logo + Overall Score */}
            <motion.div variants={staggerChild} className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-10">
              <div className="glass-card w-40 h-40 sm:w-48 sm:h-48 overflow-hidden flex items-center justify-center flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${logoBase64}`}
                  alt="Your logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={rating.overallRating} size={120} />
                <p className="text-white/50 text-sm">Overall Rating</p>
                {/* Score delta badge after improvement */}
                {prevRating && (() => {
                  const delta = rating.overallRating - prevRating.overallRating;
                  if (delta === 0) return null;
                  const isPositive = delta > 0;
                  return (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                        isPositive
                          ? "text-green-400 bg-green-500/10"
                          : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {isPositive ? "+" : ""}{delta.toFixed(1)} from last version
                    </motion.span>
                  );
                })()}
              </div>
            </motion.div>

            {/* Rating details — uses full width */}
            <motion.div variants={staggerChild}>
              <RatingCard
                rating={rating}
                previousRating={prevRating}
                onApplyImprovement={handleApplyImprovement}
                applyingIndex={applyingIndex}
                hideOverallScore
              />
            </motion.div>

            {/* Logo History */}
            {logoHistory.length > 1 && (
              <motion.div variants={staggerChild} className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">generation history</h3>
                <div className="flex gap-3 overflow-x-auto p-1 -m-1">
                  {logoHistory.map((entry, i) => {
                    const isActive = entry.logoBase64 === logoBase64;
                    return (
                      <button key={i} onClick={() => handleRevert(i)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-lg p-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                          isActive ? "ring-2 ring-white bg-white/10" : "hover:bg-white/5"
                        }`}>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`data:image/png;base64,${entry.logoBase64}`} alt={`Version ${i + 1}`}
                            className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-xs text-white/50">v{i + 1}</span>
                        <span className="text-xs font-semibold text-green-500">{entry.rating.overallRating.toFixed(1)}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Approve button — at the bottom after all content */}
            <motion.div variants={staggerChild} className="mt-10 flex justify-center">
              <button
                onClick={handleApprove}
                className="px-10 py-3 rounded-full bg-white text-black font-semibold text-lg
                  hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                approve &amp; continue
              </button>
            </motion.div>
          </>
        )}
      </motion.div>
    </main>
  );
}

export default function RatingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white/50">
          loading...
        </div>
      }
    >
      <RatingContent />
    </Suspense>
  );
}
