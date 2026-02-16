// data/galaxy.static.js
// ✅ Статичная галактика (10 кластеров / 40 систем) + OFFSET сдвиг "вперёд"
// ✅ Убрана диагональ Perseus<->Hydra через центр (перестроены relay-связи)

const OFFSET = { x: 0, z: -260 }; // <-- сдвигай z: -260..-500 если надо дальше от "ближнего края"

const CLUSTERS_RAW = [
  { id: 0, x: -900, z: -520, name: "Argo" },
  { id: 1, x: -350, z: -560, name: "Vela" },
  { id: 2, x:  250, z: -540, name: "Orion" },
  { id: 3, x:  820, z: -460, name: "Lyra" },

  { id: 4, x: -980, z:  -40, name: "Draco" },
  { id: 5, x: -300, z:  -80, name: "Perseus" },
  { id: 6, x:  380, z:  -60, name: "Hydra" },
  { id: 7, x:  980, z:  -40, name: "Phoenix" },

  { id: 8, x: -520, z:  520, name: "Aquila" },
  { id: 9, x:  420, z:  520, name: "Cygnus" },
];

const SYSTEMS_RAW = [
  // Cluster 0 Argo
  { id: "argo-hub", x: -900, z: -520, size: 13, name: "Argo Hub", clusterId: 0, kind: "relay" },
  { id: "argo-1",   x: -760, z: -610, size: 11, name: "Argo-1",   clusterId: 0, kind: "system" },
  { id: "argo-2",   x: -980, z: -640, size: 10, name: "Argo-2",   clusterId: 0, kind: "system" },
  { id: "argo-3",   x: -1040, z: -440, size: 10, name: "Argo-3",  clusterId: 0, kind: "system" },

  // Cluster 1 Vela
  { id: "vela-hub", x: -350, z: -560, size: 13, name: "Vela Hub", clusterId: 1, kind: "relay" },
  { id: "vela-1",   x: -210, z: -650, size: 11, name: "Vela-1",   clusterId: 1, kind: "system" },
  { id: "vela-2",   x: -480, z: -670, size: 10, name: "Vela-2",   clusterId: 1, kind: "system" },
  { id: "vela-3",   x: -420, z: -430, size: 10, name: "Vela-3",   clusterId: 1, kind: "system" },

  // Cluster 2 Orion
  { id: "orion-hub", x: 250, z: -540, size: 13, name: "Orion Hub", clusterId: 2, kind: "relay" },
  { id: "orion-1",   x: 390, z: -640, size: 11, name: "Orion-1",   clusterId: 2, kind: "system" },
  { id: "orion-2",   x: 120, z: -670, size: 10, name: "Orion-2",   clusterId: 2, kind: "system" },
  { id: "orion-3",   x: 160, z: -420, size: 10, name: "Orion-3",   clusterId: 2, kind: "system" },

  // Cluster 3 Lyra
  { id: "lyra-hub", x: 820, z: -460, size: 13, name: "Lyra Hub", clusterId: 3, kind: "relay" },
  { id: "lyra-1",   x: 960, z: -560, size: 11, name: "Lyra-1",   clusterId: 3, kind: "system" },
  { id: "lyra-2",   x: 700, z: -590, size: 10, name: "Lyra-2",   clusterId: 3, kind: "system" },
  { id: "lyra-3",   x: 740, z: -340, size: 10, name: "Lyra-3",   clusterId: 3, kind: "system" },

  // Cluster 4 Draco
  { id: "draco-hub", x: -980, z: -40, size: 13, name: "Draco Hub", clusterId: 4, kind: "relay" },
  { id: "draco-1",   x: -840, z: -140, size: 11, name: "Draco-1",   clusterId: 4, kind: "system" },
  { id: "draco-2",   x: -1120, z: -170, size: 10, name: "Draco-2",  clusterId: 4, kind: "system" },
  { id: "draco-3",   x: -1100, z:  120, size: 10, name: "Draco-3",  clusterId: 4, kind: "system" },

  // Cluster 5 Perseus
  { id: "perseus-hub", x: -300, z: -80, size: 13, name: "Perseus Hub", clusterId: 5, kind: "relay" },
  { id: "perseus-1",   x: -160, z: -180, size: 11, name: "Perseus-1",   clusterId: 5, kind: "system" },
  { id: "perseus-2",   x: -430, z: -210, size: 10, name: "Perseus-2",   clusterId: 5, kind: "system" },
  { id: "perseus-3",   x: -420, z:  110, size: 10, name: "Perseus-3",   clusterId: 5, kind: "system" },

  // Cluster 6 Hydra
  { id: "hydra-hub", x: 380, z: -60, size: 13, name: "Hydra Hub", clusterId: 6, kind: "relay" },
  { id: "hydra-1",   x: 520, z: -170, size: 11, name: "Hydra-1",   clusterId: 6, kind: "system" },
  { id: "hydra-2",   x: 250, z: -210, size: 10, name: "Hydra-2",   clusterId: 6, kind: "system" },
  { id: "hydra-3",   x: 270, z:  120, size: 10, name: "Hydra-3",   clusterId: 6, kind: "system" },

  // Cluster 7 Phoenix
  { id: "phoenix-hub", x: 980, z: -40, size: 13, name: "Phoenix Hub", clusterId: 7, kind: "relay" },
  { id: "phoenix-1",   x: 1120, z: -150, size: 11, name: "Phoenix-1",   clusterId: 7, kind: "system" },
  { id: "phoenix-2",   x: 850,  z: -200, size: 10, name: "Phoenix-2",   clusterId: 7, kind: "system" },
  { id: "phoenix-3",   x: 880,  z:  120, size: 10, name: "Phoenix-3",   clusterId: 7, kind: "system" },

  // Cluster 8 Aquila
  { id: "aquila-hub", x: -520, z: 520, size: 13, name: "Aquila Hub", clusterId: 8, kind: "relay" },
  { id: "aquila-1",   x: -380, z: 410, size: 11, name: "Aquila-1",   clusterId: 8, kind: "system" },
  { id: "aquila-2",   x: -670, z: 380, size: 10, name: "Aquila-2",   clusterId: 8, kind: "system" },
  { id: "aquila-3",   x: -680, z: 650, size: 10, name: "Aquila-3",   clusterId: 8, kind: "system" },

  // Cluster 9 Cygnus
  { id: "cygnus-hub", x: 420, z: 520, size: 13, name: "Cygnus Hub", clusterId: 9, kind: "relay" },
  { id: "cygnus-1",   x: 560, z: 410, size: 11, name: "Cygnus-1",   clusterId: 9, kind: "system" },
  { id: "cygnus-2",   x: 260, z: 390, size: 10, name: "Cygnus-2",   clusterId: 9, kind: "system" },
  { id: "cygnus-3",   x: 280, z: 660, size: 10, name: "Cygnus-3",   clusterId: 9, kind: "system" },
];

