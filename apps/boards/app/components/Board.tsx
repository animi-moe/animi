"use client";
import { useEffect, useState } from "react";
import { isValidImageSource } from "@/hooks/utils";
import type { useBoardDimensions } from "@/hooks/useBoardDimensions";
import type { useBoardStyle } from "@/hooks/useBoardStyle";
import { panelDragState, type useBoardInput } from "@/hooks/useBoardInput";
import type { useBoardImages } from "@/hooks/useBoardImages";
import type { useBoardCells } from "@/hooks/useBoardCells";

interface BoardProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  dimensions: ReturnType<typeof useBoardDimensions>;
  style: ReturnType<typeof useBoardStyle>;
  input: ReturnType<typeof useBoardInput>;
  images: ReturnType<typeof useBoardImages>;
  cellsState: ReturnType<typeof useBoardCells>;
}

interface CellImageProps {
  imageUrl: string;
  resolveImage: (key: string) => string | null;
  boardBg: string;
}

function CellImage({ imageUrl, resolveImage, boardBg }: CellImageProps) {
  const [hasError, setHasError] = useState(false);
  const [prevImageUrl, setPrevImageUrl] = useState(imageUrl);

  if (imageUrl !== prevImageUrl) {
    setPrevImageUrl(imageUrl);
    setHasError(false);
  }

  const src = isValidImageSource(imageUrl, resolveImage) ? resolveImage(imageUrl) : null;

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center p-1 text-center">
        <span className="text-lg leading-tight text-text-muted">Failed to load</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ backgroundColor: boardBg }}>
      <img
        src={src}
        alt="Cell Item"
        onError={() => setHasError(true)}
        className="pointer-events-none h-full w-full object-cover"
      />
    </div>
  );
}

export function Board({ boardRef, dimensions, style, input, images, cellsState }: BoardProps) {
  const { rows, cols, cellWidth, cellHeight } = dimensions;
  const {
    boardBg,
    boardOutline,
    boardTitleBg,
    boardLines,
    titleColor,
    outerBorder,
    gridThickness,
    boardRadius,
    boardTitle,
    showImages,
    showNames,
    showCellID,
    showBoardTitle,
    markerType,
    markerColor,
  } = style;
  const { pressedKeys, mouseButtons, handleMove, draggedSourceIndex, tool, selectedCellIndex } =
    input;
  const { resolveImage } = images;
  const { cells } = cellsState;

  const gap = gridThickness;
  const radius = Number(boardRadius) || 0;

  const totalWidth = Math.max(1, cols) * cellWidth + (Math.max(1, cols) - 1) * gap;
  const totalHeight = Math.max(1, rows) * cellHeight + (Math.max(1, rows) - 1) * gap;

  return (
    <div
      ref={boardRef}
      style={{
        background: boardLines,
        border: `${outerBorder}px solid ${boardOutline}`,
        borderRadius: radius > 0 ? `${radius + 12}px` : "0px",
      }}
      className="mx-auto w-fit p-2"
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          borderRadius: radius > 0 ? `${radius}px` : "0px",
        }}
      >
        {showBoardTitle && (
          <div style={{ background: boardTitleBg }} className="mb-2">
            <h1
              className="mx-auto p-2 text-center text-4xl wrap-break-word whitespace-pre-wrap"
              style={{
                maxWidth: `${totalWidth}px`,
                lineHeight: "1.2",
                color: titleColor,
              }}
            >
              {boardTitle || "My Anime Board"}
            </h1>
          </div>
        )}

        <div
          className="mx-auto grid select-none"
          style={{
            width: `${totalWidth}px`,
            gridAutoRows: "min-content",
            gap: `${gap}px`,
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            background: boardLines,
          }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            if (panelDragState.isDragging) return;
            const target = e.target as HTMLElement;
            const cellElement = target.closest("[data-index]");
            if (!cellElement) return;

            handleMove(e.clientX, e.clientY, {
              lmb: e.button === 0 && !pressedKeys[" "],
              rmb: e.button === 2,
            });
          }}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY, mouseButtons)}
        >
          {cells.slice(0, rows * cols).map((cell, index) => {
            const previewCell = cell;
            const activeImageUrl = cell?.images?.[cell.activeImageIndex ?? 0] ?? "";

            return (
              <div
                key={index}
                data-index={index}
                style={{
                  width: `${cellWidth}px`,
                  height: `${cellHeight}px`,
                  background: `${boardBg}`,
                }}
                className={`relative ${pressedKeys[" "] ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"} group overflow-hidden transition-all duration-0`}
              >
                {showImages && (previewCell?.showImage ?? true) && activeImageUrl && (
                  <CellImage
                    imageUrl={activeImageUrl}
                    resolveImage={resolveImage}
                    boardBg={boardBg}
                  />
                )}

                {showCellID !== "off" && (
                  <div className="pointer-events-none absolute top-1.5 left-1.5 z-20 rounded bg-black/75 px-1.5 py-0.5 text-[20px] font-bold text-white shadow">
                    {showCellID === "number"
                      ? index + 1
                      : `${Math.floor(index / cols) + 1}-${(index % cols) + 1}`}
                  </div>
                )}

                {previewCell?.marked && (
                  <div
                    style={{ color: markerColor }}
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
                  >
                    {markerType === "circle" ? (
                      <svg className="h-full w-full p-2" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    ) : markerType === "heart" ? (
                      <svg
                        className="h-full w-full p-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    ) : (
                      <svg
                        className="h-full w-full p-2"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid meet"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeLinecap="round"
                      >
                        <line x1="10" y1="10" x2="90" y2="90" />
                        <line x1="90" y1="10" x2="10" y2="90" />
                      </svg>
                    )}
                  </div>
                )}

                {showNames && (previewCell?.showName ?? true) && previewCell?.name && (
                  <div className="pointer-events-none absolute right-2 bottom-2 left-2 z-20 flex max-h-[90%] items-center justify-center rounded-md bg-black/75 px-1 py-1 shadow-md">
                    <p className="custom-scrollbar overflow-y-auto text-center text-[15px] leading-tight font-semibold wrap-break-word whitespace-normal text-gray-200">
                      {previewCell.name}
                    </p>
                  </div>
                )}

                {index === selectedCellIndex && index !== draggedSourceIndex && (
                  <>
                    <div className="pointer-events-none absolute inset-0 z-20 border-4 border-brand-pink" />
                    <div className="pointer-events-none absolute top-2 left-1/2 z-30 -translate-x-1/2 rounded bg-brand-pink px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white shadow-md">
                      SELECTED
                    </div>
                  </>
                )}

                {index === draggedSourceIndex && (
                  <div className="pointer-events-none absolute top-2 left-1/2 z-30 -translate-x-1/2 rounded bg-moving px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white shadow-md">
                    MOVING
                  </div>
                )}

                <div
                  className={`pointer-events-none absolute inset-0 transition-all duration-0 ${
                    mouseButtons.lmb && tool === "select" && index === selectedCellIndex
                      ? "z-10 ring-4 ring-brand-pink ring-inset"
                      : index === draggedSourceIndex
                        ? "z-10 ring-4 ring-moving ring-inset"
                        : "z-10 ring-inset group-hover:ring-4 group-hover:ring-brand-cyan"
                  } `}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
