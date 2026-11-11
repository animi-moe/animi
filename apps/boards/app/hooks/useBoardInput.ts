import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CELL } from "@/hooks/boardConfig";
import type { BoardCell, AniListItem, MouseButtonsState } from "@/types/board";

export const panelDragState = {
  isDragging: false,
};

export function useBoardInput(
  rows: number,
  cols: number,
  cells: BoardCell[],
  setCells: React.Dispatch<React.SetStateAction<BoardCell[]>>,
  paintCell: (index: number, activeBrush: AniListItem | null) => void,
  eraseCell: (index: number) => void,
  markCell: (index: number, marked: boolean) => void,
  history: {
    beginAction: () => void;
    endAction: (actualCells?: BoardCell[]) => void;
    undo: () => void;
    redo: () => void;
  },
) {
  const [mouseButtons, setMouseButtons] = useState({ lmb: false, rmb: false, mmb: false });
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [tool, setTool] = useState("select");
  const [activeBrush, setActiveBrush] = useState<AniListItem | null>(null);
  const [draggedSourceIndex, setDraggedSourceIndex] = useState<number | null>(null);
  const [draggedTargetIndex, setDraggedTargetIndex] = useState<number | null>(null);
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef({
    activeBrush,
    pressedKeys,
    mouseButtons,
    draggedSourceIndex,
    draggedTargetIndex,
    cells,
  });
  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    stateRef.current = {
      activeBrush,
      pressedKeys,
      mouseButtons,
      draggedSourceIndex,
      draggedTargetIndex,
      cells,
    };
  }, [activeBrush, pressedKeys, mouseButtons, draggedSourceIndex, draggedTargetIndex, cells]);

  useEffect(() => {
    setDraggedSourceIndex(null);
    moveHandledRef.current = false;
  }, [tool]);

  useEffect(() => {
    const handleWindowBlur = () => {
      setDraggedSourceIndex(null);
      moveHandledRef.current = false;
    };
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, []);

  const KEYBINDS: Record<string, () => void> = useMemo(
    () => ({
      s: () => setTool("select"),
      b: () => setTool("brush"),
      e: () => setTool("eraser"),
      m: () => setTool("move"),
      i: () => setTool("dropper"),
      x: () => setTool("marker"),
      "/": () => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      },
    }),
    [tool],
  );

  const isActionRef = useRef(false);
  const markedRef = useRef<Set<number>>(new Set());
  const moveHandledRef = useRef(false);

  const handleMove = (clientX: number, clientY: number, buttons: MouseButtonsState) => {
    if (panelDragState.isDragging) return;

    const { lmb } = buttons;
    if (stateRef.current.pressedKeys[" "] || stateRef.current.mouseButtons.mmb) return;
    if (!lmb) return;

    const target = document.elementFromPoint(clientX, clientY) as HTMLElement;
    if (!target?.closest("[data-index]")) return;

    const cellIndex = target?.closest("[data-index]")?.getAttribute("data-index");
    if (cellIndex === null || cellIndex === undefined) return;
    const idx = Number(cellIndex);
    if (idx >= rows * cols) return;

    if (tool === "move") {
      if (moveHandledRef.current) return;
      moveHandledRef.current = true;

      if (draggedSourceIndex === null) {
        historyRef.current.endAction();
        setDraggedSourceIndex(idx);
      } else if (idx === draggedSourceIndex) {
        setDraggedSourceIndex(null);
      } else {
        historyRef.current.beginAction();
        const prev = stateRef.current.cells;
        const finalCells = [...prev];
        const temp = finalCells[draggedSourceIndex];
        finalCells[draggedSourceIndex] = finalCells[idx] || DEFAULT_CELL;
        finalCells[idx] = temp || DEFAULT_CELL;
        setCells(finalCells);
        historyRef.current.endAction(finalCells);
        setDraggedSourceIndex(null);
      }
      return;
    }

    if (!isActionRef.current) {
      historyRef.current.endAction();
      isActionRef.current = true;
      historyRef.current.beginAction();
    }

    if (tool === "select" && lmb) {
      setSelectedCellIndex(idx);
    }
    if (tool === "brush" && lmb) {
      paintCell(idx, activeBrush);
    }
    if (tool === "eraser" && lmb) {
      eraseCell(idx);
    }
    if (tool === "dropper" && lmb) {
      const ce = cells[idx];
      if (ce && (ce.name || (ce.images && ce.images.length > 0))) {
        setActiveBrush({
          name: ce.name,
          images: ce.images?.length > 0 ? [...ce.images] : ce.image ? [ce.image] : [],
          activeImageIndex: ce.activeImageIndex ?? 0,
        });
      } else {
        setActiveBrush(null);
      }
    }
    if (tool === "marker" && lmb) {
      if (!markedRef.current.has(idx)) {
        markedRef.current.add(idx);
        const current = stateRef.current.cells[idx]?.marked ?? false;
        markCell(idx, !current);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const key = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          historyRef.current.redo();
        } else {
          historyRef.current.undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && key === "y") {
        e.preventDefault();
        historyRef.current.redo();
        return;
      }

      if (e.key === "Escape") {
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          e.preventDefault();
          target.blur();
          return;
        }

        setSelectedCellIndex(null);
        return;
      }

      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
        return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      setPressedKeys((prev) => ({ ...prev, [key]: true }));

      if (KEYBINDS[key]) {
        e.preventDefault();
        KEYBINDS[key]();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => ({ ...prev, [key]: false }));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();

      if (
        document.activeElement instanceof HTMLElement &&
        e.target instanceof HTMLElement &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA"
      ) {
        document.activeElement.blur();
      }

      setMouseButtons((prev) => ({
        ...prev,
        lmb: e.button === 0,
        mmb: e.button === 1,
        rmb: e.button === 2,
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      setMouseButtons({ lmb: false, mmb: false, rmb: false });

      moveHandledRef.current = false;

      if (isActionRef.current) {
        isActionRef.current = false;
        markedRef.current.clear();
        historyRef.current.endAction();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      setMouseButtons({ lmb: false, rmb: false, mmb: false });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown, true);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, [tool, KEYBINDS]);

  return {
    inputRef,
    mouseButtons,
    setMouseButtons,
    pressedKeys,
    tool,
    setTool,
    activeBrush,
    setActiveBrush,
    selectedCellIndex,
    setSelectedCellIndex,
    draggedSourceIndex,
    draggedTargetIndex,
    handleMove,
  };
}
