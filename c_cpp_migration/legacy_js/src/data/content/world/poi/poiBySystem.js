// data/content/world/poi/poiBySystem.js

export const WORLD_POI_BY_SYSTEM = {
  sol: [
    {
      id: "poi_sol_distress",
      kind: "static",
      name: "Сигнал бедствия",
      x: -420,
      z: 520,
      radius: 100,
      interactRadius: 80,
      onEnter: "event_trace_enemy_c",
    },
  ],
};

export function getWorldPoiForSystem(systemId) {
  return WORLD_POI_BY_SYSTEM[String(systemId)] ?? [];
}
