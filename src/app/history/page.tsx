"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  initDB,
  getAllCampaigns,
  deleteCampaign,
  saveCampaign,
  Campaign,
} from "@/lib/store";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { staggerContainer, staggerChild, fadeBlur } from "@/lib/motion";

function triggerJsonDownload(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function bannerPreview(campaign: Campaign): string | null {
  const square = campaign.banners?.find((b) => b.format === "1:1");
  if (square?.imageBase64) return square.imageBase64;
  return null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  async function handleExport() {
    const all = await getAllCampaigns();
    if (all.length === 0) return;
    triggerJsonDownload(all, `marketeer-campaigns-${Date.now()}.json`);
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const items: Campaign[] = Array.isArray(data) ? data : [data];
        let imported = 0;
        for (const item of items) {
          if (!item.id || !item.brandName) continue;
          // make sure createdAt is a valid date
          item.createdAt = new Date(item.createdAt);
          await saveCampaign(item);
          imported++;
        }
        // reload the list
        const all = await getAllCampaigns();
        setCampaigns(all);
        setImportStatus(`imported ${imported} campaign${imported !== 1 ? "s" : ""}`);
        setTimeout(() => setImportStatus(null), 3000);
      } catch {
        setImportStatus("import failed - invalid file");
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    input.click();
  }

  const navigateToCampaign = (c: Campaign) => {
    switch (c.currentStep) {
      case "rating":
        return router.push(`/rating?id=${c.id}`);
      case "proposal":
      case "generating":
        return router.push(`/proposal?id=${c.id}`);
      default:
        return router.push(`/dashboard?id=${c.id}`);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await initDB();
        const all = await getAllCampaigns();
        if (!cancelled) setCampaigns(all);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    await deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
  }

  async function handleRegenerate(original: Campaign) {
    const newId = crypto.randomUUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clone: any = { ...original };

    // Reset generated assets -- these will be regenerated
    delete clone.proposal;
    delete clone.banners;
    delete clone.jingle;
    delete clone.video;
    delete clone.voiceover;
    delete clone.finalVideo;
    delete clone.finalVideoVersion;
    delete clone.jingleMood;

    const newCampaign: Campaign = {
      ...clone,
      id: newId,
      createdAt: new Date(),
      currentStep: "proposal",
    };

    await saveCampaign(newCampaign);

    // Write to sessionStorage so the proposal page can find it
    try {
      sessionStorage.setItem("marketeer-campaign", JSON.stringify(newCampaign));
    } catch {
      // quota exceeded -- IndexedDB is the source of truth
    }

    router.push(`/proposal?id=${newId}`);
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        Loading...
      </div>
    );
  }

  // ── Empty state ──
  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <svg
          className="w-16 h-16 text-white/20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
          />
        </svg>
        <h1 className="text-xl font-semibold text-white/60">
          no campaigns yet
        </h1>
        <p className="text-sm text-white/30 max-w-xs">
          create your first campaign to see it here.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Link
            href="/"
            className="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            get started
          </Link>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <Download className="w-4 h-4" />
            import
          </button>
        </div>
        {importStatus && (
          <p className="text-sm text-white/50 mt-2">{importStatus}</p>
        )}
      </div>
    );
  }

  // ── Campaign grid ──
  return (
    <main className="min-h-screen text-white">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full px-6 py-8 sm:px-12 sm:py-12 lg:px-20 flex flex-col gap-8"
      >
        {/* Back */}
        <motion.div variants={staggerChild}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          variants={staggerChild}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold">campaign history</h1>
            <p className="text-white/40 text-sm">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-transparent text-white/50 text-sm font-medium hover:text-white hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              <Upload className="w-4 h-4" />
              export
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-transparent text-white/50 text-sm font-medium hover:text-white hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              <Download className="w-4 h-4" />
              import
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-transparent text-white text-sm font-semibold hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              new campaign
            </Link>
          </div>
        </motion.div>

        {/* Import status toast */}
        {importStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm text-center w-fit mx-auto"
          >
            {importStatus}
          </motion.div>
        )}

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {campaigns.map((c) => (
              <motion.div
                key={c.id}
                variants={staggerChild}
                layout
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  filter: "blur(4px)",
                  transition: { duration: 0.3 },
                }}
              >
                <div className="glass-card overflow-hidden group relative">
                  {/* Banner preview / logo fallback */}
                  <div
                    className="relative w-full aspect-video overflow-hidden cursor-pointer"
                    onClick={() => navigateToCampaign(c)}
                  >
                    {bannerPreview(c) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:image/png;base64,${bannerPreview(c)}`}
                        alt={`${c.brandName} banner`}
                        className="w-full h-full object-cover"
                      />
                    ) : c.approvedLogo ? (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: c.styleLock?.colors?.[0]
                            ? `linear-gradient(135deg, ${c.styleLock.colors[0]}33, ${c.styleLock.colors[1] || c.styleLock.colors[0]}33)`
                            : "rgba(255,255,255,0.05)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${c.approvedLogo}`}
                          alt={`${c.brandName} logo`}
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col gap-2">
                    {/* Brand row */}
                    <div className="flex items-center gap-3">
                      {c.approvedLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`data:image/png;base64,${c.approvedLogo}`}
                          alt=""
                          className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 flex-shrink-0"
                        />
                      )}
                      <span
                        className="text-sm font-semibold truncate flex-1 cursor-pointer hover:text-white/90 transition-colors"
                        onClick={() => navigateToCampaign(c)}
                      >
                        {c.brandName || c.industry || "new campaign"}
                      </span>
                      {c.currentStep !== "dashboard" && (
                        <span className="flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                          in progress
                        </span>
                      )}

                      {/* Regenerate button -- finished campaigns only */}
                      {c.currentStep === "dashboard" && (
                        <button
                          onClick={() => handleRegenerate(c)}
                          aria-label="Regenerate campaign"
                          title="regenerate as new campaign"
                          className="text-white/20 hover:text-white/50 transition-colors p-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.356v4.992"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Delete button */}
                      {deleteConfirmId === c.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/50 hover:bg-white/20 transition-colors"
                          >
                            cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(c.id)}
                          aria-label="Delete campaign"
                          className="text-white/20 hover:text-white/50 transition-colors p-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-white/40">
                      {c.industry} &middot; {c.location}
                    </p>

                    {/* Tagline */}
                    {c.proposal?.tagline && (
                      <p className="text-xs text-white/50 italic truncate">
                        &ldquo;{c.proposal.tagline}&rdquo;
                      </p>
                    )}

                    {/* Date */}
                    <p className="text-[11px] text-white/30">
                      {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}
