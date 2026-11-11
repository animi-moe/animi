import { DurableObject } from "cloudflare:workers";
import { uniqueNamesGenerator, animals, colors } from "unique-names-generator";

type Puzzle = { title: string; imageUrl: string; rows: number; cols: number; aspect: number };
type SharedPiece = {
  id: number;
  x: number;
  y: number;
  locked: boolean;
  groupId: number;
  zIndex: number;
  heldBy?: string;
};

type Attachment = {
  clientId: string;
  name: string;
  holding: number | null;
  holdAt: number;
};

const HOLD_TTL = 30_000;
const CLOSED_CODE = 4000;

function getPngDimensions(view: DataView): { width: number; height: number } | null {
  if (
    view.byteLength >= 24 &&
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a
  ) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  return null;
}

function getJpegDimensions(view: DataView): { width: number; height: number } | null {
  if (view.byteLength < 2 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset < view.byteLength - 8) {
    const marker = view.getUint16(offset);

    if (
      marker >= 0xffc0 &&
      marker <= 0xffcf &&
      marker !== 0xffc4 &&
      marker !== 0xffc8 &&
      marker !== 0xffcc
    ) {
      if (offset + 9 > view.byteLength) return null;
      const height = view.getUint16(offset + 5);
      const width = view.getUint16(offset + 7);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    const length = view.getUint16(offset + 2);
    if (length < 2 || offset + 2 + length > view.byteLength) {
      offset += 1;
      while (offset < view.byteLength - 1 && view.getUint8(offset) !== 0xff) {
        offset++;
      }
      continue;
    }
    offset += 2 + length;
  }
  return null;
}

function getWebpDimensions(view: DataView): { width: number; height: number } | null {
  // Check RIFF header ('RIFF' at 0, 'WEBP' at 8)
  if (
    view.byteLength >= 30 &&
    view.getUint32(0) === 0x52494646 && // 'RIFF'
    view.getUint32(8) === 0x57454250 // 'WEBP'
  ) {
    const chunkHeader = view.getUint32(12);
    // VP8X chunk (extended format)
    if (chunkHeader === 0x56503858 && view.byteLength >= 30) {
      const width = view.getUint32(24, true) & 0xffffff;
      const height = view.getUint32(27, true) & 0xffffff;
      return { width: width + 1, height: height + 1 };
    }
    // VP8_ (lossy format)
    if (chunkHeader === 0x56503820 && view.byteLength >= 30) {
      const width = view.getUint16(26, true) & 0x3fff;
      const height = view.getUint16(28, true) & 0x3fff;
      return { width, height };
    }
    // VP8L (lossless format)
    if (chunkHeader === 0x5650384c && view.byteLength >= 25) {
      const b = view.getUint32(21, true);
      const width = (b & 0x3fff) + 1;
      const height = ((b >> 14) & 0x3fff) + 1;
      return { width, height };
    }
  }
  return null;
}

function generateRandomName(): string {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: " ",
    length: 2,
    style: "capital",
  });
}

function scatter(p: Puzzle): SharedPiece[] {
  const boardH = 1 / p.aspect;
  const pieceW = 1 / p.cols;
  const pieceH = boardH / p.rows;
  const pieces: SharedPiece[] = [];

  const totalPieces = p.rows * p.cols;

  for (let id = 0; id < totalPieces; id++) {
    let x = 0;
    let y = 0;

    const side = id % 4;

    if (side === 0) {
      x = Math.random() * (1 - pieceW);
      y = -pieceH - 0.05 - Math.random() * 0.1;
    } else if (side === 1) {
      x = 1.05 + Math.random() * 0.15;
      y = Math.random() * (boardH - pieceH);
    } else if (side === 2) {
      x = Math.random() * (1 - pieceW);
      y = boardH + 0.05 + Math.random() * 0.1;
    } else {
      x = -pieceW - 0.05 - Math.random() * 0.15;
      y = Math.random() * (boardH - pieceH);
    }

    pieces.push({ id, x, y, locked: false, groupId: id, zIndex: 1 });
  }
  return pieces;
}

