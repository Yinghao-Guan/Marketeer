"use client";

import Link from "next/link";
import StepWizard from "@/components/StepWizard";

export default function Home() {
  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center gap-8">
        <h1 className="text-6xl font-bold tracking-tight text-white">
          Marketeer
        </h1>
        <p className="text-xl text-white/70">Do you have a logo?</p>
        <div className="flex gap-4">
          <Link
            href="/onboarding/upload-logo"
            className="rounded-lg bg-white px-8 py-3 text-base font-medium text-black transition-colors hover:bg-white/90"
          >
            Yes
          </Link>
          <Link
            href="/onboarding/location"
            className="rounded-lg border border-white/20 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            No
          </Link>
        </div>
      </div>
    </StepWizard>
  );
}
