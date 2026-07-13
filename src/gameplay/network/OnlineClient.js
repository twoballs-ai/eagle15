const DEFAULT_SEND_RATE = 12;

export class OnlineClient {
  constructor({ url = null, playerId = null, sendRate = DEFAULT_SEND_RATE } = {}) {
    this.url = url ?? getDefaultOnlineUrl();
    this.playerId = playerId ?? makePlayerId();
    this.sendInterval = 1 / Math.max(1, sendRate);
    this.ws = null;
    this.status = this.url ? "idle" : "offline";
    this.peers = new Map();
    this._sendTimer = 0;
    this._lastError = null;
  }

  connect() {
    if (!this.url || this.ws || typeof WebSocket === "undefined") return;
    this.status = "connecting";
    try {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      ws.addEventListener("open", () => {
        this.status = "online";
        this.send({ type: "hello", playerId: this.playerId });
      });
      ws.addEventListener("message", (event) => this.handleMessage(event.data));
      ws.addEventListener("close", () => {
        if (this.ws === ws) this.ws = null;
        this.status = "offline";
      });
      ws.addEventListener("error", () => {
        this._lastError = "WebSocket connection error";
        this.status = "error";
      });
    } catch (err) {
      this.ws = null;
      this.status = "error";
      this._lastError = err?.message ?? String(err);
    }
  }

  disconnect() {
    const ws = this.ws;
    this.ws = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close();
    this.status = "offline";
    this.peers.clear();
  }

  update(dt, localShip, systemId) {
    this.prunePeers();
    if (!this.url) return;
    if (!this.ws) this.connect();
    this._sendTimer += dt;
    if (this._sendTimer < this.sendInterval) return;
    this._sendTimer = 0;
    if (this.status !== "online" || !localShip?.runtime) return;
    const r = localShip.runtime;
    this.send({
      type: "ship:update",
      playerId: this.playerId,
      systemId,
      ship: {
        id: localShip.id,
        factionId: localShip.factionId,
        x: r.x, z: r.z, vx: r.vx, vz: r.vz,
        yaw: r.yaw, bank: r.bank ?? 0, pitchV: r.pitchV ?? 0,
      },
    });
  }

  send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  handleMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || msg.playerId === this.playerId) return;
    if (msg.type === "ship:update" && msg.ship) {
      this.peers.set(msg.playerId, {
        playerId: msg.playerId,
        systemId: msg.systemId ?? null,
        ship: msg.ship,
        updatedAt: performance.now(),
      });
    }
    if (msg.type === "player:left") this.peers.delete(msg.playerId);
  }

  getPeers(systemId = null) {
    return [...this.peers.values()].filter((peer) => !systemId || peer.systemId === systemId);
  }

  prunePeers(now = performance.now()) {
    for (const [id, peer] of this.peers) {
      if (now - peer.updatedAt > 10000) this.peers.delete(id);
    }
  }
}

export function getDefaultOnlineUrl() {
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  return params.get("ws") || globalThis.localStorage?.getItem?.("lost_jump_ws") || null;
}

function makePlayerId() {
  const key = "lost_jump_player_id";
  const existing = globalThis.localStorage?.getItem?.(key);
  if (existing) return existing;
  const id = `player_${Math.random().toString(36).slice(2, 10)}`;
  globalThis.localStorage?.setItem?.(key, id);
  return id;
}
