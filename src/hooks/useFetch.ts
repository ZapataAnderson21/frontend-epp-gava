import getAuthHeaders from "./getAuthHeaders";
import { useEffect, useState, useCallback } from "react";
import { redirectToLoginPreservingURL } from "../auth-redirect";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export function useFetch<T>(url: string, extraDeps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(url, { headers: getAuthHeaders() });

        if (res.status === 401) {
          redirectToLoginPreservingURL();
          return;
        }

        const json: ApiResponse<T> = await res.json();
        if (!active) return;

        if (json.statusCode === 401) {
          redirectToLoginPreservingURL();
          return;
        }

        console.log(`Res for ${url}: `, json.data);

        if (json.statusCode === 200) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.message);
          setData(null);
        }
      } catch (err: any) {
        if (active) setError(err.message || "Error desconocido");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [url, ...extraDeps]);

  // Permite actualizar los datos localmente sin re-fetch
  const updateData = useCallback((updater: T | ((prev: T | null) => T | null)) => {
    if (typeof updater === 'function') {
      setData(updater as (prev: T | null) => T | null);
    } else {
      setData(updater);
    }
  }, []);

  return { data, loading, error, setData: updateData };
}
