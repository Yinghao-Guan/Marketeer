"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepWizard from "@/components/StepWizard";

export default function BrandNamePage() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleNext = () => {
    const current = JSON.parse(sessionStorage.getItem("marketeer-campaign") || "{}");
    if (name.trim()) {
      sessionStorage.setItem(
        "marketeer-campaign",
        JSON.stringify({ ...current, businessName: name.trim() })
      );
    }
    router.push("/onboarding/location");
  };

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-neutral-900 p-8 border border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              What&apos;s your business called?
            </h2>
            <p className="mt-1 text-neutral-400">
              This will be used in your campaign materials.
            </p>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleNext();
              }
            }}
            placeholder="e.g. Sunrise Tacos"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
          />
          <button
            onClick={handleNext}
            className="block w-full rounded-lg bg-white py-3 text-center font-medium text-black transition-colors hover:bg-neutral-200"
          >
            {name.trim() ? "Next" : "Skip"}
          </button>
        </div>
      </div>
    </StepWizard>
  );
}
