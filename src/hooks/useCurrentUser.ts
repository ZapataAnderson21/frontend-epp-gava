import { useCallback, useEffect, useState } from "react";
import { userApi } from "../data/apiUrl";
import type { User } from "../data/types";

type MeResponse = {
  statusCode: number;
  message: string;
  data: User;
};

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${userApi}me`, {
          credentials: "include",
        });

        if (!res.ok) {
          const msg = `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const json: MeResponse = await res.json();
        if (mounted) setUser(json.data);

        console.log("Fetched current user:", json.data);

      } catch (e: unknown) {
        if (mounted) {
          setUser(null);
          setError(e instanceof Error ? e.message : "Error");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMe();
    return () => { mounted = false; };
  }, [refetchTrigger]);

  return { user, loading, error, refetch };
}
