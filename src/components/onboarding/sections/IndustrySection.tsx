"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_SMOOTH } from "@/lib/motion";

const industries = [
  "Restaurant / Food & Drink",
  "Retail / Shopping",
  "Tech / Software",
  "Health & Wellness",
  "Education",
  "Real Estate",
  "Political Campaign",
  "Entertainment / Events",
  "Professional Services",
  "Other",
];

interface IndustrySectionProps {
  isActive: boolean;
  industry: string;
  onComplete: (industry: string) => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function IndustrySection({
  isActive,
  industry: savedIndustry,
  onComplete,
}: IndustrySectionProps) {
  const [selected, setSelected] = useState<string | null>(
    savedIndustry || null
  );
  const [otherText, setOtherText] = useState("");

  const resolvedIndustry =
    selected === "Other" ? otherText.trim() : selected ?? "";
  const canProceed = resolvedIndustry.length > 0;

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div key="active" {...fade} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              What industry are you in?
            </h2>
            <p className="mt-1 text-white/50">
              This shapes the style and tone of your campaign.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => setSelected(industry)}
                className={`rounded-full border px-4 py-3 text-left text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  selected === industry
                    ? "border-[#5227FF]/60 bg-[#5227FF]/10 text-white"
                    : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
          {selected === "Other" && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Describe your industry"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              autoFocus
            />
          )}
          {canProceed && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
            >
              <button
                onClick={() => onComplete(resolvedIndustry)}
                className="block w-full rounded-full bg-white py-3 text-center font-medium text-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
              >
                Continue
              </button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="completed"
          {...fade}
        >
          <p className="text-sm text-white/40">Industry</p>
          <p className="text-base font-semibold text-white">{savedIndustry}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
