// data/items/index.js
// Единая точка экспорта для всех предметов

// 1. Сначала импортируем для локального использования в этом файле
import {
  WEAPONS_CATALOG,
  WEAPONS_BY_ID,
  getWeapon,
  getWeaponsBySlotType,
  getWeaponsByRarity
} from './weapons.js';

import {
  MODULES_CATALOG,
  MODULES_BY_ID,
  getModule,
  getModulesBySlotType,
  getModulesByRarity,
  getModulesByType
} from './modules.js';

// 2. Затем экспортируем всё наружу для других модулей
export {
  WEAPONS_CATALOG,
  WEAPONS_BY_ID,
  getWeapon,
  getWeaponsBySlotType,
  getWeaponsByRarity,
  MODULES_CATALOG,
  MODULES_BY_ID,
  getModule,
  getModulesBySlotType,
  getModulesByRarity,
  getModulesByType
};

// 3. Теперь мы можем безопасно использовать локальные переменные для объединения
export const ITEMS_CATALOG = [
  ...WEAPONS_CATALOG,
  ...MODULES_CATALOG,
];

// Быстрый доступ по ID для всех предметов
export const ITEMS_BY_ID = {
  ...WEAPONS_BY_ID,
  ...MODULES_BY_ID,
};

// Получить предмет по ID (оружие или модуль)
export function getItem(id) {
  return ITEMS_BY_ID[id] || null;
}

// Проверка типа предмета
export function isWeapon(item) {
  return item?.type === 'weapon';
}

export function isModule(item) {
  return item?.type === 'module';
}

// Проверка соответствия типа слота
export function canEquipToSlot(item, slotType) {
  if (!item || !slotType) return false;
  return item.slotType === slotType;
}