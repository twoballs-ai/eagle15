const BASE_URL = import.meta.env.BASE_URL || "/";
const BUNDLED_ASSET_URLS = import.meta.glob("./**/*", {
  eager: true,
  import: "default",
  query: "?url",
});

function getAbsoluteBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(BASE_URL, window.location.origin);
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

  const relativePath = normalizedPath
    .replace(/^src\//, "")
    .replace(/^assets_folder\//, "");
  const bundledAssetUrl = BUNDLED_ASSET_URLS[`./${relativePath}`];
  if (bundledAssetUrl) return bundledAssetUrl;

  return new URL(normalizedPath, getAbsoluteBaseUrl()).toString();
}
