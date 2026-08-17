// ui/systemMenu/screens/InventoryScreen.js
function el(tag, className, parent) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (parent) parent.appendChild(e);
  return e;
}

export class InventoryScreen {
  constructor(services) {
    this.services = services;
    this.host = null;

    this._styleEl = null;
    this._gridEl = null;
    this._searchEl = null;

    this._q = "";
    
    // Выбор для экипировки: { type: 'ship'|'inventory', index: number, slotArrayName?: string, slotIndex?: number }
    this._selection = null;
  }

  _get(key) {
    return (typeof this.services?.get === "function")
      ? this.services.get(key)
      : this.services?.[key];
  }

  mount(host) {
    this.host = host;
    this._injectStyles();
    host.innerHTML = "";

    const root = el("div", "inv-root", host);

    const top = el("div", "inv-top", root);
    el("div", "inv-title", top).textContent = "Инвентарь и экипировка";
    el("div", "inv-sub", top).textContent = "Кликните на предмет в трюме, затем на слот корабля, чтобы экипировать его.";

    // ===== СЛОТЫ ОРУЖИЯ И МОДУЛЕЙ =====
    const shipPanel = el("div", "ship-panel", root);
    el("div", "ship-panel-title", shipPanel).textContent = "Слоты корабля";

    const shipSlotsContainer = el("div", "ship-slots-container", shipPanel);

    // Слоты оружия
    const weaponSection = el("div", "ship-slots-section", shipSlotsContainer);
    el("div", "ship-slots-label", weaponSection).textContent = "Оружие:";
    this._weaponSlotsEl = el("div", "ship-weapon-slots", weaponSection);

    // Слоты утилити (модули)
    const utilitySection = el("div", "ship-slots-section", shipSlotsContainer);
    el("div", "ship-slots-label", utilitySection).textContent = "Модули:";
    this._utilitySlotsEl = el("div", "ship-utility-slots", utilitySection);

    const bar = el("div", "inv-bar", root);
    el("div", "inv-label", bar).textContent = "Поиск в трюме:";
    this._searchEl = el("input", "inv-search", bar);
    this._searchEl.type = "text";
    this._searchEl.placeholder = "например: oxygen, iron, coil…";
    this._searchEl.value = this._q;
    this._searchEl.addEventListener("input", () => {
      this._q = this._searchEl.value ?? "";
      this.refresh();
    });

    const panel = el("div", "inv-panel", root);
    el("div", "inv-panel-title", panel).textContent = "Трюм (общие слоты)";
    this._gridEl = el("div", "inv-grid", panel);

    this.refresh();
  }

  onOpen() { this.refresh(); }

  destroy() { this.host = null; }

