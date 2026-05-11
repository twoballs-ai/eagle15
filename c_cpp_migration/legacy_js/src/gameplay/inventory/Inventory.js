// engine/game/Inventory.js
export class Inventory {
  // backend: { slots: Array<{id,n}|null>, capacity: number }
  constructor(backend) {
    this.backend = backend;
    if (!this.backend.slots) this.backend.slots = [];
    if (!this.backend.capacity) this.backend.capacity = this.backend.slots.length || 100;

    // гарантируем длину
    if (this.backend.slots.length !== this.backend.capacity) {
      const old = this.backend.slots.slice(0);
      this.backend.slots.length = this.backend.capacity;
      for (let i = 0; i < this.backend.capacity; i++) this.backend.slots[i] = old[i] ?? null;
    }
  }

  capacity() { return this.backend.capacity; }

  get(itemId) {
    return this.countOf(itemId);
  }

  getSlot(i) { return this.backend.slots[i] ?? null; }

  setSlot(i, itemOrNull) {
    if (i < 0 || i >= this.backend.capacity) return false;
    this.backend.slots[i] = itemOrNull ? { id: itemOrNull.id, n: itemOrNull.n } : null;
    return true;
  }

  // сумма по всем слотам
  countOf(itemId) {
    let sum = 0;
    for (const s of this.backend.slots) {
      if (s && s.id === itemId) sum += (s.n ?? 0);
    }
    return sum;
  }

  // для крафта (списание по слотам)
  canAfford(inputs) {
    for (const it of inputs) {
      if (this.countOf(it.id) < it.n) return false;
    }
    return true;
  }

  // списывает N по слотам (слева направо)
  remove(itemId, n) {
    let left = n;
    for (let i = 0; i < this.backend.capacity; i++) {
      const s = this.backend.slots[i];
      if (!s || s.id !== itemId) continue;

      const take = Math.min(left, s.n);
      s.n -= take;
      left -= take;

      if (s.n <= 0) this.backend.slots[i] = null;
      if (left <= 0) return true;
    }
    return false;
  }

  spend(inputs) {
    if (!this.canAfford(inputs)) return false;
    for (const it of inputs) this.remove(it.id, it.n);
    return true;
  }

  // добавляет в первый подходящий слот:
  // 1) если такой же id уже есть — стэкаем туда (без лимита стака в MVP)
  // 2) иначе в первый пустой слот
  add(itemId, n) {
    if (n <= 0) return true;

    // стэкаем
    for (let i = 0; i < this.backend.capacity; i++) {
      const s = this.backend.slots[i];
      if (s && s.id === itemId) {
        s.n += n;
        return true;
      }
    }

    // пустой слот
    for (let i = 0; i < this.backend.capacity; i++) {
      const s = this.backend.slots[i];
      if (!s) {
        this.backend.slots[i] = { id: itemId, n };
        return true;
      }
    }

    // нет места
    return false;
  }


  canGain(outputs) {
    const probe = this.backend.slots.map((s) => (s ? { id: s.id, n: s.n } : null));
    const addProbe = (itemId, n) => {
      if (n <= 0) return true;
      for (let i = 0; i < probe.length; i++) {
        const s = probe[i];
        if (s && s.id === itemId) { s.n += n; return true; }
      }
      for (let i = 0; i < probe.length; i++) {
        if (!probe[i]) { probe[i] = { id: itemId, n }; return true; }
      }
      return false;
    };
    for (const it of outputs) {
      if (!addProbe(it.id, it.n)) return false;
    }
    return true;
  }

  gain(outputs) {
    for (const it of outputs) {
      const ok = this.add(it.id, it.n);
      if (!ok) return false;
    }
    return true;
  }

  // для UI списком (если надо)
  entriesAggregatedSorted() {
    const map = new Map();
    for (const s of this.backend.slots) {
      if (!s) continue;
      map.set(s.id, (map.get(s.id) ?? 0) + (s.n ?? 0));
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  entriesSorted() {
    return this.entriesAggregatedSorted();
  }
}
