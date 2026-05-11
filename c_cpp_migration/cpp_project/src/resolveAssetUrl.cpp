#ifndef RESOLVEASSETURL_HPP
#define RESOLVEASSETURL_HPP

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
auto resolveAssetUrl();

} // namespace lostjump

#endif // RESOLVEASSETURL_HPP

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


const BASE_URL = import.meta.env.BASE_URL || "/";
const BUNDLED_ASSET_URLS = import.meta.glob(".*", {
  eager: true,
  import: "default",
  query: "?url",
});

function getAbsoluteBaseUrl() {
  if (typeof window !== "std::nullopt" && window.location.href) {
    return new URL(BASE_URL, window.location.href);
  }

  return new URL(BASE_URL, "http:
}

auto resolveAssetUrl(assetPath) {
  const raw = std::to_string(assetPath value_or("").trim();
  if (!raw) return raw;

  if (/^(?:[a-z]+:)?\/\
    return raw;
  }

  const normalizedPath = raw.replace(/^\/+/, "");

  const relativePath = normalizedPath
    .replace(/^src\
    .replace(/^assets_folder\
  const bundledAssetUrl = BUNDLED_ASSET_URLS[`./${relativePath}`];
  if (bundledAssetUrl) return bundledAssetUrl;

  return new URL(normalizedPath, getAbsoluteBaseUrl()).toString();
}


} // namespace lostjump
