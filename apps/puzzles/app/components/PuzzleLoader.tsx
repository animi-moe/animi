"use client";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { PuzzleBoard } from "./PuzzleBoard";
import type { ServerMsg, Snapshot } from "../hooks/usePuzzleRoom";

interface PuzzleBoardProps {
  snapshot: Snapshot | null;
  clientId: string | null;
  send: (m: object) => void;
  subscribe: (fn: (m: ServerMsg) => void) => () => void;
  sendCursor: (x: number, y: number) => void;
  onReady?: () => void;
}

function useImageSize(url: string) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [url]);

  return size;
}

export function PuzzleLoader({
  snapshot,
  clientId,
  send,
  sendCursor,
  subscribe,
  onReady,
}: PuzzleBoardProps) {
  const size = useImageSize(snapshot?.puzzle.imageUrl ?? "");

  useEffect(() => {
    if (size) onReady?.();
  }, [size]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!size || !snapshot) {
    return (
      <div className="flex h-125 w-222.5 items-center justify-center gap-2 text-text-muted">
        <LoaderCircle className="size-8 animate-spin text-brand-cyan" />
        <span className="text-sm font-medium">Loading today&apos;s anime frame...</span>
      </div>
    );
  }

  const { imageUrl, rows, cols } = snapshot.puzzle;

  const maxW = 1400;
  const maxH = 900;
  const fit = Math.min(maxW / size.w, maxH / size.h);
  const boardWidth = Math.round(size.w * fit);
  const boardHeight = Math.round(size.h * fit);

  return (
    <PuzzleBoard
      key={`${imageUrl}:${snapshot.v}`}
      imageUrl={imageUrl}
      initialPieces={snapshot.pieces}
      imageWidth={boardWidth}
      imageHeight={boardHeight}
      rows={rows}
      cols={cols}
      send={send}
      sendCursor={sendCursor}
      clientId={clientId}
      subscribe={subscribe}
    />
  );
}
