import { useState, useEffect, useRef, useMemo } from "react";
import { useBoardStyle } from "@/hooks/useBoardStyle";
import { useBoardImages } from "@/hooks/useBoardImages";
import { useBoardDimensions } from "@/hooks/useBoardDimensions";
import { useBoardCells } from "@/hooks/useBoardCells";
import { useBoardInput } from "@/hooks/useBoardInput";
import { useAniListSearch } from "@/hooks/useAniListSearch";
import { useBoardExport } from "@/hooks/useBoardExport";
import { useBoardPersistence } from "@/hooks/useBoardPersistence";
import { useEditHistory } from "@/hooks/useEditHistory";

export function useAnimeBoard() {
  const boardRef = useRef<HTMLDivElement>(null);

  const dimensions = useBoardDimensions();
  const images = useBoardImages();
  const style = useBoardStyle();
  const cellsState = useBoardCells(dimensions.rows, dimensions.cols);
  const history = useEditHistory(cellsState);
  const input = useBoardInput(
    dimensions.rows,
    dimensions.cols,
    cellsState.cells,
    cellsState.setCells,
    cellsState.paintCell,
    cellsState.eraseCell,
    cellsState.markCell,
    history,
  );
  const anilist = useAniListSearch();
  const boardExport = useBoardExport(boardRef, dimensions, style, cellsState, images);

  useBoardPersistence(dimensions, style, cellsState, images);

  return {
    boardRef,
    dimensions,
    style,
    images,
    cellsState,
    input,
    anilist,
    boardExport,
    history,
  };
}

export type AnimeBoardState = ReturnType<typeof useAnimeBoard>;
