"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { LogoLoop } from "@/components/LogoLoop/LogoLoop";
import { fadeBlur, titleContainer, titleLetter } from "@/lib/motion";

const HACKATHON_LOGOS = [
  { src: "/logos/glitchlogo.png", alt: "Glitch Club" },
  { src: "/logos/geminilogo.png", alt: "Gemini" },
  { src: "/logos/uclalogo.png", alt: "UCLA" },
];

const DomeGallery = dynamic(() => import("@/components/hero/DomeGallery"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const LiquidEther = dynamic(
  () => import("@/components/LiquidEther").then((m) => ({ default: m.LiquidEther })),
  { ssr: false }
);

const STOREFRONT_IMAGES = [
  { src: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=774&auto=format&fit=crop", alt: "Cozy cafe exterior" },
  { src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=774&auto=format&fit=crop", alt: "Restaurant storefront" },
  { src: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=774&auto=format&fit=crop", alt: "European cafe terrace" },
  { src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=774&auto=format&fit=crop", alt: "Clothing boutique" },
  { src: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=774&auto=format&fit=crop", alt: "Bakery shopfront" },
  { src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=774&auto=format&fit=crop", alt: "Restaurant interior" },
  { src: "https://images.unsplash.com/photo-1462899006636-339e08d1844e?w=774&auto=format&fit=crop", alt: "Market stall" },
  { src: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=774&auto=format&fit=crop", alt: "Colorful facade" },
  { src: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=774&auto=format&fit=crop", alt: "Shopping street" },
  { src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=774&auto=format&fit=crop", alt: "Small business" },
  { src: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=774&auto=format&fit=crop", alt: "Fine dining" },
  { src: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=774&auto=format&fit=crop", alt: "Coffee shop" },
  { src: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=774&auto=format&fit=crop", alt: "Flower shop" },
  { src: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=774&auto=format&fit=crop", alt: "Fruit market" },
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=774&auto=format&fit=crop", alt: "Restaurant plating" },
  { src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=774&auto=format&fit=crop", alt: "Retail checkout" },
  { src: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=774&auto=format&fit=crop", alt: "Night market" },
  { src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=774&auto=format&fit=crop", alt: "Latte art cafe" },
  { src: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=774&auto=format&fit=crop", alt: "Pizza shop" },
  { src: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=774&auto=format&fit=crop", alt: "Grocery display" },
  { src: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=774&auto=format&fit=crop", alt: "Street vendor" },
  { src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=774&auto=format&fit=crop", alt: "Business meeting" },
  { src: "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=774&auto=format&fit=crop", alt: "Store interior" },
  { src: "https://images.unsplash.com/photo-1464869372688-a93d806be852?w=774&auto=format&fit=crop", alt: "Outdoor dining" },
  { src: "https://images.unsplash.com/photo-1507914372368-b2b085b925a1?w=774&auto=format&fit=crop", alt: "Bookshop" },
];

export default function Home() {
  const router = useRouter();

  const businessTypes = [
    "restaurants",
    "coffee shops",
    "boutiques",
    "barbershops",
    "bakeries",
    "flower shops",
    "food trucks",
    "yoga studios",
    "pet stores",
    "bookstores",
  ];

  const [typeIndex, setTypeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypeIndex((i) => (i + 1) % businessTypes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [businessTypes.length]);

  const start = () => {
    router.push("/onboarding");
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Left — DomeGallery (hidden on mobile — heavy WebGL) */}
      <div className="relative hidden lg:block lg:h-screen overflow-hidden lg:w-[70%]">
        <DomeGallery
          images={STOREFRONT_IMAGES}
          fit={1}
          minRadius={2400}
          maxRadius={2400}
          segments={40}
          grayscale={false}
          overlayBlurColor="#0a0a0a"
          autoRotateSpeed={0.02}
        />
        {/* Crossfade edge */}
        <div
          className="absolute top-0 right-0 h-full pointer-events-none z-10"
          style={{
            width: "clamp(80px, 15vw, 200px)",
            background: "linear-gradient(to right, transparent, #0a0a0a)",
          }}
        />
      </div>

      {/* Right — Branding + CTA */}
      <div className="relative h-screen overflow-hidden w-full lg:w-[30%]">
        {/* Liquid Ether background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <LiquidEther
            colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
            resolution={0.35}
            autoDemo={true}
            autoSpeed={0.3}
            autoIntensity={1.5}
            mouseForce={15}
            cursorSize={80}
            autoResumeDelay={500}
            autoRampDuration={0.8}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center h-full px-6 sm:px-8 lg:px-12">
        {/* Spacer to push content to center */}
        <div className="flex-1" />

        {/* Main content */}
        <div className="flex flex-col items-center gap-5">
        {/* Title */}
        <motion.h1
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-5xl sm:text-6xl lg:text-8xl tracking-tight text-center whitespace-nowrap gradient-text-animated"
          style={{ fontFamily: "var(--font-dirtyline)" }}
        >
          Marketeer
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="text-[13px] font-light tracking-[0.15em] uppercase text-white/40 text-center -mt-2"
        >
          Marketing campaigns for small businesses
        </motion.p>

        {/* Rotating business type */}
        <motion.div
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="flex items-center justify-center gap-1.5 h-8 -mt-2"
        >
          <span className="text-[13px] tracking-[0.15em] uppercase font-light text-white/30">for</span>
          <div className="relative h-5 w-[100px] sm:w-[120px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={businessTypes[typeIndex]}
                initial={{ y: 16, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -16, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="text-[13px] tracking-[0.15em] uppercase font-light text-white/60 absolute left-0"
              >
                {businessTypes[typeIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* CTA text */}
        <motion.p
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="text-base sm:text-lg font-light text-white/70 text-center leading-relaxed max-w-xs"
        >
          big-agency marketing without the big-agency budget.
        </motion.p>

        {/* Small business badge */}
        <motion.div
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.45}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
        >
          <svg className="w-3.5 h-3.5 text-[#5227FF]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7v1a3 3 0 006 0V7m0 0V7a3 3 0 006 0v0m0 0V7a3 3 0 006 0V7M6 21V10.7M18 21V10.7M3 7h18l-1.5-4.5H4.5L3 7z" />
          </svg>
          <span className="text-[11px] tracking-wide uppercase text-white/40">Made for local shops & startups</span>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="flex flex-col gap-3 w-full"
        >
          <button
            onClick={() => start()}
            className="group flex items-center justify-center gap-3 rounded-full bg-white pl-7 pr-2 py-2.5 text-sm font-medium tracking-wide text-black cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
          >
            get started
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/[0.06] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </button>
        </motion.div>

        <motion.div
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.6}
          className="flex justify-center"
        >
          <Link
            href="/history"
            className="text-[13px] tracking-[0.15em] uppercase font-light text-white/30 hover:text-white/60 transition-colors duration-300"
          >
            View past campaigns
          </Link>
        </motion.div>
        </div>

        {/* Spacer to push logos to bottom */}
        <div className="flex-1" />

        {/* Hackathon credit strip */}
        <motion.div
          variants={fadeBlur}
          initial="hidden"
          animate="visible"
          custom={0.7}
          className="w-full pb-8"
        >
          <p className="text-[13px] tracking-[0.15em] uppercase font-light text-white/50 text-center mb-4">
            made possible by
          </p>
          <LogoLoop
            logos={HACKATHON_LOGOS}
            speed={40}
            direction="left"
            logoHeight={64}
            gap={48}
            pauseOnHover
            fadeOut
            fadeOutColor="#0a0a0a"
            ariaLabel="Hackathon partner logos"
          />
        </motion.div>
        </div>
      </div>
    </div>
  );
}
