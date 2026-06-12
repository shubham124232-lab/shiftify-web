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
  ACTIVE    = 'ACTIVE',
  APPROVED  = 'APPROVED',
  REJECTED  = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  DRAFT     = 'DRAFT',
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
  accountType: AccountType;
  roles:       UserRole[];
  activeRole:  UserRole;
  status:      UserStatus;
  adminTier:   string | null;
  phoneVerified?: boolean;
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

// Step 1 response — credentials accepted, OTP sent.
export interface LoginPendingResponse {
  pendingToken:  string;
  maskedContact: string;
  channel:       string;
  _dev_code?:    string;
}

// Step 2 response — OTP confirmed, full session granted.
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
  subscription?: StoredSubscription;
  _dev_payment?: DevPayment;
}

export interface StoredSubscription {
  plan:        string;
  planLabel:   string;
  amount:      number;
  currency:    string;
  receipt:     string;
  activatedAt: string;
}
