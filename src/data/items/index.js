// data/items/index.js
// Единая точка экспорта для всех предметов

export {
  WEAPONS_CATALOG,
  WEAPONS_BY_ID,
  getWeapon,
  getWeaponsBySlotType,
  getWeaponsByRarity
} from './weapons.js';

export {
  MODULES_CATALOG,
  MODULES_BY_ID,
  getModule,
  getModulesBySlotType,
  getModulesByRarity,
  getModulesByType
} from './modules.js';

// Объединённый каталог всех предметов
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
