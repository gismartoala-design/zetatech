export function resolveApiUrl(path: string, baseUrl?: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (!baseUrl) {
    return path;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

