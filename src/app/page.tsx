"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-6">
      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="text-9xl tracking-tight text-white"
        style={{
          fontFamily: "var(--font-dirtyline)",
          WebkitTextStroke: "2px black",
          paintOrder: "stroke fill",
        }}
      >
        Marketeer
      </motion.h1>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.15}
        className="text-lg text-white/50"
      >
        AI-powered marketing campaigns in minutes
      </motion.p>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.3}
        className="mt-4 text-2xl font-medium text-white/80"
      >
        Do you have a logo?
      </motion.p>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.45}
        className="flex gap-5 mt-2"
      >
        <Link
          href="/onboarding/upload-logo"
          className="rounded-xl bg-white px-10 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 hover:scale-105"
          style={{
            boxShadow: "0 0 30px rgba(255, 255, 255, 0.15)",
          }}
        >
          Yes
        </Link>
        <Link
          href="/onboarding/location"
          className="rounded-xl border border-white/20 px-10 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10 hover:scale-105"
        >
          No
        </Link>
      </motion.div>
    </div>
  );
}
