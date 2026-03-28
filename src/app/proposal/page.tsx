"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { saveCampaign, updateCampaign, getCampaign as getCampaignFromDB, type Banner } from "@/lib/store";
import { FINAL_VIDEO_VERSION, mergeVideoAudio } from "@/lib/ffmpeg";
import ProposalCard from "@/components/ProposalCard";
import AudioPlayer from "@/components/AudioPlayer";
import VideoPlayer from "@/components/VideoPlayer";
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

type Phase = "loading" | "ready" | "revising" | "generating" | "error";
type StepStatus = "waiting" | "active" | "done" | "error";

const STEPS = [
    "crafting your banners...",
    "composing your jingle...",
    "filming your ad...",
    "recording your voiceover...",
    "putting it all together...",
] as const;

const PROGRESS_KEY = "marketeer-generation-progress";

interface GenerationProgress {
    banners?: Banner[];
    jingle?: string;
    operationId?: string;
    video?: string;
    voiceover?: string;
}

function loadProgress(): GenerationProgress {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(sessionStorage.getItem(PROGRESS_KEY) || "{}"); }
    catch { return {}; }
}

function saveProgress(updates: Partial<GenerationProgress>) {
    if (typeof window === "undefined") return;
    const current = loadProgress();
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, ...updates }));
}

function ProposalContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [phase, setPhase] = useState<Phase>("loading");
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [error, setError] = useState("");
    const [revisionFeedback, setRevisionFeedback] = useState("");
    const [showRevise, setShowRevise] = useState(false);
    const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(STEPS.map(() => "waiting"));
    const [generatedBanners, setGeneratedBanners] = useState<Banner[]>([]);
    const [generatedJingle, setGeneratedJingle] = useState("");
    const [generatedVideo, setGeneratedVideo] = useState("");
    const [generatedVoiceover, setGeneratedVoiceover] = useState("");
    const [videoFailed, setVideoFailed] = useState(false);
    const [retryingVideo, setRetryingVideo] = useState(false);
    // Stash generation context so retry/skip can access it without re-generating
    const genContext = useRef<{
        campaign: Record<string, unknown>;
        p: Proposal;
        styleLock: { colors: string[]; style: string };
        banners: Banner[];
        jingle: string | undefined;
        voiceover: string | undefined;
    } | null>(null);
    const generatingStarted = useRef(false);

    const getCampaign = useCallback(() => {
        if (typeof window === "undefined") return null;
        const data = sessionStorage.getItem("marketeer-campaign");
        return data ? JSON.parse(data) : null;
    }, []);

    const saveCampaignToSession = useCallback((updates: Record<string, unknown>) => {
        if (typeof window === "undefined") return;
        const current = getCampaign() || {};
        try {
            sessionStorage.setItem("marketeer-campaign", JSON.stringify({ ...current, ...updates }));
        } catch {
            // quota exceeded - IndexedDB is the source of truth
        }
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
                    description: campaign.description || "",
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
        async function init() {
            // Load full data from IndexedDB (sessionStorage may only have the ID)
            const session = getCampaign();
            const campaignId = session?.id || searchParams.get("id");
            if (campaignId) {
                const saved = await getCampaignFromDB(campaignId);
                if (saved) {
                    const merged = { ...saved, ...session, id: campaignId };
                    try {
                        sessionStorage.setItem("marketeer-campaign", JSON.stringify(merged));
                    } catch {
                        // quota exceeded - that's fine, generateProposal reads from getCampaign()
                    }
                }
            }
            generateProposal();
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setStep = (index: number, status: StepStatus) => {
        setStepStatuses((prev) => prev.map((s, i) => (i === index ? status : s)));
    };

    const attemptVideo = async (
        p: Proposal,
        styleLock: { colors: string[]; style: string },
        approvedLogo: string | undefined,
    ): Promise<string> => {
        // Clear any stale operation ID before starting fresh
        let operationId = loadProgress().operationId;
        if (operationId) {
            console.log("resuming existing video operation:", operationId);
        } else {
            const startRes = await fetch("/api/generate-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoScene: p.videoScene,
                    styleLock,
                    logoBase64: approvedLogo ?? null,
                    aspectRatio: "16:9",
                    location: campaign.location || "",
                    description: campaign.description || "",
                }),
            });
            const startData = await startRes.json();
            if (!startRes.ok) throw new Error(startData.error ?? "video generation failed");
            operationId = startData.operationId;
            if (!operationId) throw new Error("video generation did not return an operation ID");
            saveProgress({ operationId });
        }

        const deadline = Date.now() + 2 * 60 * 1000;
        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 5000));
            const pollRes = await fetch(`/api/check-video?operationId=${encodeURIComponent(operationId)}`);
            const pollData = await pollRes.json();
            if (!pollRes.ok) throw new Error(pollData.error ?? "video poll failed");
            if (pollData.done) return pollData.videoBase64 as string;
        }
        throw new Error("video generation timed out after 2 minutes");
    };

    const handleApprove = async () => {
        if (generatingStarted.current) return;
        generatingStarted.current = true;

        // Use proposal from React state — guaranteed non-null here since the button
        // only renders when phase === "ready" && proposal. Avoids any sessionStorage
        // timing issues (e.g. styleLock saved async by the rating page's buildStyleLock).
        const p = proposal!;
        const campaign = getCampaign() ?? {};
        const styleLock = campaign.styleLock ?? { colors: [], style: "modern, clean" };
        const { approvedLogo } = campaign;

        setPhase("generating");
        setStepStatuses(STEPS.map(() => "waiting"));
        setGeneratedBanners([]);
        setGeneratedJingle("");
        setGeneratedVideo("");
        setGeneratedVoiceover("");
        sessionStorage.removeItem(PROGRESS_KEY);
        let banners: Banner[];
        let jingle: string | undefined;
        let videoBase64: string | null | undefined;
        let voiceover: string | undefined;

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
                    location: campaign.location || "",
                    description: campaign.description || "",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Banner generation failed");
            banners = data.banners;
            setGeneratedBanners(data.banners);
            setStep(0, "done");
        } catch (e) {
            setStep(0, "error");
            setError(e instanceof Error ? e.message : "Banner generation failed");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        // ── Steps 1-3: Jingle + Video + Voiceover (parallel) ─────────────────
        const generateJingle = async () => {
            setStep(1, "active");
            try {
                const res = await fetch("/api/generate-jingle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mood: campaign.jingleMood || "upbeat",
                        jingleMood: p.jingleMood,
                        brandName: campaign.brandName || "",
                        industry: campaign.industry || "",
                        tagline: p.tagline,
                        location: campaign.location || "",
                        description: campaign.description || "",
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Jingle generation failed");
                setGeneratedJingle(data.audioBase64);
                setStep(1, "done");
                return data.audioBase64 as string;
            } catch (e) {
                setStep(1, "error");
                throw new Error(e instanceof Error ? e.message : "Jingle generation failed");
            }
        };

        const attemptVideoInner = () => attemptVideo(p, styleLock, approvedLogo);

        const generateVideoStep = async (): Promise<string | null> => {
            setStep(2, "active");
            try {
                const video = await attemptVideoInner();
                setGeneratedVideo(video);
                setStep(2, "done");
                return video;
            } catch (firstError) {
                // Retry once with a fresh operation
                console.warn("video generation attempt 1 failed, retrying:", firstError);
                sessionStorage.removeItem(PROGRESS_KEY);
                try {
                    const video = await attemptVideoInner();
                    setGeneratedVideo(video);
                    setStep(2, "done");
                    return video;
                } catch (retryError) {
                    console.error("video generation failed after retry:", retryError instanceof Error ? retryError.message : retryError);
                    setStep(2, "error");
                    return null;
                }
            }
        };

        const generateVoiceover = async () => {
            setStep(3, "active");
            try {
                const res = await fetch("/api/generate-voiceover", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        script: p.voiceoverScript,
                        voiceTone: p.voiceTone,
                        location: campaign.location || "",
                        description: campaign.description || "",
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Voiceover generation failed");
                setGeneratedVoiceover(data.audioBase64);
                setStep(3, "done");
                return data.audioBase64 as string;
            } catch (e) {
                setStep(3, "error");
                throw new Error(e instanceof Error ? e.message : "Voiceover generation failed");
            }
        };

        const results = await Promise.allSettled([
            generateJingle(),
            generateVideoStep(),
            generateVoiceover(),
        ]);

        jingle = results[0].status === "fulfilled" ? results[0].value : undefined;
        videoBase64 = results[1].status === "fulfilled" ? results[1].value : null;
        voiceover = results[2].status === "fulfilled" ? results[2].value : undefined;

        // If jingle AND voiceover both failed, abort
        if (!jingle && !voiceover) {
            const reasons = results
                .filter((r) => r.status === "rejected")
                .map((r) => (r as PromiseRejectedResult).reason?.message)
                .filter(Boolean);
            setError(reasons.join("; ") || "asset generation failed");
            setPhase("error");
            generatingStarted.current = false;
            return;
        }

        // If video failed, pause here and let the user retry or skip
        if (!videoBase64) {
            genContext.current = { campaign, p, styleLock, banners, jingle, voiceover };
            setVideoFailed(true);
            return;
        }

        // Video succeeded — merge and save
        await mergeAndSave({ campaign, p, styleLock, banners, jingle, videoBase64, voiceover });
    };

    const mergeAndSave = async ({
        campaign, p, styleLock, banners, jingle, videoBase64, voiceover,
    }: {
        campaign: Record<string, unknown>;
        p: Proposal;
        styleLock: { colors: string[]; style: string };
        banners: Banner[];
        jingle: string | undefined;
        videoBase64: string | null | undefined;
        voiceover: string | undefined;
    }) => {
        let finalVideo: string | undefined;

        // ── Step 4: FFmpeg merge (skip if video missing) ─────────────────────
        if (videoBase64 && voiceover) {
            try {
                setStep(4, "active");
                finalVideo = await mergeVideoAudio(videoBase64, voiceover);
                setStep(4, "done");
            } catch (e) {
                console.error("FFmpeg merge failed:", e);
                setStep(4, "error");
            }
        } else {
            setStep(4, videoBase64 ? "done" : "error");
        }

        // ── Save & navigate ───────────────────────────────────────────────────
        const campaignId = (campaign.id as string) ?? `campaign-${Date.now()}`;
        const approvedLogo = campaign.approvedLogo as string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalData: Partial<import("@/lib/store").Campaign> = {
            approvedLogo: approvedLogo ?? "",
            logoRating: (campaign.logoRating as import("@/lib/store").LogoRating) ?? null,
            styleLock,
            proposal: p,
            jingleMood: (campaign.jingleMood as string) ?? "upbeat",
            banners,
            jingle: jingle ?? "",
            video: videoBase64 ?? "",
            voiceover: voiceover ?? "",
            finalVideo: finalVideo ?? "",
            finalVideoVersion: FINAL_VIDEO_VERSION,
            currentStep: "dashboard" as const,
        };
        try {
            await updateCampaign(campaignId, finalData);
        } catch {
            await saveCampaign({
                id: campaignId,
                createdAt: new Date(),
                hasLogo: (campaign.hasLogo as boolean) ?? true,
                userLogo: (campaign.userLogo as string) ?? null,
                competitorLogos: (campaign.competitorLogos as string[]) ?? [],
                location: (campaign.location as string) ?? "",
                industry: (campaign.industry as string) ?? "",
                brandName: (campaign.brandName as string) ?? "",
                description: (campaign.description as string) ?? "",
                ...finalData,
            } as import("@/lib/store").Campaign);
        }

        sessionStorage.removeItem(PROGRESS_KEY);
        router.push("/dashboard");
    };

    const handleRetryVideo = async () => {
        const ctx = genContext.current;
        if (!ctx) return;
        setRetryingVideo(true);
        setVideoFailed(false);
        setStep(2, "active");
        // Clear stale operation ID so a fresh one is created
        sessionStorage.removeItem(PROGRESS_KEY);

        try {
            const video = await attemptVideo(ctx.p, ctx.styleLock, ctx.campaign.approvedLogo as string | undefined);
            setGeneratedVideo(video);
            setStep(2, "done");
            await mergeAndSave({ ...ctx, videoBase64: video });
        } catch (e) {
            console.error("video retry failed:", e instanceof Error ? e.message : e);
            setStep(2, "error");
            setVideoFailed(true);
        } finally {
            setRetryingVideo(false);
        }
    };

    const handleSkipVideo = async () => {
        if (!genContext.current) return;
        await mergeAndSave({ ...genContext.current, videoBase64: null });
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
        const activeStep = stepStatuses.findIndex((s) => s === "active");
        const doneCount = stepStatuses.filter((s) => s === "done").length;
        const progressPct = Math.round((doneCount / STEPS.length) * 100);

        return (
            <main className="min-h-screen text-white flex flex-col">
                {/* Top progress bar */}
                <div className="h-0.5 bg-white/10 w-full">
                    <motion.div
                        className="h-full bg-white"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Building your campaign</h1>
                        <p className="text-white/30 text-sm">This usually takes 1-3 minutes. Hang tight.</p>
                    </motion.div>

                    <div className="w-full max-w-4xl grid gap-8 lg:grid-cols-[260px_1fr]">
                        {/* Steps sidebar */}
                        <div className="space-y-3">
                            {STEPS.map((label, i) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07, duration: 0.4 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                                        stepStatuses[i] === "active"
                                            ? "bg-white/10 border border-white/20"
                                            : stepStatuses[i] === "done"
                                            ? "opacity-40"
                                            : stepStatuses[i] === "error"
                                            ? "bg-red-500/10 border border-red-500/20"
                                            : "opacity-20"
                                    }`}
                                >
                                    <StatusIcon status={stepStatuses[i]} />
                                    <span className={`text-sm ${
                                        stepStatuses[i] === "active" ? "text-white font-medium" :
                                        stepStatuses[i] === "error" ? "text-red-400" :
                                        "text-white"
                                    }`}>{label}</span>
                                </motion.div>
                            ))}

                            {activeStep >= 0 && (
                                <motion.p
                                    key={activeStep}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="px-4 text-[11px] text-white/30 mt-2"
                                >
                                    Step {activeStep + 1} of {STEPS.length}
                                </motion.p>
                            )}
                        </div>

                        {/* Live asset previews */}
                        <div className="space-y-4">
                            {/* Banners */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Banners</h2>
                                <AnimatePresence mode="wait">
                                    {generatedBanners.length ? (
                                        <motion.div
                                            key="banners-ready"
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                                        >
                                            {generatedBanners.map((b) => (
                                                <div key={b.format} className="rounded-lg border border-white/10 overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={`data:image/png;base64,${b.imageBase64}`}
                                                        alt={`${b.format} banner`}
                                                        className="w-full aspect-square object-cover"
                                                    />
                                                    <p className="py-1.5 text-[10px] text-white/30 text-center">{b.format}</p>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div key="banners-loading" className="flex items-center gap-3 h-16">
                                            <div className="w-4 h-4 border border-white/20 border-t-[#5227FF] rounded-full animate-spin" />
                                            <span className="text-sm text-white/30">crafting banner visuals...</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Jingle + Voiceover */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    { label: "jingle", src: generatedJingle, pending: "composing music..." },
                                    { label: "voiceover", src: generatedVoiceover, pending: "recording voice..." },
                                ].map(({ label, src, pending }) => (
                                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">{label}</h2>
                                        <AnimatePresence mode="wait">
                                            {src ? (
                                                <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <AudioPlayer src={src} />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="loading" className="flex items-center gap-3 h-10">
                                                    <div className="w-4 h-4 border border-white/20 border-t-[#5227FF] rounded-full animate-spin" />
                                                    <span className="text-sm text-white/30">{pending}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>

                            {/* Video */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">video ad</h2>
                                <AnimatePresence mode="wait">
                                    {generatedVideo ? (
                                        <motion.div key="ready" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                                            <VideoPlayer src={generatedVideo} poster={campaign?.approvedLogo} />
                                        </motion.div>
                                    ) : videoFailed ? (
                                        <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                            <p className="text-sm text-red-400/80">video generation failed</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRetryVideo}
                                                    disabled={retryingVideo}
                                                    className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-500 disabled:opacity-50"
                                                >
                                                    {retryingVideo ? "retrying..." : "retry video"}
                                                </button>
                                                <button
                                                    onClick={handleSkipVideo}
                                                    className="px-4 py-2 rounded-full border border-white/10 text-white/50 text-sm font-medium hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-500"
                                                >
                                                    continue without video
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="loading" className="flex items-center gap-3 h-16">
                                            <div className="w-4 h-4 border border-white/20 border-t-[#5227FF] rounded-full animate-spin" />
                                            <span className="text-sm text-white/30">filming your ad - this can take up to 2 min...</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ── Proposal screen ───────────────────────────────────────────────────────
    return (
        <StepWizard>
            <div className="flex flex-col flex-1 items-center justify-center px-6 sm:px-10 lg:px-16 py-12">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="w-full space-y-6"
                >
                    <motion.div variants={staggerChild} className="text-center">
                        <h1 className="text-3xl font-bold text-white">campaign proposal</h1>
                        <p className="mt-2 text-white/50">
                            {phase === "loading" || phase === "revising"
                                ? "crafting your creative brief..."
                                : "review your campaign before we generate everything"}
                        </p>
                    </motion.div>

                    {(phase === "loading" || phase === "revising") && (
                        <div className="flex flex-col items-center gap-4 py-16">
                            <div className="w-10 h-10 border-2 border-white border-t-[#5227FF] rounded-full animate-spin" />
                            <p className="text-white/50 text-sm">
                                {phase === "revising"
                                    ? "revising your proposal..."
                                    : "generating creative brief..."}
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
                                        className="px-6 py-2 rounded-full bg-white text-black font-medium hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                                    >
                                        back to proposal
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => generateProposal()}
                                        className="px-6 py-2 rounded-full bg-white text-black font-medium hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                                    >
                                        retry
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {phase === "ready" && proposal && (
                        <>
                            <motion.div variants={staggerChild}>
                                <ProposalCard proposal={proposal} colors={colors} />
                            </motion.div>

                            <motion.div variants={staggerChild} className="flex flex-col gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={generatingStarted.current}
                                    className="w-full py-4 rounded-full bg-white text-black font-semibold text-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    looks good, generate it all
                                </button>
                                <button
                                    onClick={() => setShowRevise((v) => !v)}
                                    className="w-full py-3 rounded-full border border-white/10 text-white font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.06] active:scale-[0.98]"
                                >
                                    revise
                                </button>
                            </motion.div>

                            {showRevise && (
                                <motion.div variants={staggerChild} className="space-y-3">
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
                                        className="w-full py-3 rounded-full bg-white text-black font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        submit revision
                                    </button>
                                </motion.div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </StepWizard>
    );
}

function StatusIcon({ status }: { status: StepStatus }) {
    if (status === "active") {
        return <div className="w-5 h-5 shrink-0 border-2 border-white border-t-[#5227FF] rounded-full animate-spin" />;
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
        return <div className="w-5 h-5 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">X</div>;
    }
    return <div className="w-5 h-5 shrink-0 rounded-full border border-white/20" />;
}

export default function ProposalPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-white/50">
                    loading...
                </div>
            }
        >
            <ProposalContent />
        </Suspense>
    );
}
