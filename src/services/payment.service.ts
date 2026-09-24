import { apiClient } from "@/services/api-client"
import type {
  Payment,
  PaymentMetrics,
  PaymentQueryParams,
  PaymentListResponse,
  PaymentFormData,
} from "@/types/payment.types"

export const paymentService = {
  async getPayments(params: PaymentQueryParams = {}): Promise<PaymentListResponse> {
    const res = await apiClient.get("/payments", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getPaymentMetrics(): Promise<PaymentMetrics> {
    const res = await apiClient.get("/payments/metrics")
    return res.data?.data || {
      totalSettled: 0,
      verifiedCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      topChannel: "-",
    }
  },

  async getPaymentById(id: number): Promise<Payment> {
    const res = await apiClient.get(`/payments/${id}`)
    return res.data?.data
  },

  async createPayment(data: PaymentFormData): Promise<Payment> {
    const res = await apiClient.post("/payments", data)
    return res.data?.data
  },

  async updatePayment(id: number, data: Partial<PaymentFormData>): Promise<Payment> {
    const res = await apiClient.put(`/payments/${id}`, data)
    return res.data?.data
  },

  async deletePayment(id: number): Promise<void> {
    await apiClient.delete(`/payments/${id}`)
  },

  async batchDeletePayments(ids: number[]): Promise<any> {
    const res = await apiClient.post("/payments/batch-delete", { ids })
    return res.data?.data
  },
}
