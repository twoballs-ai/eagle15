export class PersistentNpcManager {
  constructor() {
    this.npcs = new Map();
    this.bySystem = new Map(); // systemId -> Set<npcId> — индекс для быстрого поиска
  }

  register(npc) {
    if (!npc.persistent) {
      console.warn(`[PersistentNpcManager] NPC ${npc.id} is not persistent`);
      return;
    }
    this.npcs.set(npc.id, npc);
    
    if (npc.currentSystemId) {
      this._addToSystemIndex(npc.currentSystemId, npc.id);
    }
  }

  unregister(npcId) {
    const npc = this.npcs.get(npcId);
    if (npc?.currentSystemId) {
      this._removeFromSystemIndex(npc.currentSystemId, npcId);
    }
    this.npcs.delete(npcId);
  }

  has(npcId) {
    return this.npcs.has(npcId);
  }

  get(npcId) {
    return this.npcs.get(npcId) ?? null;
  }

  getAll() {
    return Array.from(this.npcs.values());
  }

  getForSystem(systemId) {
    const ids = this.bySystem.get(systemId);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.npcs.get(id))
      .filter(Boolean);
  }

  moveToSystem(npcId, systemId) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    if (npc.currentSystemId) {
      this._removeFromSystemIndex(npc.currentSystemId, npcId);
    }
    npc.currentSystemId = systemId;
    this._addToSystemIndex(systemId, npcId);
  }

  _addToSystemIndex(systemId, npcId) {
    if (!this.bySystem.has(systemId)) {
      this.bySystem.set(systemId, new Set());
    }
    this.bySystem.get(systemId).add(npcId);
  }

  _removeFromSystemIndex(systemId, npcId) {
    const set = this.bySystem.get(systemId);
    if (set) {
      set.delete(npcId);
      if (set.size === 0) this.bySystem.delete(systemId);
    }
  }

  // Сериализация для сохранения игры
  serialize() {
    return {
      npcs: Array.from(this.npcs.entries()),
    };
  }

  deserialize(data) {
    if (!data?.npcs) return;
    for (const [id, npc] of data.npcs) {
      this.npcs.set(id, npc);
      if (npc.currentSystemId) {
        this._addToSystemIndex(npc.currentSystemId, id);
      }
    }
  }
}