"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fadeBlur, EASE_SMOOTH } from "@/lib/motion";

type Stage =
  | "banners-intro"
  | "banners-show"
  | "video-intro"
  | "video-show"
  | "jingle-intro"
  | "jingle-show"
  | "done";

const STAGE_DURATIONS: Record<Stage, number> = {
  "banners-intro": 2000,
  "banners-show": 4000,
  "video-intro": 2000,
  "video-show": 4000,
  "jingle-intro": 2000,
  "jingle-show": 4000,
  done: 0,
};

const STAGE_ORDER: Stage[] = [
  "banners-intro",
  "banners-show",
  "video-intro",
  "video-show",
  "jingle-intro",
  "jingle-show",
  "done",
];

const ACCENT_COLORS = ["#5227FF", "#FF9FFC", "#B19EEF"];

export default function GeneratingPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("banners-intro");

  const [campaign, setCampaignData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("marketeer-campaign");
    if (data) setCampaignData(JSON.parse(data));
  }, []);

  const proposal = campaign?.proposal as Record<string, string> | undefined;

  useEffect(() => {
    const duration = STAGE_DURATIONS[stage];
    if (duration === 0) return;

    const timer = setTimeout(() => {
      const currentIndex = STAGE_ORDER.indexOf(stage);
      if (currentIndex < STAGE_ORDER.length - 1) {
        setStage(STAGE_ORDER[currentIndex + 1]);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center px-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {/* ── Banners Intro ── */}
        {stage === "banners-intro" && (
          <IntroCard key="banners-intro" title="Your Banners" subtitle="Crafted for every platform" />
        )}

        {/* ── Banners Show ── */}
        {stage === "banners-show" && (
          <motion.div
            key="banners-show"
            variants={fadeBlur}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
            custom={0}
            className="w-full max-w-4xl gpu-layer"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PlaceholderBanner label="1:1 Square" aspect="aspect-square" />
              <PlaceholderBanner label="16:9 Landscape" aspect="aspect-video" />
              <PlaceholderBanner label="9:16 Portrait" aspect="aspect-[9/16]" />
            </div>
            <p className="text-center text-white/40 text-sm mt-4">
              {proposal?.bannerConcept || "Banner designs based on your brand"}
            </p>
          </motion.div>
        )}

        {/* ── Video Intro ── */}
        {stage === "video-intro" && (
          <IntroCard key="video-intro" title="Your Video Ad" subtitle="A cinematic look at your brand" />
        )}

        {/* ── Video Show ── */}
        {stage === "video-show" && (
          <motion.div
            key="video-show"
            variants={fadeBlur}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
            custom={0}
            className="w-full max-w-2xl gpu-layer"
          >
            <div className="glass-card aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-white/50 text-sm">Video ad preview</p>
              </div>
            </div>
            <p className="text-center text-white/40 text-sm mt-4">
              {proposal?.videoScene || "Your brand story in motion"}
            </p>
          </motion.div>
        )}

        {/* ── Jingle Intro ── */}
        {stage === "jingle-intro" && (
          <IntroCard key="jingle-intro" title="Your Jingle" subtitle="Audio branding that sticks" />
        )}

        {/* ── Jingle Show ── */}
        {stage === "jingle-show" && (
          <motion.div
            key="jingle-show"
            variants={fadeBlur}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
            custom={0}
            className="w-full max-w-md gpu-layer"
          >
            <div className="glass-card p-8 flex flex-col items-center gap-4">
              {/* Waveform placeholder */}
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 32 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{ backgroundColor: ACCENT_COLORS[i % 3] }}
                    initial={{ height: 8 }}
                    animate={{ height: Math.random() * 48 + 16 }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
              <p className="text-white/50 text-sm">Jingle preview</p>
            </div>
            <p className="text-center text-white/40 text-sm mt-4">
              {proposal?.jingleMood || "Your brand's sound"}
            </p>
          </motion.div>
        )}

        {/* ── Done ── */}
        {stage === "done" && (
          <motion.div
            key="done"
            variants={fadeBlur}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-center space-y-6 gpu-layer"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Your campaign is ready</h2>
              <p className="mt-2 text-white/50">
                All your assets have been generated. Head to the dashboard to review and download.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 sm:px-10 sm:py-4 rounded-full bg-white text-black font-semibold text-base sm:text-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      {stage !== "done" && (
        <div className="fixed bottom-4 sm:bottom-8 flex gap-2">
          {["banners", "video", "jingle"].map((section, i) => {
            const sectionIndex = Math.floor(STAGE_ORDER.indexOf(stage) / 2);
            const isActive = i <= sectionIndex;
            return (
              <div
                key={section}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  isActive ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "bg-white/20"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function IntroCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
      transition={{ duration: 0.8, ease: EASE_SMOOTH }}
      className="text-center gpu-layer"
    >
      <h2 className="text-2xl sm:text-4xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-white/50 text-base sm:text-lg">{subtitle}</p>
    </motion.div>
  );
}

function PlaceholderBanner({ label, aspect }: { label: string; aspect: string }) {
  return (
    <div className={`${aspect} glass-card flex items-center justify-center`}>
      <div className="text-center px-2">
        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </div>
        <p className="text-white/40 text-xs">{label}</p>
      </div>
    </div>
  );
}
