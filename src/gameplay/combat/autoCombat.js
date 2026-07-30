// src/gameplay/combat/autoCombat.js

import { isHostile } from "../../data/faction/factionRelationsUtil.js";

// === КОНФИГУРАЦИЯ АВТОБОЯ ===
const AUTO_CFG = {
  detectionRadius: 1000,
  maxFireRange: 550,
  fireArcCos: 0.6, // ~53 градуса (стреляем только когда почти точно прицелились)
  baseSpeed: 240,
  
  // Настройки машины состояний
  chaseLeadTime: 0.6,      // Секунды упреждения (насколько вперед цели целиться)
  evadeDistance: 150,      // Если ближе этой дистанции - шанс на уклонение
  minBehaviorTime: 2.0,    // Минимальное время поведения (сек)
  maxBehaviorTime: 5.0,    // Максимальное время поведения (сек)
};

/**
 * Найти ближайшего врага (остается без изменений)
 */
export function findAutoTarget(playerRuntime, ships, playerFaction) {
  let best = null;
  let bestDist = Infinity;

  for (const ship of ships) {
    if (!ship?.runtime || ship.alive === false || ship.runtime.dead) continue;
    if (ship.runtime === playerRuntime) continue;
    if (!isHostile(playerFaction, ship.factionId)) continue;

    const dx = ship.runtime.x - playerRuntime.x;
    const dz = ship.runtime.z - playerRuntime.z;
    const dist = Math.hypot(dx, dz);

    if (dist < AUTO_CFG.detectionRadius && dist < bestDist) {
      bestDist = dist;
      best = { ship, dist, dx, dz };
    }
  }
  return best;
}

/**
 * Инициализация или обновление состояния dogfight для корабля.
 * Хранится прямо на объекте ship, чтобы не создавать глобальных синглтонов.
 */
