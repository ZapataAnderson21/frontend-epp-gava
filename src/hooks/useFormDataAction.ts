import { useState } from "react";
import getAuthHeaders from "./getAuthHeaders";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export function useFormDataAction<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse<T> | null>(null);

  const execute = async (url: string, method: "POST" | "PATCH", formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = getAuthHeaders();
      // ❌ No seteamos Content-Type, el browser lo hace automáticamente para FormData
      const { ["Content-Type"]: _omit, ...headers } = authHeaders as Record<string, string>;

      const res = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      const json: ApiResponse<T> = await res.json();
      setResponse(json);

      if (json.statusCode < 200 || json.statusCode >= 300) {
        setError(json.message);
      }

      return json;
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, response };
}
