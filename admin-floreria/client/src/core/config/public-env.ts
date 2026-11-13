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

// El editor de la web muestra la tienda real dentro de un iframe. En
// producción el panel se sirve en /admin del mismo dominio que la tienda; en
// desarrollo cada uno corre en su propio puerto.
const isHostedUnderStorefront =
  typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
export const STOREFRONT_URL =
  normalizeUrl(import.meta.env.VITE_STOREFRONT_URL) ||
  (isHostedUnderStorefront ? windowOrigin : "http://localhost:5000");
