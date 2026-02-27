const PRICES = {
  oxygen: 8,
  iron_ore: 14,
  copper_ore: 16,
  silicon_dust: 20,
  polymer_slurry: 22,
  oxygen_compressed: 55,
  iron_ingot: 48,
  copper_wire: 62,
  silicon_wafer: 74,
  polymer_sheet: 80,
  heat_sink: 145,
  magnetic_coil: 150,
  control_board: 165,
  thrust_chamber: 158,
  airflow_regulator: 185,
  o2_cartridge: 230,
  ship_thruster_module: 640,
  ship_sensor_module: 590,
  ship_life_support_module: 720,
};

export function getMarketPrice(itemId) {
  return PRICES[itemId] ?? 50;
}

export function listMarketItems() {
  return Object.keys(PRICES);
}