function ensureDogfightState(ship) {
  if (!ship.dogfight) {
    ship.dogfight = {
      behavior: 'CHASE', // CHASE, ORBIT, EVADE
      timer: 2 + Math.random() * 3,
      orbitDir: Math.random() > 0.5 ? 1 : -1,
      preferredDist: 220 + Math.random() * 180, // У каждого корабля своя любимая дистанция
      turnSpeed: 2.5 + Math.random() * 2.0,     // У каждого своя маневренность
      aggression: 0.4 + Math.random() * 0.5,    // Склонность к погоне (0..1)
      
      // Пируэты
      pirouetteTimer: 0,
      pirouettePhase: Math.random() * Math.PI * 2,
    };
  }
  return ship.dogfight;
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ: Рассчитать кадр маневренного боя.
 * Используется и для игрока, и для врагов.
 * 
 * @param {Object} attackerRuntime - runtime атакующего корабля
 * @param {Object} targetRuntime - runtime цели
 * @param {Object} ship - объект корабля (для хранения состояния dogfight)
 * @param {number} dt - delta time
 * @returns {Object} - { vx, vz, yaw, shouldFire, behavior }
 */
export function computeDogfightFrame(attackerRuntime, targetRuntime, ship, dt) {
  const df = ensureDogfightState(ship);
  
  const dx = targetRuntime.x - attackerRuntime.x;
  const dz = targetRuntime.z - attackerRuntime.z;
  const dist = Math.hypot(dx, dz) || 1;
  const nx = dx / dist;
  const nz = dz / dist;

  // === 1. ОБНОВЛЕНИЕ ТАЙМЕРОВ И СМЕНА ПОВЕДЕНИЯ ===
  df.timer -= dt;
  
  // Случайные пируэты (резкие маневры)
  df.pirouetteTimer -= dt;
  let pirouetteOffset = 0;
  if (df.pirouetteTimer <= 0) {
    // Шанс начать пируэт
    if (Math.random() < 0.02) {
      df.pirouetteTimer = 0.5 + Math.random() * 1.0; // Длительность пируэта
      df.pirouettePhase = Math.random() * Math.PI * 2;
    }
  } else {
    // Во время пируэта добавляем синусоидальное отклонение к курсу
    pirouetteOffset = Math.sin(performance.now() * 0.01 + df.pirouettePhase) * 0.8;
  }

  // Если таймер поведения истек, выбираем новое
  if (df.timer <= 0) {
    df.timer = AUTO_CFG.minBehaviorTime + Math.random() * (AUTO_CFG.maxBehaviorTime - AUTO_CFG.minBehaviorTime);
    
    const roll = Math.random();
    if (dist < AUTO_CFG.evadeDistance && roll < 0.6) {
      df.behavior = 'EVADE'; // Слишком близко, часто пытаемся разорвать дистанцию
      df.orbitDir *= -1; // Меняем направление при уклонении
    } else if (roll < df.aggression) {
      df.behavior = 'CHASE'; // Агрессивная погоня
    } else {
      df.behavior = 'ORBIT'; // Кружим
      if (Math.random() < 0.3) df.orbitDir *= -1; // Иногда меняем направление орбиты
    }
  }

  // === 2. РАСЧЁТ ДВИЖЕНИЯ И ПРИЦЕЛИВАНИЯ ===
  let moveX = 0;
  let moveZ = 0;
  let targetYaw = attackerRuntime.yaw ?? 0;
  let speed = AUTO_CFG.baseSpeed;

  if (df.behavior === 'CHASE') {
    // 🚨 ПОГОНЯ: Целимся туда, куда цель будет через N секунд (упреждение)
    const leadX = targetRuntime.x + (targetRuntime.vx ?? 0) * AUTO_CFG.chaseLeadTime;
    const leadZ = targetRuntime.z + (targetRuntime.vz ?? 0) * AUTO_CFG.chaseLeadTime;
    
    const ldx = leadX - attackerRuntime.x;
    const ldz = leadZ - attackerRuntime.z;
    
    targetYaw = Math.atan2(ldx, -ldz);
    
    // Летим туда, куда смотрим (классическое преследование)
    moveX = Math.sin(targetYaw);
    moveZ = -Math.cos(targetYaw);
    
    // Если очень далеко, форсируем скорость
    if (dist > 600) speed *= 1.2;

  } else if (df.behavior === 'ORBIT') {
    // 🚨 ОРБИТА: Смотрим на цель, летим по касательной
    targetYaw = Math.atan2(dx, -dz);
    
    moveX = -nz * df.orbitDir;
    moveZ = nx * df.orbitDir;
    
    // Коррекция дистанции
    const drift = dist - df.preferredDist;
    moveX += nx * (drift / 100) * 0.5;
    moveZ += nz * (drift / 100) * 0.5;
    
    speed *= 0.9; // На орбите чуть медленнее

  } else if (df.behavior === 'EVADE') {
    // 🚨 УКЛОНЕНИЕ: Смотрим от цели, летим в сторону и вперед
    targetYaw = Math.atan2(-dx, dz); // Смотрим назад
    
    // Летим под углом 45 градусов от цели
    const evadeAngle = targetYaw + (df.orbitDir * Math.PI / 4);
    moveX = Math.sin(evadeAngle);
    moveZ = -Math.cos(evadeAngle);
    
    speed *= 1.3; // Максимальная скорость при уклонении
  }

  // Применяем пируэт к итоговому yaw
  targetYaw += pirouetteOffset;

  // Нормализуем вектор движения
  const moveLen = Math.hypot(moveX, moveZ) || 1;
  const vx = (moveX / moveLen) * speed;
  const vz = (moveZ / moveLen) * speed;

  // === 3. РЕШЕНИЕ О СТРЕЛЬБЕ ===
  // Стреляем только если цель в радиусе и мы смотрим примерно на нее
  const fx = Math.sin(attackerRuntime.yaw ?? 0);
  const fz = -Math.cos(attackerRuntime.yaw ?? 0);
  const dot = fx * nx + fz * nz;
  
  const inRange = dist <= AUTO_CFG.maxFireRange;
  const inArc = dot >= AUTO_CFG.fireArcCos;
  const shouldFire = inRange && inArc && (df.behavior === 'CHASE' || df.behavior === 'ORBIT');

  return {
    vx, vz,
    yaw: targetYaw,
    shouldFire,
    behavior: df.behavior,
    turnSpeed: df.turnSpeed,
  };
}