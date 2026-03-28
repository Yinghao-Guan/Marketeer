"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProposalCard from "@/components/ProposalCard";

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
    const [revisionFeedback, setRevisionFeedback] = useState("");
    const [showRevise, setShowRevise] = useState(false);

    const getCampaign = useCallback(() => {
        const data = sessionStorage.getItem("marketeer-campaign");
        return data ? JSON.parse(data) : null;
    }, []);

    const saveCampaign = useCallback((updates: Record<string, unknown>) => {
        const current = getCampaign() || {};
        sessionStorage.setItem("marketeer-campaign", JSON.stringify({ ...current, ...updates }));
    }, [getCampaign]);

    const generateProposal = useCallback(async (feedback?: string) => {
        const campaign = getCampaign();
        if (!campaign) {
            setError("No campaign data found. Please start from the beginning.");
            setPhase("error");
            return;
        }

        try {
            const res = await fetch("/api/generate-proposal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brandName: campaign.brandName || "",
                    industry: campaign.industry || "",
                    location: campaign.location || "",
                    styleLock: campaign.styleLock || { colors: [], style: "" },
                    competitorAnalysis: campaign.competitorAnalysis || {},
                    logoDescription: campaign.logoDescription || "",
                    revisionFeedback: feedback,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to generate proposal");

            setProposal(data);
            saveCampaign({ proposal: data });
            setPhase("ready");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
            setPhase("error");
        }
    }, [getCampaign, saveCampaign]);

    useEffect(() => {
        generateProposal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApprove = () => {
        router.push("/generating");
    };

    const handleRevise = async () => {
        if (!revisionFeedback.trim()) return;
        setPhase("revising");
        setShowRevise(false);
        await generateProposal(revisionFeedback);
        setRevisionFeedback("");
    };

    const campaign = getCampaign();
    const colors: string[] = campaign?.styleLock?.colors ?? [];

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-center mb-2">Your Campaign Brief</h1>
                <p className="text-neutral-400 text-center mb-8">
                    {phase === "loading" || phase === "revising"
                        ? "Crafting your campaign brief..."
                        : "Review your campaign before we generate everything"}
                </p>

                {/* Loading */}
                {(phase === "loading" || phase === "revising") && (
                    <div className="flex flex-col items-center gap-4 py-16">
                        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <p className="text-neutral-400 text-sm">
                            {phase === "revising" ? "Revising your brief..." : "Building your creative brief..."}
                        </p>
                    </div>
                )}

                {/* Error */}
                {phase === "error" && (
                    <div className="text-center py-16">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => generateProposal()}
                            className="px-6 py-2 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Proposal ready */}
                {phase === "ready" && proposal && (
                    <>
                        <ProposalCard proposal={proposal} colors={colors} />

                        <div className="mt-8 flex flex-col gap-3">
                            <button
                                onClick={handleApprove}
                                className="w-full py-3 rounded-xl bg-white text-black font-semibold text-lg hover:bg-neutral-200 transition-colors"
                            >
                                Looks good, generate it all
                            </button>
                            <button
                                onClick={() => setShowRevise((v) => !v)}
                                className="w-full py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                            >
                                Revise
                            </button>
                        </div>

                        {showRevise && (
                            <div className="mt-4 space-y-3">
                                <textarea
                                    value={revisionFeedback}
                                    onChange={(e) => setRevisionFeedback(e.target.value)}
                                    placeholder="What would you like to change? e.g. Make the tagline more energetic, change the video scene to a coffee shop..."
                                    rows={3}
                                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none resize-none"
                                />
                                <button
                                    onClick={handleRevise}
                                    disabled={!revisionFeedback.trim()}
                                    className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-40"
                                >
                                    Submit Revision
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
