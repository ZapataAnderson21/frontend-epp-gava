import getAuthHeaders from "./getAuthHeaders";
import { useEffect, useState, useCallback } from "react";
import { redirectToLoginPreservingURL } from "../auth-redirect";

interface ApiResponse<T> {
  statusCode?: number;
  message?: string;
  data?: T;
}

export function useFetch<T>(url: string, extraDeps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!url) {
        if (active) {
          setData(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(url, { headers: getAuthHeaders() });

        if (res.status === 401) {
          redirectToLoginPreservingURL();
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        const hasJsonBody = contentType.includes("application/json");
        const json: ApiResponse<T> | null = hasJsonBody
          ? await res.json()
          : null;

        if (!active) return;

        const statusCode = typeof json?.statusCode === "number" ? json.statusCode : res.status;

        if (statusCode === 401) {
          redirectToLoginPreservingURL();
          return;
        }

        if (statusCode >= 200 && statusCode < 300) {
          const responseData = json && "data" in json ? json.data : (json as T | null);
          setData((responseData ?? null) as T | null);
          setError(null);
        } else {
          const message = json?.message || res.statusText || "Error en la solicitud";
          setError(message);
          setData(null);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [url, refetchTrigger, ...extraDeps]);

  // Permite actualizar los datos localmente sin re-fetch
  const updateData = useCallback((updater: T | ((prev: T | null) => T | null)) => {
    if (typeof updater === 'function') {
      setData(updater as (prev: T | null) => T | null);
    } else {
      setData(updater);
    }
  }, []);

  return { data, loading, error, setData: updateData, refetch };
}
