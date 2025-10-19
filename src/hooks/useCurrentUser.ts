import { useEffect, useState } from "react";
import { getAccessToken } from "../utils/auth";
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

  useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        setLoading(true);
        setError(null);
        const token = getAccessToken();
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const res = await fetch(`${userApi}me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const msg = `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const json: MeResponse = await res.json();
        if (mounted) setUser(json.data);
      } catch (e: any) {
        if (mounted) {
          setUser(null);
          setError(e?.message ?? 'Error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMe();
    return () => { mounted = false; };
  }, []);

  return { user, loading, error };
}
