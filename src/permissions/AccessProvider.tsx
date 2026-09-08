import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { userApi } from "../data/apiUrl";

export const permissionsApi = userApi.replace(/user\/$/, "permissions/");
const AccessContext = createContext({
  permissions: [] as string[],
  loading: true,
  error: "",
  can: (_permission: string): boolean => false,
  refresh: () => {},
});

export function AccessProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const token = localStorage.getItem("accessToken");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const verifiedToken = useRef<string | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    window.addEventListener("focus", refresh);
    window.addEventListener("permissions-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("permissions-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);
  useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    if (!token || !pathname.startsWith("/admin")) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    if (verifiedToken.current !== token) {
      setLoading(true);
      setPermissions([]);
    }
    fetch(`${permissionsApi}me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("No se pudieron verificar tus permisos.");
        return response.json() as Promise<{ data: string[] }>;
      })
      .then((result) => {
        if (current === generation.current) {
          verifiedToken.current = token;
          setPermissions(result.data);
          setError("");
        }
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setPermissions([]);
          setError(
            caught instanceof Error
              ? caught.message
              : "Error al verificar permisos",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, pathname, revision]);
  const value = useMemo(
    () => ({
      permissions,
      loading,
      error,
      can: (permission: string) => permissions.includes(permission),
      refresh,
    }),
    [permissions, loading, error, refresh],
  );
  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  );
}
export const useAccess = () => useContext(AccessContext);

export function moduleForPath(path: string): string | null {
  if (/\/projects\/[^/]+\/purchase-orders/.test(path)) return "orders";
  const projectTabs: Record<string, string> = {
    "petty-cash": "cash",
    incomes: "incomes",
    payrolls: "payroll",
    requests: "requests",
    inventory: "inventory",
    emergencies: "emergencies",
    progress: "progress",
  };
  const tab = path.match(/\/projects\/[^/]+\/([^/]+)/)?.[1];
  if (tab && projectTabs[tab]) return projectTabs[tab];
  const top = path.split("/")[2] ?? "";
  return (
    (
      {
        "": "dashboard",
        dashboard: "dashboard",
        projects: "projects",
        suppliers: "suppliers",
        clients: "clients",
        resources: "resources",
        quotations: "quotations",
        requests: "requests",
        inventory: "inventory",
        elements: "inventory",
        workers: "workers",
        payrolls: "payroll",
        "worker-monthly-evaluations": "evaluations",
        "document-expirations": "documents",
        emergencies: "emergencies",
        users: "users",
        permissions: "roles",
      } as Record<string, string>
    )[top] ?? null
  );
}

export function RouteAccess({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { can, loading, error, refresh } = useAccess();
  const module = moduleForPath(pathname);
  const action = /\/(new|edit)(\/|$)/.test(pathname) ? "manage" : "view";
  if (loading)
    return (
      <div className="p-8 text-slate-500" role="status">
        Verificando permisos…
      </div>
    );
  if (!module || !can(`${module}.${action}`))
    return (
      <div className="p-8 text-slate-600">
        <h1 className="text-xl font-bold">Acceso restringido</h1>
        <p className="mt-2">
          {error || "Tu rol no tiene acceso a esta sección."}
        </p>
        {error && (
          <button
            type="button"
            onClick={refresh}
            className="mt-3 text-blue-700"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  return <>{children}</>;
}

export function useModuleAction(action: string, explicit?: string) {
  const { pathname } = useLocation();
  const { can } = useAccess();
  const module = moduleForPath(pathname);
  return can(explicit ?? `${module}.${action}`);
}
