import { apiClient } from "@/services/api-client"
import type {
  Warehouse,
  WarehouseMetrics,
  WarehouseQueryParams,
  WarehouseFormData,
} from "@/types/settings.types"

export const warehouseService = {
  async getWarehouses(params: WarehouseQueryParams = {}): Promise<{ items: Warehouse[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await apiClient.get("/warehouses", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getWarehouseMetrics(): Promise<WarehouseMetrics> {
    const res = await apiClient.get("/warehouses/metrics")
    return res.data?.data || {
      total_warehouses: 0,
      active_warehouses: 0,
      inactive_warehouses: 0,
      total_pics: 0,
    }
  },

  async getWarehouseById(id: number): Promise<Warehouse> {
    const res = await apiClient.get(`/warehouses/${id}`)
    return res.data?.data
  },

  async createWarehouse(data: WarehouseFormData): Promise<Warehouse> {
    const res = await apiClient.post("/warehouses", data)
    return res.data?.data
  },

  async updateWarehouse(id: number, data: Partial<WarehouseFormData>): Promise<Warehouse> {
    const res = await apiClient.put(`/warehouses/${id}`, data)
    return res.data?.data
  },

  async deleteWarehouse(id: number): Promise<void> {
    await apiClient.delete(`/warehouses/${id}`)
  },
}
