// data/crafting/shipRecipes.js
export const shipRecipes = [
  // ---- Refining / processing ----
  {
    id: "oxygen_compress",
    name: "Сжатый кислород",
    station: "gas_compressor",
    inputs: [{ id: "oxygen", n: 10 }],
    output: { id: "oxygen_compressed", n: 1 },
  },

  {
    id: "iron_ingot",
    name: "Железный слиток",
    station: "smelter",
    inputs: [{ id: "iron_ore", n: 6 }],
    output: { id: "iron_ingot", n: 1 },
  },

  {
    id: "copper_wire",
    name: "Медная проводка",
    station: "fabricator",
    inputs: [{ id: "copper_ore", n: 4 }],
    output: { id: "copper_wire", n: 1 },
  },

  {
    id: "silicon_wafer",
    name: "Кремниевая пластина",
    station: "fabricator",
    inputs: [{ id: "silicon_dust", n: 5 }],
    output: { id: "silicon_wafer", n: 1 },
  },

  {
    id: "polymer_sheet",
    name: "Полимерный лист",
    station: "chem_reactor",
    inputs: [{ id: "polymer_slurry", n: 5 }],
    output: { id: "polymer_sheet", n: 1 },
  },

  // ---- Components ----
  {
    id: "heat_sink",
    name: "Радиатор (Heat Sink)",
    station: "fabricator",
    inputs: [{ id: "iron_ingot", n: 2 }, { id: "silicon_wafer", n: 1 }],
    output: { id: "heat_sink", n: 1 },
  },

  {
    id: "magnetic_coil",
    name: "Магнитная катушка",
    station: "fabricator",
    inputs: [{ id: "copper_wire", n: 2 }, { id: "silicon_wafer", n: 1 }],
    output: { id: "magnetic_coil", n: 1 },
  },

  {
    id: "control_board",
    name: "Плата управления",
    station: "fabricator",
    inputs: [{ id: "silicon_wafer", n: 2 }, { id: "copper_wire", n: 1 }],
    output: { id: "control_board", n: 1 },
  },

  {
    id: "thrust_chamber",
    name: "Камера тяги",
    station: "fabricator",
    inputs: [{ id: "iron_ingot", n: 2 }, { id: "polymer_sheet", n: 1 }],
    output: { id: "thrust_chamber", n: 1 },
  },

  {
    id: "airflow_regulator",
    name: "Регулятор потока",
    station: "fabricator",
    inputs: [{ id: "polymer_sheet", n: 2 }, { id: "control_board", n: 1 }],
    output: { id: "airflow_regulator", n: 1 },
  },

  {
    id: "o2_cartridge",
    name: "Картридж O₂",
    station: "fabricator",
    inputs: [{ id: "oxygen_compressed", n: 1 }, { id: "airflow_regulator", n: 1 }],
    output: { id: "o2_cartridge", n: 1 },
  },

  // ---- Ship modules ----
  {
    id: "thruster_module",
    name: "Двигательный модуль",
    station: "shipyard_bench",
    inputs: [
      { id: "magnetic_coil", n: 2 },
      { id: "thrust_chamber", n: 1 },
      { id: "heat_sink", n: 1 },
    ],
    output: { id: "ship_thruster_module", n: 1 },
  },

  {
    id: "sensor_module",
    name: "Сенсорный модуль",
    station: "shipyard_bench",
    inputs: [
      { id: "control_board", n: 1 },
      { id: "silicon_wafer", n: 1 },
      { id: "copper_wire", n: 1 },
    ],
    output: { id: "ship_sensor_module", n: 1 },
  },

  {
    id: "life_support_module",
    name: "Жизнеобеспечение",
    station: "shipyard_bench",
    inputs: [
      { id: "o2_cartridge", n: 2 },
      { id: "airflow_regulator", n: 1 },
      { id: "control_board", n: 1 },
    ],
    output: { id: "ship_life_support_module", n: 1 },
  },
];
