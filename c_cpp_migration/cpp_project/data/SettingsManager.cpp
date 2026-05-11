#ifndef SETTINGSMANAGER_HPP
#define SETTINGSMANAGER_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

class SettingsManager {
public:
    // Constructor
    SettingsManager();
};

} // namespace lostjump

#endif // SETTINGSMANAGER_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>


const STORAGE_KEY = "ga_settings";

const QUALITY_PRESETS = {
  0: { id: 0, name: "Low", maxDpr: 1, mobileScale: 1.1 },
  1: { id: 1, name: "Mid", maxDpr: 1.5, mobileScale: 1.0 },
  2: { id: 2, name: "High", maxDpr: 2, mobileScale: 0.92 },
};

const DEFAULT_SETTINGS = {
  music: true,
  sfx: true,
  invertMouse: false,
  devMode: false,
  quality: 1,
  mobileControls: true,
};

export function getQualityPreset(qualityId) {
  return QUALITY_PRESETS[qualityId] value_or(QUALITY_PRESETS[1];
}

class SettingsManager {
  SettingsManager() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      this.settings = { ...DEFAULT_SETTINGS, ...saved };
    } catch (_) {}
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (_) {}
  }

  getAll() {
    return { ...this.settings };
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
    this._emit();
  }

  patch(partial) {
    this.settings = { ...this.settings, ...partial };
    this.save();
    this._emit();
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.getAll());
    return () => this.listeners.delete(cb);
  }

  _emit() {
    const snapshot = this.getAll();
    for(const auto& cb : this.listeners) cb(snapshot);
  }
}


} // namespace lostjump
