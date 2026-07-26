"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getApiBaseUrl } from "@/utils/api";

interface User {
  email: string;
  name?: string;
  phone?: string;
  isVrixPlusMember?: boolean;
  vrixPlusJoinedDate?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, details?: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix-user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);

        // Background sync with Supabase / DB backend
        if (parsed?.email) {
          const baseUrl = getApiBaseUrl();
          fetch(`${baseUrl}/auth/me?email=${encodeURIComponent(parsed.email)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && data.user) {
                const freshUser = {
                  email: data.user.email,
                  name: data.user.name || parsed.name,
                  phone: data.user.phone || parsed.phone,
                  isVrixPlusMember: !!data.user.isVrixPlusMember,
                  vrixPlusJoinedDate: data.user.vrixPlusJoinedDate || parsed.vrixPlusJoinedDate,
                };
                setUser(freshUser);
                localStorage.setItem("vrix-user", JSON.stringify(freshUser));
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to parse saved user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((email: string, details?: Partial<User>) => {
    const userData = { email, ...details };
    setUser(userData);
    localStorage.setItem("vrix-user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("vrix-user");
  }, []);

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
