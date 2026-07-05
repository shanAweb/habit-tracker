"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { AuthResponse, User } from "../lib/types";

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string, timezone: string, week_start: number) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string | undefined>;
  resetPassword: (token: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "habit_tracker_token";
const USER_KEY = "habit_tracker_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    const storedUser = localStorage.getItem(USER_KEY);
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setReady(true);
  }, []);

  const persist = useCallback((auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, auth.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    setToken(auth.access_token);
    setUser(auth.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      user,
      login: async (email, password) => persist(await api.login(email, password)),
      signup: async (name, email, password) =>
        persist(await api.signup(name, email, password)),
      logout,
      updateProfile: async (name, email, timezone, week_start) => {
        if (!token) return;
        const updated = await api.updateMe({ name, email, timezone, week_start }, token);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        setUser(updated);
      },
      changePassword: async (currentPassword, newPassword) => {
        if (!token) return;
        await api.changePassword(currentPassword, newPassword, token);
      },
      deleteAccount: async () => {
        if (!token) return;
        await api.deleteMe(token);
        logout();
      },
      forgotPassword: async (email) => {
        const response = await api.forgotPassword(email);
        return response.reset_token;
      },
      resetPassword: async (resetToken, password) => {
        await api.resetPassword(resetToken, password);
      },
    }),
    [logout, persist, ready, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
