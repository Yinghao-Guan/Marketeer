"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import StepWizard from "@/components/StepWizard";

export default function UploadLogoPage() {
  const router = useRouter();
  const [files, setFiles] = useState<string[]>([]);

  const handleNext = () => {
    const current = JSON.parse(sessionStorage.getItem("marketeer-campaign") || "{}");
    // FileUpload returns data URLs — strip prefix to get raw base64
    const userLogo = files[0]?.split(",")[1] ?? null;
    sessionStorage.setItem("marketeer-campaign", JSON.stringify({ ...current, userLogo }));
    router.push("/onboarding/competitors");
  };

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white/5 p-8 backdrop-blur-sm ring-1 ring-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Upload your logo</h2>
            <p className="mt-1 text-white/50">
              We&apos;ll analyze it and build your campaign around it.
            </p>
          </div>
          <FileUpload
            onFilesChange={setFiles}
            label="Drop your logo here, or click to browse"
          />
          {files.length > 0 && (
            <button
              onClick={handleNext}
              className="block w-full rounded-lg bg-white py-3 text-center font-medium text-black transition-colors hover:bg-white/90"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </StepWizard>
  );
}
