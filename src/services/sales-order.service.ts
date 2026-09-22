import { apiClient } from "@/services/api-client"
import type {
  SalesOrder,
  SalesOrderMetrics,
  SalesOrderQueryParams,
  SalesOrderListResponse,
  SalesOrderFormData,
} from "@/types/sales-order.types"

export const salesOrderService = {
  async getSalesOrders(params: SalesOrderQueryParams = {}): Promise<SalesOrderListResponse> {
    const res = await apiClient.get("/sales-orders", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getSalesOrderMetrics(): Promise<SalesOrderMetrics> {
    const res = await apiClient.get("/sales-orders/metrics")
    return res.data?.data || {
      totalOrders: 0,
      completedDeliveries: 0,
      inDeliveryProcess: 0,
      readyToShip: 0,
      totalAmount: 0,
    }
  },

  async getSalesOrderById(id: number): Promise<SalesOrder> {
    const res = await apiClient.get(`/sales-orders/${id}`)
    return res.data?.data
  },

  async createSalesOrder(data: SalesOrderFormData): Promise<SalesOrder> {
    const res = await apiClient.post("/sales-orders", data)
    return res.data?.data
  },

  async updateSalesOrder(id: number, data: Partial<SalesOrderFormData>): Promise<SalesOrder> {
    const res = await apiClient.put(`/sales-orders/${id}`, data)
    return res.data?.data
  },

  async confirmSalesOrder(id: number): Promise<SalesOrder> {
    const res = await apiClient.post(`/sales-orders/${id}/confirm`)
    return res.data?.data
  },

  async cancelSalesOrder(id: number): Promise<SalesOrder> {
    const res = await apiClient.post(`/sales-orders/${id}/cancel`)
    return res.data?.data
  },

  async deleteSalesOrder(id: number): Promise<void> {
    await apiClient.delete(`/sales-orders/${id}`)
  },

  async batchDeleteSalesOrders(ids: number[]): Promise<any> {
    const res = await apiClient.post("/sales-orders/batch-delete", { ids })
    return res.data?.data
  },
}
