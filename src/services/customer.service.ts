import { apiClient } from "@/services/api-client"
import type {
  Customer,
  CustomerMetrics,
  CustomerQueryParams,
  CustomerListResponse,
  CustomerFormData,
} from "@/types/customer.types"

export const customerService = {
  async getCustomers(params: CustomerQueryParams = {}): Promise<CustomerListResponse> {
    const res = await apiClient.get("/customers", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getCustomerMetrics(): Promise<CustomerMetrics> {
    const res = await apiClient.get("/customers/metrics")
    return res.data?.data || {
      totalCustomers: 0,
      newThisMonth: 0,
      returningCustomers: 0,
      retentionRate: 0,
      biggestSpender: { name: "-", spend: 0, initials: "-" },
      outstandingDebt: 0,
      customersWithDebt: 0,
    }
  },

  async getCustomerById(id: number): Promise<Customer> {
    const res = await apiClient.get(`/customers/${id}`)
    return res.data?.data
  },

  async createCustomer(data: CustomerFormData): Promise<Customer> {
    const res = await apiClient.post("/customers", data)
    return res.data?.data
  },

  async updateCustomer(id: number, data: Partial<CustomerFormData>): Promise<Customer> {
    const res = await apiClient.put(`/customers/${id}`, data)
    return res.data?.data
  },

  async deleteCustomer(id: number): Promise<void> {
    await apiClient.delete(`/customers/${id}`)
  },

  async batchDeleteCustomers(ids: number[]): Promise<{ deletedCount: number }> {
    const res = await apiClient.post("/customers/batch-delete", { ids })
    return res.data?.data
  },
}
