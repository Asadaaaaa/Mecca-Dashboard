export interface DashboardMetrics {
  totalSales: number
  unpaidSales: number
  paidSales: number
  transactions: number
  growthRate: string
  unpaidRatio: string
  paidRatio: string
  transactionGrowth: string
}

export interface RecentTransaction {
  type: "invoice" | "payment" | "order"
  code: string
  customer: string
  title: string
  action: string
  amount: number
  status: string
  date: string
  created_at: string
}

export interface SalesTrendPoint {
  date: string
  label: string
  sales: number
  paid: number
}

export interface DashboardQueryParams {
  start_date?: string
  end_date?: string
}
