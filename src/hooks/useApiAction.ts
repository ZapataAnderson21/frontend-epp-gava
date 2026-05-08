import getAuthHeaders from "./getAuthHeaders";
import { useState } from "react";
import { redirectToLoginPreservingURL } from "../auth-redirect";
import formatApiErrorMessage from "../utils/apiErrorMessage";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

const shouldRedirectToLogin = (statusCode: number, message: string) => {
  if (statusCode !== 401) return false;

  const normalizedMessage = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return (
    normalizedMessage === "unauthorized" ||
    normalizedMessage.includes("token") ||
    normalizedMessage.includes("sesion") ||
    normalizedMessage.includes("sesión")
  );
};

export function useApiAction<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse<T> | null>(null);

  const execute = async (
    url: string,
    method: "POST" | "PUT" | "PATCH" | "DELETE",
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

      const contentType = res.headers.get("content-type") || "";
      const hasJsonBody = contentType.includes("application/json");
      const raw = hasJsonBody ? await res.json() : null;

      const statusCode =
        typeof raw?.statusCode === "number" ? raw.statusCode : res.status;
      const fallbackMessage = res.ok
        ? "Operaci\u00f3n completada correctamente"
        : res.statusText || "Error en la solicitud";
      const message = formatApiErrorMessage(raw?.message, fallbackMessage);
      const data = (raw && "data" in raw ? raw.data : raw) as T;

      const normalizedResponse: ApiResponse<T> = {
        statusCode,
        message,
        data,
      };

      setResponse(normalizedResponse);

      console.log("API Action Response:", normalizedResponse);

      if (
        shouldRedirectToLogin(
          normalizedResponse.statusCode,
          normalizedResponse.message
        )
      ) {
        redirectToLoginPreservingURL();
        throw new Error("Unauthorized");
      }

      if (normalizedResponse.statusCode < 200 || normalizedResponse.statusCode >= 300) {
        setError(normalizedResponse.message);
        throw new Error(normalizedResponse.message || "Error en la solicitud");
      }
      return normalizedResponse;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      if (message !== "Unauthorized") {
        setError(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, response };
}
