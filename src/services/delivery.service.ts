import { apiClient } from "@/services/api-client"
import type {
  Delivery,
  DeliveryMetrics,
  DeliveryQueryParams,
  DeliveryListResponse,
  DeliveryFormData,
} from "@/types/delivery.types"

export const deliveryService = {
  async getDeliveries(params: DeliveryQueryParams = {}): Promise<DeliveryListResponse> {
    const res = await apiClient.get("/deliveries", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getDeliveryMetrics(): Promise<DeliveryMetrics> {
    const res = await apiClient.get("/deliveries/metrics")
    return res.data?.data || {
      totalDeliveries: 0,
      deliveredCount: 0,
      inTransitCount: 0,
      readyCount: 0,
      onTimeRate: 0,
    }
  },

  async getDeliveryById(id: number): Promise<Delivery> {
    const res = await apiClient.get(`/deliveries/${id}`)
    return res.data?.data
  },

  async createDelivery(data: DeliveryFormData): Promise<Delivery> {
    const res = await apiClient.post("/deliveries", data)
    return res.data?.data
  },

  async confirmDelivery(id: number): Promise<Delivery> {
    const res = await apiClient.post(`/deliveries/${id}/confirm`)
    return res.data?.data
  },

  async completeDelivery(id: number): Promise<Delivery> {
    const res = await apiClient.post(`/deliveries/${id}/complete`)
    return res.data?.data
  },

  async deleteDelivery(id: number): Promise<void> {
    await apiClient.delete(`/deliveries/${id}`)
  },

  async batchDeleteDeliveries(ids: number[]): Promise<any> {
    const res = await apiClient.post("/deliveries/batch-delete", { ids })
    return res.data?.data
  },
}
