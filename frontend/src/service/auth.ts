const ACCESS_TOKEN_KEY = "access_token";
const USER_ID_KEY = "user_id";

type JwtPayload = {
  exp?: number;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return atob(padded);
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAuthSession(accessToken: string, userId?: string | null) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  const decoded = decodeBase64Url(payload);
  if (!decoded) {
    return null;
  }

  try {
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  const expiresAtMs = payload.exp * 1000;
  return expiresAtMs <= Date.now() + skewSeconds * 1000;
}

export function getValidStoredToken(): string | null {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }

  return token;
}
