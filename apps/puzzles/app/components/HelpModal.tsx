"use client";
import { X, HelpCircle, Move, Puzzle, Siren } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[50vh] w-full max-w-md flex-col gap-4 overflow-hidden rounded-3xl bg-primary p-6 text-text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-default pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-brand-cyan" />
            <h2 className="font-fredoka text-lg font-semibold text-brand-cyan">
              How to Play Puzzles
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-tertiary text-brand-pink transition-colors hover:bg-tertiary-hover hover:text-text-white"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="custom-scrollbar flex flex-col gap-3 overflow-y-auto text-xs text-text-muted md:text-sm">
          <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
            <Move className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="font-bold text-text-white">Panning & Zooming</p>
              <p>
                Hold Space + Left Click, or hold Middle Mouse Button and drag to move around the
                board. On mobile, pan on empty space or with 2 fingers, and move a piece with 1
                finger.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
            <Puzzle className="mt-0.5 size-5 shrink-0 text-brand-pink" />
            <div>
              <p className="font-bold text-text-white">Solving Together</p>
              <p>
                Drag puzzle pieces into position. Pieces automatically lock and snap when placed
                close to their correct spots
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
            <Siren className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="font-bold text-text-white">Highlighting Pieces</p>
              <p>Hold the Z key to make all unplaced puzzle pieces glow to help find them</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
            <Siren className="mt-0.5 size-5 shrink-0 text-brand-pink" />
            <div>
              <p className="font-bold text-text-white">Highlighting Empty Board Spaces</p>
              <p>Hold the X key to outline all unfilled parts of the puzzle board in red</p>
            </div>
          </div>
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
