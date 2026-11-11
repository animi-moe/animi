"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Puzzle = {
  title: string;
  imageUrl: string;
  rows: number;
  cols: number;
  aspect: number;
};

export type SharedPiece = {
  id: number;
  x: number;
  y: number;
  locked: boolean;
  groupId: number;
  zIndex: number;
  heldBy?: string;
};

export type Snapshot = { puzzle: Puzzle; pieces: SharedPiece[]; v: number };

export type ServerMsg =
  | { t: "sync"; pieces: SharedPiece[] }
  | { t: "players"; n: number }
  | {
      t: "snapshot";
      clientId: string;
      name: string;
      puzzle: Puzzle;
      pieces: SharedPiece[];
      v: number;
    }
  | { t: "reset"; puzzle: Puzzle; pieces: SharedPiece[] }
  | { t: "move"; id: number; x: number; y: number; groupId: number }
  | { t: "cursor"; clientId: string; name: string; x: number; y: number }
  | { t: "denied"; id: number }
  | { t: "disconnected" };

const CLOSED_CODE = 4000;
const CLOSED_RETRY_MS = 30_000;

export function usePuzzleRoom(roomId: string) {
  const [count, setCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [ping, setPing] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const listeners = useRef(new Set<(m: ServerMsg) => void>());
  const sentAtRef = useRef(0);
  const versionRef = useRef(0);

  const [isClosed, setIsClosed] = useState(false);

  const latestCursorRef = useRef<{ x: number; y: number; hasMoved: boolean } | null>(null);

  const NAME_KEY = "animi-puzzle-name";

  const readSavedName = () => {
    try {
      return localStorage.getItem(NAME_KEY)?.trim() || "";
    } catch {
      return "";
    }
  };

  const saveName = (name: string) => {
    try {
      const n = name.trim().slice(0, 40);
      if (n) localStorage.setItem(NAME_KEY, n);
    } catch {}
  };

  const [playerName, setPlayerNameState] = useState<string>(() => readSavedName() || "Loading...");

  const setPlayerName = useCallback((name: string) => {
    setPlayerNameState(name);
    saveName(name);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ t: "set_name", name }));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const cursor = latestCursorRef.current;

      if (!cursor || !cursor.hasMoved || wsRef.current?.readyState !== WebSocket.OPEN) {
        return;
      }

      wsRef.current.send(JSON.stringify({ t: "cursor", x: cursor.x, y: cursor.y }));

      cursor.hasMoved = false;
    }, 1000 / 15);

    return () => clearInterval(timer);
  }, []);

  const sendCursor = useCallback((x: number, y: number) => {
    latestCursorRef.current = { x, y, hasMoved: true };
  }, []);

  useEffect(() => {
    let isCleanedUp = false;
    let reconnectTimeout: NodeJS.Timeout;
    let pingInterval: NodeJS.Timeout;
    let backoff = 1000;

    const connect = () => {
      if (isCleanedUp) return;

      const saved = readSavedName();
      const qs = saved ? `?name=${encodeURIComponent(saved)}` : "";

      const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

      const wsUrl = isLocal
        ? `ws://localhost:8787/ws/room/${roomId}${qs}`
        : `${protocol}//${window.location.host}/ws/room/${roomId}${qs}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        backoff = 1000;
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sentAtRef.current = performance.now();
            ws.send("ping");
          }
        }, 5000);
      };

      ws.onmessage = (e) => {
        if (e.data === "pong") {
          setPing(Math.round(performance.now() - sentAtRef.current));
          return;
        }

        let msg: ServerMsg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }

        if (msg.t === "snapshot") {
          setClientId(msg.clientId);

          const savedLocal = readSavedName();
          const activeName = savedLocal || msg.name;

          setPlayerNameState(activeName);
          saveName(activeName);
          setIsClosed(false);

          if (
            savedLocal &&
            savedLocal !== msg.name &&
            wsRef.current?.readyState === WebSocket.OPEN
          ) {
            wsRef.current.send(JSON.stringify({ t: "set_name", name: savedLocal }));
          }

          setSnapshot({
            puzzle: msg.puzzle,
            pieces: msg.pieces,
            v: ++versionRef.current,
          });
        } else if (msg.t === "reset") {
          setSnapshot({
            puzzle: msg.puzzle,
            pieces: msg.pieces,
            v: ++versionRef.current,
          });
        } else if (msg.t === "players") {
          setCount(msg.n);
        } else {
          listeners.current.forEach((fn) => fn(msg));
        }
      };

      ws.onclose = (e) => {
        clearInterval(pingInterval);
        if (wsRef.current === ws) wsRef.current = null;

        setPing(null);
        listeners.current.forEach((fn) => fn({ t: "disconnected" }));

        if (isCleanedUp) return;

        if (e.code === CLOSED_CODE) {
          setIsClosed(true);
          setSnapshot(null);
          setCount(0);
          reconnectTimeout = setTimeout(connect, CLOSED_RETRY_MS + Math.random() * 5000);
          return;
        }

        const jitter = Math.random() * 500;
        const nextBackoff = Math.min(backoff + jitter, 15000);
        reconnectTimeout = setTimeout(connect, nextBackoff);
        backoff = Math.min(backoff * 2, 15000);
      };
    };

    connect();

    return () => {
      isCleanedUp = true;
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [roomId]);

  const send = useCallback((m: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(m));
  }, []);

  const subscribe = useCallback((fn: (m: ServerMsg) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  return {
    count,
    clientId,
    snapshot,
    send,
    subscribe,
    sendCursor,
    ping,
    playerName,
    setPlayerName,
    isClosed,
  };
}
