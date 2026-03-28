"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_SMOOTH } from "@/lib/motion";

interface BrandNameSectionProps {
  isActive: boolean;
  brandName: string;
  onComplete: (brandName: string) => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function BrandNameSection({
  isActive,
  brandName: savedBrandName,
  onComplete,
}: BrandNameSectionProps) {
  const [value, setValue] = useState(savedBrandName);

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div key="active" {...fade} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              what&apos;s your business called?
            </h2>
            <p className="mt-1 text-white/50">
              this will appear across all your campaign materials.
            </p>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim().length > 0) {
                onComplete(value.trim());
              }
            }}
            placeholder="e.g. Sunrise Tacos"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
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
          <p className="text-sm text-white/40">business name</p>
          <p className="text-base font-semibold text-white">{savedBrandName}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