  /**
   * Вспомогательная функция для красивого отображения имени типа слота
   */
  _formatSlotName(type) {
    const names = {
      main: "Основное",
      auxiliary: "Вспомогательное",
      missile: "Ракеты",
      turret: "Турель",
      engine: "Двигатель",
      shield: "Щит",
      utility: "Модуль",
      cargo_boost: "Расширение трюма",
      scanner: "Сканер"
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  refresh() {
    if (!this._gridEl) return;

    const inv = this._get("inventory");
    const state = this._get("state");
    this._gridEl.innerHTML = "";

    if (!inv) {
      el("div", "inv-empty", this._gridEl).textContent =
        "inventory service не найден. Проверь services.set('inventory', ...)";
      return;
    }
    
    // ===== ОТРИСОВКА СЛОТОВ КОРАБЛЯ =====
    this._renderShipSlots(state);

    const cap = inv.capacity();
    const q = (this._q ?? "").trim().toLowerCase();

    for (let i = 0; i < cap; i++) {
      const slot = inv.getSlot(i);

      const cell = el("button", "inv-cell", this._gridEl);
      cell.type = "button";
      cell.dataset.i = String(i);

      const has = !!slot;
      if (!has) cell.classList.add("is-empty");

      // поиск: подсветка совпадений, а несовпадения — приглушаем
      if (q && has) {
        const match = String(slot.id).toLowerCase().includes(q);
        if (match) cell.classList.add("is-match");
        else cell.classList.add("is-dim");
      }
      if (q && !has) cell.classList.add("is-dim");

      // выбранный слот
      if (this._selection && this._selection.type === 'inventory' && this._selection.index === i) {
        cell.classList.add("is-selected");
      }

      // содержимое слота (блоком)
      if (slot) {
        const chip = el("div", "inv-chip", cell);
        el("div", "inv-chipId", chip).textContent = slot.id;
        el("div", "inv-chipN", chip).textContent = String(slot.n ?? 0);
      } else {
        // номер слота (чтобы сетка ощущалась "как в играх")
        const idx = el("div", "inv-idx", cell);
        idx.textContent = String(i + 1);
      }

      cell.addEventListener("click", () => {
        // Если уже выбран слот корабля, перемещаем предмет туда
        if (this._selection && this._selection.type === 'ship') {
          this._equipItemToShipSlot(i, this._selection.slotArrayName, this._selection.slotIndex);
        } else {
          // Выбираем предмет из инвентаря
          this._selection = { type: 'inventory', index: i };
          this.refresh();
        }
      });
    }
  }

  /**
   * Отрисовка слотов корабля на основе текущего класса корабля
   */
  _renderShipSlots(state) {
    if (!this._weaponSlotsEl || !this._utilitySlotsEl) return;

    this._weaponSlotsEl.innerHTML = "";
    this._utilitySlotsEl.innerHTML = "";

    const playerShip = state?.playerShip;
    if (!playerShip) {
      el("div", "ship-slots-empty", this._weaponSlotsEl).textContent = "Нет данных о корабле";
      return;
    }

    const weaponSlots = playerShip.weaponSlots || [];
    const utilitySlots = playerShip.utilitySlots || [];

    // Отрисовка слотов оружия
    weaponSlots.forEach((slot, index) => {
      const slotBtn = el("button", "ship-slot", this._weaponSlotsEl);
      slotBtn.type = "button";
      slotBtn.dataset.slotArrayName = "weaponSlots";
      slotBtn.dataset.slotIndex = String(index);

      if (slot.item) {
        slotBtn.classList.add("is-equipped");
        const chip = el("div", "ship-slot-chip", slotBtn);
        el("div", "ship-slot-chipId", chip).textContent = slot.item.id;
      } else {
        slotBtn.classList.add("is-empty");
        const label = el("div", "ship-slot-label", slotBtn);
        label.textContent = this._formatSlotName(slot.slotType);
        const idx = el("div", "ship-slot-idx", slotBtn);
        idx.textContent = `#${index + 1}`;
      }

      // Подсветка если этот слот выбран для экипировки
      if (this._selection && this._selection.type === 'ship' &&
          this._selection.slotArrayName === 'weaponSlots' && this._selection.slotIndex === index) {
        slotBtn.classList.add("is-selected");
      }

      slotBtn.addEventListener("click", () => {
        // Если выбран предмет из инвентаря, экипируем его
        if (this._selection && this._selection.type === 'inventory') {
          this._equipItemToShipSlot(this._selection.index, 'weaponSlots', index);
        } else {
          // Иначе выбираем этот слот
          this._selection = { type: 'ship', slotArrayName: 'weaponSlots', slotIndex: index };
          this.refresh();
        }
      });
    });

    // Отрисовка слотов утилити
    utilitySlots.forEach((slot, index) => {
      const slotBtn = el("button", "ship-slot", this._utilitySlotsEl);
      slotBtn.type = "button";
      slotBtn.dataset.slotArrayName = "utilitySlots";
      slotBtn.dataset.slotIndex = String(index);

      if (slot.item) {
        slotBtn.classList.add("is-equipped");
        const chip = el("div", "ship-slot-chip", slotBtn);
        el("div", "ship-slot-chipId", chip).textContent = slot.item.id;
      } else {
        slotBtn.classList.add("is-empty");
        const label = el("div", "ship-slot-label", slotBtn);
        label.textContent = this._formatSlotName(slot.slotType);
        const idx = el("div", "ship-slot-idx", slotBtn);
        idx.textContent = `#${index + 1}`;
      }

      // Подсветка если этот слот выбран для экипировки
      if (this._selection && this._selection.type === 'ship' &&
          this._selection.slotArrayName === 'utilitySlots' && this._selection.slotIndex === index) {
        slotBtn.classList.add("is-selected");
      }

      slotBtn.addEventListener("click", () => {
        // Если выбран предмет из инвентаря, экипируем его
        if (this._selection && this._selection.type === 'inventory') {
          this._equipItemToShipSlot(this._selection.index, 'utilitySlots', index);
        } else {
          // Иначе выбираем этот слот
          this._selection = { type: 'ship', slotArrayName: 'utilitySlots', slotIndex: index };
          this.refresh();
        }
      });
    });
  }

  /**
   * Экипировать предмет из инвентаря в слот корабля
   * @param {number} inventoryIndex - индекс слота в инвентаре
   * @param {string} slotArrayName - имя массива слотов ('weaponSlots' или 'utilitySlots')
   * @param {number} slotIndex - индекс слота корабля
   */
  _equipItemToShipSlot(inventoryIndex, slotArrayName, slotIndex) {
    const inv = this._get("inventory");
    const state = this._get("state");

    if (!inv || !state?.playerShip) return;

    const invItem = inv.getSlot(inventoryIndex);
    if (!invItem) {
      this._selection = null;
      this.refresh();
      return;
    }

    const shipSlots = state.playerShip[slotArrayName];
    const shipSlot = shipSlots[slotIndex];

    if (!shipSlots || slotIndex < 0 || slotIndex >= shipSlots.length) {
      this._selection = null;
      this.refresh();
      return;
    }

    // Если в слоте корабля уже что-то есть, возвращаем это в инвентарь
    if (shipSlot.item) {
      let placed = false;
      const cap = inv.capacity();
      for (let i = 0; i < cap; i++) {
        if (!inv.getSlot(i)) {
          inv.setSlot(i, shipSlot.item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Инвентарь полон, отменяем действие экипировки
        this._selection = null;
        this.refresh();
        return;
      }
    }

    // Экипируем предмет из инвентаря в слот корабля
    shipSlot.item = { id: invItem.id, n: invItem.n };
    
    // Удаляем предмет из инвентаря
    inv.setSlot(inventoryIndex, null);

    // Сбрасываем выбор
    this._selection = null;

    // Обновляем UI
    this.refresh();
  }

  _injectStyles() {
    if (this._styleEl) return;

    const st = document.createElement("style");
    st.id = "inventoryScreenStyles";
    st.textContent = `
      .inv-root{ display:flex; flex-direction:column; gap:12px; height: 100%; }
      .inv-top{
        padding:10px 12px;
        border:1px solid rgba(160,200,255,.10);
        border-radius:12px;
        background: rgba(0,0,0,.18);
      }
      .inv-title{ font-weight:900; font-size:16px; color:#e8f0ff; }
      .inv-sub{ opacity:.7; font-size:12px; margin-top:4px; }

      .inv-bar{ display:flex; align-items:center; gap:10px; padding:4px 2px; }
      .inv-label{ opacity:.8; font-size:13px; min-width:110px; }
      .inv-search{
        flex: 1;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(160,200,255,.12);
        background: rgba(0,0,0,.18);
        color: #eaf3ff;
        outline: none;
      }
      .inv-search::placeholder{ color: rgba(232,240,255,.45); }

      .inv-panel{
        border-radius:14px;
        border:1px solid rgba(160,200,255,.10);
        background: rgba(0,0,0,.18);
        padding:12px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 300px;
      }
      .inv-panel-title {
        font-size: 13px;
        font-weight: 700;
        color: #e8f0ff;
        margin-bottom: 8px;
        opacity: 0.8;
      }

  /* компактная авто-сетка */
.inv-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

/* маленькая ячейка */
.inv-cell{
  position: relative;
  width: 100%;
  height: 72px;             /* фикс высота => маленькая */
  border-radius: 10px;
  border: 1px solid rgba(160,200,255,.10);
  background: rgba(255,255,255,.04);
  cursor: pointer;
  padding: 6px;
  color: #eaf3ff;
  text-align: left;
  overflow: hidden;
}
.inv-cell:hover{
  background: rgba(255,255,255,.07);
  border-color: rgba(160,200,255,.18);
}
.inv-cell.is-selected{
  border-color: rgba(0,255,220,.22);
  background: rgba(255,255,255,.10);
  box-shadow: 0 0 0 2px rgba(0,255,220,.06) inset;
}

      .inv-cell.is-dim{ opacity: .35; }
      .inv-cell.is-match{
        opacity: 1;
        border-color: rgba(0,255,220,.22);
        box-shadow: 0 0 0 2px rgba(0,255,220,.06) inset;
      }

 .inv-idx{
  position:absolute;
  right: 8px;
  bottom: 6px;
  opacity: .30;
  font-size: 10px;
  font-weight: 900;
}

     .inv-chip{
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1px solid rgba(160,200,255,.12);
  background: rgba(0,0,0,.20);
  padding: 6px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  gap: 4px;
}

.inv-chipId{
  font-weight: 950;
  font-size: 11px;
  line-height: 1.05;
  word-break: break-word;

  /* чтобы длинные id не раздували */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.inv-chipN{
  align-self:flex-end;
  font-weight: 950;
  font-size: 11px;
  color: rgba(190,255,190,.92);
}

      .inv-empty{ opacity:.65; font-size:13px; padding:10px 4px; }

      /* ===== СЛОТЫ КОРАБЛЯ ===== */
      .ship-panel{
        border-radius:14px;
        border:1px solid rgba(160,200,255,.10);
        background: rgba(0,0,0,.18);
        padding:12px;
      }
      .ship-panel-title{
        font-weight:900;
        font-size:14px;
        color:#e8f0ff;
        margin-bottom:10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .ship-slots-container{
        display:flex;
        flex-direction:column;
        gap:12px;
      }
      .ship-slots-section{
        display:flex;
        flex-direction: column;
        gap:6px;
      }
      .ship-slots-label{
        font-size:12px;
        opacity:.8;
        color: #e8f0ff;
      }
      .ship-weapon-slots,
      .ship-utility-slots{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }
      .ship-slot{
        position:relative;
        width:90px;
        height:70px;
        border-radius:10px;
        border:1px dashed rgba(160,200,255,.25);
        background:rgba(0,0,0,.25);
        cursor:pointer;
        padding:6px;
        color:#eaf3ff;
        overflow:hidden;
        display: flex;
        flex-direction: column;
        transition: all 0.2s ease;
      }
      .ship-slot:hover{
        background:rgba(255,255,255,.05);
        border-color:rgba(160,200,255,.5);
      }
      .ship-slot.is-selected{
        border-color:rgba(0,255,220,.22);
        background:rgba(255,255,255,.10);
        box-shadow:0 0 0 2px rgba(0,255,220,.06) inset;
      }
      .ship-slot.is-equipped{
        border-style: solid;
        border-color:rgba(0,255,100,.3);
        background:rgba(0,255,100,.05);
      }
      .ship-slot.is-empty{
        opacity:.8;
      }
      .ship-slot-label {
        font-size: 9px;
        text-transform: uppercase;
        color: rgba(232,240,255,.5);
        margin-bottom: 4px;
        text-align: center;
      }
      .ship-slot-chip{
        width:100%;
        height:100%;
        border-radius:8px;
        border:1px solid rgba(160,200,255,.12);
        background:rgba(0,0,0,.20);
        padding:6px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
      }
      .ship-slot-chipId{
        font-weight:950;
        font-size:10px;
        line-height:1.1;
        word-break:break-word;
        display:-webkit-box;
        -webkit-line-clamp:3;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      .ship-slot-idx{
        position:absolute;
        right:6px;
        bottom:4px;
        opacity:.30;
        font-size:9px;
        font-weight:900;
      }
      .ship-slots-empty{
        opacity:.6;
        font-size:12px;
        padding:8px;
      }
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}