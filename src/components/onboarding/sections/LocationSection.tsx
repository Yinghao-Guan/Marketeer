"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_SMOOTH } from "@/lib/motion";

interface LocationSectionProps {
  isActive: boolean;
  location: string;
  onComplete: (location: string) => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function LocationSection({
  isActive,
  location: savedLocation,
  onComplete,
}: LocationSectionProps) {
  const [value, setValue] = useState(savedLocation);

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div key="active" {...fade} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              where is your business located?
            </h2>
            <p className="mt-1 text-white/50">
              city or region - this helps us tailor your campaign.
            </p>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. San Francisco, CA"
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
        <motion.div
          key="completed"
          {...fade}
        >
          <p className="text-sm text-white/40">location</p>
          <p className="text-base font-semibold text-white">{savedLocation}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
