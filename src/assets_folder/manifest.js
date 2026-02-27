// assets_folder/manifest.js

const PLANETS_1GEN = [
  "/assets_folder/models/planets_1gen/planet_acid_000.glb",
  "/assets_folder/models/planets_1gen/planet_acid_001.glb",
  "/assets_folder/models/planets_1gen/planet_acid_002.glb",

  "/assets_folder/models/planets_1gen/planet_arid_000.glb",
  "/assets_folder/models/planets_1gen/planet_arid_001.glb",
  "/assets_folder/models/planets_1gen/planet_arid_002.glb",

  "/assets_folder/models/planets_1gen/planet_crystal_000.glb",
  "/assets_folder/models/planets_1gen/planet_crystal_001.glb",
  "/assets_folder/models/planets_1gen/planet_crystal_002.glb",

  "/assets_folder/models/planets_1gen/planet_gas_000.glb",
  "/assets_folder/models/planets_1gen/planet_gas_001.glb",
  "/assets_folder/models/planets_1gen/planet_gas_002.glb",

  "/assets_folder/models/planets_1gen/planet_ice_000.glb",
  "/assets_folder/models/planets_1gen/planet_ice_001.glb",
  "/assets_folder/models/planets_1gen/planet_ice_002.glb",

  "/assets_folder/models/planets_1gen/planet_lava_000.glb",
  "/assets_folder/models/planets_1gen/planet_lava_001.glb",
  "/assets_folder/models/planets_1gen/planet_lava_002.glb",

  "/assets_folder/models/planets_1gen/planet_ocean_000.glb",
  "/assets_folder/models/planets_1gen/planet_ocean_001.glb",
  "/assets_folder/models/planets_1gen/planet_ocean_002.glb",
];

export const ASSETS = {
  textures: {
    shipIcon: "/assets_folder/2d/raketa_minify.png",
  },
  models: {
    sun: "/assets_folder/models/Sun.glb",
    ship: "/assets_folder/models/spaceship.glb",
  },

  planetModels: PLANETS_1GEN,

  // удобно резолвить пути, если где-то не указан /
  normalizeUrl(url) {
    const u = String(url ?? "");
    if (!u) return u;
    return u.startsWith("/") ? u : `/${u}`;
  },
};
