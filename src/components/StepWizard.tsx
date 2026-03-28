"use client";

import { motion } from "framer-motion";
import { fadeBlur } from "@/lib/motion";

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
      {children}
    </motion.div>
  );
}
