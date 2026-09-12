/** Construye la URL del login con el redirect a la URL actual */
export function buildLoginRedirectURL(currentHref: string = window.location.pathname + window.location.search) {
  return `/?redirect=${encodeURIComponent(currentHref)}`;
}

export function safeInternalRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith("/admin")
      ? `${url.pathname}${url.search}${url.hash}`
      : "/admin";
  } catch {
    return "/admin";
  }
}
