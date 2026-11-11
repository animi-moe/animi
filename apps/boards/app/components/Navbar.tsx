"use client";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileDown,
  FileUp,
  HelpCircle,
  Image,
  ImageDown,
  Redo,
  Settings,
  Type,
  Undo,
  Upload,
} from "lucide-react";
import type { useBoardStyle } from "@/hooks/useBoardStyle";
import type { useBoardExport } from "@/hooks/useBoardExport";
import type { useEditHistory } from "@/hooks/useEditHistory";
import { HelpModal } from "./HelpModal";

interface NavbarProps {
  style: ReturnType<typeof useBoardStyle>;
  boardExport: ReturnType<typeof useBoardExport>;
  history: ReturnType<typeof useEditHistory>;
  onOpenSettings: () => void;
}

export function Navbar({ style, boardExport, history, onOpenSettings }: NavbarProps) {
  const { boardTitle, setBoardTitle, showNames, setShowNames, showImages, setShowImages } = style;
  const { exportBoard, importBoard, downloadBoard } = boardExport;
  const { undo, redo, undoable, redoable } = history;

  const importInputRef = useRef<HTMLInputElement>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <nav
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed top-0 right-0 left-0 z-50 flex flex-col gap-2 bg-primary px-4 py-2 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-8"
      >
        <div className="flex items-center justify-between lg:w-auto">
          <a
            href="https://animi.moe"
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
          >
            <h1 className="animate-gradient-x bg-linear-to-r from-brand-cyan via-brand-white to-brand-pink bg-clip-text font-fredoka text-2xl font-extrabold text-transparent">
              animi.moe
            </h1>
          </a>

          <div className="flex gap-2 md:hidden">
            <button
              onClick={undo}
              disabled={!undoable()}
              className="flex aspect-square w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary-hover active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={!redoable()}
              className="flex aspect-square w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary-hover active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex items-center gap-1 rounded-2xl bg-secondary px-2 py-2 text-sm font-medium text-text-muted transition-all hover:bg-secondary-hover active:scale-95"
            >
              <FileUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => exportBoard()}
              className="flex items-center gap-1 rounded-2xl bg-secondary px-2 py-2 text-sm font-medium text-text-muted transition-all hover:bg-secondary-hover active:scale-95"
            >
              <FileDown className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadBoard();
                (e.target as HTMLButtonElement).blur();
              }}
              className="flex items-center gap-1 rounded-2xl bg-secondary px-2 py-2 text-sm font-medium text-brand-cyan transition-all hover:bg-secondary-hover active:scale-95 active:border-brand-cyan/80"
            >
              <ImageDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex w-full min-w-0 items-center justify-center gap-3 lg:w-auto">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex aspect-square items-center justify-center rounded-2xl bg-secondary p-2 text-text-muted transition-all hover:bg-secondary-hover hover:text-text-white active:scale-95"
            title="Help / Tutorial"
          >
            <HelpCircle className="h-4 w-4 text-brand-cyan" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="flex h-8 items-center gap-2 rounded-full bg-tertiary px-4 text-xs font-bold text-text-muted transition hover:bg-tertiary-hover hover:text-text-white active:scale-95"
            title="Toggle Settings"
          >
            <Settings className="h-4 w-4 text-brand-cyan" />
            <span className="hidden lg:inline">Settings</span>
          </button>

          <textarea
            placeholder="Title..."
            value={boardTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            onChange={(e) => setBoardTitle(e.target.value)}
            className="pointer-events-auto h-10 w-64 min-w-0 resize-none overflow-hidden rounded-full border-2 border-border-default bg-secondary px-4 pt-2 text-center text-text-white transition-all outline-none focus:border-brand-cyan/75 lg:w-64"
          />

          <div className="hidden gap-2 md:flex">
            <button
              onClick={undo}
              disabled={!undoable()}
              className="flex aspect-square w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary-hover active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={!redoable()}
              className="flex aspect-square w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary-hover active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={importInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importBoard(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1 rounded-2xl bg-secondary px-2 py-2 text-sm font-medium tracking-wide text-text-muted transition-all hover:bg-secondary-hover active:scale-95 lg:px-4"
          >
            <FileUp className="h-4 w-4" />
            <span className="hidden lg:inline">Import</span>
          </button>
          <button
            onClick={() => exportBoard()}
            className="flex aspect-square items-center gap-1 rounded-2xl bg-secondary p-2 text-sm font-medium tracking-wide text-text-muted transition-all hover:bg-secondary-hover active:scale-95 lg:aspect-auto lg:px-4"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden lg:inline">Export</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadBoard();
              (e.target as HTMLButtonElement).blur();
            }}
            className="flex aspect-square items-center gap-1 rounded-2xl bg-secondary p-2 text-sm font-medium text-brand-cyan transition-all hover:bg-secondary-hover active:scale-95 active:border-brand-cyan/80 lg:aspect-auto lg:px-4"
          >
            <ImageDown className="h-4 w-4" />
            <span className="hidden lg:inline">Download</span>
          </button>
        </div>
      </nav>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} appName="boards" />
    </>
  );
}
