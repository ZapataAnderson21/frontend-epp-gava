import getAuthHeaders from "./getAuthHeaders";
import { useState } from "react";
import { redirectToLoginPreservingURL } from "../auth-redirect";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export function useApiAction<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse<T> | null>(null);

  const execute = async (
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: object
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (res.status === 401) {
        redirectToLoginPreservingURL();
        throw new Error("Unauthorized");
      }

      const json: ApiResponse<T> = await res.json();
      setResponse(json);

      if (json.statusCode === 401) {
        redirectToLoginPreservingURL();
        throw new Error("Unauthorized");
      }

      if (json.statusCode < 200 || json.statusCode >= 300) {
        setError(json.message);
        throw new Error(json.message || "Error en la solicitud");
      }
      return json;
    } catch (err: any) {
      if (err?.message !== "Unauthorized") {
        setError(err.message || "Error desconocido");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, response };
}
