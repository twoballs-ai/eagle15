const BASE_URL = import.meta.env.BASE_URL || "/";

function getAbsoluteBaseUrl() {
  if (typeof window !== "undefined" && window.location?.href) {
    return new URL(BASE_URL, window.location.href);
  }

  return new URL(BASE_URL, "http://localhost");
}

export function resolveAssetUrl(assetPath) {
  const raw = String(assetPath ?? "").trim();
  if (!raw) return raw;

  if (/^(?:[a-z]+:)?\/\//i.test(raw) || raw.startsWith("data:")) {
    return raw;
  }

  const normalizedPath = raw.replace(/^\/+/, "");
  return new URL(normalizedPath, getAbsoluteBaseUrl()).toString();
}
