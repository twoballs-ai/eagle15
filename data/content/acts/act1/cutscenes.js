// data/content/acts/act1/cutscenes.js

export function CS_ACT1_INTRO(ctx) {
  const R = Math.max(800, ctx?.boundsRadius ?? 1200);

  return {
    id: "cs:act1:intro",
    letterbox: true,
    letterboxHeight: 95,
    caption: "Выход из прыжка. Система неизвестна…",
    segments: [
      {
        dur: 2.2,
        caption: "Корабль повреждён. Нужно восстановить системы.",
        fromEye: [R * 0.75, 260, R * 0.65],
        toEye:   [R * 0.45, 220, R * 0.35],
        fromTarget: [0, 0, 0],
        toTarget:   [0, 0, 0],
      },
      {
        dur: 1.8,
        caption: "Сканируй ближайшие объекты и ищи маяк.",
        fromEye: [R * 0.45, 220, R * 0.35],
        toEye:   [R * 0.25, 190, R * 0.10],
        fromTarget: [0, 0, 0],
        toTarget:   [0, 0, 0],
      },
    ],
  };
}

export function CS_ACT1_BEACON_ACTIVATE(ctx) {
  return {
    id: "cs:act1:beacon_activate",
    letterbox: true,
    caption: "Маяк активирован…",
    segments: [
      {
        dur: 1.8,
        caption: "Синхронизация навигации…",
        fromEye: [420, 160, 420],
        toEye:   [0, 220, 0],
        fromTarget: [0, 0, 0],
        toTarget:   [0, 0, 0],
      },
      {
        dur: 1.4,
        caption: "Траектория прыжка найдена.",
        fromEye: [0, 220, 0],
        toEye:   [260, 180, -260],
        fromTarget: [0, 0, 0],
        toTarget:   [0, 0, 0],
      },
    ],
  };
}

export const ACT1_CUTSCENES = [
  { id: "cs:act1:intro", factory: CS_ACT1_INTRO },
  { id: "cs:act1:beacon_activate", factory: CS_ACT1_BEACON_ACTIVATE },
];
