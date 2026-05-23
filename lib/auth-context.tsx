"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "./api";
import { setAccessToken, clearAccessToken, decodeAccessToken } from "./auth";
import type { AppUser, SessionUser, UserRole, RawMeUser, UserRoleAssignment } from "./types/user";

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  username?: string;
  defaultSuburb?: string;
  defaultState?: string;
  defaultPostcode?: string;
  address?: {
    unitApartment?: string | null;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    notes?: string | null;
  };
}

interface AuthContextValue {
  user: AppUser | null;
  status: "loading" | "authenticated" | "anonymous";
  refresh: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<SessionUser>;
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildAppUser(raw: RawMeUser): AppUser {
  const jwt = decodeAccessToken();
  const activeRole =
    (jwt?.activeRole as UserRole | undefined) ??
    (raw.roles[0]?.role ?? "PARTICIPANT");
  const roles: UserRole[] =
    (jwt?.roles as UserRole[] | undefined) ?? raw.roles.map((r) => r.role);

  return {
    ...raw,
    roleAssignments: raw.roles as UserRoleAssignment[],
    roles,
    activeRole,
    email: raw.email ?? null,
    phone: raw.phone ?? null,
    username: raw.username ?? null,
    accountType: raw.accountType ?? "SELF",
  } as AppUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "anonymous">("loading");

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: RawMeUser }>("/users/me");
      setUser(buildAppUser(data.user));
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<SessionUser> => {
      const data = await api<{ user: SessionUser; accessToken: string }>(
        "/auth/login",
        { method: "POST", body: { identifier, password }, auth: false },
      );
      setAccessToken(data.accessToken);
      await refresh();
      return data.user;
    },
    [refresh],
  );

  const switchRole = useCallback(async (role: UserRole): Promise<void> => {
    const data = await api<{ accessToken: string; activeRole: UserRole; roles: UserRole[] }>(
      "/auth/switch-role",
      { method: "POST", body: { role } },
    );
    setAccessToken(data.accessToken);
    setUser((prev) =>
      prev ? { ...prev, activeRole: data.activeRole, roles: data.roles } : null,
    );
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload): Promise<void> => {
    await api<{ user: RawMeUser }>("/users/me", { method: "PATCH", body: payload });
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST", auth: false });
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
    clearAccessToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, refresh, login, switchRole, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
