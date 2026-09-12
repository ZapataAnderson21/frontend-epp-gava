import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { buildLoginRedirectURL } from "./auth";
import { userApi } from "./data/apiUrl";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    setAllowed(null);
    fetch(`${userApi}me`, {
      credentials: "include",
    })
      .then((response) => {
        if (cancelled) return;
        setAllowed(response.ok);
      })
      .catch(() => {
        if (!cancelled) {
          setAllowed(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.key]);

  if (allowed === null) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-gray-600">
        Validando sesion...
      </div>
    );
  }

  if (!allowed) {
    const to = buildLoginRedirectURL(location.pathname + location.search);
    localStorage.removeItem("user");
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
