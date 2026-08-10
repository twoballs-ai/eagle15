// src/gameplay/level/playerLevel.js
// Runtime-логика системы уровней игрока.
// Содержит функции начисления XP и проверки повышения уровня.
// Это ЕДИНСТВЕННАЯ точка, через которую gameplay-системы начисляют опыт.

import { LEVEL_CONFIG } from "../../data/level/levelConfig.js";

/**
 * Возвращает XP, необходимый для перехода с текущего уровня на следующий.
 * @param {number} level - Текущий уровень
 * @returns {number}
 */
export function getXPForNextLevel(level) {
  const lvl = Math.max(LEVEL_CONFIG.minLevel, Math.min(LEVEL_CONFIG.maxLevel, level));
  return LEVEL_CONFIG.xpBase * lvl * lvl;
}

/**
 * Добавляет XP игроку и проверяет повышение уровня.
 * ЕДИНСТВЕННЫЙ правильный способ начислять XP во всём проекте.
 * Все gameplay-системы (бой, квесты, POI) вызывают только эту функцию.
 *
 * @param {object} state - Глобальный state игры
 * @param {number} amount - Количество XP
 * @param {string} [reason] - Причина начисления (для лога)
 * @returns {{ leveledUp: boolean, newLevel: number, xpGained: number }}
 */
export function addPlayerXP(state, amount, reason = "unknown") {
  if (!state) return { leveledUp: false, newLevel: 1, xpGained: 0 };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { leveledUp: false, newLevel: state.playerLevel ?? 1, xpGained: 0 };
  }

  // Инициализация полей, если их нет
  if (!state.playerLevel) state.playerLevel = LEVEL_CONFIG.minLevel;
  if (!state.playerXP) state.playerXP = 0;
  if (!state.totalXPEarned) state.totalXPEarned = 0;
  if (!Array.isArray(state.xpLog)) state.xpLog = [];

  const xpGained = Math.round(amount);
  state.playerXP += xpGained;
  state.totalXPEarned += xpGained;

  // Лог последних начислений (для UI и отладки)
  state.xpLog.push({
    amount: xpGained,
    reason,
    time: Date.now(),
    level: state.playerLevel,
  });
  if (state.xpLog.length > 50) state.xpLog.shift();

  // Проверка повышения уровня
  let leveledUp = false;

  while (state.playerLevel < LEVEL_CONFIG.maxLevel) {
    const xpNeeded = getXPForNextLevel(state.playerLevel);
    if (state.playerXP < xpNeeded) break;

    state.playerXP -= xpNeeded;
    state.playerLevel += 1;
    leveledUp = true;
  }

  // На максимальном уровне XP не копится
  if (state.playerLevel >= LEVEL_CONFIG.maxLevel) {
    state.playerXP = 0;
  }

  return {
    leveledUp,
    newLevel: state.playerLevel,
    xpGained,
  };
}