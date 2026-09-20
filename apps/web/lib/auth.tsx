"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

interface RoleAssignment {
  role: string;
  scopeType: string;
  scopeId: string | null;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  usn?: string | null;
  roles?: RoleAssignment[];
  clubMemberships?: { club: { id: string; slug: string; name: string }; role: string }[];
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, usn?: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("konvene_token") : null;
    if (stored) {
      setToken(stored);
      api<AuthUser>("/users/me", { token: stored })
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("konvene_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function applyToken(newToken: string) {
    localStorage.setItem("konvene_token", newToken);
    setToken(newToken);
    const me = await api<AuthUser>("/users/me", { token: newToken });
    setUser(me);
  }

  async function login(email: string, password: string) {
    const res = await api<{ token: string }>("/auth/login", { method: "POST", body: { email, password } });
    await applyToken(res.token);
  }

  async function signup(name: string, email: string, password: string, usn?: string) {
    const res = await api<{ token: string }>("/auth/signup", { method: "POST", body: { name, email, password, usn } });
    await applyToken(res.token);
  }

  function logout() {
    localStorage.removeItem("konvene_token");
    setToken(null);
    setUser(null);
  }

  function hasRole(role: string) {
    return !!user?.roles?.some((r) => r.role === role || r.role === "ADMIN" || r.role === "SUPER_ADMIN");
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
