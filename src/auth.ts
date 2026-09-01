export function getToken() {
  return localStorage.getItem("accessToken") ?? "";
}

export function decodeJwt<T = unknown>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload)) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload?.exp) return true;              // si no hay exp, trátalo como inválido
  const now = Date.now() / 1000;
  return payload.exp <= now;
}

/** Construye la URL del login con el redirect a la URL actual */
export function buildLoginRedirectURL(currentHref: string = window.location.pathname + window.location.search) {
  return `/?redirect=${encodeURIComponent(currentHref)}`;
}
