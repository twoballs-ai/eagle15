export function createFileSink({ name = "gltrace", format = "text" } = {}) {
  const rows = [];
  const t0 = performance.now();

  function push(obj) {
    rows.push(obj);
  }

  function download() {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${name}-${stamp}.${format === "json" ? "json" : "log"}`;

    let payload = "";
    if (format === "json") {
      payload = JSON.stringify(rows, null, 2);
    } else {
      payload = rows.map(r => {
        const t = String(r.t ?? "").padStart(8, " ");
        const scope = r.scope ? `[${r.scope}]` : "";
        const op = r.op ? r.op : "";
        const msg = r.msg ? r.msg : "";
        const data = r.data ? ` ${safeStringify(r.data)}` : "";
        return `${t}ms ${scope} ${op} ${msg}${data}`.trim();
      }).join("\n");
    }

    const blob = new Blob([payload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function now() { return +(performance.now() - t0).toFixed(2); }

  return { push, download, now, rows };
}

function safeStringify(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}
