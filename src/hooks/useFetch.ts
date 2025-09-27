import getAuthHeaders from "./getAuthHeaders";

import { useEffect, useState } from "react";

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
        const res = await fetch(url, {
          headers: getAuthHeaders(),
        });
        const json: ApiResponse<T> = await res.json();

        if (!active) return;

        console.log("Fetch URL:", url, "Response:", json.data);

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
  }, [url, ...extraDeps]);  // 👈 el url siempre se incluye en deps

  return { data, loading, error };
}
