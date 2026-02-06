// data/galaxy.static.js
// Статичный “каркас” галактики: 18 систем, базовые кластеры, связи.
// ВАЖНО: links можно редактировать вручную, но даже если забудешь —
// createGalaxy() сможет ДОСТРОИТЬ связность автоматически (если включено ensureConnected).

export const GALAXY_STATIC = {
  id: "core-v1",
  name: "Core Galaxy",
  map: { w: 2200, h: 1500 },

  // Можно оставить кластеры для визуала и логики (регион/сектор)
  clusters: [
    { id: 0, x: -650, z: -300, name: "Argo" },
    { id: 1, x:  200, z: -350, name: "Vela" },
    { id: 2, x:  650, z:  150, name: "Orion" },
    { id: 3, x: -150, z:  450, name: "Lyra" },
  ],

  // 18 систем (можешь сделать 15-20 — здесь 18, удобно расширять)
  // id: строка (лучше чем число — проще жить дальше)
  systems: [
    { id: "sol",        x: -720, z: -320, size: 14, name: "Sol",        clusterId: 0, kind: "system" },
    { id: "argo-1",     x: -520, z: -420, size: 12, name: "Argo-1",     clusterId: 0, kind: "system" },
    { id: "argo-relay", x: -600, z: -120, size: 12, name: "Argo Relay", clusterId: 0, kind: "relay" },
    { id: "argo-2",     x: -820, z: -120, size: 11, name: "Argo-2",     clusterId: 0, kind: "system" },

    { id: "vela-1",     x:   80, z: -480, size: 12, name: "Vela-1",     clusterId: 1, kind: "system" },
    { id: "vela-2",     x:  260, z: -520, size: 10, name: "Vela-2",     clusterId: 1, kind: "system" },
    { id: "vela-relay", x:  320, z: -280, size: 12, name: "Vela Relay", clusterId: 1, kind: "relay" },
    { id: "vela-3",     x:  120, z: -220, size: 11, name: "Vela-3",     clusterId: 1, kind: "system" },

    { id: "orion-1",     x:  520, z:   40, size: 12, name: "Orion-1",     clusterId: 2, kind: "system" },
    { id: "orion-2",     x:  720, z:   10, size: 11, name: "Orion-2",     clusterId: 2, kind: "system" },
    { id: "orion-relay", x:  760, z:  220, size: 12, name: "Orion Relay", clusterId: 2, kind: "relay" },
    { id: "orion-3",     x:  560, z:  260, size: 10, name: "Orion-3",     clusterId: 2, kind: "system" },

    { id: "lyra-1",     x:  -60, z:  360, size: 12, name: "Lyra-1",     clusterId: 3, kind: "system" },
    { id: "lyra-2",     x:  -220, z: 520, size: 11, name: "Lyra-2",     clusterId: 3, kind: "system" },
    { id: "lyra-relay", x:  -10, z:  560, size: 12, name: "Lyra Relay", clusterId: 3, kind: "relay" },
    { id: "lyra-3",     x:   80, z:  480, size: 10, name: "Lyra-3",     clusterId: 3, kind: "system" },

    // 2 системы “краевые” (можно потом сделать изолированными/рандомными)
    { id: "rim-1",      x:  980, z: -520, size: 10, name: "Rim-1",      clusterId: 2, kind: "system" },
    { id: "rim-2",      x: -980, z:  620, size: 10, name: "Rim-2",      clusterId: 3, kind: "system" },
  ],

  // Связи. Можно править вручную.
  // kind: "lane" (обычная) | "relay" (магистраль)
  links: [
    // cluster Argo
    { a: "sol",        b: "argo-1",     kind: "lane" },
    { a: "sol",        b: "argo-2",     kind: "lane" },
    { a: "argo-1",     b: "argo-relay", kind: "lane" },
    { a: "argo-2",     b: "argo-relay", kind: "lane" },

    // cluster Vela
    { a: "vela-1",     b: "vela-2",     kind: "lane" },
    { a: "vela-1",     b: "vela-3",     kind: "lane" },
    { a: "vela-3",     b: "vela-relay", kind: "lane" },
    { a: "vela-2",     b: "vela-relay", kind: "lane" },

    // cluster Orion
    { a: "orion-1",     b: "orion-2",     kind: "lane" },
    { a: "orion-2",     b: "orion-relay", kind: "lane" },
    { a: "orion-1",     b: "orion-3",     kind: "lane" },
    { a: "orion-3",     b: "orion-relay", kind: "lane" },

    // cluster Lyra
    { a: "lyra-1",     b: "lyra-2",     kind: "lane" },
    { a: "lyra-1",     b: "lyra-3",     kind: "lane" },
    { a: "lyra-2",     b: "lyra-relay", kind: "lane" },
    { a: "lyra-3",     b: "lyra-relay", kind: "lane" },

    // межкластерные магистрали через relay
    { a: "argo-relay", b: "vela-relay",  kind: "relay" },
    { a: "vela-relay", b: "orion-relay", kind: "relay" },
    { a: "orion-relay", b: "lyra-relay", kind: "relay" },

    // подключаем “краевые”
    { a: "orion-2", b: "rim-1", kind: "lane" },
    { a: "lyra-2",  b: "rim-2", kind: "lane" },
  ],
};
