import type { Variants } from "framer-motion";

export const EASE_SMOOTH: [number, number, number, number] = [0.32, 0.72, 0, 1];

export const fadeBlur: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: EASE_SMOOTH,
      delay,
    },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: EASE_SMOOTH,
    },
  },
};

export const titleContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.1,
    },
  },
};

export const titleLetter: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: EASE_SMOOTH,
    },
  },
};

/* ── Puzzle onboarding animations ── */

export const puzzleSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const puzzleEnter: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: 0.6,
      ease: EASE_SMOOTH,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: EASE_SMOOTH },
  },
};

export const chipEnter: Variants = {
  hidden: { opacity: 0, scale: 0.8, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { ...puzzleSpring },
  },
};
