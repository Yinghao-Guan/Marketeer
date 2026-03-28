"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCampaign } from "@/lib/store";
import { mergeVideoAudio } from "@/lib/ffmpeg";

const GENERATION_LOCK_KEY = "marketeer-generation-lock";
const GENERATION_LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RUNTIME_LOCK_KEY = "__marketeerGenerationRunning";
const GENERATION_PROGRESS_KEY = "marketeer-generation-progress";

declare global {
    interface Window {
        __marketeerGenerationRunning?: boolean;
    }
}

interface GenerationProgress {
    banners?: unknown;
    jingle?: string;
    operationId?: string;
    video?: string;
    voiceover?: string;
}

function loadProgress(): GenerationProgress {
    try {
        return JSON.parse(sessionStorage.getItem(GENERATION_PROGRESS_KEY) || "{}");
    } catch {
        return {};
    }
}

function saveProgress(updates: Partial<GenerationProgress>) {
    const current = loadProgress();
    sessionStorage.setItem(GENERATION_PROGRESS_KEY, JSON.stringify({ ...current, ...updates }));
}

const STEPS = [
    "Crafting your banners...",
    "Composing your jingle...",
    "Filming your ad...",
    "Recording your voiceover...",
    "Putting it all together...",
] as const;

type StepStatus = "waiting" | "active" | "done" | "error";

