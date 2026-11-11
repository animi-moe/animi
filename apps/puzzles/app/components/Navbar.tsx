"use client";
import { useState } from "react";
import { Calendar, Users, HelpCircle, ImageIcon } from "lucide-react";
import { HelpModal } from "./HelpModal";
import { colorFor } from "../hooks/utils";

interface NavbarProps {
  puzzleTitle: string;
  onlinePlayers: number;
  ping: number | null;
  playerName: string;
  onNameChange: (newName: string) => void;
  clientId: string | null;
  imageUrl?: string;
}

export function Navbar({
  puzzleTitle,
  onlinePlayers,
  ping,
  playerName,
  onNameChange,
  clientId,
  imageUrl,
}: NavbarProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const playerColor = clientId ? colorFor(clientId) : "#ffffff";

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
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-brand-cyan">
              puzzles
            </span>
          </a>

          <div className="flex items-center gap-2 md:hidden">
            <span
              className={`inline-block min-w-[45px] text-right font-mono ${
                ping == null
                  ? "text-text-muted"
                  : ping < 80
                    ? "text-emerald-400"
                    : ping < 200
                      ? "text-amber-400"
                      : "text-red-400"
              }`}
            >
              {ping == null ? "—" : `${ping}ms`}
            </span>

            <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-text-muted">
              <Users className="size-3.5 text-brand-cyan" />
              <span>{onlinePlayers}</span>
            </div>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center justify-center rounded-full bg-secondary p-2 text-text-muted transition-all hover:bg-secondary-hover hover:text-text-white active:scale-95"
              title="Help / Tutorial"
            >
              <HelpCircle className="size-4 text-brand-cyan" />
            </button>
          </div>
        </div>

        <div className="flex w-full min-w-0 items-center justify-center gap-3 lg:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 md:hidden">
            <span className="text-xs text-text-muted">Name:</span>
            <input
              type="text"
              value={playerName}
              maxLength={40}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-24 rounded bg-tertiary px-2 py-0.5 text-xs text-text-white outline-none focus:ring-1 focus:ring-brand-cyan"
              style={{
                borderBottomWidth: "2px",
                borderBottomStyle: "solid",
                borderBottomColor: playerColor,
              }}
            />
          </div>

          <div className="flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-center text-xs font-semibold text-text-white lg:text-sm">
            <Calendar className="size-4 text-brand-pink" />
            <span className="truncate">{puzzleTitle}</span>

            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 flex items-center gap-1 rounded-full bg-tertiary px-2.5 py-1 text-xs text-brand-cyan transition-colors hover:bg-tertiary-hover"
                title="View source image"
              >
                <ImageIcon className="size-3.5" />
                <span className="hidden md:inline">Source</span>
              </a>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2">
            <span className="text-xs text-text-muted">Name:</span>
            <input
              type="text"
              value={playerName}
              maxLength={40}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-24 rounded bg-tertiary px-2 py-0.5 text-xs text-text-white outline-none focus:ring-1 focus:ring-brand-cyan"
              style={{
                borderBottomWidth: "2px",
                borderBottomStyle: "solid",
                borderBottomColor: playerColor,
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-text-muted">
            <span
              className={`inline-block min-w-[45px] text-right font-mono ${
                ping == null
                  ? "text-text-muted"
                  : ping < 80
                    ? "text-emerald-400"
                    : ping < 200
                      ? "text-amber-400"
                      : "text-red-400"
              }`}
            >
              {ping == null ? "—" : `${ping}ms`}
            </span>
            <Users className="size-4 text-brand-cyan" />
            <span className="whitespace-nowrap">{onlinePlayers} online</span>
          </div>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center justify-center rounded-full bg-secondary p-2.5 text-text-muted transition-all hover:bg-secondary-hover hover:text-text-white active:scale-95"
            title="Help / Tutorial"
          >
            <HelpCircle className="size-4 text-brand-cyan" />
          </button>
        </div>
      </nav>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
