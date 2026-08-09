// src/data/content/npc/captainNames.js

export const CAPTAIN_PREFIXES = [
  "Red", "Black", "Iron", "Silent", "Mad", 
  "Cold", "Swift", "Dark", "Star", "Void",
  "Storm", "Ghost", "Neon", "Cyber", "Quantum"
];

export const CAPTAIN_SUFFIXES = [
  "Viper", "Wolf", "Hawk", "Fang", "Blade",
  "Storm", "Ghost", "Reaper", "Drake", "Eye",
  "Rider", "Striker", "Hunter", "Warden", "Breaker"
];

export function generateCaptainName(rng) {
  const prefix = CAPTAIN_PREFIXES[Math.floor(rng() * CAPTAIN_PREFIXES.length)];
  const suffix = CAPTAIN_SUFFIXES[Math.floor(rng() * CAPTAIN_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}
