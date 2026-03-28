"use client";

import { useState } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import StepWizard from "@/components/StepWizard";

export default function CompetitorsPage() {
  const [files, setFiles] = useState<string[]>([]);

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white/5 p-8 backdrop-blur-sm ring-1 ring-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Upload competitor material
            </h2>
            <p className="mt-1 text-white/50">
              Logos, flyers, or photos — we&apos;ll make sure your brand stands
              apart.
            </p>
          </div>
          <FileUpload
            multiple
            onFilesChange={setFiles}
            label="Drop competitor logos here, or click to browse"
          />
          <Link
            href="/onboarding/location"
            className="block w-full rounded-lg bg-white py-3 text-center font-medium text-black transition-colors hover:bg-white/90"
          >
            {files.length > 0 ? "Next" : "Skip"}
          </Link>
        </div>
      </div>
    </StepWizard>
  );
}
