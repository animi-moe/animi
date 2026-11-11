"use client";
import { useAnimeBoard } from "./hooks/useAnimeBoard";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { SelectedBrush } from "./panels/SelectedBrush";
import { Navbar } from "./components/Navbar";
import { LeftPanel } from "./panels/LeftPanel";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { RightPanel } from "./panels/RightPanel";
import { SettingsPanel } from "./panels/SettingsPanel";

const Board = dynamic(() => import("./components/Board").then((mod) => mod.Board), { ssr: false });

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

// Make a proxy or empty object so wallet injection scripts don't throw TypeErrors
if (typeof window !== "undefined") {
  if (typeof window.ethereum === "undefined") {
    Object.defineProperty(window, "ethereum", {
      value: {},
      writable: true,
      configurable: true,
    });
  }
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [initialScale, setInitialScale] = useState<number>(0.6);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const transformWrapperRef = useRef<ReactZoomPanPinchRef>(null);
  const board = useAnimeBoard();

  const resetView = (animationTime = 200) => {
    const ref = transformWrapperRef.current;
    if (!ref) return;

    const isMobile = window.innerWidth < 768;
    const scale = isMobile ? 0.4 : 0.6;
    const customX = isMobile ? 0 : 0;
    const customY = isMobile ? 50 : 0;

    const wrapper = ref.instance.wrapperComponent;
    const content = ref.instance.contentComponent;

    if (!wrapper || !content) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const contentWidth = content.offsetWidth;
    const contentHeight = content.offsetHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const centeredX = (wrapperRect.width - contentWidth * scale) / 2;
    const centeredY = (wrapperRect.height - contentHeight * scale) / 2;

    ref.setTransform(centeredX + customX, centeredY + customY, scale, animationTime);
  };

  useEffect(() => {
    setIsMounted(true);
    const isMobile = window.innerWidth < 768;
    setInitialScale(isMobile ? 0.4 : 0.6);
  }, []);

  useEffect(() => {
    const handleZoomKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          transformWrapperRef.current?.zoomIn(0.1);
        }
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          transformWrapperRef.current?.zoomOut(0.1);
        }
        if (e.key === "0" || e.key === ")" || e.code === "Digit0") {
          e.preventDefault();
          resetView();
        }
      }
    };

    window.addEventListener("keydown", handleZoomKeys);
    return () => window.removeEventListener("keydown", handleZoomKeys);
  }, []);

  if (!isMounted) {
    return <main className="h-screen w-screen bg-base" />;
  }

  return (
    <div className="relative">
      <main
        className={`relative h-screen w-screen overflow-hidden bg-base ${
          board.input.pressedKeys?.[" "] ? "cursor-grab active:cursor-grabbing" : "cursor-auto"
        }`}
      >
        <LeftPanel
          dimensions={board.dimensions}
          style={board.style}
          input={board.input}
          anilist={board.anilist}
          boardExport={board.boardExport}
          cellsState={board.cellsState}
        />

        <Navbar
          style={board.style}
          boardExport={board.boardExport}
          history={board.history}
          onOpenSettings={() => setIsSettingsOpen((prev) => !prev)}
        />

        {board.input.selectedCellIndex !== null && (
          <RightPanel
            cellsState={board.cellsState}
            images={board.images}
            input={board.input}
            history={board.history}
          />
        )}

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          style={board.style}
          dimensions={board.dimensions}
          boardExport={board.boardExport}
          boardCells={board.cellsState}
          history={board.history}
          anilist={board.anilist}
        />

        <TransformWrapper
          ref={transformWrapperRef}
          zoomAnimation={{ disabled: true }}
          panning={{
            disabled: false,
            allowLeftClickPan: board.input.pressedKeys?.[" "] ?? false,
            allowMiddleClickPan: true,
            allowRightClickPan: false,
            excluded: ["input", "button", "select", "textarea"],
            velocityDisabled: true,
          }}
          onWheelStart={() => {}}
          initialScale={initialScale}
          centerOnInit={false}
          onInit={(ref) => {
            const tryCenter = (attemptsLeft: number) => {
              const wrapper = ref.instance.wrapperComponent;
              const content = ref.instance.contentComponent;

              if (!wrapper || !content || content.offsetWidth === 0 || content.offsetHeight === 0) {
                if (attemptsLeft > 0) requestAnimationFrame(() => tryCenter(attemptsLeft - 1));
                return;
              }

              resetView(0);
            };

            requestAnimationFrame(() => tryCenter(60));
          }}
          minScale={0.1}
          maxScale={3}
          limitToBounds={false}
          smooth={false}
          wheel={{ step: board.input.pressedKeys?.["shift"] ? 0.02 : 0.05 }}
          doubleClick={{
            disabled: true,
          }}
        >
          <TransformComponent wrapperClass="!w-screen !h-screen !bg-primary/50">
            <Board
              boardRef={board.boardRef}
              dimensions={board.dimensions}
              style={board.style}
              input={board.input}
              images={board.images}
              cellsState={board.cellsState}
            />
          </TransformComponent>
        </TransformWrapper>

        <SelectedBrush input={board.input} images={board.images} />
      </main>
    </div>
  );
}
