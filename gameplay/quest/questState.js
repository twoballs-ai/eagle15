// gameplay/quest/questState.js
export class QuestState {
  constructor({ storageKey = "game.questState.v1" } = {}) {
    this.storageKey = storageKey;

    this.actId = "act1_lost_jump";

    this.flags = {
      nav_restored: false,
      ship_stabilized: false,
      got_parts: false,
      installed_upgrade: false,
      beacon_enabled: false,
      act1_complete: false,
      _beacon_activated: false,
    };

    this.visitedPoi = {}; // на будущее (шаг 3)
    this.log = [];

    this.load();
  }

  addLog(text) {
    const entry = { t: Date.now(), text };
    this.log.push(entry);
    if (this.log.length > 200) this.log.shift();
    this.save();
    return entry;
  }

  setFlag(flag, value = true) {
    if (!(flag in this.flags)) this.flags[flag] = false;
    this.flags[flag] = !!value;
    this.recompute();
    this.save();
  }

  hasFlag(flag) {
    return !!this.flags[flag];
  }

  // Производные состояния (маяк и завершение акта)
  recompute() {
    const f = this.flags;

    const beaconOk =
      f.ship_stabilized && f.nav_restored && f.got_parts && f.installed_upgrade;

    if (beaconOk) f.beacon_enabled = true;

    if (f.beacon_enabled && f._beacon_activated) {
      f.act1_complete = true;
    }
  }

  activateBeacon() {
    this.flags._beacon_activated = true;
    this.addLog("Маяк активирован. Подготовка к прыжку…");
    this.recompute();
    this.save();
  }

  // (шаг 3) пригодится
  markVisited(poiId) {
    this.visitedPoi[poiId] = true;
    this.save();
  }
  isVisited(poiId) {
    return !!this.visitedPoi[poiId];
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
      this.recompute();
    } catch (_) {}
  }

  reset() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (_) {}
    this.actId = "act1_lost_jump";
    this.visitedPoi = {};
    this.log = [];
    for (const k of Object.keys(this.flags)) this.flags[k] = false;
    this.save();
  }
}
