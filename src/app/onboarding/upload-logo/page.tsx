"use client";

import { useState } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import StepWizard from "@/components/StepWizard";

export default function UploadLogoPage() {
  const [files, setFiles] = useState<string[]>([]);

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
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
            <Link
              href="/onboarding/competitors"
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
