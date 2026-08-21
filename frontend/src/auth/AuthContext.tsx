import { useEffect, useState, type ReactNode } from "react";

import { authApi } from "../api/tasks";
import type { User } from "../api/types";
import { AuthContext, type AuthState } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A 403 here simply means "not logged in" — it is not an error worth showing.
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value: AuthState = {
    user,
    loading,
    login: async (username, password) => setUser(await authApi.login(username, password)),
    logout: async () => {
      await authApi.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
