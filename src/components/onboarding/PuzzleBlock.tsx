"use client";

import { motion } from "framer-motion";
import { puzzleSpring } from "@/lib/motion";

interface PuzzleBlockProps {
  layoutId: string;
  mode: "active" | "completed" | "grid";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function PuzzleBlock({
  layoutId,
  mode,
  children,
  className = "",
  style,
  onClick,
}: PuzzleBlockProps) {
  const baseClass =
    mode === "active"
      ? "glass-card w-full max-w-2xl p-10"
      : mode === "completed"
        ? "glass-card px-6 py-5 cursor-pointer hover:ring-1 hover:ring-white/20 transition-shadow"
        : "glass-card p-6 h-full overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/20 transition-shadow";

  return (
    <motion.div
      layout
      layoutId={layoutId}
      className={`${baseClass} ${className}`}
      style={style}
      transition={{ layout: puzzleSpring }}
      onClick={onClick}
      whileHover={mode !== "active" ? { scale: 1.02 } : undefined}
      whileTap={mode !== "active" ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  );
}
