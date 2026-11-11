"use client";
import { useState, useEffect } from "react";
import {
  Brush,
  Eraser,
  MousePointer2,
  Move,
  Pipette,
  X,
  Square,
  Frame,
  SquareRoundCorner,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Search,
} from "lucide-react";
import { Dropdown } from "@/components/Dropdown";
import { ToolButton } from "@/components/ToolButton";
import { ColorSetting } from "@/components/ColorSetting";
import { ToggleSetting } from "@/components/ToggleSetting";
import { CycleSetting } from "@/components/CycleSetting";
import { BOARD_CONFIG } from "@/hooks/boardConfig";
import type { useBoardDimensions } from "@/hooks/useBoardDimensions";
import type { useBoardStyle } from "@/hooks/useBoardStyle";
import type { useBoardInput } from "@/hooks/useBoardInput";
import type { useAniListSearch } from "@/hooks/useAniListSearch";
import type { useBoardExport } from "@/hooks/useBoardExport";
import type { useBoardCells } from "@/hooks/useBoardCells";

interface LeftPanelProps {
  dimensions: ReturnType<typeof useBoardDimensions>;
  style: ReturnType<typeof useBoardStyle>;
  input: ReturnType<typeof useBoardInput>;
  anilist: ReturnType<typeof useAniListSearch>;
  boardExport: ReturnType<typeof useBoardExport>;
  cellsState: ReturnType<typeof useBoardCells>;
}

export function LeftPanel({
  dimensions,
  style,
  input,
  anilist,
  boardExport,
  cellsState,
}: LeftPanelProps) {
  const { rows, setRows, cols, setCols, cellWidth, setCellWidth, cellHeight, setCellHeight } =
    dimensions;
  const {
    boardBg,
    setBoardBg,
    boardTitleBg,
    setBoardTitleBg,
    boardLines,
    setBoardLines,
    titleColor,
    setTitleColor,
    outerBorder,
    setOuterBorder,
    gridThickness,
    setGridThickness,
    boardRadius,
    setBoardRadius,
    showCellID,
    setShowCellID,
  } = style;
  const { tool, setTool, inputRef, setActiveBrush } = input;
  const { query, setQuery, results, setResults, category, setCategory } = anilist;
  const { resetBoard } = boardExport;
  const { shuffleBoard, fillEarliest } = cellsState;

  const [confirm, setConfirm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      onMouseDown={(e) => e.stopPropagation()}
      className={`fixed top-[55%] left-0 z-30 flex -translate-y-1/2 items-center overflow-x-hidden overflow-y-auto transition-transform duration-300 ease-in-out md:top-1/2 md:-translate-y-1/2 ${
        isOpen ? "translate-x-0" : "translate-x-[calc(-100%+2rem)] md:translate-x-0"
      }`}
    >
      <div className="flex max-h-[80svh] w-95 max-w-[calc(100vw-5rem)] flex-col items-center gap-3 rounded-r-2xl bg-primary p-4 shadow-xl md:w-[22vw] md:min-w-80">
        {/* Tools */}
        <div className="pb- grid w-full max-w-95 grid-cols-6 gap-2">
          <ToolButton
            id="select"
            tip="Select (S)"
            currentTool={tool}
            setTool={setTool}
            icon={MousePointer2}
          />
          <ToolButton
            id="brush"
            tip="Brush (B)"
            currentTool={tool}
            setTool={setTool}
            icon={Brush}
          />
          <ToolButton
            id="eraser"
            tip="Eraser (E)"
            currentTool={tool}
            setTool={setTool}
            icon={Eraser}
          />
          <ToolButton id="move" tip="Move (M)" currentTool={tool} setTool={setTool} icon={Move} />
          <ToolButton
            id="dropper"
            tip="Dropper (I)"
            currentTool={tool}
            setTool={setTool}
            icon={Pipette}
          />
          <ToolButton
            id="marker"
            tip="Marker (X)"
            currentTool={tool}
            setTool={setTool}
            icon={X}
            iconClassName="size-7"
          />
        </div>

        {/* Search */}
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-row items-center gap-2">
            <Dropdown
              options={["Characters", "Anime", "Manga", "Staff"]}
              value={category}
              onChange={setCategory}
              className="w-32"
            />

            <input
              ref={inputRef}
              className="w-full rounded-xl border-2 border-border-default py-1.5 text-center text-xs text-white placeholder-text-muted/50 transition outline-none focus:border-brand-cyan/75 md:text-sm"
              placeholder="Enter name..."
              value={query}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  anilist.searchAniList();
                }
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim() === "") setResults([]);
              }}
            />
          </div>

          <div
            className={`custom-scrollbar max-h-[40vh] min-h-[40vh] gap-0 overflow-y-auto rounded-2xl bg-black/20 ${results.length > 0 ? "grid grid-cols-4 content-start" : "flex flex-col items-center justify-center"}`}
          >
            {results.length > 0 ? (
              results.map((char, i) => {
                const activeImgUrl = char.images[char.activeImageIndex ?? 0] || "";

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (activeImgUrl) {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.src = activeImgUrl;
                      }
                      setActiveBrush(char);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      fillEarliest(char);
                    }}
                    className="group flex w-full flex-col items-center gap-1 p-1 transition-transform active:scale-95"
                  >
                    <div className="aspect-460/650 w-full overflow-hidden rounded-xl border-2 border-transparent transition-colors group-hover:border-brand-cyan">
                      <img
                        src={activeImgUrl}
                        alt={char.name}
                        className="h-full w-full object-cover"
                        draggable="false"
                      />
                    </div>
                    <p className="w-full truncate text-center text-[10px] font-medium text-text-muted md:text-xs">
                      {char.name}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="col-span-4 my-auto flex h-full flex-col items-center justify-center gap-2 text-text-muted">
                <Search className="size-16 opacity-50" />
                <span className="text-md">Waiting for results...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-20 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-xl bg-secondary text-brand-cyan shadow-lg transition-colors hover:bg-secondary-hover md:hidden"
        title={isOpen ? "Collapse panel" : "Expand panel"}
      >
        <ChevronLeft className={`size-5 transition-transform duration-300`} />
      </button>
    </aside>
  );
}
