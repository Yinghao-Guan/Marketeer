"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeBlur } from "@/lib/motion";
import { ArrowLeft } from "lucide-react";

export default function StepWizard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeBlur}
      initial="hidden"
      animate="visible"
      custom={0}
      className="flex flex-col flex-1 gpu-layer"
    >
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          home
        </Link>
      </div>
      {children}
    </motion.div>
  );
}
