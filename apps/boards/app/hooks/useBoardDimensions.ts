import { useState } from "react";
import { BOARD_CONFIG } from "@/hooks/boardConfig";

export function useBoardDimensions() {
  const { defaultRows, defaultCols, defaultCellWidth, defaultCellHeight } = BOARD_CONFIG.dimensions;

  const [rows, setRows] = useState(defaultRows);
  const [cols, setCols] = useState(defaultCols);
  const [cellWidth, setCellWidth] = useState(defaultCellWidth);
  const [cellHeight, setCellHeight] = useState(defaultCellHeight);

  const isDefaultDimensions =
    rows === defaultRows &&
    cols === defaultCols &&
    cellWidth === defaultCellWidth &&
    cellHeight === defaultCellHeight;

  async function resetDimensions() {
    setRows(defaultRows);
    setCols(defaultCols);
    setCellWidth(defaultCellWidth);
    setCellHeight(defaultCellHeight);
  }

  return {
    rows,
    setRows,
    cols,
    setCols,
    cellWidth,
    setCellWidth,
    cellHeight,
    setCellHeight,
    isDefaultDimensions,
    resetDimensions,
  };
}
