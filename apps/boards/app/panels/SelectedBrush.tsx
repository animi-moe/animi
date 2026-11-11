"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { useBoardInput } from "@/hooks/useBoardInput";
import type { useBoardImages } from "@/hooks/useBoardImages";

interface SelectedBrushProps {
  input: ReturnType<typeof useBoardInput>;
  images: ReturnType<typeof useBoardImages>;
}

export function SelectedBrush({ input, images }: SelectedBrushProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeBrush } = input;
  const { resolveImage } = images;

  if (!activeBrush) return null;
  const currentImgUrl = activeBrush.images?.[activeBrush.activeImageIndex ?? 0] ?? "";

  return (
    <div
      className={`fixed right-3 bottom-0 z-50 flex flex-col items-end transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-y-0" : "translate-y-[calc(100%-1.75rem)]"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center justify-center rounded-t-xl bg-secondary px-4 py-1 text-brand-cyan shadow-md transition-colors hover:bg-secondary-hover"
        title={isOpen ? "Collapse brush panel" : "Expand active brush"}
      >
        <ChevronDown className="size-5" />
      </button>

      <div className="flex flex-col items-center gap-1.5 rounded-tl-2xl bg-primary p-2 shadow-xl md:gap-2 md:rounded-tl-2xl md:p-2">
        <div className="w-15 overflow-hidden rounded-xl shadow-inner md:w-28">
          {currentImgUrl ? (
            <img
              src={resolveImage(currentImgUrl) ?? ""}
              alt={activeBrush.name ?? "Selected"}
              className="aspect-160/220 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-160/220 w-full items-center justify-center text-xs text-gray-600">
              No Image
            </div>
          )}
          <div className="bg-secondary p-1 md:p-1.5">
            <p className="truncate text-center text-[8px] font-bold text-white md:text-[10px]">
              {activeBrush.name ?? "Unnamed"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
