import { useState } from "react";
import { BOARD_CONFIG } from "@/hooks/boardConfig";

export function useBoardStyle() {
  const [style, setStyle] = useState(BOARD_CONFIG.style);

  const updateStyle = (fields: Partial<typeof BOARD_CONFIG.style>) => {
    setStyle((prev) => ({ ...prev, ...fields }));
  };

  const resetStyle = () => setStyle(BOARD_CONFIG.style);

  return {
    style,
    updateStyle,
    resetStyle,
    ...style,
    setBoardBg: (val: string) => updateStyle({ boardBg: val }),
    setBoardOutline: (val: string) => updateStyle({ boardOutline: val }),
    setBoardTitleBg: (val: string) => updateStyle({ boardTitleBg: val }),
    setBoardLines: (val: string) => updateStyle({ boardLines: val }),
    setTitleColor: (val: string) => updateStyle({ titleColor: val }),
    setMarkerColor: (val: string) => updateStyle({ markerColor: val }),

    setOuterBorder: (val: number) => updateStyle({ outerBorder: val }),
    setGridThickness: (val: number) => updateStyle({ gridThickness: val }),
    setBoardRadius: (val: number) => updateStyle({ boardRadius: val }),
    setBoardTitle: (val: string) => updateStyle({ boardTitle: val }),
    setShowImages: (val: boolean) => updateStyle({ showImages: val }),
    setShowNames: (val: boolean) => updateStyle({ showNames: val }),
    setShowCellID: (val: string) => updateStyle({ showCellID: val }),
    setShowBoardTitle: (val: boolean) => updateStyle({ showBoardTitle: val }),
    setMarkerType: (val: string) => updateStyle({ markerType: val }),
  };
}
