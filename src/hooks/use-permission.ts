import { authService } from "@/services/auth.service"

export function usePermission() {
  const user = authService.getUser()

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false

    // Superadmin and Admin have master privileges
    const isSuperadmin = user.roles?.some(
      (r) => r.name === "superadmin" || r.name === "admin"
    )
    if (isSuperadmin) return true

    // Check granular permissions assigned to user roles
    return Boolean(
      user.roles?.some((role) =>
        role.permissions?.some((p) => p.name === permissionName)
      )
    )
  }

  return {
    hasPermission,
    can: hasPermission,
    canDelete: (moduleName: string) => hasPermission(`${moduleName}.delete`),
    isSuperadmin: Boolean(
      user?.roles?.some((r) => r.name === "superadmin" || r.name === "admin")
    ),
    user,
  }
}
