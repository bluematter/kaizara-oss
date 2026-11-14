import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * Role-Based Access Control (RBAC) utilities
 *
 * Role hierarchy:
 * - ADMIN: Full access - manage users, view audit logs, all features
 * - PROVIDER: Clinical access - patients, consultations, prescribing, labs
 * - STAFF: Operational access - patients (view), inventory, shipping
 */

// All possible permissions
export const ALL_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",
  "audit:read",
  "patients:read",
  "patients:write",
  "patients:delete",
  "consultations:read",
  "consultations:write",
  "labs:read",
  "labs:write",
  "inventory:read",
  "inventory:write",
  "shipping:read",
  "shipping:write",
  "settings:read",
  "settings:write",
  "financials:read",   // View revenue, costs, margins, profit
  "financials:write",  // Edit cost prices, financial settings
  "tasks:read",        // View tasks
  "tasks:write",       // Create/edit tasks
  // Chart Notes / Encounters
  "encounters:read",   // View encounters
  "encounters:write",  // Create/edit encounters
  "encounters:sign",   // Sign encounters (finalize)
  "encounters:cosign", // Co-sign encounters (supervising provider)
  "encounters:amend",  // Amend signed encounters (HIPAA)
  // Clinical data
  "clinical:read",     // View allergies, meds, dx, supplements
  "clinical:write",    // Edit allergies, meds, dx, supplements
  "injections:read",   // View injection records
  "injections:write",  // Administer/record injections
  "documents:read",    // View patient documents
  "documents:write",   // Upload patient documents
  "templates:read",    // View encounter templates
  "templates:write",   // Create/edit encounter templates
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// Define what each role can do
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  PROVIDER: [
    "patients:read",
    "patients:write",
    "consultations:read",
    "consultations:write",
    "labs:read",
    "labs:write",
    "inventory:read",
    "shipping:read",
    "tasks:read",
    "tasks:write",
    // Chart Notes / Encounters (full clinical access)
    "encounters:read",
    "encounters:write",
    "encounters:sign",
    "encounters:cosign",
    "encounters:amend",
    // Clinical data
    "clinical:read",
    "clinical:write",
    "injections:read",
    "injections:write",
    "documents:read",
    "documents:write",
    "templates:read",
    "templates:write",
  ],
  STAFF: [
    "patients:read",
    "inventory:read",
    "inventory:write",
    "shipping:read",
    "shipping:write",
    "tasks:read",
    "tasks:write",
    // Limited chart notes access (view only, can record vitals/injections under supervision)
    "encounters:read",
    "clinical:read",
    "injections:read",
    "injections:write",  // Staff can administer injections
    "documents:read",
    "documents:write",   // Staff can upload documents
    "templates:read",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role meets a minimum role level
 * Hierarchy: ADMIN > PROVIDER > STAFF
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 3,
    PROVIDER: 2,
    STAFF: 1,
  };
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Get the current user's role from session
 * Returns null if not authenticated
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  const session = await auth();
  if (!session?.user?.role) return null;
  return session.user.role as UserRole;
}

/**
 * Check if current user has a specific permission
 * For use in server components and API routes
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const role = await getCurrentRole();
  if (!role) return false;
  return hasPermission(role, permission);
}

/**
 * Check if current user meets minimum role requirement
 * For use in server components and API routes
 */
export async function checkMinimumRole(minimumRole: UserRole): Promise<boolean> {
  const role = await getCurrentRole();
  if (!role) return false;
  return hasMinimumRole(role, minimumRole);
}

/**
 * Require a permission - throws if not authorized
 * For use in API routes
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const hasAccess = await checkPermission(permission);
  if (!hasAccess) {
    throw new Error(`Forbidden: requires ${permission} permission`);
  }
}

/**
 * Require minimum role - throws if not authorized
 * For use in API routes
 */
export async function requireMinimumRole(minimumRole: UserRole): Promise<void> {
  const hasAccess = await checkMinimumRole(minimumRole);
  if (!hasAccess) {
    throw new Error(`Forbidden: requires ${minimumRole} role or higher`);
  }
}