export default function GeneratingPage() {
    const router = useRouter();
    const [statuses, setStatuses] = useState<StepStatus[]>(STEPS.map(() => "waiting"));
    const [error, setError] = useState("");
    const started = useRef(false);

    const setStep = (index: number, status: StepStatus) => {
        setStatuses((prev) => prev.map((s, i) => (i === index ? status : s)));
    };

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        if (typeof window !== "undefined" && window[RUNTIME_LOCK_KEY]) {
            return;
        }
        if (typeof window !== "undefined") {
            window[RUNTIME_LOCK_KEY] = true;
        }

        // Prevent duplicate full-generation runs in React Strict Mode dev remounts.
        const now = Date.now();
        const existingLock = sessionStorage.getItem(GENERATION_LOCK_KEY);
        if (existingLock) {
            const lockTime = Number(existingLock);
            if (Number.isFinite(lockTime) && now - lockTime < GENERATION_LOCK_TTL_MS) {
                if (typeof window !== "undefined") {
                    window[RUNTIME_LOCK_KEY] = false;
                }
                return;
            }
        }
        sessionStorage.setItem(GENERATION_LOCK_KEY, String(now));

        const run = async () => {
            const campaign = JSON.parse(sessionStorage.getItem("marketeer-campaign") || "{}");
            const { proposal, styleLock, approvedLogo } = campaign;

            if (!proposal || !styleLock) {
                setError("Missing campaign data. Please go back and complete the previous steps.");
                sessionStorage.removeItem(GENERATION_LOCK_KEY);
                if (typeof window !== "undefined") {
                    window[RUNTIME_LOCK_KEY] = false;
                }
                return;
            }

            const progress = loadProgress();
            let banners = progress.banners, jingle = progress.jingle, videoBase64 = progress.video, voiceover = progress.voiceover, finalVideo;

            // ── Step 0: Banners ──────────────────────────────────────────────
            if (banners) {
                setStep(0, "done");
            } else {
                try {
                    setStep(0, "active");
                    const res = await fetch("/api/generate-banners", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            bannerConcept: proposal.bannerConcept,
                            styleLock,
                            logoBase64: approvedLogo ?? null,
                            brandName: campaign.brandName || "",
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Banner generation failed");
                    banners = data.banners;
                    saveProgress({ banners });
                    setStep(0, "done");
                } catch (e) {
                    setStep(0, "error");
                    setError(e instanceof Error ? e.message : "Banner generation failed");
                    sessionStorage.removeItem(GENERATION_LOCK_KEY);
                    if (typeof window !== "undefined") {
                        window[RUNTIME_LOCK_KEY] = false;
                    }
                    return;
                }
            }

            // ── Step 1: Jingle ───────────────────────────────────────────────
            if (jingle) {
                setStep(1, "done");
            } else {
                try {
                    setStep(1, "active");
                    const res = await fetch("/api/generate-jingle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            mood: campaign.jingleMood || "upbeat",
                            jingleMood: proposal.jingleMood,
                            brandName: campaign.brandName || "",
                            industry: campaign.industry || "",
                            tagline: proposal.tagline,
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Jingle generation failed");
                    jingle = data.audioBase64;
                    saveProgress({ jingle });
                    setStep(1, "done");
                } catch (e) {
                    setStep(1, "error");
                    setError(e instanceof Error ? e.message : "Jingle generation failed");
                    sessionStorage.removeItem(GENERATION_LOCK_KEY);
                    if (typeof window !== "undefined") {
                        window[RUNTIME_LOCK_KEY] = false;
                    }
                    return;
                }
            }

            // ── Step 2: Video (async + poll) ─────────────────────────────────
            if (videoBase64) {
                setStep(2, "done");
            } else {
                try {
                    setStep(2, "active");
                    // Resume existing operation if one was already started
                    let operationId = progress.operationId;
                    if (!operationId) {
                        const startRes = await fetch("/api/generate-video", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                videoScene: proposal.videoScene,
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

                    const deadline = Date.now() + 2 * 60 * 1000; // 2 minute timeout

                    while (Date.now() < deadline) {
                        await new Promise((r) => setTimeout(r, 5000));
                        const pollRes = await fetch(`/api/check-video?operationId=${encodeURIComponent(operationId!)}`);
                        const pollData = await pollRes.json();
                        if (!pollRes.ok) throw new Error(pollData.error ?? "Video poll failed");
                        if (pollData.done) {
                            videoBase64 = pollData.videoBase64;
                            saveProgress({ video: videoBase64 });
                            break;
                        }
                    }

                    if (!videoBase64) throw new Error("Video generation timed out after 2 minutes");
                    setStep(2, "done");
                } catch (e) {
                    setStep(2, "error");
                    setError(e instanceof Error ? e.message : "Video generation failed");
                    sessionStorage.removeItem(GENERATION_LOCK_KEY);
                    if (typeof window !== "undefined") {
                        window[RUNTIME_LOCK_KEY] = false;
                    }
                    return;
                }
            }

            // ── Step 3: Voiceover ────────────────────────────────────────────
            if (voiceover) {
                setStep(3, "done");
            } else {
                try {
                    setStep(3, "active");
                    const res = await fetch("/api/generate-voiceover", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            script: proposal.voiceoverScript,
                            voiceTone: proposal.voiceTone,
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Voiceover generation failed");
                    voiceover = data.audioBase64;
                    saveProgress({ voiceover });
                    setStep(3, "done");
                } catch (e) {
                    setStep(3, "error");
                    setError(e instanceof Error ? e.message : "Voiceover generation failed");
                    sessionStorage.removeItem(GENERATION_LOCK_KEY);
                    if (typeof window !== "undefined") {
                        window[RUNTIME_LOCK_KEY] = false;
                    }
                    return;
                }
            }

            // ── Step 4: FFmpeg merge ─────────────────────────────────────────
            try {
                setStep(4, "active");
                finalVideo = await mergeVideoAudio(videoBase64!, voiceover!);
                setStep(4, "done");
            } catch (e) {
                setStep(4, "error");
                setError(e instanceof Error ? e.message : "Video merge failed");
                sessionStorage.removeItem(GENERATION_LOCK_KEY);
                if (typeof window !== "undefined") {
                    window[RUNTIME_LOCK_KEY] = false;
                }
                return;
            }

            // ── Save to IndexedDB and navigate ───────────────────────────────
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
                proposal,
                jingleMood: campaign.jingleMood ?? "upbeat",
                banners,
                jingle,
                video: videoBase64!,
                voiceover,
                finalVideo,
                currentStep: "dashboard",
            });

            sessionStorage.removeItem(GENERATION_LOCK_KEY);
            sessionStorage.removeItem(GENERATION_PROGRESS_KEY);
            if (typeof window !== "undefined") {
                window[RUNTIME_LOCK_KEY] = false;
            }
            router.push("/dashboard");
        };

        run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="w-full max-w-md px-4 space-y-6">
                <h1 className="text-2xl font-bold text-center mb-8">Generating your campaign</h1>

                {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-4">
                        <StatusIcon status={statuses[i]} />
                        <span
                            className={`text-sm transition-colors ${
                                statuses[i] === "active"
                                    ? "text-white font-medium"
                                    : statuses[i] === "done"
                                    ? "text-white/40 line-through"
                                    : statuses[i] === "error"
                                    ? "text-red-400"
                                    : "text-white/20"
                            }`}
                        >
                            {label}
                        </span>
                    </div>
                ))}

                {error && (
                    <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={() => router.push("/proposal")}
                            className="mt-3 text-sm text-white underline"
                        >
                            Go back to proposal
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

function StatusIcon({ status }: { status: StepStatus }) {
    if (status === "active") {
        return (
            <div className="w-5 h-5 shrink-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
        );
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
