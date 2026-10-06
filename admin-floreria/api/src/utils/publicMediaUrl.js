function normalizeUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/g, "");
}

function normalizePath(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function unwrapImageProxyUrl(value = "") {
  const source = String(value || "").trim();
  if (!source) return "";

  try {
    if (source.startsWith("/image-proxy?")) {
      const parsed = new URL(source, "https://difiori.com");
      return String(parsed.searchParams.get("url") || "").trim();
    }

    const parsed = new URL(source);
    if (parsed.pathname === "/image-proxy") {
      return String(parsed.searchParams.get("url") || "").trim();
    }
  } catch {
    return "";
  }

  return "";
}

function getMediaBaseCandidates() {
  const values = [
    process.env.MINIO_PUBLIC_URL,
    process.env.FTP_PUBLIC_URL,
    process.env.APP_PUBLIC_ASSET_URL,
    process.env.ASSET_BASE_URL,
    process.env.CLIENT_URL,
    process.env.STORE_URL,
    process.env.APP_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.BACKEND_URL,
  ];

  return values.map((value) => normalizeUrl(value)).filter(Boolean);
}

function resolvePublicMediaUrl(source) {
  const value = String(source || "").trim();
  if (!value) return "";
  if (value.startsWith("data:image/")) return value;
  const unwrappedProxyUrl = unwrapImageProxyUrl(value);
  if (unwrappedProxyUrl) return unwrappedProxyUrl;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const normalizedPath = normalizePath(value);
  const candidates = getMediaBaseCandidates();

  for (const baseUrl of candidates) {
    try {
      return new URL(normalizedPath, `${baseUrl}/`).toString();
    } catch {
      continue;
    }
  }

  return normalizedPath;
}

module.exports = {
  resolvePublicMediaUrl,
};
