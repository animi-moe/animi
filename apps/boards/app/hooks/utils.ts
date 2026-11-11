import { BoardCell } from "@/types/board";
import { DEFAULT_CELL } from "@/hooks/boardConfig";

export function normalizeCell(cell: any): BoardCell {
  if (!cell) return DEFAULT_CELL;

  if (Array.isArray(cell.images)) {
    return {
      name: cell.name ?? "",
      images: cell.images,
      activeImageIndex: typeof cell.activeImageIndex === "number" ? cell.activeImageIndex : 0,
      showName: cell.showName ?? true,
      showImage: cell.showImage ?? true,
      marked: cell.marked ?? false,
    };
  }

  const legacyImages = cell.image ? [cell.image] : [];
  return {
    name: cell.name ?? "",
    images: legacyImages,
    activeImageIndex: 0,
    showName: cell.showName ?? true,
    showImage: cell.showImage ?? true,
    marked: cell.marked ?? false,
  };
}

export function isValidImageSource(
  src: string,
  resolveImage?: (key: string) => string | null,
): boolean {
  if (!src) return false;

  if (src.startsWith("img:")) {
    return resolveImage ? resolveImage(src) !== null : false;
  }

  if (
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  ) {
    return true;
  }

  try {
    new URL(src);
    return true;
  } catch {
    return false;
  }
}
