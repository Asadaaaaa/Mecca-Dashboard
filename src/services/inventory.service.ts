import { apiClient } from "@/services/api-client"
import type {
  StockItem,
  StockMetrics,
  StockQueryParams,
  StockAdjustmentFormData,
  StockMovement,
  OpnameItem,
  OpnameMetrics,
  OpnameQueryParams,
  OpnameFormData,
  WasteItem,
  WasteMetrics,
  WasteQueryParams,
  WasteFormData,
} from "@/types/inventory.types"

export const inventoryService = {
  // 1. Stocks
  async getStocks(params: StockQueryParams = {}): Promise<{ items: StockItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await apiClient.get("/inventory/stocks", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getStockMetrics(): Promise<StockMetrics> {
    const res = await apiClient.get("/inventory/stocks/metrics")
    return res.data?.data || {
      total_items: 0,
      total_physical_units: 0,
      critical_stock_count: 0,
      total_valuation: 0,
    }
  },

  async stockAdjustment(data: StockAdjustmentFormData): Promise<{ stock: any; movement: any }> {
    const res = await apiClient.post("/inventory/stocks/adjustment", data)
    return res.data?.data
  },

  async deleteStock(id: number): Promise<void> {
    await apiClient.delete(`/inventory/stocks/${id}`)
  },

  async batchDeleteStocks(ids: number[]): Promise<void> {
    await apiClient.post("/inventory/stocks/batch-delete", { ids })
  },

  // 2. Movements
  async getMovements(params: any = {}): Promise<{ count: number; rows: StockMovement[] }> {
    const res = await apiClient.get("/inventory/movements", { params })
    return res.data?.data || { count: 0, rows: [] }
  },

  // 3. Opnames
  async getOpnames(params: OpnameQueryParams = {}): Promise<{ items: OpnameItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await apiClient.get("/inventory/opnames", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getOpnameMetrics(): Promise<OpnameMetrics> {
    const res = await apiClient.get("/inventory/opnames/metrics")
    return res.data?.data || {
      total_opname: 0,
      approved_count: 0,
      pending_count: 0,
      accuracy_rate: 100,
    }
  },

  async getOpnameById(id: number): Promise<any> {
    const res = await apiClient.get(`/inventory/opnames/${id}`)
    return res.data?.data
  },

  async createOpname(data: OpnameFormData): Promise<any> {
    const res = await apiClient.post("/inventory/opnames", data)
    return res.data?.data
  },

  async approveOpname(id: number): Promise<any> {
    const res = await apiClient.post(`/inventory/opnames/${id}/approve`)
    return res.data?.data
  },

  // 4. Wastes
  async getWastes(params: WasteQueryParams = {}): Promise<{ items: WasteItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await apiClient.get("/inventory/wastes", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getWasteMetrics(): Promise<WasteMetrics> {
    const res = await apiClient.get("/inventory/wastes/metrics")
    return res.data?.data || {
      total_incidents: 0,
      total_units_wasted: 0,
      total_loss: 0,
      waste_rate: 0,
    }
  },

  async createWaste(data: WasteFormData): Promise<any> {
    const res = await apiClient.post("/inventory/wastes", data)
    return res.data?.data
  },

  async approveWaste(id: number): Promise<any> {
    const res = await apiClient.post(`/inventory/wastes/${id}/approve`)
    return res.data?.data
  },
}
