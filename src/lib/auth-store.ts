"use client";
// Zustand auth store — holds the in-memory user state decoded from the
// server response. Tokens themselves stay in httpOnly cookies.

import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  activeRole: string;
  roles: { role: string; isActiveDefault: boolean }[];
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
