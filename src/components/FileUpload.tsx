"use client";

import { useCallback, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";

interface FileUploadProps {
  multiple?: boolean;
  onFilesChange: (files: string[]) => void;
  label?: string;
}

export default function FileUpload({
  multiple = false,
  onFilesChange,
  label = "Drag & drop an image here, or click to browse",
}: FileUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList) => {
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

      Promise.all(readers)
        .then((results) => Promise.all(results.map((dataUrl) => compressImage(dataUrl))))
        .then((results) => {
          if (multiple) {
            const updated = [...previews, ...results];
            setPreviews(updated);
            onFilesChange(updated);
          } else {
            setPreviews(results.slice(0, 1));
            onFilesChange(results.slice(0, 1));
          }
        });
    },
    [multiple, previews, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleRemove = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onFilesChange(updated);
  };

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-[#5227FF] bg-[#5227FF]/10"
            : "border-white/20 hover:border-white/40"
        }`}
      >
        <p className="text-white/60">{label}</p>
        <p className="mt-1 text-sm text-white/40">PNG, JPG, WebP, or SVG</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {previews.length > 0 && (
        <div
          className={`mt-4 ${
            multiple
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
              : "flex justify-center"
          }`}
        >
          {previews.map((src, i) => (
            <div key={i} className="group relative">
              <img
                src={src}
                alt={`Upload ${i + 1}`}
                className="h-32 w-full rounded-lg object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
