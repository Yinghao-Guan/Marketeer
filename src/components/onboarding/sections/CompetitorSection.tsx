"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/lib/compress-image";
import { EASE_SMOOTH } from "@/lib/motion";

interface CompetitorSectionProps {
  isActive: boolean;
  images: string[];
  onComplete: (images: string[]) => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function CompetitorSection({
  isActive,
  images: savedImages,
  onComplete,
}: CompetitorSectionProps) {
  const [images, setImages] = useState<string[]>(savedImages);
  const [isDragging, setIsDragging] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addImageFiles = useCallback((imageFiles: File[]) => {
    if (imageFiles.length === 0) return;
    const readers = imageFiles.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers)
      .then((results) => Promise.all(results.map((dataUrl) => compressImage(dataUrl))))
      .then((results) => {
        setImages((prev) => [...prev, ...results]);
      });
  }, []);

  const addFiles = useCallback((fileList: FileList) => {
    addImageFiles(Array.from(fileList).filter((f) => f.type.startsWith("image/")));
  }, [addImageFiles]);

  useEffect(() => {
    if (!isActive) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const imageFiles = Array.from(e.clipboardData.items)
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (imageFiles.length === 0) return;
      e.preventDefault();
      setIsPasting(true);
      addImageFiles(imageFiles);
      setTimeout(() => setIsPasting(false), 600);
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isActive, addImageFiles]);

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
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div key="active" {...fade} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              competitor material
            </h2>
            <p className="mt-1 text-white/50">
              logos, flyers, or photos - we&apos;ll make sure your brand stands
              apart.
            </p>
          </div>

          <div className="flex gap-3 items-start flex-wrap">
            {images.map((src, i) => (
              <div
                key={i}
                className="group relative h-20 w-20 sm:h-28 sm:w-28 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-white/10"
              >
                <img
                  src={src}
                  alt={`Competitor ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}

            <div
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`flex h-20 sm:h-28 flex-1 min-w-[5rem] sm:min-w-[7rem] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isPasting || isDragging
                  ? "border-[#5227FF] bg-[#5227FF]/10"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <span className="text-2xl text-white/40">{isPasting ? "…" : "+"}</span>
              <span className="mt-1 text-xs text-white/40">
                {isPasting ? "pasting…" : images.length === 0 ? "add or paste" : "add another"}
              </span>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
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

          <div className="flex gap-3">
            <button
              onClick={() => onComplete([])}
              className="flex-1 rounded-full border border-white/20 py-3 text-center font-medium text-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/40 hover:text-white active:scale-[0.98]"
            >
              skip
            </button>
            <button
              onClick={() => onComplete(images)}
              className="flex-1 rounded-full bg-white py-3 text-center font-medium text-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              continue
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="completed"
          {...fade}
          className="flex items-center gap-4"
        >
          {savedImages.length > 0 ? (
            <>
              <div className="flex -space-x-3">
                {savedImages.slice(0, 3).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-black/50"
                  />
                ))}
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  {savedImages.length} competitor{savedImages.length !== 1 && "s"}
                </p>
                <p className="text-sm text-white/40">click to edit</p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-base font-semibold text-white/50">competitors</p>
              <p className="text-sm text-white/40">skipped - click to add</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
