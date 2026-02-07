// engine/ui/systemMenu/screens/MapScreen.js
export class MapScreen {
  constructor(services) {
    this.services = services;
  }

  render(ui, rect) {
    ui.text(rect.x + 18, rect.y + 18, "Карта (MVP)", { size: 16, color: "rgba(255,255,255,0.9)" });

    ui.rect(rect.x + 18, rect.y + 52, rect.w - 36, rect.h - 70, {
      fill: "rgba(0,0,0,0.22)",
      stroke: "rgba(255,255,255,0.08)",
      radius: 12,
    });

    ui.text(rect.x + 36, rect.y + 76,
      "Тут позже будет:\n• мини-рендер GalaxyMap\n• список систем\n• выбор POI\n• кнопки 'перейти/прыжок'",
      { size: 13, color: "rgba(255,255,255,0.70)", lineHeight: 18 }
    );
  }
}
