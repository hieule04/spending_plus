const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
const isLocalFrontendDev = /^(https?:\/\/)(localhost|127\.0\.0\.1):5173$/i.test(currentOrigin);

export const API_BASE_URL =
  configuredApiUrl || (isLocalFrontendDev ? "http://127.0.0.1:8000" : "");
