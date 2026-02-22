/**
 * Role-Based Access Control (RBAC) Utility
 * Simplified: Everyone can access all pages, only staff management and clinic editing are restricted
 */

export type UserRole = "ADMIN" | "VET" | "RECEPTION" | "NURSE";

export interface Permission {
  // Staff management (only ADMIN)
  canInviteStaff: boolean;
  canAddStaff: boolean;
  canEditStaff: boolean;
  canDeleteStaff: boolean;

  // Clinic settings editing (only ADMIN)
  canEditClinicSettings: boolean;
}

/**
 * Get permissions for a given role
 */
export function getPermissions(role: UserRole): Permission {
  const isAdmin = role === "ADMIN";

  return {
    // Staff management - ADMIN only
    canInviteStaff: isAdmin,
    canAddStaff: isAdmin,
    canEditStaff: isAdmin,
    canDeleteStaff: isAdmin,

    // Clinic settings editing - ADMIN only
    canEditClinicSettings: isAdmin,
  };
}

/**
 * Check if role has permission for an action
 */
export function hasPermission(
  role: UserRole,
  permission: keyof Permission
): boolean {
  const permissions = getPermissions(role);
  return permissions[permission];
}