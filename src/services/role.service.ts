import { apiClient } from "@/services/api-client"
import type {
  Role,
  Permission,
  RoleMetrics,
  RoleFormData,
} from "@/types/settings.types"

export const roleService = {
  async getRoles(params: { search?: string } = {}): Promise<Role[]> {
    const res = await apiClient.get("/roles", { params })
    return res.data?.data || []
  },

  async getPermissions(): Promise<Permission[]> {
    const res = await apiClient.get("/permissions")
    return res.data?.data || []
  },

  async getRoleMetrics(): Promise<RoleMetrics> {
    const res = await apiClient.get("/roles/metrics")
    return res.data?.data || {
      total_roles: 0,
      total_permissions: 0,
      total_assigned_users: 0,
      superadmins: 0,
    }
  },

  async getRoleById(id: number): Promise<Role> {
    const res = await apiClient.get(`/roles/${id}`)
    return res.data?.data
  },

  async createRole(data: RoleFormData): Promise<Role> {
    const res = await apiClient.post("/roles", data)
    return res.data?.data
  },

  async updateRole(id: number, data: RoleFormData): Promise<Role> {
    const res = await apiClient.put(`/roles/${id}`, data)
    return res.data?.data
  },

  async deleteRole(id: number): Promise<void> {
    await apiClient.delete(`/roles/${id}`)
  },
}
