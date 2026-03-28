"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const LiquidEther = dynamic(
  () => import("@/components/LiquidEther").then((m) => ({ default: m.LiquidEther })),
  { ssr: false }
);

export default function GlobalBackground() {
  const pathname = usePathname();

  // The hero page has its own LiquidEther placement, so skip it there
  if (pathname === "/") return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-25">
      <LiquidEther
        colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
        resolution={0.25}
        autoDemo={true}
        autoSpeed={0.2}
        autoIntensity={1.0}
        mouseForce={10}
        cursorSize={80}
        autoResumeDelay={500}
        autoRampDuration={0.8}
      />
    </div>
  );
}
