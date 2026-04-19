const DEFAULT_API_PATH = "/api";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const devDefaultUrl = "http://localhost:8000";
  const runtimeOverride = typeof window !== "undefined"
    ? window.localStorage.getItem("userSettings")
    : null;

  if (runtimeOverride) {
    try {
      const parsed = JSON.parse(runtimeOverride) as { apiUrl?: string };
      if (parsed.apiUrl) {
        return normalizeUrl(parsed.apiUrl);
      }
    } catch {
      // Ignore invalid local storage data and fall back to env config.
    }
  }

  const configuredUrl = import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  return import.meta.env.DEV ? devDefaultUrl : DEFAULT_API_PATH;
}

export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || "";
}

export function getSupabasePublishableKey(): string {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
}

export function hasSupabaseAuthConfig(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function getSiteUrl(): string {
  const configuredUrl = import.meta.env.VITE_SITE_URL;
  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    return normalizeUrl(window.location.origin);
  }

  return "http://localhost:3000";
}
