"use client";
import { useEffect, useRef, useState } from "react";
import { ToggleSetting } from "@/components/ToggleSetting";
import { CycleSetting } from "@/components/CycleSetting";
import { ColorSetting } from "@/components/ColorSetting";
import { BOARD_CONFIG } from "@/hooks/boardConfig";
import { X, Square, Frame, SquareRoundCorner } from "lucide-react";

import type { useBoardStyle } from "@/hooks/useBoardStyle";
import type { useBoardDimensions } from "@/hooks/useBoardDimensions";
import type { useBoardExport } from "@/hooks/useBoardExport";
import type { useBoardCells } from "@/hooks/useBoardCells";
import type { useEditHistory } from "@/hooks/useEditHistory";
import type { useAniListSearch } from "@/hooks/useAniListSearch";

import { useDraggablePanel } from "@/hooks/useDraggablePanel";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  style: ReturnType<typeof useBoardStyle>;
  dimensions: ReturnType<typeof useBoardDimensions>;
  boardExport: ReturnType<typeof useBoardExport>;
  boardCells: ReturnType<typeof useBoardCells>;
  history: ReturnType<typeof useEditHistory>;
  anilist: ReturnType<typeof useAniListSearch>;
}

export function SettingsPanel({
  isOpen,
  onClose,
  style,
  dimensions,
  boardExport,
  boardCells,
  history,
  anilist,
}: SettingsPanelProps) {
  const {
    boardBg,
    setBoardBg,
    boardOutline,
    setBoardOutline,
    showImages,
    setShowImages,
    showNames,
    setShowNames,
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
    showBoardTitle,
    setShowBoardTitle,
    markerType,
    setMarkerType,
    markerColor,
    setMarkerColor,
  } = style;
  const { rows, setRows, cols, setCols, cellWidth, setCellWidth, cellHeight, setCellHeight } =
    dimensions;
  const { resetBoard } = boardExport;
  const { shuffleBoard } = boardCells;

  const [confirm, setConfirm] = useState("");

  const [localCellWidth, setLocalCellWidth] = useState(cellWidth.toString());
  const [localCellHeight, setLocalCellHeight] = useState(cellHeight.toString());
  const [localOuterBorder, setLocalOuterBorder] = useState(outerBorder.toString());
  const [localGridThickness, setLocalGridThickness] = useState(gridThickness.toString());
  const [localBoardRadius, setLocalBoardRadius] = useState(boardRadius.toString());

  useEffect(() => {
    setLocalCellWidth(cellWidth.toString());
  }, [cellWidth]);

  useEffect(() => {
    setLocalCellHeight(cellHeight.toString());
  }, [cellHeight]);

  useEffect(() => {
    setLocalOuterBorder(outerBorder.toString());
  }, [outerBorder]);

  useEffect(() => {
    setLocalGridThickness(gridThickness.toString());
  }, [gridThickness]);

  useEffect(() => {
    setLocalBoardRadius(boardRadius.toString());
  }, [boardRadius]);

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const { panelRef, handleMouseDown } = useDraggablePanel();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex h-full w-full items-start justify-center p-4 pt-48">
      <div
        ref={panelRef}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto flex max-h-[30vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-primary text-text-white shadow-2xl select-none active:cursor-grabbing"
      >
        <div
          className="flex justify-between border-b border-border-default bg-primary px-4 py-3"
          title="Drag to move"
        >
          <h2 className="ml-2 font-fredoka text-lg font-semibold text-brand-cyan">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-tertiary text-brand-pink transition-colors hover:bg-tertiary-hover hover:text-text-white"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="custom-scrollbar flex flex-col gap-2 overflow-y-auto p-4">
          <div className="flex w-full min-w-0 flex-row gap-1">
            {/* Rows x Cols */}
            <div className="flex min-w-0 flex-2 items-center rounded-xl bg-tertiary">
              <input
                type="number"
                value={rows === 0 ? "0" : rows.toString()}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setRows(isNaN(val) ? 0 : Math.min(BOARD_CONFIG.dimensions.maxRows, val));
                }}
                className="h-7 w-full min-w-0 [appearance:textfield] bg-transparent text-center text-xs font-bold text-text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="shrink-0 px-0.5 text-xs font-bold text-border-hover">×</span>
              <input
                type="number"
                value={cols === 0 ? "0" : cols.toString()}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCols(isNaN(val) ? 0 : Math.min(BOARD_CONFIG.dimensions.maxCols, val));
                }}
                className="h-7 w-full min-w-0 [appearance:textfield] bg-transparent text-center text-xs font-bold text-text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            {/* Cell width x Cell Height */}
            <div className="flex min-w-0 flex-2 items-center rounded-xl bg-tertiary px-2">
              <input
                type="number"
                value={localCellWidth}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLocalCellWidth(e.target.value)}
                onBlur={() => {
                  const val = parseInt(localCellWidth, 10);
                  const clamped = isNaN(val)
                    ? BOARD_CONFIG.dimensions.defaultCellWidth
                    : Math.min(
                        BOARD_CONFIG.dimensions.maxCellWidth,
                        Math.max(BOARD_CONFIG.dimensions.minCellWidth, val),
                      );
                  setCellWidth(clamped);
                  setLocalCellWidth(clamped.toString());
                }}
                className="h-7 w-full min-w-0 [appearance:textfield] bg-transparent text-center text-xs font-bold text-text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="shrink-0 px-0.5 text-xs font-bold text-border-hover">×</span>
              <input
                type="number"
                value={localCellHeight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLocalCellHeight(e.target.value)}
                onBlur={() => {
                  const val = parseInt(localCellHeight, 10);
                  const clamped = isNaN(val)
                    ? BOARD_CONFIG.dimensions.defaultCellHeight
                    : Math.min(
                        BOARD_CONFIG.dimensions.maxCellHeight,
                        Math.max(BOARD_CONFIG.dimensions.minCellHeight, val),
                      );
                  setCellHeight(clamped);
                  setLocalCellHeight(clamped.toString());
                }}
                className="h-7 w-full min-w-0 [appearance:textfield] bg-transparent text-center text-xs font-bold text-text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            {/* Outer Border */}
            <div
              className="flex min-w-0 flex-1 items-center rounded-xl bg-tertiary px-1.5"
              title="Outer Border Width"
            >
              <Square className="size-3 shrink-0 text-text-muted" />
              <input
                type="number"
                value={localOuterBorder}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLocalOuterBorder(e.target.value)}
                onBlur={() => {
                  const val = parseInt(localOuterBorder, 10);
                  const clamped = isNaN(val)
                    ? BOARD_CONFIG.style.outerBorder
                    : Math.min(50, Math.max(0, val));
                  setOuterBorder(clamped);
                  setLocalOuterBorder(clamped.toString());
                }}
                className="h-7 w-full min-w-0 [appearance:textfield] bg-transparent text-center text-xs font-bold text-text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            {/* Grid Thickness */}
            <div
              className="flex min-w-0 flex-1 items-center rounded-xl bg-tertiary px-1.5"
              title="Grid Thickness"
            >
              <Frame className="size-3 shrink-0 text-text-muted" />
              <input
                type="number"
                value={localGridThickness}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLocalGridThickness(e.target.value)}
                onBlur={() => {
                  const val = parseInt(localGridThickness, 10);
                  const clamped = isNaN(val)
                    ? BOARD_CONFIG.style.gridThickness
                    : Math.min(50, Math.max(0, val));
                  setGridThickness(clamped);
                  setLocalGridThickness(clamped.toString());
                }}
                className="h-7 w-full min-w-0 [appearance:textfield] bg-transparent text-center text-xs font-bold text-text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            {/* Board Radius */}
            <div
              className="flex min-w-0 flex-1 items-center rounded-xl bg-tertiary px-1.5"
              title="Board Corner Radius"
            >
              <SquareRoundCorner className="size-3 shrink-0 rounded-xs text-text-muted" />
              <input
                type="number"
                value={localBoardRadius}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLocalBoardRadius(e.target.value)}
                onBlur={() => {
                  const val = parseInt(localBoardRadius, 10);
                  const clamped = isNaN(val)
                    ? BOARD_CONFIG.style.boardRadius
                    : Math.min(100, Math.max(0, val));
                  setBoardRadius(clamped);
                  setLocalBoardRadius(clamped.toString());
                }}
                className="h-7 w-full min-w-0 [appearance:textfield] bg-transparent text-center text-xs font-bold text-text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2">
              <ToggleSetting
                className="flex-1"
                label="Global Show Images"
                checked={showImages}
                onChange={setShowImages}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => boardCells.setAllCellImages(true, history)}
                  className="rounded bg-tertiary px-2 py-1 text-xs font-medium text-brand-cyan transition hover:bg-tertiary-hover active:scale-95"
                  title="Turn on images for all individual cells"
                >
                  All On
                </button>
                <button
                  onClick={() => boardCells.setAllCellImages(false, history)}
                  className="rounded bg-tertiary px-2 py-1 text-xs font-medium text-text-muted transition hover:bg-tertiary-hover hover:text-text-white active:scale-95"
                  title="Turn off images for all individual cells"
                >
                  All Off
                </button>
              </div>
            </div>
            {/* Show Names & Quick Bulk Control */}
            <div className="flex flex-row gap-2">
              <ToggleSetting
                className="flex-1"
                label="Global Show Names"
                checked={showNames}
                onChange={setShowNames}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => boardCells.setAllCellNames(true, history)}
                  className="rounded bg-tertiary px-2 py-1 text-xs font-medium text-brand-cyan transition hover:bg-tertiary-hover active:scale-95"
                  title="Turn on names for all individual cells"
                >
                  All On
                </button>
                <button
                  onClick={() => boardCells.setAllCellNames(false, history)}
                  className="rounded bg-tertiary px-2 py-1 text-xs font-medium text-text-muted transition hover:bg-tertiary-hover hover:text-text-white active:scale-95"
                  title="Turn off names for all individual cells"
                >
                  All Off
                </button>
              </div>
            </div>
            <ToggleSetting
              className="flex-1"
              label="Show Board Title"
              checked={showBoardTitle}
              onChange={setShowBoardTitle}
            />
            <CycleSetting
              label="Cell ID Mode"
              modes={[
                { id: "off", label: "Off", style: "bg-quad text-text-muted" },
                { id: "number", label: "Number", style: "bg-brand-cyan/20 text-brand-cyan" },
                { id: "rc", label: "R-C", style: "bg-brand-pink/20 text-brand-pink" },
              ]}
              currentMode={showCellID}
              onChange={setShowCellID}
            />
            <CycleSetting
              label="Marker Type"
              modes={[
                { id: "x", label: "X", style: "bg-quad text-text-muted" },
                { id: "circle", label: "Circle", style: "bg-brand-cyan/20 text-brand-cyan" },
                { id: "heart", label: "Heart", style: "bg-brand-pink/20 text-brand-pink" },
              ]}
              currentMode={markerType}
              onChange={setMarkerType}
            />

            <CycleSetting
              label="AL Name Format"
              modes={[
                {
                  id: "default",
                  label: "Eng/Rom",
                  style: "bg-brand-cyan/20 text-brand-cyan",
                },
                { id: "lastfirst", label: "Last First", style: "bg-brand-cyan/20 text-brand-cyan" },
                { id: "native", label: "Native", style: "bg-brand-pink/20 text-brand-pink" },
              ]}
              currentMode={anilist.nameFormat}
              onChange={anilist.setNameFormat}
            />

            {/* Colors */}
            <ColorSetting
              label="Board Background"
              value={style.boardBg}
              onChange={(color) => style.setBoardBg(color)}
            />
            <ColorSetting label="Board Outline" value={boardOutline} onChange={setBoardOutline} />
            <ColorSetting
              label="Title Background"
              value={boardTitleBg}
              onChange={setBoardTitleBg}
            />
            <ColorSetting label="Title Text" value={titleColor} onChange={setTitleColor} />
            <ColorSetting label="Grid Lines" value={boardLines} onChange={setBoardLines} />
            <ColorSetting label="Marker Color" value={markerColor} onChange={setMarkerColor} />
            <div className="mt-2 flex w-full items-center justify-center">
              {!confirm ? (
                <div className="flex w-full gap-2">
                  <button
                    onClick={() => setConfirm("shuffle")}
                    className="flex flex-1 cursor-pointer items-center justify-center rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-brand-cyan transition-all hover:bg-secondary-hover active:scale-95"
                  >
                    Shuffle Cells
                  </button>
                  <button
                    onClick={() => setConfirm("reset")}
                    className="flex flex-1 cursor-pointer items-center justify-center rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-secondary-hover active:scale-95"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div className="flex w-full flex-col items-center gap-1.5">
                  <span className="w-full truncate text-center text-xs tracking-tight text-text-muted">
                    {confirm === "reset" ? "Reset board?" : "Shuffle cells?"}
                  </span>
                  <div className="flex w-full gap-1.5">
                    <button
                      onClick={() => setConfirm("")}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-full bg-secondary px-2 py-1.5 text-xs font-medium text-brand-cyan transition-all hover:bg-secondary-hover active:scale-95"
                    >
                      No
                    </button>
                    <button
                      onClick={() => {
                        if (confirm === "reset") resetBoard();
                        if (confirm === "shuffle") shuffleBoard();
                        setConfirm("");
                      }}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-full bg-secondary px-2 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-secondary-hover hover:text-red-300 active:scale-95"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
