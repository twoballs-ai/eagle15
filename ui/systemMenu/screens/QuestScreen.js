// engine/ui/systemMenu/screens/QuestScreen.js
export class QuestScreen {
  constructor(services) {
    this.services = services;

    // MVP-данные
    this.quests = [
      { id: "q1", title: "Сигнал в астероидном поясе", status: "Активен", desc: "Найти источник сигнала. Проверить POI A." },
      { id: "q2", title: "Починка гиперблока", status: "Неактивен", desc: "Нужно 3 компонента и доступ к верфи." },
    ];
    this.selected = this.quests[0]?.id ?? null;
  }

  render(ui, rect, dt, mouse) {
    ui.text(rect.x + 18, rect.y + 18, "Квесты / Миссии (MVP)", { size: 16, color: "rgba(255,255,255,0.9)" });

    const listRect = { x: rect.x + 18, y: rect.y + 52, w: 360, h: rect.h - 70 };
    const infoRect = { x: listRect.x + listRect.w + 14, y: listRect.y, w: rect.w - 36 - listRect.w - 14, h: listRect.h };

    ui.rect(listRect.x, listRect.y, listRect.w, listRect.h, {
      fill: "rgba(0,0,0,0.22)", stroke: "rgba(255,255,255,0.08)", radius: 12,
    });
    ui.rect(infoRect.x, infoRect.y, infoRect.w, infoRect.h, {
      fill: "rgba(0,0,0,0.22)", stroke: "rgba(255,255,255,0.08)", radius: 12,
    });

    // список
    let y = listRect.y + 14;
    for (const q of this.quests) {
      const row = { x: listRect.x + 12, y, w: listRect.w - 24, h: 56 };
      const hover = ui.hitRect(row.x, row.y, row.w, row.h, mouse.x, mouse.y);
      const active = this.selected === q.id;

      ui.rect(row.x, row.y, row.w, row.h, {
        fill: active ? "rgba(255,255,255,0.12)" : (hover ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"),
        stroke: "rgba(255,255,255,0.08)",
        radius: 10,
      });

      ui.text(row.x + 12, row.y + 10, q.title, { size: 13, color: "rgba(255,255,255,0.9)" });
      ui.text(row.x + 12, row.y + 30, q.status, { size: 12, color: "rgba(255,255,255,0.65)" });

      if (mouse.justDown && hover) this.selected = q.id;

      y += 64;
    }

    // детали
    const cur = this.quests.find(q => q.id === this.selected);
    if (cur) {
      ui.text(infoRect.x + 16, infoRect.y + 14, cur.title, { size: 15, color: "rgba(255,255,255,0.92)" });
      ui.text(infoRect.x + 16, infoRect.y + 40, `Статус: ${cur.status}`, { size: 12, color: "rgba(255,255,255,0.7)" });

      ui.text(infoRect.x + 16, infoRect.y + 74, "Описание:", { size: 13, color: "rgba(255,255,255,0.85)" });
      ui.text(infoRect.x + 16, infoRect.y + 98, cur.desc, {
        size: 13, color: "rgba(255,255,255,0.70)", lineHeight: 18
      });

      ui.text(infoRect.x + 16, infoRect.y + 150, "Цели (MVP):", { size: 13, color: "rgba(255,255,255,0.85)" });
      ui.text(infoRect.x + 16, infoRect.y + 174, "• Найти POI A\n• Подойти к объекту\n• Активировать сканер",
        { size: 13, color: "rgba(255,255,255,0.70)", lineHeight: 18 }
      );
    }
  }
}
