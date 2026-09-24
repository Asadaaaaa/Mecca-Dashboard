import { apiClient } from "@/services/api-client"
import type {
  DashboardMetrics,
  RecentTransaction,
  SalesTrendPoint,
  DashboardQueryParams,
} from "@/types/dashboard.types"

export const dashboardService = {
  async getDashboardMetrics(params: DashboardQueryParams = {}): Promise<DashboardMetrics> {
    const res = await apiClient.get("/dashboard/metrics", { params })
    return res.data?.data || {
      totalSales: 0,
      unpaidSales: 0,
      paidSales: 0,
      transactions: 0,
      growthRate: "+0%",
      unpaidRatio: "0%",
      paidRatio: "0%",
      transactionGrowth: "+0%",
    }
  },

  async getRecentTransactions(limit = 5): Promise<RecentTransaction[]> {
    const res = await apiClient.get("/dashboard/recent-transactions", { params: { limit } })
    return res.data?.data || []
  },

  async getSalesTrend(params: DashboardQueryParams = {}): Promise<SalesTrendPoint[]> {
    const res = await apiClient.get("/dashboard/sales-trend", { params })
    return res.data?.data || []
  },
}
