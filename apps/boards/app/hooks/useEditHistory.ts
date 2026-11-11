import { useRef } from "react";
import { useBoardCells } from "@/hooks/useBoardCells";
import { BoardCell } from "@/types/board";

type BoardSnapshot = {
  cells: BoardCell[];
};

export function useEditHistory(cellsState: ReturnType<typeof useBoardCells>) {
  const undoStack = useRef<BoardSnapshot[]>([]);
  const redoStack = useRef<BoardSnapshot[]>([]);
  const pendingBefore = useRef<BoardSnapshot | null>(null);

  function getSnapshot(): BoardSnapshot {
    return { cells: structuredClone(cellsState.cells) };
  }

  function applySnapshot(snapshot: BoardSnapshot) {
    cellsState.setCells(snapshot.cells);
  }

  function pushSnapshot(snapshot: BoardSnapshot) {
    undoStack.current.push(snapshot);
    redoStack.current = [];
  }

  function beginAction() {
    if (pendingBefore.current) return;
    pendingBefore.current = getSnapshot();
  }

  function endAction(actualCells?: BoardCell[]) {
    if (!pendingBefore.current) return;
    const before = pendingBefore.current;
    pendingBefore.current = null;
    const afterCells = actualCells ?? cellsState.cells;
    const changed = JSON.stringify(before.cells) !== JSON.stringify(afterCells);
    if (changed) pushSnapshot(before);
  }

  function undo() {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(getSnapshot());
    applySnapshot(prev);
  }

  function redo() {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(getSnapshot());
    applySnapshot(next);
  }

  function undoable() {
    return undoStack.current.length > 0;
  }

  function redoable() {
    return redoStack.current.length > 0;
  }

  return { beginAction, endAction, undo, redo, undoable, redoable };
}
