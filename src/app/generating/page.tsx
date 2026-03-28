"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

export default function GeneratingPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("banners-intro");

  const getCampaign = useCallback(() => {
    const data = sessionStorage.getItem("marketeer-campaign");
    return data ? JSON.parse(data) : null;
  }, []);

  const campaign = getCampaign();
  const proposal = campaign?.proposal;

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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {/* ── Banners Intro ── */}
        {stage === "banners-intro" && (
          <IntroCard key="banners-intro" title="Your Banners" subtitle="Crafted for every platform" />
        )}

        {/* ── Banners Show ── */}
        {stage === "banners-show" && (
          <motion.div
            key="banners-show"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            <div className="grid grid-cols-3 gap-4">
              <PlaceholderBanner label="1:1 Square" aspect="aspect-square" />
              <PlaceholderBanner label="16:9 Landscape" aspect="aspect-video" />
              <PlaceholderBanner label="9:16 Portrait" aspect="aspect-[9/16]" />
            </div>
            <p className="text-center text-neutral-500 text-sm mt-4">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <div className="aspect-video rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-neutral-400 text-sm">Video ad preview</p>
              </div>
            </div>
            <p className="text-center text-neutral-500 text-sm mt-4">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 flex flex-col items-center gap-4">
              {/* Waveform placeholder */}
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 32 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-white rounded-full"
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
              <p className="text-neutral-400 text-sm">Jingle preview</p>
            </div>
            <p className="text-center text-neutral-500 text-sm mt-4">
              {proposal?.jingleMood || "Your brand's sound"}
            </p>
          </motion.div>
        )}

        {/* ── Done ── */}
        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Your campaign is ready</h2>
              <p className="mt-2 text-neutral-400">
                All your assets have been generated. Head to the dashboard to review and download.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-10 py-4 rounded-xl bg-white text-black font-semibold text-lg transition-colors hover:bg-neutral-200"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      {stage !== "done" && (
        <div className="fixed bottom-8 flex gap-2">
          {["banners", "video", "jingle"].map((section, i) => {
            const sectionIndex = Math.floor(STAGE_ORDER.indexOf(stage) / 2);
            return (
              <div
                key={section}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i <= sectionIndex ? "bg-white" : "bg-neutral-700"
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <h2 className="text-4xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-neutral-400 text-lg">{subtitle}</p>
    </motion.div>
  );
}

function PlaceholderBanner({ label, aspect }: { label: string; aspect: string }) {
  return (
    <div className={`${aspect} rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center`}>
      <div className="text-center px-2">
        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-neutral-800 flex items-center justify-center">
          <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </div>
        <p className="text-neutral-500 text-xs">{label}</p>
      </div>
    </div>
  );
}
