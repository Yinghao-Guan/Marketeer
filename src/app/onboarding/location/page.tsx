"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepWizard from "@/components/StepWizard";

export default function LocationPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");

  const handleNext = () => {
    const current = JSON.parse(sessionStorage.getItem("marketeer-campaign") || "{}");
    sessionStorage.setItem("marketeer-campaign", JSON.stringify({ ...current, location }));
    router.push("/onboarding/industry");
  };

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-neutral-900 p-8 border border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Where is your business located?
            </h2>
            <p className="mt-1 text-neutral-400">
              City or region — this helps us tailor your campaign.
            </p>
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && location.trim().length > 0) {
                handleNext();
              }
            }}
            placeholder="e.g. San Francisco, CA"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
          />
          {location.trim().length > 0 && (
            <button
              onClick={handleNext}
              className="block w-full rounded-lg bg-white py-3 text-center font-medium text-black transition-colors hover:bg-neutral-200"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </StepWizard>
  );
}
