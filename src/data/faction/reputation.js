// src/data/faction/reputation.js

export const REPUTATION_LEVELS = {
  1: { id: "hostile", name: "Враждебный", min: -100, max: -61 },
  2: { id: "wary", name: "С опасением", min: -60, max: -21 },
  3: { id: "neutral", name: "Нейтральный", min: -20, max: 20 },
  4: { id: "friendly", name: "Дружественный", min: 21, max: 60 },
  5: { id: "ally", name: "Союзный", min: 61, max: 100 },
};

export function getReputationLevel(score) {
  if (score <= -61) return REPUTATION_LEVELS[1];
  if (score <= -21) return REPUTATION_LEVELS[2];
  if (score <= 20) return REPUTATION_LEVELS[3];
  if (score <= 60) return REPUTATION_LEVELS[4];
  return REPUTATION_LEVELS[5];
}

export function getReputationScore(state, factionId) {
  if (!state.reputation) state.reputation = {};
  return state.reputation[factionId] ?? 0; // По умолчанию 0 (Нейтральный)
}

export function modifyReputation(state, factionId, amount) {
  if (!state.reputation) state.reputation = {};
  const current = state.reputation[factionId] ?? 0;
  // Ограничиваем диапазон от -100 до 100
  const newScore = Math.max(-100, Math.min(100, current + amount));
  state.reputation[factionId] = newScore;
  
  const oldLevel = getReputationLevel(current);
  const newLevel = getReputationLevel(newScore);
  
  return {
    score: newScore,
    levelChanged: oldLevel.id !== newLevel.id,
    newLevel,
  };
}