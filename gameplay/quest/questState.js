// gameplay/quest/questState.js
// Простая квестовая/актовая система: флаги, прогресс, сохранение.

export class QuestState {
  constructor({ storageKey = "game.questState.v1" } = {}) {
    this.storageKey = storageKey;

    // текущий акт/квест
    this.actId = "act1_lost_jump";

    // флаги прогресса (условия)
    this.flags = {
      nav_restored: false,
      ship_stabilized: false,
      got_parts: false,
      installed_upgrade: false,
      beacon_enabled: false,
      act1_complete: false,
    };

    // чтобы POI события не спамились
    this.visitedPoi = {}; // { [poiId]: true }

    // логи (для UI)
    this.log = [];

    this.load();
  }

  addLog(text) {
    const entry = { t: Date.now(), text };
    this.log.push(entry);
    // ограничим размер
    if (this.log.length > 200) this.log.shift();
    this.save();
    return entry;
  }

  setFlag(flag, value = true) {
    if (!(flag in this.flags)) this.flags[flag] = false;
    this.flags[flag] = !!value;
    this.save();
  }

  hasFlag(flag) {
    return !!this.flags[flag];
  }

  markVisited(poiId) {
    this.visitedPoi[poiId] = true;
    this.save();
  }

  isVisited(poiId) {
    return !!this.visitedPoi[poiId];
  }

  // вычисляем производные состояния (например, маяк доступен)
  recompute() {
    const f = this.flags;
    // Маяк можно включить, когда корабль стабилизирован, навигация восстановлена,
    // есть детали и поставлен хотя бы один апгрейд (MVP)
    const beaconOk =
      f.ship_stabilized && f.nav_restored && f.got_parts && f.installed_upgrade;

    if (beaconOk && !f.beacon_enabled) {
      f.beacon_enabled = true;
      this.addLog("Навигационный маяк может быть активирован.");
    }

    if (f.beacon_enabled && f.act1_complete !== true && f._beacon_activated) {
      f.act1_complete = true;
      this.addLog("Акт 1 завершён: переход в следующую систему доступен.");
    }

    this.save();
  }

  // Вызови, когда игрок активировал маяк (кнопкой или автособытием)
  activateBeacon() {
    this.flags._beacon_activated = true;
    this.addLog("Маяк активирован. Подготовка к прыжку…");
    this.recompute();
  }

  save() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          actId: this.actId,
          flags: this.flags,
          visitedPoi: this.visitedPoi,
          log: this.log,
        })
      );
    } catch (_) {}
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.actId) this.actId = data.actId;
      if (data.flags) this.flags = { ...this.flags, ...data.flags };
      if (data.visitedPoi) this.visitedPoi = data.visitedPoi;
      if (Array.isArray(data.log)) this.log = data.log;
    } catch (_) {}
  }

  reset() {
    localStorage.removeItem(this.storageKey);
    // перезагрузка в дефолт
    this.actId = "act1_lost_jump";
    this.visitedPoi = {};
    this.log = [];
    Object.keys(this.flags).forEach((k) => (this.flags[k] = false));
    this.save();
  }
}
