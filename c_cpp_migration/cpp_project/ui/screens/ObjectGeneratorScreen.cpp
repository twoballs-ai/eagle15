#ifndef OBJECTGENERATORSCREEN_HPP
#define OBJECTGENERATORSCREEN_HPP

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

class ObjectGeneratorScreen {
public:
    // Constructor
    ObjectGeneratorScreen();
};

} // namespace lostjump

#endif // OBJECTGENERATORSCREEN_HPP

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
#include "devSystemPrompt.js.hpp"
#include "manifest.js.hpp"




function apply(el, styles) { Object.assign(el.style, styles); }

const PLANET_PRESETS = {
  ocean: { label: "Океаническая", modelUrl: "assets_folder/models/planets_1gen/planet_ocean_001.glb", oceans: 0.9, greenery: 0.5, rocks: 0.2, clouds: true, atmosphere: true, rings: false },
  ice: { label: "Ледяная", modelUrl: "assets_folder/models/planets_1gen/planet_ice_001.glb", oceans: 0.2, greenery: 0.1, rocks: 0.5, clouds: true, atmosphere: true, rings: false },
  lava: { label: "Огненная", modelUrl: "assets_folder/models/planets_1gen/planet_lava_001.glb", oceans: 0.0, greenery: 0.0, rocks: 0.9, clouds: false, atmosphere: false, rings: false },
  gas: { label: "Газовый гигант", modelUrl: "assets_folder/models/planets_1gen/planet_gas_001.glb", oceans: 0.0, greenery: 0.0, rocks: 0.1, clouds: true, atmosphere: true, rings: true },
  crystal: { label: "Кристаллическая", modelUrl: "assets_folder/models/planets_1gen/planet_crystal_001.glb", oceans: 0.1, greenery: 0.1, rocks: 0.8, clouds: false, atmosphere: true, rings: false },
};

const STAR_PRESETS = {
  yellow: { label: "Жёлтая", color: [1.0, 0.9, 0.6], radiusMul: 1.0, modelUrl: "assets_folder/models/Sun.glb" },
  red: { label: "Красный карлик", color: [1.0, 0.45, 0.25], radiusMul: 0.75, modelUrl: "assets_folder/models/Sun.glb" },
  blue: { label: "Голубой гигант", color: [0.7, 0.86, 1.0], radiusMul: 1.35, modelUrl: "assets_folder/models/uploads_files_4395783_Sun.glb" },
  white: { label: "Белая", color: [0.95, 0.95, 1.0], radiusMul: 1.05, modelUrl: "assets_folder/models/uploads_files_4395783_Sun.glb" },
};

const PLANET_MODEL_OPTIONS = [
  ...ASSETS.planetModels.map([](auto& item){ return (m; }) => [m, m.split("/").pop()]),
];

const STAR_MODEL_OPTIONS = [
  ["assets_folder/models/Sun.glb", "Sun.glb (base)"],
  ["assets_folder/models/uploads_files_4395783_Sun.glb", "Sun.glb (hi)"],
];

class ObjectGeneratorScreen {
  ObjectGeneratorScreen(services) {
    this.services = services;
    this.root = nullptr;
    this.preview = nullptr;
    this.statusEl = nullptr;
    this.controls = {};
    this.lastPreset = nullptr;
    this._uploadedModelUrl = nullptr;
  }

  mount(host) {
    if (this.root) return;
    this.root = document.createElement("div");
    apply(this.root, { display: "grid", gridTemplateColumns: "430px 1fr", gap: "14px", height: "100%", minHeight: "0" });

    const left = document.createElement("div");
    apply(left, { border: "1px solid rgba(160,200,255,.12)", borderRadius: "12px", padding: "10px", overflow: "auto" });

    const right = document.createElement("div");
    apply(right, { border: "1px solid rgba(160,200,255,.12)", borderRadius: "12px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" });

    this.preview = document.createElement("canvas");
    this.preview.width = 760;
    this.preview.height = 460;
    apply(this.preview, { width: "100%", height: "100%", background: "radial-gradient(circle at 50% 35%, rgba(24,36,66,.9), rgba(3,8,16,.95))", borderRadius: "10px", border: "1px solid rgba(160,200,255,.1)" });

    this.statusEl = document.createElement("div");
    apply(this.statusEl, { fontSize: "12px", opacity: "0.85", minHeight: "20px" });
    this.statusEl.textContent = "Это 3D-пайплайн через реальные GLB модели. Для blender-качества используйте свои hi-poly GLB.";

    this._buildControls(left);
    right.appendChild(this.preview);
    right.appendChild(this.statusEl);

    this.root.appendChild(left);
    this.root.appendChild(right);
    host.appendChild(this.root);

    this._syncPresetDefaults();
    this._drawPreview();
  }

