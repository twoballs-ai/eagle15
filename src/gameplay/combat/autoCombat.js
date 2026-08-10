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
  minBehaviorTime: 3.0,    // ✅ ИЗМЕНЕНО: Минимальное время поведения (сек) - увеличено для стабильности
  maxBehaviorTime: 7.0,    // ✅ ИЗМЕНЕНО: Максимальное время поведения (сек) - увеличено для стабильности
  
  // ✅ ДОБАВЛЕНО: параметры для более плавных переходов и эстетики
  orbitTransitionTime: 1.5, // Время плавного перехода между состояниями
  spiralTightness: 0.3,     // Насколько плотные спирали в ORBIT
  evasionChance: 0.15,      // ✅ ИЗМЕНЕНО: Шанс на уклонение (снижен с 0.6 до 0.15)
};

/**
 * Найти ближайшего врага с памятью о предыдущей цели.
 * ✅ ИЗМЕНЕНО: теперь принимает currentTarget и возвращает его, если он жив.
 * Это предотвращает постоянное переключение между врагами — игрок добивает текущую цель.
 */
export function findAutoTarget(playerRuntime, ships, playerFaction, currentTarget = null) {
  // Если есть текущая цель — добиваем её (если она всё ещё атакует нас)
  if (currentTarget) {
    const ship = currentTarget.ship;
    if (ship?.runtime && ship.alive !== false && !ship.runtime.dead) {
      // ✅ КЛЮЧЕВОЕ: цель всё ещё должна нас атаковать
      if (ship.aiState === "combat") {
        const dx = ship.runtime.x - playerRuntime.x;
        const dz = ship.runtime.z - playerRuntime.z;
        const dist = Math.hypot(dx, dz);
        if (dist < AUTO_CFG.detectionRadius * 1.5) {
          return { ship, dist, dx, dz };
        }
      }
    }
  }
  
  // Ищем НОВОГО атакующего врага
  let best = null;
  let bestDist = Infinity;

  for (const ship of ships) {
    if (!ship?.runtime || ship.alive === false || ship.runtime.dead) continue;
    if (ship.runtime === playerRuntime) continue;
    if (!isHostile(playerFaction, ship.factionId)) continue;
    
    // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: ищем ТОЛЬКО тех, кто УЖЕ в состоянии combat
    // Враг должен сам решить напасть (через таймер предупреждения или диалог)
    if (ship.aiState !== "combat") continue;

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
 * ✅ ИЗМЕНЕНО: добавлены поля для более эстетичных движений и плавных переходов.
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
      
      // ✅ ДОБАВЛЕНО: поля для плавных переходов и эстетики
      transitionTimer: 0,        // Таймер плавного перехода между состояниями
      prevBehavior: null,        // Предыдущее состояние для интерполяции
      orbitAngle: 0,             // Текущий угол на орбите (для спиралей)
      orbitRadius: 0,            // Текущий радиус орбиты (для спиралей)
      spiralPhase: Math.random() * Math.PI * 2, // Фаза спирали для вариативности
    };
  }
  return ship.dogfight;
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ: Рассчитать кадр маневренного боя.
 * Используется и для игрока, и для врагов.
 * 
 * ✅ ИЗМЕНЕНО: 
 * - Убрано частое переключение в EVADE (теперь только при реальной опасности)
 * - Добавлены более эстетичные орбиты (спирали, эллипсы)
 * - Плавные переходы между состояниями
 * - Если корабль атакует, он не убегает без веской причины
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
  df.transitionTimer = Math.max(0, df.transitionTimer - dt);
  
  // ✅ ДОБАВЛЕНО: Обновляем угол орбиты для спиралей
  df.orbitAngle += dt * 0.8 * df.orbitDir;
  
  // Случайные пируэты (резкие маневры) — оставлены для вариативности
  df.pirouetteTimer -= dt;
  let pirouetteOffset = 0;
  if (df.pirouetteTimer <= 0) {
    // ✅ ИЗМЕНЕНО: Шанс начать пируэт снижен для более плавных движений
    if (Math.random() < 0.01) {
      df.pirouetteTimer = 0.5 + Math.random() * 1.0; // Длительность пируэта
      df.pirouettePhase = Math.random() * Math.PI * 2;
    }
  } else {
    // Во время пируэта добавляем синусоидальное отклонение к курсу
    pirouetteOffset = Math.sin(performance.now() * 0.01 + df.pirouettePhase) * 0.8;
  }

  // Если таймер поведения истек, выбираем новое
  // ✅ ИЗМЕНЕНО: логика смены состояний переделана для более плавных и эстетичных движений
  if (df.timer <= 0) {
    df.timer = AUTO_CFG.minBehaviorTime + Math.random() * (AUTO_CFG.maxBehaviorTime - AUTO_CFG.minBehaviorTime);
    
    // ✅ ДОБАВЛЕНО: сохраняем предыдущее состояние для плавного перехода
    df.prevBehavior = df.behavior;
    df.transitionTimer = AUTO_CFG.orbitTransitionTime;
    
    const roll = Math.random();
    
    // ✅ ИЗМЕНЕНО: EVADE теперь только при реальной опасности (очень близко)
    // Шанс снижен с 60% до 15%
    if (dist < AUTO_CFG.evadeDistance && roll < AUTO_CFG.evasionChance) {
      df.behavior = 'EVADE';
      df.orbitDir *= -1; // Меняем направление при уклонении
    } 
    // ✅ ДОБАВЛЕНО: если мы уже в CHASE и цель далеко, продолжаем CHASE
    else if (df.behavior === 'CHASE' && dist > 400) {
      df.behavior = 'CHASE'; // Остаёмся в погоне
    }
    // ✅ ДОБАВЛЕНО: если мы близко, предпочитаем ORBIT (красивые круги/спирали)
    else if (dist < 350) {
      df.behavior = 'ORBIT';
      if (Math.random() < 0.3) df.orbitDir *= -1; // Иногда меняем направление орбиты
    }
    // Иначе выбираем на основе агрессии
    else if (roll < df.aggression) {
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
    // ✅ ИЗМЕНЕНО: более эстетичные орбиты (спирали и эллипсы)
    // 🚨 ОРБИТА: Смотрим на цель, летим по касательной с красивыми спиралями
    
    // Базовое направление на цель
    const baseYaw = Math.atan2(dx, -dz);
    
    // ✅ ДОБАВЛЕНО: спиральное движение с изменяющимся радиусом
    // Радиус орбиты плавно меняется для создания спирали
    const spiralOffset = Math.sin(df.orbitAngle * AUTO_CFG.spiralTightness + df.spiralPhase) * 50;
    const currentOrbitRadius = df.preferredDist + spiralOffset;
    
    // Коррекция дистанции: стремимся к currentOrbitRadius
    const drift = dist - currentOrbitRadius;
    const radialCorrection = (drift / 100) * 0.6;
    
    // Касательное движение (перпендикулярно направлению на цель)
    moveX = -nz * df.orbitDir + nx * radialCorrection;
    moveZ = nx * df.orbitDir + nz * radialCorrection;
    
    // ✅ ДОБАВЛЕНО: лёгкий наклон к цели для более агрессивной орбиты
    const inwardLean = 0.15;
    moveX += nx * inwardLean;
    moveZ += nz * inwardLean;
    
    // Цель yaw: смотрим чуть впереди цели на орбите
    targetYaw = baseYaw + (df.orbitDir * 0.3);
    
    speed *= 0.9; // На орбите чуть медленнее для эстетики

  } else if (df.behavior === 'EVADE') {
    // 🚨 УКЛОНЕНИЕ: Смотрим от цели, летим в сторону и вперед
    // ✅ ИЗМЕНЕНО: теперь используется реже и только при реальной опасности
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
  // ✅ ИЗМЕНЕНО: стреляем в CHASE и ORBIT, но НЕ в EVADE (когда убегаем, не стреляем)
  const shouldFire = inRange && inArc && (df.behavior === 'CHASE' || df.behavior === 'ORBIT');

  return {
    vx, vz,
    yaw: targetYaw,
    shouldFire,
    behavior: df.behavior,
    turnSpeed: df.turnSpeed,
  };
}

export function applyShipDamage(rt, dmg) {
  if (!rt || dmg <= 0) return;

  // 1) shield
  const s = rt.shield ?? 0;
  if (s > 0) {
    const ds = Math.min(s, dmg);
    rt.shield = s - ds;
    dmg -= ds;
  }

  // 2) armor
  if (dmg > 0) {
    const a = rt.armor ?? rt.armorMax ?? 0;
    rt.armor = Math.max(0, a - dmg);
  }

  // 3) death
  if ((rt.armor ?? 0) <= 0) {
    rt.armor = 0;
    rt.dead = true;
  }
}