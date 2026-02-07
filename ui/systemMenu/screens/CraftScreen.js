// engine/ui/systemMenu/screens/CraftScreen.js
export class CraftScreen {
  constructor(services) {
    this.services = services;

    // MVP рецепты
    this.recipes = [
      {
        id: "wirekit",
        name: "Набор проводки",
        inputs: [{ id: "wire", n: 2 }, { id: "tape", n: 1 }],
        output: { id: "wirekit", n: 1 },
      },
      {
        id: "fuelcell",
        name: "Топливный элемент",
        inputs: [{ id: "ore", n: 3 }, { id: "catalyst", n: 1 }],
        output: { id: "fuelcell", n: 1 },
      }
    ];

    this.selected = this.recipes[0]?.id ?? null;

    // MVP "инвентарь"
    this.inv = new Map([
      ["wire", 10],
      ["tape", 4],
      ["ore", 8],
      ["catalyst", 1],
    ]);

    this.log = [];
  }

  _canCraft(r) {
    for (const it of r.inputs) {
      if ((this.inv.get(it.id) ?? 0) < it.n) return false;
    }
    return true;
  }

  _craft(r) {
    if (!this._canCraft(r)) return false;
    for (const it of r.inputs) this.inv.set(it.id, (this.inv.get(it.id) ?? 0) - it.n);
    this.inv.set(r.output.id, (this.inv.get(r.output.id) ?? 0) + r.output.n);
    this.log.unshift(`Скрафчено: ${r.name} (+${r.output.n})`);
    this.log = this.log.slice(0, 6);
    return true;
  }

  render(ui, rect, dt, mouse) {
    ui.text(rect.x + 18, rect.y + 18, "Крафт (MVP)", { size: 16, color: "rgba(255,255,255,0.9)" });

    const left = { x: rect.x + 18, y: rect.y + 52, w: 420, h: rect.h - 70 };
    const right = { x: left.x + left.w + 14, y: left.y, w: rect.w - 36 - left.w - 14, h: left.h };

    ui.rect(left.x, left.y, left.w, left.h, { fill: "rgba(0,0,0,0.22)", stroke: "rgba(255,255,255,0.08)", radius: 12 });
    ui.rect(right.x, right.y, right.w, right.h, { fill: "rgba(0,0,0,0.22)", stroke: "rgba(255,255,255,0.08)", radius: 12 });

    // список рецептов
    ui.text(left.x + 14, left.y + 14, "Рецепты", { size: 13, color: "rgba(255,255,255,0.82)" });

    let y = left.y + 44;
    for (const r of this.recipes) {
      const row = { x: left.x + 12, y, w: left.w - 24, h: 52 };
      const hover = ui.hitRect(row.x, row.y, row.w, row.h, mouse.x, mouse.y);
      const active = this.selected === r.id;

      ui.rect(row.x, row.y, row.w, row.h, {
        fill: active ? "rgba(255,255,255,0.12)" : (hover ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"),
        stroke: "rgba(255,255,255,0.08)",
        radius: 10,
      });
      ui.text(row.x + 12, row.y + 16, r.name, { size: 13, color: "rgba(255,255,255,0.9)" });

      const ok = this._canCraft(r);
      ui.text(row.x + row.w - 90, row.y + 16, ok ? "OK" : "НЕТ", { size: 13, color: ok ? "rgba(180,255,180,0.85)" : "rgba(255,180,180,0.85)" });

      if (mouse.justDown && hover) this.selected = r.id;

      y += 60;
    }

    // детали + кнопка craft
    const cur = this.recipes.find(r => r.id === this.selected);
    if (cur) {
      ui.text(right.x + 16, right.y + 14, cur.name, { size: 15, color: "rgba(255,255,255,0.92)" });

      ui.text(right.x + 16, right.y + 48, "Нужно:", { size: 13, color: "rgba(255,255,255,0.82)" });
      let yy = right.y + 72;
      for (const it of cur.inputs) {
        const have = this.inv.get(it.id) ?? 0;
        ui.text(right.x + 18, yy, `• ${it.id}  ${have}/${it.n}`, { size: 13, color: "rgba(255,255,255,0.70)" });
        yy += 20;
      }

      ui.text(right.x + 16, yy + 10, "Результат:", { size: 13, color: "rgba(255,255,255,0.82)" });
      ui.text(right.x + 18, yy + 34, `• ${cur.output.id}  +${cur.output.n}`, { size: 13, color: "rgba(255,255,255,0.70)" });

      // кнопка "Создать"
      const btn = { x: right.x + 16, y: right.y + 160, w: 180, h: 40 };
      const hover = ui.hitRect(btn.x, btn.y, btn.w, btn.h, mouse.x, mouse.y);
      const can = this._canCraft(cur);

      ui.rect(btn.x, btn.y, btn.w, btn.h, {
        fill: can ? (hover ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.06)",
        stroke: "rgba(255,255,255,0.10)",
        radius: 10,
      });
      ui.text(btn.x + 16, btn.y + 12, "Создать", { size: 14, color: can ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)" });

      if (mouse.justDown && hover && can) this._craft(cur);

      // лог
      ui.text(right.x + 16, right.y + 220, "Лог:", { size: 13, color: "rgba(255,255,255,0.82)" });
      let ly = right.y + 244;
      for (const line of this.log) {
        ui.text(right.x + 18, ly, `• ${line}`, { size: 12, color: "rgba(255,255,255,0.65)" });
        ly += 18;
      }

      // инвентарь
      ui.text(right.x + 16, right.y + right.h - 150, "Инвентарь (MVP):", { size: 13, color: "rgba(255,255,255,0.82)" });
      let iy = right.y + right.h - 126;
      for (const [k, v] of this.inv.entries()) {
        ui.text(right.x + 18, iy, `• ${k}: ${v}`, { size: 12, color: "rgba(255,255,255,0.65)" });
        iy += 18;
      }
    }
  }
}
