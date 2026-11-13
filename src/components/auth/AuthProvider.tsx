"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: Role;
  tenantId?: string;
  tenantSlug?: string;
};
type AuthState = { user: AuthUser | null; loading: boolean; refresh: () => Promise<AuthUser | null> };
const AuthContext = createContext<AuthState>({ user: null, loading: true, refresh: async () => null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = await response.json();
      const nextUser = payload.authenticated ? payload.user as AuthUser : null;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <AuthContext.Provider value={{ user, loading, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
