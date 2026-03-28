"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import AssetCard from "@/components/AssetCard";
import AudioPlayer from "@/components/AudioPlayer";
import VideoPlayer from "@/components/VideoPlayer";
import {
  initDB,
  getLatestCampaign,
  updateCampaign,
  Campaign,
  Banner,
} from "@/lib/store";
import { mergeVideoAudio } from "@/lib/ffmpeg";

// ─── Types ────────────────────────────────────────────────────────────────────

type RegeneratingState = {
  banners: boolean;
  jingle: boolean;
  video: boolean;
  voiceover: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64ToObjectUrl(base64: string, mimeType: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

function triggerDownload(base64: string, mimeType: string, filename: string) {
  const url = base64ToObjectUrl(base64, mimeType);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function inferAudioType(base64: string): { mime: string; ext: string } {
  if (base64.startsWith("UklGR")) return { mime: "audio/wav", ext: "wav" };
  if (base64.startsWith("SUQz") || base64.startsWith("//uQ")) {
    return { mime: "audio/mpeg", ext: "mp3" };
  }
  return { mime: "audio/mpeg", ext: "mp3" };
}

function bannerByFormat(banners: Banner[], format: Banner["format"]): string {
  return banners.find((b) => b.format === format)?.imageBase64 ?? "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<RegeneratingState>({
    banners: false,
    jingle: false,
    video: false,
    voiceover: false,
  });
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Ref to hold the video-polling interval so we can clear it on unmount
  const videoPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load campaign from IndexedDB on mount ──
  useEffect(() => {
    initDB()
      .then(getLatestCampaign)
      .then((c) => {
        setCampaign(c ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Cleanup video polling on unmount ──
  useEffect(() => {
    return () => {
      if (videoPollingRef.current) clearInterval(videoPollingRef.current);
    };
  }, []);

  // ── Regeneration handlers ──────────────────────────────────────────────────

  async function handleRegenerateBanners() {
    if (!campaign) return;
    setRegenerating((r) => ({ ...r, banners: true }));
    try {
      const res = await fetch("/api/generate-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerConcept: campaign.proposal.bannerConcept,
          styleLock: campaign.styleLock,
          logoBase64: campaign.approvedLogo,
          brandName: campaign.brandName,
        }),
      });
      const data = await res.json();
      const updatedBanners: Banner[] = data.banners;
      await updateCampaign(campaign.id, { banners: updatedBanners });
      setCampaign((c) => c && { ...c, banners: updatedBanners });
    } catch (e) {
      console.error("Banner regeneration failed:", e);
    } finally {
      setRegenerating((r) => ({ ...r, banners: false }));
    }
  }

  async function handleRegenerateJingle() {
    if (!campaign) return;
    setRegenerating((r) => ({ ...r, jingle: true }));
    try {
      const res = await fetch("/api/generate-jingle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: campaign.jingleMood,
          jingleMood: campaign.proposal.jingleMood,
          brandName: campaign.brandName,
          industry: campaign.industry,
          tagline: campaign.proposal.tagline,
        }),
      });
      const data = await res.json();
      const jingle: string = data.audioBase64;
      await updateCampaign(campaign.id, { jingle });
      setCampaign((c) => c && { ...c, jingle });
    } catch (e) {
      console.error("Jingle regeneration failed:", e);
    } finally {
      setRegenerating((r) => ({ ...r, jingle: false }));
    }
  }

  async function handleRegenerateVideo() {
    if (!campaign) return;
    setRegenerating((r) => ({ ...r, video: true }));
    try {
      // Step 1: kick off Veo generation
      const startRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoScene: campaign.proposal.videoScene,
          styleLock: campaign.styleLock,
          logoBase64: campaign.approvedLogo,
          aspectRatio: "16:9",
        }),
      });
      const { operationId } = await startRes.json();

      // Step 2: poll until done (max 2 minutes)
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        let elapsed = 0;
        videoPollingRef.current = setInterval(async () => {
          elapsed += 5000;
          if (elapsed > 120_000) {
            clearInterval(videoPollingRef.current!);
            reject(new Error("Video generation timed out after 2 minutes"));
            return;
          }
          try {
            const pollRes = await fetch(
              `/api/check-video?operationId=${encodeURIComponent(operationId)}`
            );
            const pollData = await pollRes.json();
            if (pollData.done) {
              clearInterval(videoPollingRef.current!);
              resolve(pollData.videoBase64);
            }
          } catch {
            // silently retry on transient errors
          }
        }, 5000);
      });

      // Step 3: merge with existing voiceover
      const finalVideo = await mergeVideoAudio(videoBase64, campaign.voiceover);
      await updateCampaign(campaign.id, { video: videoBase64, finalVideo });
      setCampaign((c) => c && { ...c, video: videoBase64, finalVideo });
    } catch (e) {
      console.error("Video regeneration failed:", e);
    } finally {
      setRegenerating((r) => ({ ...r, video: false }));
    }
  }

  async function handleRegenerateVoiceover() {
    if (!campaign) return;
    setRegenerating((r) => ({ ...r, voiceover: true }));
    try {
      const res = await fetch("/api/generate-voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: campaign.proposal.voiceoverScript,
          voiceTone: campaign.proposal.voiceTone,
        }),
      });
      const data = await res.json();
      const voiceover: string = data.audioBase64;

      // Re-merge with existing raw video
      const finalVideo = await mergeVideoAudio(campaign.video, voiceover);
      await updateCampaign(campaign.id, { voiceover, finalVideo });
      setCampaign((c) => c && { ...c, voiceover, finalVideo });
    } catch (e) {
      console.error("Voiceover regeneration failed:", e);
    } finally {
      setRegenerating((r) => ({ ...r, voiceover: false }));
    }
  }

  // ── Download All ───────────────────────────────────────────────────────────

  async function handleDownloadAll() {
    if (!campaign) return;
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      zip.file("logo.png", campaign.approvedLogo, { base64: true });

      const bannerFormats: Banner["format"][] = ["1:1", "16:9", "9:16"];
      const bannerNames: Record<Banner["format"], string> = {
        "1:1": "banner-1x1.png",
        "16:9": "banner-16x9.png",
        "9:16": "banner-9x16.png",
      };
      for (const fmt of bannerFormats) {
        const b64 = bannerByFormat(campaign.banners, fmt);
        if (b64) zip.file(bannerNames[fmt], b64, { base64: true });
      }

      if (campaign.jingle) {
        const { ext } = inferAudioType(campaign.jingle);
        zip.file(`jingle.${ext}`, campaign.jingle, { base64: true });
      }
      if (campaign.finalVideo) zip.file("video-ad.mp4", campaign.finalVideo, { base64: true });

      const brief = [
        `Brand: ${campaign.brandName}`,
        `Tagline: ${campaign.proposal.tagline}`,
        "",
        "Voiceover Script:",
        campaign.proposal.voiceoverScript,
      ].join("\n");
      zip.file("brief.txt", brief);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaign.brandName.replace(/\s+/g, "-").toLowerCase()}-campaign.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      console.error("Download All failed:", e);
    } finally {
      setDownloadingAll(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        Loading…
      </div>
    );
  }

  if (!campaign || campaign.currentStep !== "dashboard") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-bold text-white">No campaign yet</h1>
        <p className="text-white/50 max-w-sm">
          Complete the setup flow to generate your campaign assets.
        </p>
        <Link
          href="/"
          className="mt-2 px-6 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
        >
          Get started
        </Link>
      </div>
    );
  }

  const banner1x1 = bannerByFormat(campaign.banners, "1:1");
  const banner16x9 = bannerByFormat(campaign.banners, "16:9");
  const banner9x16 = bannerByFormat(campaign.banners, "9:16");

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {campaign.approvedLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${campaign.approvedLogo}`}
                alt={`${campaign.brandName} logo`}
                className="w-14 h-14 rounded-xl object-contain bg-white/10 p-1"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{campaign.brandName}</h1>
              <p className="text-white/40 text-sm">{campaign.industry} · {campaign.location}</p>
            </div>
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
          >
            {downloadingAll ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Preparing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All
              </>
            )}
          </button>
        </div>

        {/* ── Tagline & Script ── */}
        <section className="flex flex-col gap-3">
          <p className="text-3xl font-bold leading-snug">
            &ldquo;{campaign.proposal.tagline}&rdquo;
          </p>

          {/* Color palette */}
          {campaign.styleLock.colors.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              {campaign.styleLock.colors.map((color) => (
                <div
                  key={color}
                  className="w-6 h-6 rounded-full border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <span className="text-xs text-white/30 ml-1">{campaign.styleLock.style}</span>
            </div>
          )}

          {/* Voiceover script (collapsible) */}
          <div className="mt-1">
            <button
              onClick={() => setScriptExpanded((v) => !v)}
              className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${scriptExpanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              Voiceover script
            </button>
            {scriptExpanded && (
              <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-prose pl-5">
                {campaign.proposal.voiceoverScript}
              </p>
            )}
          </div>
        </section>

        {/* ── Banners ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white/80">Banners</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1:1 */}
            <AssetCard
              title="Square (1:1)"
              isRegenerating={regenerating.banners}
              onRegenerate={handleRegenerateBanners}
              onDownload={banner1x1 ? () => triggerDownload(banner1x1, "image/png", "banner-1x1.png") : undefined}
            >
              {banner1x1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${banner1x1}`}
                  alt="Square banner"
                  className="w-full aspect-square object-contain rounded-lg bg-black/20"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-white/5 flex items-center justify-center text-white/30 text-sm">
                  No banner
                </div>
              )}
            </AssetCard>

            {/* 16:9 */}
            <AssetCard
              title="Landscape (16:9)"
              isRegenerating={regenerating.banners}
              onDownload={banner16x9 ? () => triggerDownload(banner16x9, "image/png", "banner-16x9.png") : undefined}
            >
              {banner16x9 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${banner16x9}`}
                  alt="Landscape banner"
                  className="w-full aspect-video object-contain rounded-lg bg-black/20"
                />
              ) : (
                <div className="w-full aspect-video rounded-lg bg-white/5 flex items-center justify-center text-white/30 text-sm">
                  No banner
                </div>
              )}
            </AssetCard>

            {/* 9:16 */}
            <AssetCard
              title="Portrait (9:16)"
              isRegenerating={regenerating.banners}
              onDownload={banner9x16 ? () => triggerDownload(banner9x16, "image/png", "banner-9x16.png") : undefined}
            >
              {banner9x16 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${banner9x16}`}
                  alt="Portrait banner"
                  className="w-full aspect-[9/16] max-h-48 object-contain rounded-lg bg-black/20 mx-auto"
                />
              ) : (
                <div className="w-full aspect-[9/16] max-h-48 rounded-lg bg-white/5 flex items-center justify-center text-white/30 text-sm">
                  No banner
                </div>
              )}
            </AssetCard>
          </div>
        </section>

        {/* ── Jingle ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white/80">Jingle</h2>
          <AssetCard
            title="Audio — 30 seconds"
            isRegenerating={regenerating.jingle}
            onRegenerate={handleRegenerateJingle}
            onDownload={
              campaign.jingle
                ? () => {
                    const { mime, ext } = inferAudioType(campaign.jingle);
                    triggerDownload(campaign.jingle, mime, `jingle.${ext}`);
                  }
                : undefined
            }
          >
            {campaign.jingle ? (
              <AudioPlayer src={campaign.jingle} />
            ) : (
              <p className="text-white/30 text-sm">No jingle generated</p>
            )}
          </AssetCard>
        </section>

        {/* ── Video Ad ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white/80">Video Ad</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AssetCard
              title="Final Ad (video + voiceover)"
              isRegenerating={regenerating.video}
              onRegenerate={handleRegenerateVideo}
              onDownload={campaign.finalVideo ? () => triggerDownload(campaign.finalVideo, "video/mp4", "video-ad.mp4") : undefined}
            >
              {campaign.finalVideo ? (
                <VideoPlayer src={campaign.finalVideo} poster={campaign.approvedLogo} />
              ) : (
                <div className="aspect-video rounded-xl bg-white/5 flex items-center justify-center text-white/30 text-sm">
                  No video generated
                </div>
              )}
            </AssetCard>

            <AssetCard
              title="Voiceover"
              isRegenerating={regenerating.voiceover}
              onRegenerate={handleRegenerateVoiceover}
              onDownload={campaign.voiceover ? () => triggerDownload(campaign.voiceover, "audio/wav", "voiceover.wav") : undefined}
            >
              <div className="flex flex-col gap-3">
                <p className="text-sm text-white/50 leading-relaxed">
                  {campaign.proposal.voiceoverScript}
                </p>
                {campaign.voiceover && <AudioPlayer src={campaign.voiceover} />}
              </div>
            </AssetCard>
          </div>
        </section>

      </div>
    </main>
  );
}
