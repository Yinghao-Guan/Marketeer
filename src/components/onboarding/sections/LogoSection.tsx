"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import { EASE_SMOOTH } from "@/lib/motion";

interface LogoSectionProps {
  isActive: boolean;
  logo: string | null;
  skipped?: boolean;
  onComplete: (logo: string) => void;
  onSkip?: () => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function LogoSection({
  isActive,
  logo,
  skipped,
  onComplete,
  onSkip,
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
            <h2 className="text-2xl font-bold text-white">upload your logo</h2>
            <p className="mt-1 text-white/50">
              we&apos;ll analyze it and build your campaign around it.
            </p>
          </div>
          <FileUpload
            onFilesChange={handleFilesChange}
            label="drop your logo here, or click to browse"
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
                continue
              </button>
            </motion.div>
          )}
          {onSkip && files.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: EASE_SMOOTH }}
              className="text-center"
            >
              <button
                onClick={onSkip}
                className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300 cursor-pointer"
              >
                skip - generate one for me
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
          {logo ? (
            <img
              src={logo}
              alt="Your logo"
              className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
            />
          ) : skipped ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
          ) : null}
          <div>
            <p className="text-base font-semibold text-white">
              {skipped ? "logo" : "your logo"}
            </p>
            <p className="text-sm text-white/40">
              {skipped ? "we'll generate one" : "click to change"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
