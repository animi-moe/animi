import { useEffect, useRef } from "react";
import { get, set } from "idb-keyval";
import { BOARD_CONFIG, DEFAULT_CELL } from "@/hooks/boardConfig";
import { useBoardDimensions } from "@/hooks/useBoardDimensions";
import { useBoardStyle } from "@/hooks/useBoardStyle";
import { useBoardCells } from "@/hooks/useBoardCells";
import { useBoardImages } from "@/hooks/useBoardImages";
import { normalizeCell } from "./utils";

export function useBoardPersistence(
  dimensions: ReturnType<typeof useBoardDimensions>,
  style: ReturnType<typeof useBoardStyle>,
  cellsState: ReturnType<typeof useBoardCells>,
  images: ReturnType<typeof useBoardImages>,
) {
  const STORAGE_KEY = BOARD_CONFIG.storage.key;
  const isLoaded = useRef(false);

  useEffect(() => {
    async function loadSavedState() {
      try {
        const saved = await get(STORAGE_KEY);
        if (saved) {
          dimensions.setRows(saved.rows || BOARD_CONFIG.dimensions.defaultRows);
          dimensions.setCols(saved.cols || BOARD_CONFIG.dimensions.defaultCols);
          dimensions.setCellWidth(saved.cellWidth || BOARD_CONFIG.dimensions.defaultCellWidth);
          dimensions.setCellHeight(saved.cellHeight || BOARD_CONFIG.dimensions.defaultCellHeight);

          const rawCells =
            saved.cells ||
            Array(BOARD_CONFIG.dimensions.defaultRows * BOARD_CONFIG.dimensions.defaultCols).fill(
              DEFAULT_CELL,
            );
          const normalizedCells = rawCells.map((cell: any) => normalizeCell(cell));
          cellsState.setCells(normalizedCells);

          if (saved.style) {
            style.updateStyle(saved.style);
          }

          if (saved.images) {
            for (const [key, base64] of Object.entries(saved.images)) {
              const res = await fetch(base64 as string);
              const blob = await res.blob();
              images.setImage(key, blob);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load layout from IndexedDB", e);
      } finally {
        isLoaded.current = true;
      }
    }
    loadSavedState();
  }, []);

  useEffect(() => {
    if (!isLoaded.current) return;
    if (cellsState.cells.length === 0) return;

    const saveAsync = async () => {
      const saveImages: Record<string, string> = {};

      await Promise.all(
        images.getImageEntries().map(
          ([key, blob]) =>
            new Promise<void>((resolve) => {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                saveImages[key] = reader.result as string;
                resolve();
              };
            }),
        ),
      );

      await set(STORAGE_KEY, {
        rows: dimensions.rows,
        cols: dimensions.cols,
        cells: cellsState.cells,
        cellWidth: dimensions.cellWidth,
        cellHeight: dimensions.cellHeight,
        style: style.style,
        images: saveImages,
      });
    };

    saveAsync().catch(console.error);
  }, [
    dimensions.rows,
    dimensions.cols,
    dimensions.cellWidth,
    dimensions.cellHeight,
    cellsState.cells,
    style.style,
  ]);
}
