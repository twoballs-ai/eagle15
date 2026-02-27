const BASE_URL = import.meta.env.BASE_URL || "/";

export function resolveAssetUrl(assetPath) {
  const raw = String(assetPath ?? "").trim();
  if (!raw) return raw;

  if (/^(?:[a-z]+:)?\/\//i.test(raw) || raw.startsWith("data:")) {
    return raw;
  }

  const normalizedPath = raw.replace(/^\/+/, "");
  return new URL(normalizedPath, BASE_URL).toString();
}
