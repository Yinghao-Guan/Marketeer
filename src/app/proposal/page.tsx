"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveCampaign } from "@/lib/store";
import { mergeVideoAudio } from "@/lib/ffmpeg";
import ProposalCard from "@/components/ProposalCard";

interface Proposal {
    tagline: string;
    bannerConcept: string;
    jingleMood: string;
    videoScene: string;
    voiceoverScript: string;
    voiceTone: string;
}

type Phase = "loading" | "ready" | "revising" | "generating" | "error";
type StepStatus = "waiting" | "active" | "done" | "error";

const STEPS = [
    "Crafting your banners...",
    "Composing your jingle...",
    "Filming your ad...",
    "Recording your voiceover...",
    "Putting it all together...",
] as const;

const PROGRESS_KEY = "marketeer-generation-progress";

interface GenerationProgress {
    banners?: unknown;
    jingle?: string;
    operationId?: string;
    video?: string;
    voiceover?: string;
}

function loadProgress(): GenerationProgress {
    try { return JSON.parse(sessionStorage.getItem(PROGRESS_KEY) || "{}"); }
    catch { return {}; }
}

function saveProgress(updates: Partial<GenerationProgress>) {
    const current = loadProgress();
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, ...updates }));
}

export default function ProposalPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("loading");
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [error, setError] = useState("");
    const [revisionFeedback, setRevisionFeedback] = useState("");
    const [showRevise, setShowRevise] = useState(false);
    const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(STEPS.map(() => "waiting"));
    const generatingStarted = useRef(false);

    const getCampaign = useCallback(() => {
        const data = sessionStorage.getItem("marketeer-campaign");
        return data ? JSON.parse(data) : null;
    }, []);

    const saveCampaignToSession = useCallback((updates: Record<string, unknown>) => {
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
            saveCampaignToSession({ proposal: data });
            setPhase("ready");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
            setPhase("error");
        }
    }, [getCampaign, saveCampaignToSession]);

    useEffect(() => {
        generateProposal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setStep = (index: number, status: StepStatus) => {
        setStepStatuses((prev) => prev.map((s, i) => (i === index ? status : s)));
    };

    const handleApprove = async () => {
        if (generatingStarted.current) return;
        generatingStarted.current = true;

        const campaign = getCampaign();
        if (!campaign?.proposal || !campaign?.styleLock) {
            setError("Missing campaign data. Please try again.");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        setPhase("generating");
        setStepStatuses(STEPS.map(() => "waiting"));
        sessionStorage.removeItem(PROGRESS_KEY);

        const { proposal: p, styleLock, approvedLogo } = campaign;
        let banners: unknown;
        let jingle: string | undefined;
        let videoBase64: string | undefined;
        let voiceover: string | undefined;
        let finalVideo: string | undefined;

        // ── Step 0: Banners ───────────────────────────────────────────────────
        try {
            setStep(0, "active");
            const res = await fetch("/api/generate-banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bannerConcept: p.bannerConcept,
                    styleLock,
                    logoBase64: approvedLogo ?? null,
                    brandName: campaign.brandName || "",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Banner generation failed");
            banners = data.banners;
            setStep(0, "done");
        } catch (e) {
            setStep(0, "error");
            setError(e instanceof Error ? e.message : "Banner generation failed");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        // ── Step 1: Jingle ────────────────────────────────────────────────────
        try {
            setStep(1, "active");
            const res = await fetch("/api/generate-jingle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mood: campaign.jingleMood || "upbeat",
                    jingleMood: p.jingleMood,
                    brandName: campaign.brandName || "",
                    industry: campaign.industry || "",
                    tagline: p.tagline,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Jingle generation failed");
            jingle = data.audioBase64;
            setStep(1, "done");
        } catch (e) {
            setStep(1, "error");
            setError(e instanceof Error ? e.message : "Jingle generation failed");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        // ── Step 2: Video (async + poll) ──────────────────────────────────────
        try {
            setStep(2, "active");
            let operationId = loadProgress().operationId;
            if (!operationId) {
                const startRes = await fetch("/api/generate-video", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        videoScene: p.videoScene,
                        styleLock,
                        logoBase64: approvedLogo ?? null,
                        aspectRatio: "16:9",
                    }),
                });
                const startData = await startRes.json();
                if (!startRes.ok) throw new Error(startData.error ?? "Video generation failed");
                operationId = startData.operationId;
                saveProgress({ operationId });
            }

            const deadline = Date.now() + 2 * 60 * 1000;
            while (Date.now() < deadline) {
                await new Promise((r) => setTimeout(r, 5000));
                const pollRes = await fetch(`/api/check-video?operationId=${encodeURIComponent(operationId!)}`);
                const pollData = await pollRes.json();
                if (!pollRes.ok) throw new Error(pollData.error ?? "Video poll failed");
                if (pollData.done) {
                    videoBase64 = pollData.videoBase64;
                    break;
                }
            }
            if (!videoBase64) throw new Error("Video generation timed out after 2 minutes");
            setStep(2, "done");
        } catch (e) {
            setStep(2, "error");
            setError(e instanceof Error ? e.message : "Video generation failed");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        // ── Step 3: Voiceover ─────────────────────────────────────────────────
        try {
            setStep(3, "active");
            const res = await fetch("/api/generate-voiceover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    script: p.voiceoverScript,
                    voiceTone: p.voiceTone,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Voiceover generation failed");
            voiceover = data.audioBase64;
            setStep(3, "done");
        } catch (e) {
            setStep(3, "error");
            setError(e instanceof Error ? e.message : "Voiceover generation failed");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        // ── Step 4: FFmpeg merge ──────────────────────────────────────────────
        try {
            setStep(4, "active");
            finalVideo = await mergeVideoAudio(videoBase64!, voiceover!);
            setStep(4, "done");
        } catch (e) {
            setStep(4, "error");
            setError(e instanceof Error ? e.message : "Video merge failed");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        // ── Save & navigate ───────────────────────────────────────────────────
        await saveCampaign({
            id: `campaign-${Date.now()}`,
            createdAt: new Date(),
            hasLogo: campaign.hasLogo ?? true,
            userLogo: campaign.userLogo ?? null,
            competitorLogos: campaign.competitorLogos ?? [],
            location: campaign.location ?? "",
            industry: campaign.industry ?? "",
            brandName: campaign.brandName ?? "",
            approvedLogo: approvedLogo ?? "",
            logoRating: campaign.logoRating ?? null,
            styleLock,
            proposal: p,
            jingleMood: campaign.jingleMood ?? "upbeat",
            banners,
            jingle,
            video: videoBase64!,
            voiceover,
            finalVideo,
            currentStep: "dashboard",
        });

        sessionStorage.removeItem(PROGRESS_KEY);
        router.push("/dashboard");
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

    // ── Generating screen ─────────────────────────────────────────────────────
    if (phase === "generating") {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-full max-w-md px-4 space-y-6">
                    <h1 className="text-2xl font-bold text-center mb-8">Generating your campaign</h1>
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-4">
                            <StatusIcon status={stepStatuses[i]} />
                            <span className={`text-sm transition-colors ${
                                stepStatuses[i] === "active" ? "text-white font-medium" :
                                stepStatuses[i] === "done" ? "text-white/40 line-through" :
                                stepStatuses[i] === "error" ? "text-red-400" :
                                "text-white/20"
                            }`}>{label}</span>
                        </div>
                    ))}
                </div>
            </main>
        );
    }

    // ── Proposal screen ───────────────────────────────────────────────────────
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-center mb-2">Your Campaign Brief</h1>
                <p className="text-neutral-400 text-center mb-8">
                    {phase === "loading" || phase === "revising"
                        ? "Crafting your campaign brief..."
                        : "Review your campaign before we generate everything"}
                </p>

                {(phase === "loading" || phase === "revising") && (
                    <div className="flex flex-col items-center gap-4 py-16">
                        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <p className="text-neutral-400 text-sm">
                            {phase === "revising" ? "Revising your brief..." : "Building your creative brief..."}
                        </p>
                    </div>
                )}

                {phase === "error" && (
                    <div className="text-center py-16 space-y-4">
                        <p className="text-red-400">{error}</p>
                        <div className="flex flex-col gap-3 items-center">
                            {proposal ? (
                                <button
                                    onClick={() => {
                                        setPhase("ready");
                                        generatingStarted.current = false;
                                        setStepStatuses(STEPS.map(() => "waiting"));
                                    }}
                                    className="px-6 py-2 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
                                >
                                    Back to proposal
                                </button>
                            ) : (
                                <button
                                    onClick={() => generateProposal()}
                                    className="px-6 py-2 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                )}

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

function StatusIcon({ status }: { status: StepStatus }) {
    if (status === "active") {
        return <div className="w-5 h-5 shrink-0 border-2 border-white border-t-transparent rounded-full animate-spin" />;
    }
    if (status === "done") {
        return (
            <div className="w-5 h-5 shrink-0 rounded-full bg-white flex items-center justify-center">
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        );
    }
    if (status === "error") {
        return <div className="w-5 h-5 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">✕</div>;
    }
    return <div className="w-5 h-5 shrink-0 rounded-full border border-white/20" />;
}
