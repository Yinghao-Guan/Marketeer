"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_SMOOTH } from "@/lib/motion";

interface DescriptionSectionProps {
  isActive: boolean;
  description: string;
  onComplete: (description: string) => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function DescriptionSection({
  isActive,
  description: savedDescription,
  onComplete,
}: DescriptionSectionProps) {
  const [value, setValue] = useState(savedDescription);

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div key="active" {...fade} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              describe your business
            </h2>
            <p className="mt-1 text-white/50">
              a short description helps us tailor your campaign tone and messaging.
            </p>
          </div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && value.trim().length > 0) {
                e.preventDefault();
                onComplete(value.trim());
              }
            }}
            placeholder="e.g. A family-owned taco shop in East LA known for our handmade tortillas and late-night hours"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none resize-none h-32"
            autoFocus
          />
          {value.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
            >
              <button
                onClick={() => onComplete(value.trim())}
                className="block w-full rounded-full bg-white py-3 text-center font-medium text-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
              >
                continue
              </button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div key="completed" {...fade}>
          <p className="text-sm text-white/40">description</p>
          <p className="text-base font-semibold text-white line-clamp-2">{savedDescription}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
