"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepWizard from "@/components/StepWizard";

const industries = [
  "Restaurant / Food & Drink",
  "Retail / Shopping",
  "Tech / Software",
  "Health & Wellness",
  "Education",
  "Real Estate",
  "Political Campaign",
  "Entertainment / Events",
  "Professional Services",
  "Other",
];

export default function IndustryPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");

  const hasSelection =
    selected && (selected !== "Other" || otherText.trim().length > 0);

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-6 rounded-2xl bg-neutral-900 p-8 border border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              What industry are you in?
            </h2>
            <p className="mt-1 text-neutral-400">
              This shapes the style and tone of your campaign.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => setSelected(industry)}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  selected === industry
                    ? "border-white bg-neutral-800 text-white"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white"
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
          {selected === "Other" && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Describe your industry"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
            />
          )}
          {hasSelection && (
            <button
              onClick={() => {
                const current = JSON.parse(sessionStorage.getItem("marketeer-campaign") || "{}");
                const industry = selected === "Other" ? otherText.trim() : selected!;
                sessionStorage.setItem("marketeer-campaign", JSON.stringify({ ...current, industry }));
                router.push("/onboarding/describe");
              }}
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
