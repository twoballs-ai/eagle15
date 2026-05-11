// data/system/spawnPointsBySystem.js
// Спавн-точки в координатах мира (x,z). type нужен для разных сценариев.

export function getSpawnPointsForSystem(systemId) {
  // Можно сделать по systemId разные точки.
  // Для MVP — базовый набор.
  const base = [
    { id: "lane_north", type: "lane", x: 0,    z: -900, weight: 1.0 },
    { id: "lane_south", type: "lane", x: 0,    z:  900, weight: 1.0 },
    { id: "lane_east",  type: "lane", x: 900,  z: 0,    weight: 0.9 },
    { id: "lane_west",  type: "lane", x: -900, z: 0,    weight: 0.9 },

    { id: "pirate_ring_1", type: "pirate", x: 520,  z: 460, weight: 0.8 },
    { id: "pirate_ring_2", type: "pirate", x: -620, z: 420, weight: 0.8 },
    { id: "pirate_ring_3", type: "pirate", x: 220,  z: -640, weight: 0.8 },

    { id: "trader_path_1", type: "trader", x: -300, z: -820, weight: 0.7 },
    { id: "trader_path_2", type: "trader", x:  340, z:  780, weight: 0.7 },
  ];

  return base;
}
