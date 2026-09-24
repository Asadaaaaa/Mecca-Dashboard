import { apiClient } from "@/services/api-client"
import type {
  Invoice,
  InvoiceMetrics,
  InvoiceQueryParams,
  InvoiceListResponse,
  InvoiceFormData,
} from "@/types/invoice.types"

export const invoiceService = {
  async getInvoices(params: InvoiceQueryParams = {}): Promise<InvoiceListResponse> {
    const res = await apiClient.get("/invoices", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getInvoiceMetrics(): Promise<InvoiceMetrics> {
    const res = await apiClient.get("/invoices/metrics")
    return res.data?.data || {
      totalInvoices: 0,
      totalReceivables: 0,
      paidTotal: 0,
      unpaidCount: 0,
      partiallyPaidCount: 0,
      paidCount: 0,
      overdueCount: 0,
    }
  },

  async getInvoiceById(id: number): Promise<Invoice> {
    const res = await apiClient.get(`/invoices/${id}`)
    return res.data?.data
  },

  async createInvoice(data: InvoiceFormData): Promise<Invoice> {
    const res = await apiClient.post("/invoices", data)
    return res.data?.data
  },

  async updateInvoice(id: number, data: Partial<InvoiceFormData>): Promise<Invoice> {
    const res = await apiClient.put(`/invoices/${id}`, data)
    return res.data?.data
  },

  async deleteInvoice(id: number): Promise<void> {
    await apiClient.delete(`/invoices/${id}`)
  },

  async batchDeleteInvoices(ids: number[]): Promise<any> {
    const res = await apiClient.post("/invoices/batch-delete", { ids })
    return res.data?.data
  },
}
