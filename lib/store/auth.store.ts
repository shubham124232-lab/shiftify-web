import { create } from 'zustand';
import { api, setApiToken, setRefreshToken } from '@/lib/api';
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
import { clearGuestDraft } from '@/lib/store/guestJobDraft';

export const SUB_STORAGE_KEY = 'shiftify_sub';

// ─── Result of a /users/me refresh — handed back to callers so they can update
// their own local state (e.g. a completion bar) without firing a second fetch ──
export interface MeRefreshResult {
  profileCompletion:  number | null;
  completionMissing:  string[];
  profileStep:        number;
  phoneVerified:      boolean;
  marketplaceMissing: string[];
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user:               User | null;
  accessToken:        string | null;
  loading:            boolean;
  initialized:        boolean;  // true once /users/me has returned DB-accurate status
  error:              string | null;
  profileCompletion:  number | null;
  profileStep:        number;
  phoneVerified:      boolean;
  marketplaceMissing: string[];
  completionMissing:  string[];

  // Actions
  login:          (payload: LoginPayload)          => Promise<LoginResponse>;
  register:       (payload: RegisterPayload)        => Promise<RegisterResponse>;
  logout:         ()                               => Promise<void>;
  switchRole:     (role: UserRole)                 => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<ForgotPasswordResponse>;
  resetPassword:  (payload: ResetPasswordPayload)  => Promise<void>;
  updateProfile:  (data: Partial<User>)            => void;
  refreshGateStatus: ()                            => Promise<MeRefreshResult | null>;
  markPhoneVerified: ()                            => void;
  activatePlan:   (planId: string, addOnPlanIds?: string[]) => Promise<ActivatePlanResponse>;
  setTokens:      (accessToken: string, user: User) => void;
  silentInit:     ()                               => Promise<void>;
  clearError:     ()                               => void;
}

// ─── Dedup lock — prevents StrictMode double-invoke from firing two refreshes ──
let _initPromise: Promise<void> | null = null;

// ─── Ticket dispenser + "latest applied" tracker. Every refresh call claims
// an increasing ticket; a response only gets applied if its ticket is newer
// than whatever was last actually written to the store — NOT just newer than
// whichever call happened to be fired most recently. This means an earlier
// call's good data can't be thrown away just because a later call failed or
// is still pending, and nothing can get stuck waiting on one specific call
// to resolve. `markPhoneVerified` (below) also claims a ticket so a direct
// write can't be reverted by an older in-flight refresh landing afterward. ─
let _refreshSeq   = 0;
let _lastApplied  = 0;

// ─── JWT decoder (no library needed — just base64 the payload) ────────────────
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

// ─── Session storage key for persisting the access token across reloads ───────
const ACCESS_TOKEN_KEY = 'shiftify_access_token';

const USER_META_KEY = 'shiftify_user_meta';

// Edge-middleware "logged in" hint. Lifetime matches the 30-day refresh session
// (it slides forward every time the session is restored); it is only a hint —
// the API still authenticates every request.
const AUTH_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;
function setAuthCookie(): void {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `shiftify_is_auth=true; path=/; max-age=${AUTH_COOKIE_MAX_AGE_S}; SameSite=Lax${secure}`;
}

function saveAccessToken(token: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const claims = decodeJwt(token);
  const exp = typeof claims.exp === 'number' ? claims.exp * 1000 : Date.now() + 86400_000;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify({ token, exp }));
}

function saveUserMeta(profileCompletion: number | null, profileStep: number): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(USER_META_KEY, JSON.stringify({ profileCompletion, profileStep }));
}

function loadUserMeta(): { profileCompletion: number | null; profileStep: number } {
  if (typeof sessionStorage === 'undefined') return { profileCompletion: null, profileStep: 0 };
  try {
    const raw = sessionStorage.getItem(USER_META_KEY);
    if (!raw) return { profileCompletion: null, profileStep: 0 };
    return JSON.parse(raw) as { profileCompletion: number | null; profileStep: number };
  } catch {
    return { profileCompletion: null, profileStep: 0 };
  }
}

function loadAccessToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (!raw) return null;
    const { token, exp } = JSON.parse(raw) as { token: string; exp: number };
    // Treat as expired 60s early so we never hand out a token that expires mid-request
    if (Date.now() > exp - 60_000) {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function clearAccessToken(): void {
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyTokens(set: (partial: Partial<AuthState>) => void, get: () => AuthState, token: string, user: User, refreshToken?: string) {
  setApiToken(token);
  saveAccessToken(token);
  if (refreshToken) setRefreshToken(refreshToken);
  setAuthCookie();
  set({ accessToken: token, user, loading: false, error: null, initialized: false });
  refreshUserMe(set, get);
}

// /users/me runs in the background after login/register/refresh/profile-save —
// provides DB-accurate status and profile fields (phone, username, profileStep,
// completion, etc.). `initialized` flips true when this completes so pages can
// safely act on the real status/profileStep instead of stale JWT-derived defaults.
//
// Merges onto `get().user` (read at *resolution* time, not a snapshot passed in
// at call time) so a role switch or other update that lands while this request
// is in flight doesn't get reverted when the response arrives.
function refreshUserMe(set: (partial: Partial<AuthState>) => void, get: () => AuthState): Promise<MeRefreshResult | null> {
  const seq = ++_refreshSeq;
  return api.get<{ user: User; phoneVerified?: boolean; profileCompletion?: number; completionMissing?: string[]; profileStep?: number; marketplace?: { missing: string[] } }>('/users/me')
    .then(me => {
      if (seq <= _lastApplied) return null; // a newer response already landed — this one is stale, discard
      const current = get().user;
      if (!current) return null; // logged out while this was in flight — nothing to update
      _lastApplied = seq;
      const u = me.user;
      const result: MeRefreshResult = {
        profileCompletion:  me.profileCompletion  ?? null,
        completionMissing:  me.completionMissing  ?? [],
        profileStep:        me.profileStep        ?? 0,
        phoneVerified:      me.phoneVerified      ?? false,
        marketplaceMissing: me.marketplace?.missing ?? [],
      };
      set({
        user: {
          ...current,
          email:       u.email       ?? null,
          phone:       u.phone       ?? null,
          username:    u.username    ?? null,
          name:        u.name        ?? current.name,
          accountType: u.accountType ?? AccountType.SELF,
          status:      u.status,
          adminTier:   u.adminTier   ?? null,
        },
        profileCompletion:  result.profileCompletion,
        profileStep:        result.profileStep,
        phoneVerified:      result.phoneVerified,
        marketplaceMissing: result.marketplaceMissing,
        completionMissing:  result.completionMissing,
        initialized: true,
      });
      saveUserMeta(result.profileCompletion, result.profileStep);
      return result;
    })
    .catch(() => {
      // A failure never overwrites good data and never blocks an earlier
      // call's success from landing later (it doesn't touch _lastApplied).
      // It only ensures `initialized` eventually flips — harmless to set
      // more than once — so the app doesn't wait forever on a dead request.
      set({ initialized: true });
      return null;
    });
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user:               null,
  accessToken:        null,
  // Always start loading so server and client initial renders match (avoids
  // Next.js hydration mismatch). silentInit resolves this on mount.
  loading:            true,
  initialized:        false,
  profileCompletion:  null,
  profileStep:        0,
  phoneVerified:      false,
  marketplaceMissing: [],
  completionMissing:  [],
  error:              null,

  // ── login ──────────────────────────────────────────────────────────────────

  async login(payload) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<LoginResponse>('/auth/login', payload);
      applyTokens(set, get, data.accessToken, data.user, data.refreshToken);
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
      applyTokens(set, get, data.accessToken, data.user, data.refreshToken);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────────
  // State is cleared synchronously (before the first await) so the caller
  // can navigate immediately — the backend call is pure cleanup.

  async logout() {
    setApiToken(null);
    _initPromise = null;
    clearAccessToken();
    if (typeof window !== 'undefined') {
      document.cookie = 'shiftify_is_auth=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem(SUB_STORAGE_KEY);
      // A request saved on this device belongs to whoever was posting it — never to the next person to log in.
      clearGuestDraft();
    }
    set({ user: null, accessToken: null, loading: false, initialized: false, error: null, profileCompletion: null, profileStep: 0, phoneVerified: false, marketplaceMissing: [], completionMissing: [] });

    // Best-effort backend call — invalidates the HttpOnly refresh cookie.
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
  },

  // ── switchRole ─────────────────────────────────────────────────────────────

  async switchRole(role) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<SwitchRoleResponse>('/auth/switch-role', { role } as SwitchRolePayload);
      const current = get().user;
      if (!current) throw new Error('Not authenticated');
      setApiToken(data.accessToken);
      // Persist the re-scoped token: a reload restores the session from sessionStorage,
      // and without this it would come back as the previous role.
      saveAccessToken(data.accessToken);
      set({
        accessToken: data.accessToken,
        user: { ...current, activeRole: data.activeRole, roles: data.roles },
        loading: false,
        error: null,
      });
      // Profile completion / marketplace gates are per active role — re-read them.
      // Awaited so the destination dashboard never flashes the previous role's completion list.
      await refreshUserMe(set, get).catch(() => null);
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
      const data = await api.post<ForgotPasswordResponse>('/auth/password/forgot', payload);
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
      await api.post('/auth/password/reset', payload);
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

  // ── refreshGateStatus — re-fetch /users/me so profileCompletion/marketplaceMissing
  // reflect a just-saved profile. Without this, AppLayout's redirect gate keeps
  // reading pre-save values (set once at login/silentInit) and bounces the user
  // straight back to /profile even after they've finished it.
  refreshGateStatus() {
    if (!get().user) return Promise.resolve(null);
    return refreshUserMe(set, get);
  },

  // ── markPhoneVerified — called right after OTP confirmation succeeds.
  // Claims the newest ticket (see _refreshSeq/_lastApplied above) so an
  // older, still in-flight /users/me refresh can't resolve afterward and
  // silently revert this back to false.
  markPhoneVerified() {
    _lastApplied = ++_refreshSeq;
    set({ phoneVerified: true });
  },

  // ── activatePlan — calls /subscriptions/activate, updates status in store ──

  async activatePlan(planId: string, addOnPlanIds?: string[]) {
    set({ loading: true, error: null });
    try {
      const data = await api.post<ActivatePlanResponse>(
        '/subscriptions/activate',
        { planId, addOnPlanIds: addOnPlanIds ?? [] },
      );

      // Update status in store immediately — no need for a full refresh
      const current = get().user;
      if (current) {
        set({ user: { ...current, status: UserStatus.ACTIVE }, loading: false });
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
    applyTokens(set, get, accessToken, user);
  },

  // ── silentInit — call once on app mount to restore session ────────────────
  // Fast path: /auth/refresh + JWT decode → render immediately (loading: false).
  // Background: /users/me runs concurrently for DB-accurate status/profile data.
  // `initialized` flips true when /users/me completes so the layout can safely
  // fire the PENDING redirect only after the real status is confirmed.

  async silentInit() {
    if (get().accessToken) return;           // already hydrated in this tab

    // No auth cookie → definitely logged out, skip loading spinner entirely
    if (typeof document !== 'undefined' && !document.cookie.includes('shiftify_is_auth=true')) {
      set({ loading: false });
      return;
    }

    if (_initPromise) return _initPromise;   // already in-flight — wait on it

    _initPromise = (async () => {
      set({ loading: true });
      try {
        // ── Fast path: valid access token already in sessionStorage ────────────
        // Access tokens last 1 day — no need to call /auth/refresh on every reload.
        const stored = loadAccessToken();
        if (stored) {
          setApiToken(stored);
          const claims = decodeJwt(stored);
          const jwtUser: User = {
            id:          String(claims.sub ?? ''),
            email:       (claims.email as string) ?? null,
            phone:       null,
            username:    null,
            name:        (claims.name as string) ?? '',
            accountType: AccountType.SELF,
            status:      (claims.status as UserStatus) ?? UserStatus.PENDING,
            adminTier:   null,
            roles:       (claims.roles as UserRole[]) ?? [],
            activeRole:  (claims.activeRole as UserRole) ?? (claims.roles as UserRole[])?.[0],
          };
          const cached = loadUserMeta();
          set({ user: jwtUser, accessToken: stored, loading: false, error: null,
            profileCompletion: cached.profileCompletion,
            profileStep:       cached.profileStep });
          setAuthCookie();
          refreshUserMe(set, get);
          return;
        }

        // ── Slow path: token missing or expired → call /auth/refresh ──────────
        const refresh = await api.post<RefreshResponse>('/auth/refresh', {});
        setApiToken(refresh.accessToken);
        saveAccessToken(refresh.accessToken);

        // Decode JWT synchronously for immediate render — zero extra latency.
        const claims = decodeJwt(refresh.accessToken);
        const jwtUser: User = {
          id:          String(claims.sub ?? ''),
          email:       (claims.email as string) ?? null,
          phone:       null,
          username:    null,
          name:        (claims.name as string) ?? '',
          accountType: AccountType.SELF,
          status:      (claims.status as UserStatus) ?? UserStatus.PENDING,
          adminTier:   null,
          roles:       refresh.roles,
          activeRole:  refresh.activeRole,
        };

        setAuthCookie();

        // Render the dashboard immediately with JWT-derived user data.
        set({ user: jwtUser, accessToken: refresh.accessToken, loading: false, error: null });

        // The layout guards the PENDING redirect on `initialized`, so it won't
        // redirect based on stale JWT status until this call confirms the truth.
        refreshUserMe(set, get);

      } catch {
        setApiToken(null);
        clearAccessToken();
        if (typeof document !== 'undefined') {
          document.cookie = 'shiftify_is_auth=; path=/; max-age=0; SameSite=Lax';
        }
        set({ user: null, accessToken: null, loading: false, initialized: true });
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

export const selectUser           = (s: AuthState) => s.user;
export const selectIsAuth         = (s: AuthState) => !!s.user && !!s.accessToken;
export const selectUserStatus     = (s: AuthState) => s.user?.status ?? null;
export const selectIsPending      = (s: AuthState) => s.user?.status === UserStatus.PENDING;
export const selectNeedsPayment   = (s: AuthState) => s.user?.status === UserStatus.PENDING;
export const selectActiveRole     = (s: AuthState) => s.user?.activeRole ?? null;
export const selectInitialized    = (s: AuthState) => s.initialized;
export const selectProfileStep    = (s: AuthState) => s.profileStep;
export const selectPhoneVerified  = (s: AuthState) => s.phoneVerified;
export const selectMarketplaceMissing = (s: AuthState) => s.marketplaceMissing;
