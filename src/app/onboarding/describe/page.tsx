"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepWizard from "@/components/StepWizard";

export default function DescribePage() {
  const router = useRouter();
  const [description, setDescription] = useState("");

  const handleNext = () => {
    const current = JSON.parse(sessionStorage.getItem("marketeer-campaign") || "{}");
    sessionStorage.setItem(
      "marketeer-campaign",
      JSON.stringify({ ...current, brandName: description.trim() })
    );
    router.push("/rating");
  };

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-neutral-900 p-8 border border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Describe your business
            </h2>
            <p className="mt-1 text-neutral-400">
              A short description helps us tailor your brand identity and campaign tone.
            </p>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && description.trim().length > 0) {
                e.preventDefault();
                handleNext();
              }
            }}
            placeholder="e.g. A family-owned taco shop in East LA known for our handmade tortillas and late-night hours"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none resize-none h-32"
          />
          {description.trim().length > 0 && (
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
