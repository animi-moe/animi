export interface BoardCell {
  name: string;
  images: string[];
  image?: string;
  activeImageIndex: number;
  showName: boolean;
  showImage: boolean;
  marked: boolean;
}

export interface AniListItem {
  name: string;
  images: string[];
  activeImageIndex: number;
}

export interface BoardStyleConfig {
  boardBg: string;
  boardOutline: string;
  boardTitleBg: string;
  boardLines: string;
  titleColor: string;
  outerBorder: number;
  gridThickness: number;
  boardRadius: number;
  boardTitle: string;
  showImages: boolean;
  showNames: boolean;
  showCellID: string;
}

export interface MouseButtonsState {
  lmb: boolean;
  rmb: boolean;
}