export interface Env {
  ROOM: DurableObjectNamespace<Room>;
  ADMIN_KEY: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/admin/")) {
      const authHeader = request.headers.get("X-Admin-Key");
      if (!authHeader || authHeader !== env.ADMIN_KEY) {
        return new Response("Unauthorized", { status: 401 });
      }

      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      try {
        const body: any = await request.json();
        const roomId = body.roomId || "default";
        const stub = env.ROOM.get(env.ROOM.idFromName(roomId));

        if (url.pathname === "/api/admin/update-puzzle") {
          return await stub.fetch(
            new Request("https://internal/api/admin/update-puzzle", {
              method: "POST",
              body: JSON.stringify(body),
            }),
          );
        }

        if (url.pathname === "/api/admin/set-closed") {
          if (typeof body.closed !== "boolean") {
            return new Response("closed must be true or false", { status: 400 });
          }
          return await stub.fetch(
            new Request("https://internal/api/admin/set-closed", {
              method: "POST",
              body: JSON.stringify({ closed: body.closed }),
            }),
          );
        }

        return new Response("Not found", { status: 404 });
      } catch (err) {
        return new Response("Bad Request", { status: 400 });
      }
    }

    const match = url.pathname.match(/^\/ws\/room\/([\w-]+)$/);
    if (!match) return new Response("Not found", { status: 404 });

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    const stub = env.ROOM.get(env.ROOM.idFromName(match[1]));
    return stub.fetch(request);
  },
};

