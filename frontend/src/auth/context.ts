import { createContext, useContext } from "react";

import type { User } from "../api/types";

export interface AuthState {
  user: User | null;
  /** True until the initial "am I logged in?" check has resolved. */
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
