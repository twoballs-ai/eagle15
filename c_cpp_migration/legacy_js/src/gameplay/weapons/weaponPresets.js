export const WEAPON_PRESETS = [
  {
    id: "pulse",
    name: "Импульс",
    fireCooldown: 0.1,
    damage: 14,
    bulletSpeed: 1150,
    bulletLife: 1.1,
    spread: 0.008,
    pellets: 1,
  },
  {
    id: "scatter",
    name: "Дробовик",
    fireCooldown: 0.35,
    damage: 8,
    bulletSpeed: 900,
    bulletLife: 0.55,
    spread: 0.09,
    pellets: 6,
  },
  {
    id: "rail",
    name: "Рельса",
    fireCooldown: 0.55,
    damage: 42,
    bulletSpeed: 1800,
    bulletLife: 1.5,
    spread: 0.002,
    pellets: 1,
  },
];

export function getWeaponPreset(index = 0) {
  if (!WEAPON_PRESETS.length) return null;
  const safe = ((index % WEAPON_PRESETS.length) + WEAPON_PRESETS.length) % WEAPON_PRESETS.length;
  return WEAPON_PRESETS[safe];
}
