"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
        setUser(JSON.parse(saved));
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
