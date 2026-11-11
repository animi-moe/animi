"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronLeft, GripHorizontal, X } from "lucide-react";
import { ToggleSetting } from "@/components/ToggleSetting";

import { DEFAULT_CELL } from "@/hooks/boardConfig";
import { isValidImageSource } from "@/hooks/utils";
import type { useBoardCells } from "@/hooks/useBoardCells";
import type { useBoardImages } from "@/hooks/useBoardImages";
import { panelDragState, type useBoardInput } from "@/hooks/useBoardInput";
import type { useEditHistory } from "@/hooks/useEditHistory";
import { useDraggablePanel } from "@/hooks/useDraggablePanel";

interface RightPanelProps {
  cellsState: ReturnType<typeof useBoardCells>;
  images: ReturnType<typeof useBoardImages>;
  input: ReturnType<typeof useBoardInput>;
  history: ReturnType<typeof useEditHistory>;
}

export function RightPanel({ cellsState, images, input, history }: RightPanelProps) {
  const { cells, updateCell } = cellsState;
  const { storeImage, resolveImage } = images;
  const { selectedCellIndex, setSelectedCellIndex } = input;
  const { beginAction, endAction } = history;

  const isCellSelected = selectedCellIndex !== null && selectedCellIndex >= 0;
  const activeCell = isCellSelected ? cells[selectedCellIndex!] : null;
  const [isOpen, setIsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isMobile = () => window.innerWidth < 768;
  const { panelRef, handleMouseDown } = useDraggablePanel(isMobile);

  const activeImages = activeCell?.images?.length
    ? activeCell.images
    : activeCell?.image
      ? [activeCell.image]
      : [];
  const activeIndex = activeCell?.activeImageIndex ?? 0;
  const currentImageUrl = activeImages[activeIndex] ?? "";

  const compressImageToBlob = (file: File, maxWidth = 800, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob failed"));
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    beginAction();
    try {
      const blob = await compressImageToBlob(file);
      const id = storeImage(blob);

      const currentImages = [...activeImages];
      if (currentImages.length === 0) {
        currentImages.push(id);
      } else {
        currentImages[activeIndex] = id;
      }

      const next = updateCell(selectedCellIndex!, {
        images: currentImages,
        activeImageIndex: activeIndex,
      });
      endAction(next);
    } catch (err) {
      endAction();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      if (clipboardItems[i].type.startsWith("image/")) {
        const file = clipboardItems[i].getAsFile();
        if (file) {
          e.preventDefault();
          const target = e.currentTarget;
          await processImageFile(file);
          target.blur();

          break;
        }
      }
    }
  };

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [activeCell?.image]);

  return (
    <aside
      ref={panelRef}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      style={isMobile() ? { transform: undefined } : undefined}
      className={`fixed top-[55%] right-0 z-30 flex -translate-y-1/2 items-center overflow-y-auto duration-300 ease-in-out select-none active:cursor-grabbing md:top-1/2 md:-translate-y-1/2 md:transition-none ${
        isOpen ? "translate-x-0" : "translate-x-[calc(100%-2rem)] md:translate-x-0"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="order-first flex h-20 w-8 shrink-0 cursor-pointer items-center justify-center rounded-l-xl bg-secondary text-brand-cyan shadow-lg transition-colors hover:bg-secondary-hover md:hidden"
        title={isOpen ? "Collapse panel" : "Expand panel"}
      >
        <ChevronRight className={`size-5 transition-transform duration-300`} />
      </button>

      <div
        onMouseDown={handleMouseDown}
        className="flex max-h-[80svh] w-60 flex-col items-center gap-2 rounded-l-2xl bg-primary p-3 text-gray-200 shadow-xl select-none md:w-64 md:rounded-2xl"
      >
        <button
          onClick={() => setSelectedCellIndex(null)}
          className="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-tertiary text-brand-pink transition-colors hover:bg-tertiary-hover hover:text-text-white"
          title="Close"
        >
          <X className="size-4" />
        </button>
        <div className="flex w-[95%] flex-1 flex-col gap-2">
          <div className="relative">
            <p className="absolute tracking-wide text-text-muted">
              {selectedCellIndex !== null && `#${selectedCellIndex + 1}`}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="mt-5 flex w-full flex-col gap-1.5">
              <div className="custom-scrollbar flex w-full gap-2 overflow-x-auto px-2 py-1">
                {activeImages.map((imgUrl, idx) => {
                  const isActive = idx === activeIndex;
                  const resolved = imgUrl ? resolveImage(imgUrl) : null;
                  const hasValidSource = isValidImageSource(imgUrl, resolveImage);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (idx !== activeIndex) {
                          // Switch to this thumbnail if it isn't active
                          beginAction();
                          const next = updateCell(selectedCellIndex!, { activeImageIndex: idx });
                          endAction(next);
                        } else {
                          // Clicked the already selected thumbnail -> open file explorer to change it
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`group relative aspect-160/220 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all active:scale-100 ${
                        isActive
                          ? "scale-105 border-brand-cyan shadow-md"
                          : "border-border-default opacity-70 hover:opacity-100"
                      }`}
                      title={isActive ? "Click to change image file" : "Click to select"}
                    >
                      {imgUrl && hasValidSource ? (
                        <img
                          src={resolved!}
                          alt="Thumbnail"
                          className="h-full w-full object-cover"
                        />
                      ) : null}

                      <div
                        className={`flex h-full w-full items-center justify-center bg-tertiary p-1 text-center text-[10px] text-text-muted ${imgUrl && hasValidSource ? "hidden" : ""}`}
                      >
                        {imgUrl ? "Failed to load" : "No Image"}
                      </div>

                      {/* Remove individual image button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          beginAction();
                          const newImages = activeImages.filter((_, i) => i !== idx);
                          const newIndex = Math.min(activeIndex, newImages.length - 1);
                          const next = updateCell(selectedCellIndex!, {
                            images: newImages,
                            activeImageIndex: Math.max(0, newIndex),
                          });
                          endAction(next);
                        }}
                        className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 text-brand-pink transition-opacity"
                        title="Remove image"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}

                <div
                  onClick={() => {
                    beginAction();
                    const newImages = [...activeImages, ""];
                    const next = updateCell(selectedCellIndex!, {
                      images: newImages,
                      activeImageIndex: newImages.length - 1,
                    });
                    endAction(next);
                  }}
                  className="flex aspect-160/220 w-20 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border-default text-text-muted transition-colors hover:border-brand-cyan hover:text-brand-cyan"
                  title="Add empty image slot"
                >
                  <span className="text-xl">+</span>
                </div>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <input
              type="text"
              placeholder="Paste Image URL..."
              value={currentImageUrl.startsWith("data:") ? "[Local Image File]" : currentImageUrl}
              onFocus={() => beginAction()}
              onBlur={() => endAction()}
              onChange={(e) => {
                const val = e.target.value;
                const newImages = [...activeImages];
                if (newImages.length === 0) {
                  newImages.push(val);
                } else {
                  newImages[activeIndex] = val;
                }
                updateCell(selectedCellIndex!, { images: newImages });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              onPaste={handlePaste}
              className="w-full rounded border-2 border-border-default bg-secondary px-3 py-2 text-xs text-white placeholder-gray-600 transition focus:border-brand-cyan/75 focus:outline-none md:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted md:text-sm">Title / Caption Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name..."
                value={activeCell?.name || ""}
                onFocus={() => beginAction()}
                onBlur={() => endAction()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                onChange={(e) => updateCell(selectedCellIndex!, { name: e.target.value })}
                className="w-full rounded border-2 border-border-default bg-secondary px-2 py-2 text-xs text-white placeholder-gray-600 transition focus:border-brand-cyan/75 focus:outline-none md:text-sm"
              />
            </div>

            <div className="flex w-full gap-2">
              {/* TOGGLE SHOW NAME */}
              <ToggleSetting
                label="Name"
                checked={activeCell?.showName ?? true}
                onChange={(checked) => {
                  beginAction();
                  const next = updateCell(selectedCellIndex!, { showName: checked });
                  endAction(next);
                }}
                className="flex-1"
              />

              {/* TOGGLE SHOW IMAGE */}
              <ToggleSetting
                label="Image"
                checked={activeCell?.showImage ?? true}
                onChange={(checked) => {
                  beginAction();
                  const next = updateCell(selectedCellIndex!, { showImage: checked });
                  endAction(next);
                }}
                className="flex-1"
              />
            </div>

            {/* TOGGLE MARKED */}
            <ToggleSetting
              label="Marked"
              checked={activeCell?.marked ?? false}
              onChange={(checked) => {
                beginAction();
                const next = updateCell(selectedCellIndex!, { marked: checked });
                endAction(next);
              }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setSelectedCellIndex(null)}
              className="flex-1 rounded-xl bg-brand-cyan/10 py-2 text-[10px] font-medium text-brand-cyan transition hover:bg-brand-cyan/30 md:text-xs"
            >
              Clear Select
            </button>

            {/* CLEAR CELL */}
            <button
              onClick={() => {
                beginAction();
                const prev = updateCell(selectedCellIndex!, DEFAULT_CELL);
                endAction(prev);
              }}
              className="flex-1 rounded-xl bg-brand-pink/10 py-2 text-[10px] font-medium text-brand-pink transition hover:bg-brand-pink/30 md:text-xs"
            >
              Clear Cell
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
