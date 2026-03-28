"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StepWizard from "@/components/StepWizard";
import { staggerContainer, staggerChild } from "@/lib/motion";

interface Proposal {
  tagline: string;
  bannerConcept: string;
  jingleMood: string;
  videoScene: string;
  voiceoverScript: string;
  voiceTone: string;
}

type Phase = "loading" | "ready" | "revising" | "error";

export default function ProposalPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");
  const [revisionText, setRevisionText] = useState("");

  const getCampaign = useCallback(() => {
    const data = sessionStorage.getItem("marketeer-campaign");
    return data ? JSON.parse(data) : null;
  }, []);

  const fetchProposal = useCallback(
    async (revisionFeedback?: string) => {
      const campaign = getCampaign();
      if (!campaign) {
        setError("No campaign data found.");
        setPhase("error");
        return;
      }

      try {
        const res = await fetch("/api/generate-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandName: campaign.brandName || "",
            industry: campaign.industry || "general",
            location: campaign.location || "",
            styleLock: campaign.styleLock,
            competitorAnalysis: campaign.logoRating?.competitorAnalysis,
            logoDescription: "",
            revisionFeedback,
          }),
        });
        if (!res.ok) throw new Error("Failed to generate proposal");
        const data: Proposal = await res.json();
        setProposal(data);

        const current = getCampaign() || {};
        sessionStorage.setItem(
          "marketeer-campaign",
          JSON.stringify({ ...current, proposal: data })
        );
        setPhase("ready");
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Something went wrong");
        setPhase("error");
      }
    },
    [getCampaign]
  );

  useEffect(() => {
    // Use cached proposal if available
    const campaign = getCampaign();
    if (campaign?.proposal) {
      setProposal(campaign.proposal);
      setPhase("ready");
      return;
    }
    fetchProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevise = async () => {
    if (!revisionText.trim()) return;
    setPhase("revising");
    await fetchProposal(revisionText.trim());
    setRevisionText("");
  };

  const handleApprove = () => {
    router.push("/generating");
  };

  const campaign = getCampaign();
  const colors = campaign?.styleLock?.colors || [];
  const logoBase64 = campaign?.approvedLogo || campaign?.userLogo || "";

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4 py-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-2xl space-y-6"
        >
          <motion.div variants={staggerChild} className="text-center">
            <h1 className="text-3xl font-bold text-white">Campaign Proposal</h1>
            <p className="mt-2 text-white/50">
              {phase === "loading" || phase === "revising"
                ? "Crafting your creative brief..."
                : "Review your campaign before we generate everything"}
            </p>
          </motion.div>

          {(phase === "loading" || phase === "revising") && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-10 h-10 border-2 border-white border-t-[#5227FF] rounded-full animate-spin" />
              <p className="text-white/50 text-sm">
                {phase === "revising"
                  ? "Revising your proposal..."
                  : "Generating creative brief..."}
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="text-center py-16">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => {
                  setPhase("loading");
                  fetchProposal();
                }}
                className="px-6 py-2 rounded-full bg-white text-black font-medium hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Retry
              </button>
            </div>
          )}

          {phase === "ready" && proposal && (
            <>
              {/* Logo */}
              {logoBase64 && (
                <motion.div variants={staggerChild} className="flex justify-center">
                  <div className="glass-card w-32 h-32 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${logoBase64}`}
                      alt="Your logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </motion.div>
              )}

              {/* Tagline */}
              <motion.div variants={staggerChild} className="glass-card p-6 text-center">
                <p className="text-[13px] text-white/40 uppercase tracking-[0.15em] font-light mb-2">
                  Tagline
                </p>
                <p className="text-2xl font-bold text-white">
                  &ldquo;{proposal.tagline}&rdquo;
                </p>
              </motion.div>

              {/* Color Palette */}
              {colors.length > 0 && (
                <motion.div variants={staggerChild} className="glass-card p-6">
                  <p className="text-[13px] text-white/40 uppercase tracking-[0.15em] font-light mb-3">
                    Color Palette
                  </p>
                  <div className="flex gap-3">
                    {colors.map((color: string, i: number) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-lg border border-white/10"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-white/50 font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Brief Sections */}
              <div className="grid gap-4">
                <BriefSection title="Banner Concept" text={proposal.bannerConcept} />
                <BriefSection title="Jingle Mood" text={proposal.jingleMood} />
                <BriefSection title="Video Scene" text={proposal.videoScene} />
                <BriefSection title="Voiceover Script" text={proposal.voiceoverScript} />
                <BriefSection title="Voice Tone" text={proposal.voiceTone} />
              </div>

              {/* Revision */}
              <motion.div variants={staggerChild} className="glass-card p-6 space-y-3">
                <p className="text-[13px] text-white/40 uppercase tracking-[0.15em] font-light">
                  Want changes?
                </p>
                <textarea
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  placeholder="e.g. Make the tagline more playful, change the jingle to something upbeat..."
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none resize-none h-20"
                />
                <button
                  onClick={handleRevise}
                  disabled={!revisionText.trim()}
                  className="w-full py-2 rounded-full border border-white/10 text-white font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.06] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Revise Proposal
                </button>
              </motion.div>

              {/* Approve */}
              <motion.div variants={staggerChild}>
                <button
                  onClick={handleApprove}
                  className="w-full py-4 rounded-full bg-white text-black font-semibold text-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                >
                  Looks good, generate it all
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </StepWizard>
  );
}

function BriefSection({ title, text }: { title: string; text: string }) {
  return (
    <motion.div variants={staggerChild} className="glass-card p-6">
      <p className="text-[13px] text-white/40 uppercase tracking-[0.15em] font-light mb-2">
        {title}
      </p>
      <p className="text-white">{text}</p>
    </motion.div>
  );
}
