"use client";
import { X, HelpCircle, Move, MousePointer, Brush } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: "boards" | "puzzles";
}

export function HelpModal({ isOpen, onClose, appName = "boards" }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col gap-4 rounded-3xl bg-primary p-6 text-text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-default pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-brand-cyan" />
            <h2 className="font-fredoka text-lg font-semibold text-brand-cyan">How to Navigate</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-tertiary text-brand-pink transition-colors hover:bg-tertiary-hover hover:text-text-white"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs text-text-muted md:text-sm">
          <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
            <Move className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="font-bold text-text-white">Moving Around / Panning</p>
              <p>
                On PC, hold Space + Left Click, or hold Middle Mouse Button and drag to move around
                the board.
              </p>
            </div>
          </div>

          {appName === "boards" ? (
            <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
              <MousePointer className="mt-0.5 size-5 shrink-0 text-brand-pink" />
              <div>
                <p className="font-bold text-text-white">Editing & Moving Cells</p>
                <p>
                  Click any cell to inspect or edit it in the side panel. Use the{" "}
                  <strong className="text-brand-white">Move (M)</strong> tool to swap cell positions
                  easily.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
              <Brush className="mt-0.5 size-5 shrink-0 text-brand-pink" />
              <div>
                <p className="font-bold text-text-white">Solving Puzzles Together</p>
                <p>
                  Drag puzzle pieces into place. Pieces automatically snap when close to their
                  correct positions or connected groups!
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-full bg-secondary py-2.5 text-xs font-semibold text-brand-cyan transition hover:bg-secondary-hover active:scale-95"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
