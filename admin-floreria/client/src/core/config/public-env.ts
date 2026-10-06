function normalizeUrl(value?: string) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.replace(/\/$/, "") : "";
}

function ensureApiSuffix(value: string) {
  return value.endsWith("/api") ? value : `${value}/api`;
}

const rawApiUrl = normalizeUrl(import.meta.env.VITE_API_URL);
const rawBackendUrl = normalizeUrl(import.meta.env.VITE_BACKEND_URL);
const windowOrigin =
  typeof window !== "undefined" ? normalizeUrl(window.location.origin) : "";

export const ADMIN_API_URL = ensureApiSuffix(rawApiUrl || rawBackendUrl || `${windowOrigin}/api`);
export const ADMIN_BACKEND_URL = rawBackendUrl || rawApiUrl || `${windowOrigin}/api`;
export const ADMIN_IMAGE_URL = normalizeUrl(import.meta.env.VITE_URL_IMG) || windowOrigin;
