export const MODEL_BASIS = {
  // ключом сделай то, что у тебя реально стабильно:
  // url, имя модели, или id ассета.

  // пример:
//   ship: { x: -Math.PI/2, y: 0, z: 0 },
ship: { x: 0, y: 0, z: Math.PI }, 
  sun:  { x: 0, y: 0, z: 0 },

  // planets_pack может быть набором — тогда ключи как у тебя в assets.models.planets[modelUrl]
  // "planet_01.glb": { x: ..., y: ..., z: ... },
};

export function getBasis(key) {
  return MODEL_BASIS[key] ?? { x: 0, y: 0, z: 0 };
}
