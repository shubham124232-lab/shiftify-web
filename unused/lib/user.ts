// User types — mirrors the backend API response shapes exactly.
// Key distinction:
//   • SessionUser   = compact shape from /auth/login + /auth/switch-role
//   • AppUser       = full shape from /users/me (Prisma fields) + activeRole injected from JWT

export type UserRole =
  | "PARTICIPANT"
  | "SUPPORT_WORKER"
  | "PROVIDER"
  | "COORDINATOR"
  | "PLAN_MANAGER"
  | "ADMIN";

export type UserStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type AdminTier  = "SUPER_ADMIN" | "REVIEWER";
export type AccountType = "SELF" | "MANAGED";

// Full UserRoleAssignment row as returned by /users/me
export interface UserRoleAssignment {
  id: string;
  userId: string;
  role: UserRole;
  isActiveDefault: boolean;
  createdAt: string;
}

// 1:1 address as returned by /users/me
export interface UserAddress {
  id: string;
  unitApartment: string | null;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  notes: string | null;
}

// Compact shape from /auth/login and /auth/switch-role responses.
export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  name: string;
  accountType: AccountType;
  status: UserStatus;
  adminTier: AdminTier | null;
  roles: UserRole[];      // flat array from publicUser()
  activeRole: UserRole;   // the role this token is scoped to
}

// Full user as returned by GET /users/me (Prisma shape), with activeRole
// injected from the JWT after the call.
export interface AppUser extends SessionUser {
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  defaultSuburb: string | null;
  defaultState: string | null;
  defaultPostcode: string | null;
  parentUserId: string | null;
  guestUntil: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;

  address: UserAddress | null;
  roleAssignments: UserRoleAssignment[];  // full objects (used for isActiveDefault)

  participantProfile: Record<string, unknown> | null;
  workerProfile: Record<string, unknown> | null;
  providerProfile: Record<string, unknown> | null;
  coordinatorProfile: Record<string, unknown> | null;
  planManagerProfile: Record<string, unknown> | null;

  documents: Array<{
    id: string;
    docType: string;
    fileName: string;
    status: string;
    expiryDate: string | null;
    uploadedAt: string;
  }>;
}

// Raw shape of /users/me before we inject activeRole from the JWT.
// The backend returns roles as UserRoleAssignment objects (not flat enums).
export interface RawMeUser extends Omit<AppUser, "activeRole" | "roles" | "roleAssignments"> {
  roles: UserRoleAssignment[];   // backend returns role-assignment objects here
  accountType: AccountType;
  username: string | null;
  phone: string | null;
}
