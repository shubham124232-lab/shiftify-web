// Shiftify shared TypeScript types — mirrors the Prisma schema.

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  PARTICIPANT    = 'PARTICIPANT',
  SUPPORT_WORKER = 'SUPPORT_WORKER',
  PROVIDER       = 'PROVIDER',
  COORDINATOR    = 'COORDINATOR',
  PLAN_MANAGER   = 'PLAN_MANAGER',
}

export enum AccountType {
  SELF    = 'SELF',
  MANAGED = 'MANAGED',
}

export enum UserStatus {
  PENDING   = 'PENDING',
  APPROVED  = 'APPROVED',
  ACTIVE    = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE  = 'INACTIVE',
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  sub:        string;
  activeRole: UserRole;
  roles:      UserRole[];
  status:     UserStatus;
  iat:        number;
  exp:        number;
}

export interface AuthTokens {
  accessToken: string;
  /** refreshToken arrives via HttpOnly cookie — never in JS */
}

// ─── User / Profile ───────────────────────────────────────────────────────────

export interface Profile {
  id:          string;
  userId:      string;
  firstName:   string;
  lastName:    string;
  displayName: string | null;
  avatarUrl:   string | null;
  bio:         string | null;
  phone:       string | null;
  ndisNumber:  string | null;
  abn:         string | null;
  suburb:      string | null;
  state:       string | null;
  postcode:    string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface User {
  id:          string;
  email:       string | null;
  phone:       string | null;
  username:    string | null;
  name:        string;
  avatarUrl?:   string | null;
  defaultSuburb?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  accountType: AccountType;
  roles:       UserRole[];
  activeRole:  UserRole;
  status:      UserStatus;
  adminTier:   string | null;
  profile?:    Profile | null;
  createdAt?:  string;
  updatedAt?:  string;
}

// ─── API response shape ───────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  data:    T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code:     string;
    message:  string;
    details?: unknown;
  };
}

// ─── Auth request/response payloads ──────────────────────────────────────────

export interface LoginPayload {
  identifier: string;   // email | phone | username
  password:   string;
  activeRole?: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user:        User;
  _dev_code?:  string;   // present in dev mode only
}

export interface RegisterPayload {
  role:      UserRole;
  name:      string;        // "First Last" — combined before sending
  email?:    string;
  phone?:    string;
  username?: string;
  password:  string;
}

export interface RegisterResponse {
  user:        User;
  accessToken: string;
  _dev_code?:  string;
}

export interface ForgotPasswordPayload {
  identifier: string;   // email or phone
}

export interface ForgotPasswordResponse {
  message:    string;
  _dev_code?: string;
}

export interface ResetPasswordPayload {
  token:       string;
  newPassword: string;
}

export interface SwitchRolePayload {
  role: UserRole;
}

export interface RefreshResponse {
  accessToken: string;
  activeRole:  UserRole;
  roles:       UserRole[];
}

export interface SwitchRoleResponse {
  accessToken: string;
  activeRole:  UserRole;
  roles:       UserRole[];
}

export interface DevPayment {
  plan:     string;
  amount:   number;
  currency: string;
  receipt:  string;
}

export interface ActivatePlanResponse {
  message:       string;
  status:        UserStatus;
  _dev_payment?: DevPayment;
}

// Stored in localStorage after a successful plan activation (dev mode)
export interface StoredSubscription extends DevPayment {
  activatedAt: string;   // ISO string
  planLabel:   string;   // human-readable name
}
