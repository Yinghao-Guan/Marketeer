"use client";

import { useState } from "react";
import Link from "next/link";
import StepWizard from "@/components/StepWizard";

export default function LocationPage() {
  const [location, setLocation] = useState("");

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white/5 p-8 backdrop-blur-sm ring-1 ring-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Where is your business located?
            </h2>
            <p className="mt-1 text-white/50">
              City or region — this helps us tailor your campaign.
            </p>
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. San Francisco, CA"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
          {location.trim().length > 0 && (
            <Link
              href="/onboarding/industry"
              className="block w-full rounded-lg bg-white py-3 text-center font-medium text-black transition-colors hover:bg-white/90"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </StepWizard>
  );
}
