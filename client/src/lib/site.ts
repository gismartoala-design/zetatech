import { getPublicAppConfig } from "@/lib/runtime-config";

export const DEFAULT_COMPANY = {
  name: "ZETTATECH",
  email: "ventaszettatech.ec@gmail.com",
  phoneDisplay: "+593 99 482 2367",
  phoneDigits: "593994822367",
  city: "Guayaquil",
  country: "Ecuador",
};

export function getSiteUrl() {
  return getPublicAppConfig().siteUrl;
}

export function getDefaultSeoImage() {
  return `${getSiteUrl()}/opengraph.jpg`;
}

export const DEFAULT_SEO_IMAGE = getDefaultSeoImage();

function normalizePath(path = "/") {
  const rawPath = String(path || "/").trim() || "/";
  const [withoutHash] = rawPath.split("#");
  const [withoutQuery] = withoutHash.split("?");
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const withoutTrailingSlash = withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, "") : withLeadingSlash;

  return withoutTrailingSlash || "/";
}

export function absoluteUrl(path?: string | null): string {
  if (!path || path.startsWith("data:")) {
    return getDefaultSeoImage();
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const siteUrl = getSiteUrl();
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonicalUrl(path = "/"): string {
  const siteUrl = getSiteUrl();
  return `${siteUrl}${normalizePath(path)}`;
}
