"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StepWizard from "@/components/StepWizard";

export default function CompetitorsPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    const current = JSON.parse(sessionStorage.getItem("marketeer-campaign") || "{}");
    const competitorLogos = images.map((f) => f.split(",")[1]);
    sessionStorage.setItem("marketeer-campaign", JSON.stringify({ ...current, competitorLogos }));
    router.push("/onboarding/brand-name");
  };

  const addFiles = useCallback((fileList: FileList) => {
    const imageFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    const readers = imageFiles.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((results) => {
      setImages((prev) => [...prev, ...results]);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-6 rounded-2xl bg-neutral-900 p-8 border border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Upload competitor material
            </h2>
            <p className="mt-1 text-neutral-400">
              Logos, flyers, or photos — we&apos;ll make sure your brand stands
              apart. The more you upload, the better we can evaluate your market
              position.
            </p>
          </div>

          <div className="flex gap-3 items-start">
            {/* Uploaded images */}
            {images.map((src, i) => (
              <div
                key={i}
                className="group relative h-28 w-28 flex-shrink-0 rounded-lg overflow-hidden border border-neutral-700"
              >
                <img
                  src={src}
                  alt={`Competitor ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Upload box */}
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`flex h-28 flex-1 min-w-[7rem] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-white bg-neutral-800"
                  : "border-neutral-700 hover:border-neutral-500"
              }`}
            >
              <span className="text-2xl text-neutral-500">+</span>
              <span className="mt-1 text-xs text-neutral-500">
                {images.length === 0 ? "Add image" : "Add another"}
              </span>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  addFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>

          <button
            onClick={handleNext}
            className="block w-full rounded-lg bg-white py-3 text-center font-medium text-black transition-colors hover:bg-neutral-200"
          >
            {images.length > 0 ? "Continue" : "Skip"}
          </button>
        </div>
      </div>
    </StepWizard>
  );
}
