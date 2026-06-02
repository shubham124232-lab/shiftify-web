import { create } from 'zustand';
import { api, setApiToken } from '@/lib/api';
import {
  User,
  UserRole,
  UserStatus,
  AccountType,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  SwitchRolePayload,
  RefreshResponse,
  SwitchRoleResponse,
  ActivatePlanResponse,
  StoredSubscription,
} from '@/lib/types';
import { getPlan } from '@/lib/constants/plans';

export const SUB_STORAGE_KEY = 'shiftify_sub';
export const PLAN_REQUIRED_ROLES = new Set<UserRole>([
  UserRole.SUPPORT_WORKER,
  UserRole.PROVIDER,
  UserRole.COORDINATOR,
  UserRole.PLAN_MANAGER,
]);

// ─── State shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user:        User | null;
  accessToken: string | null;
  loading:     boolean;
  error:       string | null;

  // Actions
  login:          (payload: LoginPayload)          => Promise<LoginResponse>;
  register:       (payload: RegisterPayload)        => Promise<RegisterResponse>;
  logout:         ()                               => Promise<void>;
  switchRole:     (role: UserRole)                 => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<ForgotPasswordResponse>;
  resetPassword:  (payload: ResetPasswordPayload)  => Promise<void>;
  updateProfile:  (data: Partial<User>)            => void;
  activatePlan:   (planId?: string)                => Promise<ActivatePlanResponse>;
  setTokens:      (accessToken: string, user: User) => void;
  silentInit:     ()                               => Promise<void>;
  clearError:     ()                               => void;
}

// ─── Dedup lock — prevents StrictMode double-invoke from firing two refreshes ──
let _initPromise: Promise<void> | null = null;

// ─── JWT decoder (no library needed — just base64 the payload) ────────────────
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyTokens(set: (partial: Partial<AuthState>) => void, token: string, user: User) {
  setApiToken(token);
  if (typeof document !== 'undefined') {
    document.cookie = 'shiftify_is_auth=true; path=/; SameSite=Lax';
  }
  set({ accessToken: token, user, loading: false, error: null });
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user:        null,
  accessToken: null,
  loading:     false,
  error:       null,

  // ── login ──────────────────────────────────────────────────────────────────

  async login(payload) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<LoginResponse>('/auth/login', payload);
      applyTokens(set, data.accessToken, data.user);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  // ── register ───────────────────────────────────────────────────────────────

  async register(payload) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<RegisterResponse>('/auth/register', payload);
      applyTokens(set, data.accessToken, data.user);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────────

  async logout() {
    setApiToken(null);
    if (typeof window !== 'undefined') {
      document.cookie = 'shiftify_is_auth=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem(SUB_STORAGE_KEY);
    }
    set({ user: null, accessToken: null, loading: false, error: null });
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort — clear local state regardless
    }
  },

  // ── switchRole ─────────────────────────────────────────────────────────────

  async switchRole(role) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<SwitchRoleResponse>('/auth/switch-role', { role } as SwitchRolePayload);
      const current = get().user;
      if (!current) throw new Error('Not authenticated');
      setApiToken(data.accessToken);
      set({
        accessToken: data.accessToken,
        user: { ...current, activeRole: data.activeRole, roles: data.roles },
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Role switch failed';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  // ── forgotPassword ─────────────────────────────────────────────────────────

  async forgotPassword(payload) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<ForgotPasswordResponse>('/auth/forgot-password', payload);
      set({ loading: false });
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  // ── resetPassword ──────────────────────────────────────────────────────────

  async resetPassword(payload) {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/reset-password', payload);
      set({ loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  // ── updateProfile ──────────────────────────────────────────────────────────

  updateProfile(data) {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...data } });
  },

  // ── activatePlan — calls /subscriptions/activate, updates status in store ──

  async activatePlan(planId?: string) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<ActivatePlanResponse>(
        '/subscriptions/activate',
        planId ? { planId } : {},
      );

      // Update status in store immediately — no need for a full refresh
      const current = get().user;
      if (current) {
        set({ user: { ...current, status: data.status }, loading: false });
      } else {
        set({ loading: false });
      }

      // Persist plan info for profile display (dev mode returns _dev_payment)
      if (typeof window !== 'undefined' && data._dev_payment && current) {
        const planConfig = planId ? getPlan(current.activeRole, data._dev_payment.plan) : undefined;
        const stored: StoredSubscription = {
          ...data._dev_payment,
          activatedAt: new Date().toISOString(),
          planLabel:   planConfig?.label ?? data._dev_payment.plan,
        };
        localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(stored));
      }

      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Activation failed';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  // ── setTokens — called after silent refresh ────────────────────────────────

  setTokens(accessToken, user) {
    applyTokens(set, accessToken, user);
  },

  // ── silentInit — call once on app mount to restore session ────────────────
  // Uses a module-level promise lock so StrictMode double-invoke shares one call.
  // Decodes the JWT locally — no extra /users/me round-trip on every page load.

  async silentInit() {
    if (get().accessToken) return;           // already hydrated

    if (_initPromise) return _initPromise;   // already in-flight — wait on it

    _initPromise = (async () => {
      set({ loading: true });
      try {
        const refresh = await api.post<RefreshResponse>('/auth/refresh', {});
        setApiToken(refresh.accessToken);

        // Decode JWT for base identity — avoids the heavy /users/me include chain
        const claims = decodeJwt(refresh.accessToken);

        const baseUser: User = {
          id:          (claims.sub as string) ?? '',
          email:       null,
          phone:       null,
          username:    null,
          name:        '',
          accountType: AccountType.SELF,
          status:      (claims.status as UserStatus) ?? UserStatus.ACTIVE,
          adminTier:   null,
          roles:       refresh.roles,
          activeRole:  refresh.activeRole,
        };
        const me = await api.get<{ user: Partial<User> & Record<string, unknown> }>('/users/me');
        const user: User = {
          ...baseUser,
          ...me.user,
          roles:      refresh.roles,
          activeRole: refresh.activeRole,
          status:     (me.user.status as UserStatus) ?? baseUser.status,
        };

        if (typeof document !== 'undefined') {
          document.cookie = 'shiftify_is_auth=true; path=/; SameSite=Lax';
        }
        set({ user, accessToken: refresh.accessToken, loading: false, error: null });
      } catch {
        setApiToken(null);
        if (typeof document !== 'undefined') {
          document.cookie = 'shiftify_is_auth=; path=/; max-age=0; SameSite=Lax';
        }
        set({ user: null, accessToken: null, loading: false });
      } finally {
        _initPromise = null;
      }
    })();

    return _initPromise;
  },

  // ── clearError ─────────────────────────────────────────────────────────────

  clearError() {
    set({ error: null });
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectUser        = (s: AuthState) => s.user;
export const selectIsAuth      = (s: AuthState) => !!s.user && !!s.accessToken;
export const selectActiveRole  = (s: AuthState) => s.user?.activeRole ?? null;
export const selectUserStatus  = (s: AuthState) => s.user?.status ?? null;
export const selectIsPending   = (s: AuthState) =>
  s.user?.status === UserStatus.PENDING;
export const selectNeedsPayment = (s: AuthState) =>
  s.user?.status === UserStatus.PENDING &&
  PLAN_REQUIRED_ROLES.has(s.user.activeRole);
