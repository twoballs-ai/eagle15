import { RACES } from "../data/сharacter/races.js";
import { CLASSES } from "../data/сharacter/classes.js";
const NAMES_BY_RACE = {
  human: [
    "Александр", "Илья", "Максим", "Даниил", "Артём",
    "Мария", "Екатерина", "Анна", "Ольга", "Виктория",
  ],

  synth: [
    "NX-01", "AXIOM", "SIGMA", "ORION", "KERNEL",
  ],

  aeon: [
    "Элион", "Саар", "Велис", "Кайр", "Аэтис",
  ],

  drakar: [
    "Краг", "Заррак", "Дрек", "Торрак", "Шаар",
  ],

  mycel: [
    "Спора-7", "Коллектив-А", "Мицел-Нод", "Синтез",
  ],

  voidborn: [
    "Нокс", "Эхо", "Люмен", "Пульсар", "Тень",
  ],
};
const STAT_LABELS_RU = {
  hp: "❤️ Здоровье",
  stamina: "🦵 Выносливость",
  energy: "⚡ Энергия",
  speed: "🚀 Скорость",
};

export class StartScreen {
  constructor() {
    this.root = document.getElementById("startUI");
    this.raceSel = document.getElementById("raceSelect");
    this.classSel = document.getElementById("classSelect");
    this.nameInp = document.getElementById("nameInput");
    this.randomNameBtn = document.getElementById("randomNameBtn");
    this.summaryEl = document.getElementById("summary");

    this.startBtn = document.getElementById("startBtn");
    this.defaultBtn = document.getElementById("startDefaultBtn");

    this.onStart = null;

    this._bind();
    this._fillRaces();
    this._fillClasses();
    this._updateSummary();
  }

  show() {
    if (this.root) this.root.style.display = "flex";
  }

  hide() {
    if (this.root) this.root.style.display = "none";
  }

  getSelection() {
    return {
      name: (this.nameInp.value || "Commander").trim(),
      raceId: this.raceSel.value,
      classId: this.classSel.value,
    };
  }

  setDefault() {
    this.nameInp.value = "Commander";
    this.raceSel.value = Object.keys(RACES)[0] || "human";
    this.classSel.value = Object.keys(CLASSES)[0] || "soldier";
    this._updateSummary();
  }

  _bind() {
    this.raceSel.addEventListener("change", () => this._setRandomName());
    this.classSel.addEventListener("change", () => this._updateSummary());
    this.nameInp.addEventListener("input", () => this._updateSummary());
    this.randomNameBtn?.addEventListener("click", () => {
        this._setRandomName();
        });

    this.defaultBtn.addEventListener("click", () => this.setDefault());

    this.startBtn.addEventListener("click", () => {
      if (this.onStart) this.onStart(this.getSelection());
    });
  }

  _fillRaces() {
    this.raceSel.innerHTML = "";
    for (const id of Object.keys(RACES)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = RACES[id].name || id;
      this.raceSel.appendChild(opt);
    }
    if (!this.raceSel.value) this.raceSel.value = Object.keys(RACES)[0] || "";
  }

  _fillClasses() {
    this.classSel.innerHTML = "";
    for (const id of Object.keys(CLASSES)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = CLASSES[id].name || id;
      this.classSel.appendChild(opt);
    }
    if (!this.classSel.value) this.classSel.value = Object.keys(CLASSES)[0] || "";
  }

_updateSummary() {
  const { name, raceId, classId } = this.getSelection();
  const r = RACES[raceId];
  const c = CLASSES[classId];

  const stats = {
    hp: (r?.stats?.hp || 0) + (c?.baseStats?.hp || 0),
    stamina: (r?.stats?.stamina || 0) + (c?.baseStats?.stamina || 0),
    energy: (r?.stats?.energy || 0) + (c?.baseStats?.energy || 0),
    speed: (r?.stats?.speed ?? 1.0),
  };

  const raceName = r?.name || raceId;
  const raceDesc = r?.description || "Описание отсутствует.";
  const className = c?.name || classId;
  const classDesc = c?.description || "Описание отсутствует.";

  this.summaryEl.textContent =
    `Имя: ${name}\n` +
    `Раса: ${raceName}\n` +
    `Описание расы: ${raceDesc}\n` +
    `Класс: ${className}\n` +
    `Описание класса: ${classDesc}\n` +
    `Характеристики:\n` +
    `${STAT_LABELS_RU.hp}: ${Math.round(stats.hp)}\n` +
    `${STAT_LABELS_RU.stamina}: ${Math.round(stats.stamina)}\n` +
    `${STAT_LABELS_RU.energy}: ${Math.round(stats.energy)}\n` +
    `${STAT_LABELS_RU.speed}: ${stats.speed.toFixed(2)}`;
}

_setRandomName() {
  const raceId = this.raceSel.value;
  const list = NAMES_BY_RACE[raceId];

  if (!list || list.length === 0) {
    this.nameInp.value = "Commander";
  } else {
    const i = Math.floor(Math.random() * list.length);
    this.nameInp.value = list[i];
  }

  this._updateSummary();
}
}
