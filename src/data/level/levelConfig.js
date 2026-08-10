// src/data/level/levelConfig.js
// Конфигурация системы уровней игрока.
// Содержит только данные: кривая XP, награды за действия, границы уровней.
// Никакой runtime-логики — только константы и справочные данные.

export const LEVEL_CONFIG = {
  // Границы уровней
  minLevel: 1,
  maxLevel: 50,

  // Базовый XP для кривой роста.
  // Формула XP для перехода с уровня N на N+1: xpBase * N * N
  // Примеры при xpBase = 100:
  //   Уровень 1→2: 100 XP
  //   Уровень 2→3: 400 XP
  //   Уровень 5→6: 2500 XP
  //   Уровень 10→11: 10000 XP
  xpBase: 100,

  // Награды XP за игровые действия.
  // Используются в gameplay-системах при начислении опыта.
  xpRewards: {
    killHostile: 50,
    damageDealt: 2,
    questCompleted: 300,
    miniQuestCompleted: 100,
    poiDiscovered: 75,
    combatVictory: 150,
    diplomacySuccess: 80,
  },
};