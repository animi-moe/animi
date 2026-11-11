import { useEffect, useState } from "react";
import { BOARD_CONFIG, DEFAULT_CELL } from "@/hooks/boardConfig";
import type { BoardCell, AniListItem } from "@/types/board";

export function useBoardCells(rows: number, cols: number) {
  const [cells, setCells] = useState<BoardCell[]>(() => Array(rows * cols).fill(DEFAULT_CELL));

  useEffect(() => {
    setCells((prev) => {
      const requiredGridSize = rows * cols;

      const lastOccupiedIndex = prev.findLastIndex((cell) => cell?.image || cell?.name);
      const actualContentLength = lastOccupiedIndex === -1 ? 0 : lastOccupiedIndex + 1;

      const targetSize = Math.max(requiredGridSize, actualContentLength);

      if (prev.length === targetSize) return prev;

      return Array(targetSize)
        .fill(null)
        .map((_, i) => prev[i] || DEFAULT_CELL);
    });
  }, [rows, cols]);

  const updateCell = (index: number, updatedFields: Partial<BoardCell>) => {
    const newCells = [...cells];
    newCells[index] = {
      ...newCells[index],
      ...updatedFields,
    };
    setCells(newCells);
    return newCells;
  };

  const eraseCell = (index: number) => {
    setCells((prev) => {
      const newCells = [...prev];
      newCells[index] = { ...DEFAULT_CELL, marked: newCells[index]?.marked ?? false };
      return newCells;
    });
  };

  const paintCell = (index: number, activeBrush: AniListItem | null) => {
    if (!activeBrush) return;
    setCells((prev) => {
      const newCells = [...prev];
      newCells[index] = {
        name: activeBrush.name,
        images: [...activeBrush.images],
        activeImageIndex: activeBrush.activeImageIndex ?? 0,
        showName: newCells[index]?.showName ?? true,
        showImage: newCells[index]?.showImage ?? true,
        marked: newCells[index]?.marked ?? false,
      };
      return newCells;
    });
  };

  const markCell = (index: number, marked: boolean) => {
    setCells((prev) => {
      const newCells = [...prev];
      newCells[index] = {
        ...newCells[index],
        marked,
      };
      return newCells;
    });
  };

  const fillEarliest = (character: AniListItem) => {
    setCells((prev) => {
      const firstEmpty = prev.findIndex(
        (cell) => !(cell.images?.length > 0 || cell.image) && !cell.name,
      );

      if (firstEmpty === -1) return prev;

      const newCells = [...prev];
      newCells[firstEmpty] = {
        ...newCells[firstEmpty],
        name: character.name,
        images: [...character.images],
        activeImageIndex: character.activeImageIndex ?? 0,
      };

      return newCells;
    });
  };

  function shuffleBoard() {
    setCells((prev) => {
      const gridSize = rows * cols;
      const activeCells = prev.slice(0, gridSize);
      const remainder = prev.slice(gridSize);
      const shuffled = [...activeCells];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return [...shuffled, ...remainder];
    });
  }

  const setAllCellNames = (
    show: boolean,
    history?: { beginAction: () => void; endAction: (cells?: BoardCell[]) => void },
  ) => {
    history?.beginAction();
    const next = cells.map((cell) => ({ ...cell, showName: show }));
    setCells(next);
    history?.endAction(next);
  };

  const setAllCellImages = (
    show: boolean,
    history?: { beginAction: () => void; endAction: (cells?: BoardCell[]) => void },
  ) => {
    history?.beginAction();
    const next = cells.map((cell) => ({ ...cell, showImage: show }));
    setCells(next);
    history?.endAction(next);
  };

  return {
    cells,
    setCells,
    updateCell,
    eraseCell,
    paintCell,
    markCell,
    fillEarliest,
    shuffleBoard,
    setAllCellNames,
    setAllCellImages,
  };
}