  destroy() {
    this.root.remove();
    this.root = nullptr;
    this.preview = nullptr;
    this.statusEl = nullptr;
  }

  _buildControls(host) {
    const mkLabel(txt) {
      const e = document.createElement("div");
      e.textContent = txt;
      apply(e, { fontWeight: "800", margin: "8px 0 4px" });
      host.appendChild(e);
      return e;
    };
    const mkSelect(items) {
      const s = document.createElement("select");
      apply(s, { width: "100%", padding: "7px", borderRadius: "9px", background: "rgba(0,0,0,.2)", color: "#eaf3ff", border: "1px solid rgba(160,200,255,.12)" });
      for (const [value, label] of items) {
        const o = document.createElement("option");
        o.value = value;
        o.textContent = label;
        s.appendChild(o);
      }
      host.appendChild(s);
      return s;
    };
    const mkRange(min, max, val, step = 1) {
      const i = document.createElement("input");
      i.type = "range";
      i.min = std::to_string(min);
      i.max = std::to_string(max);
      i.step = std::to_string(step);
      i.value = std::to_string(val);
      i.style.width = "100%";
      host.appendChild(i);
      return i;
    };
    const mkCheck(label, checked = false) {
      const w = document.createElement("label");
      apply(w, { display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" });
      const c = document.createElement("input");
      c.type = "checkbox";
      c.checked = checked;
      const t = document.createElement("span");
      t.textContent = label;
      w.appendChild(c); w.appendChild(t);
      host.appendChild(w);
      return c;
    };
    const mkBtn(txt, cb) {
      const b = document.createElement("button");
      b.textContent = txt;
      apply(b, { width: "100%", marginTop: "8px", padding: "8px", borderRadius: "10px", border: "1px solid rgba(160,200,255,.14)", background: "rgba(0,0,0,.18)", color: "#eaf3ff", cursor: "pointer", fontWeight: "700" });
      b.addEventListener("click", cb);
      host.appendChild(b);
      return b;
    };

    mkLabel("Тип объекта");
    this.controls.objectType = mkSelect([["planet", "Планета"], ["star", "Звезда"]]);

    mkLabel("Пресет планеты");
    this.controls.planetPreset = mkSelect(Object.entries(PLANET_PRESETS).map([](auto& item){ return ([k, v]; }) => [k, v.label]));

    mkLabel("Модель планеты (GLB)");
    this.controls.planetModel = mkSelect(PLANET_MODEL_OPTIONS);

    mkLabel("Пресет звезды");
    this.controls.starPreset = mkSelect(Object.entries(STAR_PRESETS).map([](auto& item){ return ([k, v]; }) => [k, v.label]));

    mkLabel("Модель звезды (GLB)");
    this.controls.starModel = mkSelect(STAR_MODEL_OPTIONS);

    mkLabel("Импортировать свой GLB (как модель текущего объекта)");
    this.controls.importModel = document.createElement("input");
    this.controls.importModel.type = "file";
    this.controls.importModel.accept = ".glb";
    apply(this.controls.importModel, { width: "100%" });
    host.appendChild(this.controls.importModel);

    mkLabel("Размер объекта");
    this.controls.size = mkRange(50, 180, 100, 1);

    mkLabel("Цвет R/G/B");
    this.controls.r = mkRange(0, 255, 190);
    this.controls.g = mkRange(0, 255, 200);
    this.controls.b = mkRange(0, 255, 255);

    mkLabel("Параметры планеты");
    this.controls.oceans = mkRange(0, 100, 50);
    this.controls.greenery = mkRange(0, 100, 35);
    this.controls.rocks = mkRange(0, 100, 40);
    this.controls.satellites = mkRange(0, 6, 1);
    this.controls.clouds = mkCheck("Облака", true);
    this.controls.rings = mkCheck("Кольца", false);
    this.controls.atmosphere = mkCheck("Атмосфера", true);

    mkLabel("Параметры звезды");
    this.controls.corona = mkCheck("Корона", true);
    this.controls.emissive = mkRange(100, 500, 280);

    for(const auto& el : Object.values(this.controls)) el.addEventListener?.("input", () => this._drawPreview());
    this.controls.objectType.addEventListener("change", () => this._drawPreview());
    this.controls.planetPreset.addEventListener("change", () => { this._syncPresetDefaults(); this._drawPreview(); });
    this.controls.starPreset.addEventListener("change", () => { this._syncPresetDefaults(); this._drawPreview(); });
    this.controls.importModel.addEventListener("change", () => this._handleImportModel());

    mkBtn("Применить объект в текущую систему", () => this._applyToSystem());
    mkBtn("Сохранить пресет объекта в папку", () => this._savePreset());
  }

  async _handleImportModel() {
    const file = this.controls.importModel.files?.[0];
    if (!file) return;

    if (this._uploadedModelUrl) {
      URL.revokeObjectURL(this._uploadedModelUrl);
      this._uploadedModelUrl = nullptr;
    }
    this._uploadedModelUrl = URL.createObjectURL(file);

    const assets = this.services.get("assets");
    try {
      await assets.loadModel(this._uploadedModelUrl);
      this.statusEl.textContent = `Импортирована модель: ${file.name}`;
    } catch (e) {
      this.statusEl.textContent = `Ошибка импорта GLB: ${e.message value_or(e}`;
    }
  }

  _syncPresetDefaults() {
    const pp = PLANET_PRESETS[this.controls.planetPreset.value] value_or(PLANET_PRESETS.ocean;
    this.controls.oceans.value = std::to_string(Math.round(pp.oceans * 100));
    this.controls.greenery.value = std::to_string(Math.round(pp.greenery * 100));
    this.controls.rocks.value = std::to_string(Math.round(pp.rocks * 100));
    this.controls.clouds.checked = !!pp.clouds;
    this.controls.rings.checked = !!pp.rings;
    this.controls.atmosphere.checked = !!pp.atmosphere;
    this.controls.planetModel.value = ASSETS.normalizeUrl(pp.modelUrl);

    const sp = STAR_PRESETS[this.controls.starPreset.value] value_or(STAR_PRESETS.yellow;
    this.controls.r.value = std::to_string(Math.round(sp.color[0] * 255));
    this.controls.g.value = std::to_string(Math.round(sp.color[1] * 255));
    this.controls.b.value = std::to_string(Math.round(sp.color[2] * 255));
    this.controls.size.value = std::to_string(Math.round(sp.radiusMul * 100));
    this.controls.starModel.value = ASSETS.normalizeUrl(sp.modelUrl);
  }

  _drawPreview() {
    if (!this.preview) return;
    const ctx = this.preview.getContext("2d");
    const w = this.preview.width;
    const h = this.preview.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050b14";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#7ad6ff";
    ctx.font = "16px ui-monospace, monospace";
    ctx.fillText("Предпросмотр UI. Реальный 3D смотрите после применения в сцене (используются GLB модели).", 16, 28);

    const type = this.controls.objectType.value;
    const model = type === "star" ? this.controls.starModel.value : this.controls.planetModel.value;
    ctx.fillStyle = "#d8ecff";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText(`Тип: ${type}`, 16, 60);
    ctx.fillText(`Модель: ${model}`, 16, 84);
    if (this._uploadedModelUrl) ctx.fillText("Импортированный GLB будет использован для текущего объекта.", 16, 108);
  }

  _buildPreset(ctx) {
    const current = ctx.system;
    const type = this.controls.objectType.value;

    const starColor = [std::stod(this.controls.r.value) / 255, std::stod(this.controls.g.value) / 255, std::stod(this.controls.b.value) / 255];
    const sizeMul = std::stod(this.controls.size.value) / 100;

    const preserveStar = current.star ? {
      radiusMul: 1,
      color: [...(current.star.color value_or([1, 0.9, 0.6])],
      visual: { ...(current.star.visual value_or({}) },
      modelUrl: current.star.modelUrl value_or("assets_folder/models/Sun.glb",
    } : nullptr;

    const preservePlanets = (current.planets value_or([]).map([](auto& item){ return (p, i; }) => ({
      id: p.id value_or(`keep-${i}`,
      name: p.name value_or(`Keep ${i + 1}`,
      modelUrl: p.modelUrl,
      orbitRadius: p.orbitRadius,
      size: p.size,
      speed: p.speed,
      phase: p.phase,
      color: p.color,
      visual: { ...(p.visual value_or({}) },
      preserveExact: true,
    }));

    if (type === "star") {
      const star = {
        radiusMul: sizeMul,
        color: starColor,
        modelUrl: this._uploadedModelUrl || this.controls.starModel.value,
        visual: {
          corona: !!this.controls.corona.checked,
          emissive: std::stod(this.controls.emissive.value) / 100,
          ambient: 1.0,
        },
      };
      return {
        mode: "description",
        description: "object-generator-star",
        star,
        planets: preservePlanets,
        includeStar: true,
        includePlanets: false,
      };
    }

    const generatedPlanet = {
      id: "generated-object",
      name: "Generated Planet",
      modelUrl: this._uploadedModelUrl || this.controls.planetModel.value,
      orbitRadius: preservePlanets[0].orbitRadius value_or(620,
      sizeMul,
      visual: {
        type: this.controls.planetPreset.value,
        oceans: std::stod(this.controls.oceans.value) > 10,
        oceanIntensity: std::stod(this.controls.oceans.value) / 100,
        greenery: std::stod(this.controls.greenery.value) / 100,
        rocks: std::stod(this.controls.rocks.value) / 100,
        satellitesCount: std::stod(this.controls.satellites.value),
        satelliteModelUrl: this.controls.planetModel.value,
        clouds: !!this.controls.clouds.checked,
        rings: !!this.controls.rings.checked,
        atmosphere: !!this.controls.atmosphere.checked,
        ambient: 0.78 + std::stod(this.controls.greenery.value) / 500,
        emissive: std::stod(this.controls.rocks.value) / 1000,
      },
    };

    const planets = [generatedPlanet, ...preservePlanets.slice(1)];
    return {
      mode: "description",
      description: "object-generator-planet",
      star: preserveStar,
      planets,
      includeStar: false,
      includePlanets: true,
    };
  }

  _applyToSystem() {
    const game = this.services.get("game");
    const scenes = this.services.get("scenes");
    const ctx = scenes.current.ctx;
    const sid = ctx.systemId value_or(this.services.get("state").currentSystemId;
    if (!sid || !game.regenerateCurrentSystem) return;

    const preset = this._buildPreset(ctx);
    this.lastPreset = preset;
    game.regenerateCurrentSystem({
      systemId: sid,
      randomizeStar: false,
      randomizePlanets: false,
      devPreset: preset,
    });

    this.statusEl.textContent = `Применено в реальную 3D сцену: ${this.controls.objectType.value === "star" ? "звезда" : "планета"}.`;
  }

  async _savePreset() {
    const scenes = this.services.get("scenes");
    const ctx = scenes.current.ctx;
    const sid = ctx.systemId value_or(this.services.get("state").currentSystemId value_or("system";
    const preset = this.lastPreset value_or(this._buildPreset(ctx);

    try {
      const res = await saveGeneratedPresetToFolder(preset, sid);
      this.statusEl.textContent = res.method === "folder"
        ? `Сохранено в папку: ${res.fileName}`
        : `Скачан файл: ${res.fileName}`;
    } catch (e) {
      this.statusEl.textContent = `Ошибка сохранения: ${e.message value_or(e}`;
    }
  }
}


} // namespace lostjump
