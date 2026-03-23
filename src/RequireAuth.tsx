import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { buildLoginRedirectURL, getToken, isTokenExpired } from "./auth";
import { userApi } from "./data/apiUrl";

type ValidateTokenResponse =
  | boolean
  | {
      data?: boolean | { valid?: boolean };
    };

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const token = getToken();
  const tokenInvalid = !token || isTokenExpired(token);

  useEffect(() => {
    if (tokenInvalid) {
      setAllowed(false);
      return;
    }

    let cancelled = false;

    fetch(`${userApi}validateToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token }),
    })
      .then((response) => response.json())
      .then((json: ValidateTokenResponse) => {
        if (cancelled) return;

        let isValid = false;

        if (typeof json === "boolean") {
          // Backward compatibility: old contract returned "isBlacklisted".
          isValid = !json;
        } else if (typeof json?.data === "boolean") {
          // Backward compatibility: wrapped boolean.
          isValid = !json.data;
        } else if (typeof json?.data === "object" && json.data !== null) {
          isValid = !!json.data.valid;
        }

        setAllowed(isValid);
      })
      .catch(() => {
        if (!cancelled) {
          setAllowed(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.key, token, tokenInvalid]);

  if (tokenInvalid) {
    const to = buildLoginRedirectURL(location.pathname + location.search);
    return <Navigate to={to} replace />;
  }

  if (allowed === null) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-gray-600">
        Validando sesion...
      </div>
    );
  }

  if (!allowed) {
    const to = buildLoginRedirectURL(location.pathname + location.search);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
