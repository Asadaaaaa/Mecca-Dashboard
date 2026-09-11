import { apiClient } from "@/services/api-client"
import type {
  User,
  UserMetrics,
  UserQueryParams,
  UserFormData,
} from "@/types/settings.types"

export const userService = {
  async getUsers(params: UserQueryParams = {}): Promise<{ items: User[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await apiClient.get("/users", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getUserMetrics(): Promise<UserMetrics> {
    const res = await apiClient.get("/users/metrics")
    return res.data?.data || {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      superadmin_count: 0,
    }
  },

  async getUserById(id: number): Promise<User> {
    const res = await apiClient.get(`/users/${id}`)
    return res.data?.data
  },

  async createUser(data: UserFormData): Promise<User> {
    const res = await apiClient.post("/users", data)
    return res.data?.data
  },

  async updateUser(id: number, data: UserFormData): Promise<User> {
    const res = await apiClient.put(`/users/${id}`, data)
    return res.data?.data
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
