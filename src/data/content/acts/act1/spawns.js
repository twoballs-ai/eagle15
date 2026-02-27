// data/content/acts/act1/spawns.js

export const ACT1_SPAWN_OVERRIDES = {
  sol: {
    pirates: { groupsDelta: -1, perGroupDelta: 0 },
    traders: { groupsDelta: 1, perGroupDelta: 1 },
  },
};

export function getAct1SpawnOverride(systemId) {
  return ACT1_SPAWN_OVERRIDES[String(systemId)] ?? null;
}
