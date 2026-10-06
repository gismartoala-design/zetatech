const LOCAL_BACKEND_URL = "http://localhost:4000";

declare global {
  interface Window {
    __BACKEND_URL__?: string;
  }
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
}

function readConfiguredBackendUrl() {
  if (typeof window !== "undefined" && window.__BACKEND_URL__) {
    return window.__BACKEND_URL__.replace(/\/+$/, "");
  }

  if (typeof process !== "undefined" && process.env?.VITE_BACKEND_URL) {
    return process.env.VITE_BACKEND_URL.replace(/\/+$/, "");
  }

  return "";
}

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const configuredBackend = readConfiguredBackendUrl();
  if (configuredBackend && path.startsWith("/api/external")) {
    return `${configuredBackend}${path}`;
  }

  if (
    typeof window !== "undefined" &&
    isLocalHost(window.location.hostname) &&
    path.startsWith("/api/external")
  ) {
    return `${LOCAL_BACKEND_URL}${path}`;
  }

  return path;
}