export class Room extends DurableObject<Env> {
  private puzzle: Puzzle | null = null;
  private pieces: SharedPiece[] = [];
  private zIndexCounter = 1;
  private closed = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    ctx.blockConcurrencyWhile(async () => {
      const saved = await ctx.storage.get<{ puzzle: Puzzle; pieces: SharedPiece[] }>("state");
      this.closed = (await ctx.storage.get<boolean>("closed")) === true;
      if (saved) {
        this.puzzle = saved.puzzle;
        this.pieces = saved.pieces;
        for (const p of this.pieces) delete p.heldBy;
      } else {
        this.puzzle = null;
        this.pieces = [];
      }
      await this.persist();

      this.zIndexCounter = Math.max(...this.pieces.map((p) => p.zIndex), 1);
    });
  }

  private att(ws: WebSocket): Attachment | null {
    const a = ws.deserializeAttachment() as Attachment | null;
    return a?.clientId ? a : null;
  }

  private setAtt(ws: WebSocket, patch: Partial<Attachment>) {
    const a = this.att(ws);
    if (!a) return;
    ws.serializeAttachment({ ...a, ...patch });
  }

  private broadcast(msg: string, except?: WebSocket) {
    for (const s of this.ctx.getWebSockets()) {
      if (s === except) continue;
      try {
        s.send(msg);
      } catch {}
    }
  }

  private broadcastCount(leaving?: WebSocket) {
    this.broadcast(
      JSON.stringify({
        t: "players",
        n: this.ctx.getWebSockets().filter((s) => s !== leaving && this.att(s)).length,
      }),
      leaving,
    );
  }

  private async persist() {
    await this.ctx.storage.put("state", { puzzle: this.puzzle, pieces: this.pieces });
  }

  private holders(except?: WebSocket): Map<number, string> {
    const now = Date.now();
    const m = new Map<number, string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      const a = this.att(ws);
      if (!a || a.holding == null || now - a.holdAt > HOLD_TTL) continue;
      const p = this.pieces[a.holding];
      if (p && !p.locked) m.set(p.groupId, a.clientId);
    }
    return m;
  }

  private view(except?: WebSocket): SharedPiece[] {
    const held = this.holders(except);
    return this.pieces.map((p) => ({
      ...p,
      heldBy: p.locked ? undefined : held.get(p.groupId),
    }));
  }

  private viewGroups(groupIds: Iterable<number>, except?: WebSocket): SharedPiece[] {
    const gids = new Set(groupIds);
    const held = this.holders(except);
    const out: SharedPiece[] = [];
    for (const p of this.pieces) {
      if (gids.has(p.groupId)) {
        out.push({ ...p, heldBy: p.locked ? undefined : held.get(p.groupId) });
      }
    }
    return out;
  }

  private placeGroup(piece: SharedPiece, x: number, y: number) {
    if (!this.puzzle) return { groupPieces: [], ax: x, ay: y, pieceW: 0, pieceH: 0 };

    const { rows, cols, aspect } = this.puzzle;
    const boardH = 1 / aspect;
    const pieceW = 1 / cols;
    const pieceH = boardH / rows;

    const marginX = pieceW * 20;
    const marginY = pieceH * 20;

    const row = Math.floor(piece.id / cols);
    const col = piece.id % cols;

    const groupPieces = this.pieces.filter((p) => p.groupId === piece.groupId && !p.locked);

    const rel = groupPieces.map((p) => ({
      p,
      ox: ((p.id % cols) - col) * pieceW,
      oy: (Math.floor(p.id / cols) - row) * pieceH,
    }));

    const minOx = Math.min(...rel.map((r) => r.ox));
    const maxOx = Math.max(...rel.map((r) => r.ox)) + pieceW;
    const minOy = Math.min(...rel.map((r) => r.oy));
    const maxOy = Math.max(...rel.map((r) => r.oy)) + pieceH;

    const loX = -marginX - minOx;
    const hiX = 1 + marginX - maxOx;
    const loY = -marginY - minOy;
    const hiY = boardH + marginY - maxOy;

    const ax = loX > hiX ? (loX + hiX) / 2 : Math.min(Math.max(x, loX), hiX);
    const ay = loY > hiY ? (loY + hiY) / 2 : Math.min(Math.max(y, loY), hiY);

    for (const r of rel) {
      r.p.x = ax + r.ox;
      r.p.y = ay + r.oy;
    }

    return { groupPieces, ax, ay, pieceW, pieceH };
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.includes("/api/admin/update-puzzle")) {
      try {
        const newPuzzle = (await request.json()) as any;
        await this.handleAdminNewPuzzle(newPuzzle);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      } catch (err: any) {
        return new Response(err.message || "Failed to update puzzle", { status: 400 });
      }
    }

    if (url.pathname.includes("/api/admin/set-closed")) {
      try {
        const { closed } = (await request.json()) as { closed: boolean };
        await this.handleAdminSetClosed(closed === true);
        return new Response(JSON.stringify({ success: true, closed: this.closed }), {
          status: 200,
        });
      } catch (err: any) {
        return new Response(err.message || "Failed to set closed state", { status: 400 });
      }
    }

    if (this.closed) {
      const closedPair = new WebSocketPair();
      const [closedClient, closedServer] = Object.values(closedPair);
      this.ctx.acceptWebSocket(closedServer);
      closedServer.close(CLOSED_CODE, "closed");
      return new Response(null, { status: 101, webSocket: closedClient });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);

    const requested = (url.searchParams.get("name") ?? "")
      .replace(/[\u0000-\u001f]/g, "")
      .trim()
      .slice(0, 40);

    let assignedName = requested;
    if (!assignedName) {
      const existingNames = new Set(this.ctx.getWebSockets().map((s) => this.att(s)?.name));
      assignedName = generateRandomName();
      while (existingNames.has(assignedName)) {
        assignedName = generateRandomName();
      }
    }

    const clientId = crypto.randomUUID();
    const attachment: Attachment = { clientId, name: assignedName, holding: null, holdAt: 0 };
    server.serializeAttachment(attachment);

    server.send(
      JSON.stringify({
        t: "snapshot",
        clientId,
        name: assignedName,
        puzzle: this.puzzle ?? {
          title: "No Puzzle Available",
          imageUrl: "",
          rows: 0,
          cols: 0,
          aspect: 1,
        },
        pieces: this.view(),
      }),
    );
    this.broadcastCount();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string) {
    this.onDisconnect(ws);
  }

  async webSocketError(ws: WebSocket) {
    this.onDisconnect(ws);
  }

  private onDisconnect(ws: WebSocket) {
    const a = this.att(ws);
    if (!a) return;
    const heldId = a.holding;
    try {
      this.setAtt(ws, { holding: null });
    } catch {}
    if (heldId != null) {
      const gid = this.pieces[heldId]?.groupId;
      if (gid !== undefined) {
        this.broadcast(JSON.stringify({ t: "sync", pieces: this.viewGroups([gid], ws) }), ws);
      }
    }
    this.broadcastCount(ws);
  }
  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== "string" || raw.length > 200) return;

    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.t === "drop") await this.handleDrop(ws, msg);
    else if (msg.t === "pickup") await this.handlePickup(ws, msg);
    else if (msg.t === "move") this.handleMove(ws, msg);
    else if (msg.t === "cursor") this.handleCursor(ws, msg);
    else if (msg.t === "set_name") this.handleSetName(ws, msg);
  }

  private async handlePickup(ws: WebSocket, msg: { id: unknown }) {
    if (!Number.isInteger(msg.id)) return;
    const piece = this.pieces[msg.id as number];
    if (!piece || piece.locked) return;

    const a = this.att(ws);
    if (!a) return;

    const owner = this.holders().get(piece.groupId);
    if (owner && owner !== a.clientId) {
      ws.send(JSON.stringify({ t: "denied", id: msg.id }));
      ws.send(JSON.stringify({ t: "sync", pieces: this.viewGroups([piece.groupId]) }));
      return;
    }

    this.zIndexCounter++;
    for (const p of this.pieces) {
      if (p.groupId === piece.groupId) p.zIndex = this.zIndexCounter;
    }
    ws.serializeAttachment({ ...a, holding: msg.id as number, holdAt: Date.now() });

    this.broadcast(JSON.stringify({ t: "sync", pieces: this.viewGroups([piece.groupId]) }));
  }

  private handleMove(ws: WebSocket, msg: { id: unknown; x: unknown; y: unknown }) {
    const { id, x, y } = msg;
    if (!Number.isInteger(id) || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const piece = this.pieces[id as number];
    if (!piece || piece.locked) return;

    const a = this.att(ws);
    if (!a || this.holders().get(piece.groupId) !== a.clientId) return;

    ws.serializeAttachment({ ...a, holdAt: Date.now() });

    const { ax, ay } = this.placeGroup(piece, x as number, y as number);

    this.broadcast(JSON.stringify({ t: "move", id, x: ax, y: ay, groupId: piece.groupId }), ws);
  }

  private async handleDrop(ws: WebSocket, msg: { id: unknown; x: unknown; y: unknown }) {
    if (!this.puzzle) return;

    const { id, x, y } = msg;
    if (!Number.isInteger(id) || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const piece = this.pieces[id as number];
    if (!piece || piece.locked) return;

    const a = this.att(ws);
    if (!a || this.holders().get(piece.groupId) !== a.clientId) return;

    ws.serializeAttachment({ ...a, holding: null });

    const { rows, cols } = this.puzzle;
    const { groupPieces, pieceW, pieceH } = this.placeGroup(piece, x as number, y as number);

    const SNAP = Math.min(15 / 890, Math.min(pieceW, pieceH) * 0.3);
    let locked = false;

    for (const p of groupPieces) {
      const pRow = Math.floor(p.id / cols);
      const pCol = p.id % cols;
      const targetX = pCol * pieceW;
      const targetY = pRow * pieceH;

      const isCorner = (pRow === 0 || pRow === rows - 1) && (pCol === 0 || pCol === cols - 1);
      const isAdjacentLocked = [
        { r: pRow - 1, c: pCol },
        { r: pRow + 1, c: pCol },
        { r: pRow, c: pCol - 1 },
        { r: pRow, c: pCol + 1 },
      ].some(
        (n) =>
          n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && this.pieces[n.r * cols + n.c]?.locked,
      );

      if ((isCorner || isAdjacentLocked) && Math.hypot(p.x - targetX, p.y - targetY) < SNAP) {
        const shiftX = targetX - p.x;
        const shiftY = targetY - p.y;
        for (const gp of groupPieces) {
          gp.x += shiftX;
          gp.y += shiftY;
          gp.locked = true;
        }
        locked = true;
        break;
      }
    }

    if (!locked) {
      const held = this.holders();
      outer: for (const p of groupPieces) {
        const pRow = Math.floor(p.id / cols);
        const pCol = p.id % cols;
        for (const [dr, dc] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const r = pRow + dr;
          const c = pCol + dc;
          if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
          const op = this.pieces[r * cols + c];
          if (op.groupId === piece.groupId || op.locked || held.has(op.groupId)) continue;

          const expectedX = op.x + (pCol - c) * pieceW;
          const expectedY = op.y + (pRow - r) * pieceH;
          if (Math.hypot(p.x - expectedX, p.y - expectedY) < SNAP) {
            const alignDx = expectedX - p.x;
            const alignDy = expectedY - p.y;
            for (const item of groupPieces) {
              item.groupId = op.groupId;
              item.x += alignDx;
              item.y += alignDy;
            }
            break outer;
          }
        }
      }
    }

    this.broadcast(JSON.stringify({ t: "sync", pieces: this.viewGroups([piece.groupId]) }));
    await this.persist();
  }

  private handleCursor(ws: WebSocket, msg: { x: unknown; y: unknown }) {
    const { x, y } = msg;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const a = this.att(ws);
    if (!a) return;

    if (a.holding != null) ws.serializeAttachment({ ...a, holdAt: Date.now() });

    this.broadcast(JSON.stringify({ t: "cursor", clientId: a.clientId, name: a.name, x, y }), ws);
  }

  private handleSetName(ws: WebSocket, msg: { name: unknown }) {
    if (typeof msg.name !== "string") return;
    const cleanName = msg.name.trim().slice(0, 40);
    if (!cleanName) return;

    this.setAtt(ws, { name: cleanName });
  }

  private async handleAdminNewPuzzle(input: {
    imageUrl: string;
    pieces: number;
    title?: string;
    aspect?: number;
  }) {
    const imageUrl = input?.imageUrl;
    if (!imageUrl) {
      throw new Error("Missing imageUrl in request body.");
    }

    const targetPieces = input.pieces;
    let aspect = input.aspect;

    if (!aspect || isNaN(aspect) || aspect <= 0) {
      try {
        const res = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (!res.ok) {
          throw new Error(`Upstream image fetch failed with status ${res.status}`);
        }

        const buffer = await res.arrayBuffer();
        const view = new DataView(buffer);
        const dims = getPngDimensions(view) || getJpegDimensions(view) || getWebpDimensions(view);

        if (!dims) {
          throw new Error("Could not parse PNG or JPEG dimensions from image bytes.");
        }

        aspect = dims.width / dims.height;
      } catch (err: any) {
        console.error("Failed to parse image dimensions:", err);
        throw new Error(
          `Failed to determine puzzle aspect ratio: ${err.message}. Please provide 'aspect' manually in your request.`,
        );
      }
    }

    const rows = Math.max(2, Math.round(Math.sqrt(targetPieces / aspect)));
    const cols = Math.max(2, Math.round(Math.sqrt(targetPieces * aspect)));

    const title = `${input.title || "Puzzle"} (${rows * cols})`;

    this.puzzle = {
      title,
      imageUrl,
      rows,
      cols,
      aspect,
    };

    this.pieces = scatter(this.puzzle);
    this.zIndexCounter = 1;

    for (const ws of this.ctx.getWebSockets()) {
      try {
        this.setAtt(ws, { holding: null });
      } catch {}
    }

    await this.persist();

    this.broadcast(JSON.stringify({ t: "reset", puzzle: this.puzzle, pieces: this.view() }));
  }

  private async handleAdminSetClosed(closed: boolean) {
    this.closed = closed;
    await this.ctx.storage.put("closed", closed);
    if (closed) {
      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.close(CLOSED_CODE, "closed");
        } catch {}
      }
    }
  }
}
