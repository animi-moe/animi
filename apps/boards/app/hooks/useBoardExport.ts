import { BOARD_CONFIG } from "@/hooks/boardConfig";
import { useBoardCells } from "@/hooks/useBoardCells";
import { useBoardDimensions } from "@/hooks/useBoardDimensions";
import { useBoardImages } from "@/hooks/useBoardImages";
import { useBoardStyle } from "@/hooks/useBoardStyle";
import { normalizeCell } from "./utils";

export function useBoardExport(
  boardRef: React.RefObject<HTMLDivElement | null>,
  dimensions: ReturnType<typeof useBoardDimensions>,
  style: ReturnType<typeof useBoardStyle>,
  cellsState: ReturnType<typeof useBoardCells>,
  images: ReturnType<typeof useBoardImages>,
) {
  const { rows, cols, cellWidth, cellHeight } = dimensions;

  function getLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");

    let lines = [];

    let currentLine = "",
      wordWrap = "";

    for (let i = 0; i < words.length; i++) {
      currentLine = words[i];
      wordWrap = "";

      while (ctx.measureText(currentLine).width > maxWidth) {
        while (ctx.measureText(currentLine).width > maxWidth) {
          wordWrap = currentLine.slice(-1) + wordWrap;
          currentLine = currentLine.slice(0, -1);
        }
        lines.push(currentLine);
        currentLine = wordWrap;
        wordWrap = "";
      }

      while (i + 1 < words.length) {
        const nextWord = words[i + 1];
        if (ctx.measureText(currentLine + " " + nextWord).width < maxWidth) {
          currentLine += " " + nextWord;
          ++i;
        } else {
          break;
        }
      }
      lines.push(currentLine);
    }

    return lines;
  }

  async function exportBoard() {
    const usedKeys = new Set(
      cellsState.cells
        .flatMap((cell) => cell?.images || (cell?.image ? [cell.image] : []))
        .filter((img) => img?.startsWith("img:")),
    );

    const saveImages: Record<string, string> = {};

    await Promise.all(
      images
        .getImageEntries()
        .filter(([key]) => usedKeys.has(key)) // only export used images
        .map(
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

    const exportData = JSON.stringify({
      app: "animi",
      fileType: "anime-board",
      version: 1,
      meta: {
        rows,
        cols,
        cellWidth,
        cellHeight,
        style: {
          boardBg: style.boardBg ?? BOARD_CONFIG.style.boardBg,
          boardOutline: style.boardOutline ?? BOARD_CONFIG.style.boardOutline,
          boardLines: style.boardLines ?? BOARD_CONFIG.style.boardLines,
          boardTitleBg: style.boardTitleBg ?? BOARD_CONFIG.style.boardTitleBg,
          titleColor: style.titleColor ?? BOARD_CONFIG.style.titleColor,
          markerColor: style.markerColor ?? BOARD_CONFIG.style.markerColor,
          outerBorder: style.outerBorder ?? BOARD_CONFIG.style.outerBorder,
          gridThickness: style.gridThickness ?? BOARD_CONFIG.style.gridThickness,
          boardRadius: style.boardRadius ?? BOARD_CONFIG.style.boardRadius,
          boardTitle: style.boardTitle ?? BOARD_CONFIG.style.boardTitle,
          showBoardTitle: style.showBoardTitle ?? BOARD_CONFIG.style.showBoardTitle,
          showImages: style.showImages ?? BOARD_CONFIG.style.showImages,
          showNames: style.showNames ?? BOARD_CONFIG.style.showNames,
          showCellID: style.showCellID ?? BOARD_CONFIG.style.showCellID,
          markerType: style.markerType ?? BOARD_CONFIG.style.markerType,
        },
      },
      images: saveImages,
      cells: cellsState.cells,
    });

    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = BOARD_CONFIG.export.defaultFileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetBoard() {
    images.clearImages();
    dimensions.resetDimensions();
    cellsState.setCells(
      Array(rows * cols).fill({
        name: "",
        images: [],
        activeImageIndex: 0,
        showName: true,
        showImage: true,
        marked: false,
      }),
    );
    style.resetStyle();
  }

  async function importBoard(file: File) {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.version !== 1) {
      alert("Unsupported board version.");
      return;
    }

    const { meta, images: importedImages, cells: importedCells } = data;

    images.clearImages();
    for (const [key, base64] of Object.entries(importedImages)) {
      const res = await fetch(base64 as string);
      const blob = await res.blob();
      images.setImage(key, blob);
    }

    dimensions.setRows(meta.rows);
    dimensions.setCols(meta.cols);
    dimensions.setCellWidth(meta.cellWidth);
    dimensions.setCellHeight(meta.cellHeight);

    const normalizedCells = (importedCells || []).map((cell: any) => normalizeCell(cell));
    cellsState.setCells(normalizedCells);

    if (meta.style) {
      style.updateStyle(meta.style);
    }
  }

  async function downloadBoard() {
    if (!boardRef.current) return;

    const gap = style.gridThickness;
    const outerPad = 8; // matches p-2
    const titleGap = style.showBoardTitle ? 8 : 0;
    const radius = Number(style.boardRadius) || 0;

    const gridWidth = cols * cellWidth + (cols - 1) * gap;
    const gridHeight = rows * cellHeight + (rows - 1) * gap;

    const outerRadius = radius > 0 ? radius + 10 : 0; // outer div (border box)
    const innerRadius = radius; // inner overflow-hidden wrapper

    const totalWidth = gridWidth + outerPad * 2 + style.outerBorder * 2;
    const titleH =
      style.showBoardTitle && boardRef.current.children[0]?.children[0]
        ? (boardRef.current.children[0].children[0] as HTMLElement).offsetHeight
        : 0;

    const totalHeight = titleH + gridHeight + outerPad * 2 + style.outerBorder * 2 + titleGap;

    const scale = BOARD_CONFIG.export.canvasScale;
    const canvas = document.createElement("canvas");
    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    ctx.fillStyle = style.boardOutline;
    ctx.beginPath();
    ctx.roundRect(0, 0, totalWidth, totalHeight, outerRadius);
    ctx.fill();

    const midX = style.outerBorder;
    const midY = style.outerBorder;
    const midW = totalWidth - style.outerBorder * 2;
    const midH = totalHeight - style.outerBorder * 2;
    const midRadius = Math.max(0, outerRadius - style.outerBorder);

    ctx.fillStyle = style.boardLines;
    ctx.beginPath();
    ctx.roundRect(midX, midY, midW, midH, midRadius);
    ctx.fill();

    const innerX = midX + outerPad;
    const innerY = midY + outerPad;
    const innerW = midW - outerPad * 2;
    const innerH = midH - outerPad * 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerW, innerH, innerRadius);
    ctx.clip();

    ctx.fillStyle = style.boardLines;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    if (style.showBoardTitle) {
      // Title box background
      const titleX = innerX;
      const titleY = innerY;
      const titleW = gridWidth;
      ctx.fillStyle = style.boardTitleBg;
      ctx.fillRect(titleX, titleY, titleW, titleH);

      // Title text
      await document.fonts.ready;

      ctx.font = "36px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = style.titleColor;
      const titleLines = getLines(ctx, style.boardTitle || "My Anime Board", titleW - 8);
      const lineHeight = 40;
      const totalTextHeight = titleLines.length * lineHeight;
      let currentY = titleY + titleH / 2 - (totalTextHeight - lineHeight) / 2;
      titleLines.forEach((line) => {
        ctx.fillText(line, titleX + titleW / 2, currentY);
        currentY += lineHeight;
      });
    }

    const gridStartX = innerX;
    const gridStartY = innerY + titleH + titleGap;

    const loadImage = async (src: string): Promise<HTMLImageElement> => {
      const resolved = images.resolveImage(src) ?? src;
      let objectUrl = resolved;
      let createdBlobUrl = false;

      if (!resolved.startsWith("data:") && !resolved.startsWith("blob:")) {
        const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || "https://animi-proxy.vercel.app";
        const proxied = `${proxyUrl}/api/proxy?url=${encodeURIComponent(resolved)}`;
        const res = await fetch(proxied);
        if (!res.ok) throw new Error(`Failed to fetch ${resolved}: ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        createdBlobUrl = true;
      }

      try {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = objectUrl;
        });
      } finally {
        if (createdBlobUrl) URL.revokeObjectURL(objectUrl);
      }
    };

    const visibleCells = cellsState.cells.slice(0, rows * cols);
    for (let index = 0; index < visibleCells.length; index++) {
      const cell = visibleCells[index];
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = gridStartX + col * (cellWidth + gap);
      const y = gridStartY + row * (cellHeight + gap);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cellWidth, cellHeight);
      ctx.clip();

      ctx.fillStyle = style.boardBg;
      ctx.fill();

      const activeImg = cell?.images?.[cell.activeImageIndex ?? 0] || cell?.image;

      if (style.showImages && (cell?.showImage ?? true) && activeImg) {
        try {
          const img = await loadImage(activeImg);
          const imgScale = Math.max(cellWidth / img.width, cellHeight / img.height);
          const sw = cellWidth / imgScale;
          const sh = cellHeight / imgScale;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, x, y, cellWidth, cellHeight);
        } catch {}
      }

      ctx.restore();

      if (cell?.marked) {
        ctx.save();

        const strokeColor = style.markerColor || "#ef4444";

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(6, 12 * (cellWidth / 160));
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.rect(x, y, cellWidth, cellHeight);
        ctx.clip();

        const currentMarkerType = style.markerType ?? "heart";

        if (currentMarkerType === "circle") {
          const padding = 8;
          const circleSize = Math.max(0, Math.min(cellWidth, cellHeight) - padding * 2);
          const circleX = x + cellWidth / 2;
          const circleY = y + cellHeight / 2;
          const radius = (circleSize / 2) * (10 / 12);

          ctx.save();
          ctx.beginPath();
          ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);

          ctx.fillStyle = strokeColor || "#ef4444";
          ctx.fill();
          ctx.restore();
        } else if (currentMarkerType === "heart") {
          const padding = 8;
          const heartSize = Math.max(0, Math.min(cellWidth, cellHeight) - padding * 2);
          const heartX = x + (cellWidth - heartSize) / 2;
          const heartY = y + (cellHeight - heartSize) / 2;
          const scale = heartSize / 24;

          ctx.save();
          ctx.translate(heartX, heartY);
          ctx.scale(scale, scale);

          const heartPath = new Path2D(
            "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
          );

          ctx.fillStyle = strokeColor || "#ef4444";
          ctx.strokeStyle = strokeColor || "#ef4444";

          ctx.lineWidth = 1.5;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";

          ctx.fill(heartPath);
          ctx.stroke(heartPath);
          ctx.restore();
        } else {
          const padding = 8;
          const xSize = Math.max(0, Math.min(cellWidth, cellHeight) - padding * 2);
          const xOriginX = x + (cellWidth - xSize) / 2;
          const xOriginY = y + (cellHeight - xSize) / 2;
          const scale = xSize / 100;

          ctx.save();
          ctx.translate(xOriginX, xOriginY);
          ctx.scale(scale, scale);

          ctx.lineWidth = 12;
          ctx.lineCap = "round";
          ctx.strokeStyle = strokeColor || "#ef4444";

          ctx.beginPath();
          // First line: from (10, 10) to (90, 90)
          ctx.moveTo(10, 10);
          ctx.lineTo(90, 90);
          // Second line: from (90, 10) to (10, 90)
          ctx.moveTo(90, 10);
          ctx.lineTo(10, 90);
          ctx.stroke();

          ctx.restore();
        }
        ctx.restore();
      }

      if (style.showCellID !== "off") {
        const label =
          style.showCellID === "number"
            ? String(index + 1)
            : `${Math.floor(index / cols) + 1}-${(index % cols) + 1}`;
        const offset = 6; // top-1.5 / left-1.5
        const padX = 6; // px-1.5
        const padY = 5; // py-0.5
        const fontSize = 20;
        const lineH = Math.round(fontSize * 1.2);

        ctx.save();
        ctx.font = `700 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "left";

        const boxW = ctx.measureText(label).width + padX * 2;
        const boxH = lineH + padY * 2;
        const boxX = x + offset;
        const boxY = y + offset;

        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 4); // rounded = 4px
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "alphabetic";
        const m = ctx.measureText(label);
        const textY =
          boxY + boxH / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
        ctx.fillText(label, boxX + padX, textY);
        ctx.restore();
      }

      if (style.showNames && (cell?.showName ?? true) && cell?.name) {
        const labelPadX = 8;
        const labelPadY = 6;
        const nameLineHeight = 17;
        const labelW = cellWidth - labelPadX * 2;
        const labelX = x + labelPadX;

        ctx.font = `600 15px Inter, sans-serif`;
        const nameLines = getLines(ctx, cell.name, labelW - 8);
        const labelH = nameLines.length * nameLineHeight + labelPadY * 2;
        const labelY = y + cellHeight - labelH - 8;

        const labelRadius = 6;

        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.beginPath();
        ctx.moveTo(labelX + labelRadius, labelY);
        ctx.lineTo(labelX + labelW - labelRadius, labelY);
        ctx.quadraticCurveTo(labelX + labelW, labelY, labelX + labelW, labelY + labelRadius);
        ctx.lineTo(labelX + labelW, labelY + labelH - labelRadius);
        ctx.quadraticCurveTo(
          labelX + labelW,
          labelY + labelH,
          labelX + labelW - labelRadius,
          labelY + labelH,
        );
        ctx.lineTo(labelX + labelRadius, labelY + labelH);
        ctx.quadraticCurveTo(labelX, labelY + labelH, labelX, labelY + labelH - labelRadius);
        ctx.lineTo(labelX, labelY + labelRadius);
        ctx.quadraticCurveTo(labelX, labelY, labelX + labelRadius, labelY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#e5e7eb";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textStartY = labelY + labelPadY + nameLineHeight / 2;
        nameLines.forEach((line, i) => {
          ctx.fillText(line, labelX + labelW / 2, textStartY + i * nameLineHeight);
        });
      }
    }

    ctx.restore(); // restores the inner-wrapper clip

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "anime-board.jpg";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      BOARD_CONFIG.export.jpegQuality,
    );
  }

  return {
    exportBoard,
    importBoard,
    resetBoard,
    downloadBoard,
  };
}
