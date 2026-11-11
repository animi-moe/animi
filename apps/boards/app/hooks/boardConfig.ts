import { BoardCell } from "@/types/board";

export const BOARD_CONFIG = {
  dimensions: {
    defaultRows: 5,
    defaultCols: 5,
    minRows: 0,
    maxRows: 20,
    minCols: 0,
    maxCols: 20,
    defaultCellWidth: 160,
    minCellWidth: 100,
    maxCellWidth: 400,
    defaultCellHeight: 220,
    minCellHeight: 100,
    maxCellHeight: 400,
  },
  style: {
    boardBg: "#ffffff",
    boardOutline: "#ffffff",
    boardLines: "#000000",
    boardTitleBg: "#ffffff",
    titleColor: "#000000",
    markerColor: "#ef4444",
    outerBorder: 4,
    gridThickness: 8,
    boardRadius: 20,
    boardTitle: "",
    showBoardTitle: true,
    showImages: true,
    showNames: true,
    showCellID: "off",
    markerType: "x",
  },
  search: {
    debounceTimeMs: 500,
    perPage: 50,
    defaultCategory: "Characters",
  },
  storage: {
    key: "anime-board-state",
  },
  export: {
    defaultFileName: "anime-board-export.json",
    defaultImageName: "anime-board.jpg",
    canvasScale: 2,
    jpegQuality: 0.9,
  },
};

export const DEFAULT_CELL: BoardCell = {
  name: "",
  images: [],
  activeImageIndex: 0,
  showName: true,
  showImage: true,
  marked: false,
};
