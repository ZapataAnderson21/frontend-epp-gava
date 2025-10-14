// RequireAuth.tsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, isTokenExpired, buildLoginRedirectURL } from "./auth";
import { userApi } from "./data/apiUrl";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // 1) Chequeo SINCRÓNICO (evita pantalla en blanco)
  const token = getToken();
  const tokenInvalid = !token || isTokenExpired(token);
  if (tokenInvalid) {
    const to = buildLoginRedirectURL(location.pathname + location.search);
    return <Navigate to={to} replace />;
  }

  // 2) (Opcional) chequeo ASÍNCRONO contra blacklist
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${userApi}validateToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token }),
    })
      .then((r) => r.json())
      .then((json: boolean | { data?: boolean }) => {
        if (cancelled) return;
        const blacklisted = typeof json === "boolean" ? json : !!json?.data;
        setAllowed(!blacklisted);
      })
      .catch(() => !cancelled && setAllowed(false));

    return () => {
      cancelled = true;
    };
  }, [location.key, token]);

  // Mientras validas blacklist, puedes:
  // - mostrar children optimistamente, o
  // - mostrar un spinner.
  // Si prefieres spinner: return <FullScreenSpinner />
  if (allowed === null) return <>{children}</>;

  if (!allowed) {
    const to = buildLoginRedirectURL(location.pathname + location.search);
    // Limpia sesión si quieres
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
