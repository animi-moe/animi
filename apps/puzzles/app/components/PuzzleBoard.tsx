"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import type { ServerMsg, SharedPiece } from "../hooks/usePuzzleRoom";
import { colorFor } from "../hooks/utils";

interface InnerProps {
  imageUrl: string;
  initialPieces: SharedPiece[];
  imageWidth: number;
  imageHeight: number;
  rows: number;
  cols: number;
  send: (m: object) => void;
  sendCursor: (x: number, y: number) => void;
  subscribe: (fn: (m: ServerMsg) => void) => () => void;
  clientId: string | null;
}

interface Piece {
  id: number;
  correctRow: number;
  correctCol: number;
  isLocked: boolean;
  zIndex: number;
  groupId: number;
  heldBy?: string;
}

type Live = { x: number; y: number; tx: number; ty: number };
type Cursor = { x: number; y: number; tx: number; ty: number; name: string; seen: number };

export function PuzzleBoard({
  imageUrl,
  initialPieces,
  imageWidth,
  imageHeight,
  rows,
  cols,
  send,
  sendCursor,
  subscribe,
  clientId,
}: InnerProps) {
  const pieceWidth = imageWidth / cols;
  const pieceHeight = imageHeight / rows;

  const boardRef = useRef<HTMLDivElement>(null);
  const draggingIdRef = useRef<number | null>(null);

  const live = useRef(
    new Map(
      initialPieces.map((p) => {
        const x = p.x * imageWidth;
        const y = p.y * imageWidth;
        return [p.id, { x, y, tx: x, ty: y }];
      }),
    ),
  );
  const localDrag = useRef(new Set<number>());
  const pendingMove = useRef<{ id: number; x: number; y: number } | null>(null);
  const cursors = useRef(new Map<string, Cursor>());
  const cursorEls = useRef(new Map<string, HTMLDivElement>());
  const [cursorIds, setCursorIds] = useState<string[]>([]);
  const piecesStateRef = useRef<Piece[]>([]);
  const piecesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const [cursorNames, setCursorNames] = useState<Map<string, string>>(() => new Map());

  const place = (id: number, l: Live) => {
    const el = piecesRef.current.get(id);
    if (el) el.style.transform = `translate(${l.x}px, ${l.y}px)`;
  };

  const dragOffset = useRef({ x: 0, y: 0 });

  const [isZHeld, setIsZHeld] = useState(false);
  const [isXHeld, setIsXHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key.toLowerCase() === "z") setIsZHeld(true);
      if (e.key.toLowerCase() === "x") setIsXHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "z") setIsZHeld(false);
      if (e.key.toLowerCase() === "x") setIsXHeld(false);
    };
    const onBlur = () => {
      setIsZHeld(false);
      setIsXHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let latestEvent: PointerEvent | null = null;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (activePointersRef.current.size > 1) return;

      latestEvent = e;

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          animationFrameId = null;
          if (!latestEvent) return;
          if (activePointersRef.current.size > 1) return;

          const rect = boardRef.current?.getBoundingClientRect();
          if (rect) {
            const x = (latestEvent.clientX - rect.left) / rect.width;
            const y = (latestEvent.clientY - rect.top) / rect.height;
            sendCursor(x, y);
          }
        });
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [sendCursor]);

  useEffect(() => {
    let raf = 0,
      last = performance.now();
    const tick = (now: number) => {
      const k = 1 - Math.exp(-(now - last) / 60);
      last = now;
      for (const [id, l] of live.current) {
        if (localDrag.current.has(id)) continue;
        const dx = l.tx - l.x,
          dy = l.ty - l.y;
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
          if (dx || dy) {
            l.x = l.tx;
            l.y = l.ty;
            place(id, l);
          }
          continue;
        }
        l.x += dx * k;
        l.y += dy * k;
        place(id, l);
      }
      for (const [id, c] of cursors.current) {
        c.x += (c.tx - c.x) * k;
        c.y += (c.ty - c.y) * k;
        const el = cursorEls.current.get(id);
        if (el) el.style.transform = `translate(${c.x * imageWidth}px, ${c.y * imageHeight}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [imageWidth, imageHeight]);

  const [pieces, setPieces] = useState<Piece[]>(() =>
    initialPieces.map((p) => ({
      id: p.id,
      correctRow: Math.floor(p.id / cols),
      correctCol: p.id % cols,
      isLocked: p.locked,
      zIndex: p.locked ? 0 : 1,
      groupId: p.groupId ?? p.id,
      heldBy: p.heldBy,
    })),
  );

  useEffect(() => {
    piecesStateRef.current = pieces;
  }, [pieces]);

  useEffect(() => {
    const t = setInterval(() => {
      const m = pendingMove.current;
      if (!m) return;
      pendingMove.current = null;
      send({ t: "move", ...m });
    }, 1000 / 15);
    return () => clearInterval(t);
  }, [send]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(".puzzle-piece")) {
        e.stopPropagation();
      }
    };

    el.addEventListener("touchstart", onTouchStart);
    return () => el.removeEventListener("touchstart", onTouchStart);
  }, []);

  const [draggingId, setDraggingId] = useState<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent, piece: Piece) => {
    if (piece.isLocked || e.button !== 0) return;
    if (draggingIdRef.current !== null) return;
    if (piece.heldBy && piece.heldBy !== clientId) return;

    e.stopPropagation();

    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);

    const rect = boardRef.current!.getBoundingClientRect();
    const scale = rect.width / imageWidth;

    const l = live.current.get(piece.id)!;
    dragOffset.current = {
      x: (e.clientX - rect.left) / scale - l.x,
      y: (e.clientY - rect.top) / scale - l.y,
    };

    const group = pieces.filter((p) => p.groupId === piece.groupId && !p.isLocked);
    const ids = new Set(group.map((p) => p.id));
    localDrag.current = ids;

    for (const p of group) {
      const g = live.current.get(p.id);
      if (g) {
        g.tx = g.x;
        g.ty = g.y;
      }
    }

    draggingIdRef.current = piece.id;
    setDraggingId(piece.id);

    const top = Math.max(...pieces.map((p) => p.zIndex)) + 1;
    setPieces((prev) =>
      prev.map((p) => (ids.has(p.id) ? { ...p, zIndex: top, heldBy: clientId ?? undefined } : p)),
    );

    send({ t: "pickup", id: piece.id });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const id = draggingIdRef.current;
    if (id === null) return;

    const lead = live.current.get(id);
    if (!lead) return;

    const rect = boardRef.current!.getBoundingClientRect();
    const scale = rect.width / imageWidth;

    const nx = (e.clientX - rect.left) / scale - dragOffset.current.x;
    const ny = (e.clientY - rect.top) / scale - dragOffset.current.y;
    const dx = nx - lead.x;
    const dy = ny - lead.y;

    for (const gid of localDrag.current) {
      const l = live.current.get(gid);
      if (!l) continue;
      l.x += dx;
      l.y += dy;
      l.tx = l.x;
      l.ty = l.y;
      place(gid, l);
    }

    pendingMove.current = { id, x: nx / imageWidth, y: ny / imageWidth };
  };

  const endDrag = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
    localDrag.current = new Set();
    pendingMove.current = null;
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    const id = draggingIdRef.current;
    if (id === null) return;

    const lead = live.current.get(id);

    if (e && e.currentTarget) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (lead) {
      send({ t: "drop", id, x: lead.x / imageWidth, y: lead.y / imageWidth });
    }

    endDrag();
  };

  const solve = () => {
    for (const p of pieces) {
      const l = live.current.get(p.id);
      if (l) {
        l.x = l.tx = p.correctCol * pieceWidth;
        l.y = l.ty = p.correctRow * pieceHeight;
        place(p.id, l);
      }
    }
    setPieces((prev) => prev.map((p) => ({ ...p, isLocked: true, zIndex: 0 })));
  };

  const halfSolve = () => {
    const unplacedPieces = pieces.filter((p) => !p.isLocked);
    if (unplacedPieces.length === 0) return;

    const halfCount = Math.floor(unplacedPieces.length / 2);
    const toLockIds = new Set<number>();

    // Pick a random anchor piece to form a small connected group
    const randomAnchor = unplacedPieces[Math.floor(Math.random() * unplacedPieces.length)]!;
    const anchorRow = randomAnchor.correctRow;
    const anchorCol = randomAnchor.correctCol;

    const neighbors = [
      { r: anchorRow - 1, c: anchorCol },
      { r: anchorRow + 1, c: anchorCol },
      { r: anchorRow, c: anchorCol - 1 },
      { r: anchorRow, c: anchorCol + 1 },
    ].filter((n) => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols);

    const groupCandidateIds = [randomAnchor.id];
    for (const n of neighbors) {
      const neighborPiece = pieces[n.r * cols + n.c];
      if (neighborPiece && !neighborPiece.isLocked && groupCandidateIds.length < 3) {
        groupCandidateIds.push(neighborPiece.id);
      }
    }

    for (const id of groupCandidateIds) {
      toLockIds.add(id);
    }

    const remainingUnplaced = unplacedPieces.filter((p) => !toLockIds.has(p.id));
    const shuffledRemaining = [...remainingUnplaced].sort(() => Math.random() - 0.5);
    const neededMore = Math.max(0, halfCount - toLockIds.size);

    for (let i = 0; i < Math.min(neededMore, shuffledRemaining.length); i++) {
      toLockIds.add(shuffledRemaining[i]!.id);
    }

    for (const p of pieces) {
      if (toLockIds.has(p.id) || p.isLocked) {
        const l = live.current.get(p.id);
        if (l) {
          l.x = l.tx = p.correctCol * pieceWidth;
          l.y = l.ty = p.correctRow * pieceHeight;
          place(p.id, l);
        }
      }
    }

    setPieces((prev) =>
      prev.map((p) =>
        toLockIds.has(p.id) || p.isLocked ? { ...p, isLocked: true, zIndex: 0 } : p,
      ),
    );
  };

  useEffect(() => {
    const onBlur = () => handlePointerUp();
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const activePointersRef = useRef(new Set<number>());

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      activePointersRef.current.add(e.pointerId);
    };
    const handlePointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    return subscribe((m: ServerMsg) => {
      if (m.t === "cursor") {
        const c = cursors.current.get(m.clientId);
        const nameChanged = !c || c.name !== m.name;

        if (c) {
          c.tx = m.x;
          c.ty = m.y;
          c.name = m.name;
          c.seen = Date.now();
        } else {
          cursors.current.set(m.clientId, {
            x: m.x,
            y: m.y,
            tx: m.x,
            ty: m.y,
            name: m.name,
            seen: Date.now(),
          });
          setCursorIds([...cursors.current.keys()]);
        }

        if (nameChanged) {
          setCursorNames((prev) => new Map(prev).set(m.clientId, m.name));
        }
      } else if (m.t === "move") {
        const lead = live.current.get(m.id);
        if (!lead) return;
        const dx = m.x * imageWidth - lead.tx;
        const dy = m.y * imageWidth - lead.ty;
        for (const p of piecesStateRef.current) {
          if (p.groupId !== m.groupId || p.isLocked) continue;
          const l = live.current.get(p.id);
          if (l) {
            l.tx += dx;
            l.ty += dy;
          }
        }
      } else if (m.t === "sync") {
        for (const u of m.pieces) {
          const l = live.current.get(u.id);
          if (!l || localDrag.current.has(u.id)) continue;
          l.tx = u.x * imageWidth;
          l.ty = u.y * imageWidth;
        }
        const byId = new Map(m.pieces.map((u) => [u.id, u]));
        setPieces((prev) => {
          let changed = false;
          const next = prev.map((p) => {
            const u = byId.get(p.id);
            if (!u) return p;
            const z = u.locked ? 0 : u.zIndex;
            if (
              p.isLocked === u.locked &&
              p.groupId === u.groupId &&
              p.zIndex === z &&
              p.heldBy === u.heldBy
            )
              return p;
            changed = true;
            return {
              ...p,
              isLocked: u.locked,
              groupId: u.groupId,
              zIndex: z,
              heldBy: u.heldBy,
            };
          });
          return changed ? next : prev;
        });
      } else if (m.t === "denied" || m.t === "disconnected") {
        if (draggingIdRef.current !== null) endDrag();
      }
    });
  }, [subscribe, imageWidth]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, c] of cursors.current) {
        if (now - c.seen > 10000) {
          cursors.current.delete(id);
          changed = true;
        }
      }
      if (changed) setCursorIds([...cursors.current.keys()]);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const groupOf = useMemo(() => new Map(pieces.map((p) => [p.id, p.groupId])), [pieces]);

  return (
    <div
      className="box-content border-4 border-quad bg-secondary"
      style={{ width: imageWidth, height: imageHeight }}
    >
      <div ref={boardRef} className="relative" style={{ width: imageWidth, height: imageHeight }}>
        {isXHeld && (
          <div className="pointer-events-none absolute inset-0 z-0">
            {Array.from({ length: rows * cols }).map((_, index) => {
              const r = Math.floor(index / cols);
              const c = index % cols;
              const piece = pieces[r * cols + c];
              if (piece?.isLocked) return null;

              const isEmptyCell = (nr: number, nc: number) => {
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return false;
                const p = pieces[nr * cols + nc];
                return !p?.isLocked;
              };

              const openTop = r === 0 || !isEmptyCell(r - 1, c);
              const openBottom = r === rows - 1 || !isEmptyCell(r + 1, c);
              const openLeft = c === 0 || !isEmptyCell(r, c - 1);
              const openRight = c === cols - 1 || !isEmptyCell(r, c + 1);

              const x = c * pieceWidth;
              const y = r * pieceHeight;

              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${pieceWidth}px`,
                    height: `${pieceHeight}px`,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      borderStyle: "solid",
                      borderColor: "#ef4444",
                      borderWidth: `${openTop ? 2 : 0}px ${openRight ? 2 : 0}px ${openBottom ? 2 : 0}px ${openLeft ? 2 : 0}px`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="absolute inset-0 isolate">
          {pieces.map((piece) => {
            const row = piece.correctRow;
            const col = piece.correctCol;
            const sameGroup = (r: number, c: number) =>
              r >= 0 &&
              r < rows &&
              c >= 0 &&
              c < cols &&
              groupOf.get(r * cols + c) === piece.groupId;

            const isHeld = !!piece.heldBy && !piece.isLocked;
            const mine = piece.heldBy === clientId;

            const isGlow = isZHeld && !piece.isLocked;

            const openTop = !sameGroup(row - 1, col);
            const openBottom = !sameGroup(row + 1, col);
            const openLeft = !sameGroup(row, col - 1);
            const openRight = !sameGroup(row, col + 1);
            const GLOW_PAD = 16;

            const borderColor = isHeld ? (mine ? "#ffffff" : "rgba(255,255,255,0.7)") : "#38bdf8";

            return (
              <div
                ref={(el) => {
                  if (el) {
                    piecesRef.current?.set(piece.id, el);
                    const l = live.current.get(piece.id);
                    if (l) el.style.transform = `translate(${l.x}px, ${l.y}px)`;
                  } else {
                    piecesRef.current?.delete(piece.id);
                  }
                }}
                key={piece.id}
                onPointerDown={(e) => handlePointerDown(e, piece)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handlePointerUp}
                className={`puzzle-piece absolute cursor-grab touch-none select-none active:cursor-grabbing ${
                  piece.isLocked ? "pointer-events-none" : ""
                } ${piece.heldBy && !mine ? "cursor-not-allowed" : ""}`}
                style={{
                  width: `${pieceWidth}px`,
                  height: `${pieceHeight}px`,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundPosition: `-${piece.correctCol * pieceWidth}px -${piece.correctRow * pieceHeight}px`,
                  backgroundSize: `${imageWidth}px ${imageHeight}px`,
                  zIndex: piece.zIndex,
                  willChange: draggingId === piece.id ? "transform" : "auto",
                }}
              >
                {(isHeld || isGlow) && (
                  <>
                    {isHeld && (
                      <div
                        className="pointer-events-none absolute"
                        style={{
                          top: openTop ? -2 : -GLOW_PAD,
                          right: openRight ? -2 : -GLOW_PAD,
                          bottom: openBottom ? -2 : -GLOW_PAD,
                          left: openLeft ? -2 : -GLOW_PAD,
                          boxShadow: `0 0 12px 2px ${
                            mine ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)"
                          }`,
                          clipPath: `inset(${openTop ? -24 : GLOW_PAD}px ${openRight ? -24 : GLOW_PAD}px ${
                            openBottom ? -24 : GLOW_PAD
                          }px ${openLeft ? -24 : GLOW_PAD}px)`,
                        }}
                      />
                    )}

                    <div
                      className="pointer-events-none absolute"
                      style={{
                        top: openTop ? -2 : 0,
                        right: openRight ? -2 : 0,
                        bottom: openBottom ? -2 : 0,
                        left: openLeft ? -2 : 0,
                        borderStyle: "solid",
                        borderColor: borderColor,
                        borderWidth: `${openTop ? 2 : 0}px ${openRight ? 2 : 0}px ${openBottom ? 2 : 0}px ${
                          openLeft ? 2 : 0
                        }px`,
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {cursorIds.map((id) => {
          const color = colorFor(id);

          return (
            <div
              key={id}
              ref={(el) => {
                if (el) {
                  cursorEls.current.set(id, el);
                  const c = cursors.current.get(id);
                  if (c)
                    el.style.transform = `translate(${c.x * imageWidth}px, ${c.y * imageHeight}px)`;
                } else {
                  cursorEls.current.delete(id);
                }
              }}
              className="pointer-events-none absolute top-0 left-0 z-50"
              style={{ willChange: "transform" }}
            >
              <svg
                className="h-5 w-5 -translate-x-[2px] -translate-y-[2px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                viewBox="0 0 24 24"
                fill={color}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .65-.54.33-.85L6.35 2.85c-.32-.32-.85-.1-.85.36z" />
              </svg>

              <div
                className="absolute top-4 left-4 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap"
                style={{
                  backgroundColor: `${color}`,
                  color: "#000000",
                }}
              >
                {cursorNames.get(id) || "Player"}
              </div>
            </div>
          );
        })}

        {process.env.NODE_ENV === "development" && (
          <div className="absolute -top-10 left-0 flex gap-2">
            <button
              onClick={solve}
              className="rounded-2xl bg-secondary px-2 hover:bg-secondary-hover"
            >
              Solve
            </button>
            <button
              onClick={halfSolve}
              className="rounded-2xl bg-secondary px-2 hover:bg-secondary-hover"
            >
              Half Solve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
