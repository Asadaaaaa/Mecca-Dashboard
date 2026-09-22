import { apiClient } from "@/services/api-client"
import type {
  Quotation,
  QuotationMetrics,
  QuotationQueryParams,
  QuotationListResponse,
  QuotationFormData,
} from "@/types/quotation.types"

export const quotationService = {
  async getQuotations(params: QuotationQueryParams = {}): Promise<QuotationListResponse> {
    const res = await apiClient.get("/quotations", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getQuotationMetrics(): Promise<QuotationMetrics> {
    const res = await apiClient.get("/quotations/metrics")
    return res.data?.data || {
      totalQuotations: 0,
      approvedCount: 0,
      pendingCount: 0,
      pipelineValue: 0,
      winRate: 0,
    }
  },

  async getQuotationById(id: number): Promise<Quotation> {
    const res = await apiClient.get(`/quotations/${id}`)
    return res.data?.data
  },

  async createQuotation(data: QuotationFormData): Promise<Quotation> {
    const res = await apiClient.post("/quotations", data)
    return res.data?.data
  },

  async updateQuotation(id: number, data: Partial<QuotationFormData>): Promise<Quotation> {
    const res = await apiClient.put(`/quotations/${id}`, data)
    return res.data?.data
  },

  async approveQuotation(id: number): Promise<Quotation> {
    const res = await apiClient.post(`/quotations/${id}/approve`)
    return res.data?.data
  },

  async rejectQuotation(id: number): Promise<Quotation> {
    const res = await apiClient.post(`/quotations/${id}/reject`)
    return res.data?.data
  },

  async convertToSalesOrder(id: number): Promise<any> {
    const res = await apiClient.post(`/quotations/${id}/convert-to-so`)
    return res.data?.data
  },

  async deleteQuotation(id: number): Promise<void> {
    await apiClient.delete(`/quotations/${id}`)
  },

  async batchDeleteQuotations(ids: number[]): Promise<any> {
    const res = await apiClient.post("/quotations/batch-delete", { ids })
    return res.data?.data
  },
}