const LINKS = [
  // --- IN-CLUSTER LANES (звезда через hub + 1 локальная) ---
  // Argo
  { a: "argo-1", b: "argo-hub", kind: "lane" },
  { a: "argo-2", b: "argo-hub", kind: "lane" },
  { a: "argo-3", b: "argo-hub", kind: "lane" },
  { a: "argo-1", b: "argo-2",   kind: "lane" },

  // Vela
  { a: "vela-1", b: "vela-hub", kind: "lane" },
  { a: "vela-2", b: "vela-hub", kind: "lane" },
  { a: "vela-3", b: "vela-hub", kind: "lane" },
  { a: "vela-1", b: "vela-3",   kind: "lane" },

  // Orion
  { a: "orion-1", b: "orion-hub", kind: "lane" },
  { a: "orion-2", b: "orion-hub", kind: "lane" },
  { a: "orion-3", b: "orion-hub", kind: "lane" },
  { a: "orion-2", b: "orion-1",   kind: "lane" },

  // Lyra
  { a: "lyra-1", b: "lyra-hub", kind: "lane" },
  { a: "lyra-2", b: "lyra-hub", kind: "lane" },
  { a: "lyra-3", b: "lyra-hub", kind: "lane" },
  { a: "lyra-2", b: "lyra-3",   kind: "lane" },

  // Draco
  { a: "draco-1", b: "draco-hub", kind: "lane" },
  { a: "draco-2", b: "draco-hub", kind: "lane" },
  { a: "draco-3", b: "draco-hub", kind: "lane" },
  { a: "draco-1", b: "draco-3",   kind: "lane" },

  // Perseus
  { a: "perseus-1", b: "perseus-hub", kind: "lane" },
  { a: "perseus-2", b: "perseus-hub", kind: "lane" },
  { a: "perseus-3", b: "perseus-hub", kind: "lane" },
  { a: "perseus-1", b: "perseus-2",   kind: "lane" },

  // Hydra
  { a: "hydra-1", b: "hydra-hub", kind: "lane" },
  { a: "hydra-2", b: "hydra-hub", kind: "lane" },
  { a: "hydra-3", b: "hydra-hub", kind: "lane" },
  { a: "hydra-2", b: "hydra-3",   kind: "lane" },

  // Phoenix
  { a: "phoenix-1", b: "phoenix-hub", kind: "lane" },
  { a: "phoenix-2", b: "phoenix-hub", kind: "lane" },
  { a: "phoenix-3", b: "phoenix-hub", kind: "lane" },
  { a: "phoenix-2", b: "phoenix-3",   kind: "lane" },

  // Aquila
  { a: "aquila-1", b: "aquila-hub", kind: "lane" },
  { a: "aquila-2", b: "aquila-hub", kind: "lane" },
  { a: "aquila-3", b: "aquila-hub", kind: "lane" },
  { a: "aquila-1", b: "aquila-2",   kind: "lane" },

  // Cygnus
  { a: "cygnus-1", b: "cygnus-hub", kind: "lane" },
  { a: "cygnus-2", b: "cygnus-hub", kind: "lane" },
  { a: "cygnus-3", b: "cygnus-hub", kind: "lane" },
  { a: "cygnus-2", b: "cygnus-1",   kind: "lane" },

  // --- межкластерные магистрали (relay) ---
  // Верхняя дуга
  { a: "argo-hub",  b: "vela-hub",    kind: "relay" },
  { a: "vela-hub",  b: "orion-hub",   kind: "relay" },
  { a: "orion-hub", b: "lyra-hub",    kind: "relay" },
  { a: "lyra-hub",  b: "phoenix-hub", kind: "relay" },

  // Средняя дуга (слева направо)
  { a: "argo-hub",   b: "draco-hub",   kind: "relay" },
  { a: "draco-hub",  b: "perseus-hub", kind: "relay" },

  // ✅ ВАЖНО: УБРАЛИ perseus-hub <-> hydra-hub (она резала центр)
  // Вместо неё "по соседям"
  { a: "perseus-hub", b: "vela-hub",   kind: "relay" },
  { a: "orion-hub",   b: "hydra-hub",  kind: "relay" },
  { a: "hydra-hub",   b: "phoenix-hub",kind: "relay" },

  // Нижняя дуга
  { a: "perseus-hub", b: "aquila-hub", kind: "relay" },
  { a: "hydra-hub",   b: "cygnus-hub", kind: "relay" },

  // Пара "коротких путей" (не режут центр)
  { a: "aquila-hub",  b: "cygnus-hub", kind: "relay" },
  { a: "draco-hub",   b: "vela-hub",   kind: "relay" },
];

export const GALAXY_STATIC = {
  id: "core-v2",
  name: "Core Galaxy",
  map: { w: 2200, h: 1500 },

  clusters: CLUSTERS_RAW.map((c) => ({
    ...c,
    x: c.x + OFFSET.x,
    z: c.z + OFFSET.z,
  })),

  systems: SYSTEMS_RAW.map((s) => ({
    ...s,
    x: s.x + OFFSET.x,
    z: s.z + OFFSET.z,
  })),

  links: LINKS,
};
