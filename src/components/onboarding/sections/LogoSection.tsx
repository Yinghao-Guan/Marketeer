"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import { EASE_SMOOTH } from "@/lib/motion";

interface LogoSectionProps {
  isActive: boolean;
  logo: string | null;
  onComplete: (logo: string) => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function LogoSection({
  isActive,
  logo,
  onComplete,
}: LogoSectionProps) {
  const [files, setFiles] = useState<string[]>(logo ? [logo] : []);

  const handleFilesChange = (newFiles: string[]) => {
    setFiles(newFiles);
  };

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div key="active" {...fade} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Upload your logo</h2>
            <p className="mt-1 text-white/50">
              We&apos;ll analyze it and build your campaign around it.
            </p>
          </div>
          <FileUpload
            onFilesChange={handleFilesChange}
            label="Drop your logo here, or click to browse"
          />
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
            >
              <button
                onClick={() => onComplete(files[0])}
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
          className="flex items-center gap-4"
        >
          {logo && (
            <img
              src={logo}
              alt="Your logo"
              className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
            />
          )}
          <div>
            <p className="text-base font-semibold text-white">Your Logo</p>
            <p className="text-sm text-white/40">Click to change</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
