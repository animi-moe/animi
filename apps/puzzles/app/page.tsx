"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { Navbar } from "./components/Navbar";
import { PuzzleLoader } from "./components/PuzzleLoader";
import { usePuzzleRoom } from "./hooks/usePuzzleRoom";

export default function Home() {
  const transformWrapperRef = useRef<ReactZoomPanPinchRef>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [randomGif] = useState<string>(() => {
    const closedGifs = [
      "https://static2.klipy.com/ii/4e7bea9f7a3371424e6c16ebc93252fe/e6/2c/8W4j7L7zENQG3WF2.gif",
      "https://static2.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/c7/30/mX43MXir.gif",
      "https://static2.klipy.com/ii/ce286d05b8e1a47cd4f32b0e1b6dec0e/85/ff/yT93lnJK.gif",
      "https://static2.klipy.com/ii/4493325008d34b7bf8cd6813cd5c1619/89/a1/R0BspECJNtgRwGmZSqf.gif",
    ];
    return closedGifs[Math.floor(Math.random() * closedGifs.length)] || closedGifs[0]!;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const roomId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/room/")[1] || "default"
      : "default";
  const {
    count: onlinePlayers,
    clientId,
    snapshot,
    send,
    sendCursor,
    subscribe,
    ping,
    playerName,
    setPlayerName,
    isClosed,
  } = usePuzzleRoom(roomId);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isMobile = useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    () => window.innerWidth < 768,
    () => false,
  );

  const initialScale = isMobile ? 0.4 : 0.6;

  if (!isMounted) {
    return <main className="h-screen w-screen bg-base" />;
  }

  if (isClosed) {
    return (
      <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-base text-text-white">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-secondary p-8 text-center shadow-2xl">
          <img
            src={randomGif}
            alt="Closed Animation"
            className="h-auto max-h-[12rem] w-auto max-w-[12rem] rounded-xl object-contain shadow-md"
          />
          <h1 className="font-fredoka text-3xl font-extrabold text-brand-pink">
            Puzzles is Closed
          </h1>
          <p className="text-sm font-medium text-text-muted">Sorry!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-base">
      <Navbar
        puzzleTitle={snapshot?.puzzle.title ?? "Loading..."}
        onlinePlayers={onlinePlayers}
        ping={ping}
        playerName={playerName}
        onNameChange={setPlayerName}
        clientId={clientId}
        imageUrl={snapshot?.puzzle.imageUrl}
      />

      <main className="relative flex h-full w-full flex-col pt-14">
        <TransformWrapper
          ref={transformWrapperRef}
          initialScale={initialScale}
          minScale={0.2}
          maxScale={2}
          centerOnInit={true}
          limitToBounds={false}
          smooth={false}
          wheel={{ step: 0.07 }}
          doubleClick={{ disabled: true }}
          zoomAnimation={{ disabled: false, size: 0.1, animationTime: 200 }}
          panning={{
            disabled: false,
            allowLeftClickPan: isSpacePressed,
            allowMiddleClickPan: true,
            allowRightClickPan: false,
            velocityDisabled: true,
            excluded: ["input", "button", "select", "textarea"],
          }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full !bg-primary/50"
            contentClass="flex items-center justify-center"
          >
            <PuzzleLoader
              snapshot={snapshot}
              clientId={clientId}
              send={send}
              sendCursor={sendCursor}
              subscribe={subscribe}
              onReady={() =>
                requestAnimationFrame(() =>
                  transformWrapperRef.current?.centerView(initialScale, 0),
                )
              }
            />
          </TransformComponent>
        </TransformWrapper>
      </main>
    </div>
  );
}
