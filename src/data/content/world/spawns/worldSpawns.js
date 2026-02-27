// data/content/world/spawns/worldSpawns.js

export const WORLD_SPAWN_PRESETS = {
  default: {
    pirates: { groupsDelta: 0, perGroupDelta: 0 },
    traders: { groupsDelta: 0, perGroupDelta: 0 },
    neutral: { groupsDelta: 0, perGroupDelta: 0 },
  },
  calm: {
    pirates: { groupsDelta: -1, perGroupDelta: -1 },
    traders: { groupsDelta: 1, perGroupDelta: 0 },
    neutral: { groupsDelta: 1, perGroupDelta: 0 },
  },
  story_hot: {
    pirates: { groupsDelta: 1, perGroupDelta: 1 },
    traders: { groupsDelta: -1, perGroupDelta: 0 },
    neutral: { groupsDelta: 0, perGroupDelta: 0 },
  },
};

export function resolveWorldSpawnDirectives({ alertLevel = "ambient" } = {}) {
  if (alertLevel === "story_hot") return WORLD_SPAWN_PRESETS.story_hot;
  if (alertLevel === "calm") return WORLD_SPAWN_PRESETS.calm;
  return WORLD_SPAWN_PRESETS.default;
}
