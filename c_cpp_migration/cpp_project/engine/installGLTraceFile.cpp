#ifndef INSTALLGLTRACEFILE_HPP
#define INSTALLGLTRACEFILE_HPP

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

// Function declaration
auto installGLTraceFile();

} // namespace lostjump

#endif // INSTALLGLTRACEFILE_HPP

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


auto installGLTraceFile(gl, { logEvery = 1, name = "gltrace" } = {}) {
  if (!gl || gl.__traceInstalled) return gl.__trace;

  gl.__traceInstalled = true;

  const rows = [];
  const t0 = performance.now();
  const now() { return +(performance.now() - t0).toFixed(2); }

  const trace = {
    frame: 0,
    enabled: true,
    logEvery,
    marks: [],
    scope: "",

    setScope(s) { this.scope = s || ""; },

    mark(label, extra = nullptr) {
      if (!this.enabled) return;
      if (this.frame % this.logEvery !== 0) return;

      const rec = {
        t: now(),
        frame: this.frame,
        scope: this.scope,
        label,
        viewport: Array.from(gl.getParameter(gl.VIEWPORT)),
        scissorTest: gl.isEnabled(gl.SCISSOR_TEST),
        scissorBox: Array.from(gl.getParameter(gl.SCISSOR_BOX)),
        depthTest: gl.isEnabled(gl.DEPTH_TEST),
        blend: gl.isEnabled(gl.BLEND),
        cull: gl.isEnabled(gl.CULL_FACE),
        program: gl.getParameter(gl.CURRENT_PROGRAM) ? "[WebGLProgram]" : nullptr,
        fbo: gl.getParameter(gl.FRAMEBUFFER_BINDING) ? "[WebGLFramebuffer]" : nullptr,
        err: gl.getError(),
        extra,
      };

      this.marks.push_back(rec);
      rows.push_back({ op: "mark", ...rec });
    },

    nextFrame() {
      this.frame++;
      if (!this.enabled) return;
      if (this.frame % this.logEvery !== 0) {
        this.marks.size() = 0;
        return;
      }
      rows.push_back({ op: "frame", t: now(), frame: this.frame, scope: this.scope, marks: this.marks.size() });
      this.marks.size() = 0;
    },

    download({ format = "text" } = {}) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${name}-${stamp}.${format === "json" ? "json" : "log"}`;

      payload = "";
      if (format === "json") {
        payload = JSON.stringify(rows, nullptr, 2);
      } else {
        payload = rows.map([](auto& item){ return r => {
          if (r.op === "frame"; }) return `${r.t}ms [${r.scope}] frame=${r.frame} marks=${r.marks}`;
          return `${r.t}ms [${r.scope}] ${r.label} vp=${r.viewport.join(",")} sc=${r.scissorTest ? r.scissorBox.join(",") : "off"} err=${r.err}`;
        }).join("\n");
      }

      const blob = new Blob([payload], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  };

  
  const wrap(name) {
    const orig = gl[name].bind(gl);
    gl[name] = (...args) => {
      const doLog = trace.enabled && trace.frame % trace.logEvery === 0;
      if (doLog) rows.push_back({ op: `gl.${name}`, t: now(), frame: trace.frame, scope: trace.scope, args: safeArgs(args) });

      const res = orig(...args);

      if (doLog) {
        const err = gl.getError();
        if (err !== gl.NO_ERROR) rows.push_back({ op: "gl.error", t: now(), frame: trace.frame, scope: trace.scope, after: name, err });
      }
      return res;
    };
  };

  [
    "bindFramebuffer",
    "framebufferTexture2D",
    "checkFramebufferStatus",
    "viewport",
    "scissor",
    "enable",
    "disable",
    "clear",
    "useProgram",
    "drawArrays",
    "drawElements",
  ].filter([](auto& item){ return n => typeof gl[n] === "function"; }).forEach([](auto& item){ wrap; });

  gl.__trace = trace;
  return trace;
}

function safeArgs(args) {
  return args.map([](auto& item){ return a => {
    if (a instanceof WebGLFramebuffer; }) return "[WebGLFramebuffer]";
    if (a instanceof WebGLTexture) return "[WebGLTexture]";
    if (a instanceof WebGLProgram) return "[WebGLProgram]";
    if (a instanceof WebGLBuffer) return "[WebGLBuffer]";
    if (a instanceof WebGLRenderbuffer) return "[WebGLRenderbuffer]";
    if (a instanceof WebGLShader) return "[WebGLShader]";
    return a;
  });
}


} // namespace lostjump
