import { RACES } from "../data/character/races.js";
import { CLASSES } from "../data/character/classes.js";
import { SHIP_CLASSES } from "../data/ship/shipClasses.js";

import { createPilotProfile } from "../data/character/pilot.js";
import { applyPilotModifiersToShipStats } from "../data/ship/applyPilotModifiers.js";

const NAMES_BY_RACE = {
  human: ["Александр", "Илья", "Максим", "Даниил", "Артём", "Мария", "Екатерина", "Анна", "Ольга", "Виктория"],
  synth: ["NX-01", "AXIOM", "SIGMA", "ORION", "KERNEL"],
  aeon: ["Элион", "Саар", "Велис", "Кайр", "Аэтис"],
  drakar: ["Краг", "Заррак", "Дрек", "Торрак", "Шаар"],
  mycel: ["Спора-7", "Коллектив-А", "Мицел-Нод", "Синтез"],
  voidborn: ["Нокс", "Эхо", "Люмен", "Пульсар", "Тень"],
};

function fmt(v) {
  if (typeof v !== "number") return String(v);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

export class StartScreen {
  constructor() {
    // elements
    this.root = document.getElementById("startUI");

    this.raceSel = document.getElementById("raceSelect");
    this.classSel = document.getElementById("classSelect");
    this.shipClassSel = document.getElementById("shipClassSelect");

    this.nameInp = document.getElementById("nameInput");
    this.randomNameBtn = document.getElementById("randomNameBtn");
    this.summaryEl = document.getElementById("summary");

    this.startBtn = document.getElementById("startBtn");

    this.onStart = null;
    this._handlers = {};

    // fill
    this._fillRaces();
    this._fillPilotClasses();
    this._fillShipClasses();

    // bind
    this._bind();

    // initial name and summary
    this._setRandomName();
    this._updateSummary();
  }

  show() {
    if (this.root) this.root.style.display = "flex";
  }

  hide() {
    if (this.root) this.root.style.display = "none";
  }

  destroy() {
    const h = this._handlers;

    if (this.raceSel && h.onRaceChange) this.raceSel.removeEventListener("change", h.onRaceChange);
    if (this.classSel && h.onPilotClassChange) this.classSel.removeEventListener("change", h.onPilotClassChange);
    if (this.shipClassSel && h.onShipClassChange) this.shipClassSel.removeEventListener("change", h.onShipClassChange);
    if (this.nameInp && h.onNameInput) this.nameInp.removeEventListener("input", h.onNameInput);

    if (this.randomNameBtn && h.onRandomClick) this.randomNameBtn.removeEventListener("click", h.onRandomClick);
    if (this.startBtn && h.onStartClick) this.startBtn.removeEventListener("click", h.onStartClick);

    this._handlers = {};
  }

  getSelection() {
    return {
      name: (this.nameInp?.value || "").trim(),
      raceId: this.raceSel?.value || "human",
      classId: this.classSel?.value || "soldier",
      shipClassId: this.shipClassSel?.value || "scout",
    };
  }

  _bind() {
    const h = this._handlers;

    h.onRaceChange = () => {
      this._setRandomName();
      this._updateSummary();
    };

    h.onPilotClassChange = () => this._updateSummary();
    h.onShipClassChange = () => this._updateSummary();
    h.onNameInput = () => this._updateSummary();

    h.onRandomClick = () => this._setRandomName();

    h.onStartClick = () => {
      if (!this.onStart) return;
      const cfg = this.getSelection();

      // минимальная валидация
      if (!cfg.name) {
        this._setRandomName();
        cfg.name = this.getSelection().name;
      }

      this.onStart(cfg);
    };

    if (this.raceSel) this.raceSel.addEventListener("change", h.onRaceChange);
    if (this.classSel) this.classSel.addEventListener("change", h.onPilotClassChange);
    if (this.shipClassSel) this.shipClassSel.addEventListener("change", h.onShipClassChange);
    if (this.nameInp) this.nameInp.addEventListener("input", h.onNameInput);

    if (this.randomNameBtn) this.randomNameBtn.addEventListener("click", h.onRandomClick);
    if (this.startBtn) this.startBtn.addEventListener("click", h.onStartClick);
  }

  _fillRaces() {
    if (!this.raceSel) return;
    this.raceSel.innerHTML = "";

    for (const id of Object.keys(RACES)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = RACES[id]?.name || id;
      this.raceSel.appendChild(opt);
    }

    if (!this.raceSel.value) this.raceSel.value = Object.keys(RACES)[0] || "human";
  }

  _fillPilotClasses() {
    if (!this.classSel) return;
    this.classSel.innerHTML = "";

    for (const id of Object.keys(CLASSES)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = CLASSES[id]?.name || id;
      this.classSel.appendChild(opt);
    }

    if (!this.classSel.value) this.classSel.value = Object.keys(CLASSES)[0] || "soldier";
  }

  _fillShipClasses() {
    if (!this.shipClassSel) return;
    this.shipClassSel.innerHTML = "";

    for (const id of Object.keys(SHIP_CLASSES)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = SHIP_CLASSES[id]?.name || id;
      this.shipClassSel.appendChild(opt);
    }

    if (!this.shipClassSel.value) this.shipClassSel.value = Object.keys(SHIP_CLASSES)[0] || "scout";
  }

  _setRandomName() {
    const raceId = this.raceSel?.value || "human";
    const list = NAMES_BY_RACE[raceId];

    if (!this.nameInp) return;

    if (!list || list.length === 0) {
      this.nameInp.value = "Pilot";
    } else {
      const i = Math.floor(Math.random() * list.length);
      this.nameInp.value = list[i];
    }
  }

  _updateSummary() {
    if (!this.summaryEl) return;

    const { name, raceId, classId, shipClassId } = this.getSelection();

    const race = RACES[raceId];
    const cls = CLASSES[classId];
    const shipCls = SHIP_CLASSES[shipClassId];

    const pilot = createPilotProfile({
      id: "preview_pilot",
      name: name || "—",
      raceId,
      classId,
      factionId: "player",
    });

    const baseShipStats = shipCls?.baseStats || { hull: 0, shields: 0, energy: 0, speed: 0 };
    const finalShipStats = applyPilotModifiersToShipStats(baseShipStats, pilot.modifiers);

    this.summaryEl.textContent =
      `Пилот: ${name || "—"}\n` +
      `Раса: ${race?.name || raceId}\n` +
      `Класс пилота: ${cls?.name || classId}\n` +
      `Корабль: ${shipCls?.name || shipClassId}\n` +
      `\n` +
      `Характеристики корабля (с модификаторами пилота):\n` +
      `🧱 Корпус: ${finalShipStats.hull}\n` +
      `🛡️ Щиты: ${finalShipStats.shields}\n` +
      `⚡ Энергия: ${finalShipStats.energy}\n` +
      `🚀 Скорость: ${fmt(finalShipStats.speed)}`;
  }
}
